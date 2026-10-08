"""Facility orders reserve stock and require a one-use vendor QR for receipt."""

from datetime import datetime, timedelta
from uuid import UUID, uuid4

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import get_db
from app.main import app
from app.middleware.auth import AuthenticatedUser, get_current_user
from app.models.donation import Donation, DonationStatusEnum
from app.models.facility import FacilityOrderReceipt, HealthFacility, OrderFundingAllocation, OrderHandoverToken, RecipientFamily
from app.models.product import Category, Order, OrderItem, Product
from app.models.user import BeneficiaryProfile, DonorProfile, UserProfile, VendorProfile
from app.services.report_generator import ReportGenerator
from app.services.supabase_auth import supabase_auth


def test_facility_order_handover_and_stock(monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    for model in (UserProfile, BeneficiaryProfile, DonorProfile, VendorProfile, HealthFacility, RecipientFamily, Category, Product, Donation, Order, OrderItem, OrderHandoverToken, FacilityOrderReceipt, OrderFundingAllocation):
        model.__table__.create(engine)
    sessions = sessionmaker(bind=engine)
    facility_user = uuid4()
    other_facility_user = uuid4()
    vendor_user = uuid4()
    other_vendor_user = uuid4()
    donor_user = uuid4()
    other_donor_user = uuid4()
    vendor_identity = {"id": vendor_user, "role": "vendor"}

    async def verify_token(token):
        return {"id": str(facility_user if token == "facility" else other_facility_user)}

    monkeypatch.setattr(supabase_auth, "verify_token", verify_token)
    with sessions() as db:
        for user_id, name in ((facility_user, "Faskes A"), (other_facility_user, "Faskes B"), (vendor_user, "Vendor A"), (other_vendor_user, "Vendor B"), (donor_user, "Donor A"), (other_donor_user, "Donor B")):
            db.add(UserProfile(user_id=user_id, full_name=name))
        db.flush()
        db.add_all([DonorProfile(user_id=donor_user), DonorProfile(user_id=other_donor_user)])
        db.flush()
        db.add_all([
            Donation(donor_id=donor_user, amount=50000, status=DonationStatusEnum.success, funding_flow="pooled", created_at=datetime.utcnow() - timedelta(days=1)),
            Donation(donor_id=other_donor_user, amount=120000, status=DonationStatusEnum.success, funding_flow="pooled"),
            Donation(donor_id=donor_user, amount=99999, status=DonationStatusEnum.success, funding_flow="legacy_wallet"),
        ])
        facility = HealthFacility(account_user_id=facility_user, name="Faskes A", address="Alamat A")
        other_facility = HealthFacility(account_user_id=other_facility_user, name="Faskes B")
        db.add_all([facility, other_facility, VendorProfile(user_id=vendor_user, store_name="Toko A", store_address="Jalan A"), VendorProfile(user_id=other_vendor_user, store_name="Toko B", store_address="Jalan B")])
        db.flush()
        family = RecipientFamily(health_facility_id=facility.id, kk_number="1234567890123456", head_name="Keluarga A")
        other_family = RecipientFamily(health_facility_id=other_facility.id, kk_number="1234567890123457", head_name="Keluarga B")
        product = Product(vendor_id=vendor_user, name="Beras", price=35000, voucher_price=35000, stock_quantity=5, approval_status="approved")
        other_product = Product(vendor_id=other_vendor_user, name="Telur", price=20000, voucher_price=20000, stock_quantity=3, approval_status="approved")
        db.add_all([family, other_family, product, other_product])
        db.commit()
        family_id, other_family_id, product_id, other_product_id = family.id, other_family.id, product.id, other_product.id

    def override_db():
        with sessions() as db:
            yield db

    def override_vendor():
        return AuthenticatedUser(user_id=vendor_identity["id"], email="vendor@example.org", role=vendor_identity["role"])

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_vendor
    try:
        client = TestClient(app)
        facility_headers = {"Authorization": "Bearer facility"}
        other_headers = {"Authorization": "Bearer other"}
        url = "/api/v1/facilities/orders"
        payload = {"family_id": str(family_id), "client_request_id": str(uuid4()), "items": [{"product_id": str(product_id), "quantity": 2}]}
        assert client.post(url, json={**payload, "family_id": str(other_family_id)}, headers=facility_headers).status_code == 404
        assert client.post(url, json={**payload, "items": payload["items"] + [{"product_id": str(other_product_id), "quantity": 1}]}, headers=facility_headers).status_code == 400
        created = client.post(url, json=payload, headers=facility_headers)
        assert created.status_code == 201, created.text
        order_id = created.json()["id"]
        assert created.json()["funding_status"] == "reserved"
        assert created.json()["total_amount"] == 70000
        assert client.post(url, json=payload, headers=facility_headers).json()["id"] == order_id
        assert client.post(url, json={**payload, "items": [{"product_id": str(product_id), "quantity": 1}]}, headers=facility_headers).status_code == 409
        insufficient = client.post(url, json={**payload, "client_request_id": str(uuid4()), "items": [{"product_id": str(product_id), "quantity": 3}]}, headers=facility_headers)
        assert insufficient.status_code == 409
        assert "pool" in insufficient.json()["detail"].lower()
        assert client.get(url, headers=other_headers).json() == []
        assert client.get(f"{url}/history", headers=facility_headers).json() == []
        assert client.get(f"{url}/history?family_id={other_family_id}", headers=facility_headers).status_code == 404
        with sessions() as db:
            assert db.get(Product, product_id).stock_quantity == 3
            assert db.query(Order).count() == 1
            assert sorted(int(row.amount) for row in db.query(OrderFundingAllocation).all()) == [20000, 50000]
        assert client.get("/api/v1/funding/admin/pool").status_code == 403
        assert client.get("/api/v1/funding/my-donations").status_code == 403
        vendor_identity.update(id=donor_user, role="donor")
        donor_usage = client.get("/api/v1/funding/my-donations")
        assert donor_usage.status_code == 200, donor_usage.text
        assert len(donor_usage.json()) == 1
        assert donor_usage.json()[0]["reserved_amount"] == 50000
        assert donor_usage.json()[0]["spent_amount"] == 0
        assert client.get("/api/v1/funding/admin/pool").status_code == 403
        vendor_identity.update(id=vendor_user, role="vendor")

        vendor_url = f"/api/v1/vendor/facility-orders/{order_id}"
        vendor_identity["id"] = other_vendor_user
        assert client.post(f"{vendor_url}/dispatch").status_code == 404
        vendor_identity["id"] = vendor_user
        assert client.get("/api/v1/vendor/facility-orders").json()[0]["family_name"] is None
        assert client.post(f"{vendor_url}/handover-token").status_code == 409
        assert client.post(f"{vendor_url}/dispatch").status_code == 200
        assert client.put(f"/api/v1/orders/{order_id}/status", json={"status": "completed"}).status_code == 404
        qr = client.post(f"{vendor_url}/handover-token")
        assert qr.status_code == 200, qr.text
        old_token = qr.json()["token"]
        qr = client.post(f"{vendor_url}/handover-token")
        token = qr.json()["token"]
        assert client.post(f"{url}/preview-handover", json={"token": old_token}, headers=facility_headers).status_code == 400
        assert client.post(f"{url}/preview-handover", json={"token": token}, headers=other_headers).status_code == 404
        preview = client.post(f"{url}/preview-handover", json={"token": token}, headers=facility_headers)
        assert preview.status_code == 200
        assert preview.json()["id"] == order_id
        assert preview.json()["items"][0]["quantity"] == 2
        assert client.post(f"{url}/receive", json={"token": old_token}, headers=facility_headers).status_code == 400
        assert client.post(f"{url}/receive", json={"token": token}, headers=other_headers).status_code == 404
        received = client.post(f"{url}/receive", json={"token": token, "notes": "Barang sesuai"}, headers=facility_headers)
        assert received.status_code == 200, received.text
        assert received.json()["status"] == "completed"
        assert received.json()["funding_status"] == "spent"
        assert received.json()["receipt_notes"] == "Barang sesuai"
        assert client.post(f"{url}/receive", json={"token": token}, headers=facility_headers).status_code == 400
        assert client.post(f"{url}/preview-handover", json={"token": token}, headers=facility_headers).status_code == 400
        history = client.get(f"{url}/history", headers=facility_headers)
        assert history.status_code == 200
        assert [entry["id"] for entry in history.json()] == [order_id]
        assert history.json()[0]["received_at"] is not None
        assert [entry["id"] for entry in client.get(f"{url}/history?family_id={family_id}", headers=facility_headers).json()] == [order_id]
        assert client.get(f"{url}/history", headers=other_headers).json() == []
        vendor_identity.update(id=donor_user, role="donor")
        donor_usage = client.get("/api/v1/funding/my-donations").json()[0]
        assert donor_usage["spent_amount"] == 50000
        assert donor_usage["available_amount"] == 0
        assert donor_usage["recipients"][0]["family_name"] == "Keluarga A"
        assert donor_usage["recipients"][0]["facility_name"] == "Faskes A"
        exported = client.get("/api/v1/donations/export?format=csv")
        assert exported.status_code == 200
        assert "Recipient Families" in exported.text
        assert "Keluarga A: 50000" in exported.text
        vendor_identity.update(id=other_donor_user, role="donor")
        other_usage = client.get("/api/v1/funding/my-donations").json()[0]
        assert other_usage["spent_amount"] == 20000
        assert other_usage["available_amount"] == 100000
        assert len(other_usage["recipients"]) == 1
        vendor_identity.update(id=facility_user, role="admin")
        pool = client.get("/api/v1/funding/admin/pool")
        assert pool.status_code == 200, pool.text
        assert pool.json()["total_received"] == 170000
        assert pool.json()["total_spent"] == 70000
        assert pool.json()["available_balance"] == 100000
        vendor_identity.update(id=vendor_user, role="vendor")
        with sessions() as db:
            assert db.query(FacilityOrderReceipt).filter_by(order_id=UUID(order_id)).count() == 1
            assert db.get(Product, product_id).stock_quantity == 3
            report = ReportGenerator.generate_sales_report(db, str(vendor_user))
            assert report["summary"]["total_sales"] == 0
            assert report["summary"]["total_orders"] == 0

        cancel_payload = {**payload, "client_request_id": str(uuid4())}
        cancelled = client.post(url, json=cancel_payload, headers=facility_headers)
        assert cancelled.status_code == 201
        assert cancelled.json()["funding_status"] == "reserved"
        with sessions() as db:
            donor_two_donations = db.query(Donation).filter_by(donor_id=other_donor_user).all()
            assert len(donor_two_donations) == 1
            assert sorted(int(row.amount) for row in db.query(OrderFundingAllocation).filter_by(donation_id=donor_two_donations[0].id, status="reserved").all()) == [70000]
            assert db.query(OrderFundingAllocation).filter_by(donation_id=donor_two_donations[0].id, status="spent").count() == 1
        assert client.post(f"{url}/{cancelled.json()['id']}/cancel", headers=facility_headers).status_code == 200
        assert client.post(f"{url}/{cancelled.json()['id']}/cancel", headers=facility_headers).status_code == 409
        vendor_identity.update(id=facility_user, role="admin")
        pool = client.get("/api/v1/funding/admin/pool").json()
        assert pool["total_reserved"] == 0
        assert pool["total_spent"] == 70000
        assert pool["available_balance"] == 100000
        with sessions() as db:
            assert db.get(Product, product_id).stock_quantity == 3
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)
        engine.dispose()
