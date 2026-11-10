"""Facility profiles use their own verified account API, including pending accounts."""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.middleware import auth
from app.models.facility import HealthFacility
from app.models.user import UserProfile
from app.services.supabase_auth import supabase_auth


@pytest.fixture
def facility_profile_client(monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine)
    owner_id, other_id, unregistered_id = [uuid4() for _ in range(3)]
    with sessions() as db:
        db.add_all([
            UserProfile(user_id=owner_id, full_name="Admin Faskes", phone="08123456789", address="Alamat lama"),
            UserProfile(user_id=other_id, full_name="Admin lain"),
            UserProfile(user_id=unregistered_id, full_name="Akun tanpa fasilitas"),
        ])
        db.flush()
        db.add_all([
            HealthFacility(
                account_user_id=owner_id, name="Puskesmas Melati", approval_status="pending",
                phone="08123456789", address="Alamat lama", province_code="15", regency_code="15.71",
            ),
            HealthFacility(account_user_id=other_id, name="Faskes lain", approval_status="approved"),
        ])
        db.commit()

    identities = {"owner": owner_id, "other": other_id, "unregistered": unregistered_id}

    async def verify_token(token):
        if token not in identities:
            raise ValueError("Invalid session")
        return {
            "id": str(identities[token]), "email": f"{token}@example.org",
            "user_metadata": {"role": "health_facility"},
        }

    def override_db():
        with sessions() as db:
            yield db

    monkeypatch.setattr(supabase_auth, "verify_token", verify_token)
    monkeypatch.setattr(auth, "SessionLocal", sessions)
    app.dependency_overrides[get_db] = override_db
    try:
        yield TestClient(app), sessions, owner_id, other_id
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()


HEADERS = {"Authorization": "Bearer owner", "Origin": "http://localhost:5173"}


def test_facility_loads_and_updates_profile_with_real_authorization(facility_profile_client):
    client, sessions, owner_id, other_id = facility_profile_client
    response = client.get("/api/v1/facilities/me", headers=HEADERS)
    assert response.status_code == 200, response.text
    assert response.json()["full_name"] == "Admin Faskes"
    assert response.json()["approval_status"] == "pending"
    assert response.json()["regency_name"]
    assert response.headers["access-control-allow-origin"] == HEADERS["Origin"]

    response = client.patch("/api/v1/facilities/me", headers=HEADERS, json={
        "full_name": " Admin Melati ", "phone": " 08987654321 ", "address": " Alamat baru ",
        "province_code": "15", "regency_code": "15.72",
    })
    assert response.status_code == 200, response.text
    assert response.headers["access-control-allow-origin"] == HEADERS["Origin"]
    assert response.json()["full_name"] == "Admin Melati"
    assert response.json()["phone"] == "08987654321"
    assert response.json()["address"] == "Alamat baru"
    assert response.json()["regency_code"] == "15.72"
    assert response.json()["province_name"]
    assert "date_of_birth" not in response.json()
    assert "gender" not in response.json()

    assert client.get("/api/v1/facilities/me", headers=HEADERS).json() == response.json()
    with sessions() as db:
        account = db.query(UserProfile).filter_by(user_id=owner_id).one()
        facility = db.query(HealthFacility).filter_by(account_user_id=owner_id).one()
        assert account.full_name == "Admin Melati"
        assert account.phone == facility.phone == "08987654321"
        assert account.address == facility.address == "Alamat baru"
        assert facility.approval_status == "pending"
        assert db.query(UserProfile).filter_by(user_id=other_id).one().full_name == "Admin lain"

    partial = client.patch("/api/v1/facilities/me", headers=HEADERS, json={"phone": None})
    assert partial.status_code == 200, partial.text
    assert partial.json()["phone"] is None
    assert partial.json()["regency_code"] == "15.72"
    assert partial.json()["full_name"] == "Admin Melati"


@pytest.mark.parametrize("payload", [
    {"full_name": " "}, {"full_name": None},
    {"province_code": "11", "regency_code": "15.71"},
    {"province_code": "15"}, {"regency_code": "15.71"},
    {"approval_status": "approved"}, {"account_user_id": str(uuid4())},
    {"date_of_birth": "2000-01-01"}, {"gender": "male"},
])
def test_facility_rejects_invalid_or_uneditable_fields(facility_profile_client, payload):
    client, sessions, owner_id, _ = facility_profile_client
    response = client.patch("/api/v1/facilities/me", headers=HEADERS, json=payload)
    assert response.status_code == 422, response.text
    assert response.headers["access-control-allow-origin"] == HEADERS["Origin"]
    with sessions() as db:
        assert db.query(UserProfile).filter_by(user_id=owner_id).one().full_name == "Admin Faskes"
        assert db.query(HealthFacility).filter_by(account_user_id=owner_id).one().regency_code == "15.71"


def test_facility_profile_requires_an_active_owned_account(facility_profile_client):
    client, sessions, owner_id, _ = facility_profile_client
    for method in (client.get, client.patch):
        kwargs = {"json": {"full_name": "Updated"}} if method == client.patch else {}
        assert method("/api/v1/facilities/me", **kwargs).status_code == 403
        assert method("/api/v1/facilities/me", headers={"Authorization": "Bearer invalid"}, **kwargs).status_code == 401
        assert method("/api/v1/facilities/me", headers={"Authorization": "Bearer unregistered"}, **kwargs).status_code == 404

    denied = client.patch(f"/api/v1/users/{owner_id}", headers=HEADERS, json={"full_name": "Updated"})
    assert denied.status_code == 403
    assert denied.headers["access-control-allow-origin"] == HEADERS["Origin"]

    with sessions() as db:
        db.query(HealthFacility).filter_by(account_user_id=owner_id).one().is_active = False
        db.commit()
    assert client.get("/api/v1/facilities/me", headers=HEADERS).status_code == 404
    assert client.patch("/api/v1/facilities/me", headers=HEADERS, json={"phone": "08987654321"}).status_code == 404


@pytest.mark.parametrize("method", ["GET", "PATCH"])
def test_database_errors_return_json_with_cors_headers(facility_profile_client, method):
    client, *_ = facility_profile_client

    def unavailable_db():
        raise OperationalError("SELECT", {}, Exception("Database unavailable"))

    app.dependency_overrides[get_db] = unavailable_db
    kwargs = {"json": {"full_name": "Updated"}} if method == "PATCH" else {}
    response = client.request(method, "/api/v1/facilities/me", headers=HEADERS, **kwargs)
    assert response.status_code == 500
    assert response.headers["access-control-allow-origin"] == HEADERS["Origin"]
    assert response.json() == {"detail": "Gagal mengakses data. Silakan coba lagi."}
