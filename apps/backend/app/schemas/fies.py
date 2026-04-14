"""
FIES Schemas
Pydantic schemas for FIES survey management
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID


# ============================================
# FIES Survey Schemas
# ============================================
class FIESSubmit(BaseModel):
    responses: Dict[str, int] = Field(..., description="Survey responses (q1-q8, values 0-2)")
    survey_date: Optional[date] = None

    def model_post_init(self, __context) -> None:
        required_keys = [f"q{i}" for i in range(1, 9)]
        for key in required_keys:
            if key not in self.responses:
                raise ValueError(f"Missing required response: {key}")
            if self.responses[key] not in (0, 1, 2):
                raise ValueError(f"Invalid response value for {key}: must be 0, 1, or 2")


class FIESCalculateRequest(BaseModel):
    responses: Dict[str, int] = Field(..., description="Survey responses (q1-q8, values 0-2)")

    def model_post_init(self, __context) -> None:
        required_keys = [f"q{i}" for i in range(1, 9)]
        for key in required_keys:
            if key not in self.responses:
                raise ValueError(f"Missing required response: {key}")
            if self.responses[key] not in (0, 1, 2):
                raise ValueError(f"Invalid response value for {key}: must be 0, 1, or 2")


class FIESResponse(BaseModel):
    id: UUID
    beneficiary_id: UUID
    responses: Dict[str, Any]
    score: int
    classification: str
    survey_date: datetime
    survey_month: int
    survey_year: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FIESCalculateResponse(BaseModel):
    score: int
    classification: str
    classification_display: str
    recommendations: List[str]


class FIESSurveyHistoryItem(BaseModel):
    id: UUID
    score: int
    classification: str
    survey_date: datetime
    survey_month: int
    survey_year: int

    model_config = ConfigDict(from_attributes=True)


class FIESSurveyTrend(BaseModel):
    improving: bool
    score_change: int
    previous_classification: Optional[str] = None


class FIESSurveyHistoryResponse(BaseModel):
    beneficiary_id: str
    surveys: List[FIESSurveyHistoryItem]
    trend: FIESSurveyTrend


class FIESLatestResponse(BaseModel):
    id: UUID
    beneficiary_id: UUID
    score: int
    classification: str
    survey_date: datetime
    survey_month: int
    survey_year: int
    responses: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)
