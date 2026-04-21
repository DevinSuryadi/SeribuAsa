"""
Mock Payment Service
Simulates successful payment for development/demo purposes.
This will be replaced with MidtransService for production.
"""
from sqlalchemy.orm import Session
from app.models.donation import Donation, DonationStatusEnum, Voucher, VoucherStatusEnum
from app.models.user import BeneficiaryProfile, DonorProfile
from app.models.nutrition import FIESSurvey, FIESClassificationEnum
from datetime import datetime, timedelta
from decimal import Decimal
import uuid
import logging

logger = logging.getLogger(__name__)


class MockPaymentService:
    """
    Mock payment service for development/demo.
    Simulates successful payment without real payment gateway.
    
    TODO: Replace with MidtransService for production
    """
    
    @staticmethod
    def simulate_payment_success(
        db: Session,
        donation_id: str
    ) -> dict:
        """
        Simulate successful payment for a donation.
        
        This will:
        1. Update donation status to 'success'
        2. Auto-create voucher for beneficiary (if assigned)
        3. Update donor's total_donated metric
        4. Return success response with impact info
        
        Args:
            db: Database session
            donation_id: ID of the donation
            
        Returns:
            dict: Payment result with impact metrics
        """
        # Get donation
        donation = db.query(Donation).filter(Donation.id == donation_id).first()
        
        if not donation:
            raise ValueError(f"Donation {donation_id} not found")
        
        if donation.status != DonationStatusEnum.pending:
            raise ValueError(f"Donation status is {donation.status.value}, must be 'pending'")
        
        # Update donation status
        donation.status = DonationStatusEnum.success
        donation.midtrans_transaction_id = f"MOCK-{uuid.uuid4().hex[:12].upper()}"
        
        # Create voucher for beneficiary (auto-allocate if not assigned)
        voucher_created = False
        assigned_beneficiary_id = donation.recipient_id
        
        if not assigned_beneficiary_id:
            # Auto-allocate to best beneficiary candidate
            assigned_beneficiary_id = MockPaymentService._find_best_beneficiary(db)
            if assigned_beneficiary_id:
                donation.recipient_id = assigned_beneficiary_id
                logger.info(f"Auto-allocated donation {donation_id} to beneficiary {assigned_beneficiary_id}")
        
        if assigned_beneficiary_id:
            MockPaymentService._create_voucher(db, donation)
            voucher_created = True
        
        # Update donor metrics
        MockPaymentService._update_donor_metrics(db, donation.donor_id, donation.amount)
        
        db.commit()
        db.refresh(donation)
        
        logger.info(f"Mock payment successful for donation {donation_id}")
        
        # Calculate impact metrics
        impact = MockPaymentService._calculate_impact(donation)
        
        return {
            "success": True,
            "donation_id": donation.id,
            "amount": donation.amount,
            "transaction_id": donation.midtrans_transaction_id,
            "voucher_created": voucher_created,
            "impact": impact
        }
    
    @staticmethod
    def _create_voucher(db: Session, donation: Donation) -> Voucher:
        """Create voucher for beneficiary after successful donation"""
        # Generate unique voucher code
        voucher_code = f"VCH-{datetime.utcnow().year}-{uuid.uuid4().hex[:6].upper()}"
        
        # Calculate expiry (30 days from now)
        expiry_date = datetime.utcnow().date() + timedelta(days=30)
        
        # Create voucher
        voucher = Voucher(
            code=voucher_code,
            beneficiary_id=donation.recipient_id,
            donation_id=donation.id,
            balance=donation.amount,
            allocated_date=datetime.utcnow(),
            expiry_date=expiry_date,
            status=VoucherStatusEnum.active
        )
        
        db.add(voucher)
        
        # Update beneficiary balance
        beneficiary = db.query(BeneficiaryProfile).filter(
            BeneficiaryProfile.user_id == donation.recipient_id
        ).first()
        
        if beneficiary:
            beneficiary.vouchers_balance += donation.amount
        
        return voucher
    
    @staticmethod
    def _update_donor_metrics(db: Session, donor_id: str, amount: Decimal):
        """Update donor's total donated metric"""
        donor = db.query(DonorProfile).filter(
            DonorProfile.user_id == donor_id
        ).first()
        
        if donor:
            donor.total_donated += amount
    
    @staticmethod
    def _find_best_beneficiary(db: Session) -> str | None:
        """
        Find the best beneficiary candidate for auto-allocation.
        
        Priority:
        1. FIES Score (severe > moderate > food secure)
        2. Most recent FIES survey
        3. Beneficiaries with fewer vouchers get priority
        
        Returns:
            beneficiary_id (str) or None if no suitable beneficiary found
        """
        from sqlalchemy import func
        
        # Get all active beneficiaries with their latest FIES survey
        beneficiaries = db.query(
            BeneficiaryProfile,
            func.coalesce(FIESSurvey.total_score, 0).label('fies_score'),
            func.coalesce(BeneficiaryProfile.vouchers_balance, Decimal(0)).label('voucher_balance')
        ).outerjoin(
            FIESSurvey,
            FIESSurvey.beneficiary_id == BeneficiaryProfile.user_id
        ).filter(
            BeneficiaryProfile.approval_status == "approved"
        ).order_by(
            # Priority: higher FIES score (more food insecure) first, then lower voucher balance
            FIESSurvey.total_score.desc().nulls_last(),
            BeneficiaryProfile.vouchers_balance.asc()
        ).all()
        
        if not beneficiaries:
            logger.warning("No approved beneficiaries found for auto-allocation")
            return None
        
        # Select the best candidate (first in the sorted list)
        best_candidate = beneficiaries[0][0]
        beneficiary_id = str(best_candidate.user_id)
        
        fies_score = beneficiaries[0][1] if beneficiaries[0][1] else 0
        voucher_balance = beneficiaries[0][2] if beneficiaries[0][2] else Decimal(0)
        
        # Log the selection criteria
        if fies_score >= 6:
            priority_level = "SEVERE (Prioritas Tinggi)"
        elif fies_score >= 3:
            priority_level = "MODERATE"
        else:
            priority_level = "Food Secure"
            
        logger.info(
            f"Auto-allocation: Selected beneficiary {beneficiary_id} "
            f"(FIES Score: {fies_score}, {priority_level}, "
            f"Current Balance: Rp {voucher_balance})"
        )
        
        return beneficiary_id
    
    @staticmethod
    def _calculate_impact(donation: Donation) -> dict:
        """Calculate impact metrics for donation"""
        # Simple calculation: Rp 300,000 = 1 child for 1 month
        children_helped = 1 if donation.recipient_id else 0
        months_of_support = 1
        
        if donation.subscription_config:
            months_of_support = donation.subscription_config.get("duration_months", 1)
        
        return {
            "children_helped": children_helped,
            "months_of_support": months_of_support,
            "message": f"Anda membantu {children_helped} anak selama {months_of_support} bulan"
        }
