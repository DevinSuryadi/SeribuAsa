"""Add single-account facilities, KK-unique families, and donation funding links.

Revision ID: 8f3a0d7c21b4
Revises: 44b3d3eda549

Existing beneficiaries, orders, and wallet records remain in place. New family
records cannot be backfilled because the legacy schema has no KK or facility.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8f3a0d7c21b4"
down_revision: Union[str, Sequence[str], None] = "44b3d3eda549"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _base_columns() -> list[sa.Column]:
    return [
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    ]


def upgrade() -> None:
    op.create_table(
        "health_facilities",
        sa.Column("account_user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("facility_type", sa.String(100), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("approval_status", sa.String(30), nullable=False, server_default="pending"),
        *_base_columns(),
        sa.ForeignKeyConstraint(["account_user_id"], ["user_profiles.user_id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("account_user_id", name="uq_health_facilities_account_user_id"),
    )

    op.create_table(
        "recipient_families",
        sa.Column("health_facility_id", sa.Uuid(), nullable=False),
        sa.Column("kk_number", sa.String(16), nullable=False),
        sa.Column("head_name", sa.String(255), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("family_size", sa.Integer(), nullable=True),
        sa.Column("legacy_beneficiary_user_id", sa.Uuid(), nullable=True),
        *_base_columns(),
        sa.ForeignKeyConstraint(["health_facility_id"], ["health_facilities.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(
            ["legacy_beneficiary_user_id"], ["beneficiary_profiles.user_id"], ondelete="SET NULL"
        ),
        sa.UniqueConstraint("kk_number", name="uq_recipient_families_kk_number"),
        sa.UniqueConstraint("legacy_beneficiary_user_id", name="uq_recipient_families_legacy_user_id"),
        sa.UniqueConstraint("id", "health_facility_id", name="uq_recipient_families_id_facility"),
        sa.CheckConstraint("length(kk_number) = 16", name="ck_recipient_families_kk_length"),
        sa.CheckConstraint("family_size IS NULL OR family_size > 0", name="ck_recipient_families_family_size"),
    )
    op.create_index("ix_recipient_families_facility_active", "recipient_families", ["health_facility_id", "is_active"])

    # Preserve legacy owner IDs; exactly one of the old account or new family
    # owns each child and FIES survey.
    op.add_column("children", sa.Column("family_id", sa.Uuid(), nullable=True))
    op.alter_column("children", "beneficiary_id", existing_type=sa.Uuid(), nullable=True)
    op.create_foreign_key("fk_children_family_id", "children", "recipient_families", ["family_id"], ["id"], ondelete="RESTRICT")
    op.create_index("ix_children_family_id", "children", ["family_id"])
    op.create_check_constraint(
        "ck_children_one_owner", "children", "(beneficiary_id IS NOT NULL) <> (family_id IS NOT NULL)"
    )

    op.add_column("fies_surveys", sa.Column("family_id", sa.Uuid(), nullable=True))
    op.add_column("fies_surveys", sa.Column("recorded_by_user_id", sa.Uuid(), nullable=True))
    op.alter_column("fies_surveys", "beneficiary_id", existing_type=sa.Uuid(), nullable=True)
    op.create_foreign_key("fk_fies_surveys_family_id", "fies_surveys", "recipient_families", ["family_id"], ["id"], ondelete="RESTRICT")
    op.create_foreign_key(
        "fk_fies_surveys_recorded_by", "fies_surveys", "user_profiles",
        ["recorded_by_user_id"], ["user_id"], ondelete="SET NULL",
    )
    op.create_index("ix_fies_surveys_family_date", "fies_surveys", ["family_id", "survey_date"])
    op.create_check_constraint(
        "ck_fies_surveys_one_subject", "fies_surveys", "(beneficiary_id IS NOT NULL) <> (family_id IS NOT NULL)"
    )

    op.add_column("nutrition_measurements", sa.Column("recorded_by_user_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "fk_nutrition_measurements_recorded_by", "nutrition_measurements", "user_profiles",
        ["recorded_by_user_id"], ["user_id"], ondelete="SET NULL",
    )

    op.add_column("orders", sa.Column("family_id", sa.Uuid(), nullable=True))
    op.add_column("orders", sa.Column("health_facility_id", sa.Uuid(), nullable=True))
    op.add_column("orders", sa.Column("placed_by_user_id", sa.Uuid(), nullable=True))
    op.add_column("orders", sa.Column("order_flow", sa.String(30), nullable=False, server_default="legacy_pickup"))
    op.add_column("orders", sa.Column("delivery_address_snapshot", sa.Text(), nullable=True))
    op.alter_column("orders", "beneficiary_id", existing_type=sa.Uuid(), nullable=True)
    op.create_foreign_key(
        "fk_orders_family_facility", "orders", "recipient_families",
        ["family_id", "health_facility_id"], ["id", "health_facility_id"], ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_orders_placed_by", "orders", "user_profiles",
        ["placed_by_user_id"], ["user_id"], ondelete="SET NULL",
    )
    op.create_index("ix_orders_family_id", "orders", ["family_id"])
    op.create_index("ix_orders_health_facility_id", "orders", ["health_facility_id"])
    op.create_check_constraint(
        "ck_orders_flow_owner", "orders",
        "(order_flow = 'legacy_pickup' AND beneficiary_id IS NOT NULL AND family_id IS NULL "
        "AND health_facility_id IS NULL) OR "
        "(order_flow = 'facility_delivery' AND beneficiary_id IS NULL AND family_id IS NOT NULL "
        "AND health_facility_id IS NOT NULL)",
    )
    op.create_unique_constraint("uq_orders_id_family", "orders", ["id", "family_id"])
    op.create_unique_constraint("uq_order_items_id_order", "order_items", ["id", "order_id"])

    # Existing donations were credited to beneficiary wallets. They must never
    # be available to the new pooled-fund allocator a second time.
    op.add_column("donations", sa.Column("funding_flow", sa.String(30), nullable=False, server_default="legacy_wallet"))
    op.create_check_constraint(
        "ck_donations_funding_flow", "donations", "funding_flow IN ('legacy_wallet', 'pooled')"
    )

    # One donation can fund several orders; one order can use several donations.
    # The exact amount remains attached to each donation-order pair.
    op.create_table(
        "order_funding_allocations",
        sa.Column("donation_id", sa.Uuid(), nullable=False),
        sa.Column("order_id", sa.Uuid(), nullable=False),
        sa.Column("amount", sa.Numeric(15, 2), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="reserved"),
        sa.Column("reserved_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("spent_at", sa.DateTime(), nullable=True),
        sa.Column("released_at", sa.DateTime(), nullable=True),
        *_base_columns(),
        sa.ForeignKeyConstraint(["donation_id"], ["donations.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("donation_id", "order_id", name="uq_order_funding_donation_order"),
        sa.CheckConstraint("amount > 0", name="ck_order_funding_allocations_positive_amount"),
        sa.CheckConstraint(
            "status IN ('reserved', 'spent', 'released')", name="ck_order_funding_allocations_status"
        ),
    )
    op.create_index("ix_order_funding_allocations_order_status", "order_funding_allocations", ["order_id", "status"])
    op.create_index("ix_order_funding_allocations_donation_status", "order_funding_allocations", ["donation_id", "status"])

    op.create_table(
        "order_handover_tokens",
        sa.Column("order_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("consumed_at", sa.DateTime(), nullable=True),
        sa.Column("consumed_by_user_id", sa.Uuid(), nullable=True),
        *_base_columns(),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["consumed_by_user_id"], ["user_profiles.user_id"], ondelete="SET NULL"),
        sa.UniqueConstraint("token_hash", name="uq_order_handover_tokens_hash"),
        sa.UniqueConstraint("id", "order_id", name="uq_order_handover_tokens_id_order"),
    )
    op.create_index("ix_order_handover_tokens_order_id", "order_handover_tokens", ["order_id"])

    op.create_table(
        "facility_order_receipts",
        sa.Column("order_id", sa.Uuid(), nullable=False),
        sa.Column("handover_token_id", sa.Uuid(), nullable=False),
        sa.Column("received_by_user_id", sa.Uuid(), nullable=False),
        sa.Column("received_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("notes", sa.Text(), nullable=True),
        *_base_columns(),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(
            ["handover_token_id", "order_id"],
            ["order_handover_tokens.id", "order_handover_tokens.order_id"],
            ondelete="RESTRICT", name="fk_facility_receipt_token_order",
        ),
        sa.ForeignKeyConstraint(["received_by_user_id"], ["user_profiles.user_id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("order_id", name="uq_facility_order_receipts_order_id"),
        sa.UniqueConstraint("handover_token_id", name="uq_facility_order_receipts_token_id"),
    )

    op.create_table(
        "aid_distributions",
        sa.Column("order_id", sa.Uuid(), nullable=False),
        sa.Column("family_id", sa.Uuid(), nullable=False),
        sa.Column("recorded_by_user_id", sa.Uuid(), nullable=False),
        sa.Column("distributed_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("notes", sa.Text(), nullable=True),
        *_base_columns(),
        sa.ForeignKeyConstraint(
            ["order_id", "family_id"], ["orders.id", "orders.family_id"],
            ondelete="RESTRICT", name="fk_aid_distributions_order_family",
        ),
        sa.ForeignKeyConstraint(["family_id"], ["recipient_families.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["recorded_by_user_id"], ["user_profiles.user_id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("id", "order_id", name="uq_aid_distributions_id_order"),
    )
    op.create_index("ix_aid_distributions_order_id", "aid_distributions", ["order_id"])
    op.create_index("ix_aid_distributions_family_date", "aid_distributions", ["family_id", "distributed_at"])

    op.create_table(
        "aid_distribution_items",
        sa.Column("distribution_id", sa.Uuid(), nullable=False),
        sa.Column("order_item_id", sa.Uuid(), nullable=False),
        sa.Column("order_id", sa.Uuid(), nullable=False),
        sa.Column("quantity", sa.Numeric(12, 2), nullable=False),
        *_base_columns(),
        sa.ForeignKeyConstraint(
            ["distribution_id", "order_id"],
            ["aid_distributions.id", "aid_distributions.order_id"],
            ondelete="RESTRICT", name="fk_aid_distribution_items_distribution_order",
        ),
        sa.ForeignKeyConstraint(
            ["order_item_id", "order_id"], ["order_items.id", "order_items.order_id"],
            ondelete="RESTRICT", name="fk_aid_distribution_items_item_order",
        ),
        sa.UniqueConstraint("distribution_id", "order_item_id", name="uq_aid_distribution_item"),
        sa.CheckConstraint("quantity > 0", name="ck_aid_distribution_items_quantity"),
    )

    # PostgreSQL-only protections for pooled funding and direct Supabase access.
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'health_facility'")
        op.execute('DROP POLICY IF EXISTS "Users can insert their own role on signup" ON public.user_roles')
        op.execute("""
            CREATE POLICY "Users can insert their own role on signup"
            ON public.user_roles FOR INSERT TO authenticated
            WITH CHECK (
                auth.uid() = user_id AND role IN (
                    'donor'::public.app_role, 'corporate_donor'::public.app_role,
                    'beneficiary'::public.app_role, 'vendor'::public.app_role
                )
            )
        """)
        for table in (
            "health_facilities", "recipient_families", "order_funding_allocations",
            "order_handover_tokens", "facility_order_receipts", "aid_distributions",
            "aid_distribution_items",
        ):
            op.execute(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY")
        op.execute("""
            CREATE FUNCTION public.validate_order_funding_allocation()
            RETURNS trigger LANGUAGE plpgsql AS $$
            DECLARE
                donation_total numeric(15, 2);
                donation_state text;
                donation_flow text;
                order_total numeric(15, 2);
                flow text;
                used_donation numeric(15, 2);
                used_order numeric(15, 2);
                excluded_id uuid;
            BEGIN
                IF TG_OP = 'UPDATE' THEN
                    excluded_id := OLD.id;
                    IF OLD.status = 'spent' AND NEW.status <> 'spent' THEN
                        RAISE EXCEPTION 'Spent funding cannot be released';
                    END IF;
                END IF;
                SELECT amount, status::text, funding_flow
                INTO donation_total, donation_state, donation_flow
                FROM public.donations WHERE id = NEW.donation_id FOR UPDATE;
                IF donation_state IS DISTINCT FROM 'success' THEN
                    RAISE EXCEPTION 'Only successful donations can fund orders';
                END IF;
                IF donation_flow IS DISTINCT FROM 'pooled' THEN
                    RAISE EXCEPTION 'Legacy wallet donations cannot fund facility orders';
                END IF;
                SELECT total_amount, order_flow INTO order_total, flow
                FROM public.orders WHERE id = NEW.order_id FOR UPDATE;
                IF flow IS DISTINCT FROM 'facility_delivery' THEN
                    RAISE EXCEPTION 'Funding allocation requires a facility order';
                END IF;
                IF NEW.status IN ('reserved', 'spent') THEN
                    SELECT COALESCE(SUM(amount), 0) INTO used_donation
                    FROM public.order_funding_allocations
                    WHERE donation_id = NEW.donation_id AND status IN ('reserved', 'spent')
                      AND (excluded_id IS NULL OR id <> excluded_id);
                    SELECT COALESCE(SUM(amount), 0) INTO used_order
                    FROM public.order_funding_allocations
                    WHERE order_id = NEW.order_id AND status IN ('reserved', 'spent')
                      AND (excluded_id IS NULL OR id <> excluded_id);
                    IF used_donation + NEW.amount > donation_total THEN
                        RAISE EXCEPTION 'Donation funding exceeds donation amount';
                    END IF;
                    IF used_order + NEW.amount > order_total THEN
                        RAISE EXCEPTION 'Order funding exceeds order total';
                    END IF;
                END IF;
                RETURN NEW;
            END;
            $$
        """)
        op.execute("""
            CREATE TRIGGER validate_order_funding_allocation
            BEFORE INSERT OR UPDATE ON public.order_funding_allocations
            FOR EACH ROW EXECUTE FUNCTION public.validate_order_funding_allocation()
        """)


def downgrade() -> None:
    raise RuntimeError(
        "This migration preserves legacy data and may contain new family/funding records; "
        "write a reviewed data migration before downgrading."
    )
