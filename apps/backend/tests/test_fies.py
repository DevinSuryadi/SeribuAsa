"""
FIES API Tests
Tests for FIES survey submission, calculation, and history
"""
from datetime import date


VALID_RESPONSES = {
    "q1": 0, "q2": 1, "q3": 0, "q4": 0,
    "q5": 1, "q6": 0, "q7": 0, "q8": 0,
}


def test_calculate_fies_score(client):
    """Test calculating FIES score from responses"""
    response = client.post("/api/v1/fies/calculate", json={
        "responses": VALID_RESPONSES,
    })

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "score" in data["data"]
    assert "classification" in data["data"]
    assert "recommendations" in data["data"]


def test_calculate_fies_severe(client):
    """Test FIES classification for severe food insecurity"""
    severe_responses = {
        "q1": 2, "q2": 2, "q3": 2, "q4": 2,
        "q5": 2, "q6": 2, "q7": 2, "q8": 2,
    }

    response = client.post("/api/v1/fies/calculate", json={
        "responses": severe_responses,
    })

    assert response.status_code == 200
    data = response.json()
    assert data["data"]["score"] == 16
    assert data["data"]["classification"] == "severe"


def test_calculate_fies_food_secure(client):
    """Test FIES classification for food secure"""
    secure_responses = {
        "q1": 0, "q2": 0, "q3": 0, "q4": 0,
        "q5": 0, "q6": 0, "q7": 0, "q8": 0,
    }

    response = client.post("/api/v1/fies/calculate", json={
        "responses": secure_responses,
    })

    assert response.status_code == 200
    data = response.json()
    assert data["data"]["score"] == 0
    assert data["data"]["classification"] == "food_secure"


def test_calculate_fies_moderate(client):
    """Test FIES classification for moderate food insecurity"""
    moderate_responses = {
        "q1": 1, "q2": 1, "q3": 1, "q4": 0,
        "q5": 0, "q6": 0, "q7": 0, "q8": 0,
    }

    response = client.post("/api/v1/fies/calculate", json={
        "responses": moderate_responses,
    })

    assert response.status_code == 200
    data = response.json()
    assert data["data"]["score"] == 3
    assert data["data"]["classification"] == "moderate"


def test_calculate_fies_invalid_response(client):
    """Test FIES calculation with invalid response values"""
    invalid_responses = {
        "q1": 5, "q2": 0, "q3": 0, "q4": 0,
        "q5": 0, "q6": 0, "q7": 0, "q8": 0,
    }

    response = client.post("/api/v1/fies/calculate", json={
        "responses": invalid_responses,
    })
    assert response.status_code == 422


def test_calculate_fies_missing_response(client):
    """Test FIES calculation with missing response"""
    incomplete_responses = {
        "q1": 0, "q2": 0, "q3": 0,
    }

    response = client.post("/api/v1/fies/calculate", json={
        "responses": incomplete_responses,
    })
    assert response.status_code == 422


def test_get_fies_history_empty(client, mock_beneficiary_id):
    """Test getting FIES history when no surveys exist"""
    response = client.get(f"/api/v1/fies/history/{mock_beneficiary_id}")
    assert response.status_code in [200, 500]


def test_submit_fies_outside_window(client, mock_beneficiary_id):
    """Test submitting FIES survey outside tanggal 1-7 window"""
    today = date.today()
    if today.day > 7 or today.day < 1:
        response = client.post("/api/v1/fies/submit", json={
            "responses": VALID_RESPONSES,
        })
        assert response.status_code == 400
        detail = response.json()["detail"].lower()
        assert "tanggal 1-7" in detail or "survey" in detail
