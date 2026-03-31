"""
Voucher Code Generator
Utility for generating unique voucher codes
"""
import uuid
from datetime import datetime


def generate_voucher_code() -> str:
    """
    Generate unique voucher code
    
    Format: VCH-YYYY-XXXXXX
    Example: VCH-2026-A1B2C3
    
    Returns:
        str: Generated voucher code
    """
    year = datetime.utcnow().year
    random_part = uuid.uuid4().hex[:6].upper()
    return f"VCH-{year}-{random_part}"


def validate_voucher_code(code: str) -> bool:
    """
    Validate voucher code format
    
    Args:
        code: Voucher code to validate
        
    Returns:
        bool: True if valid format
    """
    if not code:
        return False
    
    # Basic format check: VCH-YYYY-XXXXXX
    parts = code.split("-")
    
    if len(parts) != 3:
        return False
    
    if parts[0] != "VCH":
        return False
    
    if len(parts[1]) != 4 or not parts[1].isdigit():
        return False
    
    if len(parts[2]) != 6:
        return False
    
    return True
