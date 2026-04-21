"""
Database Configuration and Session Management
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from sqlalchemy.pool import StaticPool
from app.config import settings

# Get database URL from settings (handles test mode automatically)
DATABASE_URL = settings.get_database_url()

# Detect if using SQLite
IS_SQLITE = DATABASE_URL.startswith("sqlite")

# Create database engine
# Configuration differs for SQLite vs PostgreSQL
if IS_SQLITE:
    # SQLite configuration for testing
    sqlite_engine_kwargs = {
        "connect_args": {"check_same_thread": False},  # Needed for SQLite
    }
    if DATABASE_URL == "sqlite:///:memory:":
        # Keep a single shared in-memory connection across threads.
        sqlite_engine_kwargs["poolclass"] = StaticPool

    engine = create_engine(DATABASE_URL, **sqlite_engine_kwargs)
else:
    # PostgreSQL configuration for production
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,  # Enable connection health checks
        pool_recycle=3600,   # Recycle connections after 1 hour
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


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
    
    print("✅ Database tables created successfully!")
