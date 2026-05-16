"""Add cancelled to DonationStatusEnum

Revision ID: c09f90037cf4
Revises: d199a5e31422
Create Date: 2026-05-09 22:25:44.429778

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'c09f90037cf4'
down_revision: Union[str, Sequence[str], None] = 'd199a5e31422'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use raw SQL to add the enum value safely without dropping tables
    # PostgreSQL supports ADD VALUE to an existing enum.
    # We use IF NOT EXISTS to prevent errors if it was already added.
    op.execute("ALTER TYPE donationstatusenum ADD VALUE IF NOT EXISTS 'cancelled'")


def downgrade() -> None:
    # Downgrading an enum value is not supported cleanly in Postgres.
    # Normally we would have to create a new type, move data, and drop the old type.
    # For now, we leave it as a no-op because removing an enum value is risky.
    pass
