"""
Cart Models
- CartItem: Shopping cart items for beneficiaries
- VoucherTransaction: Transaction history for vouchers
- VoucherLock: Prevent double-spending during redemption
"""
from sqlalchemy import Column, Integer, Numeric, ForeignKey, Index, Uuid as UUID, DateTime, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from app.models.base import BaseModel


# Enum for transaction types
class VoucherTransactionTypeEnum(str, enum.Enum):
    allocated = "allocated"
    redeemed = "redeemed"
    expired = "expired"
    adjusted = "adjusted"
    revoked = "revoked"


# ============================================
# CartItem - Shopping cart items
# ============================================
class CartItem(BaseModel):
    __tablename__ = "cart_items"
    
    # Foreign keys
    beneficiary_id = Column(UUID(as_uuid=True), ForeignKey("beneficiary_profiles.user_id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Cart item details
    quantity = Column(Integer, nullable=False, default=1)
    
    # Relationships
    beneficiary_profile = relationship("BeneficiaryProfile", back_populates="cart_items")
    product = relationship("Product", back_populates="cart_items")
    
    def __repr__(self):
        return f"<CartItem {self.product_id} - Qty: {self.quantity}>"
    
    # Unique index to prevent duplicate items in cart
    __table_args__ = (
        Index("idx_cart_beneficiary_product", "beneficiary_id", "product_id", unique=True),
    )


# ============================================
# VoucherTransaction - Transaction history
# ============================================
class VoucherTransaction(BaseModel):
    __tablename__ = "voucher_transactions"
    
    # Foreign keys
    voucher_id = Column(UUID(as_uuid=True), ForeignKey("vouchers.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Transaction details
    transaction_type = Column(Enum(VoucherTransactionTypeEnum), nullable=False, index=True)
    amount = Column(Numeric(15, 2), nullable=False)
    
    # Relationships
    voucher = relationship("Voucher", back_populates="transactions")
    order = relationship("Order", back_populates="voucher_transactions")
    
    def __repr__(self):
        return f"<VoucherTransaction {self.id} - {self.transaction_type}: {self.amount}>"
    
    __table_args__ = (
        Index("idx_voucher_transaction_type", "voucher_id", "transaction_type"),
    )


# ============================================
# VoucherLock - Prevent double-spending
# ============================================
class VoucherLock(BaseModel):
    __tablename__ = "voucher_locks"
    
    # Foreign keys
    voucher_id = Column(UUID(as_uuid=True), ForeignKey("vouchers.id", ondelete="CASCADE"), nullable=False, index=True, unique=True)
    
    # Lock details
    locked_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    
    # Relationships
    voucher = relationship("Voucher", back_populates="lock")
    
    def __repr__(self):
        return f"<VoucherLock {self.voucher_id}>"
    
    def is_expired(self) -> bool:
        """Check if lock has expired"""
        return datetime.utcnow() > self.expires_at


# ============================================
# VoucherAllowedCategory - Allowed categories for voucher
# ============================================
class VoucherAllowedCategory(BaseModel):
    __tablename__ = "voucher_allowed_categories"
    
    # Foreign keys
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Category details
    is_allowed = Column(Integer, default=1, nullable=False)  # 1 = allowed, 0 = not allowed
    
    # Relationships
    category = relationship("Category", back_populates="voucher_allowed_categories")
    
    def __repr__(self):
        return f"<VoucherAllowedCategory {self.category_id}>"
    
    __table_args__ = (
        Index("idx_allowed_category", "category_id", "is_allowed"),
    )


# ============================================
# Indexes for performance
# ============================================
Index("idx_cart_beneficiary_created", CartItem.beneficiary_id, CartItem.created_at)
Index("idx_voucher_transaction_created", VoucherTransaction.voucher_id, VoucherTransaction.created_at)
Index("idx_voucher_lock_expires", VoucherLock.expires_at)
