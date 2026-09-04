"""Add stunting_risk_predictions table for AI early-warning

Revision ID: add_stunting_risk_predictions
Revises: c09f90037cf4
Create Date: 2026-05-16

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "add_stunting_risk_predictions"
down_revision: Union[str, Sequence[str], None] = "c09f90037cf4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create stunting_risk_predictions table + indexes."""
    op.create_table(
        "stunting_risk_predictions",
        # BaseModel inherited columns
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
        # Foreign keys
        sa.Column(
            "child_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("children.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "measurement_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("nutrition_measurements.id", ondelete="SET NULL"),
            nullable=True,
        ),
        # Prediction output
        sa.Column("risk_score", sa.Numeric(5, 4), nullable=False),
        sa.Column("risk_level", sa.String(20), nullable=False),
        sa.Column(
            "horizon_months",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("3"),
        ),
        # Audit / explainability
        sa.Column(
            "features",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column(
            "dominant_factors",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        # Model metadata
        sa.Column(
            "model_version",
            sa.String(50),
            nullable=False,
            server_default=sa.text("'logreg-v1'"),
        ),
    )

    op.create_index(
        "ix_stunting_risk_predictions_id",
        "stunting_risk_predictions",
        ["id"],
    )
    op.create_index(
        "ix_stunting_risk_predictions_created_at",
        "stunting_risk_predictions",
        ["created_at"],
    )
    op.create_index(
        "ix_stunting_risk_predictions_is_active",
        "stunting_risk_predictions",
        ["is_active"],
    )
    op.create_index(
        "ix_stunting_risk_predictions_child_id",
        "stunting_risk_predictions",
        ["child_id"],
    )
    op.create_index(
        "ix_stunting_risk_predictions_measurement_id",
        "stunting_risk_predictions",
        ["measurement_id"],
    )
    op.create_index(
        "ix_stunting_risk_predictions_risk_level",
        "stunting_risk_predictions",
        ["risk_level"],
    )
    # Composite index used by list_high_risk + per-child latest queries
    op.create_index(
        "idx_stunting_risk_child_created",
        "stunting_risk_predictions",
        ["child_id", "created_at"],
    )


def downgrade() -> None:
    """Drop stunting_risk_predictions table + indexes."""
    op.drop_index(
        "idx_stunting_risk_child_created",
        table_name="stunting_risk_predictions",
    )
    op.drop_index(
        "ix_stunting_risk_predictions_risk_level",
        table_name="stunting_risk_predictions",
    )
    op.drop_index(
        "ix_stunting_risk_predictions_measurement_id",
        table_name="stunting_risk_predictions",
    )
    op.drop_index(
        "ix_stunting_risk_predictions_child_id",
        table_name="stunting_risk_predictions",
    )
    op.drop_index(
        "ix_stunting_risk_predictions_is_active",
        table_name="stunting_risk_predictions",
    )
    op.drop_index(
        "ix_stunting_risk_predictions_created_at",
        table_name="stunting_risk_predictions",
    )
    op.drop_index(
        "ix_stunting_risk_predictions_id",
        table_name="stunting_risk_predictions",
    )
    op.drop_table("stunting_risk_predictions")
