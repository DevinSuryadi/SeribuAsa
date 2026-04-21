"""
Authentication Middleware
Supports both Supabase JWT validation (production) and mock auth (development)
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List
import logging
import os
from uuid import UUID

from app.services.supabase_auth import supabase_auth
from app.config import settings
from app.database import SessionLocal
from app.models.user import UserProfile

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


class AuthenticatedUser:
    """Authenticated user information"""
    
    def __init__(self, user_id: str | UUID, email: str, role: str, email_verified: bool = False):
        # Keep UUID type for UUID-backed DB columns.
        self.user_id = user_id if isinstance(user_id, UUID) else UUID(str(user_id))
        self.email = email
        self.role = role
        self.email_verified = email_verified


def _has_supabase_auth_config() -> bool:
    """Check whether required Supabase auth settings are available."""
    return bool(settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY)


def is_dev_mode() -> bool:
    # Check whether auth should use local mock mode.
    return os.getenv("DEV_MODE", "false").lower() == "true" or not _has_supabase_auth_config()


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> AuthenticatedUser:
    """
    Get current authenticated user.
    
    In production: Validates JWT token with Supabase
    In development: Returns mock user for testing
    """
    # Development mode - return mock user
    if is_dev_mode():
        logger.debug("Using mock authentication (development mode)")
        return AuthenticatedUser(
            user_id="00000000-0000-0000-0000-000000000001",
            email="donor@nutriguard.id",
            role="donor",
            email_verified=True
        )

    if not credentials:
        logger.warning("[AUTH] Request without credentials - returning 401")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Production mode - validate Supabase JWT
    try:
        logger.info(f"[AUTH] Verifying JWT token...")
        token_data = await supabase_auth.verify_token(credentials.credentials)
        user_info = supabase_auth.extract_user_info(token_data)
        
        # Look up actual role from database based on which profile exists
        # (UserProfile doesn't have a role field - role is determined by which profile exists)
        db = SessionLocal()
        try:
            user_profile = db.query(UserProfile).filter(
                UserProfile.user_id == user_info["user_id"]
            ).first()
            
            if user_profile:
                # Check which profile exists to determine role
                if user_profile.beneficiary_profile:
                    actual_role = "beneficiary"
                elif user_profile.vendor_profile:
                    actual_role = "vendor"
                elif user_profile.donor_profile:
                    actual_role = "donor"
                else:
                    # Fallback to JWT role if no specific profile found
                    actual_role = user_info["role"]
                    
                logger.info(f"[AUTH] Role from database: {actual_role}")
            else:
                # Fallback to JWT role if no profile found
                actual_role = user_info["role"]
                logger.warning(f"[AUTH] No user profile found for {user_info['user_id']}, using JWT role: {actual_role}")
        except Exception as e:
            logger.error(f"[AUTH] Error looking up user profile: {e}")
            actual_role = user_info["role"]
        finally:
            db.close()
        
        logger.info(f"[AUTH] JWT verified - user_id: {user_info['user_id']}, email: {user_info['email']}, role: {actual_role}")
        
        return AuthenticatedUser(
            user_id=user_info["user_id"],
            email=user_info["email"],
            role=actual_role,
            email_verified=user_info["email_verified"]
        )
        
    except ValueError as e:
        logger.error(f"Authentication failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Unexpected authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service error"
        )


def RequireRole(allowed_roles: List[str]):
    """
    Dependency to require specific roles.
    
    Usage:
        @router.get("/admin")
        async def admin_endpoint(user: AuthenticatedUser = Depends(RequireRole(["admin"]))):
            ...
    """
    async def role_checker(
        current_user: AuthenticatedUser = Depends(get_current_user)
    ) -> AuthenticatedUser:
        # Check if user has any of the allowed roles
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    
    return role_checker


async def OptionalAuth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[AuthenticatedUser]:
    """
    Optional authentication - returns user if authenticated, None otherwise.
    Useful for endpoints that work for both authenticated and anonymous users.
    """
    if not credentials:
        return None
    
    try:
        token_data = await supabase_auth.verify_token(credentials.credentials)
        user_info = supabase_auth.extract_user_info(token_data)
        
        return AuthenticatedUser(
            user_id=user_info["user_id"],
            email=user_info["email"],
            role=user_info["role"],
            email_verified=user_info["email_verified"]
        )
    except Exception:
        return None
