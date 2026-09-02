from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

# User & Auth Schemas
class UserBase(BaseModel):
    username: str
    role: str = "CASHIER"
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    pin_code: Optional[str] = None

class UserResponse(UserBase):
    id: int
    pin_code: Optional[str] = None

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    pin_code: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Customer & Loyalty Schemas
class CustomerBase(BaseModel):
    name: str
    phone: str

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    loyalty_points: float
    total_spent: float
    created_at: datetime

    class Config:
        from_attributes = True

# Inventory Schemas
class InventoryItemBase(BaseModel):
    name: str
    category: str
    unit: str
    current_stock: float
    min_stock: float
    cost_price: float

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    current_stock: Optional[float] = None
    min_stock: Optional[float] = None
    cost_price: Optional[float] = None

class InventoryItemResponse(InventoryItemBase):
    id: int
    status: str

    class Config:
        from_attributes = True

# Recipe Schemas
class RecipeBase(BaseModel):
    inventory_item_id: int
    quantity_required: float
    unit: str
    yield_factor: float = 1.0

class RecipeCreate(RecipeBase):
    menu_item_id: int

class RecipeUpdate(BaseModel):
    quantity_required: Optional[float] = None
    unit: Optional[str] = None
    yield_factor: Optional[float] = None

class RecipeResponse(RecipeBase):
    id: int
    menu_item_id: int
    inventory_item_name: Optional[str] = None

    class Config:
        from_attributes = True

# Menu Item Schemas
class MenuItemBase(BaseModel):
    name: str
    category: str
    price: float
    description: Optional[str] = None
    is_available: bool = True
    image_url: Optional[str] = None

class MenuItemCreate(MenuItemBase):
    recipes: Optional[List[RecipeBase]] = []

class MenuItemResponse(MenuItemBase):
    id: int
    recipes: List[RecipeResponse] = []

    class Config:
        from_attributes = True

# Table Schemas
class TableBase(BaseModel):
    table_number: str
    capacity: int = 4
    status: str = "AVAILABLE"

class TableResponse(TableBase):
    id: int
    current_order_id: Optional[int] = None

    class Config:
        from_attributes = True

# Order Item Schemas
class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int
    notes: Optional[str] = None

class OrderItemResponse(BaseModel):
    id: int
    menu_item_id: int
    menu_item_name: str
    quantity: int
    unit_price: float
    notes: Optional[str] = None

    class Config:
        from_attributes = True

# Order Extensions Schemas
class TableTransferRequest(BaseModel):
    target_table_id: int

class OrderItemAppendRequest(BaseModel):
    items: List[OrderItemCreate]

class ItemVoidRequest(BaseModel):
    order_item_id: int
    reason: Optional[str] = "Customer Cancellation"

class DigitalPaymentRequest(BaseModel):
    payment_provider: str = "UPI_QR"  # UPI_QR, CARD_TERMINAL, RAZORPAY_MOCK
    amount: float


class OrderCreate(BaseModel):
    table_id: Optional[int] = None
    order_type: str = "DINE_IN"
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    items: List[OrderItemCreate]

class OrderBilling(BaseModel):
    discount_amount: float = 0.0
    tax_percentage: float = 5.0  # e.g., GST 5%
    payment_mode: str  # Cash, Card, UPI, Digital Payment
    redeem_loyalty_points: float = 0.0

class OrderResponse(BaseModel):
    id: int
    order_number: str
    table_id: Optional[int] = None
    order_type: str
    status: str
    subtotal: float
    discount_amount: float
    tax_amount: float
    total_amount: float
    payment_mode: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    loyalty_points_earned: float = 0.0
    loyalty_points_redeemed: float = 0.0
    created_at: datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True

# Stock Transaction Schemas
class StockTransactionCreate(BaseModel):
    inventory_item_id: int
    transaction_type: str  # PURCHASE, WASTAGE, ADJUSTMENT, RETURN
    quantity: float
    notes: Optional[str] = None

class StockTransactionResponse(BaseModel):
    id: int
    inventory_item_id: int
    inventory_item_name: Optional[str] = None
    transaction_type: str
    quantity: float
    reference_id: Optional[str] = None
    notes: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

