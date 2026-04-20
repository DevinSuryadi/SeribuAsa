"""
Subscription Models
- SubscriptionPlan: Available subscription plans
- Subscription: User subscriptions
- BillingHistory: Payment history for subscriptions
"""
from sqlalchemy import Column, String, DateTime, Date, Enum, Numeric, ForeignKey, Index, Uuid as UUID, JSON as JSONB
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from app.models.base import BaseModel


# Enum for subscription status
class SubscriptionStatusEnum(str, enum.Enum):
    active = "active"
    paused = "paused"
    cancelled = "cancelled"


# Enum for billing status
class BillingStatusEnum(str, enum.Enum):
    pending = "pending"
    success = "success"
    failed = "failed"


# ============================================
# SubscriptionPlan - Available subscription plans
# ============================================
class SubscriptionPlan(BaseModel):
    __tablename__ = "subscription_plans"
    
    # Plan details
    name = Column(String(255), nullable=False)
    description = Column(String(500))
    price = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), default="IDR")
    frequency = Column(String(20), default="monthly")  # weekly, monthly, yearly
    
    # Plan features (stored as JSON)
    features = Column(JSONB, default=list)
    
    # Plan status
    is_active = Column(String(10), default="true")  # "true" or "false"
    
    # Relationships
    subscriptions = relationship("Subscription", back_populates="plan")
    
    def __repr__(self):
        return f"<SubscriptionPlan {self.name} - {self.price}>"


# ============================================
# Subscription - User subscriptions
# ============================================
class Subscription(BaseModel):
    __tablename__ = "subscriptions"
    
    # Foreign keys
    donor_id = Column(UUID(as_uuid=True), ForeignKey("donor_profiles.user_id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("subscription_plans.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Subscription details
    plan_name = Column(String(255), nullable=False)  # Snapshot of plan name
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), default="IDR")
    frequency = Column(String(20), default="monthly")
    
    # Status
    status = Column(Enum(SubscriptionStatusEnum), nullable=False, default=SubscriptionStatusEnum.active, index=True)
    
    # Payment method
    payment_method = Column(String(50), default="qris")
    
    # Billing dates
    next_billing_date = Column(Date, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    cancelled_at = Column(DateTime, nullable=True)
    paused_at = Column(DateTime, nullable=True)
    
    # Metadata
    meta_data = Column(JSONB, default=dict)  # For additional config
    
    # Relationships
    donor_profile = relationship("DonorProfile", back_populates="subscriptions")
    plan = relationship("SubscriptionPlan", back_populates="subscriptions")
    billing_history = relationship("BillingHistory", back_populates="subscription", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Subscription {self.id} - {self.plan_name} ({self.status})>"
    
    def is_active_subscription(self) -> bool:
        """Check if subscription is currently active"""
        return self.status == SubscriptionStatusEnum.active
    
    def can_pause(self) -> bool:
        """Check if subscription can be paused"""
        return self.status == SubscriptionStatusEnum.active
    
    def can_resume(self) -> bool:
        """Check if subscription can be resumed"""
        return self.status == SubscriptionStatusEnum.paused
    
    def can_cancel(self) -> bool:
        """Check if subscription can be cancelled"""
        return self.status in [SubscriptionStatusEnum.active, SubscriptionStatusEnum.paused]
    
    def can_reactivate(self) -> bool:
        """Check if subscription can be reactivated"""
        return self.status == SubscriptionStatusEnum.cancelled


# ============================================
# BillingHistory - Payment history
# ============================================
class BillingHistory(BaseModel):
    __tablename__ = "billing_history"
    
    # Foreign key
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Billing details
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), default="IDR")
    status = Column(Enum(BillingStatusEnum), nullable=False, default=BillingStatusEnum.pending)
    
    # Payment method used
    payment_method = Column(String(50))
    
    # Transaction reference
    transaction_id = Column(String(255))
    
    # Billing period
    billing_date = Column(Date, nullable=False)
    
    # Relationships
    subscription = relationship("Subscription", back_populates="billing_history")
    
    def __repr__(self):
        return f"<BillingHistory {self.id} - {self.amount} ({self.status})>"


# ============================================
# Indexes for performance
# ============================================
Index("idx_subscription_donor_status", Subscription.donor_id, Subscription.status)
Index("idx_subscription_plan", Subscription.plan_id)
Index("idx_subscription_next_billing", Subscription.next_billing_date)
Index("idx_billing_history_subscription", BillingHistory.subscription_id)
Index("idx_billing_history_date", BillingHistory.billing_date)
