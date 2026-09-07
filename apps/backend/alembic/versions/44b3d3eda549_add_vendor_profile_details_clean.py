"""Add vendor profile details clean

Revision ID: 44b3d3eda549
Revises: add_stunting_risk_predictions
Create Date: 2026-06-16 06:10:30.829371

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '44b3d3eda549'
down_revision: Union[str, Sequence[str], None] = 'add_stunting_risk_predictions'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('vendor_profiles', sa.Column('store_image_url', sa.String(length=500), nullable=True))
    op.add_column('vendor_profiles', sa.Column('operating_hours', sa.String(length=100), nullable=True))
    op.add_column('vendor_profiles', sa.Column('rating', sa.Numeric(precision=3, scale=1), nullable=True))
    op.add_column('vendor_profiles', sa.Column('total_transactions', sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('vendor_profiles', 'total_transactions')
    op.drop_column('vendor_profiles', 'rating')
    op.drop_column('vendor_profiles', 'operating_hours')
    op.drop_column('vendor_profiles', 'store_image_url')
