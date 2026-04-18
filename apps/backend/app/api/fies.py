"""
FIES Router
Handles FIES survey submission, calculation, and history
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date

from app.database import get_db
from app.services.fies_calculator import FIESCalculator
from app.middleware.auth import get_current_user, AuthenticatedUser
from app.models.nutrition import FIESSurvey
from app.schemas.fies import (
    FIESSubmit,
    FIESCalculateRequest,
    FIESSurveyHistoryItem,
    FIESSurveyTrend,
    FIESSurveyHistoryResponse,
    FIESLatestResponse,
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/fies", tags=["fies"])


@router.post("/submit", status_code=status.HTTP_201_CREATED)
async def submit_fies(
    data: FIESSubmit,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Submit FIES survey (beneficiary only, available tanggal 1-7)"""
    try:
        survey = FIESCalculator.submit_survey(
            db=db,
            beneficiary_id=current_user.user_id,
            responses=data.responses,
            survey_date=data.survey_date,
        )

        today = date.today()
        if today.month == 12:
            next_available = date(today.year + 1, 1, 1)
        else:
            next_available = date(today.year, today.month + 1, 1)

        return {
            "success": True,
            "data": {
                "survey_id": str(survey.id),
                "score": survey.score,
                "classification": survey.classification,
                "survey_date": survey.survey_date.isoformat(),
                "next_available_date": next_available.isoformat(),
            },
        }
    except ValueError as e:
        if "Sudah mengisi" in str(e):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/calculate")
async def calculate_fies(data: FIESCalculateRequest):
    """Calculate FIES score from responses (no auth required)"""
    score = FIESCalculator.calculate_score(data.responses)
    classification = FIESCalculator.classify_score(score)

    return {
        "success": True,
        "data": {
            "score": score,
            "classification": classification,
            "classification_display": FIESCalculator.get_classification_display(classification),
            "recommendations": FIESCalculator.get_recommendations(classification),
        },
    }


@router.get("/history/{beneficiary_id}")
async def get_fies_history(
    beneficiary_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get FIES survey history for beneficiary"""
    history = FIESCalculator.get_history(db, beneficiary_id)

    surveys = [
        FIESSurveyHistoryItem(
            id=s.id,
            score=s.score,
            classification=s.classification,
            survey_date=s.survey_date,
            survey_month=s.survey_month,
            survey_year=s.survey_year,
        )
        for s in history["surveys"]
    ]

    trend = FIESSurveyTrend(
        improving=history["trend"]["improving"],
        score_change=history["trend"]["score_change"],
        previous_classification=history["trend"]["previous_classification"],
    )

    return {
        "success": True,
        "data": FIESSurveyHistoryResponse(
            beneficiary_id=beneficiary_id,
            surveys=surveys,
            trend=trend,
        ).model_dump(),
    }


@router.get("/latest/{beneficiary_id}")
async def get_latest_fies(
    beneficiary_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get latest FIES survey for beneficiary"""
    survey = (
        db.query(FIESSurvey)
        .filter(FIESSurvey.beneficiary_id == beneficiary_id)
        .order_by(FIESSurvey.survey_date.desc())
        .first()
    )

    if not survey:
        # Return empty response instead of 404
        logger.info(f"No FIES survey found for beneficiary {beneficiary_id}")
        return {
            "success": True,
            "data": None,
        }

    logger.info(f"Latest FIES survey fetched for beneficiary {beneficiary_id}")
    return {
        "success": True,
        "data": FIESLatestResponse.model_validate(survey).model_dump(),
    }
