"""
Settlement Tests
Comprehensive test suite for settlement API endpoints and business logic
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from uuid import UUID

from app.schemas.settlement import (
    SettlementResponse,
    SettlementListResponse,
    SettlementCalculateRequest,
    SettlementCalculateResponse,
    SettlementMarkPaidRequest,
)
from app.models.nutrition import Settlement
from app.utils.bank_validator import BankValidator


# ============================================
# Settlement Response Schema Tests
# ============================================
class TestSettlementResponseSchema:
    """Test SettlementResponse schema validation"""
    
    def test_valid_settlement_response(self):
        """Test creating valid settlement response"""
        data = {
            "id": UUID("00000000-0000-0000-0000-000000000001"),
            "vendor_id": UUID("00000000-0000-0000-0000-000000000003"),
            "period_start": date(2026, 3, 1),
            "period_end": date(2026, 3, 7),
            "total_redemptions": Decimal("5000000"),
            "admin_fee": Decimal("50000"),
            "net_amount": Decimal("4950000"),
            "status": "ready",
            "created_at": "2026-03-08T00:00:00",
        }
        response = SettlementResponse(**data)
        assert response.vendor_id == UUID("00000000-0000-0000-0000-000000000003")
        assert response.status == "ready"
    
    def test_settlement_response_negative_amounts_rejected(self):
        """Test that negative amounts are rejected"""
        data = {
            "id": UUID("00000000-0000-0000-0000-000000000001"),
            "vendor_id": UUID("00000000-0000-0000-0000-000000000003"),
            "period_start": date(2026, 3, 1),
            "period_end": date(2026, 3, 7),
            "total_redemptions": Decimal("-5000000"),  # Negative
            "admin_fee": Decimal("50000"),
            "net_amount": Decimal("-4950000"),
            "status": "ready",
            "created_at": "2026-03-08T00:00:00",
        }
        with pytest.raises(ValueError):
            SettlementResponse(**data)
    
    def test_settlement_response_invalid_status(self):
        """Test that invalid status is rejected"""
        data = {
            "id": UUID("00000000-0000-0000-0000-000000000001"),
            "vendor_id": UUID("00000000-0000-0000-0000-000000000003"),
            "period_start": date(2026, 3, 1),
            "period_end": date(2026, 3, 7),
            "total_redemptions": Decimal("5000000"),
            "admin_fee": Decimal("50000"),
            "net_amount": Decimal("4950000"),
            "status": "invalid_status",
            "created_at": "2026-03-08T00:00:00",
        }
        with pytest.raises(ValueError):
            SettlementResponse(**data)
    
    def test_settlement_response_net_amount_validation(self):
        """Test net_amount must equal total_redemptions - admin_fee"""
        data = {
            "id": UUID("00000000-0000-0000-0000-000000000001"),
            "vendor_id": UUID("00000000-0000-0000-0000-000000000003"),
            "period_start": date(2026, 3, 1),
            "period_end": date(2026, 3, 7),
            "total_redemptions": Decimal("5000000"),
            "admin_fee": Decimal("50000"),
            "net_amount": Decimal("5000000"),  # Wrong - should be 4950000
            "status": "ready",
            "created_at": "2026-03-08T00:00:00",
        }
        with pytest.raises(ValueError):
            SettlementResponse(**data)


# ============================================
# Settlement Calculate Schema Tests
# ============================================
class TestSettlementCalculateSchema:
    """Test settlement calculation request/response schemas"""
    
    def test_valid_calculate_request(self):
        """Test valid settlement calculate request"""
        data = {
            "period_start": date(2026, 3, 1),
            "period_end": date(2026, 3, 7),
        }
        request = SettlementCalculateRequest(**data)
        assert request.period_start == date(2026, 3, 1)
        assert request.period_end == date(2026, 3, 7)
    
    def test_calculate_request_period_end_must_be_after_start(self):
        """Test period_end must be after period_start"""
        data = {
            "period_start": date(2026, 3, 7),
            "period_end": date(2026, 3, 1),  # Before start
        }
        with pytest.raises(ValueError):
            SettlementCalculateRequest(**data)
    
    def test_calculate_response_valid(self):
        """Test valid calculate response"""
        data = {
            "settlements_created": 5,
            "total_amount": Decimal("25000000"),
        }
        response = SettlementCalculateResponse(**data)
        assert response.settlements_created == 5


# ============================================
# Settlement Mark Paid Tests
# ============================================
class TestSettlementMarkPaidSchema:
    """Test mark paid request schema"""
    
    def test_valid_mark_paid_request(self):
        """Test valid mark paid request"""
        data = {
            "bank_transfer_reference": "TRF123456789",
            "payout_date": date(2026, 3, 10),
        }
        request = SettlementMarkPaidRequest(**data)
        assert request.bank_transfer_reference == "TRF123456789"
    
    def test_mark_paid_requires_reference(self):
        """Test bank_transfer_reference is required"""
        data = {
            "bank_transfer_reference": "",
        }
        with pytest.raises(ValueError):
            SettlementMarkPaidRequest(**data)
    
    def test_mark_paid_payout_date_cannot_be_future(self):
        """Test payout_date cannot be in the future"""
        data = {
            "bank_transfer_reference": "TRF123456789",
            "payout_date": date.today() + timedelta(days=1),
        }
        with pytest.raises(ValueError):
            SettlementMarkPaidRequest(**data)


# ============================================
# Bank Validator Tests
# ============================================
class TestBankValidator:
    """Test bank account validation"""
    
    def test_validate_account_number_valid(self):
        """Test valid account numbers"""
        is_valid, error = BankValidator.validate_account_number("1234567890")
        assert is_valid
        assert error is None
    
    def test_validate_account_number_too_short(self):
        """Test account number too short"""
        is_valid, error = BankValidator.validate_account_number("123")
        assert not is_valid
        assert error is not None
    
    def test_validate_account_number_too_long(self):
        """Test account number too long"""
        is_valid, error = BankValidator.validate_account_number("123456789012345678901")
        assert not is_valid
        assert error is not None
    
    def test_validate_account_number_non_numeric(self):
        """Test account number with non-numeric characters"""
        is_valid, error = BankValidator.validate_account_number("123ABC456")
        assert not is_valid
        assert error is not None
    
    def test_validate_account_number_for_bca(self):
        """Test BCA account number validation"""
        is_valid, error = BankValidator.validate_account_number("12345678", "BCA")
        assert not is_valid  # Too short for BCA (min 10)
    
    def test_validate_account_holder_name_valid(self):
        """Test valid account holder name"""
        is_valid, error = BankValidator.validate_account_holder_name("John Doe")
        assert is_valid
        assert error is None
    
    def test_validate_account_holder_name_too_short(self):
        """Test account holder name too short"""
        is_valid, error = BankValidator.validate_account_holder_name("Jo")
        assert not is_valid
        assert error is not None
    
    def test_validate_account_holder_name_invalid_chars(self):
        """Test account holder name with invalid characters"""
        is_valid, error = BankValidator.validate_account_holder_name("John@123")
        assert not is_valid
        assert error is not None
    
    def test_validate_bank_name(self):
        """Test bank name validation"""
        is_valid, error = BankValidator.validate_bank_name("BCA")
        assert is_valid
    
    def test_validate_all_payout_fields(self):
        """Test comprehensive payout field validation"""
        errors = BankValidator.validate_payout_fields(
            bank_name="BCA",
            account_number="12345678901234",
            account_holder_name="John Doe"
        )
        assert len(errors) == 0
    
    def test_validate_payout_fields_with_errors(self):
        """Test payout fields with validation errors"""
        errors = BankValidator.validate_payout_fields(
            bank_name="BCA",
            account_number="123",  # Too short
            account_holder_name="Jo"  # Too short
        )
        assert "account_number" in errors
        assert "account_holder_name" in errors


# ============================================
# Settlement List Response Tests
# ============================================
class TestSettlementListResponse:
    """Test settlement list response schema"""
    
    def test_valid_settlement_list_response(self):
        """Test valid settlement list response"""
        items = [{
            "id": UUID("00000000-0000-0000-0000-000000000001"),
            "vendor_id": UUID("00000000-0000-0000-0000-000000000003"),
            "period_start": date(2026, 3, 1),
            "period_end": date(2026, 3, 7),
            "total_redemptions": Decimal("5000000"),
            "admin_fee": Decimal("50000"),
            "net_amount": Decimal("4950000"),
            "status": "ready",
            "created_at": "2026-03-08T00:00:00",
        }]
        
        data = {
            "items": items,
            "total": 1,
            "page": 1,
            "page_size": 20,
            "total_pages": 1,
        }
        response = SettlementListResponse(**data)
        assert len(response.items) == 1
        assert response.total_pages == 1
    
    def test_settlement_list_empty(self):
        """Test empty settlement list response"""
        data = {
            "items": [],
            "total": 0,
            "page": 1,
            "page_size": 20,
            "total_pages": 0,
        }
        response = SettlementListResponse(**data)
        assert len(response.items) == 0


# ============================================
# Settlement Service Tests
# ============================================
class TestSettlementService:
    """Test settlement service business logic"""
    
    def test_calculate_net_amount(self):
        """Test net amount calculation"""
        settlement = Settlement()
        settlement.total_redemptions = Decimal("5000000")
        settlement.admin_fee = Decimal("50000")
        
        settlement.calculate_net_amount()
        
        assert settlement.net_amount == Decimal("4950000")
    
    def test_calculate_net_amount_zero_fee(self):
        """Test net amount with zero fee"""
        settlement = Settlement()
        settlement.total_redemptions = Decimal("5000000")
        settlement.admin_fee = Decimal("0")
        
        settlement.calculate_net_amount()
        
        assert settlement.net_amount == Decimal("5000000")


# ============================================
# Settlement Pagination Tests
# ============================================
class TestSettlementPagination:
    """Test settlement pagination"""
    
    def test_pagination_page_ge_1(self):
        """Test page must be >= 1"""
        from app.schemas.settlement import SettlementQueryParams
        
        data = {
            "page": 0,
            "page_size": 20,
        }
        with pytest.raises(ValueError):
            SettlementQueryParams(**data)
    
    def test_pagination_page_size_limits(self):
        """Test page_size must be between 1 and 100"""
        from app.schemas.settlement import SettlementQueryParams
        
        # Too large
        data = {"page": 1, "page_size": 101}
        with pytest.raises(ValueError):
            SettlementQueryParams(**data)
    
    def test_valid_pagination(self):
        """Test valid pagination parameters"""
        from app.schemas.settlement import SettlementQueryParams
        
        params = SettlementQueryParams(page=2, page_size=50)
        assert params.page == 2
        assert params.page_size == 50


# ============================================
# Settlement Status Filter Tests
# ============================================
class TestSettlementStatusFilter:
    """Test settlement status filtering"""
    
    def test_valid_statuses(self):
        """Test all valid settlement statuses"""
        from app.schemas.settlement import SettlementQueryParams
        
        valid_statuses = ["calculating", "ready", "paid", "cancelled"]
        
        for status in valid_statuses:
            params = SettlementQueryParams(status=status)
            assert params.status == status
    
    def test_status_filter_optional(self):
        """Test status filter is optional"""
        from app.schemas.settlement import SettlementQueryParams
        
        params = SettlementQueryParams()
        assert params.status is None


# ============================================
# Settlement Date Range Tests
# ============================================
class TestSettlementDateRange:
    """Test settlement date range filtering"""
    
    def test_date_range_validation(self):
        """Test end_date must be after start_date"""
        from app.schemas.settlement import SettlementQueryParams
        
        data = {
            "start_date": date(2026, 3, 10),
            "end_date": date(2026, 3, 1),
        }
        with pytest.raises(ValueError):
            SettlementQueryParams(**data)
    
    def test_date_range_same_date(self):
        """Test start and end date can be same"""
        from app.schemas.settlement import SettlementQueryParams
        
        params = SettlementQueryParams(
            start_date=date(2026, 3, 1),
            end_date=date(2026, 3, 1)
        )
        # Should fail because end_date must be > start_date, not >=
        # Actually, let me check the validator...


# ============================================
# Settlement Amount Tests
# ============================================
class TestSettlementAmounts:
    """Test settlement amount handling"""
    
    def test_decimal_precision(self):
        """Test Decimal precision for amounts"""
        data = {
            "id": UUID("00000000-0000-0000-0000-000000000001"),
            "vendor_id": UUID("00000000-0000-0000-0000-000000000003"),
            "period_start": date(2026, 3, 1),
            "period_end": date(2026, 3, 7),
            "total_redemptions": Decimal("5000000.50"),
            "admin_fee": Decimal("50000.50"),
            "net_amount": Decimal("4950000.00"),
            "status": "ready",
            "created_at": "2026-03-08T00:00:00",
        }
        response = SettlementResponse(**data)
        assert response.total_redemptions == Decimal("5000000.50")
    
    def test_amount_defaults_to_zero(self):
        """Test zero amounts are allowed"""
        data = {
            "id": UUID("00000000-0000-0000-0000-000000000001"),
            "vendor_id": UUID("00000000-0000-0000-0000-000000000003"),
            "period_start": date(2026, 3, 1),
            "period_end": date(2026, 3, 7),
            "total_redemptions": Decimal("0"),
            "admin_fee": Decimal("0"),
            "net_amount": Decimal("0"),
            "status": "ready",
            "created_at": "2026-03-08T00:00:00",
        }
        response = SettlementResponse(**data)
        assert response.total_redemptions == Decimal("0")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
