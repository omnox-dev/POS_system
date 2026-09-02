from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import crud, schemas, models
from ..services.inventory_engine import process_purchase_stock_in, process_wastage

router = APIRouter(prefix="/api/inventory", tags=["Inventory & Recipe Engine"])

@router.get("/items", response_model=List[schemas.InventoryItemResponse])
def get_inventory_items(db: Session = Depends(get_db)):
    """Fetch raw materials inventory items with stock status"""
    return crud.get_inventory_items(db=db)

@router.post("/items", response_model=schemas.InventoryItemResponse)
def add_inventory_item(item: schemas.InventoryItemCreate, db: Session = Depends(get_db)):
    """Add a new raw material ingredient to inventory"""
    return crud.create_inventory_item(db=db, item=item)

@router.get("/menu-items", response_model=List[schemas.MenuItemResponse])
def get_menu_items_with_recipes(db: Session = Depends(get_db)):
    """Fetch menu items along with their recipe mappings"""
    return crud.get_menu_items(db=db)

@router.post("/menu-items", response_model=schemas.MenuItemResponse)
def create_menu_item(item: schemas.MenuItemCreate, db: Session = Depends(get_db)):
    """Create menu item with associated raw material recipe"""
    return crud.create_menu_item(db=db, item=item)

@router.post("/recipes", response_model=schemas.RecipeResponse)
def add_recipe_ingredient(recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    """Link a raw material ingredient to a menu item recipe"""
    return crud.create_recipe(db=db, recipe=recipe)

@router.put("/recipes/{recipe_id}", response_model=schemas.RecipeResponse)
def update_recipe_ingredient(recipe_id: int, recipe_update: schemas.RecipeUpdate, db: Session = Depends(get_db)):
    """Update recipe required quantity, unit, or yield loss factor"""
    updated = crud.update_recipe(db=db, recipe_id=recipe_id, recipe_update=recipe_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Recipe mapping not found")
    return updated

@router.delete("/recipes/{recipe_id}")
def delete_recipe_ingredient(recipe_id: int, db: Session = Depends(get_db)):
    """Remove a recipe ingredient mapping from a menu item"""
    success = crud.delete_recipe(db=db, recipe_id=recipe_id)
    if not success:
        raise HTTPException(status_code=404, detail="Recipe mapping not found")
    return {"message": "Recipe mapping deleted successfully"}

@router.post("/purchase")
def add_purchase_stock(item_id: int, quantity: float, notes: str = None, db: Session = Depends(get_db)):
    """Record stock purchase / stock-in from supplier"""
    try:
        updated_item = process_purchase_stock_in(db=db, inventory_item_id=item_id, quantity=quantity, notes=notes)
        return {"message": "Stock successfully added", "item": schemas.InventoryItemResponse.model_validate(updated_item)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/wastage")
def record_stock_wastage(item_id: int, quantity: float, reason: str = None, db: Session = Depends(get_db)):
    """Record stock wastage or expiration"""
    try:
        updated_item = process_wastage(db=db, inventory_item_id=item_id, quantity=quantity, reason=reason)
        return {"message": "Wastage recorded", "item": schemas.InventoryItemResponse.model_validate(updated_item)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/transactions", response_model=List[schemas.StockTransactionResponse])
def get_stock_movement_logs(db: Session = Depends(get_db)):
    """Fetch complete stock movement audit trail log"""
    return crud.get_stock_transactions(db=db)

