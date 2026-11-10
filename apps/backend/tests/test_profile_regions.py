"""Profile regions, ownership, and local vendor catalog filtering."""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.facilities import verified_facility_identity
from app.database import Base, get_db
from app.main import app
from app.middleware.auth import AuthenticatedUser, get_current_user
from app.models.facility import HealthFacility
from app.models.product import Product
from app.models.user import UserProfile, VendorProfile
from app.schemas.region import ProfileRegion


@pytest.fixture
def regional_accounts():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine, autoflush=False)
    vendor_id, second_vendor_id, remote_vendor_id, facility_id = [uuid4() for _ in range(4)]
    identity = {"id": vendor_id, "role": "vendor"}
    with sessions() as db:
        for user_id in (vendor_id, second_vendor_id, remote_vendor_id, facility_id):
            db.add(UserProfile(user_id=user_id, full_name="Regional account"))
        db.flush()
        for user_id, regency in (
            (vendor_id, "15.71"), (second_vendor_id, "15.71"), (remote_vendor_id, "15.72"),
        ):
            db.add(VendorProfile(
                user_id=user_id, store_name=str(user_id), store_address="Alamat toko",
                province_code="15", regency_code=regency, approval_status="approved",
            ))
        db.add(HealthFacility(
            account_user_id=facility_id, name="Faskes A", approval_status="approved",
            province_code="15", regency_code="15.71",
        ))
        db.flush()
        for user_id in (vendor_id, second_vendor_id, remote_vendor_id):
            db.add(Product(
                vendor_id=user_id, name=str(user_id), price=10000, voucher_price=10000,
                stock_quantity=5, approval_status="approved",
                service_province_code="15", service_regency_code="15.71",
            ))
        db.commit()

    def override_db():
        with sessions() as db:
            yield db

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        user_id=identity["id"], email="account@example.org", role=identity["role"],
    )
    app.dependency_overrides[verified_facility_identity] = lambda: {
        "id": str(facility_id), "user_metadata": {"role": "health_facility"},
    }
    try:
        yield TestClient(app), sessions, identity, vendor_id, second_vendor_id, remote_vendor_id, facility_id
    finally:
        for dependency in (get_db, get_current_user, verified_facility_identity):
            app.dependency_overrides.pop(dependency, None)
        engine.dispose()


@pytest.mark.parametrize("province,regency", [("11", "15.71"), ("15", None), (None, "15.71"), ("99", "99.99")])
def test_profile_region_rejects_invalid_pairs(province, regency):
    with pytest.raises(ValidationError):
        ProfileRegion(province_code=province, regency_code=regency)


def test_vendor_profile_region_updates_are_owned_and_validated(regional_accounts):
    client, sessions, _, vendor_id, second_vendor_id, _, _ = regional_accounts
    url = f"/api/v1/users/{vendor_id}"
    assert client.patch(f"/api/v1/users/{second_vendor_id}", json={
        "province_code": "15", "regency_code": "15.72",
    }).status_code == 403
    assert client.patch(url, json={"province_code": "11", "regency_code": "15.71"}).status_code == 422
    response = client.patch(url, json={"province_code": "15", "regency_code": "15.72"})
    assert response.status_code == 200, response.text
    assert response.json()["regency_code"] == "15.72"
    assert response.json()["province_name"]
    assert response.json()["regency_name"]
    assert client.patch(url, json={"full_name": "Updated account"}).json()["regency_code"] == "15.72"
    with sessions() as db:
        assert db.query(VendorProfile).filter_by(user_id=vendor_id).one().regency_code == "15.72"


def test_facility_profile_updates_catalog_defaults_and_delivery_address(regional_accounts):
    client, sessions, identity, _, _, _, facility_id = regional_accounts
    identity.update(id=facility_id, role="health_facility")
    response = client.patch("/api/v1/facilities/me", json={
        "province_code": "15", "regency_code": "15.72", "address": "Alamat pengiriman baru",
    })
    assert response.status_code == 200, response.text
    facility = client.get("/api/v1/facilities/me").json()
    assert facility["regency_code"] == "15.72"
    assert facility["address"] == "Alamat pengiriman baru"
    with sessions() as db:
        assert db.query(HealthFacility).filter_by(account_user_id=facility_id).one().province_code == "15"


def test_local_catalog_uses_vendor_location_and_keeps_pagination_consistent(regional_accounts):
    client, _, _, vendor_id, second_vendor_id, _, _ = regional_accounts
    vendors = client.get("/api/v1/facilities/catalog/vendors?province_code=15&regency_code=15.71")
    assert vendors.status_code == 200, vendors.text
    assert {row["id"] for row in vendors.json()} == {str(vendor_id), str(second_vendor_id)}
    response = client.get("/api/v1/products/?service_regency_code=15.71&vendor_regency_code=15.71&page_size=1")
    assert response.status_code == 200, response.text
    assert response.json()["total"] == 2
    assert response.json()["total_pages"] == 2
    assert len(response.json()["items"]) == 1
    assert response.json()["items"][0]["vendor_id"] in {str(vendor_id), str(second_vendor_id)}
    assert client.get("/api/v1/products/?vendor_regency_code=invalid").status_code == 422


def test_vendor_signup_retains_selected_region(regional_accounts):
    client, sessions, identity, *_ = regional_accounts
    user_id = uuid4()
    identity.update(id=user_id, role="vendor")
    response = client.post("/api/v1/users/signup", json={
        "user_id": str(user_id), "full_name": "New vendor", "role": "vendor",
        "province_code": "15", "regency_code": "15.72",
    })
    assert response.status_code == 201, response.text
    with sessions() as db:
        vendor = db.query(VendorProfile).filter_by(user_id=user_id).one()
        assert (vendor.province_code, vendor.regency_code) == ("15", "15.72")


def test_facility_registration_fills_region_for_auth_trigger_created_profile(regional_accounts):
    client, sessions, _, _, _, _, facility_id = regional_accounts
    with sessions() as db:
        facility = db.query(HealthFacility).filter_by(account_user_id=facility_id).one()
        facility.province_code = None
        facility.regency_code = None
        db.commit()
    response = client.post("/api/v1/facilities/register", json={
        "full_name": "Facility account", "name": "Faskes A",
        "province_code": "15", "regency_code": "15.71",
    })
    assert response.status_code == 201, response.text
    assert response.json()["regency_code"] == "15.71"


def test_google_vendor_onboarding_retains_selected_region(regional_accounts, monkeypatch):
    client, sessions, *_ = regional_accounts
    user_id = uuid4()
    with sessions() as db:
        db.add(UserProfile(user_id=user_id, full_name="Google vendor"))
        db.commit()

    async def resolve_token(_token):
        return {"id": str(user_id), "email": "google@example.org"}

    monkeypatch.setattr("app.api.auth._resolve_google_sync_token_data", resolve_token)
    response = client.post("/api/v1/auth/complete-onboarding", headers={"Authorization": "Bearer google"}, json={
        "role": "vendor", "province_code": "15", "regency_code": "15.71",
    })
    assert response.status_code == 200, response.text
    with sessions() as db:
        assert db.query(VendorProfile).filter_by(user_id=user_id).one().regency_code == "15.71"
