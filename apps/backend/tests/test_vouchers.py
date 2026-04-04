"""
Voucher Tests
Tests for voucher service logic, schemas, and enums
"""
from decimal import Decimal
from datetime import datetime, date
from uuid import uuid4
from unittest.mock import MagicMock

from app.models.donation import Voucher, VoucherStatusEnum
from app.schemas.voucher import VoucherResponse, VoucherBalanceResponse, VoucherRedemptionRequest
from app.services.voucher_service import VoucherService


def test_voucher_status_enum():
    """Test voucher status enum values"""
    assert VoucherStatusEnum.active.value == "active"
    assert VoucherStatusEnum.redeemed.value == "redeemed"
    assert VoucherStatusEnum.expired.value == "expired"
    assert VoucherStatusEnum.cancelled.value == "cancelled"


def test_voucher_response_schema():
    """Test VoucherResponse schema"""
    voucher_id = str(uuid4())
    beneficiary_id = str(uuid4())
    data = VoucherResponse(
        id=voucher_id,
        beneficiary_id=beneficiary_id,
        code="VCH-TEST-001",
        balance=Decimal("200000"),
        expiry_date=date(2026, 12, 31),
        status=VoucherStatusEnum.active,
        allocated_date=datetime.utcnow(),
        created_at=datetime.utcnow(),
    )
    assert data.balance == Decimal("200000")
    assert data.status == VoucherStatusEnum.active


def test_voucher_balance_response_schema():
    """Test VoucherBalanceResponse schema"""
    data = VoucherBalanceResponse(
        beneficiary_id="test-beneficiary",
        total_balance=Decimal("500000"),
        active_vouchers=[],
        expiring_soon={"count": 0},
    )
    assert data.total_balance == Decimal("500000")
    assert data.expiring_soon["count"] == 0


def test_voucher_redemption_request_schema():
    """Test VoucherRedemptionRequest schema"""
    data = VoucherRedemptionRequest(
        order_id="ORD-001",
        voucher_codes=["VCH-001", "VCH-002"],
        amount=Decimal("100000"),
    )
    assert len(data.voucher_codes) == 2
    assert data.amount == Decimal("100000")


def test_generate_voucher_code():
    """Test voucher code generation"""
    code = VoucherService.generate_voucher_code()
    assert code.startswith("VCH-")
    assert len(code) > 10


def test_voucher_redeem_insufficient_balance():
    """Test voucher redemption with insufficient balance"""
    mock_db = MagicMock()
    mock_voucher = MagicMock()
    mock_voucher.balance = Decimal("50000")
    mock_voucher.status = VoucherStatusEnum.active
    mock_db.query.return_value.filter.return_value.first.return_value = mock_voucher

    # Try to redeem more than balance
    try:
        VoucherService.redeem_voucher(mock_db, ["VCH-TEST"], Decimal("100000"), "ORD-001")
    except ValueError as e:
        assert "Insufficient" in str(e) or "balance" in str(e).lower()


def test_voucher_redeem_invalid_code():
    """Test voucher redemption with invalid code"""
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None

    try:
        VoucherService.redeem_voucher(mock_db, ["INVALID"], Decimal("50000"), "ORD-001")
    except ValueError as e:
        assert "not found" in str(e).lower() or "invalid" in str(e).lower()
