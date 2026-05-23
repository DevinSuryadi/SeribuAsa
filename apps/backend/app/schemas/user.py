"""
User Profile Schemas
Handles user registration, profile creation, and response models
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Literal
from datetime import date, datetime
from uuid import UUID

# Role type
UserRole = Literal["donor", "corporate_donor", "beneficiary", "vendor", "admin", "government"]
GenderType = Literal["male", "female"]


class UserProfileCreate(BaseModel):
    """Schema for creating a new user profile on signup"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "full_name": "John Doe",
                "role": "donor",
                "phone": "08123456789",
                "address": "Jl. Contoh No. 123"
            }
        }
    )

    user_id: UUID = Field(..., description="Supabase auth user ID")
    full_name: str = Field(..., min_length=1, max_length=255, description="User's full name")
    role: UserRole = Field(..., description="User role")
    phone: str | None = Field(None, max_length=20, description="User's phone number")
    address: str | None = Field(None, description="User's address")


class UserProfileResponse(BaseModel):
    """Schema for user profile response"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    full_name: str
    role: UserRole | None = None
    phone: str | None
    address: str | None
    date_of_birth: date | None
    gender: GenderType | None
    avatar_url: str | None
    bank_name: str | None = None
    bank_account_number: str | None = None
    bank_account_holder: str | None = None
    created_at: datetime
    updated_at: datetime


class UserSignUpRequest(BaseModel):
    """Schema for signup request from frontend"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "full_name": "Jane Smith",
                "role": "beneficiary"
            }
        }
    )

    user_id: UUID = Field(..., description="Supabase auth user ID")
    full_name: str = Field(..., min_length=1, max_length=255)
    role: UserRole = Field(...)
    phone: str | None = Field(None, max_length=20)
    address: str | None = Field(None)


class UserSignUpResponse(BaseModel):
    """Schema for signup response"""
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    full_name: str
    role: UserRole
    message: str = "User created successfully"


class UserProfileUpdateRequest(BaseModel):
    """Schema for updating existing user profile"""
    full_name: str | None = Field(None, min_length=1, max_length=255)
    phone: str | None = Field(None, max_length=20)
    address: str | None = Field(None)
    date_of_birth: date | None = Field(None)
    gender: GenderType | None = Field(None)
    bank_name: str | None = Field(None, max_length=100)
    bank_account_number: str | None = Field(None, max_length=50)
    bank_account_holder: str | None = Field(None, max_length=255)
