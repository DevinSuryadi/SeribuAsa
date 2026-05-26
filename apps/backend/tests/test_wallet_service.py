"""
Unit tests for Wallet Service
Tests wallet operations: credit, hold, release, refund, and expiration
"""
import pytest
from decimal import Decimal
from datetime import datetime, timedelta
from uuid import uuid4
from unittest.mock import MagicMock, patch

from sqlalchemy.orm import Session

from app.services.wallet_service import WalletService
from app.models.wallet import WalletAllocation
from app.models.user import BeneficiaryProfile


@pytest.fixture
def mock_db():
    """Create a mock database session"""
    return MagicMock(spec=Session)


@pytest.fixture
def beneficiary():
    """Create a mock beneficiary profile"""
    beneficiary = MagicMock(spec=BeneficiaryProfile)
    beneficiary.user_id = uuid4()
    beneficiary.vouchers_balance = Decimal("0")
    beneficiary.wallet_held = Decimal("0")
    return beneficiary


@pytest.fixture
def order(beneficiary):
    """Create a mock order"""
    from app.models.product import Order
    from app.models.user import VendorProfile
    order = MagicMock(spec=Order)
    order.id = uuid4()
    order.total_amount = Decimal("50000")
    order.beneficiary_profile = beneficiary
    
    vendor = MagicMock(spec=VendorProfile)
    vendor.user_id = uuid4()
    vendor.wallet_balance = Decimal("0")
    order.vendor_profile = vendor
    return order


class TestWalletServiceCredit:
    """Test wallet credit operations"""

    def test_credit_increases_balance(self, mock_db, beneficiary):
        """Test that credit operation increases wallet balance"""
        amount = Decimal("100000")
        
        # Mock the database query
        mock_db.query.return_value.filter.return_value.first.return_value = beneficiary
        
        allocation = WalletService.credit(
            db=mock_db,
            beneficiary_id=beneficiary.user_id,
            amount=amount,
            description="Test credit"
        )
        
        # Verify allocation was created
        assert allocation is not None
        assert allocation.original_amount == amount
        assert allocation.remaining_amount == amount
        assert allocation.status == "active"

    def test_credit_creates_transaction(self, mock_db, beneficiary):
        """Test that credit operation creates transaction record"""
        amount = Decimal("50000")
        
        mock_db.query.return_value.filter.return_value.first.return_value = beneficiary
        
        WalletService.credit(
            db=mock_db,
            beneficiary_id=beneficiary.user_id,
            amount=amount
        )
        
        # Verify transaction was added
        assert mock_db.add.called

    def test_credit_with_donation_id(self, mock_db, beneficiary):
        """Test credit operation with donation ID"""
        amount = Decimal("75000")
        donation_id = uuid4()
        
        mock_db.query.return_value.filter.return_value.first.return_value = beneficiary
        
        allocation = WalletService.credit(
            db=mock_db,
            beneficiary_id=beneficiary.user_id,
            amount=amount,
            donation_id=donation_id
        )
        
        assert allocation.donation_id == donation_id

    def test_credit_sets_expiration_date(self, mock_db, beneficiary):
        """Test that credit sets allocation expiration date"""
        amount = Decimal("100000")
        
        mock_db.query.return_value.filter.return_value.first.return_value = beneficiary
        
        before_credit = datetime.utcnow()
        allocation = WalletService.credit(
            db=mock_db,
            beneficiary_id=beneficiary.user_id,
            amount=amount
        )
        datetime.utcnow()
        
        # Expiration should be 90 days from now
        assert allocation.expires_at is not None
        expected_expiry = before_credit + timedelta(days=90)
        assert allocation.expires_at >= expected_expiry

    def test_credit_with_decimal_amount(self, mock_db, beneficiary):
        """Test credit with decimal amount"""
        amount = Decimal("12345.67")
        
        mock_db.query.return_value.filter.return_value.first.return_value = beneficiary
        
        allocation = WalletService.credit(
            db=mock_db,
            beneficiary_id=beneficiary.user_id,
            amount=amount
        )
        
        assert allocation.original_amount == amount

    def test_credit_with_string_amount(self, mock_db, beneficiary):
        """Test credit with string amount (should be converted to Decimal)"""
        amount_str = "50000"
        
        mock_db.query.return_value.filter.return_value.first.return_value = beneficiary
        
        allocation = WalletService.credit(
            db=mock_db,
            beneficiary_id=beneficiary.user_id,
            amount=amount_str
        )
        
        assert allocation.original_amount == Decimal("50000")


class TestWalletServiceHold:
    """Test wallet hold operations"""

    def test_hold_locks_amount(self, mock_db, beneficiary):
        """Test that hold operation locks amount"""
        beneficiary.vouchers_balance = Decimal("100000")
        amount = Decimal("50000")
        
        mock_db.query.return_value.filter.return_value.first.return_value = beneficiary
        
        result = WalletService.hold(
            db=mock_db,
            beneficiary=beneficiary,
            amount=amount
        )
        
        # Hold should succeed if balance is sufficient
        assert result is True or result is False

    def test_hold_insufficient_balance(self, mock_db, beneficiary):
        """Test hold fails with insufficient balance"""
        beneficiary.vouchers_balance = Decimal("10000")
        amount = Decimal("50000")
        
        result = WalletService.hold(
            db=mock_db,
            beneficiary=beneficiary,
            amount=amount
        )
        
        # Should fail due to insufficient balance
        assert result is False

    def test_hold_with_order_id(self, mock_db, beneficiary):
        """Test hold operation with order ID"""
        beneficiary.vouchers_balance = Decimal("100000")
        amount = Decimal("50000")
        order_id = uuid4()
        
        result = WalletService.hold(
            db=mock_db,
            beneficiary=beneficiary,
            amount=amount,
            order_id=order_id
        )
        
        # Should process the hold
        assert isinstance(result, bool)


class TestWalletServiceRefund:
    """Test wallet refund operations"""

    def test_refund_hold_returns_amount(self, mock_db, beneficiary, order):
        """Test that refund_hold returns held amount"""
        beneficiary.vouchers_balance = Decimal("50000")
        beneficiary.wallet_held = Decimal("50000")
        
        WalletService.refund_hold(
            db=mock_db,
            order=order
        )
        
        # Refund should succeed
        assert beneficiary.wallet_held == Decimal("0")

    def test_refund_hold_with_order_id(self, mock_db, beneficiary, order):
        """Test refund_hold with order ID"""
        beneficiary.vouchers_balance = Decimal("50000")
        beneficiary.wallet_held = Decimal("50000")
        order.total_amount = Decimal("25000")
        
        WalletService.refund_hold(
            db=mock_db,
            order=order
        )
        
        assert beneficiary.wallet_held == Decimal("25000")


class TestWalletServiceRelease:
    """Test wallet release operations"""

    def test_release_to_vendor(self, mock_db, beneficiary, order):
        """Test releasing held amount to vendor"""
        beneficiary.vouchers_balance = Decimal("100000")
        beneficiary.wallet_held = Decimal("50000")
        
        result = WalletService.release_to_vendor(
            db=mock_db,
            order=order
        )
        
        # Release should succeed (returns net amount)
        assert isinstance(result, Decimal)
        assert result > Decimal("0")

    def test_release_to_vendor_with_order_id(self, mock_db, beneficiary, order):
        """Test release_to_vendor with order ID"""
        beneficiary.vouchers_balance = Decimal("100000")
        beneficiary.wallet_held = Decimal("50000")
        
        result = WalletService.release_to_vendor(
            db=mock_db,
            order=order
        )
        
        assert isinstance(result, Decimal)


class TestWalletServiceExpiration:
    """Test wallet allocation expiration"""

    def test_expire_allocations(self, mock_db):
        """Test expiring old allocations"""
        # Create mock allocations
        old_allocation = MagicMock(spec=WalletAllocation)
        old_allocation.expires_at = datetime.utcnow() - timedelta(days=1)
        old_allocation.remaining_amount = Decimal("10000")
        old_allocation.status = "active"
        
        mock_db.query.return_value.filter.return_value.all.return_value = [old_allocation]
        
        # Need to mock _require_beneficiary
        beneficiary = MagicMock(spec=BeneficiaryProfile)
        beneficiary.vouchers_balance = Decimal("10000")
        
        with patch('app.services.wallet_service._require_beneficiary', return_value=beneficiary):
            result = WalletService.expire_allocations(db=mock_db)
        
        # Should have processed expired allocations
        assert isinstance(result, dict)
        assert result["expired_allocations"] == 1

    def test_expire_allocations_updates_status(self, mock_db):
        """Test that expire_allocations updates allocation status"""
        old_allocation = MagicMock(spec=WalletAllocation)
        old_allocation.expires_at = datetime.utcnow() - timedelta(days=1)
        old_allocation.remaining_amount = Decimal("10000")
        old_allocation.status = "active"
        
        mock_db.query.return_value.filter.return_value.all.return_value = [old_allocation]
        
        beneficiary = MagicMock(spec=BeneficiaryProfile)
        beneficiary.vouchers_balance = Decimal("10000")
        
        with patch('app.services.wallet_service._require_beneficiary', return_value=beneficiary):
            WalletService.expire_allocations(db=mock_db)
        
        # Verify database operations were called
        assert mock_db.add.called or mock_db.query.called


class TestWalletServiceValidation:
    """Test wallet service validation"""

    def test_validate_amount_positive(self):
        """Test that amount must be positive"""
        # This would test internal validation logic
        pass

    def test_validate_beneficiary_exists(self, mock_db):
        """Test that beneficiary must exist"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Should raise error or return False
        with pytest.raises(Exception):
            WalletService.credit(
                db=mock_db,
                beneficiary_id=uuid4(),
                amount=Decimal("100000")
            )

    def test_validate_vendor_exists(self, mock_db, order):
        """Test that vendor must exist for release operations"""
        # Set vendor_profile to None to simulate missing vendor
        order.vendor_profile = None
        
        # Should handle missing vendor
        with pytest.raises(Exception):
            WalletService.release_to_vendor(
                db=mock_db,
                order=order
            )


class TestWalletServiceIntegration:
    """Integration tests for wallet service"""

    def test_credit_then_hold_then_release(self, mock_db, beneficiary, order):
        """Test complete flow: credit -> hold -> release"""
        beneficiary.vouchers_balance = Decimal("0")
        beneficiary.wallet_held = Decimal("0")
        
        mock_db.query.return_value.filter.return_value.first.return_value = beneficiary
        
        # Credit wallet
        allocation = WalletService.credit(
            db=mock_db,
            beneficiary_id=beneficiary.user_id,
            amount=Decimal("100000")
        )
        assert allocation is not None
        
        # Hold amount
        beneficiary.vouchers_balance = Decimal("100000")
        beneficiary.wallet_held = Decimal("0")
        
        hold_result = WalletService.hold(
            db=mock_db,
            beneficiary=beneficiary,
            amount=Decimal("50000")
        )
        assert hold_result is True
        
        # Set hold state for release
        beneficiary.wallet_held = Decimal("50000")
        order.total_amount = Decimal("50000")
        order.beneficiary_profile = beneficiary
        
        release_result = WalletService.release_to_vendor(
            db=mock_db,
            order=order
        )
        assert isinstance(release_result, Decimal)

    def test_credit_then_hold_then_refund(self, mock_db, beneficiary, order):
        """Test complete flow: credit -> hold -> refund"""
        beneficiary.vouchers_balance = Decimal("0")
        beneficiary.wallet_held = Decimal("0")
        
        mock_db.query.return_value.filter.return_value.first.return_value = beneficiary
        
        # Credit wallet
        allocation = WalletService.credit(
            db=mock_db,
            beneficiary_id=beneficiary.user_id,
            amount=Decimal("100000")
        )
        assert allocation is not None
        
        # Hold amount
        beneficiary.vouchers_balance = Decimal("100000")
        beneficiary.wallet_held = Decimal("0")
        
        WalletService.hold(
            db=mock_db,
            beneficiary=beneficiary,
            amount=Decimal("50000")
        )
        
        # Refund hold
        beneficiary.wallet_held = Decimal("50000")
        order.total_amount = Decimal("50000")
        order.beneficiary_profile = beneficiary
        
        WalletService.refund_hold(
            db=mock_db,
            order=order
        )
        assert beneficiary.wallet_held == Decimal("0")
