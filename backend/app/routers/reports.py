from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from .. import models
import csv
import io

router = APIRouter(prefix="/api/reports", tags=["Financial & Operational Reports"])

@router.get("/sales")
def get_sales_report(db: Session = Depends(get_db)):
    """
    Daily & Financial Sales Report.
    Calculates Gross Sales, Discounts, Taxes, Net Revenue, and Payment Methods.
    """
    billed_orders = db.query(models.Order).filter(models.Order.status == models.OrderStatus.BILLED.value).all()

    gross_subtotal = sum(o.subtotal for o in billed_orders)
    total_discounts = sum(o.discount_amount for o in billed_orders)
    total_tax = sum(o.tax_amount for o in billed_orders)
    net_revenue = sum(o.total_amount for o in billed_orders)
    total_orders = len(billed_orders)
    aov = round(net_revenue / total_orders, 2) if total_orders > 0 else 0.0

    payment_breakdown = {}
    for o in billed_orders:
        pm = o.payment_mode or "Cash"
        payment_breakdown[pm] = round(payment_breakdown.get(pm, 0.0) + o.total_amount, 2)

    return {
        "summary": {
            "total_billed_orders": total_orders,
            "gross_subtotal": round(gross_subtotal, 2),
            "total_discounts": round(total_discounts, 2),
            "total_tax_collected": round(total_tax, 2),
            "net_revenue": round(net_revenue, 2),
            "average_order_value": aov
        },
        "payment_breakdown": payment_breakdown
    }

@router.get("/top-dishes")
def get_top_dishes_report(db: Session = Depends(get_db)):
    """
    Top Selling Dishes Performance Report.
    Ranks items by quantity sold and revenue generated.
    """
    items = db.query(
        models.OrderItem.menu_item_name,
        func.sum(models.OrderItem.quantity).label("total_quantity"),
        func.sum(models.OrderItem.quantity * models.OrderItem.unit_price).label("total_revenue")
    ).group_by(models.OrderItem.menu_item_name).order_by(func.sum(models.OrderItem.quantity).desc()).all()

    report = [
        {
            "dish_name": item[0],
            "total_qty_sold": int(item[1]),
            "gross_revenue": round(float(item[2]), 2)
        }
        for item in items
    ]
    return report

@router.get("/stock-valuation")
def get_stock_valuation_report(db: Session = Depends(get_db)):
    """
    Stock Valuation & Wastage Financial Loss Report.
    Calculates total inventory monetary asset value and cumulative wastage loss.
    """
    inv_items = db.query(models.InventoryItem).all()
    total_asset_value = sum(i.current_stock * i.cost_price for i in inv_items)

    wastage_txs = db.query(models.StockTransaction).filter(
        models.StockTransaction.transaction_type == models.StockTransactionType.WASTAGE.value
    ).all()

    total_wastage_cost = 0.0
    wastage_details = []
    for tx in wastage_txs:
        inv = db.query(models.InventoryItem).filter(models.InventoryItem.id == tx.inventory_item_id).first()
        cost_unit = inv.cost_price if inv else 0.0
        loss_amt = abs(tx.quantity) * cost_unit
        total_wastage_cost += loss_amt
        wastage_details.append({
            "ingredient": inv.name if inv else "Unknown",
            "quantity_lost": abs(tx.quantity),
            "unit": inv.unit if inv else "",
            "cost_loss": round(loss_amt, 2),
            "notes": tx.notes,
            "timestamp": tx.timestamp.isoformat()
        })

    return {
        "total_stock_asset_value": round(total_asset_value, 2),
        "total_wastage_cost_loss": round(total_wastage_cost, 2),
        "wastage_details": wastage_details
    }

@router.get("/export-csv")
def export_sales_csv(db: Session = Depends(get_db)):
    """Generates downloadable CSV sales report for Excel & Accounting"""
    billed_orders = db.query(models.Order).filter(models.Order.status == models.OrderStatus.BILLED.value).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Order Number", "Date", "Order Type", "Subtotal", "Discount", "Tax", "Total Amount", "Payment Mode", "Customer Phone"])

    for o in billed_orders:
        writer.writerow([
            o.order_number,
            o.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            o.order_type,
            f"{o.subtotal:.2f}",
            f"{o.discount_amount:.2f}",
            f"{o.tax_amount:.2f}",
            f"{o.total_amount:.2f}",
            o.payment_mode or "Unspecified",
            o.customer_phone or "N/A"
        ])

    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=Sales_Report_RestaurantOS.csv"}
    )
