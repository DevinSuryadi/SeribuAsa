"""Registration and account access for single-account health facilities."""

from uuid import UUID
import re

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field, SecretStr, field_validator
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool
from supabase import create_client
from gotrue.errors import AuthApiError

from app.config import settings
from app.database import get_db
from app.models.facility import HealthFacility
from app.models.user import UserProfile
from app.services.supabase_auth import supabase_auth
from app.utils.cache import get_app_cache

router = APIRouter(prefix="/facilities", tags=["facilities"])
security = HTTPBearer(auto_error=True)


class FacilityRegistration(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    name: str = Field(min_length=1, max_length=255)
    facility_type: str | None = Field(default=None, max_length=100)
    address: str | None = None
    phone: str | None = Field(default=None, max_length=20)

    @field_validator("full_name", "name")
    @classmethod
    def non_empty_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Nama tidak boleh kosong")
        return value


class FacilitySignupRequest(BaseModel):
    email: str = Field(max_length=320)
    password: SecretStr = Field(min_length=8)
    name: str = Field(min_length=1, max_length=255)
    facility_type: str | None = Field(default=None, max_length=100)
    address: str | None = None
    phone: str | None = Field(default=None, max_length=20)

    @field_validator("email")
    @classmethod
    def valid_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Email tidak valid")
        return value

    @field_validator("name")
    @classmethod
    def non_empty_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Nama fasilitas tidak boleh kosong")
        return value


class FacilitySignupResponse(BaseModel):
    user_id: UUID
    facility_id: UUID


class FacilityAccount(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    account_user_id: UUID
    name: str
    facility_type: str | None
    address: str | None
    phone: str | None
    approval_status: str


async def verified_facility_identity(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Facility endpoints require a real Supabase session even in development mode."""
    try:
        token_data = await supabase_auth.verify_token(credentials.credentials)
        UUID(str(token_data["id"]))
        return token_data
    except (ValueError, KeyError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Supabase session",
        ) from exc


@router.post("/signup", response_model=FacilitySignupResponse, status_code=status.HTTP_201_CREATED)
async def signup_facility(
    data: FacilitySignupRequest,
    db: Session = Depends(get_db),
):
    """Create a confirmed Auth account for one facility, then ensure its local profile."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=503, detail="Pendaftaran fasilitas belum dikonfigurasi")

    def create_auth_user():
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        return client.auth.admin.create_user({
            "email": data.email,
            "password": data.password.get_secret_value(),
            "email_confirm": True,
            "user_metadata": {
                "role": "health_facility",
                "full_name": data.name,
                "facility_name": data.name,
                "facility_type": data.facility_type,
                "phone": data.phone,
                "address": data.address,
            },
        })

    try:
        auth_response = await run_in_threadpool(create_auth_user)
    except AuthApiError as exc:
        if "already" in str(exc).lower() or "registered" in str(exc).lower() or getattr(exc, "code", None) == "email_exists":
            raise HTTPException(status_code=409, detail="Email sudah terdaftar") from exc
        raise HTTPException(status_code=400, detail="Pendaftaran akun Supabase gagal") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Layanan pendaftaran Supabase tidak tersedia") from exc

    if not auth_response.user:
        raise HTTPException(status_code=502, detail="Akun Supabase tidak berhasil dibuat")

    account = await register_facility(
        data=FacilityRegistration(
            full_name=data.name,
            name=data.name,
            facility_type=data.facility_type,
            address=data.address,
            phone=data.phone,
        ),
        token_data={"id": auth_response.user.id, "user_metadata": {"role": "health_facility"}},
        db=db,
    )
    return FacilitySignupResponse(user_id=account.account_user_id, facility_id=account.id)


@router.post("/register", response_model=FacilityAccount, status_code=status.HTTP_201_CREATED)
async def register_facility(
    data: FacilityRegistration,
    token_data: dict = Depends(verified_facility_identity),
    db: Session = Depends(get_db),
):
    user_id = UUID(str(token_data["id"]))
    metadata = token_data.get("user_metadata") or {}
    if not isinstance(metadata, dict) or metadata.get("role") != "health_facility":
        raise HTTPException(status_code=403, detail="Akun ini tidak didaftarkan sebagai fasilitas kesehatan")

    existing_facility = db.query(HealthFacility).filter_by(account_user_id=user_id).first()
    if existing_facility:
        if not existing_facility.is_active:
            raise HTTPException(status_code=403, detail="Akun fasilitas tidak aktif")
        return existing_facility
    if db.query(UserProfile).filter_by(user_id=user_id).first():
        raise HTTPException(status_code=409, detail="Akun ini sudah memiliki peran lain")

    try:
        db.add(UserProfile(
            user_id=user_id,
            full_name=data.full_name,
            phone=data.phone,
            address=data.address,
        ))
        db.flush()
        facility = HealthFacility(
            account_user_id=user_id,
            name=data.name,
            facility_type=data.facility_type,
            address=data.address,
            phone=data.phone,
            approval_status="pending",
        )
        db.add(facility)
        db.commit()
        db.refresh(facility)
        get_app_cache().invalidate("auth", str(user_id))
        return facility
    except IntegrityError as exc:
        db.rollback()
        existing_facility = db.query(HealthFacility).filter_by(account_user_id=user_id).first()
        if existing_facility:
            if not existing_facility.is_active:
                raise HTTPException(status_code=403, detail="Akun fasilitas tidak aktif")
            return existing_facility
        raise HTTPException(status_code=409, detail="Akun fasilitas sudah terdaftar") from exc


@router.get("/me", response_model=FacilityAccount)
async def get_my_facility(
    token_data: dict = Depends(verified_facility_identity),
    db: Session = Depends(get_db),
):
    user_id = UUID(str(token_data["id"]))
    facility = db.query(HealthFacility).filter_by(account_user_id=user_id, is_active=True).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Fasilitas kesehatan tidak ditemukan")
    return facility
