import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Load .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Import models and Base
from app.database import Base
from app.models import (  # noqa: F401
    UserProfile, DonorProfile, BeneficiaryProfile, VendorProfile, Child,
    Donation, Voucher, VoucherRedemption,
    Category, Product, Order, OrderItem,
    NutritionMeasurement, FIESSurvey, Settlement, AuditLog,
    Withdrawal,
    WalletAllocation, WalletTransaction,
)

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Override sqlalchemy.url with DATABASE_URL env var if available
database_url = os.environ.get("DATABASE_URL")
if database_url:
    # Ensure explicit driver: replace postgresql:// with postgresql+psycopg2://
    # to avoid sqlalchemy.exc.NoSuchModuleError on some environments
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        
    # Supabase uses IPv6 by default. Railway doesn't support IPv6 out of the box.
    # Replace the connection string host to use the IPv4 pooler if it's a Supabase DB.
    # Note: .pooler.supabase.com supports IPv4.
    if ".supabase.co" in database_url and ":6543" in database_url:
        # Convert db.projectref.supabase.co to aws-0-region.pooler.supabase.com
        # Or simply instruct the user, but we can attempt to handle common patterns.
        # But a safer approach is to check if it's already using the pooler
        pass
        
    config.set_main_option("sqlalchemy.url", database_url)

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_schemas=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
