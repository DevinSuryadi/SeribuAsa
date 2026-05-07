"""
Wallet Service
Core escrow logic for the e-wallet system.

Operations:
  credit          – top-up wallet from donation allocation (creates WalletAllocation)
  hold            – lock amount at checkout (pending order)
  release_to_vendor – debit locked amount, credit vendor wallet on pickup confirm
  refund_hold     – unlock held amount back to available on order cancel
  expire_allocations – cron: expire old allocations, reduce wallet_balance
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.user import BeneficiaryProfile, VendorProfile
from app.models.product import Order
from app.models.wallet import WalletAllocation, WalletTransaction

logger = logging.getLogger(__name__)

ADMIN_FEE_RATE       = Decimal("0.01")   # 1% platform fee
ALLOCATION_EXPIRY_DAYS = 90              # 3 months
WALLET_TX_CREDIT     = "credit"
WALLET_TX_HOLD       = "hold"
WALLET_TX_UNHOLD     = "unhold"
WALLET_TX_DEBIT      = "debit"
WALLET_TX_EXPIRED    = "expired"


class WalletService:
    """Unified service for beneficiary e-wallet escrow operations."""

    # ──────────────────────────────────────────────────────────────────────────
    # 1. CREDIT — called when donation allocation is processed
    # ──────────────────────────────────────────────────────────────────────────
    @staticmethod
    def credit(
        db: Session,
        beneficiary_id: str | UUID,
        amount: Decimal,
        donation_id: Optional[str | UUID] = None,
        description: str = "Alokasi donasi",
    ) -> WalletAllocation:
        """
        Top-up wallet from a donation allocation.
        Creates a WalletAllocation record (FIFO expiry) and increments vouchers_balance.
        """
        beneficiary_uuid = _to_uuid(beneficiary_id)
        donation_uuid    = _to_uuid(donation_id)
        amount           = Decimal(str(amount))

        beneficiary = _require_beneficiary(db, beneficiary_uuid)

        expires_at = datetime.utcnow() + timedelta(days=ALLOCATION_EXPIRY_DAYS)
        allocation = WalletAllocation(
            beneficiary_id   = beneficiary_uuid,
            donation_id      = donation_uuid,
            original_amount  = amount,
            remaining_amount = amount,
            allocated_at     = datetime.utcnow(),
            expires_at       = expires_at,
            status           = "active",
        )
        db.add(allocation)
        db.flush()   # get allocation.id before creating tx

        # Update beneficiary total balance
        current = Decimal(beneficiary.vouchers_balance or 0)
        beneficiary.vouchers_balance = current + amount

        db.add(WalletTransaction(
            beneficiary_id   = beneficiary_uuid,
            allocation_id    = allocation.id,
            transaction_type = WALLET_TX_CREDIT,
            amount           = amount,
            balance_after    = beneficiary.vouchers_balance,
            description      = description,
        ))

        logger.info("Wallet credited: beneficiary=%s amount=%s allocation=%s", beneficiary_uuid, amount, allocation.id)
        return allocation

    # ──────────────────────────────────────────────────────────────────────────
    # 2. HOLD — called at checkout when order is placed
    # ──────────────────────────────────────────────────────────────────────────
    @staticmethod
    def hold(
        db: Session,
        beneficiary: BeneficiaryProfile,
        amount: Decimal,
        order_id: Optional[UUID] = None,
        description: str = "Pembelian barang",
    ) -> bool:
        """
        Lock amount from wallet for a pending order (FIFO from oldest allocation).
        Returns False if insufficient available balance.
        Does NOT commit — caller must commit.
        """
        amount = Decimal(str(amount))
        available = Decimal(beneficiary.vouchers_balance or 0) - Decimal(beneficiary.wallet_held or 0)

        if available < amount:
            logger.warning(
                "Wallet hold failed: beneficiary=%s available=%s needed=%s",
                beneficiary.user_id, available, amount,
            )
            return False

        # Deduct from FIFO allocations (oldest expires_at first)
        remaining = amount
        allocations = (
            db.query(WalletAllocation)
            .filter(
                WalletAllocation.beneficiary_id == beneficiary.user_id,
                WalletAllocation.status == "active",
                WalletAllocation.remaining_amount > 0,
                WalletAllocation.expires_at > datetime.utcnow(),
            )
            .order_by(WalletAllocation.expires_at.asc())
            .all()
        )

        for alloc in allocations:
            if remaining <= 0:
                break
            deduct = min(Decimal(alloc.remaining_amount), remaining)
            alloc.remaining_amount = Decimal(alloc.remaining_amount) - deduct
            remaining -= deduct
            if alloc.remaining_amount <= 0:
                alloc.status = "depleted"

        # Increase held amount
        beneficiary.wallet_held = Decimal(beneficiary.wallet_held or 0) + amount

        db.add(WalletTransaction(
            beneficiary_id   = beneficiary.user_id,
            order_id         = order_id,
            transaction_type = WALLET_TX_HOLD,
            amount           = amount,
            balance_after    = Decimal(beneficiary.vouchers_balance or 0),
            description      = description,
        ))

        logger.info("Wallet held: beneficiary=%s amount=%s order=%s", beneficiary.user_id, amount, order_id)
        return True

    # ──────────────────────────────────────────────────────────────────────────
    # 3. RELEASE TO VENDOR — called when vendor confirms QR pickup
    # ──────────────────────────────────────────────────────────────────────────
    @staticmethod
    def release_to_vendor(db: Session, order: Order) -> Decimal:
        """
        Finalize escrow:
          - Debit beneficiary wallet_balance and wallet_held
          - Credit vendor wallet (net of 1% admin fee)
        Returns net amount added to vendor.
        """
        amount = Decimal(str(order.total_amount))
        admin_fee = (amount * ADMIN_FEE_RATE).quantize(Decimal("0.01"))
        net = amount - admin_fee

        beneficiary: BeneficiaryProfile = order.beneficiary_profile
        vendor: VendorProfile           = order.vendor_profile

        # Debit beneficiary
        beneficiary.vouchers_balance = Decimal(beneficiary.vouchers_balance or 0) - amount
        beneficiary.wallet_held      = Decimal(beneficiary.wallet_held or 0) - amount

        db.add(WalletTransaction(
            beneficiary_id   = beneficiary.user_id,
            order_id         = order.id,
            transaction_type = WALLET_TX_DEBIT,
            amount           = amount,
            balance_after    = beneficiary.vouchers_balance,
            description      = f"Pembelian dikonfirmasi vendor #{str(order.id)[:8]}",
        ))

        # Credit vendor
        vendor.wallet_balance = Decimal(vendor.wallet_balance or 0) + net

        logger.info(
            "Escrow released: order=%s beneficiary=%s vendor=%s amount=%s fee=%s net=%s",
            order.id, beneficiary.user_id, vendor.user_id, amount, admin_fee, net,
        )
        return net

    # ──────────────────────────────────────────────────────────────────────────
    # 4. REFUND HOLD — called when order is cancelled
    # ──────────────────────────────────────────────────────────────────────────
    @staticmethod
    def refund_hold(db: Session, order: Order) -> None:
        """
        Release held amount back to available balance.
        Also restore remaining_amount on FIFO allocations (LIFO restore — adds to newest).
        Does NOT commit — caller must commit.
        """
        amount       = Decimal(str(order.total_amount))
        beneficiary: BeneficiaryProfile = order.beneficiary_profile

        # Release hold
        beneficiary.wallet_held = Decimal(beneficiary.wallet_held or 0) - amount
        if beneficiary.wallet_held < 0:
            beneficiary.wallet_held = Decimal(0)

        # Restore into active allocations (newest first, LIFO restore)
        remaining = amount
        allocations = (
            db.query(WalletAllocation)
            .filter(
                WalletAllocation.beneficiary_id == beneficiary.user_id,
                WalletAllocation.status.in_(["active", "depleted"]),
                WalletAllocation.expires_at > datetime.utcnow(),
            )
            .order_by(WalletAllocation.expires_at.desc())
            .all()
        )

        for alloc in allocations:
            if remaining <= 0:
                break
            can_restore = Decimal(alloc.original_amount) - Decimal(alloc.remaining_amount)
            restore = min(can_restore, remaining)
            if restore > 0:
                alloc.remaining_amount = Decimal(alloc.remaining_amount) + restore
                if alloc.status == "depleted":
                    alloc.status = "active"
                remaining -= restore

        db.add(WalletTransaction(
            beneficiary_id   = beneficiary.user_id,
            order_id         = order.id,
            transaction_type = WALLET_TX_UNHOLD,
            amount           = amount,
            balance_after    = Decimal(beneficiary.vouchers_balance or 0),
            description      = f"Pesanan dibatalkan #{str(order.id)[:8]}",
        ))

        logger.info("Wallet refunded (unhold): beneficiary=%s amount=%s order=%s", beneficiary.user_id, amount, order.id)

    # ──────────────────────────────────────────────────────────────────────────
    # 5. EXPIRE ALLOCATIONS — called by cron job daily
    # ──────────────────────────────────────────────────────────────────────────
    @staticmethod
    def expire_allocations(db: Session) -> dict:
        """
        Expire WalletAllocation records past their expires_at.
        Deducts remaining_amount from beneficiary wallet_balance.
        Returns summary dict.
        """
        now = datetime.utcnow()
        expired_allocs = (
            db.query(WalletAllocation)
            .filter(
                WalletAllocation.status == "active",
                WalletAllocation.expires_at <= now,
                WalletAllocation.remaining_amount > 0,
            )
            .all()
        )

        total_expired_amount = Decimal(0)
        affected_beneficiaries: set[UUID] = set()

        for alloc in expired_allocs:
            expired_amount = Decimal(alloc.remaining_amount)
            alloc.remaining_amount = Decimal(0)
            alloc.status = "expired"
            affected_beneficiaries.add(alloc.beneficiary_id)

            beneficiary = _require_beneficiary(db, alloc.beneficiary_id)
            beneficiary.vouchers_balance = Decimal(beneficiary.vouchers_balance or 0) - expired_amount

            db.add(WalletTransaction(
                beneficiary_id   = alloc.beneficiary_id,
                allocation_id    = alloc.id,
                transaction_type = WALLET_TX_EXPIRED,
                amount           = expired_amount,
                balance_after    = beneficiary.vouchers_balance,
                description      = "Saldo kadaluarsa (90 hari)",
            ))

            total_expired_amount += expired_amount

        db.commit()

        result = {
            "expired_allocations": len(expired_allocs),
            "affected_beneficiaries": len(affected_beneficiaries),
            "total_amount_expired": float(total_expired_amount),
        }
        logger.info("Allocation expiry run: %s", result)
        return result

    # ──────────────────────────────────────────────────────────────────────────
    # 6. GET BALANCE SUMMARY — for beneficiary dashboard
    # ──────────────────────────────────────────────────────────────────────────
    @staticmethod
    def get_balance_summary(db: Session, beneficiary_id: str | UUID) -> dict:
        """
        Returns full wallet summary including expiring-soon warning.
        """
        beneficiary_uuid = _to_uuid(beneficiary_id)
        beneficiary = _require_beneficiary(db, beneficiary_uuid)

        total   = Decimal(beneficiary.vouchers_balance or 0)
        held    = Decimal(beneficiary.wallet_held or 0)
        available = total - held

        # Allocations expiring within 7 days
        warning_threshold = datetime.utcnow() + timedelta(days=7)
        expiring_soon = (
            db.query(WalletAllocation)
            .filter(
                WalletAllocation.beneficiary_id == beneficiary_uuid,
                WalletAllocation.status == "active",
                WalletAllocation.remaining_amount > 0,
                WalletAllocation.expires_at <= warning_threshold,
                WalletAllocation.expires_at > datetime.utcnow(),
            )
            .all()
        )
        expiring_amount = sum(Decimal(a.remaining_amount) for a in expiring_soon)
        earliest_expiry = min((a.expires_at for a in expiring_soon), default=None)

        return {
            "wallet_balance":   float(total),
            "wallet_held":      float(held),
            "wallet_available": float(available),
            "expiring_soon":    float(expiring_amount),
            "earliest_expiry":  earliest_expiry.isoformat() if earliest_expiry else None,
        }


# ── Helpers ───────────────────────────────────────────────────────────────────
def _to_uuid(value) -> Optional[UUID]:
    if value is None:
        return None
    if isinstance(value, UUID):
        return value
    return UUID(str(value))


def _require_beneficiary(db: Session, user_id: UUID) -> BeneficiaryProfile:
    beneficiary = db.query(BeneficiaryProfile).filter(
        BeneficiaryProfile.user_id == user_id
    ).first()
    if not beneficiary:
        raise ValueError(f"Beneficiary not found: {user_id}")
    return beneficiary
