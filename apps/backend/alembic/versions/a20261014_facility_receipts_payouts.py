"""Separate facility arrival, acceptance, and approved vendor payout."""

from alembic import op
import sqlalchemy as sa

revision = "a20261014payout"
down_revision = "a20261014regions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("dispatched_at", sa.DateTime(), nullable=True))
    op.add_column("facility_order_receipts", sa.Column("arrived_at", sa.DateTime(), nullable=True))
    op.add_column("facility_order_receipts", sa.Column("status", sa.String(20), nullable=False, server_default="accepted"))
    op.add_column("facility_order_receipts", sa.Column("evidence_url", sa.Text(), nullable=True))
    op.add_column("facility_order_receipts", sa.Column("discrepancy_notes", sa.Text(), nullable=True))
    op.create_table(
        "facility_vendor_payouts",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("order_id", sa.Uuid(as_uuid=True), sa.ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("vendor_id", sa.Uuid(as_uuid=True), sa.ForeignKey("vendor_profiles.user_id", ondelete="RESTRICT"), nullable=False),
        sa.Column("amount", sa.Numeric(15, 2), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending_approval"),
        sa.Column("due_at", sa.DateTime(), nullable=False),
        sa.Column("approved_by_user_id", sa.Uuid(as_uuid=True), sa.ForeignKey("user_profiles.user_id", ondelete="RESTRICT")),
        sa.Column("approved_at", sa.DateTime()),
        sa.Column("paid_by_user_id", sa.Uuid(as_uuid=True), sa.ForeignKey("user_profiles.user_id", ondelete="RESTRICT")),
        sa.Column("paid_at", sa.DateTime()),
        sa.Column("recorded_at", sa.DateTime()),
        sa.Column("transfer_reference", sa.String(120)),
        sa.Column("bank_name", sa.String(100)),
        sa.Column("bank_account_number", sa.String(50)),
        sa.Column("bank_account_holder", sa.String(255)),
        sa.CheckConstraint("amount > 0", name="ck_facility_vendor_payouts_positive_amount"),
        sa.CheckConstraint("status IN ('pending_approval', 'approved', 'paid')", name="ck_facility_vendor_payouts_status"),
        sa.UniqueConstraint("order_id", name="uq_facility_vendor_payouts_order"),
        sa.UniqueConstraint("transfer_reference", name="uq_facility_vendor_payouts_transfer_reference"),
    )
    op.create_index("ix_facility_vendor_payouts_status_due", "facility_vendor_payouts", ["status", "due_at"])
    op.create_index("ix_facility_vendor_payouts_id", "facility_vendor_payouts", ["id"])
    op.create_index("ix_facility_vendor_payouts_created_at", "facility_vendor_payouts", ["created_at"])
    op.create_index("ix_facility_vendor_payouts_is_active", "facility_vendor_payouts", ["is_active"])
    if op.get_bind().dialect.name == "postgresql":
        op.execute("ALTER TABLE public.facility_vendor_payouts ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    op.drop_index("ix_facility_vendor_payouts_is_active", table_name="facility_vendor_payouts")
    op.drop_index("ix_facility_vendor_payouts_created_at", table_name="facility_vendor_payouts")
    op.drop_index("ix_facility_vendor_payouts_id", table_name="facility_vendor_payouts")
    op.drop_index("ix_facility_vendor_payouts_status_due", table_name="facility_vendor_payouts")
    op.drop_table("facility_vendor_payouts")
    op.drop_column("facility_order_receipts", "discrepancy_notes")
    op.drop_column("facility_order_receipts", "evidence_url")
    op.drop_column("facility_order_receipts", "status")
    op.drop_column("facility_order_receipts", "arrived_at")
    op.drop_column("orders", "dispatched_at")
