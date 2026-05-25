"""
Database Configuration and Session Management
Supports both sync and async database operations
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from sqlalchemy.pool import StaticPool
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Get database URL from settings (handles test mode automatically)
DATABASE_URL = settings.get_database_url()

# Detect if using SQLite
IS_SQLITE = DATABASE_URL.startswith("sqlite")


def _create_sqlite_engine(url: str = "sqlite:///:memory:"):
    """Create a SQLite engine with appropriate settings."""
    kwargs = {
        "connect_args": {"check_same_thread": False},
    }
    if url == "sqlite:///:memory:":
        kwargs["poolclass"] = StaticPool
    return create_engine(url, **kwargs)


def _create_postgres_engine(url: str):
    """Create a PostgreSQL engine with connection pooling."""
    return create_engine(
        url,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=3600,
    )


def _build_engine():
    """Build the database engine. SQLite is only used for testing/development."""
    global IS_SQLITE

    if IS_SQLITE:
        return _create_sqlite_engine(DATABASE_URL)

    # Production: create PostgreSQL engine without eager connection test.
    # pool_pre_ping=True ensures stale connections are recycled on use.
    # This allows the app to start even if the DB is momentarily unreachable;
    # requests will fail gracefully until the DB becomes available.
    pg_engine = _create_postgres_engine(DATABASE_URL)
    try:
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Connected to PostgreSQL database successfully")
    except Exception as exc:
        # Log the error but do NOT crash the app — let it start and retry on requests.
        logger.warning(
            "PostgreSQL connection test failed at startup: %s. "
            "The app will start anyway and retry connections on incoming requests.",
            exc,
        )
    return pg_engine


engine = _build_engine()

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# ============================================================================
# ASYNC DATABASE SUPPORT (for FastAPI async endpoints)
# ============================================================================

def _get_async_database_url():
    """Convert database URL to async format."""
    url = settings.get_database_url()
    if url.startswith("sqlite://"):
        # SQLite async URL format
        return url.replace("sqlite://", "sqlite+aiosqlite://")
    elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        # PostgreSQL async URL format - only convert if not already async
        return url.replace("postgresql://", "postgresql+asyncpg://")
    elif url.startswith("postgresql+psycopg2://"):
        # Convert psycopg2 to asyncpg
        return url.replace("postgresql+psycopg2://", "postgresql+asyncpg://")
    return url


ASYNC_DATABASE_URL = _get_async_database_url()
# Log only the scheme for debugging (safe - no credentials)
logger.info(f"Async database driver: {ASYNC_DATABASE_URL.split('://')[0] if '://' in ASYNC_DATABASE_URL else 'unknown'}")


def _create_async_sqlite_engine(url: str):
    """Create an async SQLite engine with appropriate settings."""
    kwargs = {
        "connect_args": {"check_same_thread": False},
    }
    if url == "sqlite+aiosqlite:///:memory:":
        kwargs["poolclass"] = StaticPool
    return create_async_engine(url, **kwargs)


def _create_async_postgres_engine(url: str):
    """Create an async PostgreSQL engine with connection pooling."""
    return create_async_engine(
        url,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=3600,
    )


def _build_async_engine():
    """Build the async database engine."""
    if ASYNC_DATABASE_URL.startswith("sqlite"):
        return _create_async_sqlite_engine(ASYNC_DATABASE_URL)
    return _create_async_postgres_engine(ASYNC_DATABASE_URL)


# Async engine and session
async_engine = _build_async_engine()
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_async_db():
    """
    Async dependency to get database session.
    Yields an async database session and ensures it's closed after use.
    
    Usage in FastAPI routes:
        @app.get("/items")
        async def get_items(db: AsyncSession = Depends(get_async_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def get_db() -> Session:
    """
    Dependency to get database session.
    Yields a database session and ensures it's closed after use.
    
    Usage in FastAPI routes:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize database by creating all tables.
    This is typically run once during deployment.
    
    Note: In production, use Alembic migrations instead.
    """
    # Import all models to ensure they're registered with Base
    # This will be uncommented as we create models
    # from app.models import user, donor, beneficiary, vendor, donation, voucher, product, order, nutrition, settlement
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    logger.info("Database tables created successfully!")
