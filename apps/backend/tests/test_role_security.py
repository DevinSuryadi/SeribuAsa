"""Privileged roles must come from trusted Auth metadata."""

import asyncio
from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from starlette.requests import Request

from app.middleware import auth
from app.schemas.user import UserSignUpRequest
from app.api.users import create_user_on_signup


def test_user_metadata_cannot_grant_admin(monkeypatch):
    user_id = uuid4()
    token = {
        "id": str(user_id),
        "email": "person@example.org",
        "email_confirmed_at": "2026-01-01T00:00:00Z",
        "user_metadata": {"role": "admin"},
        "app_metadata": {"role": "authenticated"},
    }

    async def verify(_token):
        return token

    monkeypatch.setattr(auth.supabase_auth, "verify_token", verify)
    monkeypatch.setattr(auth, "_resolve_role_from_db", lambda *_: None)
    monkeypatch.setattr(auth, "is_dev_mode", lambda: False)
    request = Request({"type": "http", "method": "GET", "path": "/", "headers": []})
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="test")
    result = asyncio.run(auth.get_current_user(request, credentials))
    assert result.role == "unassigned"

    token["app_metadata"] = {"role": "admin"}
    result = asyncio.run(auth.get_current_user(request, credentials))
    assert result.role == "admin"


def test_public_signup_rejects_privileged_role():
    with pytest.raises(ValueError):
        UserSignUpRequest(user_id=uuid4(), full_name="Admin Palsu", role="admin")


def test_signup_must_match_verified_session():
    user_id = uuid4()
    other_id = uuid4()
    donor = auth.AuthenticatedUser(user_id=user_id, email="donor@example.org", role="donor")
    with pytest.raises(HTTPException) as wrong_owner:
        asyncio.run(create_user_on_signup(UserSignUpRequest(user_id=other_id, full_name="X", role="donor"), db=None, current_user=donor))
    assert wrong_owner.value.status_code == 403
    with pytest.raises(HTTPException) as wrong_role:
        asyncio.run(create_user_on_signup(UserSignUpRequest(user_id=user_id, full_name="X", role="vendor"), db=None, current_user=donor))
    assert wrong_role.value.status_code == 403


def test_dev_auth_requires_explicit_local_mode(monkeypatch):
    monkeypatch.setattr(auth.settings, "DEV_MODE", False)
    monkeypatch.setattr(auth.settings, "DATABASE_URL", None)
    monkeypatch.setattr(auth.settings, "MIDTRANS_IS_PRODUCTION", False)
    monkeypatch.delenv("DEV_MODE", raising=False)
    assert auth.is_dev_mode() is False
    monkeypatch.setenv("DEV_MODE", "true")
    assert auth.is_dev_mode() is True
    monkeypatch.setattr(auth.settings, "DATABASE_URL", "postgresql://remote.invalid/db")
    assert auth.is_dev_mode() is False
