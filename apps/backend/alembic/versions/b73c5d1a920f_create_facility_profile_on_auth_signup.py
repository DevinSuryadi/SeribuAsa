"""Create facility records when Supabase Auth creates a facility account.

Revision ID: b73c5d1a920f
Revises: 8f3a0d7c21b4

This also fills in facility Auth accounts created before this trigger existed.
Existing beneficiary and other role records are left untouched.
"""

from typing import Sequence, Union

from alembic import op


revision: str = "b73c5d1a920f"
down_revision: Union[str, Sequence[str], None] = "8f3a0d7c21b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE FUNCTION public.ensure_health_facility_from_auth(p_user_id uuid, p_metadata jsonb)
        RETURNS void
        LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
        AS $function$
        DECLARE
            facility_name text;
            account_name text;
        BEGIN
            IF p_metadata->>'role' IS DISTINCT FROM 'health_facility' THEN
                RETURN;
            END IF;

            facility_name := NULLIF(left(btrim(p_metadata->>'facility_name'), 255), '');
            IF facility_name IS NULL THEN
                RETURN;
            END IF;
            account_name := COALESCE(NULLIF(left(btrim(p_metadata->>'full_name'), 255), ''), facility_name);

            INSERT INTO public.user_profiles (id, user_id, full_name, phone, address, is_active, created_at)
            VALUES (
                gen_random_uuid(), p_user_id, account_name,
                NULLIF(left(btrim(p_metadata->>'phone'), 20), ''),
                NULLIF(btrim(p_metadata->>'address'), ''), true, CURRENT_TIMESTAMP
            )
            ON CONFLICT (user_id) DO NOTHING;

            IF EXISTS (SELECT 1 FROM public.donor_profiles WHERE user_id = p_user_id)
               OR EXISTS (SELECT 1 FROM public.beneficiary_profiles WHERE user_id = p_user_id)
               OR EXISTS (SELECT 1 FROM public.vendor_profiles WHERE user_id = p_user_id) THEN
                RETURN;
            END IF;

            INSERT INTO public.health_facilities
                (id, account_user_id, name, facility_type, address, phone, approval_status, is_active)
            VALUES (
                gen_random_uuid(), p_user_id, facility_name,
                NULLIF(left(btrim(p_metadata->>'facility_type'), 100), ''),
                NULLIF(btrim(p_metadata->>'address'), ''),
                NULLIF(left(btrim(p_metadata->>'phone'), 20), ''),
                'pending', true
            )
            ON CONFLICT (account_user_id) DO NOTHING;
        END;
        $function$
    """)
    op.execute("REVOKE ALL ON FUNCTION public.ensure_health_facility_from_auth(uuid, jsonb) FROM PUBLIC")

    op.execute("""
        CREATE FUNCTION public.on_auth_user_created_health_facility()
        RETURNS trigger
        LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
        AS $function$
        BEGIN
            PERFORM public.ensure_health_facility_from_auth(NEW.id, NEW.raw_user_meta_data);
            RETURN NEW;
        END;
        $function$
    """)
    op.execute("REVOKE ALL ON FUNCTION public.on_auth_user_created_health_facility() FROM PUBLIC")
    op.execute("""
        CREATE TRIGGER on_auth_user_created_health_facility
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.on_auth_user_created_health_facility()
    """)

    op.execute("""
        DO $backfill$
        DECLARE facility_account record;
        BEGIN
            FOR facility_account IN
                SELECT id, raw_user_meta_data FROM auth.users
                WHERE raw_user_meta_data->>'role' = 'health_facility'
            LOOP
                PERFORM public.ensure_health_facility_from_auth(
                    facility_account.id, facility_account.raw_user_meta_data
                );
            END LOOP;
        END;
        $backfill$
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS on_auth_user_created_health_facility ON auth.users")
    op.execute("DROP FUNCTION IF EXISTS public.on_auth_user_created_health_facility()")
    op.execute("DROP FUNCTION IF EXISTS public.ensure_health_facility_from_auth(uuid, jsonb)")
