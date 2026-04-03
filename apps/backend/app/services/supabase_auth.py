"""
Supabase Authentication Service
Handles JWT validation and user info retrieval from Supabase
"""
import httpx
from typing import Optional
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class SupabaseAuthService:
    """Service for Supabase authentication operations"""
    
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
        url = f"{settings.SUPABASE_URL}/auth/v1/user"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "apikey": settings.SUPABASE_ANON_KEY
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers)
                
                if response.status_code == 200:
                    user_data = response.json()
                    logger.info(f"Token verified for user: {user_data.get('email')}")
                    return user_data
                else:
                    error_data = response.json()
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
        return {
            "user_id": token_data.get("id"),
            "email": token_data.get("email"),
            "email_verified": token_data.get("email_confirmed_at") is not None,
            "full_name": token_data.get("user_metadata", {}).get("full_name", ""),
            "role": token_data.get("user_metadata", {}).get("role", "donor"),
            "created_at": token_data.get("created_at"),
        }


# Singleton instance
supabase_auth = SupabaseAuthService()
