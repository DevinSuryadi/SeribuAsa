"""
Application Configuration
Loads environment variables and provides settings for the application.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "NutriGuard API"
    APP_VERSION: str = "1.0.0"
    API_VERSION: str = "v1"
    LOG_LEVEL: str = "INFO"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174"
    
    # Database (Supabase PostgreSQL)
    DATABASE_URL: str
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str
    
    # Midtrans
    MIDTRANS_SERVER_KEY: str
    MIDTRANS_CLIENT_KEY: str
    MIDTRANS_IS_PRODUCTION: bool = False
    
    # JWT (Optional - if using custom JWT)
    JWT_SECRET_KEY: str = "your-secret-key-min-32-chars-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Storage
    STORAGE_BUCKET_NAME: str = "nutriguard-uploads"
    MAX_FILE_SIZE_MB: int = 5
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    """
    return Settings()


# Convenience function to access settings
settings = get_settings()
