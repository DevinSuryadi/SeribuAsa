"""
Subscription Schemas
Pydantic models for subscription API requests and responses
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID


class SubscriptionStatus(str, Enum):
    active = "active"
    paused = "paused"
    cancelled = "cancelled"


class BillingStatus(str, Enum):
    pending = "pending"
    success = "success"
    failed = "failed"


# ============================================
# Subscription Plan Schemas
# ============================================
class SubscriptionPlanBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    currency: str = "IDR"
    frequency: str = "monthly"
    features: Optional[List[str]] = []


class SubscriptionPlanCreate(SubscriptionPlanBase):
    pass


class SubscriptionPlanResponse(SubscriptionPlanBase):
    id: UUID
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# ============================================
# Billing History Schemas
# ============================================
class BillingHistoryBase(BaseModel):
    amount: Decimal
    currency: str = "IDR"
    status: BillingStatus
    payment_method: Optional[str] = None
    billing_date: date


class BillingHistoryResponse(BillingHistoryBase):
    id: UUID
    subscription_id: UUID
    transaction_id: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================
# Subscription Schemas
# ============================================
class SubscriptionBase(BaseModel):
    plan_id: Optional[str] = None
    plan_name: str
    amount: Decimal
    currency: str = "IDR"
    frequency: str = "monthly"
    payment_method: str = "qris"


class SubscriptionCreate(BaseModel):
    plan_id: str
    payment_method: str = "qris"
    amount: Optional[Decimal] = None  # Will use plan price if not provided


class SubscriptionResponse(SubscriptionBase):
    id: UUID
    donor_id: UUID
    status: SubscriptionStatus
    next_billing_date: date
    started_at: datetime
    cancelled_at: Optional[datetime] = None
    paused_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class SubscriptionDetailResponse(SubscriptionResponse):
    billing_history: Optional[List[BillingHistoryResponse]] = []
    plan: Optional[SubscriptionPlanResponse] = None


# ============================================
# Request Schemas
# ============================================
class PauseSubscriptionRequest(BaseModel):
    reason: Optional[str] = None


class ResumeSubscriptionRequest(BaseModel):
    next_billing_date: Optional[date] = None


class CancelSubscriptionRequest(BaseModel):
    reason: Optional[str] = None


class UpgradeSubscriptionRequest(BaseModel):
    plan_id: str


class ChangePaymentMethodRequest(BaseModel):
    payment_method: str


# ============================================
# Response Schemas
# ============================================
class SubscriptionListResponse(BaseModel):
    subscriptions: List[SubscriptionResponse]
    total: int


class BillingHistoryListResponse(BaseModel):
    items: List[BillingHistoryResponse]
    total: int


class SubscriptionActionResponse(BaseModel):
    success: bool
    message: str
    subscription: Optional[SubscriptionResponse] = None


# ============================================
# Stats/Metrics
# ============================================
class SubscriptionStats(BaseModel):
    active_subscriptions: int
    paused_subscriptions: int
    cancelled_subscriptions: int
    total_billed: Decimal
