from decimal import Decimal

import pytest

from app.api.vendor_wallet import (
    QR_WITHDRAWAL_PREFIX,
    _build_qr_payload,
    _build_qr_reference,
    _extract_qr_reference,
)
from app.schemas.vendor_wallet import (
    QrWithdrawalRedeemRequest,
    VendorWalletBalanceResponse,
    WithdrawalAmountRequest,
)


def test_build_qr_reference_uses_vendor_prefix():
    reference = _build_qr_reference()
    assert reference.startswith(QR_WITHDRAWAL_PREFIX)


def test_qr_payload_roundtrip_returns_reference():
    reference = f"{QR_WITHDRAWAL_PREFIX}20260504010101-ABC123"
    payload = _build_qr_payload(reference)

    assert _extract_qr_reference(payload) == reference


def test_extract_qr_reference_accepts_raw_reference():
    reference = f"{QR_WITHDRAWAL_PREFIX}20260504010101-XYZ789"
    assert _extract_qr_reference(reference) == reference


def test_withdrawal_amount_request_rejects_zero():
    with pytest.raises(ValueError):
        WithdrawalAmountRequest(amount=Decimal("0"))


def test_qr_withdrawal_redeem_request_requires_payload():
    with pytest.raises(ValueError):
        QrWithdrawalRedeemRequest(qr_payload="")


def test_vendor_wallet_balance_response_supports_pending_withdrawals():
    response = VendorWalletBalanceResponse(
        balance=Decimal("250000"),
        pending_withdrawals=Decimal("100000"),
        minimum_withdrawal_amount=Decimal("50000"),
    )

    assert response.balance == Decimal("250000")
    assert response.pending_withdrawals == Decimal("100000")
