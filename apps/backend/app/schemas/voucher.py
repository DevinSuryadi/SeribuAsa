"""
Voucher Schemas
Pydantic schemas for voucher-related requests and responses
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from enum import Enum


class VoucherStatusEnum(str, Enum):
    active = "active"
    redeemed = "redeemed"
    expired = "expired"
    cancelled = "cancelled"


# ============================================
# Voucher Schemas
# ============================================
class VoucherBase(BaseModel):
    """Base schema for voucher"""
    code: str = Field(..., min_length=5, max_length=50)
    balance: Decimal = Field(..., gt=0)
    expiry_date: date
    status: VoucherStatusEnum = Field(default=VoucherStatusEnum.active)


class VoucherCreate(VoucherBase):
    """Schema for creating voucher"""
    beneficiary_id: str
    donation_id: Optional[str] = None


class VoucherUpdate(BaseModel):
    """Schema for updating voucher"""
    balance: Optional[Decimal] = Field(None, gt=0)
    status: Optional[VoucherStatusEnum] = None
    expiry_date: Optional[date] = None


class VoucherResponse(VoucherBase):
    """Schema for voucher response"""
    id: str
    beneficiary_id: str
    donation_id: Optional[str] = None
    allocated_date: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class VoucherWithBalance(VoucherResponse):
    """Voucher response with balance info"""
    redeemed_amount: Decimal = Decimal(0)
    days_until_expiry: int = 0


# ============================================
# Voucher Balance Schemas
# ============================================
class VoucherBalanceResponse(BaseModel):
    """Schema for voucher balance response"""
    beneficiary_id: str
    total_balance: Decimal
    active_vouchers: List[VoucherResponse]
    expiring_soon: Dict[str, Any]


# ============================================
# Voucher Redemption Schemas
# ============================================
class VoucherRedemptionCreate(BaseModel):
    """Schema for creating voucher redemption"""
    voucher_codes: List[str] = Field(..., min_length=1)
    amount_to_redeem: Decimal = Field(..., gt=0)
    order_id: str


class VoucherRedemptionResponse(BaseModel):
    """Schema for voucher redemption response"""
    id: str
    voucher_id: str
    order_id: str
    amount: Decimal
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class VoucherRedemptionRequest(BaseModel):
    """Schema for voucher redemption request"""
    order_id: str
    voucher_codes: List[str]
    amount: Decimal


# ============================================
# Voucher Allocation Schemas
# ============================================
class VoucherAllocationCreate(BaseModel):
    """Schema for allocating vouchers"""
    donation_id: str
    beneficiary_id: str
    amount: Decimal
    duration_months: int = Field(default=1, ge=1, le=12)


class VoucherAllocationResponse(BaseModel):
    """Schema for voucher allocation response"""
    vouchers: List[VoucherResponse]
    total_allocated: Decimal
    beneficiary_id: str
    new_balance: Decimal


# ============================================
# Voucher Transaction History
# ============================================
class VoucherTransaction(BaseModel):
    """Schema for voucher transaction"""
    id: str
    type: str  # allocation, redemption
    amount: Decimal
    balance_after: Decimal
    source: str  # Donation ID or Order ID
    date: datetime
    description: str


class VoucherHistoryResponse(BaseModel):
    """Schema for voucher history response"""
    items: List[VoucherTransaction]
    total: int
    page: int
    page_size: int


# ============================================
# Query Parameters
# ============================================
class VoucherQueryParams(BaseModel):
    """Schema for voucher query parameters"""
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=100)
    status: Optional[VoucherStatusEnum] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
