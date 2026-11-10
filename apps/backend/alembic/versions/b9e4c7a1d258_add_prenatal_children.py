"""Register children in the womb and record their antenatal check-ups.

Revision ID: b9e4c7a1d258
Revises: a6b3c9d2e705
"""

from alembic import op
import sqlalchemy as sa


revision = "b9e4c7a1d258"
down_revision = "a6b3c9d2e705"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("children") as batch:
        batch.alter_column("date_of_birth", existing_type=sa.Date(), nullable=True)
        batch.add_column(sa.Column("mother_name", sa.String(255), nullable=True))
        batch.add_column(sa.Column("last_menstrual_period", sa.Date(), nullable=True))
        batch.add_column(sa.Column("expected_birth_date", sa.Date(), nullable=True))
        batch.create_check_constraint(
            "ck_children_birth_or_due_date",
            "date_of_birth IS NOT NULL OR expected_birth_date IS NOT NULL",
        )
        batch.create_check_constraint(
            "ck_children_pregnancy_dates",
            "(last_menstrual_period IS NULL) = (expected_birth_date IS NULL)",
        )

    op.create_table(
        "prenatal_measurements",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("child_id", sa.Uuid(), nullable=False),
        sa.Column("recorded_by_user_id", sa.Uuid(), nullable=True),
        sa.Column("measurement_date", sa.Date(), nullable=False),
        sa.Column("gestational_age_weeks", sa.Integer(), nullable=False),
        sa.Column("maternal_weight", sa.Numeric(5, 2), nullable=False),
        sa.Column("maternal_muac", sa.Numeric(5, 2), nullable=False),
        sa.Column("fundal_height", sa.Numeric(5, 2), nullable=True),
        sa.Column("fetal_heart_rate", sa.Integer(), nullable=True),
        sa.Column("estimated_fetal_weight", sa.Integer(), nullable=True),
        sa.Column("classification", sa.String(30), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.ForeignKeyConstraint(["child_id"], ["children.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recorded_by_user_id"], ["user_profiles.user_id"], ondelete="SET NULL"),
    )
    op.create_index(
        "ix_prenatal_measurements_child_date", "prenatal_measurements", ["child_id", "measurement_date"]
    )
    if op.get_bind().dialect.name == "postgresql":
        op.execute("ALTER TABLE public.prenatal_measurements ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    op.drop_index("ix_prenatal_measurements_child_date", table_name="prenatal_measurements")
    op.drop_table("prenatal_measurements")
    # Children still in the womb keep their record, dated at the expected birth date.
    op.execute("UPDATE children SET date_of_birth = expected_birth_date WHERE date_of_birth IS NULL")
    with op.batch_alter_table("children") as batch:
        batch.drop_constraint("ck_children_pregnancy_dates", type_="check")
        batch.drop_constraint("ck_children_birth_or_due_date", type_="check")
        batch.drop_column("expected_birth_date")
        batch.drop_column("last_menstrual_period")
        batch.drop_column("mother_name")
        batch.alter_column("date_of_birth", existing_type=sa.Date(), nullable=False)
