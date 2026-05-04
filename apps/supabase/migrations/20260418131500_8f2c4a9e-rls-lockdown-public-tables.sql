-- Enable RLS and lock down API access for backend-managed public tables.
-- This addresses Supabase lints:
-- - rls_disabled_in_public
-- - sensitive_columns_exposed

DO $$
DECLARE
  table_name text;
  target_tables text[] := ARRAY[
    'alembic_version',
    'voucher_redemptions',
    'voucher_allowed_categories',
    'user_profiles',
    'audit_logs',
    'beneficiary_profiles',
    'donor_profiles',
    'vendor_profiles',
    'children',
    'donations',
    'fies_surveys',
    'orders',
    'categories',
    'products',
    'settlements',
    'nutrition_measurements',
    'order_items',
    'vouchers',
    'cart_items',
    'voucher_locks',
    'voucher_transactions'
  ];
BEGIN
  FOREACH table_name IN ARRAY target_tables LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
        AND tablename = table_name
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', table_name);
    END IF;
  END LOOP;
END
$$;
