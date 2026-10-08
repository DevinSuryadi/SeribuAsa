"""Deduplicate facility order submissions without changing legacy orders.

Revision ID: d8f4a1b2c3d4
Revises: c5d9e716a2b8
"""

from alembic import op
import sqlalchemy as sa

revision = "d8f4a1b2c3d4"
down_revision = "c5d9e716a2b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("client_request_id", sa.Uuid(), nullable=True))
    op.create_index("ix_orders_client_request_id", "orders", ["client_request_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_orders_client_request_id", table_name="orders")
    op.drop_column("orders", "client_request_id")
