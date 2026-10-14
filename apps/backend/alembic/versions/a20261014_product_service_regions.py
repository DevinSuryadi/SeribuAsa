"""Store the province and regency served by a product and facility order.

Existing products remain unassigned. Vendors must set a real service area and
submit the product for review before it appears in a facility's regional list.
"""

from alembic import op
import sqlalchemy as sa

revision = "a20261014regions"
down_revision = "e7a1c2d3f4b5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("products", sa.Column("service_province_code", sa.String(2), nullable=True))
    op.add_column("products", sa.Column("service_regency_code", sa.String(5), nullable=True))
    op.add_column("orders", sa.Column("service_province_code", sa.String(2), nullable=True))
    op.add_column("orders", sa.Column("service_regency_code", sa.String(5), nullable=True))
    op.create_check_constraint(
        "ck_products_service_area_pair", "products",
        "(service_province_code IS NULL AND service_regency_code IS NULL) OR "
        "(service_province_code IS NOT NULL AND service_regency_code IS NOT NULL)",
    )
    op.create_index("ix_products_service_province_code", "products", ["service_province_code"])
    op.create_index("ix_products_service_regency_code", "products", ["service_regency_code"])
    op.create_index(
        "ix_products_area_eligible", "products",
        ["service_regency_code", "vendor_id", "approval_status", "is_active"],
    )


def downgrade() -> None:
    op.drop_index("ix_products_area_eligible", table_name="products")
    op.drop_index("ix_products_service_regency_code", table_name="products")
    op.drop_index("ix_products_service_province_code", table_name="products")
    op.drop_constraint("ck_products_service_area_pair", "products", type_="check")
    op.drop_column("orders", "service_regency_code")
    op.drop_column("orders", "service_province_code")
    op.drop_column("products", "service_regency_code")
    op.drop_column("products", "service_province_code")
