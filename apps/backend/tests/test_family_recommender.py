"""The exported family recommender model loads and follows policy, safety and quota rules."""

from datetime import timedelta
from decimal import Decimal
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import get_db
from app.main import app
from app.models.facility import HealthFacility, RecipientFamily
from app.models.nutrition import FIESSurvey, NutritionMeasurement, PrenatalMeasurement
from app.models.product import Order
from app.models.user import BeneficiaryProfile, Child, GenderEnum, UserProfile
from app.services import family_recommender as fr
from app.services.pregnancy import expected_birth_date
from app.services.supabase_auth import supabase_auth
from app.utils.local_time import wib_today
from tests.aid_eligibility import add_fies_survey


def _child(name, age, haz=None, waz=None, muac=None, prev_haz=None, prev_waz=None):
    return {
        "member_type": "child", "name": name, "age_months": age, "sex": "male",
        "haz": haz, "waz": waz, "muac_cm": muac, "prev_haz": prev_haz, "prev_waz": prev_waz,
    }


def _pregnancy(name, weeks, lila=None, classification=None):
    return {
        "member_type": "pregnancy", "name": name, "gestational_weeks": weeks,
        "lila_cm": lila, "prenatal_classification": classification,
    }


def _levels(recommendation):
    return {group["key"]: group["level"] for group in recommendation["food_groups"]}


def _actions(recommendation):
    return {action["key"] for action in recommendation["actions"]}


def test_runtime_model_matches_module_features_and_heads():
    model = fr.load_model()
    assert model["format"] == fr.MODEL_FORMAT
    for member_type in fr.MEMBER_TYPES:
        assert tuple(model["member_types"][member_type]["features"]) == fr.FEATURE_NAMES[member_type]


def test_kek_mother_and_stunted_infant_are_accumulated_within_the_weekly_quota():
    family = {
        "fies_score": 6,
        "members": [_pregnancy("Ibu", 26, 22.4, "kek_risk"), _child("Anak", 9, -2.3, -1.7, 12.9, -2.1, -1.5)],
    }
    catalog = [
        {"id": "1", "name": "Telur", "category": "Protein", "price": 32000},
        {"id": "2", "name": "Beras 5kg", "category": "Beras", "price": 75000},
        {"id": "3", "name": "Bayam", "category": "Sayuran", "price": 10000},
        {"id": "4", "name": "Pisang", "category": "Buah", "price": 22000},
        {"id": "5", "name": "Susu UHT", "category": "Susu", "price": 19000},
        {"id": "6", "name": "Gula", "category": "Gula", "price": 18000},
    ]
    result = fr.recommend_family(family, weekly_budget=200000, products=catalog)

    assert result["priority"] == "high"
    assert {"pmt_ibu_hamil", "pantau_ketat", "tinjau_akses_pangan"} <= _actions(result)
    assert _levels(result)["protein_hewani"] == 2
    protein = next(g for g in result["food_groups"] if g["key"] == "protein_hewani")
    assert protein["score"] == 4 and len(protein["members"]) == 2
    assert sum(g["budget"] or 0 for g in result["food_groups"]) == 200000
    assert result["basket"]["total"] <= 200000
    assert all(item["category"] != "Gula" for item in result["basket"]["items"])


def test_policy_and_safety_rules_always_apply():
    infant = fr.recommend_family({"fies_score": 1, "members": [_child("Bayi", 3, -0.5, -0.3)]})
    assert _levels(infant)["susu"] == 0 and _levels(infant)["minyak"] == 0
    assert _levels(infant)["sayuran"] == 1 and "pmt_balita" not in _actions(infant)

    severe = fr.recommend_family({"fies_score": 1, "members": [_child("Anak", 7, -1.8, -2.7, 11.2)]})
    assert "rujuk_nakes" in _actions(severe) and severe["priority"] == "high"

    out_of_scope = fr.recommend_family({"fies_score": None, "members": [_child("Kakak", 30, -2.5, -2.0)]})
    assert len(out_of_scope["excluded_members"]) == 1
    assert {check["key"] for check in out_of_scope["data_checks"]} == {"fies_missing"}


def test_facility_gets_recommendation_from_recorded_family_data(monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    for model in (
        UserProfile, BeneficiaryProfile, HealthFacility, RecipientFamily, Child,
        NutritionMeasurement, PrenatalMeasurement, FIESSurvey, Order,
    ):
        model.__table__.create(engine)
    sessions = sessionmaker(bind=engine)
    users = {"owner": uuid4(), "other": uuid4()}

    async def verify_token(token):
        return {"id": str(users[token])}

    monkeypatch.setattr(supabase_auth, "verify_token", verify_token)
    today = wib_today()
    with sessions() as db:
        for name, user_id in users.items():
            db.add(UserProfile(user_id=user_id, full_name=name))
        db.flush()
        facilities = {
            name: HealthFacility(account_user_id=user_id, name=name, approval_status="approved")
            for name, user_id in users.items()
        }
        db.add_all(facilities.values())
        db.flush()
        family = RecipientFamily(
            health_facility_id=facilities["owner"].id, kk_number="1234567890123456", head_name="Keluarga A"
        )
        db.add(family)
        db.flush()
        last_period = today - timedelta(weeks=26)
        pregnancy = Child(
            family_id=family.id, full_name="Bayi Ny. Siti", mother_name="Siti",
            last_menstrual_period=last_period, expected_birth_date=expected_birth_date(last_period),
        )
        toddler = Child(
            family_id=family.id, full_name="Budi", date_of_birth=today - timedelta(days=280), gender=GenderEnum.male
        )
        db.add_all([pregnancy, toddler])
        db.flush()
        db.add(PrenatalMeasurement(
            child_id=pregnancy.id, measurement_date=today - timedelta(days=7), gestational_age_weeks=25,
            maternal_weight=Decimal("50"), maternal_muac=Decimal("22.4"), classification="kek_risk",
        ))
        for days_ago, haz, waz, muac in ((40, "-2.1", "-1.5", None), (10, "-2.3", "-1.7", "12.9")):
            db.add(NutritionMeasurement(
                child_id=toddler.id, measurement_date=today - timedelta(days=days_ago),
                weight=Decimal("7.6"), height=Decimal("66"), muac=Decimal(muac) if muac else None,
                z_score_height=Decimal(haz), z_score_weight=Decimal(waz),
            ))
        add_fies_survey(db, family, "severe", today)
        db.commit()
        path = f"/api/v1/facilities/families/{family.id}/recommendation"

    def override_db():
        with sessions() as db:
            yield db

    app.dependency_overrides[get_db] = override_db
    try:
        client = TestClient(app)
        assert client.get(path, headers={"Authorization": "Bearer other"}).status_code == 404
        response = client.get(path, headers={"Authorization": "Bearer owner"})
        assert response.status_code == 200, response.text
        result = response.json()
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()

    assert result["priority"] == "high"
    assert {"pmt_ibu_hamil", "tinjau_akses_pangan"} <= _actions(result)
    for action in result["actions"]:
        assert [item["member"] for item in action["member_reasons"]] == action["members"]
    protein = next(g for g in result["food_groups"] if g["key"] == "protein_hewani")
    assert protein["score"] == 4
    assert {item["member"] for item in protein["members"]} == {"Bayi Ny. Siti", "Budi"}
    # Severe FIES: 2 beneficiaries x Rp100.000, split exactly across the needed food groups.
    assert result["weekly_budget"] == 200000
    assert sum(g["budget"] or 0 for g in result["food_groups"]) == 200000
    assert result["data_checks"] == [] and result["excluded_members"] == []
