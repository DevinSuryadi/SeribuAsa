"""
Wallet Models
- WalletAllocation: Tracks each donation allocation with FIFO expiry (replaces Voucher)
- WalletTransaction: Audit trail for all wallet balance movements
"""
from sqlalchemy import Column, String, Text, DateTime, Numeric, ForeignKey, Index, Uuid as UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import BaseModel


# ============================================
# WalletAllocation - Per-donation allocation with expiry
# ============================================
class WalletAllocation(BaseModel):
    """
    Each successful donation allocation creates one WalletAllocation record.
    Spending is deducted FIFO (oldest expires_at first).
    Balance expires if not spent within 3 months.
    """
    __tablename__ = "wallet_allocations"

    # Foreign keys
    beneficiary_id = Column(
        UUID(as_uuid=True),
        ForeignKey("beneficiary_profiles.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    donation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("donations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Amount tracking
    original_amount  = Column(Numeric(15, 2), nullable=False)   # amount at allocation time
    remaining_amount = Column(Numeric(15, 2), nullable=False)   # decreases as spent (FIFO)

    # Lifecycle
    allocated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at   = Column(DateTime, nullable=False, index=True)  # +90 days from allocated_at

    # Status: active | depleted | expired
    status = Column(String(20), default="active", nullable=False, index=True)

    # Relationships
    beneficiary_profile = relationship("BeneficiaryProfile", back_populates="wallet_allocations")
    donation            = relationship("Donation", back_populates="wallet_allocations")
    wallet_transactions = relationship("WalletTransaction", back_populates="allocation", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<WalletAllocation {self.id} – {self.remaining_amount}/{self.original_amount} expires {self.expires_at}>"

    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at

    def is_available(self) -> bool:
        return self.status == "active" and not self.is_expired() and self.remaining_amount > 0


# ============================================
# WalletTransaction - Full audit trail
# ============================================
class WalletTransaction(BaseModel):
    """
    Records every movement of wallet balance.
    Types:
      credit  – allocation from donation
      hold    – locked when order is placed
      unhold  – released when order is cancelled
      debit   – permanently deducted when order completed
      expired – deducted when allocation expires (cron)
    """
    __tablename__ = "wallet_transactions"

    # Foreign keys
    beneficiary_id = Column(
        UUID(as_uuid=True),
        ForeignKey("beneficiary_profiles.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    order_id = Column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    allocation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("wallet_allocations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Transaction details
    transaction_type = Column(String(20), nullable=False, index=True)
    # credit | hold | unhold | debit | expired
    amount       = Column(Numeric(15, 2), nullable=False)
    balance_after = Column(Numeric(15, 2), nullable=True)  # wallet_balance after this tx
    description  = Column(Text, nullable=True)

    # Relationships
    beneficiary_profile = relationship("BeneficiaryProfile", back_populates="wallet_transactions")
    order               = relationship("Order", back_populates="wallet_transactions")
    allocation          = relationship("WalletAllocation", back_populates="wallet_transactions")

    def __repr__(self):
        return f"<WalletTransaction {self.transaction_type} {self.amount}>"


# ============================================
# Indexes for performance
# ============================================
Index("idx_wallet_allocation_beneficiary_status", WalletAllocation.beneficiary_id, WalletAllocation.status)
Index("idx_wallet_allocation_expires",            WalletAllocation.expires_at)
Index("idx_wallet_tx_beneficiary_created",        WalletTransaction.beneficiary_id, WalletTransaction.created_at)
Index("idx_wallet_tx_order",                      WalletTransaction.order_id)
