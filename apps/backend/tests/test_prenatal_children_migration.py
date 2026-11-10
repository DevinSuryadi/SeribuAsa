"""The prenatal migration keeps existing children and never drops a pregnancy on downgrade."""

import importlib.util
from pathlib import Path

import pytest
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import IntegrityError


def load_migration():
    path = Path(__file__).resolve().parents[1] / "alembic/versions/b9e4c7a1d258_add_prenatal_children.py"
    spec = importlib.util.spec_from_file_location("prenatal_children_migration", path)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    return migration


def test_prenatal_migration_preserves_children(monkeypatch):
    migration = load_migration()
    engine = create_engine("sqlite:///:memory:")
    try:
        with engine.begin() as connection:
            connection.execute(text(
                "CREATE TABLE children (id INTEGER PRIMARY KEY, full_name TEXT NOT NULL, date_of_birth DATE NOT NULL)"
            ))
            connection.execute(text("INSERT INTO children VALUES (1, 'Existing child', '2025-01-10')"))
            monkeypatch.setattr(migration, "op", Operations(MigrationContext.configure(connection)))

            migration.upgrade()

            existing = connection.execute(text(
                "SELECT full_name, date_of_birth, last_menstrual_period, expected_birth_date FROM children"
            )).one()
            assert tuple(existing) == ("Existing child", "2025-01-10", None, None)
            connection.execute(text(
                "INSERT INTO children (id, full_name, mother_name, last_menstrual_period, expected_birth_date) "
                "VALUES (2, 'Bayi Ny. Siti', 'Siti', '2026-08-01', '2027-05-08')"
            ))
            with pytest.raises(IntegrityError), connection.begin_nested():
                connection.execute(text("INSERT INTO children (id, full_name) VALUES (3, 'No dates')"))
            with pytest.raises(IntegrityError), connection.begin_nested():
                connection.execute(text(
                    "INSERT INTO children (id, full_name, expected_birth_date) VALUES (4, 'No period', '2027-05-08')"
                ))
            assert "prenatal_measurements" in inspect(connection).get_table_names()

            migration.downgrade()

            rows = connection.execute(text("SELECT id, date_of_birth FROM children ORDER BY id")).all()
            assert [tuple(row) for row in rows] == [(1, "2025-01-10"), (2, "2027-05-08")]
            assert "expected_birth_date" not in {column["name"] for column in inspect(connection).get_columns("children")}
            assert "prenatal_measurements" not in inspect(connection).get_table_names()
    finally:
        engine.dispose()
