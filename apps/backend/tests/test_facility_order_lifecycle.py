"""Facility orders always have a way out, and vendors only see what they need."""

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import get_db
from app.main import app
from app.middleware.auth import AuthenticatedUser, get_current_user
from app.models.donation import Donation, DonationStatusEnum
from app.models.facility import (
    AidDistribution,
    AidDistributionItem,
    FacilityOrderReceipt,
    FacilityVendorPayout,
    HealthFacility,
    OrderFundingAllocation,
    RecipientFamily,
)
from app.models.product import Category, Order, OrderItem, Product
from app.models.user import BeneficiaryProfile, DonorProfile, UserProfile, VendorProfile
from app.services.facility_order_lifecycle import expire_unprocessed_facility_orders
from app.services.supabase_auth import supabase_auth

ORDERS = "/api/v1/facilities/orders"
VENDOR_ORDERS = "/api/v1/vendor/facility-orders"
ADMIN_ORDERS = "/api/v1/admin/facility-orders"
HEADERS = {"Authorization": "Bearer facility"}
STOCK = 10


@pytest.fixture()
def env(monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    for model in (
        UserProfile, BeneficiaryProfile, DonorProfile, VendorProfile, HealthFacility, RecipientFamily,
        Category, Product, Donation, Order, OrderItem, FacilityOrderReceipt, FacilityVendorPayout,
        OrderFundingAllocation, AidDistribution, AidDistributionItem,
    ):
        model.__table__.create(engine)
    sessions = sessionmaker(bind=engine)
    facility_user, vendor_user, donor_user, admin_user = uuid4(), uuid4(), uuid4(), uuid4()
    identity = {"id": vendor_user, "role": "vendor"}

    async def verify_token(token):
        return {"id": str(facility_user)}

    monkeypatch.setattr(supabase_auth, "verify_token", verify_token)
    with sessions() as db:
        for user_id in (facility_user, vendor_user, donor_user, admin_user):
            db.add(UserProfile(user_id=user_id, full_name="Pengguna"))
        db.flush()
        db.add(DonorProfile(user_id=donor_user))
        db.flush()
        db.add(Donation(donor_id=donor_user, amount=500000, status=DonationStatusEnum.success, funding_flow="pooled"))
        facility = HealthFacility(
            account_user_id=facility_user, name="Faskes A", address="Jl. Kenanga 12", phone="0211234", approval_status="approved"
        )
        vendor = VendorProfile(user_id=vendor_user, store_name="Toko A", store_address="Jalan A", approval_status="approved")
        db.add_all([facility, vendor])
        db.flush()
        family = RecipientFamily(health_facility_id=facility.id, kk_number="1234567890123456", head_name="Keluarga A")
        product = Product(
            vendor_id=vendor_user, name="Beras", price=10000, voucher_price=10000, stock_quantity=STOCK,
            approval_status="approved", service_province_code="15", service_regency_code="15.71",
        )
        db.add_all([family, product])
        db.commit()
        family_id, product_id, facility_id = family.id, product.id, facility.id

    def override_db():
        with sessions() as db:
            yield db

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        user_id=identity["id"], email="user@example.org", role=identity["role"]
    )
    client = TestClient(app)

    def submit_order(quantity=2):
        return client.post(ORDERS, headers=HEADERS, json={
            "family_id": str(family_id), "vendor_id": str(vendor_user), "service_province_code": "15",
            "service_regency_code": "15.71", "client_request_id": str(uuid4()),
            "items": [{"product_id": str(product_id), "quantity": quantity}],
        })

    def place_order(quantity=2):
        response = submit_order(quantity)
        assert response.status_code == 201, response.text
        return response.json()["id"]

    def dispatched_order():
        order_id = place_order()
        assert client.post(f"{VENDOR_ORDERS}/{order_id}/confirm").status_code == 200
        assert client.post(f"{VENDOR_ORDERS}/{order_id}/dispatch").status_code == 200
        return order_id

    def stock():
        with sessions() as db:
            return db.get(Product, product_id).stock_quantity

    def allocation_statuses(order_id):
        with sessions() as db:
            return {row.status for row in db.query(OrderFundingAllocation).filter_by(order_id=UUID(order_id)).all()}

    yield SimpleNamespace(
        client=client, sessions=sessions, identity=identity, admin_user=admin_user, facility_id=facility_id,
        submit_order=submit_order, place_order=place_order, dispatched_order=dispatched_order, stock=stock, allocation_statuses=allocation_statuses,
    )
    app.dependency_overrides.clear()


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def test_vendor_payload_hides_recipient_details(env):
    order_id = env.dispatched_order()
    receipt = env.client.post(f"{ORDERS}/{order_id}/receipt", headers=HEADERS, json={"arrived_at": now_iso(), "items_complete": True})
    assert receipt.status_code == 200, receipt.text
    distributed = env.client.post(f"{ORDERS}/{order_id}/distribute", headers=HEADERS, json={
        "recipient_name": "Ibu A", "recipient_relation": "Pasangan",
        "evidence_url": "https://example.org/bukti.jpg", "items_complete": True, "notes": "Rumah nomor 3",
    })
    assert distributed.status_code == 200, distributed.text
    assert distributed.json()["distribution"]["recipient_name"] == "Ibu A"

    row = env.client.get(VENDOR_ORDERS).json()[0]
    assert row["family_id"] is None
    assert row["distribution"]["distributed_at"]
    for field in ("recipient_name", "recipient_relation", "evidence_url", "notes"):
        assert row["distribution"][field] is None
    assert row["delivery_address"] == "Jl. Kenanga 12"
    assert row["facility_phone"] == "0211234"


def test_vendor_can_reject_only_unprocessed_orders(env):
    order_id = env.place_order()
    assert env.stock() == STOCK - 2
    assert env.client.post(f"{VENDOR_ORDERS}/{order_id}/reject", json={"reason": "x"}).status_code == 422

    rejected = env.client.post(f"{VENDOR_ORDERS}/{order_id}/reject", json={"reason": "Stok rusak di gudang"})
    assert rejected.status_code == 200, rejected.text
    assert rejected.json()["status"] == "rejected"
    assert rejected.json()["vendor_rejection_reason"] == "Stok rusak di gudang"
    assert env.stock() == STOCK
    assert env.allocation_statuses(order_id) == {"released"}

    shipped = env.dispatched_order()
    assert env.client.post(f"{VENDOR_ORDERS}/{shipped}/reject", json={"reason": "Berubah pikiran"}).status_code == 409


def test_unprocessed_orders_expire_after_three_days(env):
    stale, fresh = env.place_order(), env.place_order(1)
    assert env.stock() == STOCK - 3
    assert env.client.get(VENDOR_ORDERS).json()[0]["process_due_at"]
    with env.sessions() as db:
        order = next(row for row in db.query(Order).all() if str(row.id) == stale)
        order.created_at = datetime.utcnow() - timedelta(days=3, minutes=1)
        db.commit()
        assert expire_unprocessed_facility_orders(db) == 1

    rows = {row["id"]: row for row in env.client.get(VENDOR_ORDERS).json()}
    assert rows[stale]["status"] == "cancelled"
    assert "otomatis" in rows[stale]["allocation_reason"]
    assert rows[fresh]["status"] == "pending"
    assert env.stock() == STOCK - 1
    assert env.allocation_statuses(stale) == {"released"}
    assert env.allocation_statuses(fresh) == {"reserved"}


def test_discrepancy_loop_between_facility_and_vendor(env):
    order_id = env.dispatched_order()
    arrival = (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
    with env.sessions() as db:
        order = next(row for row in db.query(Order).all() if str(row.id) == order_id)
        order.dispatched_at = datetime.utcnow() - timedelta(days=6)
        db.commit()
    receipt_url = f"{ORDERS}/{order_id}/receipt"

    first = env.client.post(receipt_url, headers=HEADERS, json={"arrived_at": arrival, "items_complete": False, "notes": "Dua karung sobek"})
    assert first.status_code == 200, first.text

    repeat = env.client.post(receipt_url, headers=HEADERS, json={"arrived_at": arrival, "items_complete": False, "notes": "Masih kurang satu karung"})
    assert repeat.status_code == 200, repeat.text
    assert repeat.json()["discrepancy_notes"] == "Masih kurang satu karung"

    accepted = env.client.post(receipt_url, headers=HEADERS, json={"arrived_at": arrival, "items_complete": True})
    assert accepted.status_code == 200, accepted.text
    # The goods were complete only now, so the transfer deadline is not already past.
    assert datetime.fromisoformat(accepted.json()["payout_due_at"]) > datetime.now(timezone.utc) + timedelta(days=2)


def test_admin_resolves_stuck_shipment(env):
    order_id = env.dispatched_order()
    stock_after_dispatch = env.stock()
    assert env.client.post(f"{ADMIN_ORDERS}/{order_id}/cancel", json={"reason": "Barang hilang di jalan"}).status_code == 403

    env.identity.update(id=env.admin_user, role="admin")
    cancelled = env.client.post(f"{ADMIN_ORDERS}/{order_id}/cancel", json={"reason": "Barang hilang di jalan"})
    assert cancelled.status_code == 200, cancelled.text
    assert cancelled.json()["status"] == "cancelled"
    assert cancelled.json()["allocation_reason"] == "Dibatalkan Admin: Barang hilang di jalan"
    # Shipped goods left the vendor, so only the money goes back.
    assert env.stock() == stock_after_dispatch
    assert env.allocation_statuses(order_id) == {"released"}


def test_admin_cannot_cancel_received_order(env):
    order_id = env.dispatched_order()
    assert env.client.post(f"{ORDERS}/{order_id}/receipt", headers=HEADERS, json={"arrived_at": now_iso(), "items_complete": True}).status_code == 200
    env.identity.update(id=env.admin_user, role="admin")
    assert env.client.post(f"{ADMIN_ORDERS}/{order_id}/cancel", json={"reason": "Terlambat dibatalkan"}).status_code == 409


def test_order_requires_address_and_facility_can_add_it(env):
    with env.sessions() as db:
        db.get(HealthFacility, env.facility_id).address = "  "
        db.commit()
    blocked = env.submit_order()
    assert blocked.status_code == 409
    assert "alamat" in blocked.json()["detail"].lower()
    assert env.stock() == STOCK

    assert env.client.patch("/api/v1/facilities/me", headers=HEADERS, json={"address": "abc"}).status_code == 422
    updated = env.client.patch("/api/v1/facilities/me", headers=HEADERS, json={"address": "Jl. Melati 8", "phone": "0219999"})
    assert updated.status_code == 200, updated.text
    assert updated.json()["address"] == "Jl. Melati 8"
    assert env.place_order()
