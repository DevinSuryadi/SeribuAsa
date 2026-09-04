"""
Admin API (Async)
Handles admin dashboard stats, approvals, monitoring, and exports.
"""
from datetime import date
import csv
import io
import logging
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_async_db
from app.middleware.auth import AuthenticatedUser, RequireRole
from app.models.donation import Donation, DonationStatusEnum, Voucher, VoucherRedemption
from app.models.nutrition import AuditLog, FIESSurvey
from app.models.product import Order, Product
from app.models.user import BeneficiaryProfile, DonorProfile, UserProfile, VendorProfile
from app.schemas.admin import (
    AdminBeneficiaryEligibilityItem,
    AdminBeneficiaryEligibilityListResponse,
    AdminDonationItem,
    AdminDonationListResponse,
    AdminProductReviewItem,
    AdminProductReviewListResponse,
    AdminStatsResponse,
    AdminUserItem,
    AdminUserListResponse,
    AdminUserApprovalItem,
    AdminUserApprovalListResponse,
    ApprovalUpdateRequest,
)
from app.utils.cache import get_app_cache
from typing import Annotated

cache = get_app_cache()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])

# Type alias for database dependency
DbDep = Annotated[AsyncSession, Depends(get_async_db)]


def _total_pages(total: int, page_size: int) -> int:
    return (total + page_size - 1) // page_size if total > 0 else 0


def _normalize_status(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    normalized = value.strip().lower()
    return normalized or None


async def _record_audit_log(
    db: AsyncSession,
    actor_user_id: UUID,
    action: str,
    entity_type: str,
    entity_id: UUID,
    old_values: Optional[dict] = None,
    new_values: Optional[dict] = None,
) -> None:
    result = await db.execute(
        select(UserProfile.user_id).where(UserProfile.user_id == actor_user_id)
    )
    actor_exists = result.first()
    
    audit_entry = AuditLog(
        user_id=actor_user_id if actor_exists else None,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_values=old_values,
        new_values=new_values,
    )
    db.add(audit_entry)


async def _latest_survey_lookup(
    db: AsyncSession, beneficiary_ids: list[UUID]
) -> dict[UUID, FIESSurvey]:
    if not beneficiary_ids:
        return {}

    # Build subquery for latest survey per beneficiary
    latest_survey_subquery = (
        select(
            FIESSurvey.beneficiary_id.label("beneficiary_id"),
            func.max(FIESSurvey.survey_date).label("latest_survey_date"),
        )
        .where(FIESSurvey.beneficiary_id.in_(beneficiary_ids))
        .group_by(FIESSurvey.beneficiary_id)
        .subquery()
    )

    result = await db.execute(
        select(FIESSurvey)
        .join(
            latest_survey_subquery,
            and_(
                FIESSurvey.beneficiary_id == latest_survey_subquery.c.beneficiary_id,
                FIESSurvey.survey_date == latest_survey_subquery.c.latest_survey_date,
            ),
        )
    )
    surveys = result.scalars().all()
    return {survey.beneficiary_id: survey for survey in surveys}


def _build_beneficiary_approval_item(
    user_profile: UserProfile,
    profile: BeneficiaryProfile,
    latest_survey: Optional[FIESSurvey],
) -> AdminUserApprovalItem:
    return AdminUserApprovalItem(
        user_id=user_profile.user_id,
        full_name=user_profile.full_name,
        role="beneficiary",
        approval_status=profile.approval_status,
        phone=user_profile.phone,
        address=user_profile.address,
        created_at=user_profile.created_at,
        updated_at=user_profile.updated_at,
        family_size=profile.family_size,
        vouchers_balance=Decimal(profile.vouchers_balance or Decimal("0")),
        latest_fies_score=latest_survey.score if latest_survey else None,
        latest_fies_classification=latest_survey.classification if latest_survey else None,
        latest_survey_date=latest_survey.survey_date if latest_survey else None,
    )


def _build_vendor_approval_item(
    user_profile: UserProfile,
    profile: VendorProfile,
) -> AdminUserApprovalItem:
    return AdminUserApprovalItem(
        user_id=user_profile.user_id,
        full_name=user_profile.full_name,
        role="vendor",
        approval_status=profile.approval_status,
        phone=user_profile.phone,
        address=user_profile.address,
        created_at=user_profile.created_at,
        updated_at=user_profile.updated_at,
        store_name=profile.store_name,
        store_address=profile.store_address,
    )


def _build_admin_user_item(
    user_profile: UserProfile,
    role: str,
    approval_status: str,
) -> AdminUserItem:
    return AdminUserItem(
        user_id=user_profile.user_id,
        full_name=user_profile.full_name,
        role=role,
        approval_status=approval_status,
        phone=user_profile.phone,
        address=user_profile.address,
        created_at=user_profile.created_at,
        updated_at=user_profile.updated_at,
    )


def _build_product_review_item(product: Product) -> AdminProductReviewItem:
    return AdminProductReviewItem(
        id=product.id,
        vendor_id=product.vendor_id,
        vendor_store_name=product.vendor_profile.store_name if product.vendor_profile else None,
        category_id=product.category_id,
        category_name=product.category.name if product.category else None,
        name=product.name,
        description=product.description,
        price=product.price,
        voucher_price=product.voucher_price,
        stock_quantity=product.stock_quantity,
        unit=product.unit,
        approval_status=product.approval_status,
        created_at=product.created_at,
        updated_at=product.updated_at,
    )


def _resolve_donation_recipient_name(donation: Donation) -> tuple[Optional[UUID], Optional[str]]:
    allocated_beneficiaries = [
        voucher.beneficiary_profile
        for voucher in donation.vouchers
        if voucher.beneficiary_profile is not None
    ]
    unique_profiles = {
        str(profile.user_id): profile
        for profile in allocated_beneficiaries
    }

    if len(unique_profiles) == 1:
        profile = next(iter(unique_profiles.values()))
        name = profile.user_profile.full_name if profile.user_profile else None
        return profile.user_id, name

    if len(unique_profiles) > 1:
        return None, f"{len(unique_profiles)} penerima teralokasi"

    return donation.recipient_id, None


def _build_admin_donation_item(donation: Donation) -> AdminDonationItem:
    voucher_balances = [Decimal(voucher.balance or Decimal("0")) for voucher in donation.vouchers]
    allocation_balances = [
        Decimal(allocation.original_amount or Decimal("0"))
        for allocation in donation.wallet_allocations
    ]
    allocation_amounts = allocation_balances or voucher_balances
    allocated_total = sum(allocation_amounts, Decimal("0"))
    allocated_beneficiaries = (
        len({str(allocation.beneficiary_id) for allocation in donation.wallet_allocations})
        if donation.wallet_allocations
        else len({str(voucher.beneficiary_id) for voucher in donation.vouchers})
    )

    if donation.status == DonationStatusEnum.pending:
        allocation_status = "pending_payment"
    elif donation.status == DonationStatusEnum.failed:
        allocation_status = "failed"
    elif donation.status == DonationStatusEnum.refunded:
        allocation_status = "refunded"
    elif allocated_beneficiaries > 0:
        allocation_status = "allocated"
    else:
        allocation_status = "no_eligible_beneficiary"

    recipient_id, recipient_name = _resolve_donation_recipient_name(donation)

    return AdminDonationItem(
        id=donation.id,
        donor_id=donation.donor_id,
        donor_name=(
            donation.donor_profile.user_profile.full_name
            if donation.donor_profile and donation.donor_profile.user_profile
            else None
        ),
        recipient_id=recipient_id,
        recipient_name=recipient_name,
        amount=donation.amount,
        type=donation.type.value if hasattr(donation.type, "value") else str(donation.type),
        payment_method=donation.payment_method,
        status=donation.status.value if hasattr(donation.status, "value") else str(donation.status),
        midtrans_transaction_id=donation.midtrans_transaction_id,
        created_at=donation.created_at,
        updated_at=donation.updated_at,
        voucher_created=allocated_beneficiaries > 0,
        allocated_beneficiaries=allocated_beneficiaries,
        allocated_total=allocated_total,
        allocation_status=allocation_status,
    )


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    db: DbDep,
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """Get admin dashboard statistics."""
    # Try cache first
    cached = cache.get("stats", "dashboard")
    if cached:
        logger.debug("Admin stats cache hit")
        return AdminStatsResponse(**cached)
    
    # User counts
    result = await db.execute(select(func.count()).select_from(UserProfile))
    total_users = result.scalar() or 0
    
    result = await db.execute(select(func.count()).select_from(DonorProfile))
    total_donors = result.scalar() or 0
    
    result = await db.execute(select(func.count()).select_from(BeneficiaryProfile))
    total_beneficiaries = result.scalar() or 0
    
    result = await db.execute(select(func.count()).select_from(VendorProfile))
    total_vendors = result.scalar() or 0
    
    result = await db.execute(
        select(func.count()).select_from(BeneficiaryProfile)
        .where(BeneficiaryProfile.approval_status == "pending")
    )
    pending_beneficiaries = result.scalar() or 0
    
    result = await db.execute(
        select(func.count()).select_from(VendorProfile)
        .where(VendorProfile.approval_status == "pending")
    )
    pending_vendors = result.scalar() or 0

    # Voucher counts
    result = await db.execute(
        select(func.count(Voucher.id)).where(
            Voucher.balance > 0,
            Voucher.status == "active",
        )
    )
    active_vouchers = result.scalar() or 0
    
    result = await db.execute(
        select(func.sum(Voucher.balance)).where(Voucher.balance > 0)
    )
    total_voucher_balance = result.scalar() or 0

    # Order counts
    result = await db.execute(select(func.count()).select_from(Order))
    total_orders = result.scalar() or 0
    
    result = await db.execute(
        select(func.count()).select_from(Order).where(Order.status == "completed")
    )
    completed_orders = result.scalar() or 0
    
    result = await db.execute(
        select(func.count()).select_from(Order).where(Order.status == "pending")
    )
    pending_orders = result.scalar() or 0

    # Redemption counts
    result = await db.execute(select(func.count()).select_from(VoucherRedemption))
    total_redemptions = result.scalar() or 0
    
    result = await db.execute(select(func.sum(VoucherRedemption.amount)))
    total_redemption_amount = result.scalar() or 0

    # Product counts
    result = await db.execute(
        select(func.count()).select_from(Product).where(Product.is_active)
    )
    total_products = result.scalar() or 0
    
    result = await db.execute(
        select(func.count()).select_from(Product)
        .where(Product.is_active, Product.approval_status == "pending")
    )
    pending_products = result.scalar() or 0
    
    result = await db.execute(
        select(func.count()).select_from(Product)
        .where(Product.is_active, Product.approval_status == "approved")
    )
    approved_products = result.scalar() or 0
    
    result = await db.execute(
        select(func.count()).select_from(Product)
        .where(Product.is_active, Product.approval_status == "rejected")
    )
    rejected_products = result.scalar() or 0

    # Donation counts
    result = await db.execute(
        select(func.sum(Donation.amount)).where(Donation.status == DonationStatusEnum.success)
    )
    total_donations = result.scalar() or 0
    
    result = await db.execute(
        select(func.count()).select_from(Donation)
        .where(Donation.status == DonationStatusEnum.success)
    )
    success_count = result.scalar() or 0
    
    result = await db.execute(
        select(func.count()).select_from(Donation)
        .where(Donation.status == DonationStatusEnum.pending)
    )
    pending_count = result.scalar() or 0
    
    result = await db.execute(
        select(func.count()).select_from(Donation)
        .where(Donation.status == DonationStatusEnum.failed)
    )
    failed_count = result.scalar() or 0
    
    result = await db.execute(
        select(func.count()).select_from(Donation)
        .where(Donation.status == DonationStatusEnum.refunded)
    )
    refunded_count = result.scalar() or 0
    
    # Unallocated success donations
    from sqlalchemy import not_
    result = await db.execute(
        select(func.count()).select_from(Donation)
        .where(
            Donation.status == DonationStatusEnum.success,
            not_(Donation.vouchers.any()),
        )
    )
    unallocated_success_count = result.scalar() or 0

    result = AdminStatsResponse(
        users={
            "total": total_users,
            "donors": total_donors,
            "beneficiaries": total_beneficiaries,
            "vendors": total_vendors,
            "pending_beneficiaries": pending_beneficiaries,
            "pending_vendors": pending_vendors,
        },
        products={
            "total": total_products,
            "pending": pending_products,
            "approved": approved_products,
            "rejected": rejected_products,
        },
        vouchers={
            "active_count": active_vouchers,
            "total_balance": float(total_voucher_balance or 0),
        },
        orders={
            "total": total_orders,
            "completed": completed_orders,
            "pending": pending_orders,
        },
        redemptions={
            "total_count": total_redemptions,
            "total_amount": float(total_redemption_amount or 0),
        },
        donations={
            "total_amount": float(total_donations or 0),
            "success_count": success_count,
            "pending_count": pending_count,
            "failed_count": failed_count,
            "refunded_count": refunded_count,
            "unallocated_success_count": unallocated_success_count,
        },
    )
    
    # Cache for 2 minutes
    cache.set("stats", "dashboard", result.model_dump(), ttl_seconds=120)
    return result


@router.get("/users", response_model=AdminUserListResponse)
async def list_admin_users(
    db: DbDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    role: Optional[str] = Query(None, description="user, beneficiary, donor, or vendor"),
    approval_status: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """List all user profiles for admin with role and approval filters."""
    normalized_role = _normalize_status(role)
    normalized_status = _normalize_status(approval_status)
    if normalized_role not in {None, "user", "beneficiary", "donor", "vendor"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role filter")
    if normalized_status not in {None, "pending", "approved", "rejected"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status filter")

    search_term = search.strip().lower() if search else None
    rows: list[AdminUserItem] = []

    # Build base query with joins
    base_stmt = (
        select(UserProfile)
        .outerjoin(DonorProfile, DonorProfile.user_id == UserProfile.user_id)
        .outerjoin(BeneficiaryProfile, BeneficiaryProfile.user_id == UserProfile.user_id)
        .outerjoin(VendorProfile, VendorProfile.user_id == UserProfile.user_id)
        .where(UserProfile.is_active)
    )

    if search_term:
        base_stmt = base_stmt.where(
            or_(
                UserProfile.full_name.ilike(f"%{search_term}%"),
                UserProfile.phone.ilike(f"%{search_term}%"),
                UserProfile.address.ilike(f"%{search_term}%"),
            )
        )

    if normalized_role == "donor":
        base_stmt = base_stmt.where(DonorProfile.user_id.isnot(None))
    elif normalized_role == "beneficiary":
        base_stmt = base_stmt.where(BeneficiaryProfile.user_id.isnot(None))
    elif normalized_role == "vendor":
        base_stmt = base_stmt.where(VendorProfile.user_id.isnot(None))
    elif normalized_role == "user":
        base_stmt = base_stmt.where(
            DonorProfile.user_id.is_(None),
            BeneficiaryProfile.user_id.is_(None),
            VendorProfile.user_id.is_(None),
        )

    if normalized_status:
        if normalized_role == "beneficiary":
            base_stmt = base_stmt.where(BeneficiaryProfile.approval_status == normalized_status)
        elif normalized_role == "vendor":
            base_stmt = base_stmt.where(VendorProfile.approval_status == normalized_status)
        elif normalized_role in {"donor", "user"}:
            if normalized_status != "approved":
                base_stmt = base_stmt.where(False)
        else:
            if normalized_status == "approved":
                base_stmt = base_stmt.where(
                    or_(
                        DonorProfile.user_id.isnot(None),
                        and_(
                            BeneficiaryProfile.user_id.isnot(None),
                            BeneficiaryProfile.approval_status == "approved",
                        ),
                        and_(
                            VendorProfile.user_id.isnot(None),
                            VendorProfile.approval_status == "approved",
                        ),
                        and_(
                            DonorProfile.user_id.is_(None),
                            BeneficiaryProfile.user_id.is_(None),
                            VendorProfile.user_id.is_(None),
                        ),
                    )
                )
            else:
                base_stmt = base_stmt.where(
                    or_(
                        and_(
                            BeneficiaryProfile.user_id.isnot(None),
                            BeneficiaryProfile.approval_status == normalized_status,
                        ),
                        and_(
                            VendorProfile.user_id.isnot(None),
                            VendorProfile.approval_status == normalized_status,
                        ),
                    )
                )

    # Eager load relationships
    stmt = (
        base_stmt
        .options(
            selectinload(UserProfile.donor_profile),
            selectinload(UserProfile.beneficiary_profile),
            selectinload(UserProfile.vendor_profile),
        )
        .order_by(UserProfile.created_at.desc())
    )

    # Get total count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    result = await db.execute(count_stmt)
    total = result.scalar() or 0

    # Get paginated results
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    user_profiles = result.scalars().all()

    for user_profile in user_profiles:
        role_value: Optional[str] = None
        approval_status_value: Optional[str] = None

        if user_profile.donor_profile:
            role_value = "donor"
            approval_status_value = "approved"
        elif user_profile.beneficiary_profile:
            role_value = "beneficiary"
            approval_status_value = user_profile.beneficiary_profile.approval_status or "pending"
        elif user_profile.vendor_profile:
            role_value = "vendor"
            approval_status_value = user_profile.vendor_profile.approval_status or "pending"
        else:
            role_value = "user"
            approval_status_value = "approved"

        rows.append(_build_admin_user_item(user_profile, role_value, approval_status_value))

    return AdminUserListResponse(
        items=rows,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=_total_pages(total, page_size),
    )


@router.get("/users/approvals", response_model=AdminUserApprovalListResponse)
async def list_user_approvals(
    db: DbDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[str] = Query(None, description="beneficiary or vendor"),
    approval_status: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """List beneficiary and vendor accounts that need admin review."""
    normalized_role = _normalize_status(role)
    normalized_status = _normalize_status(approval_status)
    if normalized_role not in {None, "beneficiary", "vendor"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role filter")
    if normalized_status not in {None, "pending", "approved", "rejected"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status filter")

    items: list[AdminUserApprovalItem] = []
    search_term = search.strip().lower() if search else None

    if normalized_role in (None, "beneficiary"):
        beneficiary_stmt = (
            select(UserProfile, BeneficiaryProfile)
            .join(BeneficiaryProfile, BeneficiaryProfile.user_id == UserProfile.user_id)
            .where(UserProfile.is_active, BeneficiaryProfile.is_active)
        )
        if normalized_status:
            beneficiary_stmt = beneficiary_stmt.where(BeneficiaryProfile.approval_status == normalized_status)
        if search_term:
            beneficiary_stmt = beneficiary_stmt.where(UserProfile.full_name.ilike(f"%{search_term}%"))

        # Get count
        count_stmt = select(func.count()).select_from(beneficiary_stmt.subquery())
        result = await db.execute(count_stmt)
        total = result.scalar() or 0

        # Get paginated results
        beneficiary_stmt = (
            beneficiary_stmt
            .order_by(UserProfile.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await db.execute(beneficiary_stmt)
        beneficiary_rows = result.all()
        
        survey_lookup = await _latest_survey_lookup(db, [profile.user_id for _, profile in beneficiary_rows])
        items = [
            _build_beneficiary_approval_item(user_profile, profile, survey_lookup.get(profile.user_id))
            for user_profile, profile in beneficiary_rows
        ]

    if normalized_role == "vendor":
        vendor_stmt = (
            select(UserProfile, VendorProfile)
            .join(VendorProfile, VendorProfile.user_id == UserProfile.user_id)
            .where(UserProfile.is_active, VendorProfile.is_active)
        )
        if normalized_status:
            vendor_stmt = vendor_stmt.where(VendorProfile.approval_status == normalized_status)
        if search_term:
            vendor_stmt = vendor_stmt.where(
                or_(
                    UserProfile.full_name.ilike(f"%{search_term}%"),
                    VendorProfile.store_name.ilike(f"%{search_term}%"),
                )
            )

        # Get count
        count_stmt = select(func.count()).select_from(vendor_stmt.subquery())
        result = await db.execute(count_stmt)
        total = result.scalar() or 0

        # Get paginated results
        vendor_stmt = (
            vendor_stmt
            .order_by(UserProfile.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await db.execute(vendor_stmt)
        vendor_rows = result.all()
        
        items = [
            _build_vendor_approval_item(user_profile, profile)
            for user_profile, profile in vendor_rows
        ]

    if normalized_role is None:
        # Get both beneficiary and vendor approvals with proper pagination
        beneficiary_stmt = (
            select(UserProfile, BeneficiaryProfile)
            .join(BeneficiaryProfile, BeneficiaryProfile.user_id == UserProfile.user_id)
            .where(UserProfile.is_active, BeneficiaryProfile.is_active)
        )
        if normalized_status:
            beneficiary_stmt = beneficiary_stmt.where(BeneficiaryProfile.approval_status == normalized_status)
        if search_term:
            beneficiary_stmt = beneficiary_stmt.where(UserProfile.full_name.ilike(f"%{search_term}%"))

        vendor_stmt = (
            select(UserProfile, VendorProfile)
            .join(VendorProfile, VendorProfile.user_id == UserProfile.user_id)
            .where(UserProfile.is_active, VendorProfile.is_active)
        )
        if normalized_status:
            vendor_stmt = vendor_stmt.where(VendorProfile.approval_status == normalized_status)
        if search_term:
            vendor_stmt = vendor_stmt.where(
                or_(
                    UserProfile.full_name.ilike(f"%{search_term}%"),
                    VendorProfile.store_name.ilike(f"%{search_term}%"),
                )
            )

        # Get total count
        beneficiary_count_stmt = select(func.count()).select_from(beneficiary_stmt.subquery())
        vendor_count_stmt = select(func.count()).select_from(vendor_stmt.subquery())
        
        result_b = await db.execute(beneficiary_count_stmt)
        result_v = await db.execute(vendor_count_stmt)
        total = (result_b.scalar() or 0) + (result_v.scalar() or 0)
        
        # Fetch both with generous limit and combine
        beneficiary_rows_result = await db.execute(
            beneficiary_stmt.order_by(UserProfile.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        beneficiary_rows = beneficiary_rows_result.all()
        
        vendor_rows_result = await db.execute(
            vendor_stmt.order_by(UserProfile.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        vendor_rows = vendor_rows_result.all()
        
        survey_lookup = await _latest_survey_lookup(db, [profile.user_id for _, profile in beneficiary_rows])
        items = []
        items.extend(
            _build_beneficiary_approval_item(user_profile, profile, survey_lookup.get(profile.user_id))
            for user_profile, profile in beneficiary_rows
        )
        items.extend(
            _build_vendor_approval_item(user_profile, profile)
            for user_profile, profile in vendor_rows
        )
        items.sort(key=lambda item: item.created_at, reverse=True)
        items = items[:page_size]

    return AdminUserApprovalListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=_total_pages(total, page_size),
    )


@router.patch("/users/{user_id}/approval", response_model=AdminUserApprovalItem)
async def update_user_approval(
    user_id: UUID,
    data: ApprovalUpdateRequest,
    db: DbDep,
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """Approve or reject beneficiary and vendor accounts."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    user_profile = result.scalar_one_or_none()
    
    if not user_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    result = await db.execute(
        select(BeneficiaryProfile).where(BeneficiaryProfile.user_id == user_id)
    )
    beneficiary_profile = result.scalar_one_or_none()

    result = await db.execute(
        select(VendorProfile).where(VendorProfile.user_id == user_id)
    )
    vendor_profile = result.scalar_one_or_none()

    try:
        if beneficiary_profile:
            old_status = beneficiary_profile.approval_status
            beneficiary_profile.approval_status = data.approval_status
            await _record_audit_log(
                db,
                current_user.user_id,
                action=f"beneficiary_{data.approval_status}",
                entity_type="beneficiary_profile",
                entity_id=beneficiary_profile.user_id,
                old_values={"approval_status": old_status},
                new_values={"approval_status": data.approval_status, "notes": data.notes},
            )
            await db.commit()
            await db.refresh(beneficiary_profile)
            cache.invalidate_namespace("stats")
            
            latest_survey = await _latest_survey_lookup(db, [beneficiary_profile.user_id])
            survey = latest_survey.get(beneficiary_profile.user_id)
            return _build_beneficiary_approval_item(user_profile, beneficiary_profile, survey)

        if vendor_profile:
            old_status = vendor_profile.approval_status
            vendor_profile.approval_status = data.approval_status
            await _record_audit_log(
                db,
                current_user.user_id,
                action=f"vendor_{data.approval_status}",
                entity_type="vendor_profile",
                entity_id=vendor_profile.user_id,
                old_values={"approval_status": old_status},
                new_values={"approval_status": data.approval_status, "notes": data.notes},
            )
            await db.commit()
            await db.refresh(vendor_profile)
            cache.invalidate_namespace("stats")
            return _build_vendor_approval_item(user_profile, vendor_profile)

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only beneficiary and vendor accounts support approval workflow",
        )
    except HTTPException:
        await db.rollback()
        raise
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update approval status",
        )


@router.get("/products/reviews", response_model=AdminProductReviewListResponse)
async def list_product_reviews(
    db: DbDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    approval_status: Optional[str] = Query(None, alias="status"),
    vendor_id: Optional[UUID] = Query(None),
    search: Optional[str] = Query(None),
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """List product catalog submissions across approval states."""
    normalized_status = _normalize_status(approval_status)
    if normalized_status not in {None, "pending", "approved", "rejected"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status filter")

    stmt = (
        select(Product)
        .options(
            selectinload(Product.category),
            selectinload(Product.vendor_profile).selectinload(VendorProfile.user_profile),
        )
        .where(Product.is_active)
    )
    if normalized_status:
        stmt = stmt.where(Product.approval_status == normalized_status)
    if vendor_id:
        stmt = stmt.where(Product.vendor_id == vendor_id)
    if search:
        stmt = stmt.where(Product.name.ilike(f"%{search.strip()}%"))

    # Get count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    result = await db.execute(count_stmt)
    total = result.scalar() or 0

    # Get paginated results
    stmt = (
        stmt.order_by(Product.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    products = result.scalars().all()

    return AdminProductReviewListResponse(
        items=[_build_product_review_item(product) for product in products],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=_total_pages(total, page_size),
    )


@router.patch("/products/{product_id}/approval", response_model=AdminProductReviewItem)
async def update_product_approval(
    product_id: UUID,
    data: ApprovalUpdateRequest,
    db: DbDep,
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """Approve or reject catalog products."""
    result = await db.execute(
        select(Product)
        .options(
            selectinload(Product.category),
            selectinload(Product.vendor_profile).selectinload(VendorProfile.user_profile),
        )
        .where(Product.id == product_id, Product.is_active)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    try:
        old_status = product.approval_status
        product.approval_status = data.approval_status
        await _record_audit_log(
            db,
            current_user.user_id,
            action=f"product_{data.approval_status}",
            entity_type="product",
            entity_id=product.id,
            old_values={"approval_status": old_status},
            new_values={"approval_status": data.approval_status, "notes": data.notes},
        )
        await db.commit()
        await db.refresh(product)
        cache.invalidate_namespace("stats")

        return _build_product_review_item(product)
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update product approval",
        )


@router.get("/donations", response_model=AdminDonationListResponse)
async def list_admin_donations(
    db: DbDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    payment_status: Optional[str] = Query(None, alias="status"),
    allocation_status: Optional[str] = Query(None),
    donor_id: Optional[UUID] = Query(None),
    search: Optional[str] = Query(None),
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """List all donations with payment and allocation visibility for admin."""
    normalized_payment_status = _normalize_status(payment_status)
    normalized_allocation_status = _normalize_status(allocation_status)
    allowed_payment_statuses = {None, "pending", "success", "failed", "refunded"}
    allowed_allocation_statuses = {None, "pending_payment", "allocated", "no_eligible_beneficiary", "failed", "refunded"}

    if normalized_payment_status not in allowed_payment_statuses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status filter")
    if normalized_allocation_status not in allowed_allocation_statuses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid allocation_status filter")

    stmt = (
        select(Donation)
        .options(
            selectinload(Donation.donor_profile).selectinload(DonorProfile.user_profile),
            selectinload(Donation.wallet_allocations),
            selectinload(Donation.vouchers)
            .selectinload(Voucher.beneficiary_profile)
            .selectinload(BeneficiaryProfile.user_profile),
        )
    )
    if normalized_payment_status:
        stmt = stmt.where(Donation.status == normalized_payment_status)
    if donor_id:
        stmt = stmt.where(Donation.donor_id == donor_id)

    # Get count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    result = await db.execute(count_stmt)
    total = result.scalar() or 0

    # Get paginated results
    stmt = (
        stmt.order_by(Donation.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    donations = result.scalars().all()
    
    items = [_build_admin_donation_item(donation) for donation in donations]

    if normalized_allocation_status:
        items = [item for item in items if item.allocation_status == normalized_allocation_status]

    if search:
        search_term = search.strip().lower()
        items = [
            item
            for item in items
            if search_term in (item.donor_name or "").lower()
            or search_term in (item.recipient_name or "").lower()
            or search_term in (item.midtrans_transaction_id or "").lower()
        ]

    return AdminDonationListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=_total_pages(total, page_size),
    )


@router.get("/beneficiaries/eligibility", response_model=AdminBeneficiaryEligibilityListResponse)
async def list_beneficiary_eligibility(
    db: DbDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    year: Optional[int] = Query(None, ge=2000, le=2100),
    month: Optional[int] = Query(None, ge=1, le=12),
    approval_status: Optional[str] = Query(None, alias="status"),
    eligible_only: bool = Query(False),
    search: Optional[str] = Query(None),
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """List beneficiary eligibility for monthly donation allocation."""
    normalized_status = _normalize_status(approval_status)
    if normalized_status not in {None, "pending", "approved", "rejected"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status filter")

    today = date.today()
    allocation_year = year or today.year
    allocation_month = month or today.month
    allocation_date = date(allocation_year, allocation_month, 1)

    stmt = (
        select(UserProfile, BeneficiaryProfile)
        .join(BeneficiaryProfile, BeneficiaryProfile.user_id == UserProfile.user_id)
        .where(UserProfile.is_active, BeneficiaryProfile.is_active)
    )
    if normalized_status:
        stmt = stmt.where(BeneficiaryProfile.approval_status == normalized_status)
    if search:
        stmt = stmt.where(UserProfile.full_name.ilike(f"%{search.strip()}%"))

    # Get count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    result = await db.execute(count_stmt)
    total = result.scalar() or 0

    # Get paginated results
    stmt = (
        stmt.order_by(UserProfile.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    rows = result.all()
    
    survey_lookup = await _latest_survey_lookup(db, [profile.user_id for _, profile in rows])

    items: list[AdminBeneficiaryEligibilityItem] = []
    for user_profile, profile in rows:
        latest_survey = survey_lookup.get(profile.user_id)
        has_current_month_survey = bool(
            latest_survey
            and latest_survey.survey_year == allocation_year
            and latest_survey.survey_month == allocation_month
        )
        is_eligible = (
            profile.approval_status == "approved"
            and has_current_month_survey
        )

        item = AdminBeneficiaryEligibilityItem(
            user_id=user_profile.user_id,
            full_name=user_profile.full_name,
            approval_status=profile.approval_status,
            family_size=profile.family_size or 1,
            vouchers_balance=Decimal(profile.vouchers_balance or Decimal("0")),
            latest_fies_score=latest_survey.score if latest_survey else None,
            latest_fies_classification=latest_survey.classification if latest_survey else None,
            latest_survey_date=latest_survey.survey_date if latest_survey else None,
            has_current_month_survey=has_current_month_survey,
            eligible_for_allocation=is_eligible,
            allocation_month=allocation_date,
        )

        if not eligible_only or item.eligible_for_allocation:
            items.append(item)

    return AdminBeneficiaryEligibilityListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=_total_pages(total, page_size),
    )


@router.get("/export/users")
async def export_users(
    db: DbDep,
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """Export users to CSV."""
    result = await db.execute(
        select(UserProfile)
        .options(
            selectinload(UserProfile.donor_profile),
            selectinload(UserProfile.beneficiary_profile),
            selectinload(UserProfile.vendor_profile),
        )
    )
    users = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["user_id", "full_name", "nik", "phone", "address", "role", "created_at"])

    for user in users:
        role = "unknown"
        if user.donor_profile:
            role = "donor"
        elif user.beneficiary_profile:
            role = "beneficiary"
        elif user.vendor_profile:
            role = "vendor"

        writer.writerow(
            [
                str(user.user_id),
                user.full_name,
                user.nik or "",
                user.phone or "",
                user.address or "",
                role,
                user.created_at.isoformat() if user.created_at else "",
            ]
        )

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=users.csv"},
    )


@router.get("/export/orders")
async def export_orders(
    db: DbDep,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """Export orders to CSV."""
    stmt = select(Order)

    if start_date:
        stmt = stmt.where(Order.created_at >= start_date)
    if end_date:
        stmt = stmt.where(Order.created_at <= end_date)

    stmt = stmt.order_by(Order.created_at.desc())
    result = await db.execute(stmt)
    orders = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["order_id", "beneficiary_id", "vendor_id", "total_amount", "status", "created_at"])

    for order in orders:
        writer.writerow(
            [
                str(order.id),
                str(order.beneficiary_id),
                str(order.vendor_id),
                float(order.total_amount or 0),
                order.status,
                order.created_at.isoformat() if order.created_at else "",
            ]
        )

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=orders.csv"},
    )


@router.get("/export/vouchers")
async def export_vouchers(
    db: DbDep,
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """Export vouchers to CSV."""
    stmt = select(Voucher).order_by(Voucher.created_at.desc()).limit(1000)
    result = await db.execute(stmt)
    vouchers = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["voucher_id", "code", "beneficiary_id", "balance", "status", "expiry_date", "created_at"])

    for voucher in vouchers:
        writer.writerow(
            [
                str(voucher.id),
                voucher.code,
                str(voucher.beneficiary_id),
                float(voucher.balance or 0),
                voucher.status,
                voucher.expiry_date.isoformat() if voucher.expiry_date else "",
                voucher.created_at.isoformat() if voucher.created_at else "",
            ]
        )

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vouchers.csv"},
    )


@router.get("/export/redemptions")
async def export_redemptions(
    db: DbDep,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """Export voucher redemptions to CSV."""
    stmt = select(VoucherRedemption).options(selectinload(VoucherRedemption.voucher))

    if start_date:
        stmt = stmt.where(VoucherRedemption.created_at >= start_date)
    if end_date:
        stmt = stmt.where(VoucherRedemption.created_at <= end_date)

    stmt = stmt.order_by(VoucherRedemption.created_at.desc())
    result = await db.execute(stmt)
    redemptions = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["redemption_id", "voucher_code", "order_id", "vendor_id", "amount", "created_at"])

    for redemption in redemptions:
        writer.writerow(
            [
                str(redemption.id),
                redemption.voucher.code if redemption.voucher else "",
                str(redemption.order_id),
                str(redemption.order.vendor_id) if redemption.order else "",
                float(redemption.amount or 0),
                redemption.created_at.isoformat() if redemption.created_at else "",
            ]
        )

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=redemptions.csv"},
    )


# ──────────────────────────────────────────────────────────────────────
# Cache Monitoring Endpoint
# ──────────────────────────────────────────────────────────────────────

@router.get("/cache-stats")
async def get_cache_stats(
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """Get cache statistics for monitoring."""
    return {
        "cache_stats": cache.get_stats(),
        "namespaces": ["stats", "auth", "ref", "report", "donor", "wallet"]
    }
