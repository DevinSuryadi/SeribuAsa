"""
Donation Schemas
Pydantic schemas for donation-related requests and responses
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum
from decimal import Decimal
from uuid import UUID


class DonationTypeEnum(str, Enum):
    one_time = "one_time"
    subscription = "subscription"


class DonationStatusEnum(str, Enum):
    pending = "pending"
    success = "success"
    failed = "failed"
    refunded = "refunded"


class PaymentMethodEnum(str, Enum):
    midtrans = "midtrans"
    qris = "qris"
    bank_transfer = "bank_transfer"
    e_wallet = "e_wallet"


# ============================================
# Donation Schemas
# ============================================
class DonationBase(BaseModel):
    """Base schema for donation"""
    amount: Decimal = Field(..., gt=0, description="Donation amount (must be positive)")
    type: DonationTypeEnum = Field(default=DonationTypeEnum.one_time)
    payment_method: PaymentMethodEnum = Field(default=PaymentMethodEnum.midtrans)


class DonationCreate(DonationBase):
    """Schema for creating donation"""
    recipient_id: Optional[str] = None
    subscription_config: Optional[Dict[str, Any]] = None


class DonationUpdate(BaseModel):
    """Schema for updating donation"""
    amount: Optional[Decimal] = Field(None, gt=0)
    status: Optional[DonationStatusEnum] = None
    subscription_config: Optional[Dict[str, Any]] = None


class DonationResponse(DonationBase):
    """Schema for donation response"""
    id: UUID
    donor_id: UUID
    recipient_id: Optional[UUID] = None
    status: DonationStatusEnum
    midtrans_transaction_id: Optional[str] = None
    subscription_config: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class DonationWithImpact(DonationResponse):
    """Donation response with impact metrics"""
    recipient_name: Optional[str] = None
    children_helped: int = 0
    months_of_support: int = 0


# ============================================
# Donation List Response
# ============================================
class DonationListResponse(BaseModel):
    """Schema for paginated donation list"""
    items: List[DonationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ============================================
# Impact Metrics Schemas
# ============================================
class ImpactMetrics(BaseModel):
    """Schema for donor impact metrics"""
    donor_id: str
    total_donated: Decimal
    total_children_helped: int
    total_vouchers_allocated: int
    donation_trend: List[Dict[str, Any]]
    geographic_distribution: List[Dict[str, Any]]


# ============================================
# Dashboard Metrics Schema
# ============================================
class MonthlyStat(BaseModel):
    """Monthly statistics for dashboard"""
    vouchers_redeemed: int = 0
    children_received_nutrition: int = 0
    nutrition_score_improvement: float = 0.0
    top_category: str = "Pangan Umum"


class DashboardMetrics(BaseModel):
    """Schema for dashboard metrics endpoint"""
    total_donated: Decimal
    active_subscriptions: int
    children_helped: int
    conversion_rate: float
    monthly_stats: MonthlyStat
    
    model_config = ConfigDict(from_attributes=False)


# ============================================
# Payment Schemas
# ============================================
class PaymentRequest(BaseModel):
    """Schema for payment request"""
    donation_id: str
    payment_method: PaymentMethodEnum


class PaymentResponse(BaseModel):
    """Schema for payment response"""
    donation_id: str
    snap_token: Optional[str] = None
    redirect_url: Optional[str] = None
    payment_status: str
    message: str


# ============================================
# Query Parameters
# ============================================
class DonationQueryParams(BaseModel):
    """Schema for donation query parameters"""
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=100)
    status: Optional[DonationStatusEnum] = None
    type: Optional[DonationTypeEnum] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
