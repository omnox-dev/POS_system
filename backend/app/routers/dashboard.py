from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/dashboard", tags=["Executive Dashboard"])

@router.get("/metrics")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """Fetch high-level executive KPI metrics"""
    total_orders = db.query(models.Order).count()
    billed_orders = db.query(models.Order).filter(models.Order.status == models.OrderStatus.BILLED.value).all()
    
    total_revenue = sum(o.total_amount for o in billed_orders)
    aov = round(total_revenue / len(billed_orders), 2) if billed_orders else 0.0

    low_stock_count = db.query(models.InventoryItem).filter(
        models.InventoryItem.current_stock <= models.InventoryItem.min_stock
    ).count()

    occupied_tables = db.query(models.RestaurantTable).filter(
        models.RestaurantTable.status == models.TableStatus.OCCUPIED.value
    ).count()

    total_tables = db.query(models.RestaurantTable).count()

    # Payment mode breakdown
    payment_stats = {}
    for o in billed_orders:
        pm = o.payment_mode or "Unspecified"
        payment_stats[pm] = round(payment_stats.get(pm, 0.0) + o.total_amount, 2)

    # Order type breakdown
    order_type_stats = {}
    for o in billed_orders:
        ot = o.order_type
        order_type_stats[ot] = order_type_stats.get(ot, 0) + 1

    # Low stock items list
    low_stock_items = db.query(models.InventoryItem).filter(
        models.InventoryItem.current_stock <= models.InventoryItem.min_stock
    ).all()
    low_stock_list = [
        {
            "id": item.id,
            "name": item.name,
            "current_stock": item.current_stock,
            "min_stock": item.min_stock,
            "unit": item.unit
        }
        for item in low_stock_items
    ]

    return {
        "summary": {
            "total_revenue": round(total_revenue, 2),
            "total_orders": total_orders,
            "billed_orders_count": len(billed_orders),
            "average_order_value": aov,
            "low_stock_alerts_count": low_stock_count,
            "occupied_tables": occupied_tables,
            "total_tables": total_tables
        },
        "payment_breakdown": payment_stats,
        "order_type_breakdown": order_type_stats,
        "low_stock_items": low_stock_list
    }
