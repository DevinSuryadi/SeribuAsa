"""
Google Authentication Service
Handles Google OAuth token exchange with Supabase and local profile sync.
"""
from typing import Optional
from uuid import UUID

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import UserProfile, DonorProfile, BeneficiaryProfile, VendorProfile


class GoogleAuthService:
    """Service for Google OAuth operations with Supabase."""

    SUPPORTED_ROLES = {"donor", "corporate_donor", "beneficiary", "vendor"}

    @staticmethod
    def _validate_supabase_config() -> None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be configured")

    @staticmethod
    async def exchange_id_token(id_token: str) -> dict:
        """Exchange Google ID token for Supabase session tokens."""
        GoogleAuthService._validate_supabase_config()

        url = f"{settings.SUPABASE_URL}/auth/v1/token?grant_type=id_token"
        headers = {
            "apikey": settings.SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
        }
        payload = {
            "provider": "google",
            "id_token": id_token,
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(url, headers=headers, json=payload)

        if response.status_code != 200:
            detail = "Google token exchange failed"
            try:
                error_data = response.json()
                detail = error_data.get("error_description") or error_data.get("error") or detail
            except Exception:
                pass
            raise ValueError(detail)

        return response.json()

    @staticmethod
    def is_google_user(token_data: dict) -> bool:
        """Check whether authenticated user came from Google provider."""
        app_metadata = token_data.get("app_metadata") or {}
        identities = token_data.get("identities") or []

        if app_metadata.get("provider") == "google":
            return True

        for identity in identities:
            if identity.get("provider") == "google":
                return True

        return False

    @staticmethod
    def resolve_signup_role(requested_role: Optional[str], metadata_role: Optional[str]) -> str:
        """Resolve role for first-time Google users."""
        candidate = requested_role or metadata_role or "donor"
        if candidate not in GoogleAuthService.SUPPORTED_ROLES:
            return "donor"
        return candidate

    @staticmethod
    def resolve_full_name(user_data: dict, requested_full_name: Optional[str]) -> str:
        """Resolve display name from request or Supabase metadata."""
        if requested_full_name and requested_full_name.strip():
            return requested_full_name.strip()

        metadata = user_data.get("user_metadata") or {}
        for key in ("full_name", "name"):
            value = metadata.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()

        email = user_data.get("email")
        if isinstance(email, str) and "@" in email:
            return email.split("@", 1)[0]

        return "Google User"

    @staticmethod
    def get_existing_role(db: Session, user_id: UUID) -> Optional[str]:
        """Determine user role from existing role-specific profiles."""
        donor = db.query(DonorProfile).filter(DonorProfile.user_id == user_id).first()
        if donor:
            if donor.corporate_name:
                return "corporate_donor"
            return "donor"

        if db.query(BeneficiaryProfile).filter(BeneficiaryProfile.user_id == user_id).first():
            return "beneficiary"

        if db.query(VendorProfile).filter(VendorProfile.user_id == user_id).first():
            return "vendor"

        return None

    @staticmethod
    def _create_role_profile(db: Session, user_id: UUID, full_name: str, role: str) -> None:
        if role in ("donor", "corporate_donor"):
            db.add(
                DonorProfile(
                    user_id=user_id,
                    total_donated=0,
                    children_sponsored=0,
                    subscription_status="inactive",
                )
            )
            return

        if role == "beneficiary":
            db.add(
                BeneficiaryProfile(
                    user_id=user_id,
                    family_size=1,
                    vouchers_balance=0,
                )
            )
            return

        if role == "vendor":
            db.add(
                VendorProfile(
                    user_id=user_id,
                    store_name=full_name,
                    store_address="",
                    approval_status="pending",
                )
            )
            return

        raise ValueError(f"Unsupported role: {role}")

    @staticmethod
    def ensure_local_profile(
        db: Session,
        user_id: UUID,
        email: Optional[str],
        full_name: str,
        preferred_role: str,
    ) -> tuple[UserProfile, str, bool]:
        """
        Ensure base and role-specific profile exists for authenticated user.
        Returns: (profile, resolved_role, profile_created)
        """
        profile_created = False

        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if not profile:
            profile = UserProfile(user_id=user_id, full_name=full_name)
            db.add(profile)
            db.flush()
            profile_created = True
        elif not profile.full_name and full_name:
            profile.full_name = full_name

        resolved_role = GoogleAuthService.get_existing_role(db, user_id)
        if not resolved_role:
            role_to_create = GoogleAuthService.resolve_signup_role(preferred_role, None)
            GoogleAuthService._create_role_profile(db, user_id, full_name, role_to_create)
            resolved_role = role_to_create
            profile_created = True

        if not profile.full_name:
            fallback_name = email.split("@", 1)[0] if email and "@" in email else "Google User"
            profile.full_name = fallback_name

        return profile, resolved_role, profile_created


google_auth_service = GoogleAuthService()
