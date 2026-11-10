"""Children registered in the womb are monitored through pregnancy and continue as toddlers after birth."""

from datetime import date, timedelta
from decimal import Decimal
from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import get_db
from app.main import app
from app.models.facility import HealthFacility, RecipientFamily
from app.models.nutrition import FIESSurvey, NutritionMeasurement, PrenatalMeasurement
from app.models.user import BeneficiaryProfile, Child, UserProfile
from app.services.pregnancy import PrenatalClassification, assess_prenatal_check
from app.services.supabase_auth import supabase_auth
from app.utils.local_time import wib_today

HEADERS = {"Authorization": "Bearer facility"}


@pytest.fixture()
def env(monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    for model in (
        UserProfile, BeneficiaryProfile, HealthFacility, RecipientFamily, Child,
        NutritionMeasurement, PrenatalMeasurement, FIESSurvey,
    ):
        model.__table__.create(engine)
    sessions = sessionmaker(bind=engine)
    facility_user = uuid4()

    async def verify_token(token):
        return {"id": str(facility_user)}

    monkeypatch.setattr(supabase_auth, "verify_token", verify_token)
    with sessions() as db:
        db.add(UserProfile(user_id=facility_user, full_name="Faskes A"))
        db.flush()
        facility = HealthFacility(account_user_id=facility_user, name="Faskes A", approval_status="approved")
        db.add(facility)
        db.flush()
        family = RecipientFamily(health_facility_id=facility.id, kk_number="1234567890123456", head_name="Keluarga A")
        db.add(family)
        db.commit()
        family_id = family.id

    def override_db():
        with sessions() as db:
            yield db

    app.dependency_overrides[get_db] = override_db
    client = TestClient(app)
    base = f"/api/v1/facilities/families/{family_id}"
    today = wib_today()

    def register(weeks_pregnant=12, **fields):
        payload = {"mother_name": "Siti", "last_menstrual_period": (today - timedelta(weeks=weeks_pregnant)).isoformat(), **fields}
        return client.post(f"{base}/children/unborn", headers=HEADERS, json=payload)

    def check(child_id, **fields):
        payload = {"measurement_date": today.isoformat(), "maternal_weight": 58, "maternal_muac": 25, **fields}
        return client.post(f"{base}/children/{child_id}/prenatal-measurements", headers=HEADERS, json=payload)

    def history(child_id):
        response = client.get(f"{base}/children/{child_id}/prenatal-measurements", headers=HEADERS)
        assert response.status_code == 200, response.text
        return response.json()

    def children():
        response = client.get(f"{base}/children", headers=HEADERS)
        assert response.status_code == 200, response.text
        return response.json()

    def toddler_measurement(child_id, measured_on):
        return client.post(f"{base}/children/{child_id}/measurements", headers=HEADERS, json={
            "child_id": child_id, "measurement_date": measured_on.isoformat(), "weight": 3.4, "height": 50,
        })

    def record_birth(child_id, born_on, name="Ayu"):
        return client.post(f"{base}/children/{child_id}/birth", headers=HEADERS, json={
            "full_name": name, "date_of_birth": born_on.isoformat(), "gender": "female",
        })

    def move_pregnancy_back(child_id, days):
        """Simulate time passing by shifting the pregnancy dates into the past."""
        with sessions() as db:
            child = db.get(Child, UUID(child_id))
            child.last_menstrual_period -= timedelta(days=days)
            child.expected_birth_date -= timedelta(days=days)
            for measurement in child.prenatal_measurements:
                measurement.measurement_date -= timedelta(days=days)
            db.commit()

    yield SimpleNamespace(
        client=client, base=base, today=today, register=register, check=check, history=history,
        children=children, toddler_measurement=toddler_measurement, record_birth=record_birth,
        move_pregnancy_back=move_pregnancy_back,
    )
    app.dependency_overrides.clear()


def test_registers_child_in_the_womb_with_pregnancy_timeline(env):
    response = env.register(weeks_pregnant=12)

    assert response.status_code == 201, response.text
    child = response.json()
    last_period = env.today - timedelta(weeks=12)
    assert child["status"] == "unborn"
    assert child["full_name"] == "Bayi Ny. Siti"
    assert child["mother_name"] == "Siti"
    assert child["date_of_birth"] is None
    assert child["age_months"] is None
    assert child["gestational_age_weeks"] == 12
    assert child["expected_birth_date"] == (last_period + timedelta(days=280)).isoformat()
    assert child["birth_details_pending"] is True
    assert env.children()[0]["id"] == child["id"]


@pytest.mark.parametrize("weeks_pregnant", [-1, 40])
def test_rejects_last_period_outside_an_ongoing_pregnancy(env, weeks_pregnant):
    assert env.register(weeks_pregnant=weeks_pregnant).status_code == 422


def test_records_antenatal_checks_and_flags_readings_that_need_follow_up(env):
    child_id = env.register(weeks_pregnant=24).json()["id"]

    normal = env.check(child_id, fundal_height=24, fetal_heart_rate=140, estimated_fetal_weight=600)
    assert normal.status_code == 201, normal.text
    assert normal.json()["classification"] == "normal"
    assert normal.json()["gestational_age_weeks"] == 24
    assert normal.json()["findings"] == []

    duplicate = env.check(child_id)
    assert duplicate.status_code == 409

    earlier = (env.today - timedelta(weeks=4)).isoformat()
    flagged = env.check(child_id, measurement_date=earlier, maternal_muac=22, fundal_height=27)
    assert flagged.status_code == 201, flagged.text
    assert flagged.json()["classification"] == "needs_review"
    assert len(flagged.json()["findings"]) == 2

    before_pregnancy = (env.today - timedelta(weeks=30)).isoformat()
    assert env.check(child_id, measurement_date=before_pregnancy).status_code == 422

    measurements = env.history(child_id)["measurements"]
    assert [item["id"] for item in measurements] == [normal.json()["id"], flagged.json()["id"]]


def test_toddler_measurements_wait_until_the_child_is_born(env):
    child_id = env.register().json()["id"]

    blocked = env.toddler_measurement(child_id, env.today)

    assert blocked.status_code == 409
    assert "masih dalam kandungan" in blocked.json()["detail"]


def test_recording_birth_turns_the_child_into_a_toddler_and_keeps_pregnancy_history(env):
    child_id = env.register(weeks_pregnant=38).json()["id"]
    check_id = env.check(child_id, measurement_date=(env.today - timedelta(days=3)).isoformat()).json()["id"]

    assert env.record_birth(child_id, env.today - timedelta(days=4)).status_code == 422
    born = env.record_birth(child_id, env.today - timedelta(days=1))

    assert born.status_code == 200, born.text
    assert born.json()["status"] == "born"
    assert born.json()["full_name"] == "Ayu"
    assert born.json()["gender"] == "female"
    assert born.json()["birth_details_pending"] is False
    assert born.json()["last_menstrual_period"] is not None
    assert env.history(child_id)["measurements"][0]["id"] == check_id
    assert env.check(child_id).status_code == 409
    assert env.record_birth(child_id, env.today).status_code == 409
    assert env.toddler_measurement(child_id, env.today).status_code == 201


def test_pregnancy_past_due_date_becomes_a_toddler_automatically(env):
    child_id = env.register(weeks_pregnant=30).json()["id"]
    env.check(child_id, measurement_date=(env.today - timedelta(days=7)).isoformat())
    env.move_pregnancy_back(child_id, days=90)

    child = next(item for item in env.children() if item["id"] == child_id)

    assert child["status"] == "born"
    assert child["date_of_birth"] == child["expected_birth_date"]
    assert child["gender"] is None
    assert child["birth_details_pending"] is True
    assert len(env.history(child_id)["measurements"]) == 1
    pending = env.toddler_measurement(child_id, env.today)
    assert pending.status_code == 409
    assert "Lengkapi data kelahiran" in pending.json()["detail"]

    confirmed = env.record_birth(child_id, date.fromisoformat(child["expected_birth_date"]) - timedelta(days=2))
    assert confirmed.status_code == 200, confirmed.text
    assert confirmed.json()["birth_details_pending"] is False


def test_children_registered_after_birth_are_unaffected(env):
    born_on = env.today - timedelta(days=200)
    created = env.client.post(f"{env.base}/children", headers=HEADERS, json={
        "full_name": "Budi", "date_of_birth": born_on.isoformat(), "gender": "male",
    })
    assert created.status_code == 201, created.text
    child_id = created.json()["id"]

    listed = next(item for item in env.children() if item["id"] == child_id)

    assert listed["status"] == "born"
    assert listed["date_of_birth"] == born_on.isoformat()
    assert listed["birth_details_pending"] is False
    assert env.record_birth(child_id, born_on).status_code == 409
    assert env.history(child_id)["measurements"] == []


def test_family_summary_describes_the_pregnancy(env):
    child_id = env.register(weeks_pregnant=20).json()["id"]
    env.check(child_id, fundal_height=20)

    assessment = env.client.get(f"{env.base}/assessment", headers=HEADERS).json()

    child = assessment["children"][0]
    assert child["status"] == "unborn"
    assert child["gestational_age_weeks"] == 20
    assert child["latest_prenatal_check"]["fundal_height"] == 20
    assert "dalam kandungan, usia kehamilan 20 minggu" in assessment["summary_text"]


@pytest.mark.parametrize(
    ("readings", "classification"),
    [
        ({"maternal_muac": Decimal("25"), "fundal_height": Decimal("28"), "fetal_heart_rate": 140}, PrenatalClassification.NORMAL),
        ({"maternal_muac": Decimal("23"), "fundal_height": None, "fetal_heart_rate": None}, PrenatalClassification.KEK_RISK),
        ({"maternal_muac": Decimal("25"), "fundal_height": Decimal("33"), "fetal_heart_rate": None}, PrenatalClassification.NEEDS_REVIEW),
        ({"maternal_muac": Decimal("25"), "fundal_height": None, "fetal_heart_rate": 100}, PrenatalClassification.NEEDS_REVIEW),
        ({"maternal_muac": Decimal("25"), "fundal_height": Decimal("12"), "fetal_heart_rate": None}, PrenatalClassification.NORMAL),
    ],
)
def test_antenatal_screening_rules(readings, classification):
    weeks = 28 if readings["fundal_height"] != Decimal("12") else 14
    assert assess_prenatal_check(gestational_weeks=weeks, **readings).classification == classification
