from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, Enum
from sqlalchemy.orm import relationship
import enum
from .database import Base

class StockTransactionType(str, enum.Enum):
    PURCHASE = "PURCHASE"
    SALE_DEDUCTION = "SALE_DEDUCTION"
    WASTAGE = "WASTAGE"
    ADJUSTMENT = "ADJUSTMENT"
    RETURN = "RETURN"

class OrderStatus(str, enum.Enum):
    CREATED = "CREATED"
    KOT_SENT = "KOT_SENT"
    SERVED = "SERVED"
    BILLED = "BILLED"
    CANCELLED = "CANCELLED"

class OrderType(str, enum.Enum):
    DINE_IN = "DINE_IN"
    TAKEAWAY = "TAKEAWAY"
    DELIVERY = "DELIVERY"

class TableStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    RESERVED = "RESERVED"

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    CASHIER = "CASHIER"
    KITCHEN = "KITCHEN"
    KIOSK = "KIOSK"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default=UserRole.CASHIER.value)
    pin_code = Column(String(10), nullable=True)  # Quick 4-digit PIN for cashiers
    full_name = Column(String(100), nullable=True)

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    loyalty_points = Column(Float, default=0.0)
    total_spent = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    unit = Column(String(20), nullable=False)  # e.g., Kg, Litre, g, Pcs
    current_stock = Column(Float, default=0.0)
    min_stock = Column(Float, default=0.0)
    cost_price = Column(Float, default=0.0)
    status = Column(String(20), default="Normal")  # "Normal", "Low Stock"

    recipes = relationship("Recipe", back_populates="inventory_item")
    transactions = relationship("StockTransaction", back_populates="inventory_item")

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    price = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    is_available = Column(Boolean, default=True)
    image_url = Column(String(255), nullable=True)

    recipes = relationship("Recipe", back_populates="menu_item", cascade="all, delete-orphan")

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    quantity_required = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)  # e.g., g, Kg, ml, L, Pcs
    yield_factor = Column(Float, default=1.0)  # Waste / yield multiplier factor (e.g. 1.1 for 10% prep loss)

    menu_item = relationship("MenuItem", back_populates="recipes")
    inventory_item = relationship("InventoryItem", back_populates="recipes")

class RestaurantTable(Base):
    __tablename__ = "restaurant_tables"

    id = Column(Integer, primary_key=True, index=True)
    table_number = Column(String(20), unique=True, nullable=False)
    capacity = Column(Integer, default=4)
    status = Column(String(20), default=TableStatus.AVAILABLE.value)
    current_order_id = Column(Integer, nullable=True)

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, nullable=False)
    table_id = Column(Integer, ForeignKey("restaurant_tables.id"), nullable=True)
    order_type = Column(String(20), default=OrderType.DINE_IN.value)
    status = Column(String(20), default=OrderStatus.CREATED.value)
    subtotal = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    payment_mode = Column(String(20), nullable=True)  # Cash, Card, UPI, Digital Payment
    customer_name = Column(String(100), nullable=True)
    customer_phone = Column(String(20), nullable=True)
    loyalty_points_earned = Column(Float, default=0.0)
    loyalty_points_redeemed = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    menu_item_name = Column(String(100), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    notes = Column(String(255), nullable=True)

    order = relationship("Order", back_populates="items")

class StockTransaction(Base):
    __tablename__ = "stock_transactions"

    id = Column(Integer, primary_key=True, index=True)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    transaction_type = Column(String(30), nullable=False)  # Stock In, Sale Usage, Wastage, Adjustment
    quantity = Column(Float, nullable=False)  # + or -
    reference_id = Column(String(100), nullable=True)  # e.g., Order #5001 or Purchase #101
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    inventory_item = relationship("InventoryItem", back_populates="transactions")

