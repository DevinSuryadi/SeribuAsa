"""
Nutrition Integration Tests
Tests for nutrition measurements, Z-Score calculation, and health data
"""
import pytest
from datetime import date


# ============================================
# List Children Tests
# ============================================
def test_list_children_success(client):
    """Test listing children for authenticated beneficiary"""
    response = client.get("/api/v1/nutrition/children")
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert isinstance(data["data"], list)


# ============================================
# Add Measurement Tests
# ============================================
def test_add_measurement_invalid_weight(client):
    """Test adding measurement with invalid weight (negative)"""
    payload = {
        "child_id": "00000000-0000-0000-0000-000000000011",
        "measurement_date": str(date.today()),
        "weight": -5.0,
        "height": 85.0,
    }
    
    response = client.post("/api/v1/nutrition/measurements", json=payload)
    assert response.status_code == 422


def test_add_measurement_invalid_height(client):
    """Test adding measurement with invalid height (zero)"""
    payload = {
        "child_id": "00000000-0000-0000-0000-000000000011",
        "measurement_date": str(date.today()),
        "weight": 12.5,
        "height": 0,
    }
    
    response = client.post("/api/v1/nutrition/measurements", json=payload)
    assert response.status_code == 422


# ============================================
# Z-Score Calculation Tests
# ============================================
def test_calculate_zscore_invalid_age_too_high(client):
    """Test Z-Score calculation with age > 60 months"""
    payload = {
        "age_months": 100,
        "gender": "male",
        "weight": 12.5,
        "height": 85.0,
    }
    
    response = client.post("/api/v1/nutrition/zscore", json=payload)
    assert response.status_code in [400, 422]


def test_calculate_zscore_invalid_gender(client):
    """Test Z-Score calculation with invalid gender"""
    payload = {
        "age_months": 24,
        "gender": "other",
        "weight": 12.5,
        "height": 85.0,
    }
    
    response = client.post("/api/v1/nutrition/zscore", json=payload)
    assert response.status_code in [400, 422]


def test_calculate_zscore_missing_age(client):
    """Test Z-Score calculation without age_months"""
    payload = {
        "gender": "male",
        "weight": 12.5,
        "height": 85.0,
    }
    
    response = client.post("/api/v1/nutrition/zscore", json=payload)
    assert response.status_code == 422


def test_calculate_zscore_missing_gender(client):
    """Test Z-Score calculation without gender"""
    payload = {
        "age_months": 24,
        "weight": 12.5,
        "height": 85.0,
    }
    
    response = client.post("/api/v1/nutrition/zscore", json=payload)
    assert response.status_code == 422


def test_calculate_zscore_missing_weight(client):
    """Test Z-Score calculation without weight"""
    payload = {
        "age_months": 24,
        "gender": "male",
        "height": 85.0,
    }
    
    response = client.post("/api/v1/nutrition/zscore", json=payload)
    assert response.status_code == 422


# ============================================
# Response Structure Tests
# ============================================
def test_children_list_response_structure(client):
    """Test that children list has correct structure"""
    response = client.get("/api/v1/nutrition/children")
    
    if response.status_code == 200:
        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)
