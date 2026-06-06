from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

DEFAULT_LOW_STOCK_THRESHOLD = 10


@router.get("/summary", response_model=schemas.DashboardSummary)
def dashboard_summary(
    low_stock_threshold: int = Query(DEFAULT_LOW_STOCK_THRESHOLD, ge=0),
    db: Session = Depends(get_db),
):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()

    low_stock = (
        db.query(models.Product)
        .filter(models.Product.quantity <= low_stock_threshold)
        .order_by(models.Product.quantity.asc())
        .all()
    )

    return schemas.DashboardSummary(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_threshold=low_stock_threshold,
        low_stock_products=low_stock,
    )
