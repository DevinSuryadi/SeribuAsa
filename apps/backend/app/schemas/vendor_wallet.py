"""
Vendor wallet schemas.
"""
from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class WithdrawalAmountRequest(BaseModel):
    amount: Decimal = Field(gt=0, decimal_places=2)


class QrWithdrawalRedeemRequest(BaseModel):
    qr_payload: str = Field(min_length=1, max_length=255)


class VendorWalletBalanceResponse(BaseModel):
    balance: Decimal = Field(ge=0, decimal_places=2)
    bank_name: Optional[str] = Field(default=None, max_length=100)
    bank_account_number: Optional[str] = Field(default=None, max_length=50)
    bank_account_holder: Optional[str] = Field(default=None, max_length=255)
    pending_withdrawals: Decimal = Field(default=Decimal("0"), ge=0, decimal_places=2)
    minimum_withdrawal_amount: Decimal = Field(ge=0, decimal_places=2)


class WithdrawalResponse(BaseModel):
    id: UUID
    amount: Decimal = Field(ge=0, decimal_places=2)
    status: Literal["pending", "processing", "completed", "failed", "cancelled"]
    withdrawal_method: Literal["bank", "qr"]
    bank_name: Optional[str] = Field(default=None, max_length=100)
    bank_account_number: Optional[str] = Field(default=None, max_length=50)
    bank_account_holder: Optional[str] = Field(default=None, max_length=255)
    transfer_reference: Optional[str] = Field(default=None, max_length=255)
    qr_payload: Optional[str] = Field(default=None, max_length=255)
    qr_expires_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WithdrawalHistoryResponse(BaseModel):
    items: list[WithdrawalResponse] = Field(default_factory=list)
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
    total_pages: int = Field(ge=0)
