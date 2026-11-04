"""Preserve dispatched facility orders while introducing separate confirmation."""

import importlib.util
from pathlib import Path

from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine, inspect, text


def test_workflow_migration_preserves_existing_order_progress(monkeypatch):
    migration_path = (
        Path(__file__).resolve().parents[1]
        / "alembic/versions/f2a8b4c6d901_separate_vendor_confirmation_and_dispatch.py"
    )
    spec = importlib.util.spec_from_file_location("facility_order_workflow_migration", migration_path)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    engine = create_engine("sqlite:///:memory:")
    try:
        with engine.begin() as connection:
            connection.execute(text(
                "CREATE TABLE orders (id INTEGER PRIMARY KEY, order_flow TEXT, status TEXT)"
            ))
            connection.execute(text(
                "INSERT INTO orders (id, order_flow, status) VALUES "
                "(1, 'facility_delivery', 'pending'), "
                "(2, 'facility_delivery', 'processing'), "
                "(3, 'facility_delivery', 'received'), "
                "(4, 'facility_delivery', 'completed'), "
                "(5, 'facility_delivery', 'rejected'), "
                "(6, 'legacy_pickup', 'processing')"
            ))
            monkeypatch.setattr(migration, "op", Operations(MigrationContext.configure(connection)))
            migration.upgrade()
            assert dict(connection.execute(text("SELECT id, status FROM orders")).all()) == {
                1: "pending", 2: "shipped", 3: "received", 4: "completed",
                5: "rejected", 6: "processing",
            }
            columns = {column["name"] for column in inspect(connection).get_columns("orders")}
            assert {"vendor_confirmed_at", "vendor_rejected_at", "vendor_rejection_reason"} <= columns
            migration.downgrade()
            assert connection.execute(text("SELECT status FROM orders WHERE id = 2")).scalar_one() == "processing"
            assert connection.execute(text("SELECT COUNT(*) FROM orders")).scalar_one() == 6
    finally:
        engine.dispose()
