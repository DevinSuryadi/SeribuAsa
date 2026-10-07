"""Family records and assessments managed by a single health facility account."""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.facilities import verified_facility_identity
from app.database import get_db
from app.models.facility import HealthFacility, RecipientFamily
from app.models.nutrition import FIESSurvey, NutritionMeasurement
from app.models.user import Child, GenderEnum
from app.schemas.fies import FIESSubmit
from app.schemas.nutrition import NutritionMeasurementCreate, NutritionMeasurementResponse
from app.services.fies_calculator import FIESCalculator
from app.services.zscore_calculator import ZScoreCalculator

router = APIRouter(prefix="/facilities/families", tags=["facility families"])


class FamilyFields(BaseModel):
    kk_number: str = Field(pattern=r"^[0-9]{16}$")
    head_name: str = Field(min_length=1, max_length=255)
    address: str | None = None
    phone: str | None = Field(default=None, max_length=20)
    family_size: int | None = Field(default=None, gt=0)

    @field_validator("head_name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Nama kepala keluarga wajib diisi")
        return value


class FamilyUpdate(BaseModel):
    kk_number: str | None = Field(default=None, pattern=r"^[0-9]{16}$")
    head_name: str | None = Field(default=None, min_length=1, max_length=255)
    address: str | None = None
    phone: str | None = Field(default=None, max_length=20)
    family_size: int | None = Field(default=None, gt=0)

    @field_validator("head_name")
    @classmethod
    def strip_name(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Nama kepala keluarga wajib diisi")
        return value.strip() if value is not None else None


class FamilyResponse(FamilyFields):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    health_facility_id: UUID
    created_at: datetime


class ChildCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    date_of_birth: date
    gender: GenderEnum

    @field_validator("full_name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Nama anak wajib diisi")
        return value

    @field_validator("date_of_birth")
    @classmethod
    def valid_birth_date(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("Tanggal lahir tidak boleh di masa depan")
        return value


class ChildResponse(ChildCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    family_id: UUID
    age_months: int


class FamilyFIESResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    family_id: UUID
    score: int
    classification: str
    survey_date: datetime
    survey_month: int
    survey_year: int


def current_facility(
    token_data: dict = Depends(verified_facility_identity),
    db: Session = Depends(get_db),
) -> HealthFacility:
    facility = db.query(HealthFacility).filter_by(
        account_user_id=UUID(str(token_data["id"])), is_active=True
    ).first()
    if facility is None:
        raise HTTPException(status_code=403, detail="Akun fasilitas tidak aktif atau tidak ditemukan")
    return facility


def owned_family(family_id: UUID, facility: HealthFacility, db: Session) -> RecipientFamily:
    family = db.query(RecipientFamily).filter_by(
        id=family_id, health_facility_id=facility.id, is_active=True
    ).first()
    if family is None:
        raise HTTPException(status_code=404, detail="Keluarga tidak ditemukan")
    return family


def owned_child(child_id: UUID, family: RecipientFamily, db: Session) -> Child:
    child = db.query(Child).filter_by(id=child_id, family_id=family.id, is_active=True).first()
    if child is None:
        raise HTTPException(status_code=404, detail="Anak tidak ditemukan")
    return child


def child_response(child: Child) -> ChildResponse:
    today = date.today()
    months = (today.year - child.date_of_birth.year) * 12 + today.month - child.date_of_birth.month
    if today.day < child.date_of_birth.day:
        months -= 1
    return ChildResponse(
        id=child.id, family_id=child.family_id, full_name=child.full_name,
        date_of_birth=child.date_of_birth, gender=child.gender, age_months=max(0, months),
    )


@router.get("", response_model=list[FamilyResponse])
def list_families(
    search: str | None = Query(default=None, max_length=255),
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
):
    query = db.query(RecipientFamily).filter_by(health_facility_id=facility.id, is_active=True)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(RecipientFamily.head_name.ilike(term), RecipientFamily.kk_number.ilike(term)))
    return query.order_by(RecipientFamily.created_at.desc()).all()


@router.post("", response_model=FamilyResponse, status_code=status.HTTP_201_CREATED)
def create_family(
    data: FamilyFields,
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
):
    family = RecipientFamily(health_facility_id=facility.id, **data.model_dump())
    db.add(family)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Nomor KK sudah terdaftar") from exc
    db.refresh(family)
    return family


@router.get("/{family_id}", response_model=FamilyResponse)
def get_family(
    family_id: UUID,
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
):
    return owned_family(family_id, facility, db)


@router.put("/{family_id}", response_model=FamilyResponse)
def update_family(
    family_id: UUID,
    data: FamilyUpdate,
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
):
    family = owned_family(family_id, facility, db)
    changes = data.model_dump(exclude_unset=True)
    for required in ("kk_number", "head_name"):
        if required in changes and changes[required] is None:
            raise HTTPException(status_code=422, detail=f"{required} wajib diisi")
    for key, value in changes.items():
        setattr(family, key, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Nomor KK sudah terdaftar") from exc
    db.refresh(family)
    return family


@router.get("/{family_id}/children", response_model=list[ChildResponse])
def list_children(
    family_id: UUID,
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
):
    family = owned_family(family_id, facility, db)
    children = db.query(Child).filter_by(family_id=family.id, is_active=True).order_by(Child.date_of_birth.desc()).all()
    return [child_response(child) for child in children]


@router.post("/{family_id}/children", response_model=ChildResponse, status_code=status.HTTP_201_CREATED)
def create_child(
    family_id: UUID,
    data: ChildCreate,
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
):
    family = owned_family(family_id, facility, db)
    child = Child(family_id=family.id, **data.model_dump())
    db.add(child)
    db.commit()
    db.refresh(child)
    return child_response(child)


@router.get("/{family_id}/children/{child_id}/measurements")
def list_measurements(
    family_id: UUID,
    child_id: UUID,
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
):
    child = owned_child(child_id, owned_family(family_id, facility, db), db)
    measurements = db.query(NutritionMeasurement).filter_by(child_id=child.id, is_active=True).order_by(
        NutritionMeasurement.measurement_date.desc()
    ).all()
    age_months = min(child_response(child).age_months, 60)
    chart = ZScoreCalculator.get_growth_chart_data(age_months, child.gender.value)
    if len(measurements) >= 2 and measurements[0].z_score_weight is not None and measurements[1].z_score_weight is not None:
        difference = float(measurements[0].z_score_weight - measurements[1].z_score_weight)
        chart["trend"] = "improving" if difference > 0.3 else "declining" if difference < -0.3 else "stable"
    return {
        "success": True,
        "data": {
            "child": child_response(child).model_dump(mode="json"),
            "measurements": [NutritionMeasurementResponse.model_validate(item).model_dump(mode="json") for item in measurements],
            "growth_chart_data": chart,
        },
    }


@router.post("/{family_id}/children/{child_id}/measurements", response_model=NutritionMeasurementResponse, status_code=status.HTTP_201_CREATED)
def create_measurement(
    family_id: UUID,
    child_id: UUID,
    data: NutritionMeasurementCreate,
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
):
    child = owned_child(child_id, owned_family(family_id, facility, db), db)
    if data.child_id != child_id:
        raise HTTPException(status_code=422, detail="Anak pada data tidak sesuai")
    if data.measurement_date > date.today() or data.measurement_date < child.date_of_birth:
        raise HTTPException(status_code=422, detail="Tanggal pengukuran tidak valid")
    # Serialize writes for the same child so two tabs cannot add the same date at once.
    db.query(Child).filter_by(id=child.id).with_for_update().first()
    existing = db.query(NutritionMeasurement).filter_by(child_id=child.id, measurement_date=data.measurement_date, is_active=True).first()
    if existing:
        raise HTTPException(status_code=409, detail="Pengukuran pada tanggal ini sudah ada")
    measured = data.measurement_date
    age_months = (measured.year - child.date_of_birth.year) * 12 + measured.month - child.date_of_birth.month
    if measured.day < child.date_of_birth.day:
        age_months -= 1
    score = ZScoreCalculator.calculate(
        age_months=min(max(age_months, 0), 60), gender=child.gender.value,
        weight=float(data.weight), height=float(data.height),
    )
    weight_class = score["weight_classification"]
    height_class = score["height_classification"]
    classification = (
        "severe_malnourished" if "severe_malnourished" in (weight_class, height_class)
        else "moderate_malnourished" if "moderate_malnourished" in (weight_class, height_class)
        else "normal"
    )
    measurement = NutritionMeasurement(
        child_id=child.id, recorded_by_user_id=facility.account_user_id,
        measurement_date=measured, weight=data.weight, height=data.height, muac=data.muac,
        z_score_weight=Decimal(str(score["z_score_weight"])),
        z_score_height=Decimal(str(score["z_score_height"])), classification=classification,
    )
    db.add(measurement)
    db.commit()
    db.refresh(measurement)
    return measurement


@router.get("/{family_id}/fies", response_model=list[FamilyFIESResponse])
def list_fies(
    family_id: UUID,
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
):
    family = owned_family(family_id, facility, db)
    return db.query(FIESSurvey).filter_by(family_id=family.id, is_active=True).order_by(FIESSurvey.survey_date.desc()).all()


@router.post("/{family_id}/fies", response_model=FamilyFIESResponse, status_code=status.HTTP_201_CREATED)
def create_fies(
    family_id: UUID,
    data: FIESSubmit,
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
):
    family = owned_family(family_id, facility, db)
    survey_date = data.survey_date or date.today()
    if survey_date > date.today():
        raise HTTPException(status_code=422, detail="Tanggal survei tidak boleh di masa depan")
    if any(answer not in (0, 1) for answer in data.responses.values()):
        raise HTTPException(status_code=422, detail="Jawaban survei harus Ya atau Tidak")
    # A family gets one survey per month even if two requests arrive together.
    db.query(RecipientFamily).filter_by(id=family.id).with_for_update().first()
    existing = db.query(FIESSurvey).filter_by(
        family_id=family.id, survey_month=survey_date.month, survey_year=survey_date.year, is_active=True
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Survei keluarga untuk bulan ini sudah ada")
    score = FIESCalculator.calculate_score(data.responses)
    survey = FIESSurvey(
        family_id=family.id, recorded_by_user_id=facility.account_user_id,
        responses=data.responses, score=score, classification=FIESCalculator.classify_score(score),
        survey_date=datetime.combine(survey_date, datetime.min.time()),
        survey_month=survey_date.month, survey_year=survey_date.year,
    )
    db.add(survey)
    db.commit()
    db.refresh(survey)
    return survey
