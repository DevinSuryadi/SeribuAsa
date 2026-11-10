"""Verify profile region migrations preserve existing accounts."""

import importlib.util
from pathlib import Path

import pytest
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import IntegrityError


def test_profile_regions_migration_preserves_existing_accounts(monkeypatch):
    path = Path(__file__).resolve().parents[1] / "alembic/versions/a6b3c9d2e705_add_vendor_and_facility_regions.py"
    spec = importlib.util.spec_from_file_location("profile_regions_migration", path)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    engine = create_engine("sqlite:///:memory:")
    try:
        with engine.begin() as connection:
            for table in ("vendor_profiles", "health_facilities"):
                connection.execute(text(f"CREATE TABLE {table} (id INTEGER PRIMARY KEY, name TEXT)"))
                connection.execute(text(f"INSERT INTO {table} (id, name) VALUES (1, 'Existing account')"))
            monkeypatch.setattr(migration, "op", Operations(MigrationContext.configure(connection)))
            migration.upgrade()
            for table in ("vendor_profiles", "health_facilities"):
                account = connection.execute(text(f"SELECT name, province_code, regency_code FROM {table}")).one()
                assert tuple(account) == ("Existing account", None, None)
                with pytest.raises(IntegrityError), connection.begin_nested():
                    connection.execute(text(f"UPDATE {table} SET province_code = '15' WHERE id = 1"))
                connection.execute(text(f"UPDATE {table} SET province_code = '15', regency_code = '15.71' WHERE id = 1"))
            migration.downgrade()
            for table in ("vendor_profiles", "health_facilities"):
                assert connection.execute(text(f"SELECT name FROM {table}")).scalar_one() == "Existing account"
                assert "province_code" not in {column["name"] for column in inspect(connection).get_columns(table)}
    finally:
        engine.dispose()
