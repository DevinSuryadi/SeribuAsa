"""
Authentication Schemas
Schemas for Google OAuth authentication with Supabase.
"""
from pydantic import BaseModel, Field
from typing import Literal, Optional
from uuid import UUID

GoogleRole = Literal["donor", "corporate_donor", "beneficiary", "vendor"]


class GoogleTokenExchangeRequest(BaseModel):
    """Request payload for Google ID token exchange via Supabase."""
    id_token: str = Field(..., min_length=20, description="Google ID token")
    role: Optional[GoogleRole] = Field(default=None, description="Preferred role for first login")
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=255)


class GoogleSyncRequest(BaseModel):
    """Request payload for syncing profile after OAuth login in frontend."""
    role: Optional[GoogleRole] = Field(default=None, description="Preferred role for first login")
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=255)


class GoogleAuthUser(BaseModel):
    """Normalized authenticated user payload."""
    user_id: UUID
    email: Optional[str] = None
    full_name: str
    role: GoogleRole
    profile_created: bool


class GoogleAuthResponse(BaseModel):
    """Response payload returned after Google authentication/sync."""
    provider: Literal["google"] = "google"
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    expires_in: Optional[int] = None
    token_type: Optional[str] = None
    user: GoogleAuthUser
