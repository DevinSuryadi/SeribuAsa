"""
Seed subscription plans to database
Run once on startup (SQLite mode) or via migration
"""
from sqlalchemy.orm import Session
from app.models.subscription import SubscriptionPlan
from decimal import Decimal
import uuid

# Use deterministic UUIDs for seed data (best practice for consistency across environments)
SUBSCRIPTION_PLANS = [
    {
        "id": uuid.UUID("a1b2c3d4-e5f6-7890-abcd-ef1234567890"),  # Deterministic UUID
        "name": "Adopsi Nutrisi 1 Balita",
        "description": "Dukungan nutrisi untuk 1 balita selama 1 bulan dengan voucher pangan bergizi",
        "price": Decimal("300000"),
        "currency": "IDR",
        "frequency": "monthly",
        "features": [
            "Voucher pangan bergizi bulanan",
            "Laporan dampak per anak",
            "Sertifikat donasi digital",
            "Pemantauan gizi anak"
        ],
        "is_active": True
    },
    {
        "id": uuid.UUID("b2c3d4e5-f6a7-8901-bcde-f23456789012"),  # Deterministic UUID
        "name": "Paket 1000 HPK",
        "description": "Dukungan komprehensif nutrisi 1000 Hari Pertama Kehidupan",
        "price": Decimal("500000"),
        "currency": "IDR",
        "frequency": "monthly",
        "features": [
            "Semua fitur Adopsi Nutrisi",
            "Dukungan nutrisi ibu hamil",
            "Pemantauan pertumbuhan 1000 HPK",
            "Rekomendasi nutrisi AI",
            "Laporan dampak mendalam"
        ],
        "is_active": True
    }
]


def seed_subscription_plans(db: Session):
    """Seed subscription plans if they don't exist"""
    seeded_count = 0
    
    for plan_data in SUBSCRIPTION_PLANS:
        existing = db.query(SubscriptionPlan).filter(
            SubscriptionPlan.id == plan_data["id"]
        ).first()
        
        if not existing:
            plan = SubscriptionPlan(
                id=plan_data["id"],
                name=plan_data["name"],
                description=plan_data["description"],
                price=plan_data["price"],
                currency=plan_data["currency"],
                frequency=plan_data["frequency"],
                features=plan_data["features"],
                is_active=plan_data["is_active"]
            )
            db.add(plan)
            seeded_count += 1
            print(f"[SEED] Created subscription plan: {plan.name} (ID: {plan.id})")
        else:
            print(f"[SEED] Subscription plan already exists: {existing.name}")
    
    if seeded_count > 0:
        db.commit()
        print(f"[SEED] Successfully seeded {seeded_count} subscription plans")
    else:
        print("[SEED] All subscription plans already exist")
