"""
User Profile Models
- UserProfile: Base profile for all users
- DonorProfile: Donor-specific data
- BeneficiaryProfile: Beneficiary-specific data
"""
from sqlalchemy import Column, String, Text, Date, Enum, ForeignKey, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID
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
    
    # Foreign key to Supabase auth.users
    user_id = Column(UUID(as_uuid=True), ForeignKey("auth.users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
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
    
    # Voucher balance
    vouchers_balance = Column(Numeric(15, 2), default=0)
    
    # FIES score and classification
    fies_score = Column(Integer)
    fies_classification = Column(String(50))  # severe, moderate, food_secure
    
    # Relationships
    user_profile = relationship("UserProfile", back_populates="beneficiary_profile")
    
    def __repr__(self):
        return f"<BeneficiaryProfile {self.user_profile.full_name}>"
