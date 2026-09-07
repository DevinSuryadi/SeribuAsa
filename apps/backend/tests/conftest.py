"""
Pytest Test Fixtures
Provides reusable fixtures for all tests
"""
import pytest
import os
from fastapi.testclient import TestClient
from typing import Generator
from unittest.mock import MagicMock

from app.main import app
from app.database import get_db
from app.middleware.auth import get_current_user, AuthenticatedUser
from app.models.user import UserProfile, DonorProfile, BeneficiaryProfile, VendorProfile, Child  # noqa: F401


@pytest.fixture(scope="function")
def client() -> Generator[TestClient, None, None]:
    """Create a test client with mock auth and mocked database"""
    def override_auth():
        return AuthenticatedUser(
            user_id="00000000-0000-0000-0000-000000000001",
            email="donor@nutriguard.id",
            role="donor",
            email_verified=True,
        )

    mock_db = MagicMock()
    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_current_user] = override_auth
    app.dependency_overrides[get_db] = override_get_db
    os.environ["DEV_MODE"] = "true"

    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def auth_headers() -> dict:
    return {"Authorization": "Bearer mock-token"}


@pytest.fixture(scope="function")
def mock_donor_id() -> str:
    return "00000000-0000-0000-0000-000000000001"


@pytest.fixture(scope="function")
def mock_beneficiary_id() -> str:
    return "00000000-0000-0000-0000-000000000002"


@pytest.fixture(scope="function")
def mock_vendor_id() -> str:
    return "00000000-0000-0000-0000-000000000003"
