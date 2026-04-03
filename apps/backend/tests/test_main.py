"""
Main Application Tests
Tests for root endpoints and basic functionality
"""
from fastapi.testclient import TestClient



def test_root(client: TestClient):
    """Test root endpoint returns welcome message"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Welcome to NutriGuard API"
    assert "version" in data
    assert "docs" in data


def test_health_check(client: TestClient):
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_api_v1_root(client: TestClient):
    """Test API v1 root endpoint"""
    response = client.get("/api/v1")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "endpoints" in data
    assert "donations" in data["endpoints"]
    assert "vouchers" in data["endpoints"]
