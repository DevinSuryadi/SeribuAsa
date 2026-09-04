"""fix order pickup fields type from string to datetime

Revision ID: d199a5e31422
Revises: a1443f32202d
Create Date: 2026-05-07 11:52:36.195616

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd199a5e31422'
down_revision: Union[str, Sequence[str], None] = 'a1443f32202d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema — change order pickup fields from String to DateTime."""
    # Convert pickup_expires_at from String(50) to DateTime
    op.alter_column('orders', 'pickup_expires_at',
                    existing_type=sa.String(length=50),
                    type_=sa.DateTime(),
                    existing_nullable=True,
                    postgresql_using='pickup_expires_at::timestamp without time zone')
    
    # Convert cancel_deadline from String(50) to DateTime
    op.alter_column('orders', 'cancel_deadline',
                    existing_type=sa.String(length=50),
                    type_=sa.DateTime(),
                    existing_nullable=True,
                    postgresql_using='cancel_deadline::timestamp without time zone')


def downgrade() -> None:
    """Downgrade schema — revert DateTime back to String."""
    op.alter_column('orders', 'cancel_deadline',
                    existing_type=sa.DateTime(),
                    type_=sa.String(length=50),
                    existing_nullable=True)
    
    op.alter_column('orders', 'pickup_expires_at',
                    existing_type=sa.DateTime(),
                    type_=sa.String(length=50),
                    existing_nullable=True)
