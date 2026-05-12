"""
Unit tests for utility functions
Tests helper functions and utilities
"""
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
from uuid import uuid4
import time

try:
    from app.utils.voucher_code_generator import generate_voucher_code, validate_voucher_code
except ImportError:
    # Fallback if function names differ
    from app.utils.voucher_code_generator import VoucherCodeGenerator
    generate_voucher_code = VoucherCodeGenerator.generate_code if hasattr(VoucherCodeGenerator, 'generate_code') else None
    validate_voucher_code = VoucherCodeGenerator.validate_code if hasattr(VoucherCodeGenerator, 'validate_code') else None

try:
    from app.utils.bank_validator import BankValidator, validate_bank_account
except ImportError:
    BankValidator = None
    validate_bank_account = None

try:
    from app.utils.cache import ReportCache, AppCache, get_app_cache, get_report_cache
except ImportError:
    ReportCache = None
    AppCache = None
    get_app_cache = None
    get_report_cache = None


class TestVoucherCodeGenerator:
    """Test VoucherCodeGenerator utility"""

    def test_generate_voucher_code_returns_string(self):
        """Test that generate_voucher_code returns a string"""
        code = generate_voucher_code()
        assert isinstance(code, str)

    def test_generate_voucher_code_format(self):
        """Test that generated code has correct format VCH-YYYY-XXXXXX"""
        code = generate_voucher_code()
        parts = code.split("-")
        
        assert len(parts) == 3
        assert parts[0] == "VCH"
        assert len(parts[1]) == 4
        assert parts[1].isdigit()
        assert len(parts[2]) == 6
        assert parts[2].isalnum()

    def test_generate_voucher_code_is_unique(self):
        """Test that generated codes are unique"""
        codes = set()
        for _ in range(100):
            code = generate_voucher_code()
            codes.add(code)
        
        # All codes should be unique
        assert len(codes) == 100

    def test_generate_voucher_code_year_is_current(self):
        """Test that generated code contains current year"""
        code = generate_voucher_code()
        current_year = str(datetime.utcnow().year)
        assert current_year in code

    def test_validate_voucher_code_valid(self):
        """Test validating a valid voucher code"""
        code = generate_voucher_code()
        assert validate_voucher_code(code) is True

    def test_validate_voucher_code_invalid_format(self):
        """Test validating invalid voucher code formats"""
        invalid_codes = [
            "INVALID",
            "VCH-2026",
            "VCH-2026-",
            "VCH-XXXX-XXXXXX",
            "VCH-2026-XXXXX",  # Too short
            "VCH-2026-XXXXXXX",  # Too long
            "",
            None,
        ]
        
        for code in invalid_codes:
            if code is not None:
                assert validate_voucher_code(code) is False

    def test_validate_voucher_code_empty(self):
        """Test validating empty voucher code"""
        assert validate_voucher_code("") is False


class TestBankValidator:
    """Test BankValidator utility"""

    def test_validate_account_number_valid(self):
        """Test validating a valid bank account number"""
        is_valid, error = BankValidator.validate_account_number("1234567890")
        assert is_valid is True
        assert error is None

    def test_validate_account_number_invalid_empty(self):
        """Test validating empty bank account number"""
        is_valid, error = BankValidator.validate_account_number("")
        assert is_valid is False
        assert error is not None

    def test_validate_account_number_invalid_non_numeric(self):
        """Test validating non-numeric account number"""
        is_valid, error = BankValidator.validate_account_number("abc123")
        assert is_valid is False
        assert "digits" in error.lower()

    def test_validate_account_number_too_short(self):
        """Test validating account number that's too short"""
        is_valid, error = BankValidator.validate_account_number("123")
        assert is_valid is False
        assert "short" in error.lower()

    def test_validate_account_number_too_long(self):
        """Test validating account number that's too long"""
        is_valid, error = BankValidator.validate_account_number("12345678901234567")
        assert is_valid is False
        assert "long" in error.lower()

    def test_validate_account_number_with_bank_bca(self):
        """Test validating BCA account number"""
        # BCA: 10-16 digits
        is_valid, error = BankValidator.validate_account_number("1234567890", "BCA")
        assert is_valid is True

    def test_validate_account_number_with_bank_mandiri(self):
        """Test validating Mandiri account number"""
        # Mandiri: 13-16 digits
        is_valid, error = BankValidator.validate_account_number("1234567890123", "MANDIRI")
        assert is_valid is True

    def test_validate_account_number_with_bank_bri(self):
        """Test validating BRI account number"""
        # BRI: exactly 15 digits
        is_valid, error = BankValidator.validate_account_number("123456789012345", "BRI")
        assert is_valid is True

    def test_validate_account_holder_name_valid(self):
        """Test validating a valid account holder name"""
        is_valid, error = BankValidator.validate_account_holder_name("John Doe")
        assert is_valid is True
        assert error is None

    def test_validate_account_holder_name_empty(self):
        """Test validating empty account holder name"""
        is_valid, error = BankValidator.validate_account_holder_name("")
        assert is_valid is False
        assert error is not None

    def test_validate_account_holder_name_too_short(self):
        """Test validating account holder name that's too short"""
        is_valid, error = BankValidator.validate_account_holder_name("Jo")
        assert is_valid is False
        assert "short" in error.lower()

    def test_validate_account_holder_name_too_long(self):
        """Test validating account holder name that's too long"""
        long_name = "A" * 256
        is_valid, error = BankValidator.validate_account_holder_name(long_name)
        assert is_valid is False
        assert "long" in error.lower()

    def test_validate_account_holder_name_with_special_chars(self):
        """Test validating account holder name with special characters"""
        is_valid, error = BankValidator.validate_account_holder_name("John O'Brien-Smith")
        assert is_valid is True

    def test_validate_bank_name_valid(self):
        """Test validating a valid bank name"""
        for bank in ["BCA", "MANDIRI", "BRI", "BNI", "CIMB"]:
            is_valid, error = BankValidator.validate_bank_name(bank)
            assert is_valid is True

    def test_validate_bank_name_empty(self):
        """Test validating empty bank name"""
        is_valid, error = BankValidator.validate_bank_name("")
        assert is_valid is False
        assert error is not None

    def test_validate_bank_name_unsupported(self):
        """Test validating unsupported bank name"""
        is_valid, error = BankValidator.validate_bank_name("UNKNOWN_BANK")
        # Should return True but with warning (allows unknown banks)
        assert is_valid is True

    def test_validate_payout_fields_all_valid(self):
        """Test validating all payout fields together"""
        errors = BankValidator.validate_payout_fields(
            bank_name="BCA",
            account_number="1234567890",
            account_holder_name="John Doe"
        )
        assert len(errors) == 0

    def test_validate_payout_fields_with_errors(self):
        """Test validating payout fields with errors"""
        errors = BankValidator.validate_payout_fields(
            bank_name="",
            account_number="123",
            account_holder_name="Jo"
        )
        assert len(errors) > 0
        assert "bank_name" in errors
        assert "account_number" in errors
        assert "account_holder_name" in errors

    def test_sanitize_account_number(self):
        """Test sanitizing account number"""
        dirty_account = "1234-5678-90"
        clean_account = BankValidator.sanitize_account_number(dirty_account)
        assert clean_account == "123456789"

    def test_get_supported_banks(self):
        """Test getting list of supported banks"""
        banks = BankValidator.get_supported_banks()
        assert isinstance(banks, dict)
        assert "BCA" in banks
        assert "MANDIRI" in banks
        assert "BRI" in banks

    def test_validate_bank_account_function(self):
        """Test validate_bank_account function"""
        is_valid, errors = validate_bank_account(
            bank_name="BCA",
            account_number="1234567890",
            account_holder_name="John Doe"
        )
        assert is_valid is True
        assert len(errors) == 0


class TestReportCache:
    """Test ReportCache utility"""

    def test_cache_set_and_get(self):
        """Test setting and getting cache value"""
        cache = ReportCache()
        value = {"data": "test_value"}
        
        cache.set("impact_report", value, user_id="123")
        result = cache.get("impact_report", user_id="123")
        
        assert result == value

    def test_cache_get_nonexistent_key(self):
        """Test getting non-existent cache key"""
        cache = ReportCache()
        result = cache.get("nonexistent_report")
        assert result is None

    def test_cache_invalidate(self):
        """Test invalidating cache value"""
        cache = ReportCache()
        cache.set("impact_report", {"data": "value"})
        
        result = cache.invalidate("impact_report")
        assert result is True
        
        result = cache.get("impact_report")
        assert result is None

    def test_cache_invalidate_nonexistent(self):
        """Test invalidating non-existent cache key"""
        cache = ReportCache()
        result = cache.invalidate("nonexistent_report")
        assert result is False

    def test_cache_invalidate_all(self):
        """Test clearing all cache"""
        cache = ReportCache()
        cache.set("report1", {"data": "value1"})
        cache.set("report2", {"data": "value2"})
        cache.invalidate_all()
        
        assert cache.get("report1") is None
        assert cache.get("report2") is None

    def test_cache_expiration(self):
        """Test cache expiration"""
        cache = ReportCache()
        value = {"data": "expiring_value"}
        
        # Set with 1 second expiration
        cache.set("expiring_report", value, ttl_seconds=1)
        
        # Should exist immediately
        assert cache.get("expiring_report") == value
        
        # After expiration, should be None
        time.sleep(1.1)
        assert cache.get("expiring_report") is None

    def test_cache_with_complex_objects(self):
        """Test caching complex objects"""
        cache = ReportCache()
        obj = {
            "id": str(uuid4()),
            "name": "Test Report",
            "timestamp": datetime.utcnow().isoformat(),
            "data": [1, 2, 3, 4, 5]
        }
        
        cache.set("complex_report", obj)
        result = cache.get("complex_report")
        
        assert result == obj
        assert result["name"] == "Test Report"

    def test_cache_invalidate_pattern(self):
        """Test invalidating cache by pattern"""
        cache = ReportCache()
        cache.set("impact_report", {"data": "value1"}, user_id="123")
        cache.set("impact_report", {"data": "value2"}, user_id="456")
        cache.set("donation_report", {"data": "value3"})
        
        # Invalidate all impact reports
        count = cache.invalidate_pattern("impact_report:*")
        assert count == 2
        
        # Impact reports should be gone
        assert cache.get("impact_report", user_id="123") is None
        assert cache.get("impact_report", user_id="456") is None
        
        # Donation report should still exist
        assert cache.get("donation_report") is not None

    def test_cache_get_stats(self):
        """Test getting cache statistics"""
        cache = ReportCache()
        cache.set("report1", {"data": "value1"})
        cache.set("report2", {"data": "value2"})
        
        stats = cache.get_stats()
        assert stats["total_entries"] == 2
        assert stats["active_entries"] == 2
        assert stats["expired_entries"] == 0

    def test_cache_default_ttl(self):
        """Test cache with default TTL"""
        cache = ReportCache(default_ttl_seconds=2)
        cache.set("report", {"data": "value"})
        
        # Should exist immediately
        assert cache.get("report") is not None
        
        # After default TTL, should be expired
        time.sleep(2.1)
        assert cache.get("report") is None


class TestAppCache:
    """Test AppCache utility with namespace support"""

    def test_app_cache_set_and_get(self):
        """Test setting and getting cache value with namespace"""
        cache = AppCache()
        value = {"user": "john"}
        
        cache.set("auth", "user_data", value, user_id="123")
        result = cache.get("auth", "user_data", user_id="123")
        
        assert result == value

    def test_app_cache_different_namespaces(self):
        """Test cache isolation between namespaces"""
        cache = AppCache()
        
        cache.set("auth", "token", "token123")
        cache.set("stats", "token", "stats_data")
        
        auth_result = cache.get("auth", "token")
        stats_result = cache.get("stats", "token")
        
        assert auth_result == "token123"
        assert stats_result == "stats_data"

    def test_app_cache_invalidate_namespace(self):
        """Test invalidating entire namespace"""
        cache = AppCache()
        
        cache.set("auth", "token", "token123")
        cache.set("auth", "user", "user_data")
        cache.set("stats", "data", "stats_data")
        
        # Invalidate auth namespace
        count = cache.invalidate_namespace("auth")
        assert count == 2
        
        # Auth cache should be gone
        assert cache.get("auth", "token") is None
        assert cache.get("auth", "user") is None
        
        # Stats cache should still exist
        assert cache.get("stats", "data") is not None

    def test_get_app_cache_singleton(self):
        """Test that get_app_cache returns singleton instance"""
        cache1 = get_app_cache()
        cache2 = get_app_cache()
        
        assert cache1 is cache2

    def test_get_report_cache_singleton(self):
        """Test that get_report_cache returns singleton instance"""
        cache1 = get_report_cache()
        cache2 = get_report_cache()
        
        assert cache1 is cache2
