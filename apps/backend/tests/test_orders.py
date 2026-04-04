"""
Order Tests
Tests for order service logic, schemas, and enums
"""
from decimal import Decimal
from datetime import datetime
from uuid import uuid4

from app.models.product import OrderStatusEnum, PaymentStatusEnum
from app.schemas.order import OrderCreate, OrderItemCreate, OrderResponse, OrderStatusUpdate


def test_order_status_enum():
    """Test order status enum values"""
    assert OrderStatusEnum.pending.value == "pending"
    assert OrderStatusEnum.processing.value == "processing"
    assert OrderStatusEnum.completed.value == "completed"
    assert OrderStatusEnum.cancelled.value == "cancelled"


def test_payment_status_enum():
    """Test payment status enum values"""
    assert PaymentStatusEnum.pending.value == "pending"
    assert PaymentStatusEnum.partial.value == "partial"
    assert PaymentStatusEnum.paid.value == "paid"
    assert PaymentStatusEnum.refunded.value == "refunded"


def test_order_create_schema():
    """Test OrderCreate schema validation"""
    data = OrderCreate(
        vendor_id=uuid4(),
        items=[
            OrderItemCreate(product_id=uuid4(), quantity=2, price=Decimal("50000")),
        ],
        voucher_codes=["VCH-001"],
        notes="Test order",
    )
    assert len(data.items) == 1
    assert data.items[0].quantity == 2


def test_order_create_schema_empty_items():
    """Test OrderCreate rejects empty items"""
    import pytest
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        OrderCreate(vendor_id=uuid4(), items=[])


def test_order_response_schema():
    """Test OrderResponse schema"""
    data = OrderResponse(
        id=uuid4(),
        beneficiary_id=uuid4(),
        vendor_id=uuid4(),
        total_amount=Decimal("100000"),
        voucher_used=Decimal("50000"),
        cash_paid=Decimal("50000"),
        status="pending",
        payment_status="pending",
        created_at=datetime.utcnow(),
    )
    assert data.total_amount == Decimal("100000")
    assert data.status == "pending"


def test_order_status_update_schema():
    """Test OrderStatusUpdate schema validation"""
    data = OrderStatusUpdate(status="completed")
    assert data.status == "completed"


def test_order_status_update_invalid():
    """Test OrderStatusUpdate rejects invalid status"""
    import pytest
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        OrderStatusUpdate(status="invalid_status")


def test_order_item_create_validation():
    """Test OrderItemCreate rejects zero/negative quantity"""
    import pytest
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        OrderItemCreate(product_id=uuid4(), quantity=0, price=Decimal("50000"))
