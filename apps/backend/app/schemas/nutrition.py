"""
Nutrition Schemas
Pydantic schemas for nutrition measurement and Z-Score
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal


# ============================================
# Nutrition Measurement Schemas
# ============================================
class NutritionMeasurementCreate(BaseModel):
    child_id: UUID
    measurement_date: date
    weight: Decimal = Field(..., gt=0, description="Weight in kg")
    height: Decimal = Field(..., gt=0, description="Height in cm")
    muac: Optional[Decimal] = Field(None, gt=0, description="MUAC in cm (optional)")
    notes: Optional[str] = None


class NutritionMeasurementResponse(BaseModel):
    id: UUID
    child_id: UUID
    measurement_date: date
    weight: Decimal
    height: Decimal
    muac: Optional[Decimal] = None
    z_score_weight: Optional[Decimal] = None
    z_score_height: Optional[Decimal] = None
    z_score_weight_height: Optional[Decimal] = None
    classification: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChildInfo(BaseModel):
    id: UUID
    full_name: str
    date_of_birth: date
    age_months: int
    gender: Optional[str] = None


class GrowthChartData(BaseModel):
    who_reference: Dict[str, Any]
    trend: str = "stable"


class NutritionHistoryResponse(BaseModel):
    child: ChildInfo
    measurements: List[NutritionMeasurementResponse]
    growth_chart_data: GrowthChartData


# ============================================
# Z-Score Schemas
# ============================================
class ZScoreRequest(BaseModel):
    age_months: int = Field(..., ge=0, le=60)
    gender: str = Field(..., pattern="^(male|female)$")
    weight: Decimal = Field(..., gt=0)
    height: Decimal = Field(..., gt=0)


class WHOReferenceData(BaseModel):
    weight_median: float
    weight_sd: float
    height_median: float
    height_sd: float


class ZScoreResponse(BaseModel):
    z_score_weight: float
    z_score_height: float
    weight_classification: str
    height_classification: str
    who_reference: WHOReferenceData


# ============================================
# Child Schemas
# ============================================
class ChildResponse(BaseModel):
    id: UUID
    full_name: str
    date_of_birth: date
    age_months: int
    gender: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class NutritionLatestMeasurementResponse(BaseModel):
    child_id: UUID
    child_name: str
    measurement: NutritionMeasurementResponse


# ============================================
# Stunting Risk Prediction Schemas
# ============================================
class DominantFactor(BaseModel):
    name: str
    label: str
    value: float
    contribution: float
    direction: str  # "risk" | "protective"


class StuntingRiskResponse(BaseModel):
    id: Optional[UUID] = None
    child_id: UUID
    measurement_id: Optional[UUID] = None
    risk_score: float
    risk_level: str  # "low" | "medium" | "high"
    horizon_months: int
    model_version: str
    dominant_factors: List[DominantFactor] = []
    features: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class StuntingRiskWithChild(BaseModel):
    child: ChildInfo
    prediction: StuntingRiskResponse
