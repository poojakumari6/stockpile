import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .database import Base, engine
from .routers import customers, dashboard, orders, products

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("iom")

settings = get_settings()

app = FastAPI(
    title="Inventory & Order Management API",
    description=(
        "Backend for a full-stack Inventory & Order Management System. "
        "Manages products, customers, orders and inventory tracking."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    # Create tables if they don't exist. For a larger project this would be a
    # migration tool (Alembic), but auto-create keeps the assessment simple.
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ensured.")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return a clean, consistent 422 body for invalid request data."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation failed", "errors": exc.errors()},
    )


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": "inventory-order-management"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}


app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)
