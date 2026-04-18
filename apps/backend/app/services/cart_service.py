"""
Cart Service
Business logic for shopping cart management
"""
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from decimal import Decimal
import logging
from uuid import UUID

from app.models.cart import CartItem
from app.models.product import Product
from app.models.user import BeneficiaryProfile

logger = logging.getLogger(__name__)


class CartService:
    """Service for cart operations"""
    
    @staticmethod
    def _to_uuid(value: Optional[str | UUID]) -> Optional[UUID]:
        """Normalize incoming ID values to UUID"""
        if value is None:
            return None
        if isinstance(value, UUID):
            return value
        return UUID(str(value))
    
    @staticmethod
    def add_to_cart(
        db: Session,
        beneficiary_id: str,
        product_id: str,
        quantity: int
    ) -> CartItem:
        """Add product to cart or update quantity if exists"""
        beneficiary_uuid = CartService._to_uuid(beneficiary_id)
        product_uuid = CartService._to_uuid(product_id)
        
        # Validate input
        if quantity < 1 or quantity > 100:
            raise ValueError("Quantity must be between 1 and 100")
        
        # Check product exists and is in stock
        product = db.query(Product).filter(
            Product.id == product_uuid,
            Product.is_active
        ).first()
        
        if not product:
            raise ValueError("Product not found")
        
        if product.stock_quantity < quantity:
            raise ValueError(f"Not enough stock. Available: {product.stock_quantity}")
        
        # Check if beneficiary has too many items in cart
        cart_count = db.query(CartItem).filter(
            CartItem.beneficiary_id == beneficiary_uuid,
            CartItem.is_active
        ).count()
        
        # Check if product already in cart
        existing_item = db.query(CartItem).filter(
            CartItem.beneficiary_id == beneficiary_uuid,
            CartItem.product_id == product_uuid,
            CartItem.is_active
        ).first()
        
        if existing_item:
            # Update quantity
            new_quantity = existing_item.quantity + quantity
            if new_quantity > 100:
                raise ValueError("Max quantity for this product is 100")
            
            existing_item.quantity = new_quantity
            db.commit()
            db.refresh(existing_item)
            
            logger.info(f"Updated cart item for beneficiary {beneficiary_id}: product {product_id}, qty {new_quantity}")
            return existing_item
        else:
            # Check cart size limit (50 different products)
            if cart_count >= 50:
                raise ValueError("Cart is full (max 50 different products)")
            
            # Create new cart item
            cart_item = CartItem(
                beneficiary_id=beneficiary_uuid,
                product_id=product_uuid,
                quantity=quantity
            )
            db.add(cart_item)
            db.commit()
            db.refresh(cart_item)
            
            logger.info(f"Added to cart for beneficiary {beneficiary_id}: product {product_id}, qty {quantity}")
            return cart_item
    
    @staticmethod
    def get_cart(
        db: Session,
        beneficiary_id: str
    ) -> List[Dict[str, Any]]:
        """Get all items in cart for beneficiary"""
        beneficiary_uuid = CartService._to_uuid(beneficiary_id)
        
        items = db.query(CartItem).filter(
            CartItem.beneficiary_id == beneficiary_uuid,
            CartItem.is_active
        ).all()
        
        cart_items = []
        for item in items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                cart_items.append({
                    "id": str(item.id),
                    "product_id": str(item.product_id),
                    "product_name": product.name,
                    "product_price": float(product.price),
                    "product_voucher_price": float(product.voucher_price),
                    "quantity": item.quantity,
                    "subtotal": float(product.price * item.quantity),
                    "voucher_eligible_subtotal": float(product.voucher_price * item.quantity),
                    "category_id": str(product.category_id) if product.category_id else None
                })
        
        return cart_items
    
    @staticmethod
    def update_quantity(
        db: Session,
        cart_item_id: str,
        quantity: int
    ) -> CartItem:
        """Update quantity of cart item"""
        cart_item_uuid = CartService._to_uuid(cart_item_id)
        
        # Validate quantity
        if quantity < 1 or quantity > 100:
            raise ValueError("Quantity must be between 1 and 100")
        
        # Get cart item
        cart_item = db.query(CartItem).filter(
            CartItem.id == cart_item_uuid,
            CartItem.is_active
        ).first()
        
        if not cart_item:
            raise ValueError("Cart item not found")
        
        # Check stock
        product = db.query(Product).filter(Product.id == cart_item.product_id).first()
        if not product:
            raise ValueError("Product not found")
        
        if product.stock_quantity < quantity:
            raise ValueError(f"Not enough stock. Available: {product.stock_quantity}")
        
        cart_item.quantity = quantity
        db.commit()
        db.refresh(cart_item)
        
        logger.info(f"Updated cart item {cart_item_id}: qty {quantity}")
        return cart_item
    
    @staticmethod
    def remove_item(
        db: Session,
        cart_item_id: str
    ) -> bool:
        """Remove item from cart (soft delete)"""
        cart_item_uuid = CartService._to_uuid(cart_item_id)
        
        cart_item = db.query(CartItem).filter(
            CartItem.id == cart_item_uuid,
            CartItem.is_active
        ).first()
        
        if not cart_item:
            raise ValueError("Cart item not found")
        
        # Soft delete
        cart_item.is_active = False
        db.commit()
        
        logger.info(f"Removed cart item {cart_item_id}")
        return True
    
    @staticmethod
    def clear_cart(
        db: Session,
        beneficiary_id: str
    ) -> bool:
        """Clear all items from cart"""
        beneficiary_uuid = CartService._to_uuid(beneficiary_id)
        
        items = db.query(CartItem).filter(
            CartItem.beneficiary_id == beneficiary_uuid,
            CartItem.is_active
        ).all()
        
        for item in items:
            item.is_active = False
        
        db.commit()
        
        logger.info(f"Cleared cart for beneficiary {beneficiary_id}")
        return True
    
    @staticmethod
    def get_cart_summary(
        db: Session,
        beneficiary_id: str
    ) -> Dict[str, Any]:
        """Get complete cart summary with totals and voucher calculations"""
        beneficiary_uuid = CartService._to_uuid(beneficiary_id)
        
        items = db.query(CartItem).filter(
            CartItem.beneficiary_id == beneficiary_uuid,
            CartItem.is_active
        ).all()
        
        if not items:
            return {
                "total_items": 0,
                "total_amount": Decimal(0),
                "eligible_amount": Decimal(0),
                "ineligible_amount": Decimal(0),
                "items": []
            }
        
        cart_items = []
        subtotal = Decimal(0)
        eligible_total = Decimal(0)
        ineligible_total = Decimal(0)
        
        for item in items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                logger.warning(f"Product {item.product_id} not found for cart item {item.id}")
                continue
            
            item_subtotal = product.price * item.quantity
            subtotal += item_subtotal
            
            # Determine if product is eligible for voucher
            # (This should check against allowed categories)
            # For now, use voucher_price to determine eligibility
            if product.voucher_price > 0:
                item_eligible = product.voucher_price * item.quantity
                eligible_total += item_eligible
            else:
                ineligible_total += item_subtotal
            
            cart_items.append({
                "id": str(item.id),
                "product_id": str(item.product_id),
                "product_name": product.name,
                "category_id": str(product.category_id) if product.category_id else None,
                "quantity": item.quantity,
                "price": product.price,
                "voucher_price": product.voucher_price,
                "subtotal": item_subtotal,
                "is_eligible": product.voucher_price > 0,
                "created_at": item.created_at,
                "updated_at": item.updated_at
            })
        
        return {
            "total_items": len(cart_items),
            "items": cart_items,
            "total_amount": subtotal,
            "eligible_amount": eligible_total,
            "ineligible_amount": ineligible_total
        }
    
    @staticmethod
    def validate_stock_for_checkout(
        db: Session,
        beneficiary_id: str
    ) -> bool:
        """Validate all cart items still have sufficient stock"""
        beneficiary_uuid = CartService._to_uuid(beneficiary_id)
        
        items = db.query(CartItem).filter(
            CartItem.beneficiary_id == beneficiary_uuid,
            CartItem.is_active
        ).all()
        
        for item in items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product or product.stock_quantity < item.quantity:
                return False
        
        return True
