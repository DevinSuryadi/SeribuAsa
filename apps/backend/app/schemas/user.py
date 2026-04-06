"""
User Profile Schemas
Handles user registration, profile creation, and response models
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID

# Role type
UserRole = Literal["donor", "corporate_donor", "beneficiary", "vendor", "admin", "government"]


class UserProfileCreate(BaseModel):
    """Schema for creating a new user profile on signup"""
    user_id: UUID = Field(..., description="Supabase auth user ID")
    full_name: str = Field(..., min_length=1, max_length=255, description="User's full name")
    role: UserRole = Field(..., description="User role")
    phone: Optional[str] = Field(None, max_length=20, description="User's phone number")
    address: Optional[str] = Field(None, description="User's address")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "full_name": "John Doe",
                "role": "donor",
                "phone": "08123456789",
                "address": "Jl. Contoh No. 123"
            }
        }


class UserProfileResponse(BaseModel):
    """Schema for user profile response"""
    id: UUID
    user_id: UUID
    full_name: str
    phone: Optional[str]
    address: Optional[str]
    avatar_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserSignUpRequest(BaseModel):
    """Schema for signup request from frontend"""
    user_id: UUID = Field(..., description="Supabase auth user ID")
    full_name: str = Field(..., min_length=1, max_length=255)
    role: UserRole = Field(...)

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "full_name": "Jane Smith",
                "role": "beneficiary"
            }
        }


class UserSignUpResponse(BaseModel):
    """Schema for signup response"""
    user_id: UUID
    full_name: str
    role: UserRole
    message: str = "User created successfully"

    class Config:
        from_attributes = True
