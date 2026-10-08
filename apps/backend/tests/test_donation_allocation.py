from datetime import date, datetime, timedelta
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models import FIESSurvey  # noqa: F401
from app.models.donation import Donation, DonationStatusEnum, DonationTypeEnum
from app.models.subscription import BillingHistory, BillingStatusEnum, Subscription
from app.models.wallet import WalletAllocation
from app.models.user import BeneficiaryProfile, DonorProfile, UserProfile
from app.schemas.donation import DonationCreate
from app.services.donation_allocation_service import DonationAllocationService
from app.services.donation_service import DonationService
from app.services.subscription_service import SubscriptionService


def _build_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine, autocommit=False, autoflush=False)()
    return session, engine


def _create_donor(db):
    donor_user_id = uuid4()
    db.add(UserProfile(user_id=donor_user_id, full_name="Donor Test"))
    db.add(
        DonorProfile(
            user_id=donor_user_id,
            total_donated=Decimal("0"),
            children_sponsored=0,
            subscription_status="inactive",
        )
    )
    return donor_user_id


def _create_beneficiary(db, name: str, approval_status: str = "approved"):
    beneficiary_user_id = uuid4()
    db.add(UserProfile(user_id=beneficiary_user_id, full_name=name))
    db.add(
        BeneficiaryProfile(
            user_id=beneficiary_user_id,
            family_size=3,
            approval_status=approval_status,
            vouchers_balance=Decimal("0"),
        )
    )
    return beneficiary_user_id


def _add_survey(db, beneficiary_id, score: int, survey_date: datetime):
    db.add(
        FIESSurvey(
            beneficiary_id=beneficiary_id,
            responses={f"q{i}": 1 for i in range(1, 9)},
            score=score,
            classification=FIESSurvey.classify_score(score),
            survey_date=survey_date,
            survey_month=survey_date.month,
            survey_year=survey_date.year,
        )
    )


def test_successful_donation_allocates_to_current_month_beneficiaries_by_priority():
    db, engine = _build_session()
    try:
        donor_id = _create_donor(db)

        severe_id = _create_beneficiary(db, "Severe")
        moderate_id = _create_beneficiary(db, "Moderate")
        secure_id = _create_beneficiary(db, "Secure")
        stale_id = _create_beneficiary(db, "Stale")
        pending_id = _create_beneficiary(db, "Pending", approval_status="pending")

        now = datetime.utcnow()
        _add_survey(db, severe_id, 8, now)
        _add_survey(db, moderate_id, 4, now)
        _add_survey(db, secure_id, 1, now)
        _add_survey(db, stale_id, 7, now - timedelta(days=40))
        _add_survey(db, pending_id, 7, now)

        donation = Donation(
            donor_id=donor_id,
            amount=Decimal("900000.00"),
            type=DonationTypeEnum.one_time,
            status=DonationStatusEnum.pending,
            payment_method="qris",
        )
        db.add(donation)
        db.commit()

        result = DonationAllocationService.process_successful_donation(db, str(donation.id))

        allocations = db.query(WalletAllocation).order_by(WalletAllocation.original_amount.desc()).all()
        balances = {str(alloc.beneficiary_id): alloc.original_amount for alloc in allocations}
        donor = db.query(DonorProfile).filter(DonorProfile.user_id == donor_id).first()
        metrics = DonationService.get_impact_metrics(db, str(donor_id))

        assert result["success"] is True
        assert result["voucher_created"] is True
        assert result["allocated_beneficiaries"] == 3
        assert len(allocations) == 3
        assert sum((alloc.original_amount for alloc in allocations), Decimal("0")) == Decimal("900000.00")
        assert str(stale_id) not in balances
        assert str(pending_id) not in balances
        assert balances[str(severe_id)] > balances[str(moderate_id)] > balances[str(secure_id)]
        assert balances[str(secure_id)] > Decimal("0")
        assert donor is not None
        assert donor.total_donated == Decimal("900000.00")
        assert metrics["total_donated"] == Decimal("900000.00")
        assert metrics["total_children_helped"] == 3

    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


def test_successful_donation_without_eligible_survey_creates_no_voucher():
    db, engine = _build_session()
    try:
        donor_id = _create_donor(db)
        inactive_id = _create_beneficiary(db, "Inactive")
        _add_survey(db, inactive_id, 8, datetime.utcnow() - timedelta(days=45))

        donation = Donation(
            donor_id=donor_id,
            amount=Decimal("500000.00"),
            type=DonationTypeEnum.one_time,
            status=DonationStatusEnum.pending,
            payment_method="qris",
        )
        db.add(donation)
        db.commit()

        result = DonationAllocationService.process_successful_donation(db, str(donation.id))
        db.refresh(donation)

        donor = db.query(DonorProfile).filter(DonorProfile.user_id == donor_id).first()
        allocations = db.query(WalletAllocation).all()

        assert donation.status == DonationStatusEnum.success
        assert result["voucher_created"] is False
        assert result["allocated_beneficiaries"] == 0
        assert allocations == []
        assert donor is not None
        assert donor.total_donated == Decimal("500000.00")

    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


def test_new_pooled_donation_is_counted_once_without_wallet_credit():
    db, engine = _build_session()
    try:
        donor_id = _create_donor(db)
        beneficiary_id = _create_beneficiary(db, "Legacy beneficiary")
        _add_survey(db, beneficiary_id, 8, datetime.utcnow())
        donation = DonationService.create_donation(
            db, str(donor_id), DonationCreate(amount=Decimal("50000.00"), type="one_time", payment_method="qris"),
        )
        assert donation.funding_flow == "pooled"

        result = DonationAllocationService.process_successful_donation(db, str(donation.id), "payment-50000")
        repeated = DonationAllocationService.process_successful_donation(db, str(donation.id), "payment-50000")
        db.refresh(donation)
        assert result["pooled"] is True
        assert repeated["already_processed"] is True
        assert donation.status == DonationStatusEnum.success
        assert donation.midtrans_transaction_id == "payment-50000"
        assert db.query(WalletAllocation).count() == 0
        assert db.query(DonorProfile).filter_by(user_id=donor_id).first().total_donated == Decimal("50000.00")
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


def test_recurring_bill_waits_for_verified_payment_before_entering_pool():
    db, engine = _build_session()
    try:
        donor_id = _create_donor(db)
        subscription = Subscription(
            donor_id=donor_id, plan_name="Bulanan", amount=Decimal("20000"),
            next_billing_date=date.today(), payment_method="qris",
        )
        db.add(subscription)
        db.commit()

        result = SubscriptionService.process_billing(db, subscription)
        assert result["success"] is True
        assert result["payment_status"] == "pending"
        donation = db.query(Donation).filter_by(id=UUID(result["donation_id"])).first()
        assert donation.funding_flow == "pooled"
        assert donation.status == DonationStatusEnum.pending
        assert db.query(WalletAllocation).count() == 0
        assert db.query(BillingHistory).filter_by(subscription_id=subscription.id).first().status == BillingStatusEnum.pending

        DonationAllocationService.process_successful_donation(db, str(donation.id), "verified-payment")
        assert db.query(BillingHistory).filter_by(subscription_id=subscription.id).first().status == BillingStatusEnum.success
        assert db.query(DonorProfile).filter_by(user_id=donor_id).first().total_donated == Decimal("20000")
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
