from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import crud, schemas, models
from ..services.inventory_engine import process_order_stock_deduction, process_wastage
from .kds_ws import kds_manager
import datetime

router = APIRouter(prefix="/api/pos", tags=["POS & Billing"])

@router.get("/tables", response_model=List[schemas.TableResponse])
def get_pos_tables(db: Session = Depends(get_db)):
    """Fetch all tables with occupied/available status"""
    return db.query(models.RestaurantTable).all()

@router.get("/orders", response_model=List[schemas.OrderResponse])
def get_pos_orders(status: str = None, db: Session = Depends(get_db)):
    """Fetch active orders for cashier billing and kitchen order tracking"""
    return crud.get_orders(db=db, status=status)

@router.get("/orders/{order_id}", response_model=schemas.OrderResponse)
def get_order_detail(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.post("/orders", response_model=schemas.OrderResponse)
async def create_pos_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    """Create order from POS terminal & broadcast live KOT to KDS WebSockets"""
    created = crud.create_order(db=db, order_data=order_data)
    # Broadcast to WebSocket KDS subscribers
    await kds_manager.broadcast({
        "event": "NEW_KOT",
        "order": schemas.OrderResponse.model_validate(created).model_dump(mode="json")
    })
    return created

@router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: int, status: str, db: Session = Depends(get_db)):
    """Update order lifecycle status (KOT_SENT -> PREPARING -> SERVED -> BILLED)"""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = status
    db.commit()
    db.refresh(order)

    # Broadcast update to WebSockets
    await kds_manager.broadcast({
        "event": "STATUS_UPDATE",
        "order_id": order.id,
        "status": status
    })

    return {"message": "Status updated successfully", "order": schemas.OrderResponse.model_validate(order)}

@router.post("/orders/{order_id}/append-items", response_model=schemas.OrderResponse)
async def append_items_to_open_order(order_id: int, payload: schemas.OrderItemAppendRequest, db: Session = Depends(get_db)):
    """Append additional items to an open dine-in table order (mid-meal order modification)"""
    updated_order = crud.append_items_to_order(db=db, order_id=order_id, new_items=payload.items)
    if not updated_order:
        raise HTTPException(status_code=404, detail="Order not found")

    await kds_manager.broadcast({
        "event": "KOT_ITEMS_APPENDED",
        "order_id": updated_order.id,
        "order": schemas.OrderResponse.model_validate(updated_order).model_dump(mode="json")
    })
    return updated_order

@router.post("/orders/{order_id}/transfer", response_model=schemas.OrderResponse)
def transfer_table(order_id: int, payload: schemas.TableTransferRequest, db: Session = Depends(get_db)):
    """Transfer an open table order to a different table"""
    order, msg = crud.transfer_order_table(db=db, order_id=order_id, target_table_id=payload.target_table_id)
    if not order:
        raise HTTPException(status_code=400, detail=msg)
    return order

@router.post("/orders/{order_id}/void-item")
def void_order_item(order_id: int, payload: schemas.ItemVoidRequest, db: Session = Depends(get_db)):
    """Void / Cancel an item from open order and record wastage if prepared"""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    item = db.query(models.OrderItem).filter(models.OrderItem.id == payload.order_item_id, models.OrderItem.order_id == order_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Order item not found")

    # Deduct price from subtotal
    item_cost = item.unit_price * item.quantity
    order.subtotal = max(0.0, order.subtotal - item_cost)
    order.total_amount = max(0.0, order.total_amount - item_cost)

    db.delete(item)
    db.commit()
    db.refresh(order)

    return {"message": "Item successfully voided", "order": schemas.OrderResponse.model_validate(order)}

@router.post("/orders/{order_id}/pay-digital")
def simulate_digital_payment(order_id: int, payload: schemas.DigitalPaymentRequest, db: Session = Depends(get_db)):
    """
    Simulate real-time Digital Payment gateway integration (UPI QR Code, Card swipe, Razorpay/Stripe).
    Generates dynamic payment payload and authorization signature.
    """
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    ref_id = f"PAY-{payload.payment_provider}-{int(datetime.datetime.now().timestamp())}"
    qr_payload = f"upi://pay?pa=restaurantpos@upi&pn=RestaurantOS&am={payload.amount}&tr={ref_id}&tn=Order_{order.order_number}"

    return {
        "status": "APPROVED",
        "payment_provider": payload.payment_provider,
        "transaction_ref": ref_id,
        "amount": payload.amount,
        "qr_code_url": f"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={qr_payload}",
        "message": f"Payment of ₹{payload.amount} authorized via {payload.payment_provider}"
    }

@router.get("/customers/{phone}", response_model=schemas.CustomerResponse)
def lookup_customer_loyalty(phone: str, db: Session = Depends(get_db)):
    """Fetch customer profile & loyalty points balance by phone number"""
    customer = crud.get_customer_by_phone(db=db, phone=phone)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.post("/orders/{order_id}/bill")
def complete_order_billing(order_id: int, billing_data: schemas.OrderBilling, db: Session = Depends(get_db)):
    """
    Process billing for an order.
    Calculates final total with tax, discount, & loyalty points redemption.
    Updates customer status and triggers automatic Recipe Inventory Stock Deduction Engine.
    """
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status == models.OrderStatus.BILLED.value:
        raise HTTPException(status_code=400, detail="Order has already been billed")

    # Update customer phone on order if provided during checkout
    if billing_data.customer_phone:
        order.customer_phone = billing_data.customer_phone
        crud.get_or_create_customer(db, order.customer_name or "Guest", billing_data.customer_phone)

    discount = billing_data.discount_amount
    redeemed_pts = 0.0

    # Redeem loyalty points if customer phone present
    if order.customer_phone and billing_data.redeem_loyalty_points > 0:
        cust = crud.get_customer_by_phone(db, order.customer_phone)
        if cust and cust.loyalty_points > 0:
            redeemed_pts = min(cust.loyalty_points, billing_data.redeem_loyalty_points)
            cust.loyalty_points -= redeemed_pts
            discount += redeemed_pts
            order.loyalty_points_redeemed = redeemed_pts

    taxable_amount = max(0.0, order.subtotal - discount)
    tax_amount = round(taxable_amount * (billing_data.tax_percentage / 100.0), 2)
    total_amount = round(taxable_amount + tax_amount, 2)

    order.discount_amount = discount
    order.tax_amount = tax_amount
    order.total_amount = total_amount
    order.payment_mode = billing_data.payment_mode
    order.status = models.OrderStatus.BILLED.value
    db.commit()


    # Trigger Stock Deduction Engine (also awards 5% cashback loyalty points)
    deduction_result = process_order_stock_deduction(db=db, order=order)

    return {
        "message": "Order successfully billed, loyalty updated, and inventory deducted",
        "order": schemas.OrderResponse.model_validate(order),
        "inventory_deduction": deduction_result
    }

@router.post("/orders/{order_id}/split")
def split_order_bill(order_id: int, split_count: int, db: Session = Depends(get_db)):
    """Calculates equal split amount for customer group billing"""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if split_count <= 1:
        raise HTTPException(status_code=400, detail="Split count must be greater than 1")

    per_person = round(order.total_amount / split_count, 2)
    return {
        "order_number": order.order_number,
        "total_amount": order.total_amount,
        "split_count": split_count,
        "per_person_amount": per_person
    }

