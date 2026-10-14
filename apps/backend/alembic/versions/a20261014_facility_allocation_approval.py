"""Review facility allocation before reserving donated funds or dispatch."""

from alembic import op
import sqlalchemy as sa

revision = "a20261014allocation"
down_revision = "a20261014payout"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("allocation_status", sa.String(30), nullable=True))
    op.add_column("orders", sa.Column("allocation_decided_by_user_id", sa.Uuid(), nullable=True))
    op.add_column("orders", sa.Column("allocation_decided_at", sa.DateTime(), nullable=True))
    op.add_column("orders", sa.Column("allocation_reason", sa.Text(), nullable=True))
    op.create_foreign_key("fk_orders_allocation_decided_by", "orders", "user_profiles", ["allocation_decided_by_user_id"], ["user_id"], ondelete="SET NULL")
    op.create_index("ix_orders_allocation_status", "orders", ["allocation_status"])
    op.add_column("health_facilities", sa.Column("reviewed_by_user_id", sa.Uuid(), nullable=True))
    op.add_column("health_facilities", sa.Column("reviewed_at", sa.DateTime(), nullable=True))
    op.add_column("health_facilities", sa.Column("review_reason", sa.Text(), nullable=True))
    op.create_foreign_key("fk_health_facilities_reviewed_by", "health_facilities", "user_profiles", ["reviewed_by_user_id"], ["user_id"], ondelete="SET NULL")


def downgrade() -> None:
    op.drop_constraint("fk_health_facilities_reviewed_by", "health_facilities", type_="foreignkey")
    op.drop_column("health_facilities", "review_reason")
    op.drop_column("health_facilities", "reviewed_at")
    op.drop_column("health_facilities", "reviewed_by_user_id")
    op.drop_index("ix_orders_allocation_status", table_name="orders")
    op.drop_constraint("fk_orders_allocation_decided_by", "orders", type_="foreignkey")
    op.drop_column("orders", "allocation_reason")
    op.drop_column("orders", "allocation_decided_at")
    op.drop_column("orders", "allocation_decided_by_user_id")
    op.drop_column("orders", "allocation_status")
