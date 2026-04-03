"""
Authentication Middleware
Supports both Supabase JWT validation (production) and mock auth (development)
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List
import logging
import os

from app.services.supabase_auth import supabase_auth
from app.config import settings

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


class AuthenticatedUser:
    """Authenticated user information"""
    
    def __init__(self, user_id: str, email: str, role: str, email_verified: bool = False):
        self.user_id = user_id
        self.email = email
        self.role = role
        self.email_verified = email_verified


def is_dev_mode() -> bool:
    """Check if running in development mode"""
    return os.getenv("DEV_MODE", "false").lower() == "true" or not settings.SUPABASE_URL


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> AuthenticatedUser:
    """
    Get current authenticated user.
    
    In production: Validates JWT token with Supabase
    In development: Returns mock user for testing
    """
    # Development mode - return mock user
    if is_dev_mode() or not credentials:
        logger.debug("Using mock authentication (development mode)")
        return AuthenticatedUser(
            user_id="00000000-0000-0000-0000-000000000001",
            email="donor@nutriguard.id",
            role="donor",
            email_verified=True
        )
    
    # Production mode - validate Supabase JWT
    try:
        token_data = await supabase_auth.verify_token(credentials.credentials)
        user_info = supabase_auth.extract_user_info(token_data)
        
        return AuthenticatedUser(
            user_id=user_info["user_id"],
            email=user_info["email"],
            role=user_info["role"],
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


def OptionalAuth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[AuthenticatedUser]:
    """
    Optional authentication - returns user if authenticated, None otherwise.
    Useful for endpoints that work for both authenticated and anonymous users.
    """
    if not credentials:
        return None
    
    try:
        token_data = supabase_auth.verify_token(credentials.credentials)
        user_info = supabase_auth.extract_user_info(token_data)
        
        return AuthenticatedUser(
            user_id=user_info["user_id"],
            email=user_info["email"],
            role=user_info["role"],
            email_verified=user_info["email_verified"]
        )
    except Exception:
        return None
