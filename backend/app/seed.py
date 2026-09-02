from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from . import models

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # 0. Seed Users (RBAC) if missing
    if not db.query(models.User).first():
        print("Seeding initial RBAC Users...")
        admin_user = models.User(username="admin", password_hash="admin123", role="ADMIN", pin_code="9999", full_name="System Administrator")
        cashier_user = models.User(username="cashier", password_hash="cashier123", role="CASHIER", pin_code="1234", full_name="Cashier Station 1")
        kitchen_user = models.User(username="kitchen", password_hash="kitchen123", role="KITCHEN", pin_code="5678", full_name="Master Chef Station")
        db.add_all([admin_user, cashier_user, kitchen_user])
        db.commit()

    # 0b. Seed Customer Loyalty if missing
    if not db.query(models.Customer).first():
        print("Seeding initial Customer Loyalty accounts...")
        cust1 = models.Customer(name="Rahul Sharma", phone="9876543210", loyalty_points=150.0, total_spent=3000.0)
        cust2 = models.Customer(name="Priya Patel", phone="9123456789", loyalty_points=50.0, total_spent=1000.0)
        db.add_all([cust1, cust2])
        db.commit()

    if db.query(models.InventoryItem).first():
        print("Database inventory already seeded.")
        db.close()
        return

    print("Seeding initial inventory, recipes, menu items, and tables...")


    # 1. Add Raw Materials to Inventory
    paneer = models.InventoryItem(name="Paneer", category="Dairy", unit="Kg", current_stock=10.0, min_stock=2.0, cost_price=250.0, status="Normal")
    butter = models.InventoryItem(name="Butter", category="Dairy", unit="Kg", current_stock=5.0, min_stock=1.0, cost_price=400.0, status="Normal")
    tomato = models.InventoryItem(name="Tomato", category="Produce", unit="Kg", current_stock=20.0, min_stock=5.0, cost_price=30.0, status="Normal")
    cream = models.InventoryItem(name="Cream", category="Dairy", unit="Litre", current_stock=10.0, min_stock=2.0, cost_price=200.0, status="Normal")
    spices = models.InventoryItem(name="Spices", category="Grocery", unit="Kg", current_stock=3.0, min_stock=0.5, cost_price=500.0, status="Normal")
    rice = models.InventoryItem(name="Basmati Rice", category="Grocery", unit="Kg", current_stock=15.0, min_stock=3.0, cost_price=100.0, status="Normal")
    chicken = models.InventoryItem(name="Chicken", category="Meat", unit="Kg", current_stock=12.0, min_stock=3.0, cost_price=220.0, status="Normal")

    db.add_all([paneer, butter, tomato, cream, spices, rice, chicken])
    db.commit()

    # 2. Add Menu Items
    pbm = models.MenuItem(name="Paneer Butter Masala", category="Main Course", price=320.0, description="Rich and creamy paneer gravy cooked in butter and tomatoes", is_available=True)
    naan = models.MenuItem(name="Butter Naan", category="Breads", price=50.0, description="Traditional tandoori naan brushed with fresh butter", is_available=True)
    biryani = models.MenuItem(name="Chicken Biryani", category="Main Course", price=380.0, description="Aromatic long-grain basmati rice layered with spiced chicken", is_available=True)
    lassi = models.MenuItem(name="Sweet Lassi", category="Beverages", price=90.0, description="Traditional chilled yoghurt drink", is_available=True)

    db.add_all([pbm, naan, biryani, lassi])
    db.commit()

    # 3. Create Recipes with Unit Conversion Units (e.g. 'g' & 'ml' required converting to 'Kg' & 'Litre' stock)
    r1 = models.Recipe(menu_item_id=pbm.id, inventory_item_id=paneer.id, quantity_required=200.0, unit="g", yield_factor=1.05)
    r2 = models.Recipe(menu_item_id=pbm.id, inventory_item_id=butter.id, quantity_required=30.0, unit="g", yield_factor=1.0)
    r3 = models.Recipe(menu_item_id=pbm.id, inventory_item_id=tomato.id, quantity_required=150.0, unit="g", yield_factor=1.1)
    r4 = models.Recipe(menu_item_id=pbm.id, inventory_item_id=cream.id, quantity_required=50.0, unit="ml", yield_factor=1.0)
    r5 = models.Recipe(menu_item_id=pbm.id, inventory_item_id=spices.id, quantity_required=10.0, unit="g", yield_factor=1.0)

    # Butter Naan recipe
    r6 = models.Recipe(menu_item_id=naan.id, inventory_item_id=butter.id, quantity_required=30.0, unit="g", yield_factor=1.0)

    # Chicken Biryani recipe
    r7 = models.Recipe(menu_item_id=biryani.id, inventory_item_id=chicken.id, quantity_required=250.0, unit="g", yield_factor=1.1)
    r8 = models.Recipe(menu_item_id=biryani.id, inventory_item_id=rice.id, quantity_required=200.0, unit="g", yield_factor=1.0)
    r9 = models.Recipe(menu_item_id=biryani.id, inventory_item_id=butter.id, quantity_required=20.0, unit="g", yield_factor=1.0)
    r10 = models.Recipe(menu_item_id=biryani.id, inventory_item_id=spices.id, quantity_required=15.0, unit="g", yield_factor=1.0)

    db.add_all([r1, r2, r3, r4, r5, r6, r7, r8, r9, r10])
    db.commit()

    # 4. Add Restaurant Tables
    tables = [
        models.RestaurantTable(table_number="Table 1", capacity=2),
        models.RestaurantTable(table_number="Table 2", capacity=4),
        models.RestaurantTable(table_number="Table 3", capacity=4),
        models.RestaurantTable(table_number="Table 4", capacity=6),
        models.RestaurantTable(table_number="Table 5", capacity=4),
        models.RestaurantTable(table_number="Table 6", capacity=8),
    ]
    db.add_all(tables)
    db.commit()

    # Initial Stock In transaction records
    txs = [
        models.StockTransaction(inventory_item_id=paneer.id, transaction_type="PURCHASE", quantity=10.0, reference_id="Purchase #101", notes="Initial Stock Opening"),
        models.StockTransaction(inventory_item_id=butter.id, transaction_type="PURCHASE", quantity=5.0, reference_id="Purchase #102", notes="Initial Stock Opening"),
        models.StockTransaction(inventory_item_id=tomato.id, transaction_type="PURCHASE", quantity=20.0, reference_id="Purchase #103", notes="Initial Stock Opening"),
        models.StockTransaction(inventory_item_id=cream.id, transaction_type="PURCHASE", quantity=10.0, reference_id="Purchase #104", notes="Initial Stock Opening"),
        models.StockTransaction(inventory_item_id=spices.id, transaction_type="PURCHASE", quantity=3.0, reference_id="Purchase #105", notes="Initial Stock Opening"),
    ]
    db.add_all(txs)
    db.commit()

    print("Database seeding completed successfully!")
    db.close()

if __name__ == "__main__":
    seed_database()

