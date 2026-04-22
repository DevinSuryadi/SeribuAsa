"""
Mock Payment Service
Simulates successful payment for development/demo purposes.
This will be replaced with MidtransService for production.
"""
from sqlalchemy.orm import Session
from app.models.donation import Donation, DonationStatusEnum, Voucher, VoucherStatusEnum
from app.models.user import BeneficiaryProfile, DonorProfile
from app.models.nutrition import FIESSurvey
from datetime import datetime, timedelta
from decimal import Decimal
import uuid
import logging
from uuid import UUID

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
        print(f"[MOCK_PAYMENT] Starting payment simulation for donation {donation_id}")
        logger.info(f"Starting payment simulation for donation {donation_id}")
        
        # Get donation
        try:
            donation_uuid = UUID(str(donation_id)) if not isinstance(donation_id, UUID) else donation_id
            print(f"[MOCK_PAYMENT] Looking up donation with UUID: {donation_uuid}")
            logger.info(f"Looking up donation with UUID: {donation_uuid}")
            
            donation = db.query(Donation).filter(Donation.id == donation_uuid).first()
        except Exception as e:
            print(f"[MOCK_PAYMENT] Error querying donation: {str(e)}")
            logger.error(f"Error querying donation: {str(e)}")
            raise ValueError(f"Invalid donation ID format: {donation_id}")
        
        if not donation:
            print(f"[MOCK_PAYMENT] Donation {donation_id} not found in database")
            logger.error(f"Donation {donation_id} not found in database")
            raise ValueError(f"Donation {donation_id} not found")
        
        logger.info(f"Found donation: {donation.id}, status: {donation.status}, amount: {donation.amount}")
        
        if donation.status != DonationStatusEnum.pending:
            logger.error(f"Donation status is {donation.status.value}, expected 'pending'")
            raise ValueError(f"Donation status is {donation.status.value}, must be 'pending'")
        
        # Update donation status
        donation.status = DonationStatusEnum.success
        donation.midtrans_transaction_id = f"MOCK-{uuid.uuid4().hex[:12].upper()}"
        print("[MOCK_PAYMENT] Updated donation status to success")
        logger.info("Updated donation status to success")
        
        # Create voucher for beneficiary (auto-allocate if not assigned)
        voucher_created = False
        assigned_beneficiary_id = donation.recipient_id
        
        if not assigned_beneficiary_id:
            # Auto-allocate to best beneficiary candidate
            print("[MOCK_PAYMENT] No recipient assigned, finding best beneficiary...")
            logger.info("No recipient assigned, finding best beneficiary...")
            assigned_beneficiary_id = MockPaymentService._find_best_beneficiary(db)
            if assigned_beneficiary_id:
                donation.recipient_id = assigned_beneficiary_id
                print(f"[MOCK_PAYMENT] Auto-allocated donation {donation_id} to beneficiary {assigned_beneficiary_id}")
                logger.info(f"Auto-allocated donation {donation_id} to beneficiary {assigned_beneficiary_id}")
            else:
                print("[MOCK_PAYMENT] No beneficiary found for auto-allocation")
                logger.warning("No beneficiary found for auto-allocation")
        
        if assigned_beneficiary_id:
            try:
                print(f"[MOCK_PAYMENT] Creating voucher for beneficiary {assigned_beneficiary_id}")
                MockPaymentService._create_voucher(db, donation)
                voucher_created = True
                print("[MOCK_PAYMENT] Voucher created successfully")
                logger.info("Voucher created successfully")
            except Exception as e:
                print(f"[MOCK_PAYMENT] Failed to create voucher: {str(e)}")
                logger.error(f"Failed to create voucher: {str(e)}")
                # Don't raise error - voucher is optional, continue without it
                voucher_created = False
        else:
            print("[MOCK_PAYMENT] No beneficiary assigned, skipping voucher creation")
            logger.info("No beneficiary assigned, skipping voucher creation")
        
        # Update donor metrics
        try:
            print(f"[MOCK_PAYMENT] Updating donor metrics for donor_id: {donation.donor_id}")
            MockPaymentService._update_donor_metrics(db, donation.donor_id, donation.amount)
            print("[MOCK_PAYMENT] Donor metrics updated")
            logger.info("Donor metrics updated")
        except Exception as e:
            print(f"[MOCK_PAYMENT] Failed to update donor metrics: {str(e)}")
            logger.error(f"Failed to update donor metrics: {str(e)}")
            raise
        
        try:
            print("[MOCK_PAYMENT] Committing database transaction...")
            db.commit()
            db.refresh(donation)
            print("[MOCK_PAYMENT] Database committed successfully")
            logger.info("Database committed successfully")
        except Exception as e:
            print(f"[MOCK_PAYMENT] Database commit failed: {str(e)}")
            logger.error(f"Database commit failed: {str(e)}")
            raise
        
        print(f"[MOCK_PAYMENT] Mock payment successful for donation {donation_id}")
        logger.info(f"Mock payment successful for donation {donation_id}")
        
        # Calculate impact metrics
        try:
            impact = MockPaymentService._calculate_impact(donation)
        except Exception as e:
            print(f"[MOCK_PAYMENT] Error calculating impact: {str(e)}")
            logger.error(f"Error calculating impact: {str(e)}")
            impact = {
                "children_helped": 0,
                "months_of_support": 1,
                "days_of_support": 0,
                "message": "Terima kasih atas kontribusi Anda!"
            }
        
        try:
            return {
                "success": True,
                "donation_id": str(donation.id),
                "amount": float(donation.amount) if donation.amount else 0,
                "transaction_id": donation.midtrans_transaction_id or f"MOCK-{uuid.uuid4().hex[:12].upper()}",
                "voucher_created": voucher_created,
                "impact": impact
            }
        except Exception as e:
            logger.error(f"Error building response: {str(e)}")
            raise ValueError(f"Failed to build payment response: {str(e)}")
    
    @staticmethod
    def _create_voucher(db: Session, donation: Donation) -> Voucher:
        """Create voucher for beneficiary after successful donation"""
        print(f"[MOCK_PAYMENT] Creating voucher for donation {donation.id}, recipient: {donation.recipient_id}")
        logger.info(f"Creating voucher for donation {donation.id}, recipient: {donation.recipient_id}")
        
        if not donation.recipient_id:
            print(f"[MOCK_PAYMENT] No recipient assigned for donation {donation.id}, skipping voucher creation")
            logger.warning(f"No recipient assigned for donation {donation.id}, skipping voucher creation")
            raise ValueError("Cannot create voucher: no recipient assigned to donation")
        
        # Generate unique voucher code
        voucher_code = f"VCH-{datetime.utcnow().year}-{uuid.uuid4().hex[:6].upper()}"
        
        # Calculate expiry (30 days from now)
        expiry_date = datetime.utcnow().date() + timedelta(days=30)
        
        # Create voucher
        try:
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
            print(f"[MOCK_PAYMENT] Voucher {voucher_code} added to session")
            logger.info(f"Voucher {voucher_code} added to session")
            
            # Update beneficiary balance
            beneficiary = db.query(BeneficiaryProfile).filter(
                BeneficiaryProfile.user_id == donation.recipient_id
            ).first()
            
            if beneficiary:
                current_balance = beneficiary.vouchers_balance or Decimal(0)
                beneficiary.vouchers_balance = current_balance + Decimal(str(donation.amount))
                print(f"[MOCK_PAYMENT] Updated beneficiary {beneficiary.user_id} balance: {current_balance} -> {beneficiary.vouchers_balance}")
                logger.info(f"Updated beneficiary {beneficiary.user_id} balance: {current_balance} -> {beneficiary.vouchers_balance}")
            else:
                print(f"[MOCK_PAYMENT] Beneficiary {donation.recipient_id} not found when updating balance")
                logger.warning(f"Beneficiary {donation.recipient_id} not found when updating balance")
            
            return voucher
        except Exception as e:
            print(f"[MOCK_PAYMENT] Error creating voucher: {str(e)}")
            logger.error(f"Error creating voucher: {str(e)}")
            raise
    
    @staticmethod
    def _update_donor_metrics(db: Session, donor_id: str, amount: Decimal):
        """Update donor's total donated metric"""
        try:
            print(f"[MOCK_PAYMENT] Updating donor metrics for donor {donor_id}, amount: {amount}")
            logger.info(f"Updating donor metrics for donor {donor_id}, amount: {amount}")
            donor_uuid = UUID(str(donor_id)) if not isinstance(donor_id, UUID) else donor_id
            donor = db.query(DonorProfile).filter(
                DonorProfile.user_id == donor_uuid
            ).first()
            
            if donor:
                current_total = donor.total_donated or Decimal(0)
                donor.total_donated = current_total + Decimal(str(amount))
                print(f"[MOCK_PAYMENT] Updated donor {donor_id} total_donated: {current_total} -> {donor.total_donated}")
                logger.info(f"Updated donor {donor_id} total_donated: {current_total} -> {donor.total_donated}")
            else:
                print(f"[MOCK_PAYMENT] Donor profile not found for user {donor_id}")
                logger.warning(f"Donor profile not found for user {donor_id}")
        except Exception as e:
            print(f"[MOCK_PAYMENT] Error updating donor metrics: {str(e)}")
            logger.error(f"Error updating donor metrics: {str(e)}")
            import traceback
            print(traceback.format_exc())
            logger.error(traceback.format_exc())
    
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
        
        print("[MOCK_PAYMENT] Finding best beneficiary for auto-allocation...")
        logger.info("Finding best beneficiary for auto-allocation...")
        
        # Get all active beneficiaries with their latest FIES survey
        try:
            beneficiaries = db.query(
                BeneficiaryProfile,
                func.coalesce(FIESSurvey.score, 0).label('fies_score'),
                func.coalesce(BeneficiaryProfile.vouchers_balance, Decimal(0)).label('voucher_balance')
            ).outerjoin(
                FIESSurvey,
                FIESSurvey.beneficiary_id == BeneficiaryProfile.user_id
            ).filter(
                BeneficiaryProfile.approval_status == "approved"
            ).order_by(
                # Priority: higher FIES score (more food insecure) first, then lower voucher balance
                FIESSurvey.score.desc().nullslast(),
                BeneficiaryProfile.vouchers_balance.asc()
            ).all()
            
            print(f"[MOCK_PAYMENT] Found {len(beneficiaries)} approved beneficiaries")
            logger.info(f"Found {len(beneficiaries)} approved beneficiaries")
        except Exception as e:
            print(f"[MOCK_PAYMENT] Error querying beneficiaries: {str(e)}")
            logger.error(f"Error querying beneficiaries: {str(e)}")
            import traceback
            print(traceback.format_exc())
            logger.error(traceback.format_exc())
            return None
        
        if not beneficiaries:
            print("[MOCK_PAYMENT] No approved beneficiaries found for auto-allocation")
            logger.warning("No approved beneficiaries found for auto-allocation")
            return None
        
        try:
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
                
            print(f"[MOCK_PAYMENT] Auto-allocation: Selected beneficiary {beneficiary_id} (FIES Score: {fies_score}, {priority_level})")
            logger.info(
                f"Auto-allocation: Selected beneficiary {beneficiary_id} "
                f"(FIES Score: {fies_score}, {priority_level}, "
                f"Current Balance: Rp {voucher_balance})"
            )
            
            return beneficiary_id
        except Exception as e:
            print(f"[MOCK_PAYMENT] Error processing beneficiary selection: {str(e)}")
            logger.error(f"Error processing beneficiary selection: {str(e)}")
            import traceback
            print(traceback.format_exc())
            logger.error(traceback.format_exc())
            return None
    
    @staticmethod
    def _calculate_impact(donation: Donation) -> dict:
        """Calculate impact metrics for donation"""
        try:
            # Calculation: Rp 500,000 = 1 child + 1000 days HPK support
            # Match frontend calculation in DonationSuccess.tsx
            amount = float(donation.amount) if donation.amount else 0
            units = int(amount // 500000)
            children_helped = units if donation.recipient_id else 0
            days_of_support = units * 1000
            
            if donation.subscription_config:
                months_of_support = donation.subscription_config.get("duration_months", 1)
            else:
                months_of_support = 1
            
            # Build message matching frontend logic
            message = "Terima kasih atas kontribusi Anda!"
            if children_helped > 0:
                day_text = "1000 hari pertama kehidupan" if days_of_support == 1000 else f"{days_of_support} hari pertama kehidupan"
                message = f"Donasi Anda akan membantu {children_helped} anak dan mendukung nutrisi {day_text} (1000 HPK)."
            
            return {
                "children_helped": children_helped,
                "months_of_support": months_of_support,
                "days_of_support": days_of_support,
                "message": message
            }
        except Exception as e:
            logger.error(f"Error calculating impact: {str(e)}")
            # Return default impact on error
            return {
                "children_helped": 0,
                "months_of_support": 1,
                "days_of_support": 0,
                "message": "Terima kasih atas kontribusi Anda!"
            }
