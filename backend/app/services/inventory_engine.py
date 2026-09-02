from sqlalchemy.orm import Session
from ..models import Order, OrderItem, Recipe, InventoryItem, StockTransaction, StockTransactionType, OrderStatus, TableStatus, RestaurantTable, Customer

def convert_units(recipe_unit: str, stock_unit: str, quantity: float) -> float:
    """
    Smart Unit Conversion Engine:
    Converts recipe quantities to target stock ingredient unit.
    """
    r_unit = recipe_unit.strip().lower()
    s_unit = stock_unit.strip().lower()

    if r_unit == s_unit:
        return quantity

    # Mass Conversions
    if r_unit in ["g", "gram", "grams"] and s_unit in ["kg", "kilogram", "kilograms"]:
        return quantity / 1000.0
    if r_unit in ["kg", "kilogram", "kilograms"] and s_unit in ["g", "gram", "grams"]:
        return quantity * 1000.0
    if r_unit in ["mg", "milligram"] and s_unit in ["kg", "kilogram"]:
        return quantity / 1000000.0
    if r_unit in ["mg", "milligram"] and s_unit in ["g", "gram"]:
        return quantity / 1000.0

    # Volume Conversions
    if r_unit in ["ml", "milliliter", "millilitre"] and s_unit in ["l", "litre", "liter"]:
        return quantity / 1000.0
    if r_unit in ["l", "litre", "liter"] and s_unit in ["ml", "milliliter"]:
        return quantity * 1000.0

    # Count Conversions
    if r_unit in ["pcs", "piece", "pieces"] and s_unit in ["dozen", "dozens"]:
        return quantity / 12.0
    if r_unit in ["dozen", "dozens"] and s_unit in ["pcs", "piece", "pieces"]:
        return quantity * 12.0

    # Fallback to direct quantity if unrecognized
    return quantity

def process_order_stock_deduction(db: Session, order: Order) -> dict:
    """
    Deducts raw materials from inventory based on recipe mapping for all items in a completed order.
    Utilizes Unit Conversion Engine and Yield Loss Factor multiplier.
    Updates Customer Loyalty points.
    """
    if order.status == OrderStatus.BILLED.value:
        # Prevent double deduction
        existing_tx = db.query(StockTransaction).filter(
            StockTransaction.reference_id == order.order_number,
            StockTransaction.transaction_type == StockTransactionType.SALE_DEDUCTION.value
        ).first()
        if existing_tx:
            return {"status": "skipped", "message": "Stock already deducted for this order"}

    deductions_summary = []

    for item in order.items:
        recipes = db.query(Recipe).filter(Recipe.menu_item_id == item.menu_item_id).all()
        for r in recipes:
            inv_item = db.query(InventoryItem).filter(InventoryItem.id == r.inventory_item_id).first()
            if inv_item:
                # Apply yield factor (e.g. 1.1 for 10% prep loss)
                yield_factor = getattr(r, 'yield_factor', 1.0) or 1.0
                raw_required = r.quantity_required * item.quantity * yield_factor

                # Convert recipe unit to stock unit
                converted_qty = convert_units(r.unit, inv_item.unit, raw_required)
                total_used = round(converted_qty, 4)

                # Update current stock
                inv_item.current_stock = round(inv_item.current_stock - total_used, 4)

                # Update low stock alert status
                if inv_item.current_stock <= inv_item.min_stock:
                    inv_item.status = "Low Stock"
                else:
                    inv_item.status = "Normal"

                # Log stock movement transaction
                tx = StockTransaction(
                    inventory_item_id=inv_item.id,
                    transaction_type=StockTransactionType.SALE_DEDUCTION.value,
                    quantity=-total_used,
                    reference_id=order.order_number,
                    notes=f"Auto deduction: {item.quantity}x {item.menu_item_name} ({r.quantity_required}{r.unit} x yield {yield_factor} -> {total_used} {inv_item.unit})"
                )
                db.add(tx)
                deductions_summary.append({
                    "ingredient": inv_item.name,
                    "used": total_used,
                    "unit": inv_item.unit,
                    "new_stock": inv_item.current_stock
                })

    # Customer Loyalty accrual (5% points back)
    if order.customer_phone:
        customer = db.query(Customer).filter(Customer.phone == order.customer_phone).first()
        if customer:
            points_earned = round(order.total_amount * 0.05, 2)
            customer.loyalty_points += points_earned
            customer.total_spent += order.total_amount
            order.loyalty_points_earned = points_earned

    # Free up table if dine-in
    if order.table_id:
        table = db.query(RestaurantTable).filter(RestaurantTable.id == order.table_id).first()
        if table:
            table.status = TableStatus.AVAILABLE.value
            table.current_order_id = None

    db.commit()
    return {"status": "success", "deductions": deductions_summary}

def process_purchase_stock_in(db: Session, inventory_item_id: int, quantity: float, notes: str = None) -> InventoryItem:
    inv_item = db.query(InventoryItem).filter(InventoryItem.id == inventory_item_id).first()
    if not inv_item:
        raise ValueError("Inventory item not found")

    inv_item.current_stock = round(inv_item.current_stock + quantity, 4)
    if inv_item.current_stock > inv_item.min_stock:
        inv_item.status = "Normal"

    tx = StockTransaction(
        inventory_item_id=inv_item.id,
        transaction_type=StockTransactionType.PURCHASE.value,
        quantity=quantity,
        reference_id=f"PURCHASE-{db.query(StockTransaction).count() + 101}",
        notes=notes or "Stock Purchase Entry"
    )
    db.add(tx)
    db.commit()
    db.refresh(inv_item)
    return inv_item

def process_wastage(db: Session, inventory_item_id: int, quantity: float, reason: str = None) -> InventoryItem:
    inv_item = db.query(InventoryItem).filter(InventoryItem.id == inventory_item_id).first()
    if not inv_item:
        raise ValueError("Inventory item not found")

    inv_item.current_stock = round(inv_item.current_stock - quantity, 4)
    if inv_item.current_stock <= inv_item.min_stock:
        inv_item.status = "Low Stock"

    tx = StockTransaction(
        inventory_item_id=inv_item.id,
        transaction_type=StockTransactionType.WASTAGE.value,
        quantity=-quantity,
        reference_id=f"WASTAGE-{db.query(StockTransaction).count() + 101}",
        notes=reason or "Wastage / Expired"
    )
    db.add(tx)
    db.commit()
    db.refresh(inv_item)
    return inv_item

