"""add partial indexes for active records

Revision ID: 6fd58cd8ceb7
Revises: 2d1ac2c4ddb1
Create Date: 2026-05-07 09:14:29.954954

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '6fd58cd8ceb7'
down_revision: Union[str, Sequence[str], None] = '2d1ac2c4ddb1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Partial indexes for commonly filtered active records
    op.execute("CREATE INDEX idx_user_profiles_active ON user_profiles (created_at) WHERE is_active = true")
    op.execute("CREATE INDEX idx_donor_profiles_active ON donor_profiles (user_id) WHERE is_active = true")
    op.execute("CREATE INDEX idx_beneficiary_profiles_active ON beneficiary_profiles (user_id) WHERE is_active = true")
    op.execute("CREATE INDEX idx_vendor_profiles_active ON vendor_profiles (user_id) WHERE is_active = true")
    op.execute("CREATE INDEX idx_donations_active_status ON donations (created_at, status) WHERE is_active = true")
    op.execute("CREATE INDEX idx_orders_active_status ON orders (created_at, status) WHERE is_active = true")
    op.execute("CREATE INDEX idx_products_active_approval ON products (approval_status) WHERE is_active = true")
    op.execute("CREATE INDEX idx_vouchers_active_status ON vouchers (status, expiry_date) WHERE is_active = true")
    op.execute("CREATE INDEX idx_audit_logs_active ON audit_logs (created_at) WHERE is_active = true")
    op.execute("CREATE INDEX idx_children_active ON children (beneficiary_id) WHERE is_active = true")
    op.execute("CREATE INDEX idx_fies_surveys_active ON fies_surveys (survey_year, survey_month) WHERE is_active = true")
    op.execute("CREATE INDEX idx_settlements_active ON settlements (period_start) WHERE is_active = true")
    op.execute("CREATE INDEX idx_nutrition_measurements_active ON nutrition_measurements (measurement_date) WHERE is_active = true")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP INDEX IF EXISTS idx_user_profiles_active")
    op.execute("DROP INDEX IF EXISTS idx_donor_profiles_active")
    op.execute("DROP INDEX IF EXISTS idx_beneficiary_profiles_active")
    op.execute("DROP INDEX IF EXISTS idx_vendor_profiles_active")
    op.execute("DROP INDEX IF EXISTS idx_donations_active_status")
    op.execute("DROP INDEX IF EXISTS idx_orders_active_status")
    op.execute("DROP INDEX IF EXISTS idx_products_active_approval")
    op.execute("DROP INDEX IF EXISTS idx_vouchers_active_status")
    op.execute("DROP INDEX IF EXISTS idx_audit_logs_active")
    op.execute("DROP INDEX IF EXISTS idx_children_active")
    op.execute("DROP INDEX IF EXISTS idx_fies_surveys_active")
    op.execute("DROP INDEX IF EXISTS idx_settlements_active")
    op.execute("DROP INDEX IF EXISTS idx_nutrition_measurements_active")
