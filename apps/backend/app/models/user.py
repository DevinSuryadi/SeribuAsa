"""
User Profile Models
- UserProfile: Base profile for all users
"""
from sqlalchemy import Column, String, Text, Date, Enum, ForeignKey
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
    
    def __repr__(self):
        return f"<UserProfile {self.full_name} ({self.user_id})>"
