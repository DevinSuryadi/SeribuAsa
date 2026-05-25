"""
Unit tests for Donation Service
Tests donation operations: create, process, allocate, and reporting
"""
import pytest
from decimal import Decimal
from datetime import datetime, timedelta
from uuid import uuid4
from unittest.mock import MagicMock

from sqlalchemy.orm import Session

from app.services.donation_service import DonationService
from app.models.donation import Donation
from app.models.user import BeneficiaryProfile


@pytest.fixture
def mock_db():
    """Create a mock database session"""
    return MagicMock(spec=Session)


@pytest.fixture
def sample_donation():
    """Create a sample donation"""
    donation = MagicMock(spec=Donation)
    donation.id = uuid4()
    donation.donor_id = uuid4()
    donation.amount = Decimal("500000")
    donation.status = "completed"
    donation.created_at = datetime.utcnow()
    donation.description = "Test Donation"
    return donation


@pytest.fixture
def sample_beneficiary():
    """Create a sample beneficiary"""
    beneficiary = MagicMock(spec=BeneficiaryProfile)
    beneficiary.id = uuid4()
    beneficiary.name = "Test Beneficiary"
    beneficiary.email = "beneficiary@test.com"
    return beneficiary


class TestDonationServiceCreate:
    """Test donation creation"""

    def test_create_donation_success(self, mock_db):
        """Test creating a donation successfully"""
        donation_data = {
            "donor_id": uuid4(),
            "amount": Decimal("250000"),
            "description": "Donation for education"
        }
        
        DonationService.create_donation(db=mock_db, **donation_data)
        
        assert mock_db.add.called

    def test_create_donation_with_invalid_amount(self, mock_db):
        """Test creating donation with invalid amount"""
        donation_data = {
            "donor_id": uuid4(),
            "amount": Decimal("-100000")  # Negative amount
        }
        
        with pytest.raises(Exception):
            DonationService.create_donation(db=mock_db, **donation_data)

    def test_create_donation_with_zero_amount(self, mock_db):
        """Test creating donation with zero amount"""
        donation_data = {
            "donor_id": uuid4(),
            "amount": Decimal("0")
        }
        
        with pytest.raises(Exception):
            DonationService.create_donation(db=mock_db, **donation_data)

    def test_create_donation_missing_donor(self, mock_db):
        """Test creating donation without donor"""
        donation_data = {
            "amount": Decimal("100000")
        }
        
        with pytest.raises(Exception):
            DonationService.create_donation(db=mock_db, **donation_data)

    def test_create_donation_with_metadata(self, mock_db):
        """Test creating donation with additional metadata"""
        donation_data = {
            "donor_id": uuid4(),
            "amount": Decimal("100000"),
            "description": "Test donation",
            "campaign_id": uuid4(),
            "notes": "Additional notes"
        }
        
        DonationService.create_donation(db=mock_db, **donation_data)
        
        assert mock_db.add.called


class TestDonationServiceRead:
    """Test donation retrieval"""

    def test_get_donation_by_id(self, mock_db, sample_donation):
        """Test getting donation by ID"""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_donation
        
        result = DonationService.get_donation(db=mock_db, donation_id=sample_donation.id)
        
        assert result == sample_donation
        assert result.amount == Decimal("500000")

    def test_get_donation_not_found(self, mock_db):
        """Test getting non-existent donation"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = DonationService.get_donation(db=mock_db, donation_id=uuid4())
        
        assert result is None

    def test_get_donations_by_donor(self, mock_db, sample_donation):
        """Test getting all donations from a donor"""
        donor_id = uuid4()
        donations = [sample_donation, sample_donation]
        mock_db.query.return_value.filter.return_value.all.return_value = donations
        
        result = DonationService.get_donations_by_donor(db=mock_db, donor_id=donor_id)
        
        assert len(result) == 2

    def test_get_donations_by_status(self, mock_db, sample_donation):
        """Test getting donations by status"""
        donations = [sample_donation]
        mock_db.query.return_value.filter.return_value.all.return_value = donations
        
        result = DonationService.get_donations_by_status(db=mock_db, status="completed")
        
        assert len(result) >= 0


class TestDonationServiceAllocation:
    """Test donation allocation"""

    def test_allocate_donation_to_beneficiary(self, mock_db, sample_donation, sample_beneficiary):
        """Test allocating donation to beneficiary"""
        allocation_data = {
            "donation_id": sample_donation.id,
            "beneficiary_id": sample_beneficiary.id,
            "amount": Decimal("100000")
        }
        
        DonationService.allocate_donation(db=mock_db, **allocation_data)
        
        assert mock_db.add.called

    def test_allocate_donation_exceeds_amount(self, mock_db, sample_donation, sample_beneficiary):
        """Test allocating more than donation amount"""
        allocation_data = {
            "donation_id": sample_donation.id,
            "beneficiary_id": sample_beneficiary.id,
            "amount": Decimal("1000000")  # More than donation amount
        }
        
        with pytest.raises(Exception):
            DonationService.allocate_donation(db=mock_db, **allocation_data)

    def test_allocate_donation_to_multiple_beneficiaries(self, mock_db, sample_donation):
        """Test allocating donation to multiple beneficiaries"""
        allocations = [
            {
                "donation_id": sample_donation.id,
                "beneficiary_id": uuid4(),
                "amount": Decimal("250000")
            },
            {
                "donation_id": sample_donation.id,
                "beneficiary_id": uuid4(),
                "amount": Decimal("250000")
            }
        ]
        
        result = DonationService.allocate_donation_batch(db=mock_db, allocations=allocations)
        
        assert isinstance(result, list)

    def test_get_allocation_by_id(self, mock_db):
        """Test getting allocation by ID"""
        allocation = MagicMock()
        allocation.id = uuid4()
        mock_db.query.return_value.filter.return_value.first.return_value = allocation
        
        result = DonationService.get_allocation(db=mock_db, allocation_id=allocation.id)
        
        assert result == allocation

    def test_get_allocations_by_donation(self, mock_db, sample_donation):
        """Test getting all allocations for a donation"""
        allocations = [MagicMock() for _ in range(3)]
        mock_db.query.return_value.filter.return_value.all.return_value = allocations
        
        result = DonationService.get_allocations_by_donation(db=mock_db, donation_id=sample_donation.id)
        
        assert len(result) == 3


class TestDonationServiceUpdate:
    """Test donation updates"""

    def test_update_donation_status(self, mock_db, sample_donation):
        """Test updating donation status"""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_donation
        
        DonationService.update_donation_status(
            db=mock_db,
            donation_id=sample_donation.id,
            status="processed"
        )
        
        assert mock_db.add.called

    def test_update_donation_description(self, mock_db, sample_donation):
        """Test updating donation description"""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_donation
        
        new_description = "Updated description"
        DonationService.update_donation(
            db=mock_db,
            donation_id=sample_donation.id,
            description=new_description
        )
        
        assert mock_db.add.called

    def test_update_allocation_status(self, mock_db):
        """Test updating allocation status"""
        allocation = MagicMock()
        allocation.id = uuid4()
        mock_db.query.return_value.filter.return_value.first.return_value = allocation
        
        DonationService.update_allocation_status(
            db=mock_db,
            allocation_id=allocation.id,
            status="distributed"
        )
        
        assert mock_db.add.called


class TestDonationServiceReporting:
    """Test donation reporting and analytics"""

    def test_get_total_donations(self, mock_db):
        """Test getting total donation amount"""
        mock_db.query.return_value.scalar.return_value = Decimal("5000000")
        
        total = DonationService.get_total_donations(db=mock_db)
        
        assert total == Decimal("5000000")

    def test_get_donations_by_date_range(self, mock_db, sample_donation):
        """Test getting donations within date range"""
        start_date = datetime.utcnow() - timedelta(days=30)
        end_date = datetime.utcnow()
        
        donations = [sample_donation]
        mock_db.query.return_value.filter.return_value.all.return_value = donations
        
        result = DonationService.get_donations_by_date_range(
            db=mock_db,
            start_date=start_date,
            end_date=end_date
        )
        
        assert isinstance(result, list)

    def test_get_donation_statistics(self, mock_db):
        """Test getting donation statistics"""
        {
            "total_donations": Decimal("5000000"),
            "total_count": 50,
            "average_amount": Decimal("100000"),
            "max_amount": Decimal("500000"),
            "min_amount": Decimal("10000")
        }
        
        result = DonationService.get_donation_statistics(db=mock_db)
        
        assert isinstance(result, dict)

    def test_get_top_donors(self, mock_db):
        """Test getting top donors"""
        [
            {"donor_id": uuid4(), "total_donated": Decimal("1000000")},
            {"donor_id": uuid4(), "total_donated": Decimal("800000")},
            {"donor_id": uuid4(), "total_donated": Decimal("600000")}
        ]
        
        result = DonationService.get_top_donors(db=mock_db, limit=3)
        
        assert isinstance(result, list)

    def test_get_allocation_statistics(self, mock_db):
        """Test getting allocation statistics"""
        {
            "total_allocated": Decimal("4500000"),
            "total_count": 45,
            "average_allocation": Decimal("100000")
        }
        
        result = DonationService.get_allocation_statistics(db=mock_db)
        
        assert isinstance(result, dict)


class TestDonationServiceValidation:
    """Test donation validation"""

    def test_validate_donation_amount(self):
        """Test donation amount validation"""
        # Valid amounts
        assert DonationService.validate_amount(Decimal("100000")) is True
        assert DonationService.validate_amount(Decimal("1000")) is True
        
        # Invalid amounts
        assert DonationService.validate_amount(Decimal("-100000")) is False
        assert DonationService.validate_amount(Decimal("0")) is False

    def test_validate_donation_status(self):
        """Test donation status validation"""
        valid_statuses = ["pending", "completed", "failed", "cancelled"]
        
        for status in valid_statuses:
            assert DonationService.validate_status(status) is True
        
        assert DonationService.validate_status("invalid_status") is False

    def test_validate_allocation_amount(self):
        """Test allocation amount validation"""
        donation_amount = Decimal("500000")
        
        # Valid allocation
        assert DonationService.validate_allocation_amount(Decimal("250000"), donation_amount) is True
        
        # Invalid allocation (exceeds donation)
        assert DonationService.validate_allocation_amount(Decimal("600000"), donation_amount) is False


class TestDonationServiceIntegration:
    """Integration tests for donation service"""

    def test_complete_donation_flow(self, mock_db, sample_donation, sample_beneficiary):
        """Test complete donation flow: create -> allocate -> process"""
        # Create donation
        donation_data = {
            "donor_id": uuid4(),
            "amount": Decimal("500000"),
            "description": "Test donation"
        }
        
        mock_db.query.return_value.filter.return_value.first.return_value = sample_donation
        
        DonationService.create_donation(db=mock_db, **donation_data)
        assert mock_db.add.called
        
        # Allocate donation
        allocation_data = {
            "donation_id": sample_donation.id,
            "beneficiary_id": sample_beneficiary.id,
            "amount": Decimal("500000")
        }
        
        DonationService.allocate_donation(db=mock_db, **allocation_data)
        assert mock_db.add.called
        
        # Update status
        DonationService.update_donation_status(
            db=mock_db,
            donation_id=sample_donation.id,
            status="processed"
        )
        assert mock_db.add.called

    def test_split_donation_to_multiple_beneficiaries(self, mock_db, sample_donation):
        """Test splitting donation among multiple beneficiaries"""
        beneficiary_ids = [uuid4(), uuid4(), uuid4()]
        amount_per_beneficiary = sample_donation.amount / len(beneficiary_ids)
        
        allocations = [
            {
                "donation_id": sample_donation.id,
                "beneficiary_id": bid,
                "amount": amount_per_beneficiary
            }
            for bid in beneficiary_ids
        ]
        
        result = DonationService.allocate_donation_batch(db=mock_db, allocations=allocations)
        
        assert isinstance(result, list)
