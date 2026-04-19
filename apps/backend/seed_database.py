"""
E2E Seed Script for NutriGuard

Goals:
- Provide deterministic, idempotent data for end-to-end testing flows.
- Support quick local SQLite seeding and Supabase/PostgreSQL dev seeding.

Flows covered:
- Catalog browsing (categories, approved vendors, approved products)
- Beneficiary dashboard (voucher balance/history, FIES latest, nutrition latest)
- Cart and checkout preconditions (cart items, stock, voucher-eligible categories)
- Transactions (orders, voucher redemptions, voucher transactions)
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Iterable
from uuid import UUID

from sqlalchemy.orm import Session

from app.database import SessionLocal, engine
from app.models.base import BaseModel
from app.models.cart import (
    CartItem,
    VoucherAllowedCategory,
    VoucherTransaction,
    VoucherTransactionTypeEnum,
)
from app.models.donation import (
    Donation,
    DonationStatusEnum,
    DonationTypeEnum,
    Voucher,
    VoucherRedemption,
    VoucherStatusEnum,
)
from app.models.nutrition import FIESSurvey, NutritionMeasurement
from app.models.product import Order, OrderItem, Product, Category
from app.models.user import (
    BeneficiaryProfile,
    Child,
    DonorProfile,
    GenderEnum,
    UserProfile,
    VendorProfile,
)


# ------------------------------
# Deterministic fixture IDs
# ------------------------------
DONOR_USER_ID = UUID("10000000-0000-0000-0000-000000000001")
BENEFICIARY_USER_ID = UUID("20000000-0000-0000-0000-000000000001")
VENDOR_A_USER_ID = UUID("30000000-0000-0000-0000-000000000001")
VENDOR_B_USER_ID = UUID("30000000-0000-0000-0000-000000000002")

CHILD_A_ID = UUID("40000000-0000-0000-0000-000000000001")
CHILD_B_ID = UUID("40000000-0000-0000-0000-000000000002")

DONATION_A_ID = UUID("50000000-0000-0000-0000-000000000001")
DONATION_B_ID = UUID("50000000-0000-0000-0000-000000000002")

VOUCHER_A_ID = UUID("60000000-0000-0000-0000-000000000001")
VOUCHER_B_ID = UUID("60000000-0000-0000-0000-000000000002")

ORDER_A_ID = UUID("70000000-0000-0000-0000-000000000001")
ORDER_B_ID = UUID("70000000-0000-0000-0000-000000000002")


def _slugify(name: str) -> str:
    return name.strip().lower().replace(" ", "-")


def _upsert_model(
    db: Session,
    model,
    where: dict,
    values: dict,
):
    instance = db.query(model).filter_by(**where).first()
    if instance:
        for key, value in values.items():
            setattr(instance, key, value)
        return instance

    payload = {**where, **values}
    instance = model(**payload)
    db.add(instance)
    return instance


def _reset_data(db: Session) -> None:
    """Reset only domain data while keeping schema intact."""
    db.query(VoucherTransaction).delete(synchronize_session=False)
    db.query(VoucherRedemption).delete(synchronize_session=False)
    db.query(OrderItem).delete(synchronize_session=False)
    db.query(Order).delete(synchronize_session=False)
    db.query(CartItem).delete(synchronize_session=False)
    db.query(VoucherAllowedCategory).delete(synchronize_session=False)
    db.query(Voucher).delete(synchronize_session=False)
    db.query(Donation).delete(synchronize_session=False)
    db.query(NutritionMeasurement).delete(synchronize_session=False)
    db.query(FIESSurvey).delete(synchronize_session=False)
    db.query(Product).delete(synchronize_session=False)
    db.query(Category).delete(synchronize_session=False)
    db.query(Child).delete(synchronize_session=False)
    db.query(VendorProfile).delete(synchronize_session=False)
    db.query(BeneficiaryProfile).delete(synchronize_session=False)
    db.query(DonorProfile).delete(synchronize_session=False)
    db.query(UserProfile).delete(synchronize_session=False)


@dataclass(frozen=True)
class SeedContext:
    donor_id: UUID
    beneficiary_id: UUID
    vendor_a_id: UUID
    vendor_b_id: UUID
    child_a_id: UUID
    child_b_id: UUID


def seed_users(db: Session) -> SeedContext:
    _upsert_model(
        db,
        UserProfile,
        where={"user_id": DONOR_USER_ID},
        values={
            "full_name": "Donor E2E",
            "phone": "081200000001",
            "gender": GenderEnum.female,
            "address": "Jakarta",
        },
    )
    _upsert_model(
        db,
        DonorProfile,
        where={"user_id": DONOR_USER_ID},
        values={
            "total_donated": Decimal("2500000.00"),
            "children_sponsored": 1,
            "subscription_status": "active",
        },
    )

    _upsert_model(
        db,
        UserProfile,
        where={"user_id": BENEFICIARY_USER_ID},
        values={
            "full_name": "Penerima E2E",
            "phone": "082200000001",
            "gender": GenderEnum.female,
            "address": "Bandung",
        },
    )
    _upsert_model(
        db,
        BeneficiaryProfile,
        where={"user_id": BENEFICIARY_USER_ID},
        values={
            "family_size": 4,
            "vouchers_balance": Decimal("450000.00"),
            "fies_score": 3,
            "fies_classification": "moderate",
        },
    )

    _upsert_model(
        db,
        UserProfile,
        where={"user_id": VENDOR_A_USER_ID},
        values={
            "full_name": "Vendor A E2E",
            "phone": "083300000001",
            "gender": GenderEnum.male,
            "address": "Bandung",
        },
    )
    _upsert_model(
        db,
        VendorProfile,
        where={"user_id": VENDOR_A_USER_ID},
        values={
            "store_name": "Warung Sehat A",
            "store_address": "Jl. Sehat No. 10 Bandung",
            "store_phone": "083300000001",
            "bank_name": "BCA",
            "bank_account_number": "1111111111",
            "bank_account_holder": "Vendor A E2E",
            "settlement_status": "active",
            "approval_status": "approved",
        },
    )

    _upsert_model(
        db,
        UserProfile,
        where={"user_id": VENDOR_B_USER_ID},
        values={
            "full_name": "Vendor B E2E",
            "phone": "083300000002",
            "gender": GenderEnum.female,
            "address": "Bandung",
        },
    )
    _upsert_model(
        db,
        VendorProfile,
        where={"user_id": VENDOR_B_USER_ID},
        values={
            "store_name": "Toko Gizi B",
            "store_address": "Jl. Gizi No. 21 Bandung",
            "store_phone": "083300000002",
            "bank_name": "Mandiri",
            "bank_account_number": "2222222222",
            "bank_account_holder": "Vendor B E2E",
            "settlement_status": "active",
            "approval_status": "approved",
        },
    )

    today = date.today()
    _upsert_model(
        db,
        Child,
        where={"id": CHILD_A_ID},
        values={
            "beneficiary_id": BENEFICIARY_USER_ID,
            "full_name": "Anak A",
            "date_of_birth": today - timedelta(days=365 * 2),
            "gender": GenderEnum.female,
        },
    )
    _upsert_model(
        db,
        Child,
        where={"id": CHILD_B_ID},
        values={
            "beneficiary_id": BENEFICIARY_USER_ID,
            "full_name": "Anak B",
            "date_of_birth": today - timedelta(days=365 * 3),
            "gender": GenderEnum.male,
        },
    )

    return SeedContext(
        donor_id=DONOR_USER_ID,
        beneficiary_id=BENEFICIARY_USER_ID,
        vendor_a_id=VENDOR_A_USER_ID,
        vendor_b_id=VENDOR_B_USER_ID,
        child_a_id=CHILD_A_ID,
        child_b_id=CHILD_B_ID,
    )


def seed_categories_and_catalog(db: Session, ctx: SeedContext, mode: str) -> list[Product]:
    categories_seed = [
        ("Beras", "Beras dan sumber karbohidrat"),
        ("Protein", "Telur, ikan, ayam, daging"),
        ("Sayuran", "Sayuran segar"),
        ("Buah", "Buah segar"),
        ("Susu", "Susu dan produk dairy"),
        ("Bumbu", "Bumbu dan pelengkap"),
    ]

    categories: dict[str, Category] = {}
    for idx, (name, desc) in enumerate(categories_seed, start=1):
        category = _upsert_model(
            db,
            Category,
            where={"slug": _slugify(name)},
            values={
                "name": name,
                "description": desc,
                "display_order": idx,
                "is_active": True,
            },
        )
        categories[name] = category

    db.flush()

    # Voucher eligibility: all except Bumbu
    for cat_name, category in categories.items():
        _upsert_model(
            db,
            VoucherAllowedCategory,
            where={"category_id": category.id},
            values={"is_allowed": 0 if cat_name == "Bumbu" else 1},
        )

    product_rows = [
        # Vendor A
        (ctx.vendor_a_id, "Beras", "Beras Premium 5kg", Decimal("75000"), Decimal("70000"), 120, "pack"),
        (ctx.vendor_a_id, "Protein", "Telur Ayam 1kg", Decimal("32000"), Decimal("30000"), 90, "kg"),
        (ctx.vendor_a_id, "Sayuran", "Bayam Segar", Decimal("10000"), Decimal("9000"), 80, "ikat"),
        (ctx.vendor_a_id, "Buah", "Pisang Ambon", Decimal("22000"), Decimal("20000"), 60, "sisir"),
        (ctx.vendor_a_id, "Susu", "Susu UHT 1L", Decimal("19000"), Decimal("17000"), 70, "liter"),
        (ctx.vendor_a_id, "Bumbu", "Minyak Goreng 1L", Decimal("18000"), Decimal("0"), 100, "liter"),
        # Vendor B
        (ctx.vendor_b_id, "Beras", "Beras Medium 5kg", Decimal("68000"), Decimal("64000"), 100, "pack"),
        (ctx.vendor_b_id, "Protein", "Ikan Kembung 1kg", Decimal("45000"), Decimal("42000"), 55, "kg"),
        (ctx.vendor_b_id, "Sayuran", "Wortel Segar", Decimal("12000"), Decimal("10000"), 65, "kg"),
        (ctx.vendor_b_id, "Buah", "Jeruk Manis", Decimal("28000"), Decimal("25000"), 45, "kg"),
        (ctx.vendor_b_id, "Susu", "Susu Bubuk 400gr", Decimal("52000"), Decimal("48000"), 40, "pack"),
        (ctx.vendor_b_id, "Bumbu", "Gula Pasir 1kg", Decimal("17000"), Decimal("0"), 90, "kg"),
    ]

    if mode == "full-demo":
        product_rows.extend(
            [
                (ctx.vendor_a_id, "Protein", "Ayam Potong 1kg", Decimal("42000"), Decimal("39000"), 35, "kg"),
                (ctx.vendor_a_id, "Sayuran", "Brokoli", Decimal("18000"), Decimal("15000"), 40, "kg"),
                (ctx.vendor_b_id, "Buah", "Apel Fuji", Decimal("38000"), Decimal("34000"), 30, "kg"),
                (ctx.vendor_b_id, "Susu", "Yogurt Plain", Decimal("16000"), Decimal("14000"), 25, "pcs"),
            ]
        )

    products: list[Product] = []
    for vendor_id, category_name, name, price, voucher_price, stock, unit in product_rows:
        product = _upsert_model(
            db,
            Product,
            where={"vendor_id": vendor_id, "name": name},
            values={
                "category_id": categories[category_name].id,
                "description": f"Produk e2e untuk {category_name}",
                "price": price,
                "voucher_price": voucher_price,
                "stock_quantity": stock,
                "unit": unit,
                "images": [f"https://dummy.nutriguard.local/{_slugify(name)}.jpg"],
                "approval_status": "approved",
                "is_active": True,
            },
        )
        products.append(product)

    return products


def seed_fies_and_nutrition(db: Session, ctx: SeedContext, mode: str) -> None:
    now = datetime.utcnow()

    monthly_scores = [3, 2, 4]
    if mode == "full-demo":
        monthly_scores.extend([1, 5, 2])

    for idx, score in enumerate(monthly_scores):
        survey_date = now - timedelta(days=30 * idx)
        responses = {f"q{i}": 1 if i <= score else 0 for i in range(1, 9)}
        classification = "food_secure" if score <= 2 else "moderate" if score <= 5 else "severe"
        _upsert_model(
            db,
            FIESSurvey,
            where={
                "beneficiary_id": ctx.beneficiary_id,
                "survey_month": survey_date.month,
                "survey_year": survey_date.year,
            },
            values={
                "responses": responses,
                "score": score,
                "classification": classification,
                "survey_date": survey_date,
            },
        )

    nutrition_rows = [
        (ctx.child_a_id, 5, Decimal("11.90"), Decimal("86.00"), Decimal("-0.30"), Decimal("-0.20"), Decimal("-0.10"), "normal"),
        (ctx.child_a_id, 35, Decimal("11.40"), Decimal("84.50"), Decimal("-0.45"), Decimal("-0.30"), Decimal("-0.20"), "normal"),
        (ctx.child_b_id, 7, Decimal("13.20"), Decimal("91.00"), Decimal("0.10"), Decimal("0.05"), Decimal("0.08"), "normal"),
    ]

    if mode == "full-demo":
        nutrition_rows.extend(
            [
                (ctx.child_b_id, 28, Decimal("12.80"), Decimal("89.80"), Decimal("-0.15"), Decimal("-0.10"), Decimal("-0.12"), "normal"),
                (ctx.child_a_id, 60, Decimal("10.90"), Decimal("82.30"), Decimal("-1.20"), Decimal("-1.10"), Decimal("-1.15"), "moderate_malnourished"),
            ]
        )

    for child_id, days_ago, weight, height, z_w, z_h, z_wh, classification in nutrition_rows:
        measurement_date = date.today() - timedelta(days=days_ago)
        _upsert_model(
            db,
            NutritionMeasurement,
            where={"child_id": child_id, "measurement_date": measurement_date},
            values={
                "weight": weight,
                "height": height,
                "muac": Decimal("14.5"),
                "z_score_weight": z_w,
                "z_score_height": z_h,
                "z_score_weight_height": z_wh,
                "classification": classification,
            },
        )


def seed_donations_vouchers_orders_and_transactions(
    db: Session,
    ctx: SeedContext,
    products: list[Product],
    mode: str,
) -> None:
    now = datetime.utcnow()

    donation_a = _upsert_model(
        db,
        Donation,
        where={"id": DONATION_A_ID},
        values={
            "donor_id": ctx.donor_id,
            "recipient_id": ctx.beneficiary_id,
            "amount": Decimal("350000.00"),
            "type": DonationTypeEnum.one_time,
            "status": DonationStatusEnum.success,
            "payment_method": "midtrans",
            "midtrans_transaction_id": "MID-E2E-001",
            "created_at": now - timedelta(days=20),
            "is_active": True,
        },
    )

    donation_b = _upsert_model(
        db,
        Donation,
        where={"id": DONATION_B_ID},
        values={
            "donor_id": ctx.donor_id,
            "recipient_id": ctx.beneficiary_id,
            "amount": Decimal("500000.00"),
            "type": DonationTypeEnum.subscription,
            "status": DonationStatusEnum.success,
            "payment_method": "qris",
            "midtrans_transaction_id": "MID-E2E-002",
            "subscription_config": {
                "interval": "monthly",
                "next_billing_date": (now + timedelta(days=30)).isoformat(),
            },
            "created_at": now - timedelta(days=10),
            "is_active": True,
        },
    )

    _upsert_model(
        db,
        Voucher,
        where={"id": VOUCHER_A_ID},
        values={
            "code": "E2E-VOUCHER-A",
            "beneficiary_id": ctx.beneficiary_id,
            "donation_id": donation_a.id,
            "balance": Decimal("150000.00"),
            "allocated_date": now - timedelta(days=20),
            "expiry_date": date.today() + timedelta(days=40),
            "status": VoucherStatusEnum.active,
            "is_active": True,
        },
    )
    _upsert_model(
        db,
        Voucher,
        where={"id": VOUCHER_B_ID},
        values={
            "code": "E2E-VOUCHER-B",
            "beneficiary_id": ctx.beneficiary_id,
            "donation_id": donation_b.id,
            "balance": Decimal("300000.00"),
            "allocated_date": now - timedelta(days=10),
            "expiry_date": date.today() + timedelta(days=60),
            "status": VoucherStatusEnum.active,
            "is_active": True,
        },
    )

    db.flush()

    vendor_a_products = [p for p in products if p.vendor_id == ctx.vendor_a_id][:3]
    vendor_b_products = [p for p in products if p.vendor_id == ctx.vendor_b_id][:2]

    if not vendor_a_products or not vendor_b_products:
        raise ValueError("Insufficient product catalog seeded for order generation")

    order_a = _upsert_model(
        db,
        Order,
        where={"id": ORDER_A_ID},
        values={
            "beneficiary_id": ctx.beneficiary_id,
            "vendor_id": ctx.vendor_a_id,
            "total_amount": Decimal("129000.00"),
            "voucher_used": Decimal("90000.00"),
            "cash_paid": Decimal("39000.00"),
            "status": "completed",
            "payment_status": "paid",
            "notes": "Order e2e 1",
            "created_at": now - timedelta(days=3),
            "is_active": True,
        },
    )
    order_b = _upsert_model(
        db,
        Order,
        where={"id": ORDER_B_ID},
        values={
            "beneficiary_id": ctx.beneficiary_id,
            "vendor_id": ctx.vendor_b_id,
            "total_amount": Decimal("88000.00"),
            "voucher_used": Decimal("50000.00"),
            "cash_paid": Decimal("38000.00"),
            "status": "processing",
            "payment_status": "partial",
            "notes": "Order e2e 2",
            "created_at": now - timedelta(days=1),
            "is_active": True,
        },
    )

    db.flush()

    # Rebuild order items idempotently
    db.query(OrderItem).filter(OrderItem.order_id.in_([order_a.id, order_b.id])).delete(synchronize_session=False)

    def _add_items(order: Order, item_products: Iterable[Product], quantities: list[int]) -> Decimal:
        total = Decimal("0")
        for product, qty in zip(item_products, quantities):
            subtotal = Decimal(product.price) * qty
            total += subtotal
            db.add(
                OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=qty,
                    price=product.price,
                    subtotal=subtotal,
                )
            )
        return total

    total_a = _add_items(order_a, vendor_a_products[:2], [1, 2])
    total_b = _add_items(order_b, vendor_b_products[:2], [1, 1])

    order_a.total_amount = total_a
    order_a.voucher_used = min(total_a, Decimal("90000.00"))
    order_a.cash_paid = max(Decimal("0"), total_a - order_a.voucher_used)

    order_b.total_amount = total_b
    order_b.voucher_used = min(total_b, Decimal("50000.00"))
    order_b.cash_paid = max(Decimal("0"), total_b - order_b.voucher_used)

    # Voucher redemptions
    db.query(VoucherRedemption).filter(VoucherRedemption.order_id.in_([order_a.id, order_b.id])).delete(synchronize_session=False)
    db.add(
        VoucherRedemption(
            voucher_id=VOUCHER_A_ID,
            order_id=order_a.id,
            amount=order_a.voucher_used,
        )
    )
    db.add(
        VoucherRedemption(
            voucher_id=VOUCHER_B_ID,
            order_id=order_b.id,
            amount=order_b.voucher_used,
        )
    )

    # Voucher transactions (clear & rebuild for deterministic history)
    db.query(VoucherTransaction).filter(
        VoucherTransaction.voucher_id.in_([VOUCHER_A_ID, VOUCHER_B_ID])
    ).delete(synchronize_session=False)

    db.add(
        VoucherTransaction(
            voucher_id=VOUCHER_A_ID,
            order_id=None,
            transaction_type=VoucherTransactionTypeEnum.allocated,
            amount=Decimal("350000.00"),
            created_at=now - timedelta(days=20),
            is_active=True,
        )
    )
    db.add(
        VoucherTransaction(
            voucher_id=VOUCHER_A_ID,
            order_id=order_a.id,
            transaction_type=VoucherTransactionTypeEnum.redeemed,
            amount=order_a.voucher_used,
            created_at=now - timedelta(days=3),
            is_active=True,
        )
    )
    db.add(
        VoucherTransaction(
            voucher_id=VOUCHER_B_ID,
            order_id=None,
            transaction_type=VoucherTransactionTypeEnum.allocated,
            amount=Decimal("500000.00"),
            created_at=now - timedelta(days=10),
            is_active=True,
        )
    )
    db.add(
        VoucherTransaction(
            voucher_id=VOUCHER_B_ID,
            order_id=order_b.id,
            transaction_type=VoucherTransactionTypeEnum.redeemed,
            amount=order_b.voucher_used,
            created_at=now - timedelta(days=1),
            is_active=True,
        )
    )

    if mode == "full-demo":
        db.add(
            VoucherTransaction(
                voucher_id=VOUCHER_B_ID,
                order_id=None,
                transaction_type=VoucherTransactionTypeEnum.adjusted,
                amount=Decimal("15000.00"),
                created_at=now - timedelta(hours=10),
                is_active=True,
            )
        )

    # Cart seeded for current beneficiary
    db.query(CartItem).filter(CartItem.beneficiary_id == ctx.beneficiary_id).delete(synchronize_session=False)
    for product in [vendor_a_products[0], vendor_a_products[1], vendor_b_products[0]]:
        db.add(
            CartItem(
                beneficiary_id=ctx.beneficiary_id,
                product_id=product.id,
                quantity=2 if Decimal(product.voucher_price) > 0 else 1,
                is_active=True,
            )
        )

    # Sync aggregate balance at beneficiary profile level
    beneficiary = db.query(BeneficiaryProfile).filter(BeneficiaryProfile.user_id == ctx.beneficiary_id).first()
    if beneficiary:
        vouchers = db.query(Voucher).filter(
            Voucher.beneficiary_id == ctx.beneficiary_id,
            Voucher.status == VoucherStatusEnum.active,
            Voucher.is_active,
        ).all()
        beneficiary.vouchers_balance = sum((Decimal(v.balance) for v in vouchers), Decimal("0"))


def seed_database(mode: str, reset: bool) -> None:
    print("=" * 64)
    print(" NutriGuard E2E Seeder")
    print("=" * 64)
    print(f"Mode   : {mode}")
    print(f"Reset  : {'yes' if reset else 'no'}")
    print(f"Engine : {engine.url}")

    BaseModel.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if reset:
            print("- Resetting domain data...")
            _reset_data(db)
            db.commit()

        print("- Seeding users and role profiles...")
        ctx = seed_users(db)
        db.commit()

        print("- Seeding categories, voucher-allowed categories, and product catalog...")
        products = seed_categories_and_catalog(db, ctx, mode)
        db.commit()

        print("- Seeding FIES and nutrition records...")
        seed_fies_and_nutrition(db, ctx, mode)
        db.commit()

        print("- Seeding donations, vouchers, transactions, orders, and cart...")
        seed_donations_vouchers_orders_and_transactions(db, ctx, products, mode)
        db.commit()

        print("\n[OK] Seeding complete.")
        print("\nE2E Test IDs:")
        print(f"  donor_user_id       : {DONOR_USER_ID}")
        print(f"  beneficiary_user_id : {BENEFICIARY_USER_ID}")
        print(f"  vendor_a_user_id    : {VENDOR_A_USER_ID}")
        print(f"  vendor_b_user_id    : {VENDOR_B_USER_ID}")
        print("  voucher_code_a      : E2E-VOUCHER-A")
        print("  voucher_code_b      : E2E-VOUCHER-B")

        print("\nQuick verification targets:")
        print("  - GET /api/v1/products")
        print("  - GET /api/v1/cart")
        print("  - GET /api/v1/cart/summary")
        print("  - GET /api/v1/orders")
        print("  - GET /api/v1/vouchers/balance/{beneficiary_id}")
        print("  - GET /api/v1/vouchers/transactions")
        print("  - GET /api/v1/fies/latest/{beneficiary_id}")
        print("  - GET /api/v1/nutrition/latest-measurement/{beneficiary_id}")
    except Exception as exc:
        db.rollback()
        print(f"\n[ERROR] Seeding failed: {exc}")
        raise
    finally:
        db.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed NutriGuard database with deterministic E2E data")
    parser.add_argument(
        "--mode",
        choices=["minimal-e2e", "full-demo"],
        default="minimal-e2e",
        help="Seed mode: minimal-e2e (fast) or full-demo (richer data)",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete domain data before seeding",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    seed_database(mode=args.mode, reset=args.reset)
