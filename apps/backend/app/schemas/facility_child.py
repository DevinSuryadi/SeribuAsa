"""Schemas for children managed by a health facility, from pregnancy through early childhood."""

from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.nutrition import PrenatalMeasurement
from app.models.user import Child, GenderEnum
from app.services.pregnancy import assess_prenatal_check, expected_birth_date, gestational_age_weeks
from app.utils.child_age import age_in_months
from app.utils.local_time import wib_today


def _required_name(value: str, message: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError(message)
    return value


class ChildCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    date_of_birth: date
    gender: GenderEnum

    @field_validator("full_name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        return _required_name(value, "Nama anak wajib diisi")

    @field_validator("date_of_birth")
    @classmethod
    def valid_birth_date(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("Tanggal lahir tidak boleh di masa depan")
        return value


class UnbornChildCreate(BaseModel):
    mother_name: str = Field(min_length=1, max_length=255)
    last_menstrual_period: date
    full_name: str | None = Field(default=None, max_length=255)

    @field_validator("mother_name")
    @classmethod
    def strip_mother_name(cls, value: str) -> str:
        return _required_name(value, "Nama ibu wajib diisi")

    @field_validator("full_name")
    @classmethod
    def optional_name(cls, value: str | None) -> str | None:
        return (value or "").strip() or None

    @field_validator("last_menstrual_period")
    @classmethod
    def ongoing_pregnancy(cls, value: date) -> date:
        today = wib_today()
        if value > today:
            raise ValueError("HPHT tidak boleh di masa depan")
        if expected_birth_date(value) <= today:
            raise ValueError(
                "Usia kehamilan menurut HPHT sudah mencapai 40 minggu. "
                "Daftarkan anak melalui formulir anak yang sudah lahir."
            )
        return value


class BirthRecord(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    date_of_birth: date
    gender: GenderEnum

    @field_validator("full_name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        return _required_name(value, "Nama anak wajib diisi")

    @field_validator("date_of_birth")
    @classmethod
    def not_in_future(cls, value: date) -> date:
        if value > wib_today():
            raise ValueError("Tanggal lahir tidak boleh di masa depan")
        return value


class ChildResponse(BaseModel):
    id: UUID
    family_id: UUID
    full_name: str
    status: Literal["unborn", "born"]
    date_of_birth: date | None
    gender: GenderEnum | None
    age_months: int | None
    mother_name: str | None
    last_menstrual_period: date | None
    expected_birth_date: date | None
    gestational_age_weeks: int | None
    birth_details_pending: bool

    @classmethod
    def from_child(cls, child: Child, today: date | None = None) -> "ChildResponse":
        today = today or wib_today()
        unborn = child.is_unborn
        return cls(
            id=child.id,
            family_id=child.family_id,
            full_name=child.full_name,
            status="unborn" if unborn else "born",
            date_of_birth=child.date_of_birth,
            gender=child.gender,
            age_months=None if unborn else age_in_months(child.date_of_birth, today),
            mother_name=child.mother_name,
            last_menstrual_period=child.last_menstrual_period,
            expected_birth_date=child.expected_birth_date,
            gestational_age_weeks=(
                gestational_age_weeks(child.last_menstrual_period, today) if unborn else None
            ),
            birth_details_pending=child.birth_details_pending,
        )


class PrenatalMeasurementCreate(BaseModel):
    measurement_date: date
    maternal_weight: Decimal = Field(gt=0, le=200, description="Berat badan ibu dalam kg")
    maternal_muac: Decimal = Field(gt=0, le=60, description="Lingkar lengan atas ibu (LiLA) dalam cm")
    fundal_height: Decimal | None = Field(default=None, gt=0, le=60, description="Tinggi fundus uteri dalam cm")
    fetal_heart_rate: int | None = Field(default=None, gt=0, le=250, description="Denyut jantung janin per menit")
    estimated_fetal_weight: int | None = Field(default=None, gt=0, le=6000, description="Taksiran berat janin dalam gram")


class PrenatalMeasurementResponse(BaseModel):
    id: UUID
    child_id: UUID
    measurement_date: date
    gestational_age_weeks: int
    maternal_weight: float
    maternal_muac: float
    fundal_height: float | None
    fetal_heart_rate: int | None
    estimated_fetal_weight: int | None
    classification: str
    findings: list[str]
    created_at: datetime

    @classmethod
    def from_measurement(cls, measurement: PrenatalMeasurement) -> "PrenatalMeasurementResponse":
        assessment = assess_prenatal_check(
            gestational_weeks=measurement.gestational_age_weeks,
            maternal_muac=Decimal(measurement.maternal_muac),
            fundal_height=Decimal(measurement.fundal_height) if measurement.fundal_height is not None else None,
            fetal_heart_rate=measurement.fetal_heart_rate,
        )
        return cls(
            id=measurement.id,
            child_id=measurement.child_id,
            measurement_date=measurement.measurement_date,
            gestational_age_weeks=measurement.gestational_age_weeks,
            maternal_weight=float(measurement.maternal_weight),
            maternal_muac=float(measurement.maternal_muac),
            fundal_height=float(measurement.fundal_height) if measurement.fundal_height is not None else None,
            fetal_heart_rate=measurement.fetal_heart_rate,
            estimated_fetal_weight=measurement.estimated_fetal_weight,
            classification=measurement.classification,
            findings=list(assessment.findings),
            created_at=measurement.created_at,
        )


class PrenatalHistoryResponse(BaseModel):
    child: ChildResponse
    measurements: list[PrenatalMeasurementResponse]
