"""
Recommendations Router
Handles AI-powered nutrition recommendations
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.services.recommendation_engine import RecommendationEngine
from app.middleware.auth import get_current_user, AuthenticatedUser
from app.schemas.recommendations import RecommendationResponse, RecommendationItem
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/")
async def get_recommendations(
    child_id: Optional[str] = Query(None, description="Filter recommendations for specific child"),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get AI-generated recommendations based on FIES and nutrition data"""
    result = RecommendationEngine.generate(
        db=db,
        beneficiary_id=current_user.user_id,
        child_id=child_id,
    )

    recommendations = [
        RecommendationItem(**r) for r in result["recommendations"]
    ]

    return {
        "success": True,
        "data": RecommendationResponse(
            beneficiary_id=str(result["beneficiary_id"]),
            generated_at=result["generated_at"],
            recommendations=recommendations,
            next_review_date=result["next_review_date"],
        ).model_dump(),
    }
