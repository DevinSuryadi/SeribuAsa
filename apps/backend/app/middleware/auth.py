"""
Authentication Middleware
Mock JWT validation for development
"""
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


class MockAuthUser:
    """Mock authenticated user"""
    
    def __init__(self, user_id: str, email: str, roles: List[str]):
        self.user_id = user_id
        self.email = email
        self.roles = roles


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> MockAuthUser:
    """
    Get current authenticated user (MOCK for development)
    
    In production, this should validate JWT tokens from Supabase.
    For now, it returns a mock user for testing.
    """
    # MOCK: Return fake user for development
    # In production:
    # 1. Extract JWT token from Authorization header
    # 2. Validate token with Supabase
    # 3. Extract user info from token payload
    
    if credentials:
        logger.debug(f"Received auth token: {credentials.credentials[:10]}...")
    
    # Return mock user
    return MockAuthUser(
        user_id="mock-user-123",
        email="user@example.com",
        roles=["user", "donor"]
    )


def RequireRole(allowed_roles: List[str]):
    """
    Dependency to require specific roles
    
    Usage:
        @router.get("/admin")
        def admin_endpoint(user: MockAuthUser = Depends(RequireRole(["admin"]))):
            ...
    """
    async def role_checker(
        current_user: MockAuthUser = Depends(get_current_user)
    ) -> MockAuthUser:
        # Check if user has any of the allowed roles
        if not any(role in current_user.roles for role in allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {allowed_roles}"
            )
        return current_user
    
    return role_checker
