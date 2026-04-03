"""
Donation and Voucher Models
- Donation: Donation records
- Voucher: Voucher definitions
- VoucherRedemption: Redemption tracking
"""
from sqlalchemy import Column, String, Text, Date, DateTime, Enum, Integer, Numeric, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
import enum
from datetime import datetime, timedelta
from app.models.base import BaseModel


# Enum for donation type
class DonationTypeEnum(str, enum.Enum):
    one_time = "one_time"
    subscription = "subscription"


# Enum for donation status
class DonationStatusEnum(str, enum.Enum):
    pending = "pending"
    success = "success"
    failed = "failed"
    refunded = "refunded"


# Enum for voucher status
class VoucherStatusEnum(str, enum.Enum):
    active = "active"
    redeemed = "redeemed"
    expired = "expired"
    cancelled = "cancelled"


# ============================================
# Donation - Donation records
# ============================================
class Donation(BaseModel):
    __tablename__ = "donations"
    
    # Foreign keys
    donor_id = Column(UUID(as_uuid=True), ForeignKey("donor_profiles.user_id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("beneficiary_profiles.user_id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Donation details
    amount = Column(Numeric(15, 2), nullable=False)
    type = Column(Enum(DonationTypeEnum), nullable=False, default=DonationTypeEnum.one_time)
    status = Column(Enum(DonationStatusEnum), nullable=False, default=DonationStatusEnum.pending, index=True)
    
    # Payment information
    payment_method = Column(String(50), default="midtrans")
    midtrans_transaction_id = Column(String(255), unique=True, index=True)
    
    # Subscription configuration (for subscription donations)
    subscription_config = Column(JSONB, nullable=True)
    
    # Relationships
    donor_profile = relationship("DonorProfile", back_populates="donations")
    vouchers = relationship("Voucher", back_populates="donation", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Donation {self.id} - {self.amount} ({self.status})>"
    
    def is_subscription_active(self) -> bool:
        """Check if subscription is still active"""
        if self.type != DonationTypeEnum.subscription:
            return False
        
        config = self.subscription_config or {}
        next_billing = config.get("next_billing_date")
        if not next_billing:
            return False
        
        return datetime.fromisoformat(next_billing) > datetime.utcnow()


# ============================================
# Voucher - Voucher definitions
# ============================================
class Voucher(BaseModel):
    __tablename__ = "vouchers"
    
    # Foreign keys
    code = Column(String(50), unique=True, nullable=False, index=True)
    beneficiary_id = Column(UUID(as_uuid=True), ForeignKey("beneficiary_profiles.user_id", ondelete="CASCADE"), nullable=False, index=True)
    donation_id = Column(UUID(as_uuid=True), ForeignKey("donations.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Voucher details
    balance = Column(Numeric(15, 2), nullable=False, default=0)
    allocated_date = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(Date, nullable=False, index=True)
    status = Column(Enum(VoucherStatusEnum), nullable=False, default=VoucherStatusEnum.active, index=True)
    
    # Relationships
    beneficiary_profile = relationship("BeneficiaryProfile", back_populates="vouchers")
    donation = relationship("Donation", back_populates="vouchers")
    
    # Redemptions
    redemptions = relationship("VoucherRedemption", back_populates="voucher", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Voucher {self.code} - Balance: {self.balance}>"
    
    def is_expired(self) -> bool:
        """Check if voucher is expired"""
        return datetime.utcnow().date() > self.expiry_date
    
    def can_redeem(self, amount: float) -> bool:
        """Check if voucher can be redeemed for given amount"""
        return (
            self.status == VoucherStatusEnum.active and
            not self.is_expired() and
            self.balance >= amount
        )


# ============================================
# VoucherRedemption - Redemption tracking
# ============================================
class VoucherRedemption(BaseModel):
    __tablename__ = "voucher_redemptions"
    
    # Foreign keys
    voucher_id = Column(UUID(as_uuid=True), ForeignKey("vouchers.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Redemption details
    amount = Column(Numeric(15, 2), nullable=False)
    
    # Relationships
    voucher = relationship("Voucher", back_populates="redemptions")
    order = relationship("Order", back_populates="voucher_redemptions")
    
    def __repr__(self):
        return f"<VoucherRedemption {self.id} - {self.amount}>"


# ============================================
# Indexes for performance
# ============================================
Index("idx_voucher_code_status", Voucher.code, Voucher.status)
Index("idx_voucher_beneficiary_status", Voucher.beneficiary_id, Voucher.status)
Index("idx_donation_donor_status", Donation.donor_id, Donation.status)
Index("idx_donation_created_status", Donation.created_at, Donation.status)
