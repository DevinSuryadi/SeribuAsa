from uuid import UUID
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import (
    GoogleTokenExchangeRequest,
    GoogleSyncRequest,
    GoogleAuthResponse,
    GoogleAuthUser,
)
from app.services.google_auth_service import google_auth_service
from app.services.supabase_auth import supabase_auth

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer(auto_error=True)


def _build_google_response(
    token_data: dict,
    user_id: UUID,
    email: str | None,
    full_name: str,
    role: str,
    profile_created: bool,
    include_tokens: bool,
) -> GoogleAuthResponse:
    return GoogleAuthResponse(
        provider="google",
        access_token=token_data.get("access_token") if include_tokens else None,
        refresh_token=token_data.get("refresh_token") if include_tokens else None,
        expires_in=token_data.get("expires_in") if include_tokens else None,
        token_type=token_data.get("token_type") if include_tokens else None,
        user=GoogleAuthUser(
            user_id=user_id,
            email=email,
            full_name=full_name,
            role=role,
            profile_created=profile_created,
        ),
    )


@router.post("/google/exchange", response_model=GoogleAuthResponse)
async def exchange_google_token(
    data: GoogleTokenExchangeRequest,
    db: Session = Depends(get_db),
):

    try:
        token_response = await google_auth_service.exchange_id_token(data.id_token)
        user_data = token_response.get("user") or {}

        if not google_auth_service.is_google_user(user_data):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Authenticated user is not a Google provider account",
            )

        raw_user_id = user_data.get("id")
        if not raw_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supabase response does not contain user ID",
            )

        user_id = UUID(str(raw_user_id))
        email = user_data.get("email")
        full_name = google_auth_service.resolve_full_name(user_data, data.full_name)
        requested_role = google_auth_service.resolve_signup_role(
            data.role,
            (user_data.get("user_metadata") or {}).get("role"),
        )

        profile, resolved_role, profile_created = google_auth_service.ensure_local_profile(
            db=db,
            user_id=user_id,
            email=email,
            full_name=full_name,
            preferred_role=requested_role,
        )

        db.commit()

        return _build_google_response(
            token_data=token_response,
            user_id=user_id,
            email=email,
            full_name=profile.full_name,
            role=resolved_role,
            profile_created=profile_created,
            include_tokens=True,
        )

    except HTTPException:
        db.rollback()
        raise
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        db.rollback()
        logger.error("Google token exchange failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google authentication failed",
        ) from exc


@router.post("/google/sync", response_model=GoogleAuthResponse)
async def sync_google_profile(
    data: GoogleSyncRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):

    try:
        token_data = await supabase_auth.verify_token(credentials.credentials)

        if not google_auth_service.is_google_user(token_data):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current session is not authenticated via Google",
            )

        raw_user_id = token_data.get("id")
        if not raw_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supabase token does not contain user ID",
            )

        user_id = UUID(str(raw_user_id))
        email = token_data.get("email")
        full_name = google_auth_service.resolve_full_name(token_data, data.full_name)
        requested_role = google_auth_service.resolve_signup_role(
            data.role,
            (token_data.get("user_metadata") or {}).get("role"),
        )

        profile, resolved_role, profile_created = google_auth_service.ensure_local_profile(
            db=db,
            user_id=user_id,
            email=email,
            full_name=full_name,
            preferred_role=requested_role,
        )

        db.commit()

        return _build_google_response(
            token_data={},
            user_id=user_id,
            email=email,
            full_name=profile.full_name,
            role=resolved_role,
            profile_created=profile_created,
            include_tokens=False,
        )

    except HTTPException:
        db.rollback()
        raise
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        db.rollback()
        logger.error("Google profile sync failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google profile sync failed",
        ) from exc
