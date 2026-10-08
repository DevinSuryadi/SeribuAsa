"""Facility recommendations depend on recorded family facts, not legacy wallets."""

from datetime import date
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app
from app.middleware.auth import AuthenticatedUser, get_current_user
from app.services.recommendation_engine import RecommendationEngine


def test_family_recommendations_require_data_and_name_the_affected_child():
    child = SimpleNamespace(id=uuid4(), full_name="Anak Uji")
    assert RecommendationEngine.generate_for_family(None, [(child, None)]) == []

    measurement = SimpleNamespace(
        id=uuid4(), measurement_date=date(2026, 9, 1),
        z_score_height=Decimal("-3.2"), z_score_weight=Decimal("-1.0"),
    )
    survey = SimpleNamespace(id=uuid4(), score=7)
    items = RecommendationEngine.generate_for_family(survey, [(child, measurement)])

    assert any(item["category"] == "food_security" and item["priority"] == "high" for item in items)
    assert any("Anak Uji" in item["title"] and item["priority"] == "high" for item in items)
    assert all("voucher" not in (item["description"] + " ".join(item["action_items"])).lower() for item in items)


def test_legacy_recommendation_endpoint_is_closed_to_beneficiaries_and_facilities():
    client = TestClient(app)
    try:
        for role in ("beneficiary", "health_facility"):
            def current_user_override():
                return AuthenticatedUser(user_id=uuid4(), email="test@example.org", role=role)

            app.dependency_overrides[get_current_user] = current_user_override
            response = client.get("/api/v1/recommendations/")
            assert response.status_code == 403, response.text
    finally:
        app.dependency_overrides.pop(get_current_user, None)
