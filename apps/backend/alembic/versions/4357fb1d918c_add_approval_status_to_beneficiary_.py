"""Add approval_status to beneficiary_profiles

Revision ID: 4357fb1d918c
Revises: 10c20bb3362d
Create Date: 2026-04-21 13:23:20.906006

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '4357fb1d918c'
down_revision: Union[str, Sequence[str], None] = '10c20bb3362d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add approval_status column to beneficiary_profiles."""
    op.add_column('beneficiary_profiles', sa.Column('approval_status', sa.String(length=50), nullable=True, server_default='pending'))


def downgrade() -> None:
    """Remove approval_status column from beneficiary_profiles."""
    op.drop_column('beneficiary_profiles', 'approval_status')
