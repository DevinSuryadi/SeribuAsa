"""
Bank Account Validation Utility
Validate bank account information for settlements
"""
import re
import logging
from typing import Dict, Tuple, Optional

logger = logging.getLogger(__name__)


class BankValidator:
    """Validate bank account information"""
    
    # Indonesian bank codes and account number lengths
    SUPPORTED_BANKS = {
        "BCA": {"code": "014", "min_length": 10, "max_length": 16},
        "MANDIRI": {"code": "008", "min_length": 13, "max_length": 16},
        "BRI": {"code": "002", "min_length": 15, "max_length": 15},
        "BNI": {"code": "009", "min_length": 12, "max_length": 12},
        "CIMB": {"code": "022", "min_length": 10, "max_length": 16},
        "OCBC": {"code": "028", "min_length": 12, "max_length": 16},
        "AMBANK": {"code": "023", "min_length": 16, "max_length": 16},
    }
    
    @staticmethod
    def validate_account_number(
        account_number: str,
        bank_name: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate bank account number
        
        Args:
            account_number: Account number to validate
            bank_name: Bank name (optional, for stricter validation)
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Basic checks
        if not account_number:
            return False, "Account number is required"
        
        account_number = account_number.strip()
        
        # Check if numeric
        if not account_number.isdigit():
            return False, "Account number must contain only digits"
        
        # Check length (general)
        if len(account_number) < 10:
            return False, "Account number too short (minimum 10 digits)"
        
        if len(account_number) > 16:
            return False, "Account number too long (maximum 16 digits)"
        
        # Bank-specific validation
        if bank_name:
            bank_name_upper = bank_name.upper().strip()
            
            if bank_name_upper not in BankValidator.SUPPORTED_BANKS:
                logger.warning(f"Unsupported bank: {bank_name}")
                return True, None  # Warn but allow
            
            bank_info = BankValidator.SUPPORTED_BANKS[bank_name_upper]
            
            min_len = bank_info.get("min_length", 10)
            max_len = bank_info.get("max_length", 16)
            
            if len(account_number) < min_len or len(account_number) > max_len:
                return False, f"Invalid account number length for {bank_name} ({min_len}-{max_len} digits)"
        
        return True, None
    
    @staticmethod
    def validate_account_holder_name(name: str) -> Tuple[bool, Optional[str]]:
        """
        Validate account holder name
        
        Args:
            name: Account holder name
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not name:
            return False, "Account holder name is required"
        
        name = name.strip()
        
        if len(name) < 3:
            return False, "Account holder name too short (minimum 3 characters)"
        
        if len(name) > 255:
            return False, "Account holder name too long (maximum 255 characters)"
        
        # Allow letters, spaces, and common special characters
        if not re.match(r"^[a-zA-Z\s\.\-\'\s]+$", name):
            return False, "Account holder name contains invalid characters"
        
        return True, None
    
    @staticmethod
    def validate_bank_name(bank_name: str) -> Tuple[bool, Optional[str]]:
        """
        Validate bank name
        
        Args:
            bank_name: Bank name
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not bank_name:
            return False, "Bank name is required"
        
        bank_name = bank_name.strip().upper()
        
        if bank_name not in BankValidator.SUPPORTED_BANKS:
            supported = ", ".join(BankValidator.SUPPORTED_BANKS.keys())
            logger.warning(f"Unsupported bank: {bank_name}. Supported: {supported}")
            return True, None  # Warn but allow unknown banks
        
        return True, None
    
    @staticmethod
    def validate_payout_fields(
        bank_name: str,
        account_number: str,
        account_holder_name: str
    ) -> Dict[str, str]:
        """
        Validate all payout fields together
        
        Args:
            bank_name: Bank name
            account_number: Account number
            account_holder_name: Account holder name
        
        Returns:
            Dictionary of field -> error_message (empty if all valid)
        """
        errors = {}
        
        # Validate each field
        is_valid, error = BankValidator.validate_bank_name(bank_name)
        if not is_valid:
            errors["bank_name"] = error
        
        is_valid, error = BankValidator.validate_account_number(account_number, bank_name)
        if not is_valid:
            errors["account_number"] = error
        
        is_valid, error = BankValidator.validate_account_holder_name(account_holder_name)
        if not is_valid:
            errors["account_holder_name"] = error
        
        return errors
    
    @staticmethod
    def get_supported_banks() -> Dict[str, Dict]:
        """Get list of supported banks"""
        return BankValidator.SUPPORTED_BANKS
    
    @staticmethod
    def sanitize_account_number(account_number: str) -> str:
        """
        Sanitize account number (remove spaces, dashes, etc.)
        
        Args:
            account_number: Account number
        
        Returns:
            Sanitized account number
        """
        return re.sub(r"[^\d]", "", account_number)


def validate_bank_account(
    bank_name: str,
    account_number: str,
    account_holder_name: str
) -> Tuple[bool, Dict[str, str]]:
    """
    Validate complete bank account information
    
    Args:
        bank_name: Bank name
        account_number: Account number
        account_holder_name: Account holder name
    
    Returns:
        Tuple of (is_valid, errors_dict)
    """
    errors = BankValidator.validate_payout_fields(
        bank_name,
        account_number,
        account_holder_name
    )
    
    return len(errors) == 0, errors
