"""
Nutrition Router
Handles child growth measurements and WHO Z-Score calculation
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from decimal import Decimal

from app.database import get_db
from app.services.zscore_calculator import ZScoreCalculator
from app.middleware.auth import get_current_user, AuthenticatedUser
from app.schemas.nutrition import (
    NutritionMeasurementCreate,
    NutritionMeasurementResponse,
    ChildInfo,
    ChildResponse,
    GrowthChartData,
    NutritionHistoryResponse,
    ZScoreRequest,
    ZScoreResponse,
    WHOReferenceData,
    NutritionLatestMeasurementResponse,
)
from app.models.nutrition import NutritionMeasurement
from app.models.user import Child
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/nutrition", tags=["nutrition"])


@router.get("/children")
async def list_children(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """List children for authenticated beneficiary"""
    children = db.query(Child).filter(
        Child.beneficiary_id == current_user.user_id,
    ).order_by(Child.date_of_birth.desc()).all()

    result = []
    for c in children:
        today = date.today()
        age_months = max(0, (today.year - c.date_of_birth.year) * 12 + (today.month - c.date_of_birth.month))
        age_months = min(60, age_months)
        result.append(ChildResponse(
            id=c.id,
            full_name=c.full_name,
            date_of_birth=c.date_of_birth,
            age_months=age_months,
            gender=c.gender.value if c.gender else None,
        ).model_dump())

    return {"success": True, "data": result}


@router.post("/measurements", response_model=NutritionMeasurementResponse, status_code=status.HTTP_201_CREATED)
async def add_measurement(
    data: NutritionMeasurementCreate,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Add child growth measurement (beneficiary only, own children)"""
    # Verify child belongs to beneficiary
    child = db.query(Child).filter(
        Child.id == data.child_id,
        Child.beneficiary_id == current_user.user_id,
    ).first()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found or not yours",
        )

    # Calculate age in months
    today = data.measurement_date or date.today()
    age_months = max(0, (today.year - child.date_of_birth.year) * 12 + (today.month - child.date_of_birth.month))
    age_months = min(60, age_months)

    # Calculate Z-Scores
    zscore_data = ZScoreCalculator.calculate(
        age_months=age_months,
        gender=child.gender.value if child.gender else "male",
        weight=float(data.weight),
        height=float(data.height),
    )

    # Determine overall classification
    weight_class = zscore_data["weight_classification"]
    height_class = zscore_data["height_classification"]
    if weight_class == "severe_malnourished" or height_class == "severe_malnourished":
        classification = "severe_malnourished"
    elif weight_class == "moderate_malnourished" or height_class == "moderate_malnourished":
        classification = "moderate_malnourished"
    else:
        classification = "normal"

    measurement = NutritionMeasurement(
        child_id=data.child_id,
        measurement_date=data.measurement_date,
        weight=data.weight,
        height=data.height,
        muac=data.muac,
        z_score_weight=Decimal(str(zscore_data["z_score_weight"])),
        z_score_height=Decimal(str(zscore_data["z_score_height"])),
        classification=classification,
    )
    db.add(measurement)
    db.commit()
    db.refresh(measurement)

    logger.info(f"Measurement added: {measurement.id} for child {data.child_id}")
    return measurement


@router.get("/measurements/{child_id}")
async def get_measurement_history(
    child_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get growth measurement history for child"""
    # Verify child belongs to beneficiary
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.beneficiary_id == current_user.user_id,
    ).first()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found or not yours",
        )

    measurements = (
        db.query(NutritionMeasurement)
        .filter(NutritionMeasurement.child_id == child_id)
        .order_by(NutritionMeasurement.measurement_date.desc())
        .all()
    )

    # Calculate age
    today = date.today()
    age_months = max(0, (today.year - child.date_of_birth.year) * 12 + (today.month - child.date_of_birth.month))
    age_months = min(60, age_months)

    gender = child.gender.value if child.gender else "male"
    chart_data = ZScoreCalculator.get_growth_chart_data(age_months, gender)

    # Determine trend
    trend = "stable"
    if len(measurements) >= 2:
        latest_z = measurements[0].z_score_weight
        prev_z = measurements[1].z_score_weight
        if latest_z and prev_z:
            if float(latest_z) > float(prev_z) + 0.3:
                trend = "improving"
            elif float(latest_z) < float(prev_z) - 0.3:
                trend = "declining"

    chart_data["trend"] = trend

    return {
        "success": True,
        "data": NutritionHistoryResponse(
            child=ChildInfo(
                id=child.id,
                full_name=child.full_name,
                date_of_birth=child.date_of_birth,
                age_months=age_months,
                gender=gender,
            ),
            measurements=[NutritionMeasurementResponse.model_validate(m) for m in measurements],
            growth_chart_data=GrowthChartData(**chart_data),
        ).model_dump(),
    }


@router.post("/zscore")
async def calculate_zscore(data: ZScoreRequest):
    """Calculate WHO Z-Score from measurement (no auth required)"""
    result = ZScoreCalculator.calculate(
        age_months=data.age_months,
        gender=data.gender,
        weight=float(data.weight),
        height=float(data.height),
    )

    return {
        "success": True,
        "data": ZScoreResponse(
            z_score_weight=result["z_score_weight"],
            z_score_height=result["z_score_height"],
            weight_classification=result["weight_classification"],
            height_classification=result["height_classification"],
            who_reference=WHOReferenceData(**result["who_reference"]),
        ).model_dump(),
    }


@router.get("/{beneficiary_id}/latest-measurement")
async def get_latest_measurement(
    beneficiary_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get latest nutrition measurement for beneficiary's children"""
    # Get all children
    children = db.query(Child).filter(
        Child.beneficiary_id == beneficiary_id,
    ).all()

    # Get latest measurement per child
    results = []
    for child in children:
        latest = (
            db.query(NutritionMeasurement)
            .filter(NutritionMeasurement.child_id == child.id)
            .order_by(NutritionMeasurement.measurement_date.desc())
            .first()
        )

        if latest:
            results.append(
                NutritionLatestMeasurementResponse(
                    child_id=child.id,
                    child_name=child.full_name,
                    measurement=NutritionMeasurementResponse.model_validate(latest),
                ).model_dump()
            )

    logger.info(
        f"Latest nutrition measurements fetched for beneficiary {beneficiary_id}: {len(results)} children"
    )
    return {"success": True, "data": results}
