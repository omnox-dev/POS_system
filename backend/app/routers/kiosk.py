from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import crud, schemas, models

router = APIRouter(prefix="/api/kiosk", tags=["Kiosk"])

@router.get("/menu", response_model=List[schemas.MenuItemResponse])
def get_kiosk_menu(db: Session = Depends(get_db)):
    """Fetch available menu items for self-ordering kiosk"""
    items = db.query(models.MenuItem).filter(models.MenuItem.is_available == True).all()
    return items

@router.get("/tables", response_model=List[schemas.TableResponse])
def get_kiosk_tables(db: Session = Depends(get_db)):
    """Fetch active restaurant tables for dine-in selection"""
    return db.query(models.RestaurantTable).all()

@router.post("/orders", response_model=schemas.OrderResponse)
def place_kiosk_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    """Place a self-ordering kiosk order. Immediately dispatches KOT ticket."""
    if not order_data.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")
    return crud.create_order(db=db, order_data=order_data)
