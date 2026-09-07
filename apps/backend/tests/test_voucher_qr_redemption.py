from datetime import datetime, timedelta
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models.cart import VoucherTransaction, VoucherTransactionTypeEnum
from app.models.donation import Voucher, VoucherStatusEnum
from app.models.product import Order, Product
from app.models.user import BeneficiaryProfile, UserProfile, VendorProfile
from app.models.wallet import WalletTransaction
from app.schemas.order import OrderCreate, OrderItemCreate
from app.services.order_service import OrderService
from app.services.voucher_service import VoucherService


def _build_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine, autocommit=False, autoflush=False)()
    return session, engine


def _create_beneficiary(db, name: str = "Beneficiary") -> str:
    beneficiary_id = uuid4()
    db.add(UserProfile(user_id=beneficiary_id, full_name=name))
    db.add(
        BeneficiaryProfile(
            user_id=beneficiary_id,
            family_size=3,
            approval_status="approved",
            vouchers_balance=Decimal("0"),
        )
    )
    return str(beneficiary_id)


def _create_vendor(db, name: str = "Vendor Store") -> str:
    vendor_id = uuid4()
    db.add(UserProfile(user_id=vendor_id, full_name="Vendor User"))
    db.add(
        VendorProfile(
            user_id=vendor_id,
            store_name=name,
            store_address="Jl. Vendor No. 1",
            approval_status="approved",
            settlement_status="active",
            wallet_balance=Decimal("0"),
        )
    )
    return str(vendor_id)


def test_vendor_qr_redemption_creates_completed_order_and_logs_transaction():
    db, engine = _build_session()
    try:
        beneficiary_id = _create_beneficiary(db)
        vendor_id = _create_vendor(db)
        db.commit()

        beneficiary = db.query(BeneficiaryProfile).filter(
            BeneficiaryProfile.user_id == UUID(beneficiary_id)
        ).first()
        assert beneficiary is not None
        beneficiary.vouchers_balance = Decimal("150000")

        voucher = Voucher(
            code="VCH-QR-001",
            beneficiary_id=beneficiary.user_id,
            donation_id=None,
            balance=Decimal("150000"),
            allocated_date=datetime.utcnow(),
            expiry_date=(datetime.utcnow() + timedelta(days=30)).date(),
            status=VoucherStatusEnum.active,
        )
        db.add(voucher)
        db.commit()

        result = VoucherService.redeem_voucher_for_vendor_sale(
            db=db,
            vendor_id=vendor_id,
            voucher_code="VCH-QR-001",
            amount=Decimal("50000"),
            notes="Redeem from QR",
        )

        db.refresh(voucher)
        db.refresh(beneficiary)
        order = db.query(Order).filter(Order.id == UUID(result["order_id"])).first()
        tx = db.query(VoucherTransaction).filter(
            VoucherTransaction.voucher_id == voucher.id
        ).first()

        assert order is not None
        assert str(order.vendor_id) == vendor_id
        assert str(order.beneficiary_id) == beneficiary_id
        assert order.status == "completed"
        assert order.payment_status == "paid"
        assert voucher.balance == Decimal("100000")
        assert beneficiary.vouchers_balance == Decimal("100000")
        assert tx is not None
        assert tx.transaction_type == VoucherTransactionTypeEnum.redeemed
        assert tx.amount == Decimal("50000")
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


def test_beneficiary_order_creation_updates_voucher_balance_and_history():
    db, engine = _build_session()
    try:
        beneficiary_id = _create_beneficiary(db, "Checkout Beneficiary")
        vendor_id = _create_vendor(db, "Checkout Vendor")
        db.commit()

        beneficiary = db.query(BeneficiaryProfile).filter(
            BeneficiaryProfile.user_id == UUID(beneficiary_id)
        ).first()
        vendor = db.query(VendorProfile).filter(VendorProfile.user_id == UUID(vendor_id)).first()
        assert beneficiary is not None
        assert vendor is not None

        beneficiary.vouchers_balance = Decimal("100000")

        voucher = Voucher(
            code="VCH-ORDER-001",
            beneficiary_id=beneficiary.user_id,
            donation_id=None,
            balance=Decimal("100000"),
            allocated_date=datetime.utcnow(),
            expiry_date=(datetime.utcnow() + timedelta(days=30)).date(),
            status=VoucherStatusEnum.active,
        )
        product = Product(
            vendor_id=vendor.user_id,
            category_id=None,
            name="Beras Premium",
            description="Produk uji",
            price=Decimal("80000"),
            voucher_price=Decimal("80000"),
            stock_quantity=10,
            unit="kg",
            approval_status="approved",
        )

        db.add(voucher)
        db.add(product)
        db.commit()

        order = OrderService.create_order(
            db=db,
            beneficiary_id=beneficiary_id,
            data=OrderCreate(
                vendor_id=vendor.user_id,
                items=[
                    OrderItemCreate(
                        product_id=product.id,
                        quantity=1,
                        price=Decimal("80000"),
                    )
                ],
                voucher_codes=["VCH-ORDER-001"],
            ),
        )

        db.refresh(voucher)
        db.refresh(beneficiary)
        wallet_transactions = db.query(WalletTransaction).filter(
            WalletTransaction.beneficiary_id == beneficiary.user_id
        ).all()

        assert order.voucher_used == Decimal("80000")
        assert order.cash_paid == Decimal("0")
        assert order.payment_status == "paid"
        assert beneficiary.vouchers_balance == Decimal("100000")
        assert beneficiary.wallet_held == Decimal("80000")
        assert beneficiary.wallet_available == Decimal("20000")
        assert len(wallet_transactions) == 1
        assert wallet_transactions[0].transaction_type == "hold"
        assert wallet_transactions[0].amount == Decimal("80000")
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
