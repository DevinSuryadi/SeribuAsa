import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, donations, vouchers, admin
from app.api import wallet as wallet_api
from app.database import IS_SQLITE, SessionLocal, init_db
from app.models.user import UserProfile, DonorProfile, BeneficiaryProfile, VendorProfile
from app.config import settings
from app.cron.settlement_cron import SettlementScheduler

logger = logging.getLogger(__name__)

app = FastAPI(title="NutriGuard API", version="1.0.0")

# CORS configuration for local development.
# Merge .env-configured origins with common frontend dev origins.
configured_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
DEV_ORIGINS = list(dict.fromkeys(configured_origins + [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:3000",
    "http://0.0.0.0:5173",
    "http://0.0.0.0:5174",
    "http://0.0.0.0:5175",
    "http://0.0.0.0:3000",
]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(donations.router, prefix="/api/v1")
app.include_router(vouchers.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(wallet_api.router, prefix="/api/v1")


def _seed_demo_profiles() -> None:
    """Seed local demo profiles for SQLite fallback mode."""
    demo_users = {
        UUID("00000000-0000-0000-0000-000000000001"): {"name": "Donor Demo", "role": "donor"},
        UUID("00000000-0000-0000-0000-000000000002"): {"name": "Penerima Demo", "role": "beneficiary"},
        UUID("00000000-0000-0000-0000-000000000003"): {"name": "Vendor Demo", "role": "vendor"},
    }

    db = SessionLocal()
    try:
        for user_id, info in demo_users.items():
            existing_user = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
            if not existing_user:
                db.add(UserProfile(user_id=user_id, full_name=info["name"]))

        db.flush()

        donor_id = UUID("00000000-0000-0000-0000-000000000001")
        if not db.query(DonorProfile).filter(DonorProfile.user_id == donor_id).first():
            db.add(DonorProfile(user_id=donor_id, total_donated=0, children_sponsored=0, subscription_status="inactive"))

        beneficiary_id = UUID("00000000-0000-0000-0000-000000000002")
        if not db.query(BeneficiaryProfile).filter(BeneficiaryProfile.user_id == beneficiary_id).first():
            db.add(BeneficiaryProfile(user_id=beneficiary_id, family_size=1, vouchers_balance=0))

        vendor_id = UUID("00000000-0000-0000-0000-000000000003")
        if not db.query(VendorProfile).filter(VendorProfile.user_id == vendor_id).first():
            db.add(VendorProfile(user_id=vendor_id, store_name="Vendor Demo", store_address="Alamat Demo", approval_status="approved"))

        db.commit()
        logger.info("Demo profiles seeded for SQLite fallback mode")
    except Exception as exc:
        db.rollback()
        logger.warning("Failed to seed demo profiles: %s", exc)
    finally:
        db.close()


@app.on_event("startup")
def startup_event() -> None:
    # When DATABASE_URL is not set, app uses SQLite fallback.
    # Initialize schema so local dashboard fetches don't fail with missing tables.
    if IS_SQLITE:
        init_db()
        _seed_demo_profiles()
        
        # Seed subscription plans
        try:
            db = SessionLocal()
            from app.seeds.subscription_plans import seed_subscription_plans
            seed_subscription_plans(db)
            db.close()
            logger.info("Subscription plans seeded successfully")
        except Exception as e:
            logger.error(f"Failed to seed subscription plans: {e}")
    
    # Initialize scheduler for settlement processing and report generation
    if settings.SCHEDULER_ENABLED:
        try:
            SettlementScheduler.initialize(SessionLocal)
            logger.info("Settlement scheduler initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize settlement scheduler: {e}")
            # Don't fail startup if scheduler fails - just log the error


@app.on_event("shutdown")
def shutdown_event() -> None:
    """Gracefully shutdown scheduler on app shutdown"""
    try:
        SettlementScheduler.shutdown()
        logger.info("Settlement scheduler shutdown successfully")
    except Exception as e:
        logger.error(f"Error during scheduler shutdown: {e}")


@app.get("/")
def root():
    return {"message": "Welcome to NutriGuard API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/api/v1")
def api_v1_root():
    """API v1 root"""
    return {
        "message": "NutriGuard API v1",
        "endpoints": {
            "auth": "/api/v1/auth",
            "users": "/api/v1/users",
            "donations": "/api/v1/donations",
            "vouchers": "/api/v1/vouchers",
            "products": "/api/v1/products",
            "orders": "/api/v1/orders",
            "wallet": "/api/v1/wallet",
            "fies": "/api/v1/fies",
            "nutrition": "/api/v1/nutrition",
            "recommendations": "/api/v1/recommendations",
            "settlements": "/api/v1/settlements",
            "reports": "/api/v1/reports",
            "vendor-wallet": "/api/v1/vendor-wallet",
            "admin": "/api/v1/admin",
            "docs": "/docs"
        }
    }
