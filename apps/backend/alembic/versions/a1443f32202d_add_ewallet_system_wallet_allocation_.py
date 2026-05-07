"""add_ewallet_system_wallet_allocation_wallet_transaction_pickup_qr

Revision ID: a1443f32202d
Revises: 6fd58cd8ceb7
Create Date: 2026-05-07 10:21:58.967717

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1443f32202d'
down_revision: Union[str, Sequence[str], None] = '6fd58cd8ceb7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema — E-Wallet system: wallet_allocations, wallet_transactions, pickup QR fields."""

    # ── Create wallet_allocations ──────────────────────────────────────────────
    op.create_table(
        'wallet_allocations',
        sa.Column('beneficiary_id',   sa.Uuid(), nullable=False),
        sa.Column('donation_id',      sa.Uuid(), nullable=True),
        sa.Column('original_amount',  sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('remaining_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('allocated_at',     sa.DateTime(), nullable=False),
        sa.Column('expires_at',       sa.DateTime(), nullable=False),
        sa.Column('status',    sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('id',        sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_active',  sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.ForeignKeyConstraint(['beneficiary_id'], ['beneficiary_profiles.user_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['donation_id'],    ['donations.id'],                 ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_wallet_allocation_beneficiary_status', 'wallet_allocations', ['beneficiary_id', 'status'])
    op.create_index('idx_wallet_allocation_expires',            'wallet_allocations', ['expires_at'])
    op.create_index(op.f('ix_wallet_allocations_beneficiary_id'), 'wallet_allocations', ['beneficiary_id'])
    op.create_index(op.f('ix_wallet_allocations_donation_id'),    'wallet_allocations', ['donation_id'])
    op.create_index(op.f('ix_wallet_allocations_expires_at'),     'wallet_allocations', ['expires_at'])
    op.create_index(op.f('ix_wallet_allocations_id'),             'wallet_allocations', ['id'])
    op.create_index(op.f('ix_wallet_allocations_is_active'),      'wallet_allocations', ['is_active'])
    op.create_index(op.f('ix_wallet_allocations_status'),         'wallet_allocations', ['status'])
    op.create_index(op.f('ix_wallet_allocations_created_at'),     'wallet_allocations', ['created_at'])

    # ── Create wallet_transactions ─────────────────────────────────────────────
    op.create_table(
        'wallet_transactions',
        sa.Column('beneficiary_id',   sa.Uuid(), nullable=False),
        sa.Column('order_id',         sa.Uuid(), nullable=True),
        sa.Column('allocation_id',    sa.Uuid(), nullable=True),
        sa.Column('transaction_type', sa.String(length=20), nullable=False),
        sa.Column('amount',           sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('balance_after',    sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('description',      sa.Text(), nullable=True),
        sa.Column('id',        sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_active',  sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.ForeignKeyConstraint(['allocation_id'],  ['wallet_allocations.id'],        ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['beneficiary_id'], ['beneficiary_profiles.user_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['order_id'],       ['orders.id'],                    ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_wallet_tx_beneficiary_created', 'wallet_transactions', ['beneficiary_id', 'created_at'])
    op.create_index('idx_wallet_tx_order',               'wallet_transactions', ['order_id'])
    op.create_index(op.f('ix_wallet_transactions_allocation_id'),    'wallet_transactions', ['allocation_id'])
    op.create_index(op.f('ix_wallet_transactions_beneficiary_id'),   'wallet_transactions', ['beneficiary_id'])
    op.create_index(op.f('ix_wallet_transactions_created_at'),       'wallet_transactions', ['created_at'])
    op.create_index(op.f('ix_wallet_transactions_id'),               'wallet_transactions', ['id'])
    op.create_index(op.f('ix_wallet_transactions_is_active'),        'wallet_transactions', ['is_active'])
    op.create_index(op.f('ix_wallet_transactions_order_id'),         'wallet_transactions', ['order_id'])
    op.create_index(op.f('ix_wallet_transactions_transaction_type'), 'wallet_transactions', ['transaction_type'])

    # ── Add wallet_held to beneficiary_profiles ───────────────────────────────
    op.add_column('beneficiary_profiles',
        sa.Column('wallet_held', sa.Numeric(precision=15, scale=2),
                  nullable=False, server_default=sa.text('0'))
    )

    # ── Add QR pickup columns to orders ───────────────────────────────────────
    op.add_column('orders', sa.Column('pickup_qr_code',        sa.String(length=100), nullable=True))
    op.add_column('orders', sa.Column('pickup_expires_at',      sa.String(length=50),  nullable=True))
    op.add_column('orders', sa.Column('cancel_deadline',        sa.String(length=50),  nullable=True))
    op.add_column('orders', sa.Column('confirmed_by_vendor_id', sa.Uuid(),             nullable=True))
    op.create_index(op.f('ix_orders_pickup_qr_code'), 'orders', ['pickup_qr_code'], unique=True)
    op.create_foreign_key(
        'fk_orders_confirmed_by_vendor',
        'orders', 'vendor_profiles',
        ['confirmed_by_vendor_id'], ['user_id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    """Downgrade schema — remove e-wallet system additions."""

    # Orders QR pickup columns
    op.drop_constraint('fk_orders_confirmed_by_vendor', 'orders', type_='foreignkey')
    op.drop_index(op.f('ix_orders_pickup_qr_code'), table_name='orders')
    op.drop_column('orders', 'confirmed_by_vendor_id')
    op.drop_column('orders', 'cancel_deadline')
    op.drop_column('orders', 'pickup_expires_at')
    op.drop_column('orders', 'pickup_qr_code')

    # wallet_held column
    op.drop_column('beneficiary_profiles', 'wallet_held')

    # wallet_transactions
    op.drop_index('idx_wallet_tx_order',               table_name='wallet_transactions')
    op.drop_index('idx_wallet_tx_beneficiary_created', table_name='wallet_transactions')
    op.drop_index(op.f('ix_wallet_transactions_transaction_type'), table_name='wallet_transactions')
    op.drop_index(op.f('ix_wallet_transactions_order_id'),         table_name='wallet_transactions')
    op.drop_index(op.f('ix_wallet_transactions_is_active'),        table_name='wallet_transactions')
    op.drop_index(op.f('ix_wallet_transactions_id'),               table_name='wallet_transactions')
    op.drop_index(op.f('ix_wallet_transactions_created_at'),       table_name='wallet_transactions')
    op.drop_index(op.f('ix_wallet_transactions_beneficiary_id'),   table_name='wallet_transactions')
    op.drop_index(op.f('ix_wallet_transactions_allocation_id'),    table_name='wallet_transactions')
    op.drop_table('wallet_transactions')

    # wallet_allocations
    op.drop_index('idx_wallet_allocation_expires',            table_name='wallet_allocations')
    op.drop_index('idx_wallet_allocation_beneficiary_status', table_name='wallet_allocations')
    op.drop_index(op.f('ix_wallet_allocations_status'),         table_name='wallet_allocations')
    op.drop_index(op.f('ix_wallet_allocations_is_active'),      table_name='wallet_allocations')
    op.drop_index(op.f('ix_wallet_allocations_id'),             table_name='wallet_allocations')
    op.drop_index(op.f('ix_wallet_allocations_expires_at'),     table_name='wallet_allocations')
    op.drop_index(op.f('ix_wallet_allocations_donation_id'),    table_name='wallet_allocations')
    op.drop_index(op.f('ix_wallet_allocations_created_at'),     table_name='wallet_allocations')
    op.drop_index(op.f('ix_wallet_allocations_beneficiary_id'), table_name='wallet_allocations')
    op.drop_table('wallet_allocations')
