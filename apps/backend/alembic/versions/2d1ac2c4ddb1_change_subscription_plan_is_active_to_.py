"""change subscription plan is_active to boolean

Revision ID: 2d1ac2c4ddb1
Revises: add_subscription_id_to_donations
Create Date: 2026-05-07 09:13:40.751612

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2d1ac2c4ddb1'
down_revision: Union[str, Sequence[str], None] = 'add_subscription_id_to_donations'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("""
        ALTER TABLE subscription_plans
        ALTER COLUMN is_active TYPE boolean
        USING (is_active::boolean)
    """)
    op.alter_column('subscription_plans', 'is_active',
                    existing_type=sa.String(length=10),
                    type_=sa.Boolean(),
                    existing_nullable=True,
                    server_default=sa.text('true'))


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('subscription_plans', 'is_active',
                    existing_type=sa.Boolean(),
                    type_=sa.String(length=10),
                    existing_nullable=True,
                    server_default=None)
    op.execute("""
        ALTER TABLE subscription_plans
        ALTER COLUMN is_active TYPE text
        USING (is_active::text)
    """)
