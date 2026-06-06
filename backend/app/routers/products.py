from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/products", tags=["Products"])


def _get_product_or_404(db: Session, product_id: int) -> models.Product:
    product = db.get(models.Product, product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product {product_id} not found",
        )
    return product


@router.post(
    "",
    response_model=schemas.ProductOut,
    status_code=status.HTTP_201_CREATED,
    responses={409: {"model": schemas.ErrorResponse}},
)
def create_product(payload: schemas.ProductCreate, db: Session = Depends(get_db)):
    exists = db.query(models.Product).filter(models.Product.sku == payload.sku).first()
    if exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"SKU '{payload.sku}' already exists",
        )
    product = models.Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("", response_model=list[schemas.ProductOut])
def list_products(db: Session = Depends(get_db)):
    return db.query(models.Product).order_by(models.Product.id).all()


@router.get(
    "/{product_id}",
    response_model=schemas.ProductOut,
    responses={404: {"model": schemas.ErrorResponse}},
)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return _get_product_or_404(db, product_id)


@router.put(
    "/{product_id}",
    response_model=schemas.ProductOut,
    responses={404: {"model": schemas.ErrorResponse}, 409: {"model": schemas.ErrorResponse}},
)
def update_product(
    product_id: int, payload: schemas.ProductUpdate, db: Session = Depends(get_db)
):
    product = _get_product_or_404(db, product_id)
    data = payload.model_dump(exclude_unset=True)

    if "sku" in data and data["sku"] != product.sku:
        clash = (
            db.query(models.Product)
            .filter(models.Product.sku == data["sku"], models.Product.id != product_id)
            .first()
        )
        if clash:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"SKU '{data['sku']}' already exists",
            )

    for field, value in data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"model": schemas.ErrorResponse}, 409: {"model": schemas.ErrorResponse}},
)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = _get_product_or_404(db, product_id)
    if product.order_items:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a product that is referenced by existing orders",
        )
    db.delete(product)
    db.commit()
    return None
