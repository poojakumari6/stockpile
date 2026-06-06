from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/orders", tags=["Orders"])


def _load_order(db: Session, order_id: int) -> models.Order | None:
    return (
        db.query(models.Order)
        .options(
            selectinload(models.Order.customer),
            selectinload(models.Order.items).selectinload(models.OrderItem.product),
        )
        .filter(models.Order.id == order_id)
        .first()
    )


@router.post(
    "",
    response_model=schemas.OrderOut,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": schemas.ErrorResponse},
        404: {"model": schemas.ErrorResponse},
        409: {"model": schemas.ErrorResponse},
    },
)
def create_order(payload: schemas.OrderCreate, db: Session = Depends(get_db)):
    customer = db.get(models.Customer, payload.customer_id)
    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer {payload.customer_id} not found",
        )

    # Merge duplicate product lines so quantities are validated as a whole.
    merged: dict[int, int] = {}
    for item in payload.items:
        merged[item.product_id] = merged.get(item.product_id, 0) + item.quantity

    order = models.Order(customer_id=customer.id, total_amount=0)
    total = 0

    for product_id, qty in merged.items():
        product = db.get(models.Product, product_id)
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {product_id} not found",
            )
        if product.quantity < qty:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Insufficient stock for '{product.name}': "
                    f"requested {qty}, available {product.quantity}"
                ),
            )

        # Reduce stock and record the line at the current price.
        product.quantity -= qty
        line_total = product.price * qty
        total += line_total
        order.items.append(
            models.OrderItem(
                product_id=product.id,
                quantity=qty,
                unit_price=product.price,
            )
        )

    # Total is always computed by the backend, never trusted from the client.
    order.total_amount = total
    db.add(order)
    db.commit()

    return _load_order(db, order.id)


@router.get("", response_model=list[schemas.OrderOut])
def list_orders(db: Session = Depends(get_db)):
    return (
        db.query(models.Order)
        .options(
            selectinload(models.Order.customer),
            selectinload(models.Order.items).selectinload(models.OrderItem.product),
        )
        .order_by(models.Order.id.desc())
        .all()
    )


@router.get(
    "/{order_id}",
    response_model=schemas.OrderOut,
    responses={404: {"model": schemas.ErrorResponse}},
)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = _load_order(db, order_id)
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found",
        )
    return order


@router.delete(
    "/{order_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"model": schemas.ErrorResponse}},
)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = (
        db.query(models.Order)
        .options(selectinload(models.Order.items))
        .filter(models.Order.id == order_id)
        .first()
    )
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found",
        )

    # Cancelling an order returns the reserved stock to inventory.
    for item in order.items:
        product = db.get(models.Product, item.product_id)
        if product is not None:
            product.quantity += item.quantity

    db.delete(order)
    db.commit()
    return None
