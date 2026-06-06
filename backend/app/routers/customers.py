from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/customers", tags=["Customers"])


def _get_customer_or_404(db: Session, customer_id: int) -> models.Customer:
    customer = db.get(models.Customer, customer_id)
    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer {customer_id} not found",
        )
    return customer


@router.post(
    "",
    response_model=schemas.CustomerOut,
    status_code=status.HTTP_201_CREATED,
    responses={409: {"model": schemas.ErrorResponse}},
)
def create_customer(payload: schemas.CustomerCreate, db: Session = Depends(get_db)):
    exists = (
        db.query(models.Customer)
        .filter(models.Customer.email == payload.email)
        .first()
    )
    if exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email '{payload.email}' already exists",
        )
    customer = models.Customer(**payload.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("", response_model=list[schemas.CustomerOut])
def list_customers(db: Session = Depends(get_db)):
    return db.query(models.Customer).order_by(models.Customer.id).all()


@router.get(
    "/{customer_id}",
    response_model=schemas.CustomerOut,
    responses={404: {"model": schemas.ErrorResponse}},
)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    return _get_customer_or_404(db, customer_id)


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"model": schemas.ErrorResponse}},
)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = _get_customer_or_404(db, customer_id)
    # Orders for this customer are removed via cascade.
    db.delete(customer)
    db.commit()
    return None
