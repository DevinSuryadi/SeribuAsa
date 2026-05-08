"""
Order Router
Handles order creation, listing, and status management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional
import hashlib
import json

from app.database import get_db
from app.services.order_service import OrderService
from app.services.idempotency_service import IdempotencyService
from app.middleware.auth import get_current_user, AuthenticatedUser
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderDetailResponse,
    OrderItemResponse,
    OrderListResponse,
    OrderStatusUpdate,
    OrderQueryParams,
    ConfirmPickupRequest,
)
from app.utils.cache import get_app_cache
import logging

cache = get_app_cache()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Create a new order with items and voucher redemption (beneficiary only)"""
    if not idempotency_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Idempotency-Key header",
        )

    request_hash = hashlib.sha256(
        json.dumps(data.model_dump(mode="json"), sort_keys=True).encode("utf-8")
    ).hexdigest()

    idem_state, idem_record = IdempotencyService.begin(
        endpoint="orders:create",
        user_id=current_user.user_id,
        idempotency_key=idempotency_key,
        request_hash=request_hash,
    )

    if idem_state == "replay" and idem_record:
        return OrderResponse(**idem_record.response_body)

    if idem_state == "processing":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Order request is already being processed",
        )

    if idem_state == "conflict":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Idempotency key already used with different payload",
        )

    try:
        order = OrderService.create_order(db, current_user.user_id, data)
        response_payload = OrderResponse.model_validate(order).model_dump(mode="json")

        IdempotencyService.complete(
            endpoint="orders:create",
            user_id=current_user.user_id,
            idempotency_key=idempotency_key,
            request_hash=request_hash,
            status_code=status.HTTP_201_CREATED,
            response_body=response_payload,
        )
        
        # Invalidate admin stats cache
        cache.invalidate_namespace("stats")

        return OrderResponse(**response_payload)
    except ValueError as e:
        IdempotencyService.abort(
            endpoint="orders:create",
            user_id=current_user.user_id,
            idempotency_key=idempotency_key,
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except SQLAlchemyError as e:
        IdempotencyService.abort(
            endpoint="orders:create",
            user_id=current_user.user_id,
            idempotency_key=idempotency_key,
        )
        logger.error("Order creation database error: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create order",
        )
    except Exception as e:
        IdempotencyService.abort(
            endpoint="orders:create",
            user_id=current_user.user_id,
            idempotency_key=idempotency_key,
        )
        logger.error("Order creation unexpected error: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create order",
        )


@router.get("/", response_model=OrderListResponse)
async def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """List orders with role-based filtering"""
    params = OrderQueryParams(page=page, page_size=page_size, status=status_filter, search=search)
    vendor_id = None
    if current_user.role == "vendor":
        from app.models.user import VendorProfile
        vendor = db.query(VendorProfile).filter(VendorProfile.user_id == current_user.user_id).first()
        if vendor:
            vendor_id = str(vendor.user_id)

    total = OrderService.count_orders(db, current_user.user_id, current_user.role, params, vendor_id)
    orders = OrderService.get_orders(db, current_user.user_id, current_user.role, params, vendor_id)

    items = []
    for o in orders:
        o_dict = OrderResponse.model_validate(o).model_dump()
        if o.vendor_profile:
            o_dict["vendor_store_name"] = o.vendor_profile.store_name
        items.append(OrderResponse(**o_dict))

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    return OrderListResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/{order_id}", response_model=OrderDetailResponse)
async def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get order detail with items and voucher redemptions"""
    order = OrderService.get_order_by_id(db, order_id, current_user.user_id, current_user.role)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    o_dict = OrderDetailResponse.model_validate(order).model_dump()
    if order.vendor_profile:
        o_dict["vendor_store_name"] = order.vendor_profile.store_name

    items = []
    for item in order.items:
        i_dict = OrderItemResponse.model_validate(item).model_dump()
        if item.product:
            i_dict["product_name"] = item.product.name
        items.append(OrderItemResponse(**i_dict))
    o_dict["items"] = items

    return OrderDetailResponse(**o_dict)


@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Update order status (vendor only: pending → completed/cancelled)"""
    if current_user.role != "vendor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vendor only")
    try:
        order = OrderService.update_order_status(db, order_id, current_user.user_id, data)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found or not yours")
        # Invalidate admin stats cache
        cache.invalidate_namespace("stats")
        return OrderResponse.model_validate(order)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ──────────────────────────────────────────────────────────────────────────────
# NEW: QR Pickup endpoints
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/{order_id}/pickup-qr", response_model=dict)
async def get_pickup_qr(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Get QR code data for a pending order (beneficiary only).
    Returns QR value + order summary to display in app.
    """
    if current_user.role != "beneficiary":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Beneficiary only")

    order = OrderService.get_order_by_id(db, order_id, current_user.user_id, "beneficiary")
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pesanan tidak ditemukan")
    if order.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"QR hanya tersedia untuk pesanan pending. Status saat ini: {order.status}",
        )
    if not order.pickup_qr_code:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="QR code tidak ditemukan untuk pesanan ini")

    items_summary = [
        {"name": item.product.name if item.product else str(item.product_id), "quantity": item.quantity, "price": float(item.price)}
        for item in order.items
    ]

    return {
        "order_id":          str(order.id),
        "qr_code":           order.pickup_qr_code,
        "qr_value":          f"NUTRIGUARD:ORDER:{order.pickup_qr_code}",
        "total_amount":      float(order.total_amount),
        "pickup_expires_at": order.pickup_expires_at,
        "cancel_deadline":   order.cancel_deadline,
        "vendor_name":       order.vendor_profile.store_name if order.vendor_profile else None,
        "items":             items_summary,
        "status":            order.status,
    }


@router.post("/{order_id}/confirm-pickup", response_model=OrderResponse)
async def confirm_pickup(
    order_id: str,
    data: ConfirmPickupRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Vendor confirms pickup by submitting the QR code scanned from beneficiary's phone.
    Releases escrow: deducts beneficiary wallet, credits vendor wallet.
    """
    if current_user.role != "vendor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vendor only")
    try:
        order = OrderService.confirm_pickup_qr(db, data.qr_code, current_user.user_id)
        return OrderResponse.model_validate(order)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("Confirm pickup error: %s", str(e), exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Konfirmasi pickup gagal")


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Beneficiary cancels their own pending order within 30-minute window.
    Refunds the held wallet balance.
    """
    if current_user.role != "beneficiary":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Beneficiary only")
    try:
        order = OrderService.cancel_order(db, order_id, current_user.user_id)
        return OrderResponse.model_validate(order)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("Cancel order error: %s", str(e), exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Pembatalan pesanan gagal")
