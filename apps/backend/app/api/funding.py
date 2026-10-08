"""Private donor usage reports and admin-only pooled donation ledger."""

from datetime import timezone
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import AuthenticatedUser, RequireRole
from app.models.donation import Donation, DonationStatusEnum
from app.models.facility import HealthFacility, OrderFundingAllocation, RecipientFamily
from app.models.product import Order

router = APIRouter(prefix="/funding", tags=["pooled funding"])


def _active_allocations(db: Session, donation_ids: list) -> list[OrderFundingAllocation]:
    if not donation_ids:
        return []
    return (
        db.query(OrderFundingAllocation)
        .filter(
            OrderFundingAllocation.donation_id.in_(donation_ids),
            OrderFundingAllocation.status.in_(("reserved", "spent")),
            OrderFundingAllocation.is_active.is_(True),
        )
        .order_by(OrderFundingAllocation.created_at, OrderFundingAllocation.id)
        .all()
    )


def _usage(db: Session, donations: list[Donation]) -> tuple[dict, list[dict]]:
    allocations = _active_allocations(db, [donation.id for donation in donations])
    totals = {donation.id: {"reserved": Decimal("0"), "spent": Decimal("0")} for donation in donations}
    details = []
    for allocation in allocations:
        totals[allocation.donation_id][allocation.status] += Decimal(allocation.amount)
        order = db.get(Order, allocation.order_id)
        family = db.get(RecipientFamily, order.family_id) if order else None
        facility = db.get(HealthFacility, order.health_facility_id) if order else None
        details.append({
            "donation_id": allocation.donation_id,
            "order_id": allocation.order_id,
            "amount": allocation.amount,
            "status": allocation.status,
            "family_name": family.head_name if family else None,
            "facility_name": facility.name if facility else None,
            "spent_at": allocation.spent_at.replace(tzinfo=timezone.utc) if allocation.spent_at else None,
        })
    return totals, details


@router.get("/my-donations")
def my_donation_usage(
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(RequireRole(["donor", "corporate_donor", "admin"])),
):
    donations = (
        db.query(Donation)
        .filter_by(donor_id=user.user_id, funding_flow="pooled", is_active=True)
        .order_by(Donation.created_at.desc(), Donation.id.desc())
        .all()
    )
    totals, details = _usage(db, donations)
    return [{
        "donation_id": donation.id,
        "amount": donation.amount,
        "status": donation.status.value,
        "spent_amount": totals[donation.id]["spent"],
        "reserved_amount": totals[donation.id]["reserved"],
        "available_amount": (
            max(Decimal("0"), Decimal(donation.amount) - totals[donation.id]["spent"] - totals[donation.id]["reserved"])
            if donation.status == DonationStatusEnum.success else Decimal("0")
        ),
        "recipients": [item for item in details if item["donation_id"] == donation.id and item["status"] == "spent"],
    } for donation in donations]


@router.get("/admin/pool")
def admin_pool(
    db: Session = Depends(get_db),
    _user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    donations = (
        db.query(Donation)
        .filter_by(status=DonationStatusEnum.success, funding_flow="pooled", is_active=True)
        .order_by(Donation.created_at.desc(), Donation.id.desc())
        .all()
    )
    totals, details = _usage(db, donations)
    total_received = sum((Decimal(d.amount) for d in donations), Decimal("0"))
    total_reserved = sum((item["reserved"] for item in totals.values()), Decimal("0"))
    total_spent = sum((item["spent"] for item in totals.values()), Decimal("0"))
    return {
        "total_received": total_received,
        "total_reserved": total_reserved,
        "total_spent": total_spent,
        "available_balance": total_received - total_reserved - total_spent,
        "donations": [{
            "donation_id": donation.id,
            "donor_name": (
                donation.donor_profile.user_profile.full_name
                if donation.donor_profile and donation.donor_profile.user_profile else "Donatur"
            ),
            "amount": donation.amount,
            "reserved_amount": totals[donation.id]["reserved"],
            "spent_amount": totals[donation.id]["spent"],
            "available_amount": Decimal(donation.amount) - totals[donation.id]["reserved"] - totals[donation.id]["spent"],
            "created_at": donation.created_at.replace(tzinfo=timezone.utc) if donation.created_at else None,
        } for donation in donations],
        "allocations": details,
    }
