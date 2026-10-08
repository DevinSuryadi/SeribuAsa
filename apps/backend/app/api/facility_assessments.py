"""Read-only FIES and growth summary for a facility-owned family."""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.facility_families import current_facility, owned_family
from app.database import get_db
from app.models.facility import HealthFacility
from app.services.facility_assessment import build_family_assessment

router = APIRouter(prefix="/facilities/families", tags=["facility assessments"])


@router.get("/{family_id}/assessment")
def get_family_assessment(
    family_id: UUID,
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
):
    family = owned_family(family_id, facility, db)
    return build_family_assessment(db, family)
