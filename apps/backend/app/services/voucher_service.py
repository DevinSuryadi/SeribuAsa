"""
Voucher Service
Business logic for voucher management
"""
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal
import logging
import uuid
from uuid import UUID

from app.models.donation import Donation, Voucher, VoucherRedemption, VoucherStatusEnum
from app.models.user import BeneficiaryProfile

logger = logging.getLogger(__name__)


class VoucherService:
    """Service for voucher operations"""

    @staticmethod
    def _to_uuid(value: Optional[str | UUID]) -> Optional[UUID]:
        """Normalize incoming ID values to UUID for UUID-backed columns."""
        if value is None:
            return None
        if isinstance(value, UUID):
            return value
        return UUID(str(value))
    
    @staticmethod
    def generate_voucher_code() -> str:
        """Generate unique voucher code: VCH-YYYY-XXXXXX"""
        year = datetime.utcnow().year
        random_part = uuid.uuid4().hex[:6].upper()
        return f"VCH-{year}-{random_part}"
    
    @staticmethod
    def allocate_vouchers(
        db: Session,
        donation: Donation
    ) -> List[Voucher]:
        """Allocate vouchers to beneficiary after successful donation"""
        beneficiary = db.query(BeneficiaryProfile).filter(
            BeneficiaryProfile.user_id == donation.recipient_id
        ).first()
        
        if not beneficiary:
            logger.error(f"Beneficiary {donation.recipient_id} not found")
            return []
        
        vouchers = []
        
        if donation.type.value == "subscription" and donation.subscription_config:
            duration_months = donation.subscription_config.get("duration_months", 1)
            monthly_amount = donation.amount / duration_months
            
            for month in range(duration_months):
                voucher = Voucher(
                    code=VoucherService.generate_voucher_code(),
                    beneficiary_id=beneficiary.user_id,
                    donation_id=donation.id,
                    balance=monthly_amount,
                    allocated_date=datetime.utcnow(),
                    expiry_date=datetime.utcnow().date() + timedelta(days=30*(month+1)),
                    status=VoucherStatusEnum.active
                )
                vouchers.append(voucher)
                db.add(voucher)
        else:
            voucher = Voucher(
                code=VoucherService.generate_voucher_code(),
                beneficiary_id=beneficiary.user_id,
                donation_id=donation.id,
                balance=donation.amount,
                allocated_date=datetime.utcnow(),
                expiry_date=datetime.utcnow().date() + timedelta(days=30),
                status=VoucherStatusEnum.active
            )
            vouchers.append(voucher)
            db.add(voucher)
        
        total_amount = sum(v.balance for v in vouchers)
        beneficiary.vouchers_balance += total_amount
        
        db.commit()
        
        for voucher in vouchers:
            db.refresh(voucher)
        
        logger.info(f"Allocated {len(vouchers)} vouchers to beneficiary {beneficiary.user_id}")
        
        return vouchers
    
    @staticmethod
    def get_voucher_by_code(
        db: Session,
        code: str
    ) -> Optional[Voucher]:
        """Get voucher by code"""
        return db.query(Voucher).filter(
            Voucher.code == code,
            Voucher.is_active
        ).first()
    
    @staticmethod
    def get_balance(
        db: Session,
        beneficiary_id: str
    ) -> Dict:
        """Get voucher balance for beneficiary"""
        beneficiary_uuid = VoucherService._to_uuid(beneficiary_id)

        active_vouchers = db.query(Voucher).filter(
            Voucher.beneficiary_id == beneficiary_uuid,
            Voucher.status == VoucherStatusEnum.active,
            Voucher.expiry_date >= datetime.utcnow().date()
        ).all()
        
        total_balance = sum(v.balance for v in active_vouchers)
        
        expiring_soon = [
            v for v in active_vouchers
            if v.expiry_date <= datetime.utcnow().date() + timedelta(days=7)
        ]
        
        return {
            "beneficiary_id": str(beneficiary_uuid),
            "total_balance": total_balance,
            "active_vouchers": active_vouchers,
            "expiring_soon": {
                "count": len(expiring_soon),
                "total_amount": sum(v.balance for v in expiring_soon)
            }
        }
    
    @staticmethod
    def redeem_voucher(
        db: Session,
        voucher_codes: List[str],
        amount: Decimal,
        order_id: str
    ) -> Dict:
        """Redeem vouchers for order payment"""
        order_uuid = VoucherService._to_uuid(order_id)

        vouchers = []
        for code in voucher_codes:
            voucher = VoucherService.get_voucher_by_code(db, code)
            if not voucher:
                raise ValueError(f"Voucher {code} not found")
            vouchers.append(voucher)
        
        total_balance = sum(v.balance for v in vouchers)
        
        if total_balance < amount:
            raise ValueError(
                f"Insufficient balance. Required: {amount}, Available: {total_balance}"
            )
        
        for voucher in vouchers:
            if voucher.expiry_date < datetime.utcnow().date():
                raise ValueError(f"Voucher {voucher.code} is expired")
            
            if voucher.status != VoucherStatusEnum.active:
                raise ValueError(f"Voucher {voucher.code} is not active")
        
        redemptions = []
        remaining_amount = amount
        
        for voucher in vouchers:
            if remaining_amount <= 0:
                break
            
            redemption_amount = min(float(voucher.balance), float(remaining_amount))  # type: ignore[arg-type]
            
            redemption = VoucherRedemption(
                voucher_id=voucher.id,
                order_id=order_uuid,
                amount=redemption_amount
            )
            redemptions.append(redemption)
            db.add(redemption)
            
            voucher.balance -= redemption_amount  # type: ignore[assignment]
            remaining_amount -= redemption_amount  # type: ignore[operator]
            
            if voucher.balance <= 0:
                voucher.status = VoucherStatusEnum.redeemed
        
        beneficiary = db.query(BeneficiaryProfile).filter(
            BeneficiaryProfile.user_id == vouchers[0].beneficiary_id
        ).first()
        
        if beneficiary:
            beneficiary.vouchers_balance -= amount  # type: ignore[assignment]
        
        db.commit()
        
        for redemption in redemptions:
            db.refresh(redemption)
        
        logger.info(f"Redeemed {amount} from {len(vouchers)} vouchers for order {order_id}")
        
        return {
            "order_id": str(order_uuid),
            "vouchers_used": [
                {
                    "code": v.code,
                    "amount": r.amount,
                    "remaining_balance": v.balance
                }
                for v, r in zip(vouchers, redemptions)
            ],
            "total_redeemed": amount
        }
    
    @staticmethod
    def get_transaction_history(
        db: Session,
        beneficiary_id: str,
        params=None
    ) -> List[Dict[str, Any]]:
        """Get voucher transaction history for a beneficiary"""
        beneficiary_uuid = VoucherService._to_uuid(beneficiary_id)
        transactions = []
        
        vouchers = db.query(Voucher).filter(
            Voucher.beneficiary_id == beneficiary_uuid
        ).order_by(Voucher.allocated_date.desc()).all()
        
        for voucher in vouchers:
            transactions.append({
                "id": str(voucher.id),
                "type": "allocation",
                "amount": float(voucher.balance) if voucher.balance else 0,
                "balance_after": float(voucher.balance) if voucher.balance else 0,
                "source": f"Donation {voucher.donation_id}" if voucher.donation_id else "Direct allocation",
                "date": voucher.allocated_date,
                "description": f"Voucher {voucher.code} allocated"
            })
        
        redemptions = db.query(VoucherRedemption).join(
            Voucher, VoucherRedemption.voucher_id == Voucher.id
        ).filter(
            Voucher.beneficiary_id == beneficiary_uuid
        ).order_by(VoucherRedemption.created_at.desc()).all()
        
        for redemption in redemptions:
            transactions.append({
                "id": str(redemption.id),
                "type": "redemption",
                "amount": -float(redemption.amount) if redemption.amount else 0,
                "balance_after": 0.0,
                "source": f"Order {redemption.order_id}",
                "date": redemption.created_at,
                "description": "Redeemed at vendor"
            })
        
        transactions.sort(key=lambda x: x["date"], reverse=True)
        
        if params:
            offset = (params.page - 1) * params.page_size
            transactions = transactions[offset:offset + params.page_size]
        
        return transactions
