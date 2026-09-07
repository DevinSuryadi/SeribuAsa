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
from app.models.cart import VoucherTransaction, VoucherTransactionTypeEnum, VoucherLock
from app.models.product import Order, OrderStatusEnum, PaymentStatusEnum
from app.models.product import Product, Category
from app.models.user import VendorProfile

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
            Voucher.code == code
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
        total_redeemed = Decimal("0")

        for voucher in vouchers:
            if remaining_amount <= 0:
                break

            redemption_amount = min(
                Decimal(voucher.balance or Decimal("0")),
                Decimal(remaining_amount),
            )

            redemption = VoucherRedemption(
                voucher_id=voucher.id,
                order_id=order_uuid,
                amount=redemption_amount
            )
            redemptions.append(redemption)
            db.add(redemption)

            voucher.balance = Decimal(voucher.balance or Decimal("0")) - redemption_amount
            remaining_amount = Decimal(remaining_amount) - redemption_amount
            total_redeemed += redemption_amount

            db.add(
                VoucherTransaction(
                    voucher_id=voucher.id,
                    order_id=order_uuid,
                    transaction_type=VoucherTransactionTypeEnum.redeemed,
                    amount=redemption_amount,
                )
            )

            if voucher.balance <= 0:
                voucher.status = VoucherStatusEnum.redeemed
                voucher.balance = Decimal("0")

        beneficiary = db.query(BeneficiaryProfile).filter(
            BeneficiaryProfile.user_id == vouchers[0].beneficiary_id
        ).first()
        
        if beneficiary:
            beneficiary.vouchers_balance = Decimal(
                beneficiary.vouchers_balance or Decimal("0")
            ) - total_redeemed

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
            "total_redeemed": total_redeemed
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

        voucher_transactions = (
            db.query(VoucherTransaction, Voucher)
            .join(Voucher, Voucher.id == VoucherTransaction.voucher_id)
            .filter(Voucher.beneficiary_id == beneficiary_uuid)
            .order_by(VoucherTransaction.created_at.desc())
            .all()
        )

        for tx, voucher in voucher_transactions:
            if tx.transaction_type == VoucherTransactionTypeEnum.allocated:
                tx_type = "allocation"
                amount_value = float(tx.amount or 0)
                description = f"Voucher {voucher.code} dialokasikan"
                source = (
                    f"Donation {voucher.donation_id}"
                    if voucher.donation_id
                    else "Direct allocation"
                )
            elif tx.transaction_type == VoucherTransactionTypeEnum.redeemed:
                tx_type = "redemption"
                amount_value = -float(tx.amount or 0)
                description = "Voucher ditukar di vendor"
                source = f"Order {tx.order_id}" if tx.order_id else "Vendor redemption"
            elif tx.transaction_type == VoucherTransactionTypeEnum.expired:
                tx_type = "expired"
                amount_value = -float(tx.amount or 0)
                description = "Voucher kedaluwarsa"
                source = f"Voucher {voucher.code}"
            else:
                tx_type = str(tx.transaction_type.value)
                amount_value = float(tx.amount or 0)
                description = f"Transaksi voucher {voucher.code}"
                source = f"Voucher {voucher.code}"

            transactions.append({
                "id": str(tx.id),
                "type": tx_type,
                "amount": amount_value,
                "balance_after": float(voucher.balance or 0),
                "source": source,
                "date": tx.created_at,
                "description": description,
            })

        transactions.sort(key=lambda x: x["date"], reverse=True)
        
        if params:
            offset = (params.page - 1) * params.page_size
            transactions = transactions[offset:offset + params.page_size]
        
        return transactions
    
    # ============================================
    # NEW METHODS FOR PHASE 1 & 2
    # ============================================
    
    @staticmethod
    def validate_voucher(
        db: Session,
        code: str,
        beneficiary_id: Optional[str],
        amount: Decimal
    ) -> Dict[str, Any]:
        """
        Validate voucher for redemption.
        Returns voucher details and validation status.
        Raises exception if invalid.
        """
        beneficiary_uuid = VoucherService._to_uuid(beneficiary_id) if beneficiary_id else None
        
        # Get voucher
        voucher = VoucherService.get_voucher_by_code(db, code)
        if not voucher:
            raise ValueError("Voucher code not found")
        
        # Check ownership
        if beneficiary_uuid and voucher.beneficiary_id != beneficiary_uuid:
            raise ValueError("Voucher does not belong to you")
        
        # Check expiration
        if voucher.is_expired():
            raise ValueError("Voucher has expired")
        
        # Check status
        if voucher.status != VoucherStatusEnum.active:
            raise ValueError(f"Voucher status is {voucher.status.value}, not active")
        
        # Check balance
        if voucher.balance < amount:
            raise ValueError(f"Insufficient balance. Required: {amount}, Available: {voucher.balance}")
        
        # Check if locked (currently in use)
        lock = db.query(VoucherLock).filter(
            VoucherLock.voucher_id == voucher.id,
            VoucherLock.expires_at > datetime.utcnow()
        ).first()
        
        if lock:
            raise ValueError("Voucher is currently in use. Please try again later")
        
        return {
            "id": str(voucher.id),
            "code": voucher.code,
            "balance": float(voucher.balance),
            "expiry_date": voucher.expiry_date.isoformat(),
            "days_until_expiry": (voucher.expiry_date - datetime.utcnow().date()).days
        }
    
    @staticmethod
    def lock_voucher(
        db: Session,
        voucher_id: str,
        duration_minutes: int = 5
    ) -> bool:
        """Lock voucher to prevent double-spending during transaction"""
        voucher_uuid = VoucherService._to_uuid(voucher_id)
        
        # Check if already locked
        existing_lock = db.query(VoucherLock).filter(
            VoucherLock.voucher_id == voucher_uuid
        ).first()
        
        if existing_lock and existing_lock.expires_at > datetime.utcnow():
            return False  # Already locked
        
        # Create or update lock
        lock = VoucherLock(
            voucher_id=voucher_uuid,
            locked_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=duration_minutes)
        )
        db.add(lock)
        db.commit()
        
        logger.info(f"Voucher {voucher_id} locked for {duration_minutes} minutes")
        return True
    
    @staticmethod
    def unlock_voucher(
        db: Session,
        voucher_id: str
    ) -> bool:
        """Unlock voucher after transaction fails"""
        voucher_uuid = VoucherService._to_uuid(voucher_id)
        
        lock = db.query(VoucherLock).filter(
            VoucherLock.voucher_id == voucher_uuid
        ).first()
        
        if lock:
            db.delete(lock)
            db.commit()
            logger.info(f"Voucher {voucher_id} unlocked")
            return True
        
        return False
    
    @staticmethod
    def check_product_eligibility(
        db: Session,
        product_ids: List[str]
    ) -> Dict[str, Any]:
        """
        Check which products are eligible for voucher.
        Returns eligible and ineligible amounts.
        """
        product_uuids = [VoucherService._to_uuid(pid) for pid in product_ids]
        
        products = db.query(Product).filter(
            Product.id.in_(product_uuids)
        ).all()
        
        # Get allowed categories for vouchers
        allowed_categories = db.query(Category).join(
            Category.voucher_allowed_categories
        ).filter(
            Category.voucher_allowed_categories.any()
        ).all()
        
        allowed_category_ids = [c.id for c in allowed_categories]
        
        eligible_total = Decimal(0)
        ineligible_total = Decimal(0)
        eligible_products = []
        ineligible_products = []
        
        for product in products:
            if product.category_id in allowed_category_ids:
                eligible_total += product.voucher_price
                eligible_products.append(str(product.id))
            else:
                ineligible_total += product.price
                ineligible_products.append(str(product.id))
        
        return {
            "eligible_amount": float(eligible_total),
            "ineligible_amount": float(ineligible_total),
            "total_amount": float(eligible_total + ineligible_total),
            "eligible_products": eligible_products,
            "ineligible_products": ineligible_products,
            "voucher_can_cover": float(eligible_total)
        }
    
    @staticmethod
    def record_transaction(
        db: Session,
        voucher_id: str,
        transaction_type: VoucherTransactionTypeEnum,
        amount: Decimal,
        order_id: Optional[str] = None
    ) -> VoucherTransaction:
        """Record voucher transaction in history"""
        voucher_uuid = VoucherService._to_uuid(voucher_id)
        order_uuid = VoucherService._to_uuid(order_id) if order_id else None
        
        transaction = VoucherTransaction(
            voucher_id=voucher_uuid,
            order_id=order_uuid,
            transaction_type=transaction_type,
            amount=amount
        )
        
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        
        logger.info(f"Recorded transaction {transaction_type.value} for voucher {voucher_id}: {amount}")
        
        return transaction

    @staticmethod
    def _apply_voucher_redemption(
        db: Session,
        voucher: Voucher,
        amount: Decimal,
        order_id: UUID,
    ) -> None:
        redeem_amount = Decimal(amount)

        voucher.balance = Decimal(voucher.balance or Decimal("0")) - redeem_amount
        if voucher.balance <= 0:
            voucher.balance = Decimal("0")
            voucher.status = VoucherStatusEnum.redeemed

        beneficiary = db.query(BeneficiaryProfile).filter(
            BeneficiaryProfile.user_id == voucher.beneficiary_id
        ).first()

        if beneficiary:
            beneficiary.vouchers_balance = Decimal(
                beneficiary.vouchers_balance or Decimal("0")
            ) - redeem_amount

        db.add(
            VoucherTransaction(
                voucher_id=voucher.id,
                order_id=order_id,
                transaction_type=VoucherTransactionTypeEnum.redeemed,
                amount=redeem_amount,
            )
        )
        db.add(
            VoucherRedemption(
                voucher_id=voucher.id,
                order_id=order_id,
                amount=redeem_amount,
            )
        )

    @staticmethod
    def redeem_voucher_with_transaction(
        db: Session,
        voucher_code: str,
        amount: Decimal,
        order_id: str,
        beneficiary_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Redeem single voucher with transaction logging.
        More atomic than the old method.
        """
        # Validate
        VoucherService.validate_voucher(db, voucher_code, beneficiary_id, amount)
        
        # Get voucher
        voucher = VoucherService.get_voucher_by_code(db, voucher_code)
        if not voucher:
            raise ValueError("Voucher not found")
        
        # Lock voucher
        if not VoucherService.lock_voucher(db, str(voucher.id)):
            raise ValueError("Could not lock voucher")
        
        try:
            order_uuid = VoucherService._to_uuid(order_id)
            if order_uuid is None:
                raise ValueError("Order ID is required")

            VoucherService._apply_voucher_redemption(
                db=db,
                voucher=voucher,
                amount=amount,
                order_id=order_uuid,
            )
            db.commit()

            # Unlock after success
            VoucherService.unlock_voucher(db, str(voucher.id))

            logger.info(f"Successfully redeemed voucher {voucher_code} for {amount}")

            return {
                "voucher_id": str(voucher.id),
                "code": voucher.code,
                "redeemed_amount": float(amount),
                "remaining_balance": float(voucher.balance),
                "status": voucher.status.value
            }

        except Exception as e:
            # Unlock on failure
            VoucherService.unlock_voucher(db, str(voucher.id))
            logger.error(f"Error redeeming voucher: {e}")
            raise

    @staticmethod
    def redeem_voucher_for_vendor_sale(
        db: Session,
        vendor_id: str | UUID,
        voucher_code: str,
        amount: Decimal,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Redeem a beneficiary voucher from a vendor QR scan and create a completed order."""
        vendor_uuid = VoucherService._to_uuid(vendor_id)
        if vendor_uuid is None:
            raise ValueError("Vendor ID is required")

        vendor = db.query(VendorProfile).filter(
            VendorProfile.user_id == vendor_uuid,
            VendorProfile.approval_status == "approved",
            VendorProfile.is_active.is_(True),
        ).first()
        if not vendor:
            raise ValueError("Vendor is not approved for voucher redemption")

        VoucherService.validate_voucher(db, voucher_code, None, amount)
        voucher = VoucherService.get_voucher_by_code(db, voucher_code)
        if not voucher:
            raise ValueError("Voucher not found")

        if not VoucherService.lock_voucher(db, str(voucher.id)):
            raise ValueError("Voucher is currently in use. Please try again later")

        try:
            order = Order(
                beneficiary_id=voucher.beneficiary_id,
                vendor_id=vendor_uuid,
                total_amount=Decimal(amount),
                voucher_used=Decimal(amount),
                cash_paid=Decimal("0"),
                status=OrderStatusEnum.completed,
                payment_status=PaymentStatusEnum.paid,
                notes=(notes or "QR voucher redemption").strip(),
            )
            db.add(order)
            db.flush()

            VoucherService._apply_voucher_redemption(
                db=db,
                voucher=voucher,
                amount=Decimal(amount),
                order_id=order.id,
            )

            db.commit()
            db.refresh(order)
            db.refresh(voucher)
            VoucherService.unlock_voucher(db, str(voucher.id))

            logger.info(
                "Vendor %s redeemed voucher %s for order %s",
                vendor_uuid,
                voucher_code,
                order.id,
            )

            return {
                "order_id": str(order.id),
                "voucher_id": str(voucher.id),
                "code": voucher.code,
                "redeemed_amount": float(amount),
                "remaining_balance": float(voucher.balance or 0),
                "order_status": str(order.status),
                "payment_status": str(order.payment_status),
            }
        except Exception:
            db.rollback()
            VoucherService.unlock_voucher(db, str(voucher.id))
            raise
