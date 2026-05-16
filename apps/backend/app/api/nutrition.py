"""
Nutrition Router
Handles child growth measurements and WHO Z-Score calculation
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from decimal import Decimal
from uuid import UUID

from app.database import get_db
from app.services.zscore_calculator import ZScoreCalculator
from app.services import stunting_risk_service
from app.middleware.auth import get_current_user, RequireRole, AuthenticatedUser
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
    StuntingRiskResponse,
    StuntingRiskWithChild,
)
from app.models.nutrition import NutritionMeasurement, StuntingRiskPrediction
from app.models.user import Child, BeneficiaryProfile
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/nutrition", tags=["nutrition"])


def _to_uuid(value: str | UUID) -> UUID:
    """Normalize incoming ID values to UUID for UUID-backed columns."""
    if isinstance(value, UUID):
        return value
    return UUID(str(value))


@router.get("/children")
async def list_children(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """List children for authenticated beneficiary"""
    beneficiary_uuid = _to_uuid(current_user.user_id)
    children = db.query(Child).filter(
        Child.beneficiary_id == beneficiary_uuid,
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


@router.post("/children", response_model=ChildResponse, status_code=status.HTTP_201_CREATED)
async def add_child(
    full_name: str,
    date_of_birth: str,  # YYYY-MM-DD format
    gender: str,  # "male" or "female"
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Add a new child for beneficiary (nutrition tracking)"""
    try:
        from datetime import datetime
        dob = datetime.strptime(date_of_birth, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD",
        )
    
    from app.models.user import GenderEnum
    try:
        gender_enum = GenderEnum(gender.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gender must be 'male' or 'female'",
        )
    
    beneficiary_uuid = _to_uuid(current_user.user_id)
    child = Child(
        beneficiary_id=beneficiary_uuid,
        full_name=full_name,
        date_of_birth=dob,
        gender=gender_enum,
    )
    
    db.add(child)
    db.commit()
    db.refresh(child)
    
    # Calculate age
    today = date.today()
    age_months = max(0, (today.year - child.date_of_birth.year) * 12 + (today.month - child.date_of_birth.month))
    age_months = min(60, age_months)
    
    logger.info(f"Child added: {child.id} for beneficiary {current_user.user_id}")
    
    return ChildResponse(
        id=child.id,
        full_name=child.full_name,
        date_of_birth=child.date_of_birth,
        age_months=age_months,
        gender=child.gender.value if child.gender else None,
    )


@router.post("/measurements", response_model=NutritionMeasurementResponse, status_code=status.HTTP_201_CREATED)
async def add_measurement(
    data: NutritionMeasurementCreate,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Add child growth measurement (beneficiary only, own children)"""
    beneficiary_uuid = _to_uuid(current_user.user_id)
    # Verify child belongs to beneficiary
    child = db.query(Child).filter(
        Child.id == data.child_id,
        Child.beneficiary_id == beneficiary_uuid,
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

    # Run stunting-risk prediction (non-fatal: never block measurement save).
    try:
        stunting_risk_service.predict_for_child(db, child, persist=True)
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning(f"Stunting risk prediction failed for child {child.id}: {exc}")

    logger.info(f"Measurement added: {measurement.id} for child {data.child_id}")
    return measurement


@router.get("/measurements/{child_id}")
async def get_measurement_history(
    child_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get growth measurement history for child"""
    beneficiary_uuid = _to_uuid(current_user.user_id)
    child_uuid = _to_uuid(child_id)
    # Verify child belongs to beneficiary
    child = db.query(Child).filter(
        Child.id == child_uuid,
        Child.beneficiary_id == beneficiary_uuid,
    ).first()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found or not yours",
        )

    measurements = (
        db.query(NutritionMeasurement)
        .filter(NutritionMeasurement.child_id == child_uuid)
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


@router.get("/latest-measurement/{beneficiary_id}")
async def get_latest_measurement(
    beneficiary_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get latest nutrition measurement for beneficiary's children"""
    beneficiary_uuid = _to_uuid(beneficiary_id)
    # Get all children
    children = db.query(Child).filter(
        Child.beneficiary_id == beneficiary_uuid,
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
        f"Latest nutrition measurements fetched for beneficiary {beneficiary_uuid}: {len(results)} children"
    )
    return {"success": True, "data": results}


# ============================================
# Stunting Risk Prediction (AI Early Warning)
# ============================================
def _serialize_prediction(record: StuntingRiskPrediction) -> dict:
    """Convert ORM record into the StuntingRiskResponse shape."""
    return {
        "id": record.id,
        "child_id": record.child_id,
        "measurement_id": record.measurement_id,
        "risk_score": float(record.risk_score) if record.risk_score is not None else 0.0,
        "risk_level": record.risk_level,
        "horizon_months": record.horizon_months,
        "model_version": record.model_version,
        "dominant_factors": record.dominant_factors or [],
        "features": record.features or {},
        "created_at": record.created_at,
    }


@router.get("/risk/{child_id}")
async def get_child_risk(
    child_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Latest stunting-risk prediction for a single child.

    Beneficiary can only access own children. Admins/government can access any.
    """
    child_uuid = _to_uuid(child_id)
    child = db.query(Child).filter(Child.id == child_uuid).first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    if current_user.role == "beneficiary":
        beneficiary_uuid = _to_uuid(current_user.user_id)
        if child.beneficiary_id != beneficiary_uuid:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your child")

    prediction = stunting_risk_service.get_latest_prediction(db, child_uuid)
    if prediction is None:
        # No persisted record yet — compute on the fly without persisting if no measurements.
        result = stunting_risk_service.predict_for_child(db, child, persist=True)
        if result is None:
            return {"success": True, "data": None}
        prediction = stunting_risk_service.get_latest_prediction(db, child_uuid)

    return {
        "success": True,
        "data": StuntingRiskResponse(**_serialize_prediction(prediction)).model_dump(),
    }


@router.post("/risk/{child_id}/recompute", status_code=status.HTTP_201_CREATED)
async def recompute_child_risk(
    child_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Force a fresh prediction (e.g. after FIES update or new measurement)."""
    child_uuid = _to_uuid(child_id)
    child = db.query(Child).filter(Child.id == child_uuid).first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    if current_user.role == "beneficiary":
        beneficiary_uuid = _to_uuid(current_user.user_id)
        if child.beneficiary_id != beneficiary_uuid:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your child")

    result = stunting_risk_service.predict_for_child(db, child, persist=True)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No measurements available for prediction",
        )
    return {"success": True, "data": result}


@router.get("/risk/{child_id}/history")
async def get_risk_history(
    child_id: str,
    limit: int = 12,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Historical risk trajectory for a child."""
    child_uuid = _to_uuid(child_id)
    child = db.query(Child).filter(Child.id == child_uuid).first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    if current_user.role == "beneficiary":
        beneficiary_uuid = _to_uuid(current_user.user_id)
        if child.beneficiary_id != beneficiary_uuid:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your child")

    rows = (
        db.query(StuntingRiskPrediction)
        .filter(StuntingRiskPrediction.child_id == child_uuid)
        .order_by(StuntingRiskPrediction.created_at.desc())
        .limit(max(1, min(limit, 100)))
        .all()
    )
    data = [StuntingRiskResponse(**_serialize_prediction(r)).model_dump() for r in rows]
    return {"success": True, "data": data}


@router.get("/risk/beneficiary/me")
async def get_my_children_risk(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Risk summary for all children of the authenticated beneficiary."""
    beneficiary_uuid = _to_uuid(current_user.user_id)
    children = (
        db.query(Child).filter(Child.beneficiary_id == beneficiary_uuid).all()
    )

    summary = []
    for child in children:
        prediction = stunting_risk_service.get_latest_prediction(db, child.id)
        if prediction is None:
            continue
        today = date.today()
        age_months = max(0, (today.year - child.date_of_birth.year) * 12 + (today.month - child.date_of_birth.month))
        age_months = min(60, age_months)
        summary.append(
            StuntingRiskWithChild(
                child=ChildInfo(
                    id=child.id,
                    full_name=child.full_name,
                    date_of_birth=child.date_of_birth,
                    age_months=age_months,
                    gender=child.gender.value if child.gender else None,
                ),
                prediction=StuntingRiskResponse(**_serialize_prediction(prediction)),
            ).model_dump()
        )

    return {"success": True, "data": summary}


@router.get("/risk/high-risk")
async def list_high_risk_children(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RequireRole(["admin", "government"])),
):
    """Dashboard feed for admins: latest medium/high risk cases."""
    rows = stunting_risk_service.list_high_risk(db, limit=limit)
    data = []
    for prediction in rows:
        child = db.query(Child).filter(Child.id == prediction.child_id).first()
        if not child:
            continue
        today = date.today()
        age_months = max(0, (today.year - child.date_of_birth.year) * 12 + (today.month - child.date_of_birth.month))
        age_months = min(60, age_months)
        data.append(
            StuntingRiskWithChild(
                child=ChildInfo(
                    id=child.id,
                    full_name=child.full_name,
                    date_of_birth=child.date_of_birth,
                    age_months=age_months,
                    gender=child.gender.value if child.gender else None,
                ),
                prediction=StuntingRiskResponse(**_serialize_prediction(prediction)),
            ).model_dump()
        )
    return {"success": True, "data": data}
