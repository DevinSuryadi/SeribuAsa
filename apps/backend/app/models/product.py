"""
Product and Order Models
- Category: Product categories
- Product: Product catalog
"""
from sqlalchemy import Column, String, Text, Integer, Numeric, ForeignKey, Index, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
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
