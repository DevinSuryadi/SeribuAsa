"""Each family receives food aid within a weekly quota sized by FIES level and 1000-day beneficiaries."""

from datetime import date, datetime, timedelta
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
from app.models.user import BeneficiaryProfile, Child, DonorProfile, GenderEnum, UserProfile, VendorProfile
from app.services.family_aid_quota import (
    MISSING_SURVEY_MESSAGE,
    NO_BENEFICIARY_MESSAGE,
    aid_week,
    calculate_family_aid_quota,
)
from app.services.pregnancy import expected_birth_date
from app.services.supabase_auth import supabase_auth
from tests.aid_eligibility import AID_ELIGIBILITY_MODELS, add_fies_survey

ORDERS = "/api/v1/facilities/orders"
VENDOR_ORDERS = "/api/v1/vendor/facility-orders"
HEADERS = {"Authorization": "Bearer facility"}
PRICE = 10000


@pytest.fixture()
def env(monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    for model in (
        UserProfile, BeneficiaryProfile, DonorProfile, VendorProfile, HealthFacility, RecipientFamily,
        Category, Product, Donation, Order, OrderItem, FacilityOrderReceipt, FacilityVendorPayout,
        OrderFundingAllocation, AidDistribution, AidDistributionItem, *AID_ELIGIBILITY_MODELS,
    ):
        model.__table__.create(engine)
    sessions = sessionmaker(bind=engine)
    facility_user, vendor_user, donor_user = uuid4(), uuid4(), uuid4()

    async def verify_token(token):
        return {"id": str(facility_user)}

    monkeypatch.setattr(supabase_auth, "verify_token", verify_token)
    with sessions() as db:
        for user_id in (facility_user, vendor_user, donor_user):
            db.add(UserProfile(user_id=user_id, full_name="Pengguna"))
        db.flush()
        db.add(DonorProfile(user_id=donor_user))
        db.flush()
        db.add(Donation(donor_id=donor_user, amount=5_000_000, status=DonationStatusEnum.success, funding_flow="pooled"))
        facility = HealthFacility(
            account_user_id=facility_user, name="Faskes A", address="Jl. Kenanga 12", approval_status="approved"
        )
        vendor = VendorProfile(user_id=vendor_user, store_name="Toko A", store_address="Jalan A", approval_status="approved")
        db.add_all([facility, vendor])
        db.flush()
        family = RecipientFamily(health_facility_id=facility.id, kk_number="1234567890123456", head_name="Keluarga A")
        product = Product(
            vendor_id=vendor_user, name="Beras", price=PRICE, voucher_price=PRICE, stock_quantity=100,
            approval_status="approved", service_province_code="15", service_regency_code="15.71",
        )
        db.add_all([family, product])
        db.commit()
        family_id, product_id = family.id, product.id

    def override_db():
        with sessions() as db:
            yield db

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        user_id=vendor_user, email="vendor@example.org", role="vendor"
    )
    client = TestClient(app)

    def order(quantity):
        return client.post(ORDERS, headers=HEADERS, json={
            "family_id": str(family_id), "vendor_id": str(vendor_user), "service_province_code": "15",
            "service_regency_code": "15.71", "client_request_id": str(uuid4()),
            "items": [{"product_id": str(product_id), "quantity": quantity}],
        })

    def quota():
        response = client.get(f"/api/v1/facilities/families/{family_id}/aid-quota", headers=HEADERS)
        assert response.status_code == 200, response.text
        return response.json()

    def add_child(**fields):
        with sessions() as db:
            db.add(Child(family_id=family_id, full_name="Anak", **fields))
            db.commit()

    def add_toddler(age_days=180):
        add_child(date_of_birth=date.today() - timedelta(days=age_days), gender=GenderEnum.male)

    def add_survey(classification):
        with sessions() as db:
            add_fies_survey(db, db.get(RecipientFamily, family_id), classification)
            db.commit()

    yield SimpleNamespace(
        client=client, sessions=sessions, family_id=family_id, order=order, quota=quota,
        add_child=add_child, add_toddler=add_toddler, add_survey=add_survey,
    )
    app.dependency_overrides.clear()


def test_family_without_fies_survey_cannot_order(env):
    env.add_toddler()

    response = env.order(1)

    assert response.status_code == 409
    assert response.json()["detail"] == MISSING_SURVEY_MESSAGE
    quota = env.quota()
    assert quota["eligible"] is False
    assert quota["blocked_reason"] == MISSING_SURVEY_MESSAGE


def test_family_without_thousand_day_beneficiary_cannot_order(env):
    env.add_survey("severe")
    env.add_toddler(age_days=3 * 365)

    response = env.order(1)

    assert response.status_code == 409
    assert response.json()["detail"] == NO_BENEFICIARY_MESSAGE
    assert env.quota()["beneficiaries"] == 0


@pytest.mark.parametrize(
    ("classification", "weekly_limit"),
    [("severe", 200000), ("moderate", 150000), ("food_secure", 100000)],
)
def test_weekly_limit_follows_fies_level_and_number_of_children(env, classification, weekly_limit):
    env.add_survey(classification)
    env.add_toddler()
    env.add_toddler(age_days=400)

    over_limit = env.order(weekly_limit // PRICE + 1)
    assert over_limit.status_code == 409
    assert "melebihi sisa kuota mingguan keluarga" in over_limit.json()["detail"]

    assert env.order(weekly_limit // PRICE).status_code == 201
    quota = env.quota()
    assert quota["weekly_limit"] == weekly_limit
    assert quota["children_under_two"] == 2
    assert quota["remaining_amount"] == 0
    assert env.order(1).status_code == 409


def test_child_in_the_womb_counts_as_a_beneficiary(env):
    env.add_survey("moderate")
    last_period = date.today() - timedelta(weeks=12)
    env.add_child(mother_name="Siti", last_menstrual_period=last_period, expected_birth_date=expected_birth_date(last_period))

    quota = env.quota()

    assert quota["eligible"] is True
    assert quota["unborn_children"] == 1
    assert quota["weekly_limit"] == 75000
    assert env.order(7).status_code == 201


def test_cancelled_and_rejected_orders_return_their_quota(env):
    env.add_survey("severe")
    env.add_toddler()

    first = env.order(10)
    assert first.status_code == 201
    assert env.order(1).status_code == 409
    cancelled = env.client.post(f"{ORDERS}/{first.json()['id']}/cancel", headers=HEADERS)
    assert cancelled.status_code == 200, cancelled.text
    assert env.quota()["remaining_amount"] == 100000

    second = env.order(10)
    assert second.status_code == 201
    rejected = env.client.post(f"{VENDOR_ORDERS}/{second.json()['id']}/reject", json={"reason": "Stok rusak di gudang"})
    assert rejected.status_code == 200, rejected.text
    assert env.quota()["used_amount"] == 0
    assert env.order(10).status_code == 201


def test_orders_from_previous_week_do_not_use_this_week_quota(env):
    env.add_survey("severe")
    env.add_toddler()
    placed = env.order(10)
    assert placed.status_code == 201

    with env.sessions() as db:
        db.get(Order, UUID(placed.json()["id"])).created_at = datetime.utcnow() - timedelta(days=7)
        db.commit()

    assert env.quota()["used_amount"] == 0
    assert env.order(10).status_code == 201


def test_child_stops_counting_on_second_birthday(env):
    env.add_survey("severe")
    today = date(2026, 11, 11)
    env.add_child(date_of_birth=date(2024, 11, 12), gender=GenderEnum.female)

    with env.sessions() as db:
        assert calculate_family_aid_quota(db, env.family_id, today=today).children_under_two == 1
        assert calculate_family_aid_quota(db, env.family_id, today=today + timedelta(days=1)).children_under_two == 0


def test_aid_week_runs_from_monday_to_sunday():
    assert aid_week(date(2026, 11, 11)) == (date(2026, 11, 9), date(2026, 11, 15))
    assert aid_week(date(2026, 11, 9)) == (date(2026, 11, 9), date(2026, 11, 15))
    assert aid_week(date(2026, 11, 15)) == (date(2026, 11, 9), date(2026, 11, 15))
