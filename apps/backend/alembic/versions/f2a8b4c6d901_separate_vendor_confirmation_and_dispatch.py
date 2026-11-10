"""Separate vendor confirmation, rejection, and facility order dispatch."""

from alembic import op
import sqlalchemy as sa


revision = "f2a8b4c6d901"
down_revision = "a20261014allocation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("vendor_confirmed_at", sa.DateTime(), nullable=True))
    op.add_column("orders", sa.Column("vendor_rejected_at", sa.DateTime(), nullable=True))
    op.add_column("orders", sa.Column("vendor_rejection_reason", sa.String(1000), nullable=True))
    op.execute(
        "UPDATE orders SET status = 'shipped' "
        "WHERE order_flow = 'facility_delivery' AND status = 'processing'"
    )


def downgrade() -> None:
    op.execute(
        "UPDATE orders SET status = 'processing' "
        "WHERE order_flow = 'facility_delivery' AND status = 'shipped'"
    )
    op.drop_column("orders", "vendor_rejection_reason")
    op.drop_column("orders", "vendor_rejected_at")
    op.drop_column("orders", "vendor_confirmed_at")
