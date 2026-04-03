"""
Product and Order Models
- Category: Product categories
- Product: Product catalog
- Order: Orders from beneficiaries
- OrderItem: Order line items
"""
from sqlalchemy import Column, String, Text, Integer, Numeric, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel


# Enum for order status
class OrderStatusEnum(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    cancelled = "cancelled"


# Enum for payment status
class PaymentStatusEnum(str, enum.Enum):
    pending = "pending"
    partial = "partial"
    paid = "paid"
    refunded = "refunded"


# ============================================
# Category - Product categories
# ============================================
class Category(BaseModel):
    __tablename__ = "categories"
    
    # Category details
    name = Column(String(100), nullable=False, unique=True, index=True)
    slug = Column(String(100), unique=True, index=True)
    description = Column(Text)
    icon_url = Column(String(500))
    display_order = Column(Integer, default=0)
    
    # Relationship
    products = relationship("Product", back_populates="category")
    
    def __repr__(self):
        return f"<Category {self.name}>"


# ============================================
# Product - Product catalog
# ============================================
class Product(BaseModel):
    __tablename__ = "products"
    
    # Foreign keys
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendor_profiles.user_id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Product details
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    price = Column(Numeric(15, 2), nullable=False)
    voucher_price = Column(Numeric(15, 2), nullable=False)  # Price in voucher credits
    stock_quantity = Column(Integer, default=0)
    unit = Column(String(50), default="pcs")  # pcs, kg, liter, etc.
    
    # Product images (stored as JSON array)
    images = Column(JSONB, default=list)
    
    # Approval status
    approval_status = Column(String(50), default="pending", index=True)  # pending, approved, rejected
    
    # Relationship
    category = relationship("Category", back_populates="products")
    vendor_profile = relationship("VendorProfile", back_populates="products")
    
    def __repr__(self):
        return f"<Product {self.name} - {self.price}>"
    
    def is_in_stock(self) -> bool:
        """Check if product is in stock"""
        return self.stock_quantity > 0 and self.is_active


# ============================================
# Order - Orders from beneficiaries
# ============================================
class Order(BaseModel):
    __tablename__ = "orders"
    
    # Foreign keys
    beneficiary_id = Column(UUID(as_uuid=True), ForeignKey("beneficiary_profiles.user_id", ondelete="CASCADE"), nullable=False, index=True)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendor_profiles.user_id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Order details
    total_amount = Column(Numeric(15, 2), nullable=False)
    voucher_used = Column(Numeric(15, 2), default=0)
    cash_paid = Column(Numeric(15, 2), default=0)
    
    # Status
    status = Column(String(50), nullable=False, default=OrderStatusEnum.pending, index=True)
    payment_status = Column(String(50), default=PaymentStatusEnum.pending)
    
    # Notes
    notes = Column(Text)
    
    # Relationships
    beneficiary_profile = relationship("BeneficiaryProfile", foreign_keys=[beneficiary_id], back_populates="orders")
    vendor_profile = relationship("VendorProfile", foreign_keys=[vendor_id], back_populates="orders")
    
    # Order items
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    
    # Voucher redemptions
    voucher_redemptions = relationship("VoucherRedemption", back_populates="order", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Order {self.id} - {self.total_amount} ({self.status})>"
    
    def calculate_total(self) -> Numeric:
        """Calculate total from order items"""
        return sum(item.subtotal for item in self.items) if self.items else 0


# ============================================
# OrderItem - Order line items
# ============================================
class OrderItem(BaseModel):
    __tablename__ = "order_items"
    
    # Foreign keys
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Item details
    quantity = Column(Integer, nullable=False)
    price = Column(Numeric(15, 2), nullable=False)  # Price at time of order
    subtotal = Column(Numeric(15, 2), nullable=False)
    
    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    
    def __repr__(self):
        return f"<OrderItem {self.quantity}x {self.product.name}>"
    
    def calculate_subtotal(self) -> Numeric:
        """Calculate subtotal from quantity and price"""
        return self.quantity * self.price


# ============================================
# Indexes for performance
# ============================================
Index("idx_product_vendor_category", Product.vendor_id, Product.category_id)
Index("idx_product_name_vendor", Product.name, Product.vendor_id)
Index("idx_order_beneficiary_vendor", Order.beneficiary_id, Order.vendor_id)
Index("idx_order_status_created", Order.status, Order.created_at)
