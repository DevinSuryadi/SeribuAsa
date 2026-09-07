"""
Supabase Authentication Service
Handles JWT validation and user info retrieval from Supabase
"""
import httpx
import base64
import hashlib
import json
import time
from typing import Optional
from app.config import settings
from app.utils.cache import get_app_cache
import logging

logger = logging.getLogger(__name__)
cache = get_app_cache()


def _token_cache_key(access_token: str) -> str:
    return hashlib.sha256(access_token.encode("utf-8")).hexdigest()


def _token_cache_ttl(access_token: str) -> int:
    """Cache auth verification briefly, bounded by the JWT expiry."""
    try:
        parts = access_token.split(".")
        if len(parts) < 2:
            return 60
        payload_segment = parts[1] + "=" * (-len(parts[1]) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_segment.encode("utf-8")))
        exp = int(payload.get("exp", 0))
        seconds_until_expiry = exp - int(time.time())
        if seconds_until_expiry <= 0:
            return 0
        return max(30, min(seconds_until_expiry, 300))
    except Exception:
        return 60


class SupabaseAuthService:
    """Service for Supabase authentication operations"""

    @staticmethod
    def _validate_config() -> None:
        # Ensure required Supabase auth settings are configured.
        if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
            raise ValueError(
                "Supabase auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY or enable DEV_MODE=true for local mock auth."
            )
    
    @staticmethod
    async def verify_token(access_token: str) -> dict:
        """
        Verify Supabase JWT token and return user info.
        
        Args:
            access_token: JWT token from Supabase Auth
            
        Returns:
            dict: User information from Supabase
            
        Raises:
            ValueError: If token is invalid or expired
        """
        SupabaseAuthService._validate_config()

        cache_key = _token_cache_key(access_token)
        cached_user = cache.get("supabase_auth", cache_key)
        if cached_user:
            return cached_user

        url = f"{settings.SUPABASE_URL}/auth/v1/user"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "apikey": settings.SUPABASE_ANON_KEY
        }
        
        try:
            timeout = httpx.Timeout(5.0, connect=3.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(url, headers=headers)
                
                if response.status_code == 200:
                    user_data = response.json()
                    ttl = _token_cache_ttl(access_token)
                    if ttl > 0:
                        cache.set("supabase_auth", cache_key, user_data, ttl_seconds=ttl)
                    logger.debug(f"Token verified for user: {user_data.get('email')}")
                    return user_data
                else:
                    try:
                        error_data = response.json() if response.content else {}
                    except ValueError:
                        error_data = {"error": response.text}
                    logger.error(f"Token verification failed: {error_data}")
                    raise ValueError(f"Invalid token: {error_data.get('error', 'Unknown error')}")
                    
        except httpx.RequestError as e:
            logger.error(f"Request error during token verification: {str(e)}")
            raise ValueError(f"Failed to verify token: {str(e)}")
    
    @staticmethod
    async def get_user_role(user_id: str) -> Optional[str]:
        """
        Get user role from user_profiles table.
        
        Args:
            user_id: Supabase user ID
            
        Returns:
            str: User role (donor, beneficiary, vendor, admin) or None
        """
        # This will be used with database session in the middleware
        # For now, return None - role will be fetched in the actual endpoint
        return None
    
    @staticmethod
    def extract_user_info(token_data: dict) -> dict:
        """
        Extract relevant user information from Supabase token response.
        
        Args:
            token_data: Raw user data from Supabase
            
        Returns:
            dict: Simplified user info
        """
        user_metadata = token_data.get("user_metadata") if isinstance(token_data.get("user_metadata"), dict) else {}
        app_metadata = token_data.get("app_metadata") if isinstance(token_data.get("app_metadata"), dict) else {}
        return {
            "user_id": token_data.get("id"),
            "email": token_data.get("email"),
            "email_verified": token_data.get("email_confirmed_at") is not None,
            "full_name": user_metadata.get("full_name", ""),
            "role": user_metadata.get("role") or app_metadata.get("role") or token_data.get("role"),
            "created_at": token_data.get("created_at"),
        }


# Singleton instance
supabase_auth = SupabaseAuthService()
