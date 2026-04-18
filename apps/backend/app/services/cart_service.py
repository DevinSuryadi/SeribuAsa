"""
Cart Service
Business logic for shopping cart management
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
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
    def _serialize_cart_item(db: Session, item: CartItem) -> Dict[str, Any]:
        """Serialize CartItem with related product fields for API responses."""
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise ValueError("Product not found")

        voucher_price = product.voucher_price or Decimal(0)
        subtotal = product.price * item.quantity

        return {
            "id": str(item.id),
            "product_id": str(item.product_id),
            "vendor_id": str(product.vendor_id),
            "product_name": product.name,
            "category_id": str(product.category_id) if product.category_id else None,
            "quantity": item.quantity,
            "price": product.price,
            "voucher_price": voucher_price,
            "subtotal": subtotal,
            "is_eligible": voucher_price > 0,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
        }
    
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
    ) -> Dict[str, Any]:
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
        
        # Check if product already in cart (including soft-deleted rows)
        existing_item = db.query(CartItem).filter(
            CartItem.beneficiary_id == beneficiary_uuid,
            CartItem.product_id == product_uuid,
        ).first()
        
        if existing_item:
            if existing_item.is_active:
                # Update quantity for existing active item
                new_quantity = existing_item.quantity + quantity
                if new_quantity > 100:
                    raise ValueError("Max quantity for this product is 100")
                existing_item.quantity = new_quantity
            else:
                # Reactivate soft-deleted item
                existing_item.is_active = True
                existing_item.quantity = quantity

            db.commit()
            db.refresh(existing_item)
            
            logger.info(
                "Updated cart item for beneficiary %s: product %s, qty %s",
                beneficiary_id,
                product_id,
                existing_item.quantity,
            )
            return CartService._serialize_cart_item(db, existing_item)
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
            try:
                db.commit()
                db.refresh(cart_item)
            except IntegrityError:
                # Handle race condition on unique constraint by updating existing row
                db.rollback()
                concurrent_item = db.query(CartItem).filter(
                    CartItem.beneficiary_id == beneficiary_uuid,
                    CartItem.product_id == product_uuid,
                ).first()
                if not concurrent_item:
                    raise

                if concurrent_item.is_active:
                    merged_quantity = concurrent_item.quantity + quantity
                    if merged_quantity > 100:
                        raise ValueError("Max quantity for this product is 100")
                    concurrent_item.quantity = merged_quantity
                else:
                    concurrent_item.is_active = True
                    concurrent_item.quantity = quantity

                db.commit()
                db.refresh(concurrent_item)
                logger.info(
                    "Recovered cart race for beneficiary %s: product %s, qty %s",
                    beneficiary_id,
                    product_id,
                    concurrent_item.quantity,
                )
                return CartService._serialize_cart_item(db, concurrent_item)
            
            logger.info(f"Added to cart for beneficiary {beneficiary_id}: product {product_id}, qty {quantity}")
            return CartService._serialize_cart_item(db, cart_item)
    
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
                    "vendor_id": str(product.vendor_id),
                    "product_name": product.name,
                    "price": product.price,
                    "voucher_price": product.voucher_price or Decimal(0),
                    "quantity": item.quantity,
                    "subtotal": product.price * item.quantity,
                    "category_id": str(product.category_id) if product.category_id else None,
                    "is_eligible": (product.voucher_price or Decimal(0)) > 0,
                    "created_at": item.created_at,
                    "updated_at": item.updated_at,
                })
        
        return cart_items
    
    @staticmethod
    def update_quantity(
        db: Session,
        cart_item_id: str,
        quantity: int,
        beneficiary_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Update quantity of cart item"""
        cart_item_uuid = CartService._to_uuid(cart_item_id)
        
        # Validate quantity
        if quantity < 1 or quantity > 100:
            raise ValueError("Quantity must be between 1 and 100")
        
        # Get cart item
        query = db.query(CartItem).filter(
            CartItem.id == cart_item_uuid,
            CartItem.is_active
        )

        if beneficiary_id:
            beneficiary_uuid = CartService._to_uuid(beneficiary_id)
            query = query.filter(CartItem.beneficiary_id == beneficiary_uuid)

        cart_item = query.first()
        
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
        return CartService._serialize_cart_item(db, cart_item)
    
    @staticmethod
    def remove_item(
        db: Session,
        cart_item_id: str,
        beneficiary_id: Optional[str] = None,
    ) -> bool:
        """Remove item from cart (soft delete)"""
        cart_item_uuid = CartService._to_uuid(cart_item_id)
        
        query = db.query(CartItem).filter(
            CartItem.id == cart_item_uuid,
            CartItem.is_active
        )

        if beneficiary_id:
            beneficiary_uuid = CartService._to_uuid(beneficiary_id)
            query = query.filter(CartItem.beneficiary_id == beneficiary_uuid)

        cart_item = query.first()
        
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
            
            voucher_price = product.voucher_price or Decimal(0)
            item_subtotal = product.price * item.quantity
            subtotal += item_subtotal
            
            # Determine if product is eligible for voucher
            # (This should check against allowed categories)
            # For now, use voucher_price to determine eligibility
            if voucher_price > 0:
                item_eligible = voucher_price * item.quantity
                eligible_total += item_eligible
            else:
                ineligible_total += item_subtotal
            
            cart_items.append({
                "id": str(item.id),
                "product_id": str(item.product_id),
                "vendor_id": str(product.vendor_id),
                "product_name": product.name,
                "category_id": str(product.category_id) if product.category_id else None,
                "quantity": item.quantity,
                "price": product.price,
                "voucher_price": voucher_price,
                "subtotal": item_subtotal,
                "is_eligible": voucher_price > 0,
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
        beneficiary_id: str,
        product_ids: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Validate all cart items still have sufficient stock"""
        beneficiary_uuid = CartService._to_uuid(beneficiary_id)
        
        query = db.query(CartItem).filter(
            CartItem.beneficiary_id == beneficiary_uuid,
            CartItem.is_active
        )

        if product_ids:
            product_uuids = [CartService._to_uuid(pid) for pid in product_ids]
            query = query.filter(CartItem.product_id.in_(product_uuids))

        items = query.all()

        unavailable_products: List[str] = []
        low_stock_products: List[str] = []
        
        for item in items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            product_id_str = str(item.product_id)
            if not product or not product.is_active:
                unavailable_products.append(product_id_str)
                continue
            if product.stock_quantity <= 0:
                unavailable_products.append(product_id_str)
                continue
            if product.stock_quantity < item.quantity:
                low_stock_products.append(product_id_str)

        return {
            "all_in_stock": len(unavailable_products) == 0 and len(low_stock_products) == 0,
            "unavailable_products": unavailable_products,
            "low_stock_products": low_stock_products,
        }
