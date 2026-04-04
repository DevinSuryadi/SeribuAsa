"""
Product Schemas
Pydantic schemas for product and category management
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID
from decimal import Decimal


# ============================================
# Category Schemas
# ============================================
class CategoryResponse(BaseModel):
    id: UUID
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    icon_url: Optional[str] = None
    display_order: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    icon_url: Optional[str] = Field(None, max_length=500)
    display_order: int = 0


# ============================================
# Product Schemas
# ============================================
class ProductResponse(BaseModel):
    id: UUID
    vendor_id: UUID
    category_id: Optional[UUID] = None
    name: str
    description: Optional[str] = None
    price: Decimal
    voucher_price: Decimal
    stock_quantity: int = 0
    unit: str = "pcs"
    images: Optional[List[Any]] = None
    approval_status: str = "pending"
    category_name: Optional[str] = None
    vendor_store_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    price: Decimal = Field(..., gt=0)
    voucher_price: Decimal = Field(..., gt=0)
    stock_quantity: int = Field(default=0, ge=0)
    unit: str = Field(default="pcs", max_length=50)

    def model_post_init(self, __context) -> None:
        if self.voucher_price > self.price:
            raise ValueError("voucher_price must not exceed price")


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    price: Optional[Decimal] = Field(None, gt=0)
    voucher_price: Optional[Decimal] = Field(None, gt=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    unit: Optional[str] = Field(None, max_length=50)


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ============================================
# Query Parameters
# ============================================
class ProductQueryParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    category_id: Optional[UUID] = None
    search: Optional[str] = None
    vendor_id: Optional[UUID] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    in_stock_only: bool = False
