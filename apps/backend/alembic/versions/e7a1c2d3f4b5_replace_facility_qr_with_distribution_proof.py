"""Replace facility QR receipt with direct arrival and distribution proof.

Revision ID: e7a1c2d3f4b5
Revises: d8f4a1b2c3d4
"""

from alembic import op
import sqlalchemy as sa


revision = "e7a1c2d3f4b5"
down_revision = "d8f4a1b2c3d4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "facility_order_receipts", "handover_token_id", existing_type=sa.Uuid(), nullable=True
    )
    op.add_column(
        "aid_distributions", sa.Column("recipient_name", sa.String(length=255), nullable=True)
    )
    op.add_column(
        "aid_distributions", sa.Column("recipient_relation", sa.String(length=100), nullable=True)
    )
    op.add_column("aid_distributions", sa.Column("evidence_url", sa.Text(), nullable=True))
    op.add_column(
        "aid_distributions",
        sa.Column("items_complete", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.create_unique_constraint("uq_aid_distributions_order_id", "aid_distributions", ["order_id"])


def downgrade() -> None:
    op.drop_constraint("uq_aid_distributions_order_id", "aid_distributions", type_="unique")
    op.drop_column("aid_distributions", "items_complete")
    op.drop_column("aid_distributions", "evidence_url")
    op.drop_column("aid_distributions", "recipient_relation")
    op.drop_column("aid_distributions", "recipient_name")
    op.alter_column(
        "facility_order_receipts", "handover_token_id", existing_type=sa.Uuid(), nullable=False
    )
