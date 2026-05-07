"""
User Profile Models
- UserProfile: Base profile for all users
- DonorProfile: Donor-specific data
- BeneficiaryProfile: Beneficiary-specific data
- VendorProfile: Vendor-specific data
- Child: Children of beneficiaries
"""
from sqlalchemy import Column, String, Text, Date, Enum, ForeignKey, Integer, Numeric, Uuid as UUID
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel


# Enum for gender
class GenderEnum(str, enum.Enum):
    male = "male"
    female = "female"


# ============================================
# UserProfile - Base profile for all users
# ============================================
class UserProfile(BaseModel):
    __tablename__ = "user_profiles"
    
    # User ID (references Supabase auth.users in production)
    # For local development, this is just a UUID field
    user_id = Column(UUID(as_uuid=True), unique=True, nullable=False, index=True)
    
    # Personal information
    full_name = Column(String(255), nullable=False)
    nik = Column(String(16), unique=True, index=True)  # Indonesian National ID
    phone = Column(String(20))
    address = Column(Text)
    date_of_birth = Column(Date)
    gender = Column(Enum(GenderEnum))
    
    # Profile photo
    avatar_url = Column(String(500))
    
    # Relationships (one-to-one with role-specific profiles)
    donor_profile = relationship("DonorProfile", back_populates="user_profile", uselist=False, cascade="all, delete-orphan")
    beneficiary_profile = relationship("BeneficiaryProfile", back_populates="user_profile", uselist=False, cascade="all, delete-orphan")
    vendor_profile = relationship("VendorProfile", back_populates="user_profile", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<UserProfile {self.full_name} ({self.user_id})>"


# ============================================
# DonorProfile - Donor-specific data
# ============================================
class DonorProfile(BaseModel):
    __tablename__ = "donor_profiles"
    
    # Foreign key to user_profiles
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.user_id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    # Donor statistics
    total_donated = Column(Numeric(15, 2), default=0)
    children_sponsored = Column(Integer, default=0)
    subscription_status = Column(String(50), default="inactive")
    
    # Corporate donor fields
    corporate_name = Column(String(255))
    tax_id = Column(String(50))
    
    # Relationship
    user_profile = relationship("UserProfile", back_populates="donor_profile")
    
    # Donations
    donations = relationship("Donation", back_populates="donor_profile", cascade="all, delete-orphan")
    
    # Subscriptions
    subscriptions = relationship("Subscription", back_populates="donor_profile", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<DonorProfile {self.user_profile.full_name}>"


# ============================================
# BeneficiaryProfile - Beneficiary-specific data
# ============================================
class BeneficiaryProfile(BaseModel):
    __tablename__ = "beneficiary_profiles"
    
    # Foreign key to user_profiles
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.user_id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    # Family information
    family_size = Column(Integer, default=1)
    
    # E-Wallet balance (renamed from vouchers_balance; kept column name for backward compat)
    vouchers_balance = Column(Numeric(15, 2), default=0)  # total balance (available + held)
    wallet_held      = Column(Numeric(15, 2), default=0)  # amount locked for pending orders

    @property
    def wallet_balance(self) -> "Decimal":
        """Alias: total wallet balance (available + held)"""
        from decimal import Decimal
        return Decimal(self.vouchers_balance or 0)

    @property
    def wallet_available(self) -> "Decimal":
        """Saldo yang bisa langsung digunakan sekarang"""
        from decimal import Decimal
        return Decimal(self.vouchers_balance or 0) - Decimal(self.wallet_held or 0)

    # Approval and status
    approval_status = Column(String(50), default="pending")  # pending, approved, rejected

    # FIES score and classification
    fies_score = Column(Integer)
    fies_classification = Column(String(50))  # severe, moderate, food_secure

    # Relationships
    user_profile = relationship("UserProfile", back_populates="beneficiary_profile")

    # Children
    children = relationship("Child", back_populates="beneficiary_profile", cascade="all, delete-orphan")

    # Legacy vouchers (kept for backward compat / audit history)
    vouchers = relationship("Voucher", back_populates="beneficiary_profile", cascade="all, delete-orphan")

    # New E-Wallet system
    wallet_allocations  = relationship("WalletAllocation",  back_populates="beneficiary_profile", cascade="all, delete-orphan")
    wallet_transactions = relationship("WalletTransaction", back_populates="beneficiary_profile", cascade="all, delete-orphan")

    # Orders
    orders = relationship("Order", back_populates="beneficiary_profile", foreign_keys="Order.beneficiary_id", cascade="all, delete-orphan")

    # Cart items
    cart_items = relationship("CartItem", back_populates="beneficiary_profile", cascade="all, delete-orphan")

    # FIES surveys
    fies_surveys = relationship("FIESSurvey", back_populates="beneficiary_profile", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<BeneficiaryProfile {self.user_profile.full_name}>"


# ============================================
# VendorProfile - Vendor-specific data
# ============================================
class VendorProfile(BaseModel):
    __tablename__ = "vendor_profiles"
    
    # Foreign key to user_profiles
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.user_id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    # Store information
    store_name = Column(String(255), nullable=False)
    store_address = Column(Text, nullable=False)
    store_phone = Column(String(20))
    
    # Bank account for settlement
    bank_name = Column(String(100))
    bank_account_number = Column(String(50))
    bank_account_holder = Column(String(255))
    
    # Settlement status
    settlement_status = Column(String(50), default="active")
    approval_status = Column(String(50), default="pending")
    
    # E-wallet balance
    wallet_balance = Column(Numeric(15, 2), default=0)
    
    # Withdrawals
    withdrawals = relationship("Withdrawal", back_populates="vendor_profile", cascade="all, delete-orphan")
    
    # Relationship
    user_profile = relationship("UserProfile", back_populates="vendor_profile")
    
    # Products
    products = relationship("Product", back_populates="vendor_profile", cascade="all, delete-orphan")
    
    # Orders (as vendor)
    orders = relationship("Order", back_populates="vendor_profile", foreign_keys="Order.vendor_id", cascade="all, delete-orphan")
    
    # Settlements
    settlements = relationship("Settlement", back_populates="vendor_profile", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<VendorProfile {self.store_name}>"


# ============================================
# Child - Children of beneficiaries
# ============================================
class Child(BaseModel):
    __tablename__ = "children"
    
    # Foreign key to beneficiary
    beneficiary_id = Column(UUID(as_uuid=True), ForeignKey("beneficiary_profiles.user_id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Child information
    full_name = Column(String(255), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(Enum(GenderEnum))
    
    # Relationship
    beneficiary_profile = relationship("BeneficiaryProfile", back_populates="children")
    nutrition_measurements = relationship("NutritionMeasurement", back_populates="child", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Child {self.full_name}>"
