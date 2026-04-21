"""Add wallet_balance to vendor_profiles

Revision ID: 10c20bb3362d
Revises: add_cart_voucher_2026
Create Date: 2026-04-19 20:37:57.869145

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '10c20bb3362d'
down_revision: Union[str, Sequence[str], None] = 'add_cart_voucher_2026'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('withdrawals',
    sa.Column('vendor_id', sa.Uuid(), nullable=False),
    sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
    sa.Column('bank_name', sa.String(length=100), nullable=True),
    sa.Column('bank_account_number', sa.String(length=50), nullable=True),
    sa.Column('bank_account_holder', sa.String(length=255), nullable=True),
    sa.Column('status', sa.String(length=50), nullable=False),
    sa.Column('transfer_reference', sa.String(length=255), nullable=True),
    sa.Column('completed_at', sa.DateTime(), nullable=True),
    sa.Column('notes', sa.String(length=500), nullable=True),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['vendor_id'], ['vendor_profiles.user_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_withdrawals_created_at'), 'withdrawals', ['created_at'], unique=False)
    op.create_index(op.f('ix_withdrawals_id'), 'withdrawals', ['id'], unique=False)
    op.create_index(op.f('ix_withdrawals_is_active'), 'withdrawals', ['is_active'], unique=False)
    op.create_index(op.f('ix_withdrawals_status'), 'withdrawals', ['status'], unique=False)
    op.create_index(op.f('ix_withdrawals_vendor_id'), 'withdrawals', ['vendor_id'], unique=False)
    
    op.add_column('vendor_profiles', sa.Column('wallet_balance', sa.Numeric(precision=15, scale=2), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('vendor_profiles', 'wallet_balance')
    
    op.drop_index(op.f('ix_withdrawals_vendor_id'), table_name='withdrawals')
    op.drop_index(op.f('ix_withdrawals_status'), table_name='withdrawals')
    op.drop_index(op.f('ix_withdrawals_is_active'), table_name='withdrawals')
    op.drop_index(op.f('ix_withdrawals_id'), table_name='withdrawals')
    op.drop_index(op.f('ix_withdrawals_created_at'), table_name='withdrawals')
    op.drop_table('withdrawals')
