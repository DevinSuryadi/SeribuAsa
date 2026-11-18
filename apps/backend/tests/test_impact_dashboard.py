"""Impact attribution, donation cohorts, and role isolation against a real DB."""
from datetime import date, datetime
from decimal import Decimal
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.middleware.auth import AuthenticatedUser, get_current_user
from app.models.donation import Donation
from app.models.facility import AidDistribution, AidDistributionItem, HealthFacility, OrderFundingAllocation, RecipientFamily
from app.models.product import Order, OrderItem, Product
from app.models.user import UserProfile, DonorProfile, VendorProfile
from app.services.impact_dashboard import generate_dashboard


@pytest.fixture()
def impact_db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        a, b, vendor = uuid4(), uuid4(), uuid4()
        db.add_all([UserProfile(user_id=i, full_name="Test") for i in (a, b, vendor)])
        db.flush()
        db.add_all([DonorProfile(user_id=a), DonorProfile(user_id=b), VendorProfile(user_id=vendor, store_name="Toko", store_address="Alamat")])
        facility = HealthFacility(account_user_id=vendor, name="Faskes", province_code="15", regency_code="15.71")
        db.add(facility)
        db.flush()
        family = RecipientFamily(health_facility_id=facility.id, head_name="PRIVATE FAMILY", kk_number="1234567890123456")
        product = Product(vendor_id=vendor, name="Beras", price=100, voucher_price=100, stock_quantity=50)
        db.add_all([family, product])
        db.flush()
        # UTC January 31, but February 1 in WIB.
        donations = [Donation(donor_id=owner, amount=amount, status=status, funding_flow=flow,
                              created_at=datetime(2026, 1, 31, 18)) for owner, amount, status, flow in (
            (a, 100, "success", "pooled"), (b, 300, "success", "pooled"),
            (a, 999, "pending", "pooled"), (a, 40, "success", "legacy_wallet"),
        )]
        db.add_all(donations)
        order = Order(vendor_id=vendor, family_id=family.id, health_facility_id=facility.id,
                      order_flow="facility_delivery", total_amount=400, status="received")
        db.add(order)
        db.flush()
        item = OrderItem(order_id=order.id, product_id=product.id, quantity=4, price=100, subtotal=400)
        distribution = AidDistribution(order_id=order.id, family_id=family.id, recorded_by_user_id=vendor,
                                       recipient_name="PRIVATE RECIPIENT", items_complete=False)
        db.add_all([item, distribution])
        db.flush()
        db.add(AidDistributionItem(distribution_id=distribution.id, order_item_id=item.id, order_id=order.id, quantity=2))
        for donation, amount in zip(donations[:2], (100, 300)):
            db.add(OrderFundingAllocation(donation_id=donation.id, order_id=order.id, amount=amount, status="spent"))
        db.commit()
        yield db, a, b
    engine.dispose()


def test_shared_funding_partial_distribution_and_timezone(impact_db):
    db, a, b = impact_db
    report = generate_dashboard(db, date(2026, 2, 1), date(2026, 2, 1), str(a))
    assert report["summary"]["received"] == 140
    assert report["summary"]["legacy_received"] == 40
    assert report["summary"]["spent"] == 100
    assert report["summary"]["distributed"] == Decimal("50.00")
    assert report["summary"]["families"] == 1
    assert report["trend"] == [{"month": "2026-02", "amount": Decimal("140"), "count": 2}]
    assert generate_dashboard(db, None, date(2026, 2, 1), str(b))["summary"]["distributed"] == 150
    platform = generate_dashboard(db, None, date(2026, 2, 1), None)
    assert platform["summary"]["distributed"] == 200
    assert platform["summary"]["families"] == 1
    assert platform["summary"]["distributions"] == 1
    assert platform["regions"][0]["amount"] == 200
    assert generate_dashboard(db, None, date(2026, 1, 31), None)["summary"]["received"] == 0


def test_released_inactive_and_failed_donations_excluded(impact_db):
    db, a, _ = impact_db
    allocation = db.query(OrderFundingAllocation).join(Donation).filter(Donation.donor_id == a).one()
    allocation.status = "released"
    db.flush()
    summary = generate_dashboard(db, None, date(2026, 2, 1), str(a))["summary"]
    assert summary["spent"] == summary["distributed"] == 0
    assert summary["available"] == 100
    allocation.status = "reserved"
    db.flush()
    summary = generate_dashboard(db, None, date(2026, 2, 1), str(a))["summary"]
    assert summary["reserved"] == 100
    assert summary["available"] == 0
    allocation.is_active = False
    db.flush()
    assert generate_dashboard(db, None, date(2026, 2, 1), str(a))["summary"]["reserved"] == 0


def test_endpoint_role_isolation_validation_and_privacy(impact_db):
    db, a, _ = impact_db
    app.dependency_overrides[get_db] = lambda: db
    role = ["donor"]
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(user_id=str(a), email="test@example.org", role=role[0])
    try:
        client = TestClient(app)
        url = "/api/v1/reports/impact-dashboard?end_date=2026-02-01"
        response = client.get(url)
        assert response.status_code == 200, response.text
        assert response.json()["scope"] == "personal"
        assert Decimal(response.json()["summary"]["received"]) == 140
        assert "PRIVATE" not in response.text
        assert "kk_number" not in response.text
        assert client.get(url + "&start_date=2026-02-02").status_code == 422
        role[0] = "admin"
        response = client.get(url)
        assert response.json()["scope"] == "platform"
        assert Decimal(response.json()["summary"]["received"]) == 440
        for denied in ("vendor", "health_facility", "beneficiary"):
            role[0] = denied
            assert client.get(url).status_code == 403
    finally:
        app.dependency_overrides.clear()
