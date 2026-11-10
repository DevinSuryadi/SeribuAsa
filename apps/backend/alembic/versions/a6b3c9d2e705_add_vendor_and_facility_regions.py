"""Add profile regions for vendors and health facilities."""

from alembic import op
import sqlalchemy as sa


revision = "a6b3c9d2e705"
down_revision = "f2a8b4c6d901"
branch_labels = None
depends_on = None


def upgrade() -> None:
    for table in ("vendor_profiles", "health_facilities"):
        with op.batch_alter_table(table) as batch:
            batch.add_column(sa.Column("province_code", sa.String(2), nullable=True))
            batch.add_column(sa.Column("regency_code", sa.String(5), nullable=True))
            batch.create_check_constraint(
                f"ck_{table}_region_pair",
                "(province_code IS NULL AND regency_code IS NULL) OR "
                "(province_code IS NOT NULL AND regency_code IS NOT NULL)",
            )
            batch.create_index(f"ix_{table}_regency_code", ["regency_code"])


def downgrade() -> None:
    for table in ("health_facilities", "vendor_profiles"):
        with op.batch_alter_table(table) as batch:
            batch.drop_index(f"ix_{table}_regency_code")
            batch.drop_constraint(f"ck_{table}_region_pair", type_="check")
            batch.drop_column("regency_code")
            batch.drop_column("province_code")
