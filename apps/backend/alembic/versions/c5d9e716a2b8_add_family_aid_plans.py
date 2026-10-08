"""Store auditable aid plan revisions for facility families.

Revision ID: c5d9e716a2b8
Revises: b73c5d1a920f
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c5d9e716a2b8"
down_revision: Union[str, Sequence[str], None] = "b73c5d1a920f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "family_aid_plans",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("family_id", sa.Uuid(), nullable=False),
        sa.Column("recorded_by_user_id", sa.Uuid(), nullable=False),
        sa.Column("priority", sa.String(20), nullable=False),
        sa.Column("needs_summary", sa.Text(), nullable=False),
        sa.Column("planned_action", sa.Text(), nullable=False),
        sa.Column("review_date", sa.Date(), nullable=True),
        sa.Column("basis_snapshot", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.ForeignKeyConstraint(["family_id"], ["recipient_families.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["recorded_by_user_id"], ["user_profiles.user_id"], ondelete="RESTRICT"),
        sa.CheckConstraint("priority IN ('low', 'medium', 'high')", name="ck_family_aid_plans_priority"),
    )
    op.create_index("ix_family_aid_plans_family_created", "family_aid_plans", ["family_id", "created_at"])
    if op.get_bind().dialect.name == "postgresql":
        op.execute("ALTER TABLE public.family_aid_plans ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    op.drop_index("ix_family_aid_plans_family_created", table_name="family_aid_plans")
    op.drop_table("family_aid_plans")
