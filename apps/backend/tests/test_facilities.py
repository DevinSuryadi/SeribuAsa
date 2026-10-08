"""Facility accounts require verified Supabase identity and unique ownership."""

from uuid import UUID
from types import SimpleNamespace

from fastapi.testclient import TestClient
from gotrue.errors import AuthApiError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import get_db
from app.main import app
from app.models.facility import HealthFacility
from app.models.user import UserProfile
from app.services.supabase_auth import supabase_auth
from app.middleware import auth as auth_module
from app.api import facilities as facility_api


def test_facility_registration_and_account_access(monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    UserProfile.__table__.create(engine)
    HealthFacility.__table__.create(engine)
    session_factory = sessionmaker(bind=engine)
    identities = {
        "facility": {"id": "00000000-0000-0000-0000-000000000051", "user_metadata": {"role": "health_facility"}},
        "other": {"id": "00000000-0000-0000-0000-000000000052", "user_metadata": {"role": "donor"}},
    }

    async def verify_token(token):
        if token not in identities:
            raise ValueError("invalid token")
        return identities[token]

    monkeypatch.setattr(supabase_auth, "verify_token", verify_token)

    def override_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db
    try:
        client = TestClient(app)
        payload = {"full_name": "Admin Puskesmas", "name": "Puskesmas Melati", "address": "Jl. Melati"}
        facility_header = {"Authorization": "Bearer facility"}

        assert client.get("/api/v1/facilities/me").status_code == 403
        assert client.post("/api/v1/facilities/register", json=payload, headers={"Authorization": "Bearer invalid"}).status_code == 401
        assert client.post("/api/v1/facilities/register", json=payload, headers={"Authorization": "Bearer other"}).status_code == 403

        created = client.post("/api/v1/facilities/register", json=payload, headers=facility_header)
        assert created.status_code == 201, created.text
        assert created.json()["name"] == "Puskesmas Melati"
        assert created.json()["approval_status"] == "pending"
        assert client.post("/api/v1/facilities/register", json=payload, headers=facility_header).json()["id"] == created.json()["id"]
        assert client.get("/api/v1/facilities/me", headers=facility_header).json()["id"] == created.json()["id"]
        assert client.get("/api/v1/facilities/me", headers={"Authorization": "Bearer other"}).status_code == 404

        with session_factory() as db:
            assert db.query(HealthFacility).count() == 1
            assert db.query(UserProfile).filter_by(user_id=UUID(identities["facility"]["id"])).count() == 1
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()


def test_facility_cannot_use_legacy_order_endpoints(monkeypatch):
    async def verify_token(_token):
        return {
            "id": "00000000-0000-0000-0000-000000000051",
            "email": "faskes@example.com",
            "email_confirmed_at": "2026-01-01",
            "user_metadata": {"role": "health_facility"},
        }

    monkeypatch.setattr(supabase_auth, "verify_token", verify_token)
    monkeypatch.setattr(auth_module, "_resolve_role_from_db", lambda _user_id, _fallback: "health_facility")
    response = TestClient(app).get("/api/v1/orders/", headers={"Authorization": "Bearer facility"})
    assert response.status_code == 403


def test_facility_signup_creates_confirmed_auth_user_and_profile(monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    UserProfile.__table__.create(engine)
    HealthFacility.__table__.create(engine)
    session_factory = sessionmaker(bind=engine)
    user_id = UUID("00000000-0000-0000-0000-000000000053")

    class Admin:
        def create_user(self, attributes):
            assert attributes["email_confirm"] is True
            assert attributes["user_metadata"]["role"] == "health_facility"
            assert attributes["user_metadata"]["facility_name"] == "Puskesmas Mawar"
            assert attributes["password"] == "Password1!"
            return SimpleNamespace(user=SimpleNamespace(id=user_id))

    monkeypatch.setattr(facility_api.settings, "SUPABASE_SERVICE_KEY", "test-service-key")
    monkeypatch.setattr(facility_api, "create_client", lambda _url, _key: SimpleNamespace(auth=SimpleNamespace(admin=Admin())))

    def override_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db
    try:
        client = TestClient(app)
        response = client.post("/api/v1/facilities/signup", json={
            "email": "faskes@example.com", "password": "Password1!", "name": "Puskesmas Mawar",
        })
        assert response.status_code == 201, response.text
        assert response.json()["user_id"] == str(user_id)
        with session_factory() as db:
            facility = db.query(HealthFacility).filter_by(account_user_id=user_id).one()
            assert facility.name == "Puskesmas Mawar"
            assert facility.approval_status == "pending"
            assert db.query(UserProfile).filter_by(user_id=user_id).count() == 1

        def duplicate_client(_url, _key):
            class DuplicateAdmin:
                def create_user(self, _attributes):
                    raise AuthApiError("Email already registered", 422, "email_exists")
            return SimpleNamespace(auth=SimpleNamespace(admin=DuplicateAdmin()))

        monkeypatch.setattr(facility_api, "create_client", duplicate_client)
        duplicate = client.post("/api/v1/facilities/signup", json={
            "email": "faskes@example.com", "password": "Password1!", "name": "Puskesmas Mawar",
        })
        assert duplicate.status_code == 409
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()
