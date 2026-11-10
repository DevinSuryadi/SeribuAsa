"""Children registered in the womb: antenatal check-ups and the hand-over to birth records."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.facility_families import current_facility, owned_child, owned_family
from app.database import get_db
from app.models.facility import HealthFacility
from app.models.nutrition import PrenatalMeasurement
from app.models.user import Child
from app.schemas.facility_child import (
    BirthRecord,
    ChildResponse,
    PrenatalHistoryResponse,
    PrenatalMeasurementCreate,
    PrenatalMeasurementResponse,
    UnbornChildCreate,
)
from app.services.pregnancy import (
    assess_prenatal_check,
    default_unborn_name,
    expected_birth_date,
    gestational_age_weeks,
    promote_due_pregnancies,
)
from app.utils.local_time import wib_today

router = APIRouter(prefix="/facilities/families", tags=["facility prenatal care"])


@router.post("/{family_id}/children/unborn", response_model=ChildResponse, status_code=status.HTTP_201_CREATED)
def register_unborn_child(
    family_id: UUID,
    data: UnbornChildCreate,
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
):
    family = owned_family(family_id, facility, db)
    child = Child(
        family_id=family.id,
        full_name=data.full_name or default_unborn_name(data.mother_name),
        mother_name=data.mother_name,
        last_menstrual_period=data.last_menstrual_period,
        expected_birth_date=expected_birth_date(data.last_menstrual_period),
    )
    db.add(child)
    db.commit()
    db.refresh(child)
    return ChildResponse.from_child(child)


@router.get("/{family_id}/children/{child_id}/prenatal-measurements", response_model=PrenatalHistoryResponse)
def list_prenatal_measurements(
    family_id: UUID,
    child_id: UUID,
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
):
    family = owned_family(family_id, facility, db)
    promote_due_pregnancies(db, family_id=family.id)
    child = owned_child(child_id, family, db)
    measurements = (
        db.query(PrenatalMeasurement)
        .filter_by(child_id=child.id, is_active=True)
        .order_by(PrenatalMeasurement.measurement_date.desc())
        .all()
    )
    return PrenatalHistoryResponse(
        child=ChildResponse.from_child(child),
        measurements=[PrenatalMeasurementResponse.from_measurement(item) for item in measurements],
    )


@router.post(
    "/{family_id}/children/{child_id}/prenatal-measurements",
    response_model=PrenatalMeasurementResponse,
    status_code=status.HTTP_201_CREATED,
)
def record_prenatal_measurement(
    family_id: UUID,
    child_id: UUID,
    data: PrenatalMeasurementCreate,
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
):
    family = owned_family(family_id, facility, db)
    promote_due_pregnancies(db, family_id=family.id)
    child = owned_child(child_id, family, db)
    if not child.is_unborn:
        raise HTTPException(
            status_code=409,
            detail="Anak sudah lahir. Catat pertumbuhannya melalui pengukuran balita.",
        )
    if not child.last_menstrual_period <= data.measurement_date <= wib_today():
        raise HTTPException(
            status_code=422,
            detail="Tanggal pemeriksaan harus berada di antara HPHT dan hari ini.",
        )
    # Serialize writes for the same child so two tabs cannot record the same date at once.
    db.query(Child).filter_by(id=child.id).with_for_update().first()
    duplicate = (
        db.query(PrenatalMeasurement)
        .filter_by(child_id=child.id, measurement_date=data.measurement_date, is_active=True)
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=409, detail="Pemeriksaan kehamilan pada tanggal ini sudah tercatat.")

    weeks = gestational_age_weeks(child.last_menstrual_period, data.measurement_date)
    assessment = assess_prenatal_check(
        gestational_weeks=weeks,
        maternal_muac=data.maternal_muac,
        fundal_height=data.fundal_height,
        fetal_heart_rate=data.fetal_heart_rate,
    )
    measurement = PrenatalMeasurement(
        child_id=child.id,
        recorded_by_user_id=facility.account_user_id,
        measurement_date=data.measurement_date,
        gestational_age_weeks=weeks,
        maternal_weight=data.maternal_weight,
        maternal_muac=data.maternal_muac,
        fundal_height=data.fundal_height,
        fetal_heart_rate=data.fetal_heart_rate,
        estimated_fetal_weight=data.estimated_fetal_weight,
        classification=assessment.classification,
    )
    db.add(measurement)
    db.commit()
    db.refresh(measurement)
    return PrenatalMeasurementResponse.from_measurement(measurement)


@router.post("/{family_id}/children/{child_id}/birth", response_model=ChildResponse)
def record_birth(
    family_id: UUID,
    child_id: UUID,
    data: BirthRecord,
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
):
    family = owned_family(family_id, facility, db)
    promote_due_pregnancies(db, family_id=family.id)
    child = owned_child(child_id, family, db)
    if not child.registered_in_womb:
        raise HTTPException(
            status_code=409,
            detail="Data kelahiran hanya dapat dicatat untuk anak yang didaftarkan saat masih dalam kandungan.",
        )
    if not child.birth_details_pending:
        raise HTTPException(status_code=409, detail="Data kelahiran anak sudah tercatat.")
    if data.date_of_birth <= child.last_menstrual_period:
        raise HTTPException(status_code=422, detail="Tanggal lahir harus setelah HPHT.")
    last_check = (
        db.query(func.max(PrenatalMeasurement.measurement_date))
        .filter_by(child_id=child.id, is_active=True)
        .scalar()
    )
    if last_check and data.date_of_birth < last_check:
        raise HTTPException(
            status_code=422,
            detail="Tanggal lahir tidak boleh sebelum pemeriksaan kehamilan terakhir.",
        )

    child.full_name = data.full_name
    child.date_of_birth = data.date_of_birth
    child.gender = data.gender
    db.commit()
    db.refresh(child)
    return ChildResponse.from_child(child)
