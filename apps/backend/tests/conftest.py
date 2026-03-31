"""
Pytest Test Fixtures
Provides reusable fixtures for all tests
"""
import pytest
from fastapi.testclient import TestClient
from typing import Generator

from app.main import app


@pytest.fixture(scope="function")
def client() -> Generator[TestClient, None, None]:
    """
    Create a test client for basic endpoint tests.
    
    This fixture creates a simple TestClient without database setup.
    Use this for testing endpoints that don't require database.
    
    Usage:
        def test_health_endpoint(client):
            response = client.get("/health")
            assert response.status_code == 200
    """
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="function")
def mock_user_data() -> dict:
    """
    Mock user data for authentication tests.
    
    Usage:
        def test_authenticated_endpoint(client, mock_user_data):
            # Use mock_user_data in test
            pass
    """
    return {
        "user_id": "test-user-123",
        "email": "test@example.com",
        "roles": ["user", "donor"]
    }
