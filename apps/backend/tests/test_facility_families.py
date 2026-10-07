"""Facility access stays scoped to one account, family and child."""

from uuid import UUID

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import get_db
from app.main import app
from app.models.facility import HealthFacility, RecipientFamily
from app.models.nutrition import FIESSurvey, NutritionMeasurement
from app.models.user import BeneficiaryProfile, Child, UserProfile
from app.services.supabase_auth import supabase_auth


def test_facility_family_assessments_and_ownership(monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    for model in (UserProfile, BeneficiaryProfile, HealthFacility, RecipientFamily, Child, NutritionMeasurement, FIESSurvey):
        model.__table__.create(engine)
    sessions = sessionmaker(bind=engine)
    identities = {
        "first": UUID("00000000-0000-0000-0000-000000000051"),
        "second": UUID("00000000-0000-0000-0000-000000000052"),
        "outsider": UUID("00000000-0000-0000-0000-000000000053"),
    }

    async def verify_token(token):
        return {"id": str(identities[token])}

    monkeypatch.setattr(supabase_auth, "verify_token", verify_token)
    with sessions() as db:
        for name in ("first", "second"):
            db.add(UserProfile(user_id=identities[name], full_name=name))
        db.flush()
        for name in ("first", "second"):
            db.add(HealthFacility(account_user_id=identities[name], name=name, approval_status="pending"))
        db.commit()

    def override_db():
        with sessions() as db:
            yield db

    app.dependency_overrides[get_db] = override_db
    try:
        client = TestClient(app)
        first = {"Authorization": "Bearer first"}
        second = {"Authorization": "Bearer second"}
        outsider = {"Authorization": "Bearer outsider"}
        payload = {"kk_number": "1234567890123456", "head_name": "Keluarga Mawar", "family_size": 3}

        assert client.post("/api/v1/facilities/families", json=payload, headers=outsider).status_code == 403
        assert client.post("/api/v1/facilities/families", json={**payload, "kk_number": "123"}, headers=first).status_code == 422
        created = client.post("/api/v1/facilities/families", json=payload, headers=first)
        assert created.status_code == 201, created.text
        family_id = created.json()["id"]
        path = f"/api/v1/facilities/families/{family_id}"
        assert client.post("/api/v1/facilities/families", json=payload, headers=second).status_code == 409
        assert client.get("/api/v1/facilities/families", headers=second).json() == []
        assert client.get(path, headers=second).status_code == 404
        assert client.put(path, json={"head_name": "Changed"}, headers=second).status_code == 404
        assert client.put(path, json={"head_name": "Keluarga Melati"}, headers=first).json()["head_name"] == "Keluarga Melati"

        child = client.post(f"{path}/children", json={
            "full_name": "Anak Mawar", "date_of_birth": "2024-01-01", "gender": "female"
        }, headers=first)
        assert child.status_code == 201, child.text
        child_id = child.json()["id"]
        child_path = f"{path}/children/{child_id}/measurements"
        assert client.get(f"{path}/children", headers=second).status_code == 404
        assert client.post(child_path, json={
            "child_id": child_id, "measurement_date": "2025-02-01", "weight": 10.5, "height": 80
        }, headers=second).status_code == 404
        measured = client.post(child_path, json={
            "child_id": child_id, "measurement_date": "2025-02-01", "weight": 10.5, "height": 80
        }, headers=first)
        assert measured.status_code == 201, measured.text
        assert client.get(child_path, headers=first).json()["data"]["measurements"][0]["child_id"] == child_id
        assert client.post(child_path, json={
            "child_id": child_id, "measurement_date": "2025-02-01", "weight": 10.5, "height": 80
        }, headers=first).status_code == 409

        survey = {"responses": {f"q{number}": 1 if number <= 3 else 0 for number in range(1, 9)}}
        assert client.post(f"{path}/fies", json=survey, headers=second).status_code == 404
        submitted = client.post(f"{path}/fies", json=survey, headers=first)
        assert submitted.status_code == 201, submitted.text
        assert submitted.json()["score"] == 3
        assert client.post(f"{path}/fies", json=survey, headers=first).status_code == 409
        assert len(client.get(f"{path}/fies", headers=first).json()) == 1
        assert client.get(f"{path}/fies", headers=second).status_code == 404

        with sessions() as db:
            assert db.query(RecipientFamily).count() == 1
            assert db.query(Child).filter_by(family_id=UUID(family_id), beneficiary_id=None).count() == 1
            assert db.query(NutritionMeasurement).filter_by(recorded_by_user_id=identities["first"]).count() == 1
            assert db.query(FIESSurvey).filter_by(recorded_by_user_id=identities["first"]).count() == 1
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()
