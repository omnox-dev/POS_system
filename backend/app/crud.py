from sqlalchemy.orm import Session
from . import models, schemas
from datetime import datetime

# User & Auth CRUD
def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_pin(db: Session, pin_code: str):
    return db.query(models.User).filter(models.User.pin_code == pin_code).first()

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(
        username=user.username,
        password_hash=user.password,  # Stored hash or simple hash
        role=user.role,
        pin_code=user.pin_code,
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Customer & Loyalty CRUD
def get_customer_by_phone(db: Session, phone: str):
    return db.query(models.Customer).filter(models.Customer.phone == phone).first()

def get_or_create_customer(db: Session, name: str, phone: str):
    customer = get_customer_by_phone(db, phone)
    if not customer:
        customer = models.Customer(name=name, phone=phone, loyalty_points=0.0, total_spent=0.0)
        db.add(customer)
        db.commit()
        db.refresh(customer)
    return customer

# Inventory CRUD
def get_inventory_items(db: Session):
    return db.query(models.InventoryItem).all()

def create_inventory_item(db: Session, item: schemas.InventoryItemCreate):
    status = "Low Stock" if item.current_stock <= item.min_stock else "Normal"
    db_item = models.InventoryItem(**item.model_dump(), status=status)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# Menu Item & Recipe CRUD
def get_menu_items(db: Session):
    items = db.query(models.MenuItem).all()
    # Enrich recipes with inventory item names
    for item in items:
        for recipe in item.recipes:
            inv = db.query(models.InventoryItem).filter(models.InventoryItem.id == recipe.inventory_item_id).first()
            if inv:
                recipe.inventory_item_name = inv.name
    return items

def create_menu_item(db: Session, item: schemas.MenuItemCreate):
    db_menu_item = models.MenuItem(
        name=item.name,
        category=item.category,
        price=item.price,
        description=item.description,
        is_available=item.is_available,
        image_url=item.image_url
    )
    db.add(db_menu_item)
    db.commit()
    db.refresh(db_menu_item)

    if item.recipes:
        for r in item.recipes:
            recipe = models.Recipe(
                menu_item_id=db_menu_item.id,
                inventory_item_id=r.inventory_item_id,
                quantity_required=r.quantity_required,
                unit=r.unit,
                yield_factor=getattr(r, 'yield_factor', 1.0)
            )
            db.add(recipe)
        db.commit()
        db.refresh(db_menu_item)

    return db_menu_item

def create_recipe(db: Session, recipe: schemas.RecipeCreate):
    db_recipe = models.Recipe(**recipe.model_dump())
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)
    inv = db.query(models.InventoryItem).filter(models.InventoryItem.id == db_recipe.inventory_item_id).first()
    if inv:
        db_recipe.inventory_item_name = inv.name
    return db_recipe

def update_recipe(db: Session, recipe_id: int, recipe_update: schemas.RecipeUpdate):
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not db_recipe:
        return None
    if recipe_update.quantity_required is not None:
        db_recipe.quantity_required = recipe_update.quantity_required
    if recipe_update.unit is not None:
        db_recipe.unit = recipe_update.unit
    if recipe_update.yield_factor is not None:
        db_recipe.yield_factor = recipe_update.yield_factor
    db.commit()
    db.refresh(db_recipe)
    inv = db.query(models.InventoryItem).filter(models.InventoryItem.id == db_recipe.inventory_item_id).first()
    if inv:
        db_recipe.inventory_item_name = inv.name
    return db_recipe

def delete_recipe(db: Session, recipe_id: int):
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not db_recipe:
        return False
    db.delete(db_recipe)
    db.commit()
    return True

# Tables CRUD
def get_tables(db: Session):
    return db.query(models.RestaurantTable).all()

def create_table(db: Session, table_number: str, capacity: int = 4):
    db_table = models.RestaurantTable(table_number=table_number, capacity=capacity)
    db.add(db_table)
    db.commit()
    db.refresh(db_table)
    return db_table

# Orders CRUD & Extensions
def get_orders(db: Session, status: str = None):
    query = db.query(models.Order)
    if status:
        query = query.filter(models.Order.status == status)
    return query.order_by(models.Order.created_at.desc()).all()

def create_order(db: Session, order_data: schemas.OrderCreate):
    # Check if dine-in table already has an active (unbilled) order
    if order_data.table_id:
        existing_order = db.query(models.Order).filter(
            models.Order.table_id == order_data.table_id,
            models.Order.status != models.OrderStatus.BILLED.value
        ).order_by(models.Order.created_at.desc()).first()

        if existing_order:
            # Table is currently occupied: append items to existing open bill!
            append_items_to_order(db, existing_order.id, order_data.items)
            db.refresh(existing_order)
            return existing_order

    order_count = db.query(models.Order).count() + 1
    order_number = f"ORD-#{5000 + order_count}"

    subtotal = 0.0
    order_items = []

    for item in order_data.items:
        menu_item = db.query(models.MenuItem).filter(models.MenuItem.id == item.menu_item_id).first()
        if menu_item:
            item_subtotal = menu_item.price * item.quantity
            subtotal += item_subtotal
            order_items.append(models.OrderItem(
                menu_item_id=menu_item.id,
                menu_item_name=menu_item.name,
                quantity=item.quantity,
                unit_price=menu_item.price,
                notes=item.notes
            ))

    db_order = models.Order(
        order_number=order_number,
        table_id=order_data.table_id,
        order_type=order_data.order_type,
        status=models.OrderStatus.KOT_SENT.value,  # Direct KOT dispatch on creation
        subtotal=subtotal,
        total_amount=subtotal,
        customer_name=order_data.customer_name,
        customer_phone=order_data.customer_phone,
        items=order_items
    )

    db.add(db_order)

    # Auto customer registration/lookup if phone provided
    if order_data.customer_phone:
        get_or_create_customer(db, order_data.customer_name or "Guest", order_data.customer_phone)

    # Update table status if dine in
    if order_data.table_id:
        table = db.query(models.RestaurantTable).filter(models.RestaurantTable.id == order_data.table_id).first()
        if table:
            table.status = models.TableStatus.OCCUPIED.value
            db.commit()
            table.current_order_id = db_order.id

    db.commit()
    db.refresh(db_order)
    return db_order


def append_items_to_order(db: Session, order_id: int, new_items: list[schemas.OrderItemCreate]):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        return None

    added_subtotal = 0.0
    for item in new_items:
        menu_item = db.query(models.MenuItem).filter(models.MenuItem.id == item.menu_item_id).first()
        if menu_item:
            item_subtotal = menu_item.price * item.quantity
            added_subtotal += item_subtotal
            order.items.append(models.OrderItem(
                menu_item_id=menu_item.id,
                menu_item_name=menu_item.name,
                quantity=item.quantity,
                unit_price=menu_item.price,
                notes=item.notes
            ))

    order.subtotal += added_subtotal
    order.total_amount += added_subtotal
    order.status = models.OrderStatus.KOT_SENT.value  # Re-trigger KOT status
    db.commit()
    db.refresh(order)
    return order

def transfer_order_table(db: Session, order_id: int, target_table_id: int):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        return None, "Order not found"

    old_table_id = order.table_id
    if old_table_id:
        old_table = db.query(models.RestaurantTable).filter(models.RestaurantTable.id == old_table_id).first()
        if old_table:
            old_table.status = models.TableStatus.AVAILABLE.value
            old_table.current_order_id = None

    target_table = db.query(models.RestaurantTable).filter(models.RestaurantTable.id == target_table_id).first()
    if not target_table:
        return None, "Target table not found"

    target_table.status = models.TableStatus.OCCUPIED.value
    target_table.current_order_id = order.id
    order.table_id = target_table.id

    db.commit()
    db.refresh(order)
    return order, "Success"

# Stock Movements Audit Log CRUD
def get_stock_transactions(db: Session):
    txs = db.query(models.StockTransaction).order_by(models.StockTransaction.timestamp.desc()).all()
    # Enrich with item names
    result = []
    for tx in txs:
        item = db.query(models.InventoryItem).filter(models.InventoryItem.id == tx.inventory_item_id).first()
        res = schemas.StockTransactionResponse.model_validate(tx)
        res.inventory_item_name = item.name if item else "Unknown"
        result.append(res)
    return result

