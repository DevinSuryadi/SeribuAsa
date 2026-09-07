"""Add subscription_id to donations table

Revision ID: add_subscription_id_to_donations
Revises: previous
Create Date: 2026-04-22

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_subscription_id_to_donations'
down_revision: Union[str, Sequence[str], None] = '4357fb1d918c'  # Previous migration
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add subscription_id column to donations table."""
    # Add subscription_id column
    op.add_column(
        'donations',
        sa.Column(
            'subscription_id',
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey('subscriptions.id', ondelete='SET NULL'),
            nullable=True
        )
    )
    
    # Create index for performance
    op.create_index(
        'idx_donation_subscription',
        'donations',
        ['subscription_id']
    )


def downgrade() -> None:
    """Remove subscription_id column from donations table."""
    # Drop index first
    op.drop_index('idx_donation_subscription', table_name='donations')
    
    # Drop column
    op.drop_column('donations', 'subscription_id')
