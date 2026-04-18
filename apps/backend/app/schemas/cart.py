"""
Cart Schemas
Pydantic schemas for cart management
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# ============================================
# Cart Item Schemas
# ============================================
class CartItemCreate(BaseModel):
    """Schema for adding item to cart"""
    product_id: str = Field(..., description="Product ID")
    quantity: int = Field(..., gt=0, le=100, description="Quantity (max 100)")


class CartItemUpdate(BaseModel):
    """Schema for updating cart item"""
    quantity: int = Field(..., gt=0, le=100, description="New quantity (max 100)")


class CartItemResponse(BaseModel):
    """Schema for cart item response"""
    id: str
    product_id: str
    product_name: str
    quantity: int
    price: Decimal
    subtotal: Decimal
    voucher_price: Decimal = Decimal(0)
    category_id: Optional[str] = None
    is_eligible: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================
# Cart Schemas
# ============================================
class CartResponse(BaseModel):
    """Schema for cart response"""
    beneficiary_id: str
    items: List[CartItemResponse]
    total_items: int
    total_amount: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================
# Cart Summary Schemas
# ============================================
class CartSummaryResponse(BaseModel):
    """Schema for cart summary with voucher eligibility"""
    beneficiary_id: str
    items: List[CartItemResponse]
    total_items: int
    total_amount: Decimal
    eligible_amount: Decimal
    ineligible_amount: Decimal
    voucher_balance: Decimal
    max_voucher_applicable: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================
# Stock Validation Schemas
# ============================================
class StockValidationRequest(BaseModel):
    """Request to validate stock for checkout"""
    product_ids: List[str] = Field(..., min_length=1)


class StockValidationResponse(BaseModel):
    """Response with stock validation results"""
    all_in_stock: bool
    unavailable_products: List[str]
    low_stock_products: List[str]
