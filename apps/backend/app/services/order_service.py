"""
Order Service
Business logic for order processing with e-wallet escrow flow.

Flow:
  create_order        – hold wallet balance, generate pickup QR (valid 24h)
  confirm_pickup_qr   – vendor scans QR → release escrow to vendor wallet
  cancel_order        – beneficiary cancels (within 30-min window) → refund hold
  update_order_status – vendor dashboard button (legacy + admin use)
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional, List
from decimal import Decimal
import logging
import uuid as uuid_lib
from datetime import datetime, timedelta
from uuid import UUID

from app.models.product import Order, OrderItem, OrderStatusEnum, Product
from app.models.user import BeneficiaryProfile, UserProfile, VendorProfile
from app.models.cart import CartItem
from app.models.wallet import WalletTransaction
from app.schemas.order import OrderCreate, OrderItemCreate, OrderStatusUpdate, OrderQueryParams
from app.services.wallet_service import WalletService

logger = logging.getLogger(__name__)

QR_EXPIRY_HOURS    = 24
CANCEL_WINDOW_MINS = 30


class OrderService:
    @staticmethod
    def _to_uuid(value: Optional[str | UUID]) -> Optional[UUID]:
        """Normalize incoming ID values to UUID for UUID-backed columns."""
        if value is None:
            return None
        if isinstance(value, UUID):
            return value
        return UUID(str(value))

    @staticmethod
    def _apply_search(query, search: Optional[str]):
        if not search:
            return query
        search_term = search.strip()
        if not search_term:
            return query
        like_term = f"%{search_term}%"
        return query.filter(
            or_(
                Order.notes.ilike(like_term),
                Order.beneficiary_profile.has(
                    BeneficiaryProfile.user_profile.has(
                        or_(
                            UserProfile.full_name.ilike(like_term),
                            UserProfile.phone.ilike(like_term),
                        )
                    )
                ),
                Order.vendor_profile.has(VendorProfile.store_name.ilike(like_term)),
            )
        )

    # ──────────────────────────────────────────────────────────────────────────
    # CREATE ORDER — holds wallet balance, generates pickup QR
    # ──────────────────────────────────────────────────────────────────────────
    @staticmethod
    def create_order(db: Session, beneficiary_id: str, data: OrderCreate) -> Order:
        try:
            beneficiary_uuid = OrderService._to_uuid(beneficiary_id)
            vendor_uuid      = OrderService._to_uuid(data.vendor_id)
            total_amount     = Decimal(0)

            # 1. Validate all products
            validated_items = []
            for item in data.items:
                product = db.query(Product).filter(
                    Product.id == item.product_id,
                    Product.is_active,
                    Product.approval_status == "approved"
                ).first()

                if not product:
                    raise ValueError(f"Produk tidak ditemukan atau belum disetujui: {item.product_id}")
                if product.stock_quantity < item.quantity:
                    raise ValueError(
                        f"Stok {product.name} tidak cukup: tersedia {product.stock_quantity}, butuh {item.quantity}"
                    )

                validated_items.append((product, item))
                total_amount += Decimal(str(item.price)) * item.quantity

            # 2. Check & hold wallet balance (e-wallet escrow)
            beneficiary = db.query(BeneficiaryProfile).filter(
                BeneficiaryProfile.user_id == beneficiary_uuid
            ).first()
            if not beneficiary:
                raise ValueError("Profil penerima tidak ditemukan")

            now = datetime.utcnow()

            # Reserve balance — WalletService.hold() does NOT commit
            held = WalletService.hold(
                db=db,
                beneficiary=beneficiary,
                amount=total_amount,
                description=f"Pemesanan {len(data.items)} item",
            )
            if not held:
                available = Decimal(beneficiary.vouchers_balance or 0) - Decimal(beneficiary.wallet_held or 0)
                raise ValueError(
                    f"Saldo tidak mencukupi. Tersedia: Rp {available:,.0f}, Dibutuhkan: Rp {total_amount:,.0f}"
                )

            # 3. Generate unique pickup QR code
            qr_code = uuid_lib.uuid4().hex.upper()[:24]

            # 4. Create order
            order = Order(
                beneficiary_id  = beneficiary_uuid,
                vendor_id       = vendor_uuid,
                total_amount    = total_amount,
                voucher_used    = total_amount,   # entire amount from wallet
                cash_paid       = Decimal(0),
                status          = OrderStatusEnum.pending,
                payment_status  = "paid",         # wallet already held = paid
                notes           = data.notes,
                pickup_qr_code  = qr_code,
                pickup_expires_at  = now + timedelta(hours=QR_EXPIRY_HOURS),
                cancel_deadline    = now + timedelta(minutes=CANCEL_WINDOW_MINS),
            )
            db.add(order)
            db.flush()   # get order.id

            # Link WalletTransaction to order
            wallet_tx = db.query(
                __import__("app.models.wallet", fromlist=["WalletTransaction"]).WalletTransaction
            ).filter_by(
                beneficiary_id=beneficiary_uuid,
                transaction_type="hold",
                order_id=None,
            ).order_by(
                __import__("app.models.wallet", fromlist=["WalletTransaction"]).WalletTransaction.created_at.desc()
            ).first()
            if wallet_tx:
                wallet_tx.order_id = order.id

            # 5. Create order items & deduct stock
            for product, item in validated_items:
                db.add(OrderItem(
                    order_id   = order.id,
                    product_id = item.product_id,
                    quantity   = item.quantity,
                    price      = Decimal(str(item.price)),
                    subtotal   = Decimal(str(item.price)) * item.quantity,
                ))
                product.stock_quantity -= item.quantity
                if product.stock_quantity < 10:
                    logger.warning("Low stock alert: %s (%s remaining)", product.name, product.stock_quantity)

            db.commit()
            db.refresh(order)
            logger.info("Order created: %s by beneficiary %s | QR: %s", order.id, beneficiary_uuid, qr_code)
            return order

        except Exception as e:
            db.rollback()
            logger.error("Order creation failed: %s", str(e))
            raise

    # ──────────────────────────────────────────────────────────────────────────
    # CHECKOUT FROM CART — Multi-vendor split order checkout
    # ──────────────────────────────────────────────────────────────────────────
    @staticmethod
    def checkout_from_cart(db: Session, beneficiary_id: str, cart_item_ids: List[UUID], voucher_amount: Decimal) -> tuple[list[Order], Decimal]:
        """
        Checkout from cart, splitting into multiple orders per vendor.
        Returns: (list_of_orders, total_amount)
        """
        try:
            beneficiary_uuid = OrderService._to_uuid(beneficiary_id)
            
            # 1. Fetch cart items
            query = db.query(CartItem, Product).join(
                Product, CartItem.product_id == Product.id
            ).filter(
                CartItem.beneficiary_id == beneficiary_uuid
            )
            
            if cart_item_ids:
                query = query.filter(CartItem.id.in_(cart_item_ids))
                
            cart_data = query.all()
            
            if not cart_data:
                raise ValueError("Keranjang kosong atau item tidak ditemukan")

            # 2. Group by vendor
            vendor_groups = {}
            total_grand_amount = Decimal(0)
            
            for cart_item, product in cart_data:
                if not product.is_active or product.approval_status != "approved":
                    raise ValueError(f"Produk {product.name} tidak tersedia")
                if product.stock_quantity < cart_item.quantity:
                    raise ValueError(f"Stok {product.name} tidak cukup")
                    
                vendor_id = product.vendor_id
                if vendor_id not in vendor_groups:
                    vendor_groups[vendor_id] = {
                        "items": [],
                        "total_amount": Decimal(0)
                    }
                
                item_price = Decimal(str(product.price))
                item_subtotal = item_price * cart_item.quantity
                
                vendor_groups[vendor_id]["items"].append({
                    "product": product,
                    "cart_item": cart_item,
                    "order_item_create": OrderItemCreate(
                        product_id=product.id,
                        quantity=cart_item.quantity,
                        price=item_price
                    )
                })
                vendor_groups[vendor_id]["total_amount"] += item_subtotal
                total_grand_amount += item_subtotal

            # 3. Create orders per vendor
            beneficiary = db.query(BeneficiaryProfile).filter(
                BeneficiaryProfile.user_id == beneficiary_uuid
            ).first()
            
            if not beneficiary:
                raise ValueError("Profil penerima tidak ditemukan")
            created_orders = []
            now = datetime.utcnow()
            
            for vendor_id, group in vendor_groups.items():
                total_amount = group["total_amount"]
                
                # Hold balance for this specific vendor's order
                held = WalletService.hold(
                    db=db,
                    beneficiary=beneficiary,
                    amount=total_amount,
                    description=f"Pemesanan multi-vendor ({len(group['items'])} item)"
                )
                
                if not held:
                    raise ValueError("Gagal menahan saldo untuk transaksi toko")

                qr_code = uuid_lib.uuid4().hex.upper()[:24]

                order = Order(
                    beneficiary_id=beneficiary_uuid,
                    vendor_id=vendor_id,
                    total_amount=total_amount,
                    voucher_used=total_amount,
                    cash_paid=Decimal(0),
                    status=OrderStatusEnum.pending,
                    payment_status="paid",
                    notes="Split order dari keranjang",
                    pickup_qr_code=qr_code,
                    pickup_expires_at=now + timedelta(hours=QR_EXPIRY_HOURS),
                    cancel_deadline=now + timedelta(minutes=CANCEL_WINDOW_MINS),
                )
                db.add(order)
                db.flush()

                # Link WalletTransaction
                wallet_tx = db.query(WalletTransaction).filter_by(
                    beneficiary_id=beneficiary_uuid,
                    transaction_type="hold",
                    order_id=None,
                ).order_by(WalletTransaction.created_at.desc()).first()
                if wallet_tx:
                    wallet_tx.order_id = order.id

                for item_data in group["items"]:
                    item_create = item_data["order_item_create"]
                    product = item_data["product"]
                    db.add(OrderItem(
                        order_id=order.id,
                        product_id=item_create.product_id,
                        quantity=item_create.quantity,
                        price=item_create.price,
                        subtotal=item_create.price * item_create.quantity,
                    ))
                    # Deduct stock
                    product.stock_quantity -= item_create.quantity
                
                db.flush()
                created_orders.append(order)

            # 5. Hapus item dari cart
            if cart_item_ids:
                db.query(CartItem).filter(CartItem.id.in_(cart_item_ids)).delete(synchronize_session=False)
            else:
                db.query(CartItem).filter(CartItem.beneficiary_id == beneficiary_uuid).delete(synchronize_session=False)

            db.commit()
            
            # Refresh all created orders
            for order in created_orders:
                db.refresh(order)
                
            return created_orders, total_grand_amount

        except Exception as e:
            db.rollback()
            logger.error("Multi-order checkout failed: %s", str(e))
            raise

    # ──────────────────────────────────────────────────────────────────────────
    # CONFIRM PICKUP VIA QR — vendor scans QR code → releases escrow
    # ──────────────────────────────────────────────────────────────────────────
    @staticmethod
    def get_pickup_preview_by_qr(db: Session, qr_code: str, vendor_id: str) -> Order:
        """Validate a pickup QR and return the order without completing it."""
        vendor_uuid = OrderService._to_uuid(vendor_id)

        order = db.query(Order).options(
            joinedload(Order.beneficiary_profile),
            joinedload(Order.vendor_profile),
            joinedload(Order.items).joinedload(OrderItem.product),
        ).filter(
            Order.pickup_qr_code == qr_code.strip().upper(),
            Order.is_active,
        ).first()

        if not order:
            raise ValueError("QR code tidak valid atau pesanan tidak ditemukan")

        if str(order.vendor_id) != str(vendor_uuid):
            raise ValueError("QR code ini bukan untuk toko Anda")

        if order.status == OrderStatusEnum.completed:
            raise ValueError("Pesanan sudah selesai dikonfirmasi")
        if order.status == OrderStatusEnum.cancelled:
            raise ValueError("Pesanan telah dibatalkan")
        if order.status != OrderStatusEnum.pending:
            raise ValueError(f"Status pesanan tidak valid: {order.status}")

        if order.pickup_expires_at and datetime.utcnow() > order.pickup_expires_at:
            raise ValueError("QR code sudah kadaluarsa (lebih dari 24 jam). Silakan buat pesanan baru.")

        return order

    @staticmethod
    def confirm_pickup_qr(db: Session, qr_code: str, vendor_id: str) -> Order:
        """
        Called when vendor scans beneficiary's order QR.
        Validates QR, checks expiry, completes order, releases wallet to vendor.
        """
        try:
            vendor_uuid = OrderService._to_uuid(vendor_id)

            order = db.query(Order).options(
                joinedload(Order.beneficiary_profile),
                joinedload(Order.vendor_profile),
                joinedload(Order.items),
            ).filter(
                Order.pickup_qr_code == qr_code.strip().upper(),
                Order.is_active,
            ).first()

            if not order:
                raise ValueError("QR code tidak valid atau pesanan tidak ditemukan")

            # Vendor must own this order
            if str(order.vendor_id) != str(vendor_uuid):
                raise ValueError("QR code ini bukan untuk toko Anda")

            if order.status == OrderStatusEnum.completed:
                raise ValueError("Pesanan sudah selesai dikonfirmasi")
            if order.status == OrderStatusEnum.cancelled:
                raise ValueError("Pesanan telah dibatalkan")
            if order.status != OrderStatusEnum.pending:
                raise ValueError(f"Status pesanan tidak valid: {order.status}")

            # Check QR expiry
            if order.pickup_expires_at:
                if datetime.utcnow() > order.pickup_expires_at:
                    raise ValueError("QR code sudah kadaluarsa (lebih dari 24 jam). Silakan buat pesanan baru.")

            # Release escrow: debit beneficiary, credit vendor
            net = WalletService.release_to_vendor(db=db, order=order)

            # Complete order
            order.status               = OrderStatusEnum.completed
            order.confirmed_by_vendor_id = vendor_uuid
            order.payment_status       = "paid"

            db.commit()
            db.refresh(order)

            logger.info(
                "Pickup confirmed: order=%s vendor=%s net_to_vendor=%s",
                order.id, vendor_uuid, net,
            )
            return order

        except Exception as e:
            db.rollback()
            logger.error("Confirm pickup failed: %s", str(e))
            raise

    # ──────────────────────────────────────────────────────────────────────────
    # CANCEL ORDER — beneficiary cancels (within 30-min window)
    # ──────────────────────────────────────────────────────────────────────────
    @staticmethod
    def cancel_order(db: Session, order_id: str, beneficiary_id: str) -> Order:
        """
        Beneficiary cancels their own pending order within 30-minute window.
        Refunds held wallet balance and restores product stock.
        """
        try:
            order_uuid       = OrderService._to_uuid(order_id)
            beneficiary_uuid = OrderService._to_uuid(beneficiary_id)

            order = db.query(Order).options(
                joinedload(Order.beneficiary_profile),
                joinedload(Order.vendor_profile),
                joinedload(Order.items),
            ).filter(
                Order.id == order_uuid,
                Order.beneficiary_id == beneficiary_uuid,
                Order.is_active,
            ).first()

            if not order:
                raise ValueError("Pesanan tidak ditemukan")
            if order.status != OrderStatusEnum.pending:
                raise ValueError(f"Hanya pesanan 'pending' yang dapat dibatalkan. Status saat ini: {order.status}")

            # Check cancel deadline
            if order.cancel_deadline:
                if datetime.utcnow() > order.cancel_deadline:
                    raise ValueError(
                        "Batas waktu pembatalan sudah lewat (30 menit setelah pesanan dibuat)."
                    )

            # Refund held balance
            WalletService.refund_hold(db=db, order=order)

            # Restore product stock
            for item in order.items:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    product.stock_quantity += item.quantity

            order.status = OrderStatusEnum.cancelled

            db.commit()
            db.refresh(order)
            logger.info("Order cancelled by beneficiary: order=%s beneficiary=%s", order_id, beneficiary_id)
            return order

        except Exception as e:
            db.rollback()
            logger.error("Cancel order failed: %s", str(e))
            raise

    # ──────────────────────────────────────────────────────────────────────────
    # READ operations (unchanged)
    # ──────────────────────────────────────────────────────────────────────────
    @staticmethod
    def count_orders(db: Session, user_id: str, role: str, params: OrderQueryParams, vendor_id: Optional[str] = None) -> int:
        query = db.query(Order).filter(Order.is_active)
        user_uuid   = OrderService._to_uuid(user_id)
        vendor_uuid = OrderService._to_uuid(vendor_id) if vendor_id else None

        if role == "beneficiary":
            query = query.filter(Order.beneficiary_id == user_uuid)
        elif role == "vendor":
            effective_vendor_id = vendor_uuid or user_uuid
            query = query.filter(Order.vendor_id == effective_vendor_id)

        if params.status:
            query = query.filter(Order.status == params.status)
        query = OrderService._apply_search(query, params.search)
        return query.count()

    @staticmethod
    def get_orders(db: Session, user_id: str, role: str, params: OrderQueryParams, vendor_id: Optional[str] = None) -> List[Order]:
        query = db.query(Order).filter(Order.is_active).options(
            joinedload(Order.vendor_profile),
            joinedload(Order.items),
        )
        user_uuid   = OrderService._to_uuid(user_id)
        vendor_uuid = OrderService._to_uuid(vendor_id) if vendor_id else None

        if role == "beneficiary":
            query = query.filter(Order.beneficiary_id == user_uuid)
        elif role == "vendor":
            effective_vendor_id = vendor_uuid or user_uuid
            query = query.filter(Order.vendor_id == effective_vendor_id)

        if params.status:
            query = query.filter(Order.status == params.status)
        query = OrderService._apply_search(query, params.search)
        return (
            query.order_by(Order.created_at.desc())
            .offset((params.page - 1) * params.page_size)
            .limit(params.page_size)
            .all()
        )

    @staticmethod
    def get_order_by_id(db: Session, order_id: str, user_id: str, role: str) -> Optional[Order]:
        order_uuid = OrderService._to_uuid(order_id)
        user_uuid  = OrderService._to_uuid(user_id)
        query = db.query(Order).filter(Order.id == order_uuid).options(
            joinedload(Order.vendor_profile),
            joinedload(Order.items).joinedload(OrderItem.product),
        )

        if role == "beneficiary":
            query = query.filter(Order.beneficiary_id == user_uuid)
        elif role == "vendor":
            query = query.filter(Order.vendor_id == user_uuid)

        return query.first()

    # ──────────────────────────────────────────────────────────────────────────
    # UPDATE ORDER STATUS — vendor dashboard button (legacy / admin override)
    # ──────────────────────────────────────────────────────────────────────────
    @staticmethod
    def update_order_status(db: Session, order_id: str, vendor_id: str, data: OrderStatusUpdate) -> Optional[Order]:
        """
        Manual status update by vendor via dashboard button.
        For completing: also releases wallet escrow to vendor.
        For cancelling: also refunds hold to beneficiary.
        """
        order_uuid  = OrderService._to_uuid(order_id)
        vendor_uuid = OrderService._to_uuid(vendor_id)
        order = db.query(Order).options(
            joinedload(Order.beneficiary_profile),
            joinedload(Order.vendor_profile),
            joinedload(Order.items).joinedload(OrderItem.product),
        ).filter(
            Order.id == order_uuid,
            Order.vendor_id == vendor_uuid,
            Order.is_active,
        ).first()

        if not order:
            return None

        if order.status not in (OrderStatusEnum.pending, OrderStatusEnum.processing):
            raise ValueError(f"Pesanan dengan status '{order.status}' tidak dapat diubah")

        if data.status == "completed":
            WalletService.release_to_vendor(db=db, order=order)
            order.status = OrderStatusEnum.completed
            order.confirmed_by_vendor_id = vendor_uuid
            logger.info("Order completed via dashboard: order=%s vendor=%s", order_id, vendor_id)

        elif data.status == "cancelled":
            WalletService.refund_hold(db=db, order=order)
            order.status = OrderStatusEnum.cancelled
            # Restore stock
            product_ids = [item.product_id for item in order.items]
            products = (
                db.query(Product)
                .filter(Product.id.in_(product_ids))
                .all()
            )
            product_lookup = {product.id: product for product in products}
            for item in order.items:
                product = product_lookup.get(item.product_id)
                if product:
                    product.stock_quantity += item.quantity
                else:
                    logger.warning("Product not found for order item %s", item.product_id)
            logger.info("Order cancelled via dashboard: order=%s vendor=%s", order_id, vendor_id)

        elif data.status == "processing":
            order.status = OrderStatusEnum.processing

        db.commit()
        db.refresh(order)
        return order
