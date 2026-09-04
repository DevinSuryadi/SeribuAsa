"""
Sandbox / Demo Router
Provides mock endpoints for simulating payment flows in development/demo mode.
Only active when MIDTRANS_IS_PRODUCTION=false or DEV_MODE=true.

This allows the settlement flow to work end-to-end without real Midtrans transactions:
1. Donor creates donation → Midtrans sandbox snap token (or mock)
2. Simulate payment success → triggers allocation + voucher creation
3. Beneficiary uses voucher at vendor → order completed
4. Admin calculates settlement → vendor can request payout
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from decimal import Decimal
from uuid import uuid4
from typing import Optional
import logging

from app.database import get_db
from app.config import settings
from app.middleware.auth import get_current_user, AuthenticatedUser, RequireRole
from app.services.settlement_service import SettlementService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sandbox", tags=["sandbox"])


def _require_sandbox_mode():
    """Guard: only allow sandbox endpoints in non-production mode"""
    if settings.MIDTRANS_IS_PRODUCTION:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sandbox endpoints are disabled in production mode",
        )


@router.post("/simulate-payment-success/{donation_id}")
async def simulate_payment_success(
    donation_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Simulate a successful Midtrans payment for a donation.
    This triggers the same flow as a real Midtrans webhook:
    - Updates donation status to 'completed'
    - Allocates funds to beneficiary
    - Creates voucher
    - Updates donor metrics

    Use this when testing without real Midtrans sandbox payments.
    """
    _require_sandbox_mode()

    from app.services.midtrans_service import MidtransService

    try:
        mock_transaction_id = f"SANDBOX-{uuid4().hex[:12].upper()}"
        result = MidtransService.process_payment_success(
            db=db,
            donation_id=donation_id,
            midtrans_transaction_id=mock_transaction_id,
        )

        logger.info(f"[SANDBOX] Simulated payment success for donation {donation_id}")

        return {
            "success": True,
            "message": "Payment simulated successfully",
            "donation_id": donation_id,
            "mock_transaction_id": mock_transaction_id,
            "result": result,
        }
    except Exception as e:
        logger.error(f"[SANDBOX] Failed to simulate payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to simulate payment: {str(e)}",
        )


@router.post("/simulate-order-completion/{order_id}")
async def simulate_order_completion(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Simulate order completion (vendor confirms pickup).
    This triggers wallet debit from beneficiary and credit to vendor.
    """
    _require_sandbox_mode()

    from app.models.product import Order, OrderStatusEnum

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status == OrderStatusEnum.completed:
        return {"success": True, "message": "Order already completed"}

    # Mark order as completed
    order.status = OrderStatusEnum.completed
    order.completed_at = datetime.utcnow()
    db.add(order)
    db.commit()

    logger.info(f"[SANDBOX] Simulated order completion for order {order_id}")

    return {
        "success": True,
        "message": "Order completion simulated",
        "order_id": order_id,
        "status": "completed",
    }


@router.post("/simulate-settlement-calculation")
async def simulate_settlement_calculation(
    vendor_id: Optional[str] = None,
    days_back: int = 30,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """
    Simulate settlement calculation for the last N days.
    Creates settlement records for vendors with completed orders.
    """
    _require_sandbox_mode()

    period_end = date.today()
    period_start = period_end - timedelta(days=days_back)

    result = SettlementService.calculate_settlements(
        db=db,
        period_start=period_start,
        period_end=period_end,
        vendor_id=vendor_id,
    )

    logger.info(
        f"[SANDBOX] Settlement calculation: {result['settlements_created']} created, "
        f"total {result['total_amount']}"
    )

    return {
        "success": True,
        "message": "Settlement calculation simulated",
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        **result,
    }


@router.post("/simulate-payout/{settlement_id}")
async def simulate_payout(
    settlement_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """
    Simulate marking a settlement as paid (bank transfer completed).
    In production, this would be triggered after actual bank transfer.
    """
    _require_sandbox_mode()

    from app.models.nutrition import Settlement

    settlement = db.query(Settlement).filter(
        Settlement.id == settlement_id,
        Settlement.is_active,
    ).first()

    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")

    if settlement.status == "paid":
        return {"success": True, "message": "Settlement already paid"}

    # Simulate bank transfer
    mock_reference = f"TRF-{datetime.utcnow().strftime('%Y%m%d')}-{uuid4().hex[:8].upper()}"

    settlement.status = "paid"
    settlement.payout_date = date.today()
    settlement.bank_transfer_reference = mock_reference
    settlement.updated_at = datetime.utcnow()
    db.add(settlement)
    db.commit()

    logger.info(f"[SANDBOX] Simulated payout for settlement {settlement_id}, ref: {mock_reference}")

    return {
        "success": True,
        "message": "Payout simulated successfully",
        "settlement_id": settlement_id,
        "bank_transfer_reference": mock_reference,
        "payout_date": date.today().isoformat(),
    }


@router.post("/simulate-full-flow")
async def simulate_full_flow(
    donor_amount: int = 500000,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """
    Simulate the ENTIRE flow end-to-end for demo purposes:
    1. Create donation
    2. Simulate payment success
    3. Voucher created for beneficiary
    4. Beneficiary places order at vendor
    5. Vendor confirms order (pickup)
    6. Settlement calculated
    7. Vendor requests payout
    8. Admin marks as paid

    Returns a summary of all steps.
    """
    _require_sandbox_mode()

    steps = []

    try:
        from app.models.donation import Donation, DonationStatusEnum
        from app.models.user import DonorProfile, BeneficiaryProfile, VendorProfile

        # Step 1: Find demo users
        donor = db.query(DonorProfile).first()
        beneficiary = db.query(BeneficiaryProfile).filter(
            BeneficiaryProfile.approval_status == "approved"
        ).first()
        vendor = db.query(VendorProfile).filter(
            VendorProfile.approval_status == "approved"
        ).first()

        if not donor:
            raise HTTPException(status_code=400, detail="No donor found. Seed demo data first.")
        if not beneficiary:
            raise HTTPException(status_code=400, detail="No approved beneficiary found.")
        if not vendor:
            raise HTTPException(status_code=400, detail="No approved vendor found.")

        steps.append({
            "step": 1,
            "action": "Found demo users",
            "donor_id": str(donor.user_id),
            "beneficiary_id": str(beneficiary.user_id),
            "vendor_id": str(vendor.user_id),
        })

        # Step 2: Create donation
        donation = Donation(
            donor_id=donor.user_id,
            amount=Decimal(str(donor_amount)),
            status=DonationStatusEnum.pending,
            recipient_id=beneficiary.user_id,
            description=f"[SANDBOX] Demo donation Rp {donor_amount:,}",
        )
        db.add(donation)
        db.flush()

        steps.append({
            "step": 2,
            "action": "Donation created",
            "donation_id": str(donation.id),
            "amount": donor_amount,
        })

        # Step 3: Simulate payment success
        from app.services.midtrans_service import MidtransService

        mock_tx_id = f"SANDBOX-{uuid4().hex[:12].upper()}"
        MidtransService.process_payment_success(db, str(donation.id), mock_tx_id)

        steps.append({
            "step": 3,
            "action": "Payment simulated (donation completed, voucher created)",
            "transaction_id": mock_tx_id,
        })

        # Step 4: Calculate settlement
        period_end = date.today()
        period_start = period_end - timedelta(days=1)

        settlement_result = SettlementService.calculate_settlements(
            db=db,
            period_start=period_start,
            period_end=period_end,
            vendor_id=str(vendor.user_id),
        )

        steps.append({
            "step": 4,
            "action": "Settlement calculated",
            "settlements_created": settlement_result["settlements_created"],
            "total_amount": float(settlement_result["total_amount"]),
        })

        return {
            "success": True,
            "message": "Full flow simulation completed",
            "steps": steps,
            "summary": {
                "donation_amount": donor_amount,
                "settlements_created": settlement_result["settlements_created"],
                "total_settlement_amount": float(settlement_result["total_amount"]),
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[SANDBOX] Full flow simulation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation failed at step {len(steps) + 1}: {str(e)}",
        )


@router.get("/status")
async def sandbox_status():
    """Check if sandbox mode is active and what features are available"""
    is_sandbox = not settings.MIDTRANS_IS_PRODUCTION
    is_dev = settings.DEV_MODE

    return {
        "sandbox_active": is_sandbox,
        "dev_mode": is_dev,
        "midtrans_production": settings.MIDTRANS_IS_PRODUCTION,
        "midtrans_configured": bool(settings.MIDTRANS_SERVER_KEY),
        "settlement_enabled": settings.SETTLEMENT_ENABLED,
        "payout_enabled": settings.PAYOUT_ENABLED,
        "available_endpoints": [
            "POST /sandbox/simulate-payment-success/{donation_id}",
            "POST /sandbox/simulate-order-completion/{order_id}",
            "POST /sandbox/simulate-settlement-calculation",
            "POST /sandbox/simulate-payout/{settlement_id}",
            "POST /sandbox/simulate-full-flow",
        ] if is_sandbox else [],
    }
