"""add_cart_and_voucher_transaction_tables

Revision ID: add_cart_voucher_2026
Revises: 4ce68591e959
Create Date: 2026-04-14 22:35:57.996476

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_cart_voucher_2026'
down_revision: Union[str, Sequence[str], None] = '4ce68591e959'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create voucher_allowed_categories table
    op.create_table('voucher_allowed_categories',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('category_id', sa.Uuid(), nullable=False),
    sa.Column('is_allowed', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_allowed_category', 'voucher_allowed_categories', ['category_id', 'is_allowed'], unique=False)
    op.create_index(op.f('ix_voucher_allowed_categories_category_id'), 'voucher_allowed_categories', ['category_id'], unique=False)
    op.create_index(op.f('ix_voucher_allowed_categories_created_at'), 'voucher_allowed_categories', ['created_at'], unique=False)
    op.create_index(op.f('ix_voucher_allowed_categories_id'), 'voucher_allowed_categories', ['id'], unique=False)
    op.create_index(op.f('ix_voucher_allowed_categories_is_active'), 'voucher_allowed_categories', ['is_active'], unique=False)
    
    # Create cart_items table
    op.create_table('cart_items',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('beneficiary_id', sa.Uuid(), nullable=False),
    sa.Column('product_id', sa.Uuid(), nullable=False),
    sa.Column('quantity', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['beneficiary_id'], ['beneficiary_profiles.user_id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_cart_beneficiary_created', 'cart_items', ['beneficiary_id', 'created_at'], unique=False)
    op.create_index('idx_cart_beneficiary_product', 'cart_items', ['beneficiary_id', 'product_id'], unique=True)
    op.create_index(op.f('ix_cart_items_beneficiary_id'), 'cart_items', ['beneficiary_id'], unique=False)
    op.create_index(op.f('ix_cart_items_created_at'), 'cart_items', ['created_at'], unique=False)
    op.create_index(op.f('ix_cart_items_id'), 'cart_items', ['id'], unique=False)
    op.create_index(op.f('ix_cart_items_is_active'), 'cart_items', ['is_active'], unique=False)
    op.create_index(op.f('ix_cart_items_product_id'), 'cart_items', ['product_id'], unique=False)
    
    # Create voucher_locks table
    op.create_table('voucher_locks',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('voucher_id', sa.Uuid(), nullable=False),
    sa.Column('locked_at', sa.DateTime(), nullable=False),
    sa.Column('expires_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['voucher_id'], ['vouchers.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_voucher_lock_expires', 'voucher_locks', ['expires_at'], unique=False)
    op.create_index(op.f('ix_voucher_locks_created_at'), 'voucher_locks', ['created_at'], unique=False)
    op.create_index(op.f('ix_voucher_locks_expires_at'), 'voucher_locks', ['expires_at'], unique=False)
    op.create_index(op.f('ix_voucher_locks_id'), 'voucher_locks', ['id'], unique=False)
    op.create_index(op.f('ix_voucher_locks_is_active'), 'voucher_locks', ['is_active'], unique=False)
    op.create_index(op.f('ix_voucher_locks_voucher_id'), 'voucher_locks', ['voucher_id'], unique=True)
    
    # Create voucher_transactions table
    op.create_table('voucher_transactions',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('voucher_id', sa.Uuid(), nullable=False),
    sa.Column('order_id', sa.Uuid(), nullable=True),
    sa.Column('transaction_type', sa.Enum('allocated', 'redeemed', 'expired', 'adjusted', 'revoked', name='vouchertransactiontypeenum'), nullable=False),
    sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
    sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['voucher_id'], ['vouchers.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_voucher_transaction_created', 'voucher_transactions', ['voucher_id', 'created_at'], unique=False)
    op.create_index('idx_voucher_transaction_type', 'voucher_transactions', ['voucher_id', 'transaction_type'], unique=False)
    op.create_index(op.f('ix_voucher_transactions_created_at'), 'voucher_transactions', ['created_at'], unique=False)
    op.create_index(op.f('ix_voucher_transactions_id'), 'voucher_transactions', ['id'], unique=False)
    op.create_index(op.f('ix_voucher_transactions_is_active'), 'voucher_transactions', ['is_active'], unique=False)
    op.create_index(op.f('ix_voucher_transactions_order_id'), 'voucher_transactions', ['order_id'], unique=False)
    op.create_index(op.f('ix_voucher_transactions_transaction_type'), 'voucher_transactions', ['transaction_type'], unique=False)
    op.create_index(op.f('ix_voucher_transactions_voucher_id'), 'voucher_transactions', ['voucher_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop voucher_transactions
    op.drop_index(op.f('ix_voucher_transactions_voucher_id'), table_name='voucher_transactions')
    op.drop_index(op.f('ix_voucher_transactions_transaction_type'), table_name='voucher_transactions')
    op.drop_index(op.f('ix_voucher_transactions_order_id'), table_name='voucher_transactions')
    op.drop_index(op.f('ix_voucher_transactions_is_active'), table_name='voucher_transactions')
    op.drop_index(op.f('ix_voucher_transactions_id'), table_name='voucher_transactions')
    op.drop_index(op.f('ix_voucher_transactions_created_at'), table_name='voucher_transactions')
    op.drop_index('idx_voucher_transaction_type', table_name='voucher_transactions')
    op.drop_index('idx_voucher_transaction_created', table_name='voucher_transactions')
    op.drop_table('voucher_transactions')
    
    # Drop voucher_locks
    op.drop_index(op.f('ix_voucher_locks_voucher_id'), table_name='voucher_locks')
    op.drop_index(op.f('ix_voucher_locks_is_active'), table_name='voucher_locks')
    op.drop_index(op.f('ix_voucher_locks_id'), table_name='voucher_locks')
    op.drop_index(op.f('ix_voucher_locks_expires_at'), table_name='voucher_locks')
    op.drop_index(op.f('ix_voucher_locks_created_at'), table_name='voucher_locks')
    op.drop_index('idx_voucher_lock_expires', table_name='voucher_locks')
    op.drop_table('voucher_locks')
    
    # Drop cart_items
    op.drop_index(op.f('ix_cart_items_product_id'), table_name='cart_items')
    op.drop_index(op.f('ix_cart_items_is_active'), table_name='cart_items')
    op.drop_index(op.f('ix_cart_items_id'), table_name='cart_items')
    op.drop_index(op.f('ix_cart_items_created_at'), table_name='cart_items')
    op.drop_index(op.f('ix_cart_items_beneficiary_id'), table_name='cart_items')
    op.drop_index('idx_cart_beneficiary_product', table_name='cart_items')
    op.drop_index('idx_cart_beneficiary_created', table_name='cart_items')
    op.drop_table('cart_items')
    
    # Drop voucher_allowed_categories
    op.drop_index(op.f('ix_voucher_allowed_categories_is_active'), table_name='voucher_allowed_categories')
    op.drop_index(op.f('ix_voucher_allowed_categories_id'), table_name='voucher_allowed_categories')
    op.drop_index(op.f('ix_voucher_allowed_categories_created_at'), table_name='voucher_allowed_categories')
    op.drop_index(op.f('ix_voucher_allowed_categories_category_id'), table_name='voucher_allowed_categories')
    op.drop_index('idx_allowed_category', table_name='voucher_allowed_categories')
    op.drop_table('voucher_allowed_categories')
