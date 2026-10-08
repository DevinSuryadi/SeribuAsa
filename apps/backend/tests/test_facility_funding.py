"""Pooled funding reuses leftovers and combines donations without double spending."""

from datetime import datetime, timedelta
from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models import Donation, DonorProfile, HealthFacility, Order, OrderFundingAllocation, RecipientFamily, UserProfile, VendorProfile  # noqa: F401
from app.services.facility_funding import InsufficientPoolFunds, order_funding, release_order_funding, reserve_order_funding


def test_pool_reuses_15000_and_combines_20000_with_10000():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    sessions = sessionmaker(bind=engine)
    try:
        with sessions() as db:
            donor_ids = [uuid4() for _ in range(3)]
            facility_user, vendor_user = uuid4(), uuid4()
            db.add_all([UserProfile(user_id=user_id, full_name=str(user_id)) for user_id in [*donor_ids, facility_user, vendor_user]])
            db.flush()
            db.add_all([DonorProfile(user_id=user_id) for user_id in donor_ids])
            db.add(VendorProfile(user_id=vendor_user, store_name="Vendor", store_address="Jalan A"))
            facility = HealthFacility(account_user_id=facility_user, name="Faskes")
            db.add(facility)
            db.flush()
            family = RecipientFamily(health_facility_id=facility.id, kk_number="1234567890123456", head_name="Keluarga")
            db.add(family)
            base_time = datetime.utcnow() - timedelta(days=3)
            donations = [
                Donation(donor_id=donor_id, amount=amount, status="success", funding_flow="pooled", created_at=base_time + timedelta(days=index))
                for index, (donor_id, amount) in enumerate(zip(donor_ids, [50000, 20000, 10000]))
            ]
            db.add_all(donations)
            db.flush()

            orders = [
                Order(order_flow="facility_delivery", family_id=family.id, health_facility_id=facility.id,
                      vendor_id=vendor_user, total_amount=amount, status="pending", payment_status="pending")
                for amount in [35000, 15000, 30000]
            ]
            db.add_all(orders)
            db.flush()
            for order in orders:
                reserve_order_funding(db, order)
                assert order_funding(db, order)["funding_status"] == "reserved"
            allocations = db.query(OrderFundingAllocation).all()
            amounts = {(row.donation_id, row.order_id): Decimal(row.amount) for row in allocations}
            assert amounts[(donations[0].id, orders[0].id)] == Decimal("35000")
            assert amounts[(donations[0].id, orders[1].id)] == Decimal("15000")
            assert amounts[(donations[1].id, orders[2].id)] == Decimal("20000")
            assert amounts[(donations[2].id, orders[2].id)] == Decimal("10000")

            extra_order = Order(order_flow="facility_delivery", family_id=family.id, health_facility_id=facility.id,
                                vendor_id=vendor_user, total_amount=1, status="pending", payment_status="pending")
            db.add(extra_order)
            db.flush()
            with pytest.raises(InsufficientPoolFunds):
                reserve_order_funding(db, extra_order)

            release_order_funding(db, orders[1])
            db.commit()
            assert db.query(OrderFundingAllocation).filter_by(order_id=orders[1].id).first().status == "released"
    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
