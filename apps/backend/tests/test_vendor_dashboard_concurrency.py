"""Slow dashboard database reads must not stall unrelated HTTP requests."""

import asyncio
from threading import Event
from types import SimpleNamespace
from unittest.mock import MagicMock

import httpx
import pytest
from fastapi import FastAPI

from app.api import orders, products, vendor_wallet
from app.database import get_db
from app.middleware import auth


@pytest.mark.parametrize("target", ["orders", "products", "wallet", "auth"])
def test_dashboard_reads_leave_server_responsive(monkeypatch, target):
    started = Event()
    release = Event()
    user = auth.AuthenticatedUser(
        "00000000-0000-0000-0000-000000000003", "vendor@example.com", "vendor"
    )

    def slow_read(*_args, **_kwargs):
        started.set()
        release.wait(2)
        return []

    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = SimpleNamespace(
        user_id=user.user_id, wallet_balance=0, bank_name=None,
        bank_account_number=None, bank_account_holder=None,
    )
    db.query.return_value.filter.return_value.scalar.return_value = 0
    monkeypatch.setattr(orders.OrderService, "count_orders", lambda *_: 0)
    monkeypatch.setattr(orders.OrderService, "get_orders", lambda *_: [])
    monkeypatch.setattr(products.ProductService, "get_products_count", lambda *_, **__: 0)
    monkeypatch.setattr(products.ProductService, "get_products", lambda *_, **__: [])

    app = FastAPI()
    app.include_router(orders.router)
    app.include_router(products.router)
    app.include_router(vendor_wallet.router)
    app.dependency_overrides[get_db] = lambda: db

    @app.get("/health")
    async def health():
        return {"status": "healthy"}

    if target == "auth":
        async def verify_token(_token):
            return {"id": str(user.user_id), "email": user.email,
                    "user_metadata": {"role": "vendor"}}

        def resolve_role(*args):
            slow_read()
            return "vendor"

        monkeypatch.setattr(auth.supabase_auth, "verify_token", verify_token)
        monkeypatch.setattr(auth, "_resolve_role_from_db", resolve_role)
        path = "/orders/"
    else:
        app.dependency_overrides[auth.get_current_user] = lambda: user
        if target == "products":
            monkeypatch.setattr(products.ProductService, "get_products", slow_read)
            path = "/products/"
        else:
            def query(*args):
                slow_read()
                return MagicMock(
                    **{"filter.return_value.first.return_value": db_vendor,
                       "filter.return_value.scalar.return_value": 0}
                )

            db_vendor = db.query.return_value.filter.return_value.first.return_value
            db.query.side_effect = query
            path = "/orders/" if target == "orders" else "/vendor-wallet/balance"

    async def exercise():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            pending = asyncio.create_task(
                client.get(path, headers={"Authorization": "Bearer test"})
            )
            try:
                assert await asyncio.to_thread(started.wait, 1)
                # The slow database read must still be waiting while another
                # request completes on this same application's event loop.
                assert not pending.done()
                response = await asyncio.wait_for(client.get("/health"), timeout=1)
                assert response.status_code == 200
                assert not pending.done()
            finally:
                release.set()
                response = await pending
            assert response.status_code == 200

    asyncio.run(exercise())
