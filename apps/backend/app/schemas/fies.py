"""
FIES Schemas
Pydantic schemas for FIES survey management
"""
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID


# ============================================
# FIES Survey Schemas
# ============================================
class FIESSubmit(BaseModel):
    responses: Dict[str, int] = Field(..., description="Survey responses (q1-q8, values 0-2)")
    survey_date: Optional[date] = None

    @field_validator("responses", mode="after")
    @classmethod
    def validate_responses_structure(cls, v: Dict[str, int]) -> Dict[str, int]:
        """Validate FIES responses: exactly 8 questions (q1-q8), each value 0-2"""
        required_keys = {f"q{i}" for i in range(1, 9)}
        provided_keys = set(v.keys())
        
        # Check for missing questions
        missing = required_keys - provided_keys
        if missing:
            raise ValueError(f"Missing required questions: {', '.join(sorted(missing))}")
        
        # Check for extra questions
        extra = provided_keys - required_keys
        if extra:
            raise ValueError(f"Invalid questions: {', '.join(sorted(extra))}. Only q1-q8 allowed")
        
        # Validate each response value
        for key in required_keys:
            value = v[key]
            if not isinstance(value, int):
                raise ValueError(f"Response {key} must be an integer, got {type(value).__name__}")
            if value not in (0, 1, 2):
                raise ValueError(f"Response {key} must be 0, 1, or 2, got {value}")
        
        return v


class FIESCalculateRequest(BaseModel):
    responses: Dict[str, int] = Field(..., description="Survey responses (q1-q8, values 0-2)")

    @field_validator("responses", mode="after")
    @classmethod
    def validate_responses_structure(cls, v: Dict[str, int]) -> Dict[str, int]:
        """Validate FIES responses: exactly 8 questions (q1-q8), each value 0-2"""
        required_keys = {f"q{i}" for i in range(1, 9)}
        provided_keys = set(v.keys())
        
        # Check for missing questions
        missing = required_keys - provided_keys
        if missing:
            raise ValueError(f"Missing required questions: {', '.join(sorted(missing))}")
        
        # Check for extra questions
        extra = provided_keys - required_keys
        if extra:
            raise ValueError(f"Invalid questions: {', '.join(sorted(extra))}. Only q1-q8 allowed")
        
        # Validate each response value
        for key in required_keys:
            value = v[key]
            if not isinstance(value, int):
                raise ValueError(f"Response {key} must be an integer, got {type(value).__name__}")
            if value not in (0, 1, 2):
                raise ValueError(f"Response {key} must be 0, 1, or 2, got {value}")
        
        return v


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
