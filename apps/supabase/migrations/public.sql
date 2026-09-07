--
-- PostgreSQL database dump
--

\restrict Yz7pUB0KPAznkzPyAl7OlaXogjpNZuDoHlRBJ4MHRQCyQnc6QAJDafGvpotoWG1

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'donor',
    'corporate_donor',
    'beneficiary',
    'vendor',
    'admin',
    'government'
);


--
-- Name: billingstatusenum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.billingstatusenum AS ENUM (
    'pending',
    'success',
    'failed'
);


--
-- Name: donationstatusenum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.donationstatusenum AS ENUM (
    'pending',
    'success',
    'failed',
    'refunded',
    'cancelled'
);


--
-- Name: donationtypeenum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.donationtypeenum AS ENUM (
    'one_time',
    'subscription'
);


--
-- Name: genderenum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.genderenum AS ENUM (
    'male',
    'female'
);


--
-- Name: subscriptionstatusenum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscriptionstatusenum AS ENUM (
    'active',
    'paused',
    'cancelled'
);


--
-- Name: voucherstatusenum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.voucherstatusenum AS ENUM (
    'active',
    'redeemed',
    'expired',
    'cancelled'
);


--
-- Name: vouchertransactiontypeenum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.vouchertransactiontypeenum AS ENUM (
    'allocated',
    'redeemed',
    'expired',
    'adjusted',
    'revoked'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    user_id uuid,
    action character varying(100) NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id uuid,
    old_values json,
    new_values json,
    ip_address character varying(50),
    user_agent character varying(500),
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL
);


--
-- Name: beneficiary_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.beneficiary_profiles (
    user_id uuid NOT NULL,
    family_size integer,
    vouchers_balance numeric(15,2),
    fies_score integer,
    fies_classification character varying(50),
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL,
    approval_status character varying(50) DEFAULT 'pending'::character varying,
    wallet_held numeric(15,2) DEFAULT 0
);


--
-- Name: billing_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_history (
    subscription_id uuid NOT NULL,
    amount numeric(15,2) NOT NULL,
    currency character varying(3),
    status public.billingstatusenum NOT NULL,
    payment_method character varying(50),
    transaction_id character varying(255),
    billing_date date NOT NULL,
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL
);


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL,
    beneficiary_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    name character varying(100) NOT NULL,
    slug character varying(100),
    description text,
    icon_url character varying(500),
    display_order integer,
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL
);


--
-- Name: children; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.children (
    beneficiary_id uuid NOT NULL,
    full_name character varying(255) NOT NULL,
    date_of_birth date NOT NULL,
    gender public.genderenum,
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL
);


--
-- Name: donations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.donations (
    donor_id uuid NOT NULL,
    recipient_id uuid,
    amount numeric(15,2) NOT NULL,
    type public.donationtypeenum NOT NULL,
    status public.donationstatusenum NOT NULL,
    payment_method character varying(50),
    midtrans_transaction_id character varying(255),
    subscription_config json,
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL,
    subscription_id uuid
);


--
-- Name: donor_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.donor_profiles (
    user_id uuid NOT NULL,
    total_donated numeric(15,2),
    children_sponsored integer,
    subscription_status character varying(50),
    corporate_name character varying(255),
    tax_id character varying(50),
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL
);


--
-- Name: fies_surveys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fies_surveys (
    beneficiary_id uuid NOT NULL,
    responses json NOT NULL,
    score integer NOT NULL,
    classification character varying(50) NOT NULL,
    survey_date timestamp without time zone NOT NULL,
    survey_month integer NOT NULL,
    survey_year integer NOT NULL,
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL
);


--
-- Name: nutrition_measurements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nutrition_measurements (
    child_id uuid NOT NULL,
    measurement_date date NOT NULL,
    weight numeric(5,2) NOT NULL,
    height numeric(5,2) NOT NULL,
    muac numeric(5,2),
    z_score_weight numeric(5,2),
    z_score_height numeric(5,2),
    z_score_weight_height numeric(5,2),
    classification character varying(50),
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    price numeric(15,2) NOT NULL,
    subtotal numeric(15,2) NOT NULL,
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    beneficiary_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    total_amount numeric(15,2) NOT NULL,
    voucher_used numeric(15,2),
    cash_paid numeric(15,2),
    status character varying(50) NOT NULL,
    payment_status character varying(50),
    notes text,
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL,
    pickup_qr_code character varying(100),
    pickup_expires_at timestamp without time zone,
    cancel_deadline timestamp without time zone,
    confirmed_by_vendor_id uuid
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    vendor_id uuid NOT NULL,
    category_id uuid,
    name character varying(255) NOT NULL,
    description text,
    price numeric(15,2) NOT NULL,
    voucher_price numeric(15,2) NOT NULL,
    stock_quantity integer,
    unit character varying(50),
    images json,
    approval_status character varying(50),
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text,
    phone text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: settlements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settlements (
    vendor_id uuid NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    total_redemptions numeric(15,2) NOT NULL,
    admin_fee numeric(15,2),
    net_amount numeric(15,2) NOT NULL,
    status character varying(50) NOT NULL,
    payout_date date,
    bank_transfer_reference character varying(255),
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL
);


--
-- Name: stunting_risk_predictions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stunting_risk_predictions (
    id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean DEFAULT true NOT NULL,
    child_id uuid NOT NULL,
    measurement_id uuid,
    risk_score numeric(5,4) NOT NULL,
    risk_level character varying(20) NOT NULL,
    horizon_months integer DEFAULT 3 NOT NULL,
    features jsonb NOT NULL,
    dominant_factors jsonb,
    model_version character varying(50) DEFAULT 'logreg-v1'::character varying NOT NULL
);


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    name character varying(255) NOT NULL,
    description character varying(500),
    price numeric(15,2) NOT NULL,
    currency character varying(3),
    frequency character varying(20),
    features json,
    is_active boolean DEFAULT true,
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    donor_id uuid NOT NULL,
    plan_id uuid,
    plan_name character varying(255) NOT NULL,
    amount numeric(15,2) NOT NULL,
    currency character varying(3),
    frequency character varying(20),
    status public.subscriptionstatusenum NOT NULL,
    payment_method character varying(50),
    next_billing_date date NOT NULL,
    started_at timestamp without time zone,
    cancelled_at timestamp without time zone,
    paused_at timestamp without time zone,
    meta_data json,
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL
);


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    user_id uuid NOT NULL,
    full_name character varying(255) NOT NULL,
    nik character varying(16),
    phone character varying(20),
    address text,
    date_of_birth date,
    gender public.genderenum,
    avatar_url character varying(500),
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vendor_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_profiles (
    user_id uuid NOT NULL,
    store_name character varying(255) NOT NULL,
    store_address text NOT NULL,
    store_phone character varying(20),
    bank_name character varying(100),
    bank_account_number character varying(50),
    bank_account_holder character varying(255),
    settlement_status character varying(50),
    approval_status character varying(50),
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL,
    wallet_balance numeric(15,2),
    store_image_url character varying(500),
    operating_hours character varying(100),
    rating numeric(3,1),
    total_transactions integer
);


--
-- Name: voucher_allowed_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.voucher_allowed_categories (
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL,
    category_id uuid NOT NULL,
    is_allowed integer NOT NULL
);


--
-- Name: voucher_locks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.voucher_locks (
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL,
    voucher_id uuid NOT NULL,
    locked_at timestamp without time zone NOT NULL,
    expires_at timestamp without time zone NOT NULL
);


--
-- Name: voucher_redemptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.voucher_redemptions (
    voucher_id uuid NOT NULL,
    order_id uuid NOT NULL,
    amount numeric(15,2) NOT NULL,
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL
);


--
-- Name: voucher_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.voucher_transactions (
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL,
    voucher_id uuid NOT NULL,
    order_id uuid,
    transaction_type public.vouchertransactiontypeenum NOT NULL,
    amount numeric(15,2) NOT NULL
);


--
-- Name: vouchers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vouchers (
    code character varying(50) NOT NULL,
    beneficiary_id uuid NOT NULL,
    donation_id uuid,
    balance numeric(15,2) NOT NULL,
    allocated_date timestamp without time zone,
    expiry_date date NOT NULL,
    status public.voucherstatusenum NOT NULL,
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL
);


--
-- Name: wallet_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallet_allocations (
    beneficiary_id uuid NOT NULL,
    donation_id uuid,
    original_amount numeric(15,2) NOT NULL,
    remaining_amount numeric(15,2) NOT NULL,
    allocated_at timestamp without time zone NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: wallet_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallet_transactions (
    beneficiary_id uuid NOT NULL,
    order_id uuid,
    allocation_id uuid,
    transaction_type character varying(20) NOT NULL,
    amount numeric(15,2) NOT NULL,
    balance_after numeric(15,2),
    description text,
    id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: withdrawals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.withdrawals (
    vendor_id uuid NOT NULL,
    amount numeric(15,2) NOT NULL,
    bank_name character varying(100),
    bank_account_number character varying(50),
    bank_account_holder character varying(255),
    status character varying(50) NOT NULL,
    transfer_reference character varying(255),
    completed_at timestamp without time zone,
    notes character varying(500),
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    is_active boolean NOT NULL
);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alembic_version (version_num) FROM stdin;
44b3d3eda549
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, id, created_at, updated_at, is_active) FROM stdin;
796ed162-2338-4ce8-b57d-6abea2a1f503	beneficiary_approved	beneficiary_profile	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	{"approval_status": "approved"}	{"approval_status": "approved", "notes": null}	\N	\N	adcab7b6-bf45-4683-a4f2-6da96f0fa7ec	2026-04-28 16:43:39.440166	2026-04-28 16:43:39.440166	t
796ed162-2338-4ce8-b57d-6abea2a1f503	beneficiary_approved	beneficiary_profile	00000000-0000-0000-0000-000000000002	{"approval_status": "approved"}	{"approval_status": "approved", "notes": null}	\N	\N	71867bba-ef8e-4f6d-807c-bb56d42e1e91	2026-04-28 16:43:49.616779	2026-04-28 16:43:49.616779	t
796ed162-2338-4ce8-b57d-6abea2a1f503	beneficiary_approved	beneficiary_profile	f19ca67e-9299-40a3-ab61-e5dd911ccd2f	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	d36d8c3e-03e0-4cae-9745-b633a93e9ef2	2026-04-28 16:45:29.710106	2026-04-28 16:45:29.710106	t
796ed162-2338-4ce8-b57d-6abea2a1f503	vendor_approved	vendor_profile	3293b8aa-335d-4228-9e49-edc1aa133f6e	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	7c046f7c-53d3-4fba-b289-a29b3987bbf1	2026-04-28 16:45:37.313627	2026-04-28 16:45:37.313627	t
796ed162-2338-4ce8-b57d-6abea2a1f503	product_approved	product	f3e696c7-2907-4b38-9047-4799a3f7a181	{"approval_status": "approved"}	{"approval_status": "approved", "notes": null}	\N	\N	910b9431-9ae1-478b-aaa4-9cc72de4eeeb	2026-04-28 16:56:43.443105	2026-04-28 16:56:43.443105	t
796ed162-2338-4ce8-b57d-6abea2a1f503	product_approved	product	f484d5ab-7c38-4bde-b1d5-0cb3a6a8b227	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	50f5a9d5-e3e9-4a93-a7b0-eb9910da85e6	2026-05-05 06:38:26.293234	2026-05-05 06:38:26.293234	t
796ed162-2338-4ce8-b57d-6abea2a1f503	product_approved	product	ea137fe9-2f79-4c25-830b-3ae276c9ea7a	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	88c4b15a-067d-4f8d-80e9-472c23e11bb5	2026-05-19 00:54:29.260959	2026-05-19 00:54:29.260959	t
796ed162-2338-4ce8-b57d-6abea2a1f503	vendor_approved	vendor_profile	706ffe8f-d51e-4a2f-924f-8180d76dc558	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	22af0d66-9e26-4edb-af06-ba67d8a68ae4	2026-05-23 15:08:15.573491	2026-05-23 15:08:15.573491	t
796ed162-2338-4ce8-b57d-6abea2a1f503	beneficiary_approved	beneficiary_profile	319688e1-ad41-4c83-a381-a8a700681e3d	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	618852c8-3efe-4382-a0cc-e2b16c361a6d	2026-06-10 04:16:07.977554	2026-06-10 04:16:07.977557	t
796ed162-2338-4ce8-b57d-6abea2a1f503	vendor_rejected	vendor_profile	6d6e430d-7a02-4b3e-b563-2b15dfe4a7cb	{"approval_status": "approved"}	{"approval_status": "rejected", "notes": null}	\N	\N	1e6abdc9-7b28-4900-b578-7720cc5d0656	2026-06-10 04:39:09.846567	2026-06-10 04:39:09.84657	t
796ed162-2338-4ce8-b57d-6abea2a1f503	vendor_approved	vendor_profile	6d6e430d-7a02-4b3e-b563-2b15dfe4a7cb	{"approval_status": "rejected"}	{"approval_status": "approved", "notes": null}	\N	\N	668bf4fc-6000-481c-992f-eec44b2cb127	2026-06-10 05:06:37.889168	2026-06-10 05:06:37.889172	t
796ed162-2338-4ce8-b57d-6abea2a1f503	product_approved	product	51534aee-33b9-48cb-8c09-30dbaad0adff	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	e0779ea5-0e2a-4ea0-a573-c5f97a05436d	2026-06-10 05:07:26.425183	2026-06-10 05:07:26.425187	t
796ed162-2338-4ce8-b57d-6abea2a1f503	vendor_approved	vendor_profile	7a1ee006-f94b-463b-9d47-f99241469e24	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	de8121d2-6a23-4a98-b542-3c82454cef45	2026-06-10 13:40:50.048073	2026-06-10 13:40:50.048077	t
796ed162-2338-4ce8-b57d-6abea2a1f503	product_approved	product	ff408132-0e2c-4c16-bdd7-50daf4027ef4	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	ba1d0dec-a106-4990-96bd-c6bf4e4f2804	2026-06-10 13:43:43.320199	2026-06-10 13:43:43.320203	t
796ed162-2338-4ce8-b57d-6abea2a1f503	beneficiary_approved	beneficiary_profile	fde7163c-0c71-4899-8fca-cefe928c121b	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	0c34cdcb-0dbe-41e3-bcd1-baedfb273a6b	2026-06-17 03:00:24.633858	2026-06-17 03:00:24.633861	t
796ed162-2338-4ce8-b57d-6abea2a1f503	vendor_approved	vendor_profile	9a75328c-61d5-4768-85e5-9269775ca623	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	091c2cac-3a3a-4716-919e-a5620020cea2	2026-06-17 03:00:27.406222	2026-06-17 03:00:27.406224	t
796ed162-2338-4ce8-b57d-6abea2a1f503	vendor_approved	vendor_profile	ccaaf342-c293-485b-b064-7d9f2cd42b22	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	159d3c13-3507-40c6-8eb0-6c2df91ab63e	2026-06-17 03:00:28.369058	2026-06-17 03:00:28.369062	t
796ed162-2338-4ce8-b57d-6abea2a1f503	vendor_approved	vendor_profile	9a75328c-61d5-4768-85e5-9269775ca623	{"approval_status": "approved"}	{"approval_status": "approved", "notes": null}	\N	\N	9e729c0b-a19d-4eaf-b893-c7a81971c62d	2026-06-17 03:00:28.928281	2026-06-17 03:00:28.928284	t
796ed162-2338-4ce8-b57d-6abea2a1f503	beneficiary_approved	beneficiary_profile	d49baa2e-a538-4ce8-90df-7135af799445	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	eae804a5-ab59-4c1d-b55c-b843bd551bbc	2026-06-17 03:00:29.102942	2026-06-17 03:00:29.102944	t
796ed162-2338-4ce8-b57d-6abea2a1f503	vendor_approved	vendor_profile	ccaaf342-c293-485b-b064-7d9f2cd42b22	{"approval_status": "approved"}	{"approval_status": "approved", "notes": null}	\N	\N	c835ff0f-bc84-40f0-afd9-bd2b68a46358	2026-06-17 03:00:31.66164	2026-06-17 03:00:31.661643	t
796ed162-2338-4ce8-b57d-6abea2a1f503	vendor_approved	vendor_profile	9a75328c-61d5-4768-85e5-9269775ca623	{"approval_status": "approved"}	{"approval_status": "approved", "notes": null}	\N	\N	c0d7afe2-61d2-4218-ab6c-81bb0c58e895	2026-06-17 03:00:32.94486	2026-06-17 03:00:32.944864	t
796ed162-2338-4ce8-b57d-6abea2a1f503	vendor_approved	vendor_profile	ccaaf342-c293-485b-b064-7d9f2cd42b22	{"approval_status": "approved"}	{"approval_status": "approved", "notes": null}	\N	\N	8f86555a-ebf0-4a74-91fd-e3dbf9013d65	2026-06-17 03:00:32.83381	2026-06-17 03:00:32.833814	t
796ed162-2338-4ce8-b57d-6abea2a1f503	beneficiary_approved	beneficiary_profile	d49baa2e-a538-4ce8-90df-7135af799445	{"approval_status": "approved"}	{"approval_status": "approved", "notes": null}	\N	\N	0b9943c6-3d64-441b-ac24-0d746ad798b8	2026-06-17 03:00:34.853033	2026-06-17 03:00:34.853036	t
796ed162-2338-4ce8-b57d-6abea2a1f503	vendor_approved	vendor_profile	438671de-205c-4083-8610-cbf138757f36	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	5680d333-cf44-49ad-9a27-a08e677acfba	2026-06-17 03:00:45.348055	2026-06-17 03:00:45.348057	t
796ed162-2338-4ce8-b57d-6abea2a1f503	beneficiary_approved	beneficiary_profile	b18e30f5-1ba2-4697-a602-12b89d2473cd	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	da8206ad-1bb2-4039-84cb-ea6debbaaad4	2026-06-17 03:00:54.058427	2026-06-17 03:00:54.058431	t
796ed162-2338-4ce8-b57d-6abea2a1f503	beneficiary_approved	beneficiary_profile	793040a4-f4ed-4e82-99fc-8cb492ded4c1	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	af16eece-548b-4263-940f-ca49b84a0c22	2026-06-17 03:00:54.282291	2026-06-17 03:00:54.282294	t
796ed162-2338-4ce8-b57d-6abea2a1f503	beneficiary_approved	beneficiary_profile	ed8b3b62-a4a1-4125-803d-af3312d3d642	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	ede73fa6-05c1-4b03-8c5b-6fdb16acc498	2026-06-17 03:00:55.694699	2026-06-17 03:00:55.694702	t
796ed162-2338-4ce8-b57d-6abea2a1f503	beneficiary_approved	beneficiary_profile	5d964e27-02d2-483d-b3f9-e0561ef621a9	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	f8e4c150-c1fa-44c8-aa87-04fd45c2a868	2026-06-17 03:01:16.34457	2026-06-17 03:01:16.344574	t
796ed162-2338-4ce8-b57d-6abea2a1f503	beneficiary_approved	beneficiary_profile	82147428-e16e-4ed8-9f62-bd5353a1b288	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	d928e174-7a31-4df1-accd-bbb073864d97	2026-06-17 03:01:17.299436	2026-06-17 03:01:17.29944	t
796ed162-2338-4ce8-b57d-6abea2a1f503	beneficiary_approved	beneficiary_profile	b095701a-f443-489d-a0c6-4a3a15ee9bdb	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	29f7f00e-de45-407e-8d69-4cad820cc8a5	2026-06-17 03:01:19.198641	2026-06-17 03:01:19.198645	t
796ed162-2338-4ce8-b57d-6abea2a1f503	vendor_approved	vendor_profile	0419ba30-33ce-40c0-bd61-31cfc233a271	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	7819fed3-ddf9-40b8-8880-b0e99ec8aae1	2026-06-17 03:01:19.410881	2026-06-17 03:01:19.410885	t
796ed162-2338-4ce8-b57d-6abea2a1f503	beneficiary_approved	beneficiary_profile	fe740ebf-30f7-4fe7-a1b8-5757f8113719	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	12054eb8-c111-458c-bff6-fcdf3e725220	2026-06-17 03:01:21.860278	2026-06-17 03:01:21.860282	t
796ed162-2338-4ce8-b57d-6abea2a1f503	beneficiary_approved	beneficiary_profile	80d7d392-e7b5-4f75-8ff2-baa2ad3c8e48	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	5cf87edd-16be-4038-90e6-95e534b3fbc1	2026-06-17 03:01:22.90198	2026-06-17 03:01:22.901984	t
796ed162-2338-4ce8-b57d-6abea2a1f503	product_approved	product	ea137fe9-2f79-4c25-830b-3ae276c9ea7a	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	01ae6dba-9cb1-4180-bde3-f5d3278b1253	2026-06-17 03:01:48.081139	2026-06-17 03:01:48.081143	t
796ed162-2338-4ce8-b57d-6abea2a1f503	product_approved	product	fa97a6fb-6eb3-451b-a03b-60553710d09d	{"approval_status": "pending"}	{"approval_status": "approved", "notes": null}	\N	\N	8c3034b0-56c2-445e-8ad2-717c87b3f6b8	2026-06-17 03:01:49.24372	2026-06-17 03:01:49.243724	t
796ed162-2338-4ce8-b57d-6abea2a1f503	vendor_rejected	vendor_profile	7a1ee006-f94b-463b-9d47-f99241469e24	{"approval_status": "approved"}	{"approval_status": "rejected", "notes": null}	\N	\N	3d212087-e8b8-4168-85db-71c6f65cfdb3	2026-06-17 03:04:24.61752	2026-06-17 03:04:24.617523	t
796ed162-2338-4ce8-b57d-6abea2a1f503	vendor_approved	vendor_profile	7a1ee006-f94b-463b-9d47-f99241469e24	{"approval_status": "rejected"}	{"approval_status": "approved", "notes": null}	\N	\N	8a29f341-5d62-461e-ac3b-c6d89790ab8f	2026-06-17 03:04:38.035814	2026-06-17 03:04:38.035817	t
\.


--
-- Data for Name: beneficiary_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.beneficiary_profiles (user_id, family_size, vouchers_balance, fies_score, fies_classification, id, created_at, updated_at, is_active, approval_status, wallet_held) FROM stdin;
00000000-0000-0000-0000-000000000002	1	0.00	\N	\N	c316622b-c515-491a-8366-32dde6e8cf4c	2026-04-18 04:52:48.157569	2026-04-21 23:23:04.260379	t	approved	0.00
d68b8ec6-00cb-4672-aa5f-604bac0c86a1	1	0.00	\N	\N	af367d93-4575-49db-8df5-5d3a408f9aff	2026-04-18 06:00:28.866209	2026-04-21 23:23:04.260379	t	approved	0.00
319688e1-ad41-4c83-a381-a8a700681e3d	1	0.00	4	moderate	1afbbb2f-8502-4246-af46-8c274ace55eb	2026-05-19 08:49:05.840831	2026-06-10 04:16:08.35482	t	approved	0.00
f383af29-b1ef-431b-bb30-7f8d8c9f18a8	1	0.00	\N	\N	75992878-a364-4c79-9a45-73542502fc34	2026-04-19 14:18:55.549213	2026-04-21 23:23:04.260379	t	approved	0.00
ee4f68ab-cc12-45f8-92b6-3c1f7422aff6	1	155399.06	5	moderate	fe4c56fc-afbf-4b06-be94-f23ec18bb39f	2026-04-18 06:26:02.562406	2026-04-27 13:48:55.02706	t	approved	0.00
20000000-0000-0000-0000-000000000001	4	596948.35	3	moderate	10900979-b74c-414e-9cd6-0a6577979946	2026-04-18 07:28:46.782953	2026-04-27 13:48:55.308669	t	approved	0.00
793040a4-f4ed-4e82-99fc-8cb492ded4c1	1	4107692.36	5	moderate	1dcc9339-48c8-4dd1-9e7e-fd9db4c85dc3	2026-06-10 10:26:22.993934	2026-06-26 09:00:03.916767	t	approved	0.00
82147428-e16e-4ed8-9f62-bd5353a1b288	1	2446153.86	1	food_secure	508834e4-566b-4da3-85fb-cc124ad617e5	2026-06-10 09:29:14.650379	2026-06-26 09:00:05.018748	t	approved	0.00
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	3	3741153.78	1	food_secure	d8db2501-4a19-4ae7-8c9d-9d7c10a7ccc3	2026-04-20 15:21:43.80273	2026-06-26 09:00:05.975684	t	approved	0.00
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	1	3338000.00	7	severe	46658c25-e512-4f4b-99fb-b93818a0b838	2026-04-27 13:47:22.647685	2026-06-17 02:58:05.206272	t	approved	0.00
fde7163c-0c71-4899-8fca-cefe928c121b	1	0.00	\N	\N	72b00636-a807-45d9-993c-7f65974d44af	2026-06-10 18:58:43.347303	2026-06-17 03:00:25.020926	t	approved	0.00
d49baa2e-a538-4ce8-90df-7135af799445	1	0.00	\N	\N	bc54e8f8-a754-4bdf-94c3-c84e96814c2b	2026-06-10 11:35:54.582997	2026-06-17 03:00:29.456331	t	approved	0.00
b18e30f5-1ba2-4697-a602-12b89d2473cd	1	0.00	\N	\N	2760c65e-79d9-43ca-8dde-7055a0861881	2026-06-10 10:30:50.389936	2026-06-17 03:00:54.418541	t	approved	0.00
ed8b3b62-a4a1-4125-803d-af3312d3d642	1	0.00	\N	\N	725f28e4-f849-4ae0-817f-e4be14ddbd56	2026-06-10 10:05:32.787864	2026-06-17 03:00:55.874124	t	approved	0.00
5d964e27-02d2-483d-b3f9-e0561ef621a9	1	0.00	\N	\N	c04a6a8e-2187-40ea-8928-ec3d27f4a357	2026-06-10 09:46:42.928018	2026-06-17 03:01:16.521315	t	approved	0.00
c5a8b3e9-5677-4577-aabc-a25446f0ae61	3	1750000.00	7	severe	12f62488-ad92-4221-9433-167a3cbda81b	2026-05-26 01:36:47.460495	2026-05-27 09:00:00.295333	t	approved	0.00
b095701a-f443-489d-a0c6-4a3a15ee9bdb	1	0.00	\N	\N	6ad2d849-6563-4320-aa6d-8dbd4e47c40d	2026-06-10 09:26:48.762791	2026-06-17 03:01:19.558462	t	approved	0.00
fe740ebf-30f7-4fe7-a1b8-5757f8113719	1	0.00	\N	\N	93ddd546-7235-408a-9f20-a75c7dce5763	2026-06-10 09:17:47.023881	2026-06-17 03:01:22.209416	t	approved	0.00
80d7d392-e7b5-4f75-8ff2-baa2ad3c8e48	1	0.00	\N	\N	723d46ea-daef-450f-b8eb-f4badd308129	2026-06-10 09:18:19.267447	2026-06-17 03:01:23.078336	t	approved	0.00
\.


--
-- Data for Name: billing_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.billing_history (subscription_id, amount, currency, status, payment_method, transaction_id, billing_date, id, created_at, updated_at, is_active) FROM stdin;
1ec37dff-47be-4fb9-82c7-689e70e1a060	1000000.00	IDR	success	qris	\N	2026-04-22	84bfea88-c702-4337-9022-845281b93f30	2026-04-22 03:12:45.037284	2026-04-22 03:12:45.037289	t
a7653005-5392-484e-a773-a39aba74da61	500000.00	IDR	success	qris	\N	2026-04-22	6ad30ec6-7d02-40fe-892b-4949d7933fde	2026-04-22 04:18:52.333226	2026-04-22 04:18:52.333232	t
85735449-e8aa-4eeb-a7fd-8c927af71b9b	500000.00	IDR	success	qris	\N	2026-04-27	6cca6d27-d033-4932-8b70-b7b00f3bcae7	2026-04-27 13:48:51.512065	2026-04-27 13:48:51.512065	t
8aca0664-8451-4061-9b26-8a6056440a8f	300000.00	IDR	success	qris	\N	2026-05-03	c7f4e61e-fda1-4f33-8555-5c71dd7879c1	2026-05-03 10:04:01.686092	2026-05-03 10:04:01.686092	t
bc8c0c7b-e7e5-472b-a3d9-b234afdd2af9	300000.00	IDR	success	qris	\N	2026-05-05	ca056c46-95cc-4e36-b559-a9e36aa919be	2026-05-05 00:48:39.411732	2026-05-05 00:48:39.411737	t
97c6a42c-1419-4245-897c-3fde9b923cc6	300000.00	IDR	success	qris	\N	2026-05-05	cdf2dedd-d741-48da-975e-40cab2770bab	2026-05-05 00:56:40.666693	2026-05-05 00:56:40.666702	t
76a45b07-cf7a-497a-bf00-3d2a870bebcc	300000.00	IDR	success	qris	\N	2026-05-05	e6131baa-6bfa-45b0-bc76-68b0df638b1d	2026-05-05 00:58:34.809721	2026-05-05 00:58:34.809726	t
3027205a-aa04-4e8e-930c-8da96147c8a9	300000.00	IDR	success	bank_transfer	\N	2026-05-05	e6db98a9-c8ed-418e-92b5-7da9caf43df2	2026-05-05 00:59:11.052151	2026-05-05 00:59:11.052157	t
5af23431-9769-4e3a-8f39-94bdd13b7d67	300000.00	IDR	success	bank_transfer	\N	2026-05-05	78dc1486-d204-493c-a100-bf5d7dc4ad0a	2026-05-05 01:01:05.001104	2026-05-05 01:01:05.001109	t
a7e8f381-386d-4cb5-a41c-842cd262f45d	499998.00	IDR	success	qris	\N	2026-05-05	316a1242-ece4-427e-8d7f-750e1d573af8	2026-05-05 01:01:37.947699	2026-05-05 01:01:37.947705	t
92641fdd-bb10-4282-a6e5-69a70309eb7b	300000.00	IDR	success	qris	\N	2026-05-05	ec419883-832b-4ada-9384-136e010c9155	2026-05-05 01:05:14.21145	2026-05-05 01:05:14.211455	t
ded4d128-3ecf-41fb-aa03-cb1ecc32e982	300000.00	IDR	success	qris	\N	2026-05-05	05d4ccf2-a02b-468e-bf1c-beec849d3427	2026-05-05 01:13:00.780615	2026-05-05 01:13:00.780619	t
085581c9-4a52-4957-8669-d7593bf3b7c9	500000.00	IDR	success	qris	\N	2026-05-05	c7049471-b208-4630-af36-a6001c2ec3cd	2026-05-05 01:21:15.06434	2026-05-05 01:21:15.064347	t
9ebd2580-a901-4197-a9ca-edf1cf3a0436	500000.00	IDR	success	qris	\N	2026-05-05	f6578469-aed7-49d3-8825-45f8cb8f403c	2026-05-05 01:25:38.847756	2026-05-05 01:25:38.847761	t
dd60637b-a81f-4e65-9578-369710e12077	300000.00	IDR	success	qris	\N	2026-05-05	12ecf7cf-aafd-4d1f-8486-77b43068cd5f	2026-05-05 01:31:55.591347	2026-05-05 01:31:55.591355	t
8bd0c9af-49b3-42a6-84ec-79b6a3afae79	300000.00	IDR	success	bank_transfer	\N	2026-05-05	14a8c7d3-2aa9-4db2-b45f-fdbbd87eb014	2026-05-05 06:14:57.682376	2026-05-05 06:14:57.682376	t
0de717b0-dd05-4f7c-9c32-bec338268b88	1000000.00	IDR	success	qris	\N	2026-05-05	f08a35cb-aadc-46d8-9cc2-b2a414648b64	2026-05-05 06:21:45.339862	2026-05-05 06:21:45.339862	t
5d73d74f-8f68-4f09-b14a-2ae97009eca4	500000.00	IDR	success	qris	\N	2026-05-05	51372f45-a3de-4515-afcc-09158815469c	2026-05-05 07:36:05.353944	2026-05-05 07:36:05.35395	t
1b4e3bb8-42e5-4d44-aa9c-bc8f83c34b91	500000.00	IDR	success	qris	\N	2026-05-05	17639b64-7eae-479d-92e5-13d72c149910	2026-05-05 07:36:37.709192	2026-05-05 07:36:37.709199	t
3502e3bb-0f2d-4c52-81bc-8ec444d1bb4a	500000.00	IDR	success	qris	\N	2026-05-19	2ba5a1fa-147b-4d57-837f-6a45ade91756	2026-05-19 08:58:04.413653	2026-05-19 08:58:04.413658	t
de5cf0e4-9fb7-4bec-ad4b-856c832c088b	500000.00	IDR	success	qris	\N	2026-05-19	2a614a90-a48a-4687-ac3a-0bbed3c4f811	2026-05-19 09:00:14.260618	2026-05-19 09:00:14.260622	t
07e6ea4a-154a-40db-883e-84fd2aba5020	500000.00	IDR	success	qris	\N	2026-05-19	47d5b891-85a8-4926-a1fb-ebce5b7cd57a	2026-05-19 09:00:27.757019	2026-05-19 09:00:27.757024	t
2a5d374f-5282-4bba-971f-45db94bf1143	500000.00	IDR	success	qris	\N	2026-05-19	0bf1facd-8e6f-4cc4-8881-0345e7f70297	2026-05-19 09:00:30.837721	2026-05-19 09:00:30.837727	t
b3e7595f-26fc-422f-9fa0-725398fd4412	500000.00	IDR	success	qris	\N	2026-05-19	66614767-5d78-412e-a936-69c367e07c73	2026-05-19 09:01:07.238292	2026-05-19 09:01:07.238303	t
9d830579-32b7-4b55-a302-2f1ad8fc9f15	300000.00	IDR	success	qris	\N	2026-05-19	74f6aaac-7c05-4ce0-a23a-b2995ffaf56e	2026-05-19 09:02:58.057107	2026-05-19 09:02:58.057113	t
ba5eabb8-10de-41a3-984d-5de77629ebc1	300000.00	IDR	success	qris	\N	2026-05-19	7f00f76a-838e-444f-84e0-e38a4cdd4cc0	2026-05-19 09:04:01.489251	2026-05-19 09:04:01.489255	t
aed4e1fd-40c5-4dc7-ba6d-d67e419a7c52	300000.00	IDR	success	qris	\N	2026-05-19	5b15a3bc-70e5-40ce-b7c7-ce0740c8e51c	2026-05-19 09:12:22.81169	2026-05-19 09:12:22.811694	t
fc1cabad-586b-49e2-96b2-295cff8ffe72	300000.00	IDR	success	qris	\N	2026-05-19	2ee235f3-7bc6-48ae-ad93-58bf13b6c442	2026-05-19 09:12:25.288308	2026-05-19 09:12:25.288312	t
802458a5-e416-45b8-8c2b-0503daff7ffc	300000.00	IDR	success	qris	\N	2026-05-19	d833744d-006c-477c-96df-e01f5f5b3b2d	2026-05-19 09:12:27.767921	2026-05-19 09:12:27.767925	t
704dde7e-f48f-446b-8080-faf06f62ea65	300000.00	IDR	success	qris	\N	2026-05-19	0ab2a21a-6eeb-4301-a45d-75ec372f23dc	2026-05-19 10:44:29.129419	2026-05-19 10:44:29.129454	t
763d75bf-7421-4e0c-8f90-f2f4749ccfaa	300000.00	IDR	success	qris	\N	2026-05-19	71da06c9-5dd3-4f72-969c-1c4dfc188dab	2026-05-19 10:47:57.271051	2026-05-19 10:47:57.271055	t
0e901aea-4350-4a65-825d-02b3e75b2873	300000.00	IDR	success	qris	\N	2026-05-19	81d9af55-bf19-46b5-bd83-881f928b79fd	2026-05-19 13:20:35.811109	2026-05-19 13:20:35.811117	t
06b1bcac-0d29-4fe5-b021-00d31bbff5e5	300000.00	IDR	success	qris	\N	2026-05-19	54fd4c96-1f18-4cf6-aa05-d238f96a2d53	2026-05-19 13:20:59.876014	2026-05-19 13:20:59.87603	t
1ec37dff-47be-4fb9-82c7-689e70e1a060	1000000.00	IDR	success	qris	SUBSCRIPTION-de5700b7-02b2-4be4-8aaa-ddcb19045cdd	2026-05-22	396bcd66-f675-4428-b9c1-dfa2b3da2b93	2026-05-22 09:00:05.724434	2026-05-22 09:00:05.724436	t
1ec37dff-47be-4fb9-82c7-689e70e1a060	1000000.00	IDR	success	qris	SUBSCRIPTION-06f0baba-8a07-4567-a108-c0068e5f3678	2026-05-22	89a05a6a-17ae-4e0e-921f-5cb1c6ef3da8	2026-05-22 09:00:07.386701	2026-05-22 09:00:07.386705	t
a7653005-5392-484e-a773-a39aba74da61	500000.00	IDR	success	qris	SUBSCRIPTION-25b1c35e-3b29-43be-9b65-d8a48cef7a3f	2026-05-22	e5b94f34-5f19-4a75-ab41-6b9adc69ff01	2026-05-22 09:00:10.045449	2026-05-22 09:00:10.045451	t
a7653005-5392-484e-a773-a39aba74da61	500000.00	IDR	success	qris	SUBSCRIPTION-f673d639-c180-493b-94e1-53198b73ccb0	2026-05-22	77daea17-2b1e-4a7c-80b6-9c56cffb0b5b	2026-05-22 09:00:14.581551	2026-05-22 09:00:14.581554	t
14750bb4-e68a-4ba4-89e6-4b0ae4d31e72	300000.00	IDR	success	qris	\N	2026-05-25	c36de358-4269-4fad-a2d2-30edd1b1f7b0	2026-05-25 18:18:59.636098	2026-05-25 18:18:59.636101	t
85735449-e8aa-4eeb-a7fd-8c927af71b9b	500000.00	IDR	success	qris	SUBSCRIPTION-f79fbeab-ba4b-4759-acd8-2c31192e18cb	2026-05-27	2ee429e1-60bd-4ebd-8066-e44c55746fe3	2026-05-27 09:00:00.418821	2026-05-27 09:00:00.418823	t
8aca0664-8451-4061-9b26-8a6056440a8f	300000.00	IDR	success	qris	SUBSCRIPTION-a6f65aa6-e612-4a60-98a5-d23e677f10b2	2026-06-02	433bad82-fdc7-4c06-b8ca-6f2893e938c6	2026-06-02 09:00:00.335915	2026-06-02 09:00:00.335918	t
bc8c0c7b-e7e5-472b-a3d9-b234afdd2af9	300000.00	IDR	success	qris	SUBSCRIPTION-1c270e9c-310e-4478-80f5-1759beda0ac8	2026-06-04	2105dd0e-e2f4-4619-bc68-1a050c58c6c5	2026-06-04 09:00:00.282304	2026-06-04 09:00:00.282306	t
97c6a42c-1419-4245-897c-3fde9b923cc6	300000.00	IDR	success	qris	SUBSCRIPTION-af204ef6-8af5-4e19-bb91-25fe50ac553a	2026-06-04	ec932932-ee07-4d55-b6a2-a458ffe42a62	2026-06-04 09:00:00.384274	2026-06-04 09:00:00.384278	t
76a45b07-cf7a-497a-bf00-3d2a870bebcc	300000.00	IDR	success	qris	SUBSCRIPTION-fe8b0817-a066-4d2f-ba3e-533819d7639c	2026-06-04	68542f2f-141b-4d51-8765-e76039a472c2	2026-06-04 09:00:00.47961	2026-06-04 09:00:00.479613	t
3027205a-aa04-4e8e-930c-8da96147c8a9	300000.00	IDR	success	bank_transfer	SUBSCRIPTION-f46176b1-8662-4151-88ad-3e20a8a64fea	2026-06-04	015fac3a-9aa6-466d-8175-c383a17502d0	2026-06-04 09:00:00.574026	2026-06-04 09:00:00.57403	t
5af23431-9769-4e3a-8f39-94bdd13b7d67	300000.00	IDR	success	bank_transfer	SUBSCRIPTION-e0dc018a-44dc-4e20-8ef1-8508cec7770a	2026-06-04	c251b77f-cfd8-48c1-8b02-5d5c6c474d2a	2026-06-04 09:00:00.669943	2026-06-04 09:00:00.669946	t
a7e8f381-386d-4cb5-a41c-842cd262f45d	499998.00	IDR	success	qris	SUBSCRIPTION-872e853d-64d8-485a-9ea2-fea766f10564	2026-06-04	5bdbda42-7567-4523-9ab1-2411955cc9cc	2026-06-04 09:00:00.765253	2026-06-04 09:00:00.765255	t
92641fdd-bb10-4282-a6e5-69a70309eb7b	300000.00	IDR	success	qris	SUBSCRIPTION-9308ea6a-270f-4d44-8e07-72c5edf832fd	2026-06-04	3df945e3-aa23-4b6b-8afc-04504cda8206	2026-06-04 09:00:00.861444	2026-06-04 09:00:00.861446	t
ded4d128-3ecf-41fb-aa03-cb1ecc32e982	300000.00	IDR	success	qris	SUBSCRIPTION-e1db365c-631d-451d-a045-1208a33f281a	2026-06-04	164ff906-3a84-40f5-9657-a8a724c7e656	2026-06-04 09:00:00.955417	2026-06-04 09:00:00.95542	t
085581c9-4a52-4957-8669-d7593bf3b7c9	500000.00	IDR	success	qris	SUBSCRIPTION-b694bd14-bc66-4a4a-9e50-d8cd07add700	2026-06-04	5338eb89-b66a-4d26-83f7-2849a4a717ad	2026-06-04 09:00:01.05164	2026-06-04 09:00:01.051642	t
9ebd2580-a901-4197-a9ca-edf1cf3a0436	500000.00	IDR	success	qris	SUBSCRIPTION-640ddb1c-db46-475c-8675-798e931b485d	2026-06-04	a534587d-5d2a-4a32-b247-3644e627e60e	2026-06-04 09:00:01.145759	2026-06-04 09:00:01.145762	t
dd60637b-a81f-4e65-9578-369710e12077	300000.00	IDR	success	qris	SUBSCRIPTION-248a20ce-4d92-449b-9c85-45c2a0b73df5	2026-06-04	03d23e58-4487-4655-9b8c-e407c4309707	2026-06-04 09:00:01.240185	2026-06-04 09:00:01.240187	t
8bd0c9af-49b3-42a6-84ec-79b6a3afae79	300000.00	IDR	success	bank_transfer	SUBSCRIPTION-5f428b53-3676-4756-bf61-a4c097d3b2ec	2026-06-04	e80e2dfd-05c1-4bc6-bb73-3a4cb697efd8	2026-06-04 09:00:01.332958	2026-06-04 09:00:01.332961	t
5d73d74f-8f68-4f09-b14a-2ae97009eca4	500000.00	IDR	success	qris	SUBSCRIPTION-7d4ea92a-7241-4bce-a8fc-3b8fdc33988d	2026-06-04	a087fad3-11da-4ef5-971a-9780a5b38b18	2026-06-04 09:00:01.424883	2026-06-04 09:00:01.424886	t
1b4e3bb8-42e5-4d44-aa9c-bc8f83c34b91	500000.00	IDR	success	qris	SUBSCRIPTION-a356ebdf-76ca-495c-a2db-859d944128f4	2026-06-04	c6ffb433-1531-40f3-800b-b60870a4edf8	2026-06-04 09:00:01.516072	2026-06-04 09:00:01.516075	t
4e943256-6531-43e1-9f53-71d8906e069b	400000.00	IDR	success	qris	\N	2026-06-06	e10330b5-a812-49f5-a26b-50dbe4a9a985	2026-06-06 15:59:42.59786	2026-06-06 15:59:42.59786	t
e462fadf-ac63-4560-92ed-5f5e330b60fb	500000.00	IDR	success	midtrans	\N	2026-06-06	f4fea2d0-2975-4e7a-ab80-c212761d5cf0	2026-06-06 16:24:53.086378	2026-06-06 16:24:53.086378	t
79e70f47-dd49-423a-a399-a2829d9c0f78	300000.00	IDR	success	midtrans	\N	2026-06-10	7a64b637-f140-4de8-8217-35df2c14e300	2026-06-10 09:21:31.574994	2026-06-10 09:21:31.574998	t
57ebfb4c-a248-4255-9256-5018b0948ac7	300000.00	IDR	success	midtrans	\N	2026-06-10	3a461ff5-95f3-4074-8702-783d530603bd	2026-06-10 11:28:48.904306	2026-06-10 11:28:48.904309	t
3502e3bb-0f2d-4c52-81bc-8ec444d1bb4a	500000.00	IDR	success	qris	SUBSCRIPTION-5d3a36d9-8242-4b60-916e-87049f812983	2026-06-18	7582e2ab-dd3d-427b-86f3-1855022e0565	2026-06-18 09:00:07.105535	2026-06-18 09:00:07.105539	t
3502e3bb-0f2d-4c52-81bc-8ec444d1bb4a	500000.00	IDR	success	qris	SUBSCRIPTION-936aa129-a7c1-4509-bbe5-a0415208e2b5	2026-06-18	31f3b41b-e733-41d8-a7fc-91688f61cba4	2026-06-18 09:00:10.083834	2026-06-18 09:00:10.083836	t
de5cf0e4-9fb7-4bec-ad4b-856c832c088b	500000.00	IDR	success	qris	SUBSCRIPTION-9f4287b7-86e1-481e-995e-537809c5a1c5	2026-06-18	c322d543-9887-43d8-af34-2e9cfbe5d17e	2026-06-18 09:00:14.120788	2026-06-18 09:00:14.120792	t
de5cf0e4-9fb7-4bec-ad4b-856c832c088b	500000.00	IDR	success	qris	SUBSCRIPTION-01308c41-9583-4c3c-b9ed-8fe65b2a7940	2026-06-18	f0bab70e-8b59-4e07-8e2b-c90d8058d781	2026-06-18 09:00:18.789384	2026-06-18 09:00:18.789387	t
07e6ea4a-154a-40db-883e-84fd2aba5020	500000.00	IDR	success	qris	SUBSCRIPTION-7be12ae1-a611-4fe0-b9aa-3b6eb928af15	2026-06-18	ce27f8d3-2193-4a64-a7b0-553202de21c5	2026-06-18 09:00:20.626875	2026-06-18 09:00:20.62688	t
07e6ea4a-154a-40db-883e-84fd2aba5020	500000.00	IDR	success	qris	SUBSCRIPTION-1db8f6d6-455c-4805-9ff4-b2f07e3ea429	2026-06-18	bc9cd1cd-7c84-40be-ad30-bf504558c5eb	2026-06-18 09:00:26.266709	2026-06-18 09:00:26.266713	t
2a5d374f-5282-4bba-971f-45db94bf1143	500000.00	IDR	success	qris	SUBSCRIPTION-071fd337-25ab-4481-961f-dd7b40005ad7	2026-06-18	07715d1a-cdfe-474d-b099-96a92d4612dd	2026-06-18 09:00:28.185151	2026-06-18 09:00:28.185154	t
2a5d374f-5282-4bba-971f-45db94bf1143	500000.00	IDR	success	qris	SUBSCRIPTION-f007265a-f485-4156-a608-911ae1f3ec96	2026-06-18	fd374d8f-9e29-46f5-bf3e-050acaf8cd8f	2026-06-18 09:00:33.934356	2026-06-18 09:00:33.934358	t
b3e7595f-26fc-422f-9fa0-725398fd4412	500000.00	IDR	success	qris	SUBSCRIPTION-24bbf22c-320f-453d-89c2-81b64d29bca4	2026-06-18	11cc03ad-ea54-4dc0-a41c-282201c7e033	2026-06-18 09:00:35.773275	2026-06-18 09:00:35.773279	t
b3e7595f-26fc-422f-9fa0-725398fd4412	500000.00	IDR	success	qris	SUBSCRIPTION-cc704126-b180-4017-a45e-31a5f6502379	2026-06-18	28cbc445-766c-434e-b001-51d86174d70d	2026-06-18 09:00:41.33405	2026-06-18 09:00:41.334051	t
9d830579-32b7-4b55-a302-2f1ad8fc9f15	300000.00	IDR	success	qris	SUBSCRIPTION-464fad88-e8b9-4084-bb86-7b1c32d83bd3	2026-06-18	2462a061-07ca-4371-aa15-038b54c4f03e	2026-06-18 09:00:43.189345	2026-06-18 09:00:43.18935	t
9d830579-32b7-4b55-a302-2f1ad8fc9f15	300000.00	IDR	success	qris	SUBSCRIPTION-099847e9-9e77-46ef-a2b1-80bdfb8913ba	2026-06-18	d53e5f28-6d4e-4b8a-932c-9949cd8e3826	2026-06-18 09:00:48.743551	2026-06-18 09:00:48.743553	t
ba5eabb8-10de-41a3-984d-5de77629ebc1	300000.00	IDR	success	qris	SUBSCRIPTION-9c941504-f0cc-4eb1-93ae-db2b43e25a23	2026-06-18	09ee12cd-74c2-4dd9-8cb9-e295ebb26870	2026-06-18 09:00:50.590203	2026-06-18 09:00:50.590207	t
ba5eabb8-10de-41a3-984d-5de77629ebc1	300000.00	IDR	success	qris	SUBSCRIPTION-61b6a05b-8f9d-420f-83ae-f0abed7644a6	2026-06-18	e86abd8f-4be7-4367-98cc-3b669aad77e0	2026-06-18 09:00:56.197865	2026-06-18 09:00:56.197868	t
aed4e1fd-40c5-4dc7-ba6d-d67e419a7c52	300000.00	IDR	success	qris	SUBSCRIPTION-014676af-716c-433e-92c2-a62f22125d8b	2026-06-18	c2d0e1c8-5bd8-4c12-b776-30a460f1724a	2026-06-18 09:00:58.05791	2026-06-18 09:00:58.057914	t
aed4e1fd-40c5-4dc7-ba6d-d67e419a7c52	300000.00	IDR	success	qris	SUBSCRIPTION-b3d63a50-2e9a-4b98-b718-8cd47a075df8	2026-06-18	1e60152e-bdfb-486d-88c2-3657d36c0bc5	2026-06-18 09:01:03.652006	2026-06-18 09:01:03.652008	t
fc1cabad-586b-49e2-96b2-295cff8ffe72	300000.00	IDR	success	qris	SUBSCRIPTION-a496e7fc-4993-4823-9f05-e3f0d112fc2d	2026-06-18	9861bb19-a49b-42fa-b940-8f86f364d973	2026-06-18 09:01:05.568442	2026-06-18 09:01:05.568447	t
fc1cabad-586b-49e2-96b2-295cff8ffe72	300000.00	IDR	success	qris	SUBSCRIPTION-6a967c39-661f-4c9d-8613-335324ecad18	2026-06-18	8ff488be-b142-4c73-877c-f087b5f03ad4	2026-06-18 09:01:11.340915	2026-06-18 09:01:11.340923	t
802458a5-e416-45b8-8c2b-0503daff7ffc	300000.00	IDR	success	qris	SUBSCRIPTION-340d8c53-c510-4ffd-89e9-e2fdd59fc49c	2026-06-18	9fe066a5-f481-4960-8636-e556f454ba0b	2026-06-18 09:01:13.168338	2026-06-18 09:01:13.168342	t
802458a5-e416-45b8-8c2b-0503daff7ffc	300000.00	IDR	success	qris	SUBSCRIPTION-6528615d-7a91-46ab-b796-a946f4d9a4b0	2026-06-18	6a9fccdf-b4ac-47aa-98cb-51b8bceaa6a1	2026-06-18 09:01:18.75275	2026-06-18 09:01:18.752751	t
704dde7e-f48f-446b-8080-faf06f62ea65	300000.00	IDR	success	qris	SUBSCRIPTION-45b4cde2-9380-4f5d-a0e9-eb54e894a38b	2026-06-18	67161e8b-4593-4236-a6eb-35b6ea81117b	2026-06-18 09:01:20.600569	2026-06-18 09:01:20.600574	t
704dde7e-f48f-446b-8080-faf06f62ea65	300000.00	IDR	success	qris	SUBSCRIPTION-764d9e55-75d7-40bb-9479-d750046a1305	2026-06-18	5e624d8b-c52b-4f2a-8e33-e9b00bef6bdb	2026-06-18 09:01:26.168347	2026-06-18 09:01:26.16835	t
763d75bf-7421-4e0c-8f90-f2f4749ccfaa	300000.00	IDR	success	qris	SUBSCRIPTION-abbf0207-8a3d-4bd0-b976-5f54e24cad93	2026-06-18	8b242100-2275-4d4d-a9ec-cd8508718880	2026-06-18 09:01:28.006656	2026-06-18 09:01:28.00666	t
763d75bf-7421-4e0c-8f90-f2f4749ccfaa	300000.00	IDR	success	qris	SUBSCRIPTION-011684ff-afc9-4a06-bfd7-8f223b0b6206	2026-06-18	5dfbf127-4f7e-49d1-9e90-0afd6eea2981	2026-06-18 09:01:33.635139	2026-06-18 09:01:33.635141	t
0e901aea-4350-4a65-825d-02b3e75b2873	300000.00	IDR	success	qris	SUBSCRIPTION-d3708f0a-3bbe-4f35-9ca7-1358f8d0f7c8	2026-06-18	c36ca8e6-ef81-4b96-9605-f751cf4c4ad7	2026-06-18 09:01:35.510161	2026-06-18 09:01:35.510166	t
0e901aea-4350-4a65-825d-02b3e75b2873	300000.00	IDR	success	qris	SUBSCRIPTION-63932533-22db-46e7-b61c-f11816c8fd3d	2026-06-18	4cbe54e7-e6c2-476b-a613-37bb2214e6a2	2026-06-18 09:01:41.09308	2026-06-18 09:01:41.093082	t
06b1bcac-0d29-4fe5-b021-00d31bbff5e5	300000.00	IDR	success	qris	SUBSCRIPTION-a715d5c6-811e-4655-b1f9-0922b7772f0f	2026-06-18	58cddb8d-9dbd-4468-9b6e-e879889291ed	2026-06-18 09:01:43.020341	2026-06-18 09:01:43.020345	t
06b1bcac-0d29-4fe5-b021-00d31bbff5e5	300000.00	IDR	success	qris	SUBSCRIPTION-620b45e9-0097-4083-9ec4-f88818161241	2026-06-18	c0badb2f-6795-4e91-8c78-de3d6659e09d	2026-06-18 09:01:48.772815	2026-06-18 09:01:48.772819	t
a7653005-5392-484e-a773-a39aba74da61	500000.00	IDR	success	qris	SUBSCRIPTION-5e9d5e2f-cb18-4466-9b03-b4e3f668ce06	2026-06-21	fd3ee7d1-9ede-4dbf-81a4-87182a91ba48	2026-06-21 09:00:07.316457	2026-06-21 09:00:07.31646	t
a7653005-5392-484e-a773-a39aba74da61	500000.00	IDR	success	qris	SUBSCRIPTION-5bf493d5-40dc-4363-8d98-8458fe12cf8b	2026-06-21	1d9296b3-7911-4a02-9d4b-fbde18f4cbd4	2026-06-21 09:00:10.455815	2026-06-21 09:00:10.455818	t
1ec37dff-47be-4fb9-82c7-689e70e1a060	1000000.00	IDR	success	qris	SUBSCRIPTION-ede62b87-068b-4801-9d12-e96a5c5b8fbc	2026-06-21	f6d34aaa-9ae3-4c59-93a7-9bb7719f96fb	2026-06-21 09:00:14.382702	2026-06-21 09:00:14.382706	t
1ec37dff-47be-4fb9-82c7-689e70e1a060	1000000.00	IDR	success	qris	SUBSCRIPTION-d257d209-dcc5-4496-8cdd-50359777b182	2026-06-21	0fc17fa3-0307-457b-8e77-bab0827ff8e5	2026-06-21 09:00:19.474541	2026-06-21 09:00:19.474544	t
14750bb4-e68a-4ba4-89e6-4b0ae4d31e72	500000.00	IDR	success	qris	SUBSCRIPTION-b8bc1cc8-6d2e-410b-a274-f20803010e42	2026-06-24	1d10364d-e733-4d03-91e2-79ae15ed6275	2026-06-24 09:00:07.121139	2026-06-24 09:00:07.121141	t
14750bb4-e68a-4ba4-89e6-4b0ae4d31e72	500000.00	IDR	success	qris	SUBSCRIPTION-2bb17189-59df-4065-b964-9284c522970f	2026-06-24	83f824e9-b793-4f5e-87a3-48c153fc9744	2026-06-24 09:00:10.209855	2026-06-24 09:00:10.209857	t
85735449-e8aa-4eeb-a7fd-8c927af71b9b	500000.00	IDR	success	qris	SUBSCRIPTION-4e20158d-2aee-43f8-a49d-6dd68db35a54	2026-06-26	69611927-69c1-4e72-9a3f-d843e335baf7	2026-06-26 09:00:05.176656	2026-06-26 09:00:05.17666	t
85735449-e8aa-4eeb-a7fd-8c927af71b9b	500000.00	IDR	success	qris	SUBSCRIPTION-a6b2956f-31ad-4256-b4c5-bc8f7b3b024e	2026-06-26	5d005667-b257-42b1-bb27-eca3708a7bbf	2026-06-26 09:00:09.136043	2026-06-26 09:00:09.136045	t
8aca0664-8451-4061-9b26-8a6056440a8f	200000.00	IDR	success	qris	SUBSCRIPTION-6dd72abb-d2a4-4d96-bc28-803ca83f3b97	2026-07-02	522d6584-bcb3-40cb-bcd5-bdd4f66785a0	2026-07-02 09:00:04.83656	2026-07-02 09:00:04.836564	t
8aca0664-8451-4061-9b26-8a6056440a8f	200000.00	IDR	success	qris	SUBSCRIPTION-d7fddf74-fdcb-45ea-8735-769246f76d37	2026-07-02	cd9cb69b-281b-4d2b-87ec-93b84160dbe7	2026-07-02 09:00:06.060227	2026-07-02 09:00:06.060229	t
bc8c0c7b-e7e5-472b-a3d9-b234afdd2af9	300000.00	IDR	success	qris	SUBSCRIPTION-6d2ab0b7-e6e8-45c2-b469-89764b9e8a12	2026-07-04	eec569c5-7fb9-494a-9565-7242eb541362	2026-07-04 09:00:03.884516	2026-07-04 09:00:03.884519	t
bc8c0c7b-e7e5-472b-a3d9-b234afdd2af9	300000.00	IDR	success	qris	SUBSCRIPTION-0972e516-c508-4657-b955-aabf641ab7bf	2026-07-04	b87970fc-4479-4123-9d0f-157a72c0e5d1	2026-07-04 09:00:06.202461	2026-07-04 09:00:06.202463	t
97c6a42c-1419-4245-897c-3fde9b923cc6	300000.00	IDR	success	qris	SUBSCRIPTION-1c7e8887-d8b8-4549-9845-17e517778168	2026-07-04	abaa086a-1175-4154-8e23-fb2159210241	2026-07-04 09:00:07.470727	2026-07-04 09:00:07.47073	t
76a45b07-cf7a-497a-bf00-3d2a870bebcc	300000.00	IDR	success	qris	SUBSCRIPTION-a1842fa8-a999-48cd-a235-f6a944ec9699	2026-07-04	d973b586-e788-4c70-b9be-3139e93f3869	2026-07-04 09:00:11.04356	2026-07-04 09:00:11.043563	t
97c6a42c-1419-4245-897c-3fde9b923cc6	300000.00	IDR	success	qris	SUBSCRIPTION-6de51528-2e2e-4d2d-b428-265571e59eea	2026-07-04	75e8008f-a09c-48bb-8ffc-ec8864184cc0	2026-07-04 09:00:11.857884	2026-07-04 09:00:11.857887	t
3027205a-aa04-4e8e-930c-8da96147c8a9	300000.00	IDR	success	bank_transfer	SUBSCRIPTION-16e13524-f222-40d0-b313-715105e6b778	2026-07-04	06ffd3c8-8896-4341-b2c5-5d003bd4475d	2026-07-04 09:00:14.615538	2026-07-04 09:00:14.615541	t
76a45b07-cf7a-497a-bf00-3d2a870bebcc	300000.00	IDR	success	qris	SUBSCRIPTION-916f7472-da00-4277-b94f-ace0db8f0aa1	2026-07-04	68fa3d13-4538-490e-84a4-a02b6fad757f	2026-07-04 09:00:16.468685	2026-07-04 09:00:16.468687	t
5af23431-9769-4e3a-8f39-94bdd13b7d67	300000.00	IDR	success	bank_transfer	SUBSCRIPTION-58744656-9ada-4373-995d-df5f2b63c406	2026-07-04	7a2e112d-507e-4371-89e9-6c4e325b5fe3	2026-07-04 09:00:18.187566	2026-07-04 09:00:18.187569	t
3027205a-aa04-4e8e-930c-8da96147c8a9	300000.00	IDR	success	bank_transfer	SUBSCRIPTION-bbc2f86f-3574-4f57-b29b-e4254cd08390	2026-07-04	4aaa924a-5d49-49e6-9ebf-fe8dc7ba3992	2026-07-04 09:00:20.996073	2026-07-04 09:00:20.996076	t
a7e8f381-386d-4cb5-a41c-842cd262f45d	499998.00	IDR	success	qris	SUBSCRIPTION-e33ed2d2-7e89-4f30-baf0-ad984c061711	2026-07-04	2fbf4212-d11b-49c6-b8cc-d5d117c21d88	2026-07-04 09:00:21.758863	2026-07-04 09:00:21.758867	t
92641fdd-bb10-4282-a6e5-69a70309eb7b	300000.00	IDR	success	qris	SUBSCRIPTION-0de486f3-c8cf-4c0c-ab44-4cb16b8bda24	2026-07-04	4577bf1b-cc83-44a4-913a-f0fa5806e537	2026-07-04 09:00:25.330494	2026-07-04 09:00:25.330497	t
5af23431-9769-4e3a-8f39-94bdd13b7d67	300000.00	IDR	success	bank_transfer	SUBSCRIPTION-5cc670d6-0c20-4557-95a8-2959fd965d0e	2026-07-04	6fc15208-ebcb-425c-b418-26eb6b54a6a4	2026-07-04 09:00:25.940673	2026-07-04 09:00:25.940676	t
a7e8f381-386d-4cb5-a41c-842cd262f45d	499998.00	IDR	success	qris	SUBSCRIPTION-5c9d2067-d233-474a-bb96-7aff0af2a8db	2026-07-04	7b686b96-44a5-4a52-8c01-6858578eda0f	2026-07-04 09:00:30.520686	2026-07-04 09:00:30.520688	t
92641fdd-bb10-4282-a6e5-69a70309eb7b	300000.00	IDR	success	qris	SUBSCRIPTION-85d61a07-195f-4f64-ad99-36cad6ab3f9b	2026-07-04	08bc3814-891f-4685-a5a4-e9538546aa82	2026-07-04 09:00:35.032618	2026-07-04 09:00:35.032621	t
ded4d128-3ecf-41fb-aa03-cb1ecc32e982	300000.00	IDR	success	qris	SUBSCRIPTION-399ef0db-31f4-4929-9004-e1201870af6b	2026-07-04	f788f748-bcdf-4923-a456-b14ada841eb2	2026-07-04 09:00:39.655532	2026-07-04 09:00:39.655534	t
085581c9-4a52-4957-8669-d7593bf3b7c9	500000.00	IDR	success	qris	SUBSCRIPTION-abfc27fb-b18e-468d-8788-1f7cbb00fc59	2026-07-04	0ed92460-a598-48e7-8570-9e0b8f91f197	2026-07-04 09:00:44.182969	2026-07-04 09:00:44.182972	t
9ebd2580-a901-4197-a9ca-edf1cf3a0436	500000.00	IDR	success	qris	SUBSCRIPTION-783ed027-db25-4e91-89a7-9c674071e640	2026-07-04	abefa2d4-2434-46ee-a781-392d9e93bd14	2026-07-04 09:00:48.810511	2026-07-04 09:00:48.810513	t
dd60637b-a81f-4e65-9578-369710e12077	300000.00	IDR	success	qris	SUBSCRIPTION-a28b3b10-5dd3-4a3c-8471-ee4f0706d02c	2026-07-04	8f24ad8d-0d1e-4d7c-882e-e9cbaa485028	2026-07-04 09:00:53.383476	2026-07-04 09:00:53.383478	t
5d73d74f-8f68-4f09-b14a-2ae97009eca4	500000.00	IDR	success	qris	SUBSCRIPTION-ac66541c-3d3b-454d-8f54-b4a53094d60f	2026-07-04	f88f55df-6ff7-4d95-b08c-f1d940ff7108	2026-07-04 09:00:57.885217	2026-07-04 09:00:57.885219	t
ded4d128-3ecf-41fb-aa03-cb1ecc32e982	300000.00	IDR	success	qris	SUBSCRIPTION-e9ae9c21-8db7-4250-ab9f-910ad17fb99e	2026-07-04	743f928b-a0e7-44af-963a-a712717db43c	2026-07-04 09:00:28.900751	2026-07-04 09:00:28.900754	t
085581c9-4a52-4957-8669-d7593bf3b7c9	500000.00	IDR	success	qris	SUBSCRIPTION-4fa8e02d-077c-443e-aa59-9caddeb29b16	2026-07-04	d7891655-e3fe-4430-8ee0-b3a9826889de	2026-07-04 09:00:32.471312	2026-07-04 09:00:32.471315	t
9ebd2580-a901-4197-a9ca-edf1cf3a0436	500000.00	IDR	success	qris	SUBSCRIPTION-11d4b4da-6a4b-4fa8-878b-ba8e009775c4	2026-07-04	cecd066e-f04d-4e94-b5d0-e4059b41f40c	2026-07-04 09:00:36.044133	2026-07-04 09:00:36.044136	t
dd60637b-a81f-4e65-9578-369710e12077	300000.00	IDR	success	qris	SUBSCRIPTION-05f0ca7d-aaa6-4875-970d-1956ea4b2df8	2026-07-04	f24a380c-4866-4b77-b301-c60248950251	2026-07-04 09:00:39.902071	2026-07-04 09:00:39.902074	t
5d73d74f-8f68-4f09-b14a-2ae97009eca4	500000.00	IDR	success	qris	SUBSCRIPTION-b7092c58-154a-42e4-8eb5-26aeed46e603	2026-07-04	0825e440-681a-4f1b-9736-396de6613eef	2026-07-04 09:00:43.473121	2026-07-04 09:00:43.473124	t
1b4e3bb8-42e5-4d44-aa9c-bc8f83c34b91	500000.00	IDR	success	qris	SUBSCRIPTION-0bae5d1b-7af5-409f-b3b2-fc342e0a607c	2026-07-04	534b3d6e-fdf1-4c14-b5d0-75a0ec10d39f	2026-07-04 09:00:47.04297	2026-07-04 09:00:47.042974	t
1b4e3bb8-42e5-4d44-aa9c-bc8f83c34b91	500000.00	IDR	success	qris	SUBSCRIPTION-345368fb-b894-4b65-94dc-058c5bace609	2026-07-04	18a393e2-8cdc-4617-bda7-d7621c970d29	2026-07-04 09:01:02.504753	2026-07-04 09:01:02.504755	t
e462fadf-ac63-4560-92ed-5f5e330b60fb	500000.00	IDR	success	midtrans	SUBSCRIPTION-8379c223-7182-4cc6-98ff-3245d11afcad	2026-07-07	e874cb39-bd30-4d5d-9a16-99d6c449fbd7	2026-07-07 09:00:04.698795	2026-07-07 09:00:04.698799	t
e462fadf-ac63-4560-92ed-5f5e330b60fb	500000.00	IDR	success	midtrans	SUBSCRIPTION-c5985cef-981e-4900-a4e9-c5fe1a50155f	2026-07-07	f97ccc6e-14ff-4ae1-8bbc-2e566eb82783	2026-07-07 09:00:06.00957	2026-07-07 09:00:06.009572	t
79e70f47-dd49-423a-a399-a2829d9c0f78	300000.00	IDR	success	midtrans	SUBSCRIPTION-bd5c5ce8-f45c-48d5-9dd7-13c1f1f99dd6	2026-07-10	f639fe13-be75-4096-98ee-74f863c8cf6e	2026-07-10 09:00:03.859756	2026-07-10 09:00:03.859758	t
57ebfb4c-a248-4255-9256-5018b0948ac7	300000.00	IDR	success	midtrans	SUBSCRIPTION-ffe1b62a-9d86-40b3-a9e2-5dc942873660	2026-07-10	fbbba6c5-fa76-4ff8-bff5-70bfe31c07c1	2026-07-10 09:00:07.475459	2026-07-10 09:00:07.475463	t
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cart_items (id, created_at, updated_at, is_active, beneficiary_id, product_id, quantity) FROM stdin;
de5c4020-2ff5-474f-b01e-f233dd8698aa	2026-04-18 07:28:51.150485	2026-04-18 07:28:51.15049	t	20000000-0000-0000-0000-000000000001	8e2f9aae-677c-4aaa-9db3-84a67177142c	2
95959e90-8603-405f-abf2-31c780d94114	2026-04-18 07:28:51.150502	2026-04-18 07:28:51.150505	t	20000000-0000-0000-0000-000000000001	92d77e1e-fb1a-4ad5-9cfb-43248982451d	2
fc6b42c7-cd10-4d0c-83dd-2b6bbf67798f	2026-04-18 07:28:51.150515	2026-04-18 07:28:51.150517	t	20000000-0000-0000-0000-000000000001	6b5f2673-fb03-41b0-8c66-cda70ec9320a	2
52f8517b-6a9a-4ad3-b2de-2c5596d665ce	2026-04-18 11:37:54.700106	2026-04-19 13:43:12.1997	f	ee4f68ab-cc12-45f8-92b6-3c1f7422aff6	bff8c61b-f916-452a-9c42-2aac1f8b9732	1
850eee71-9310-4f81-8d57-029b7518ebf9	2026-04-18 11:38:09.196068	2026-04-19 13:43:12.199708	f	ee4f68ab-cc12-45f8-92b6-3c1f7422aff6	1c70b8b7-7e36-4f4c-b2cb-6c97e2904267	1
dbccf002-d251-47f9-b7fa-16d8903c2455	2026-04-18 07:43:21.328924	2026-04-20 11:22:15.565248	t	ee4f68ab-cc12-45f8-92b6-3c1f7422aff6	70b9c4cc-8c93-4123-b017-312a80613a4f	1
125c444a-dd99-4af8-948b-f4f486ab15cd	2026-04-18 11:37:38.035474	2026-04-20 11:22:19.800007	t	ee4f68ab-cc12-45f8-92b6-3c1f7422aff6	1532b217-3691-4fb9-aa33-83320ac5dd0e	1
14ecfe39-fbc8-4071-9f21-23f1c5529fdd	2026-04-18 11:37:57.158182	2026-04-20 11:22:23.160977	t	ee4f68ab-cc12-45f8-92b6-3c1f7422aff6	6c1a7521-4128-4358-b576-fca4f5c099d4	1
e703ece1-3a23-4621-812c-7bdf01cf117c	2026-04-18 07:43:26.802396	2026-04-20 11:22:34.790927	t	ee4f68ab-cc12-45f8-92b6-3c1f7422aff6	b04a62c9-4464-4ed9-9452-a8174ac236a5	1
c1fd9081-cc87-42f8-9e9a-c139051d9e03	2026-04-21 02:35:34.12697	2026-04-21 06:55:21.248953	f	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	e3823f8b-33a5-4c8e-9dca-4ed400c7acd8	1
8182531c-d174-4d8e-900c-ab90c321e652	2026-06-14 14:38:05.979857	2026-06-14 14:44:56.476059	f	f19ca67e-9299-40a3-ab61-e5dd911ccd2f	ff408132-0e2c-4c16-bdd7-50daf4027ef4	1
1c722fcf-3c97-42d2-add3-58def9694ab0	2026-05-04 16:07:45.59888	2026-05-05 06:33:03.236924	f	f19ca67e-9299-40a3-ab61-e5dd911ccd2f	0d78dcb3-e2c4-4cd8-b76c-425d6a40986f	1
aa613d71-2f44-4424-aaa5-392347a4c027	2026-05-05 06:31:19.478801	2026-05-05 06:33:03.236924	f	f19ca67e-9299-40a3-ab61-e5dd911ccd2f	e3823f8b-33a5-4c8e-9dca-4ed400c7acd8	1
de0a7f23-0ce8-4581-91e6-b737dfe63c4d	2026-05-05 06:31:11.727218	2026-05-05 06:33:03.236924	f	f19ca67e-9299-40a3-ab61-e5dd911ccd2f	ba804e5d-7838-4adb-bea0-6ebcd8a1ca2f	1
335e090d-213e-45cf-bbe0-0bfd2332c446	2026-06-14 14:44:42.697508	2026-06-14 14:44:44.433564	f	f19ca67e-9299-40a3-ab61-e5dd911ccd2f	eb07cafa-8f05-4728-b194-c90670454ff6	1
6cd0667a-2e08-4dc3-b874-9e84d3d597ab	2026-04-22 04:14:18.820286	2026-05-08 17:20:30.00909	f	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	da4fffaf-31d1-46c9-a173-88ac0ebfa332	1
1f72bb80-ac19-4cc3-abe1-66db3e5c31ef	2026-06-14 14:26:55.933449	2026-06-14 14:44:45.950655	f	f19ca67e-9299-40a3-ab61-e5dd911ccd2f	d6d242a2-e409-45e8-8e42-876992abaeab	1
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (name, slug, description, icon_url, display_order, id, created_at, updated_at, is_active) FROM stdin;
Beras	beras	Beras dan sumber karbohidrat	\N	1	ccbe2f35-343c-4198-b875-b910da013afa	2026-04-18 07:28:48.233398	2026-04-18 07:28:48.233404	t
Protein	protein	Telur, ikan, ayam, daging	\N	2	7cf46de2-2bff-4476-9c1d-e5376bdc2abb	2026-04-18 07:28:48.233416	2026-04-18 07:28:48.233419	t
Sayuran	sayuran	Sayuran segar	\N	3	ba4ebdf7-535a-450d-892c-72886fa3f30d	2026-04-18 07:28:48.233429	2026-04-18 07:28:48.233432	t
Buah	buah	Buah segar	\N	4	31e860cf-a254-43d8-b48b-7ca432c32672	2026-04-18 07:28:48.233441	2026-04-18 07:28:48.233443	t
Susu	susu	Susu dan produk dairy	\N	5	f7b66693-9d12-450a-873d-84fa8f942872	2026-04-18 07:28:48.23345	2026-04-18 07:28:48.233452	t
Bumbu	bumbu	Bumbu dan pelengkap	\N	6	09d47c16-5464-4b71-90bd-d28df7164f61	2026-04-18 07:28:48.233461	2026-04-18 07:28:48.233463	t
Pokok	\N	Kategori Pokok	\N	0	565c4947-5da0-4f71-887a-1e9e1456f39e	2026-04-20 15:21:44.087596	2026-04-20 15:21:44.087602	t
Minyak	\N	Kategori Minyak	\N	0	0097fcac-654a-48be-8658-9606ecb05e19	2026-04-20 15:21:44.235458	2026-04-20 15:21:44.235465	t
Gula	\N	Kategori Gula	\N	0	b635909c-d8c5-4fef-a423-b21613f9c6b1	2026-04-20 15:21:44.292443	2026-04-20 15:21:44.29245	t
\.


--
-- Data for Name: children; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.children (beneficiary_id, full_name, date_of_birth, gender, id, created_at, updated_at, is_active) FROM stdin;
20000000-0000-0000-0000-000000000001	Anak A	2024-04-18	female	40000000-0000-0000-0000-000000000001	2026-04-18 07:28:47.187746	2026-04-18 07:28:47.187753	t
20000000-0000-0000-0000-000000000001	Anak B	2023-04-19	male	40000000-0000-0000-0000-000000000002	2026-04-18 07:28:47.187757	2026-04-18 07:28:47.18776	t
ee4f68ab-cc12-45f8-92b6-3c1f7422aff6	Ahmad	2026-01-20	male	62f4b179-81e2-446b-904e-4adfacd629a0	2026-04-20 13:14:27.557205	2026-04-20 13:14:27.557215	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	Dewi	2022-04-15	female	387e42a2-85e6-41b5-b962-bf846afabb37	2026-04-20 15:21:43.835622	2026-04-20 15:21:43.835628	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	Budi Santoso	2026-04-02	female	04b63762-8074-47b6-b443-6a097505cd26	2026-05-18 14:25:55.686296	2026-05-18 14:25:55.686296	t
319688e1-ad41-4c83-a381-a8a700681e3d	Ema	2026-03-12	female	626b3390-2b7c-46ce-9943-3b47ecb5b3cd	2026-05-19 08:50:47.362822	2026-05-19 08:50:47.362827	t
c5a8b3e9-5677-4577-aabc-a25446f0ae61	Dewi	2022-04-15	female	485325fa-62a0-4dec-9825-a14e970381df	2026-05-26 01:36:47.494058	2026-05-26 01:36:47.494065	t
fe740ebf-30f7-4fe7-a1b8-5757f8113719	Kotali	2005-07-19	male	f2bfcebf-1cfd-42f4-9af6-2003b01c2c61	2026-06-10 09:18:46.570916	2026-06-10 09:18:46.570919	t
\.


--
-- Data for Name: donations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.donations (donor_id, recipient_id, amount, type, status, payment_method, midtrans_transaction_id, subscription_config, id, created_at, updated_at, is_active, subscription_id) FROM stdin;
10000000-0000-0000-0000-000000000001	20000000-0000-0000-0000-000000000001	350000.00	one_time	success	midtrans	MID-E2E-001	\N	50000000-0000-0000-0000-000000000001	2026-03-29 07:28:50.205462	2026-04-18 07:28:50.361662	t	\N
10000000-0000-0000-0000-000000000001	20000000-0000-0000-0000-000000000001	500000.00	subscription	success	qris	MID-E2E-002	{"interval": "monthly", "next_billing_date": "2026-05-18T07:28:50.205462"}	50000000-0000-0000-0000-000000000002	2026-04-08 07:28:50.205462	2026-04-18 07:28:50.387537	t	\N
e848d29b-a53b-4cde-86cc-c6712dadce20	\N	500000.00	one_time	success	midtrans	MOCK-DEMO-1-6994AEA4	\N	48a4b373-d9ab-46e4-8a75-daf475b90945	2026-05-26 01:36:47.403128	2026-05-26 01:36:47.403136	t	\N
52fae754-5e5d-41c9-9817-5c952533bd84	\N	500000.00	subscription	success	qris	MOCK-9FFA69C107B4	null	4b2d6e2e-c445-4e9d-abd5-4f06094d5eb9	2026-04-20 01:55:08.973885	2026-04-20 01:55:20.206527	t	\N
e848d29b-a53b-4cde-86cc-c6712dadce20	\N	500000.00	one_time	success	midtrans	MOCK-DEMO-2-8F5E0B26	\N	74f60863-2f9a-47ea-8c42-b69e01788141	2026-05-26 01:36:47.403152	2026-05-26 01:36:47.403156	t	\N
e848d29b-a53b-4cde-86cc-c6712dadce20	\N	500000.00	one_time	success	midtrans	MOCK-DEMO-3-F87703A4	\N	a9bafe34-ace5-484f-a6fd-325c4563bfc5	2026-05-26 01:36:47.403168	2026-05-26 01:36:47.40317	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	success	qris	MOCK-F00386DF25D3	null	0ce571f3-fe8e-46b6-917f-64c3f71b5f75	2026-04-22 04:18:52.115976	2026-05-26 01:36:47.960731	t	a7653005-5392-484e-a773-a39aba74da61
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	pending	qris	\N	null	9f3b02e4-442f-44a7-910e-8cde0638e9c2	2026-05-05 01:21:13.529446	2026-05-26 01:36:47.960809	t	085581c9-4a52-4957-8669-d7593bf3b7c9
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	one_time	success	midtrans	MOCK-DEMO-3-DBADF0D6	\N	9fcfd83d-0e24-469d-a65e-f35d426aa89b	2026-04-20 15:21:43.740765	2026-05-26 01:36:47.960811	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	bank_transfer	\N	null	a144df2e-4702-4ca3-a7f2-7df3b4735cba	2026-05-05 01:01:03.571128	2026-05-26 01:36:47.960813	t	5af23431-9769-4e3a-8f39-94bdd13b7d67
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	qris	\N	null	a2261e9f-0d3d-43eb-8b8a-746332bc433e	2026-05-05 00:56:39.686154	2026-05-26 01:36:47.960815	t	97c6a42c-1419-4245-897c-3fde9b923cc6
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	pending	qris	\N	null	a50de577-1796-4ced-a9e6-674e0e742249	2026-04-21 23:45:22.1508	2026-05-26 01:36:47.960817	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	pending	qris	\N	null	a6ad43c5-1533-47f2-8bbb-58f19e28cda5	2026-05-19 08:58:02.141207	2026-05-26 01:36:47.960819	t	3502e3bb-0f2d-4c52-81bc-8ec444d1bb4a
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	one_time	success	midtrans	MOCK-DEMO-2-EECB093E	\N	a7acd029-a1f0-4d8d-b5fe-671c683c46ed	2026-04-20 15:21:43.740752	2026-05-26 01:36:47.960822	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	qris	\N	null	aa5a8d93-d5dc-45a7-afef-5834e144a51a	2026-05-05 00:48:37.885246	2026-05-26 01:36:47.960824	t	bc8c0c7b-e7e5-472b-a3d9-b234afdd2af9
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	success	qris	MOCK-4E298AAAD782	null	abb15c9b-5e89-4ce3-936f-bab39b40df1a	2026-04-21 06:07:25.171826	2026-05-26 01:36:47.960826	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	one_time	success	midtrans	MOCK-DEMO-1-20485755	\N	b4c46d52-1e9f-4fca-a810-c53e818cf7ab	2026-04-20 15:21:43.740733	2026-05-26 01:36:47.960828	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	qris	\N	null	b561a692-010d-4b7c-bacc-4afda3479df6	2026-05-19 13:20:59.46785	2026-05-26 01:36:47.960831	t	06b1bcac-0d29-4fe5-b021-00d31bbff5e5
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	pending	qris	\N	null	b802490b-9a20-4275-8c8d-6ebd070ade47	2026-04-21 23:38:15.623295	2026-05-26 01:36:47.960834	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	qris	\N	null	b905a724-7bf4-438e-9baf-e665875cb94e	2026-04-21 06:11:15.402515	2026-05-26 01:36:47.960837	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	qris	\N	null	bd75ffb1-2496-4131-b95e-c2080114cf61	2026-05-05 01:05:12.98183	2026-05-26 01:36:47.96084	t	92641fdd-bb10-4282-a6e5-69a70309eb7b
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	success	qris	MOCK-CEC9DC1B7890	null	c14884e2-907b-42ba-94c8-b535dc829c11	2026-04-22 01:28:19.180514	2026-05-26 01:36:47.960842	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	pending	qris	\N	null	ce89139c-34f6-47a0-94ff-9671c709f6d0	2026-05-19 09:00:51.372154	2026-05-26 01:36:47.960845	t	b3e7595f-26fc-422f-9fa0-725398fd4412
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	qris	\N	null	cf4914f4-4dcc-48fc-a0f5-d90b4e2df1a2	2026-04-21 06:11:46.118341	2026-05-26 01:36:47.960847	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	pending	qris	\N	null	d40684ee-5a18-4287-b9c5-cff426d577c4	2026-04-22 00:11:43.843765	2026-05-26 01:36:47.960851	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	qris	\N	null	d40d8c70-55c7-45cc-8dad-ffb52e47dd3a	2026-05-05 01:12:59.24733	2026-05-26 01:36:47.960853	t	ded4d128-3ecf-41fb-aa03-cb1ecc32e982
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	pending	qris	\N	null	d5a79831-f656-46fc-a42a-057a6d3e4491	2026-04-22 00:19:29.789452	2026-05-26 01:36:47.960855	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	success	qris	ALLOC-8E1A0832BC8E	null	d6a01f08-6c26-4508-88c0-fa8f7732e0dd	2026-05-05 07:36:03.399527	2026-05-26 01:36:47.960857	t	5d73d74f-8f68-4f09-b14a-2ae97009eca4
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	success	qris	MOCK-263D70E67D79	null	dccba563-53b7-4542-b9c3-9d634f3bdc5a	2026-04-21 06:07:08.963014	2026-05-26 01:36:47.960859	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	qris	\N	null	dce7d4a5-033b-481a-acd8-baed5320a49d	2026-04-21 06:15:01.482187	2026-05-26 01:36:47.960861	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	pending	qris	\N	null	dda2a3f1-b22f-4df9-8110-3e18c9985bd7	2026-05-19 09:00:26.956784	2026-05-26 01:36:47.960864	t	07e6ea4a-154a-40db-883e-84fd2aba5020
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	1000000.00	subscription	success	qris	SUBSCRIPTION-de5700b7-02b2-4be4-8aaa-ddcb19045cdd	{"subscription_id": "1ec37dff-47be-4fb9-82c7-689e70e1a060", "billing_cycle": 2, "auto_billing": true}	de5700b7-02b2-4be4-8aaa-ddcb19045cdd	2026-05-22 09:00:01.718775	2026-05-26 01:36:47.960866	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	qris	\N	null	e27dea50-b000-4ffa-ae75-1cb67f5d5236	2026-04-21 06:18:18.826939	2026-05-26 01:36:47.960869	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	pending	bank_transfer	\N	null	e7040ad7-0c16-4c5a-b07a-6fff6a4f7272	2026-04-21 23:15:49.551004	2026-05-26 01:36:47.960871	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	qris	\N	null	e7e32a97-5638-4152-877a-e8649a7b54b3	2026-04-21 06:12:58.36409	2026-05-26 01:36:47.960874	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	qris	\N	null	ebcbd77f-d522-4821-acf0-17fbb632e7f6	2026-05-19 09:12:14.074278	2026-05-26 01:36:47.960878	t	aed4e1fd-40c5-4dc7-ba6d-d67e419a7c52
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	success	qris	MOCK-0F535327F208	null	f0705036-7d9c-4244-925f-d1054cf426c8	2026-04-21 23:06:05.695157	2026-05-26 01:36:47.96088	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	success	qris	SUBSCRIPTION-f673d639-c180-493b-94e1-53198b73ccb0	{"subscription_id": "a7653005-5392-484e-a773-a39aba74da61", "billing_cycle": 3, "auto_billing": true}	f673d639-c180-493b-94e1-53198b73ccb0	2026-05-22 09:00:10.602986	2026-05-26 01:36:47.960883	t	\N
642a6f09-0362-449f-aa96-af1c02bcc955	\N	500000.00	subscription	pending	qris	\N	null	58b41cd7-8c2f-4ef4-953d-ebeb17f211f7	2026-04-22 00:21:05.944893	2026-04-22 00:21:05.9449	t	\N
642a6f09-0362-449f-aa96-af1c02bcc955	\N	500000.00	subscription	pending	qris	\N	null	a1d23414-92fe-4191-b86a-c7c4db420cd2	2026-04-22 00:37:25.508551	2026-04-22 00:37:25.508564	t	\N
ae19f5a1-35f1-413c-af42-c7001ee9492f	\N	300000.00	subscription	pending	qris	\N	null	6baf8441-0b39-4bac-8ed2-4b9fca2c185f	2026-04-22 00:39:23.743213	2026-04-22 00:39:23.743223	t	\N
ae19f5a1-35f1-413c-af42-c7001ee9492f	\N	300000.00	subscription	pending	qris	\N	null	dee7d304-be74-4e24-9eff-e0fb9fc07002	2026-04-22 01:01:21.678152	2026-04-22 01:01:21.678157	t	\N
ae19f5a1-35f1-413c-af42-c7001ee9492f	\N	300000.00	subscription	pending	qris	\N	null	d239c761-81af-4ab5-8d5d-1ed95004402a	2026-04-22 01:11:14.630747	2026-04-22 01:11:14.630754	t	\N
ae19f5a1-35f1-413c-af42-c7001ee9492f	\N	500000.00	subscription	pending	bank_transfer	\N	null	c8ab4f17-2690-4f0c-813f-24d898aebfc5	2026-04-22 01:12:57.788675	2026-04-22 01:12:57.78868	t	\N
ae19f5a1-35f1-413c-af42-c7001ee9492f	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	success	qris	MOCK-22132FC96AEE	null	26b40c9c-c251-4fce-b591-07adcfbe7a97	2026-04-22 01:23:52.662697	2026-04-22 01:23:54.781682	t	\N
f3ada4b1-2bba-4155-bb2e-5cee4b791390	\N	500000.00	subscription	success	qris	ALLOC-6703B97FCBCA	null	32a0183f-a55b-4d5b-92c8-2487403f5dc6	2026-04-27 13:48:50.838472	2026-04-27 13:48:54.682871	t	85735449-e8aa-4eeb-a7fd-8c927af71b9b
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	500000.00	one_time	pending	qris	\N	null	837a12aa-a804-4aa5-afb0-edcd6909556f	2026-05-03 09:58:18.326963	2026-05-03 09:58:18.326963	t	\N
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	500000.00	one_time	pending	qris	\N	null	da678a5e-f1ad-41d8-970f-0e9cc6110b9a	2026-05-03 09:59:48.761484	2026-05-03 09:59:48.761484	t	\N
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	500000.00	one_time	pending	qris	\N	null	a90fbccd-3eb8-417d-8273-6a2df3204386	2026-05-03 10:00:24.4491	2026-05-03 10:00:24.4491	t	\N
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	300000.00	subscription	pending	qris	\N	null	06f005a4-1a6a-4fa2-ae36-8cda724e9653	2026-05-03 10:03:59.753681	2026-05-03 10:04:01.531165	t	8aca0664-8451-4061-9b26-8a6056440a8f
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	1000000.00	one_time	pending	bank_transfer	\N	null	2c683828-7fae-4679-97c0-f23dbe57219a	2026-05-03 10:04:27.513903	2026-05-03 10:04:27.513903	t	\N
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	500000.00	one_time	pending	qris	\N	null	2f18425d-316b-4e35-9aca-e7d08ab51e1f	2026-05-03 14:29:17.799345	2026-05-03 14:29:17.799345	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	1000000.00	subscription	success	qris	SUBSCRIPTION-06f0baba-8a07-4567-a108-c0068e5f3678	{"subscription_id": "1ec37dff-47be-4fb9-82c7-689e70e1a060", "billing_cycle": 2, "auto_billing": true}	06f0baba-8a07-4567-a108-c0068e5f3678	2026-05-22 09:00:02.237121	2026-05-26 01:36:47.96072	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	qris	\N	null	0715571b-08dc-448f-91bd-4bf68c3ca626	2026-05-19 09:02:54.794991	2026-05-26 01:36:47.960727	t	9d830579-32b7-4b55-a302-2f1ad8fc9f15
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	qris	\N	null	1e11adc0-84b8-4d40-af8f-8adc3b2d9aae	2026-05-05 01:31:54.734694	2026-05-26 01:36:47.960735	t	dd60637b-a81f-4e65-9578-369710e12077
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	success	qris	SUBSCRIPTION-25b1c35e-3b29-43be-9b65-d8a48cef7a3f	{"subscription_id": "a7653005-5392-484e-a773-a39aba74da61", "billing_cycle": 2, "auto_billing": true}	25b1c35e-3b29-43be-9b65-d8a48cef7a3f	2026-05-22 09:00:07.11408	2026-05-26 01:36:47.960738	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	success	qris	MOCK-317B94D8216A	null	2d81792a-c250-4313-8171-4beb58a1c7d5	2026-04-21 23:24:07.360677	2026-05-26 01:36:47.960741	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	qris	\N	null	2ecb3342-f873-49f0-9710-00d328de112c	2026-05-19 09:12:20.287388	2026-05-26 01:36:47.960743	t	802458a5-e416-45b8-8c2b-0503daff7ffc
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	pending	qris	\N	null	30e9f3dd-76cc-49f7-88c8-a9ef1490ce9f	2026-05-19 09:00:30.174761	2026-05-26 01:36:47.960746	t	2a5d374f-5282-4bba-971f-45db94bf1143
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	success	qris	\N	null	3257f1cb-c4c1-4400-bd56-8eaf08b9dd83	2026-05-25 18:18:58.240885	2026-05-26 01:36:47.960749	t	14750bb4-e68a-4ba4-89e6-4b0ae4d31e72
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	300000.00	subscription	pending	bank_transfer	\N	null	269f952e-596d-43cc-9da1-977b51ed84cb	2026-05-05 06:14:55.328502	2026-05-05 06:14:57.583514	t	8bd0c9af-49b3-42a6-84ec-79b6a3afae79
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	success	bank_transfer	MOCK-47FBC44D1A0B	null	337d5017-4a96-4a58-bacf-c52aa9e49210	2026-04-21 23:28:32.524552	2026-05-26 01:36:47.960752	t	\N
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	1000000.00	subscription	pending	qris	\N	null	b384f9df-229c-4730-86a4-59a800fb3076	2026-05-05 06:21:43.090114	2026-05-05 06:21:45.236812	t	0de717b0-dd05-4f7c-9c32-bec338268b88
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	300000.00	one_time	pending	qris	\N	null	556cb10d-6b72-46a1-b4a8-08ab2faabc01	2026-05-05 06:25:16.593923	2026-05-05 06:25:16.593923	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	499998.00	subscription	pending	qris	\N	null	349b70da-c31f-423b-8a68-bd5c9b41d721	2026-05-05 01:01:36.528468	2026-05-26 01:36:47.960754	t	a7e8f381-386d-4cb5-a41c-842cd262f45d
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	qris	\N	null	40302291-3d93-47e7-b428-042a8f0dc288	2026-04-21 23:24:52.899033	2026-05-26 01:36:47.960757	t	\N
f1177ee0-66c6-4167-923c-aeb1824d3c34	f19ca67e-9299-40a3-ab61-e5dd911ccd2f	300000.00	one_time	success	qris	ALLOC-7084210FA2AA	null	9c5135ca-bee5-43ef-a498-3719aac7210c	2026-05-05 06:27:27.463878	2026-05-05 06:29:20.515338	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	pending	qris	\N	null	469f36c5-6594-4fba-a57b-d56ad6d46ad5	2026-04-22 00:18:47.327399	2026-05-26 01:36:47.96076	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	qris	\N	null	4adf1f16-1425-4007-977a-46210fbe3b71	2026-04-21 06:26:39.785966	2026-05-26 01:36:47.960763	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	success	qris	ALLOC-76DFF11FCB8E	null	4bfb7829-c282-4bc5-bf9a-95fde3610a00	2026-05-05 01:25:37.10946	2026-05-26 01:36:47.960766	t	9ebd2580-a901-4197-a9ca-edf1cf3a0436
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	pending	qris	\N	null	58a91f83-e198-4fcc-8468-73a05806f13d	2026-04-21 23:37:27.052991	2026-05-26 01:36:47.960769	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	qris	\N	null	5ad63a15-d27c-441c-b328-d3bfcd5cc61c	2026-04-21 23:02:48.027916	2026-05-26 01:36:47.960772	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	qris	\N	null	5af3ff21-9117-4dfe-a529-513ba3f283c9	2026-05-19 09:03:58.153689	2026-05-26 01:36:47.960775	t	ba5eabb8-10de-41a3-984d-5de77629ebc1
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	qris	\N	null	5b8eac2f-b81c-4c1c-979f-c737bec15fa4	2026-05-05 00:58:34.019376	2026-05-26 01:36:47.960777	t	76a45b07-cf7a-497a-bf00-3d2a870bebcc
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	cancelled	qris	\N	null	5eee11b1-cfa3-4fbe-88d1-b16343820a63	2026-05-19 10:47:57.07955	2026-05-26 01:36:47.96078	t	763d75bf-7421-4e0c-8f90-f2f4749ccfaa
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	bank_transfer	\N	null	5ef7fd94-2dc1-42f3-ad20-ca9098dbcd3b	2026-05-05 00:59:10.009391	2026-05-26 01:36:47.960783	t	3027205a-aa04-4e8e-930c-8da96147c8a9
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	pending	qris	\N	null	fc0fe551-cbf5-4a66-807d-7a5f2ad1c54b	2026-04-21 23:37:14.023166	2026-05-26 01:36:47.960885	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	qris	\N	null	fefff3f3-b57d-43f0-9103-d35c5b6c97ba	2026-05-19 09:12:17.792661	2026-05-26 01:36:47.960889	t	fc1cabad-586b-49e2-96b2-295cff8ffe72
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	success	qris	\N	null	ffe5c004-bed7-4d8d-b13d-70002279d191	2026-05-19 10:44:28.916425	2026-05-26 01:36:47.960891	t	704dde7e-f48f-446b-8080-faf06f62ea65
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	300000.00	subscription	success	qris	SUBSCRIPTION-a6f65aa6-e612-4a60-98a5-d23e677f10b2	{"subscription_id": "8aca0664-8451-4061-9b26-8a6056440a8f", "billing_cycle": 2, "auto_billing": true}	a6f65aa6-e612-4a60-98a5-d23e677f10b2	2026-06-02 09:00:00.139136	2026-06-02 09:00:00.267866	t	\N
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	499999.00	one_time	pending	qris	\N	null	8a4d572f-69db-40ba-b5b0-50130c8e0730	2026-05-19 09:01:10.889816	2026-05-19 09:01:10.889821	t	\N
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	400000.00	subscription	success	qris	\N	null	f840837b-e665-4e89-8526-9cd415968964	2026-06-06 15:59:42.106689	2026-06-06 16:00:10.548937	t	4e943256-6531-43e1-9f53-71d8906e069b
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	499999.00	one_time	cancelled	qris	\N	null	7651a089-a40c-4cec-87a1-c90b6d9f8bb8	2026-05-19 09:02:12.371001	2026-05-19 09:02:40.92148	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	one_time	pending	midtrans	\N	null	af43f365-2202-40c9-9732-1f0c5d7c6a9d	2026-06-10 01:01:33.39088	2026-06-10 01:01:33.390884	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	one_time	pending	midtrans	\N	null	048aa224-3798-44ea-9533-43e002c2a722	2026-06-10 04:28:45.161474	2026-06-10 04:28:45.161477	t	\N
0aa32472-f539-4888-ab3f-db23cb4e5743	\N	20000.00	one_time	pending	midtrans	\N	null	bb5d0f6c-691a-41e9-9277-c2d34ca57b49	2026-06-10 09:25:35.520334	2026-06-10 09:25:35.520337	t	\N
8f567802-a7ad-4f4f-8534-bdc036b09b97	\N	10000.00	one_time	pending	midtrans	\N	null	cab73e30-a7e0-41a8-9d12-7ed6c63d134a	2026-06-10 12:36:16.53936	2026-06-10 12:36:16.539364	t	\N
10510d96-7171-4b5a-8ca0-b7090f8d6f58	\N	300000.00	one_time	cancelled	midtrans	\N	null	09502602-e6da-4a12-a1e9-416cdd78df1d	2026-06-10 14:00:34.608388	2026-06-10 14:00:50.30158	t	\N
10510d96-7171-4b5a-8ca0-b7090f8d6f58	\N	50000.00	one_time	pending	midtrans	\N	null	34b23e53-c96e-48de-909d-307fd6a3c0c8	2026-06-10 14:05:09.791173	2026-06-10 14:05:09.791177	t	\N
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	300000.00	one_time	success	midtrans	\N	null	f1d76399-3532-47ed-9c88-a83e50bbbe25	2026-06-17 02:50:16.566354	2026-06-17 02:51:32.993355	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-5d3a36d9-8242-4b60-916e-87049f812983	{"subscription_id": "3502e3bb-0f2d-4c52-81bc-8ec444d1bb4a", "billing_cycle": 2, "auto_billing": true}	5d3a36d9-8242-4b60-916e-87049f812983	2026-06-18 09:00:01.715649	2026-06-18 09:00:02.518972	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-9f4287b7-86e1-481e-995e-537809c5a1c5	{"subscription_id": "de5cf0e4-9fb7-4bec-ad4b-856c832c088b", "billing_cycle": 2, "auto_billing": true}	9f4287b7-86e1-481e-995e-537809c5a1c5	2026-06-18 09:00:09.619762	2026-06-18 09:00:10.401014	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-071fd337-25ab-4481-961f-dd7b40005ad7	{"subscription_id": "2a5d374f-5282-4bba-971f-45db94bf1143", "billing_cycle": 2, "auto_billing": true}	071fd337-25ab-4481-961f-dd7b40005ad7	2026-06-18 09:00:22.07312	2026-06-18 09:00:22.828611	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-f007265a-f485-4156-a608-911ae1f3ec96	{"subscription_id": "2a5d374f-5282-4bba-971f-45db94bf1143", "billing_cycle": 2, "auto_billing": true}	f007265a-f485-4156-a608-911ae1f3ec96	2026-06-18 09:00:28.229447	2026-06-18 09:00:29.230902	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-24bbf22c-320f-453d-89c2-81b64d29bca4	{"subscription_id": "b3e7595f-26fc-422f-9fa0-725398fd4412", "billing_cycle": 2, "auto_billing": true}	24bbf22c-320f-453d-89c2-81b64d29bca4	2026-06-18 09:00:29.610642	2026-06-18 09:00:30.344311	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-cc704126-b180-4017-a45e-31a5f6502379	{"subscription_id": "b3e7595f-26fc-422f-9fa0-725398fd4412", "billing_cycle": 2, "auto_billing": true}	cc704126-b180-4017-a45e-31a5f6502379	2026-06-18 09:00:35.839223	2026-06-18 09:00:36.796442	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-099847e9-9e77-46ef-a2b1-80bdfb8913ba	{"subscription_id": "9d830579-32b7-4b55-a302-2f1ad8fc9f15", "billing_cycle": 2, "auto_billing": true}	099847e9-9e77-46ef-a2b1-80bdfb8913ba	2026-06-18 09:00:43.237446	2026-06-18 09:00:44.190487	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-d3708f0a-3bbe-4f35-9ca7-1358f8d0f7c8	{"subscription_id": "0e901aea-4350-4a65-825d-02b3e75b2873", "billing_cycle": 2, "auto_billing": true}	d3708f0a-3bbe-4f35-9ca7-1358f8d0f7c8	2026-06-18 09:01:29.432814	2026-06-18 09:01:30.159331	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	pending	qris	\N	null	6c7df20a-754e-4ef0-986b-5244d6603cbf	2026-04-21 06:12:08.338394	2026-05-26 01:36:47.960786	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	1000000.00	subscription	success	qris	MOCK-7F770C74B16C	null	7cd126ff-5212-4670-a727-8b1027c8c396	2026-04-22 03:12:44.812945	2026-05-26 01:36:47.960789	t	1ec37dff-47be-4fb9-82c7-689e70e1a060
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	pending	qris	\N	null	818c79ba-3fa6-4d87-afcd-35b22585c0de	2026-04-21 23:37:31.196756	2026-05-26 01:36:47.960791	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	success	qris	MOCK-737674D3F9FC	null	85795914-3dd8-4683-981d-74aafeab9767	2026-04-21 22:58:47.181849	2026-05-26 01:36:47.960793	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	pending	qris	\N	null	88864997-1e75-4cc0-8a7d-cdce9e455a58	2026-04-21 23:37:50.985278	2026-05-26 01:36:47.960796	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	pending	qris	\N	null	8ac6def6-0242-4063-8fd3-e20efcca2252	2026-05-05 07:36:36.041511	2026-05-26 01:36:47.960798	t	1b4e3bb8-42e5-4d44-aa9c-bc8f83c34b91
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	300000.00	subscription	success	qris	\N	null	8d77e4b5-6d0b-4b31-813c-b84458c7d959	2026-05-19 13:20:35.17748	2026-05-26 01:36:47.9608	t	0e901aea-4350-4a65-825d-02b3e75b2873
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	1000000.00	subscription	success	bank_transfer	MOCK-D9A2D51852EB	null	95e8f6b3-922c-48d7-b14a-b3360e76b335	2026-04-21 23:12:46.182543	2026-05-26 01:36:47.960802	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	500000.00	subscription	pending	qris	\N	null	9dea60c0-a948-41de-be5b-91bdcb308fa0	2026-05-19 09:00:13.329889	2026-05-26 01:36:47.960806	t	de5cf0e4-9fb7-4bec-ad4b-856c832c088b
f3ada4b1-2bba-4155-bb2e-5cee4b791390	\N	500000.00	subscription	success	qris	SUBSCRIPTION-f79fbeab-ba4b-4759-acd8-2c31192e18cb	{"subscription_id": "85735449-e8aa-4eeb-a7fd-8c927af71b9b", "billing_cycle": 2, "auto_billing": true}	f79fbeab-ba4b-4759-acd8-2c31192e18cb	2026-05-27 09:00:00.133869	2026-05-27 09:00:00.259515	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-1c270e9c-310e-4478-80f5-1759beda0ac8	{"subscription_id": "bc8c0c7b-e7e5-472b-a3d9-b234afdd2af9", "billing_cycle": 2, "auto_billing": true}	1c270e9c-310e-4478-80f5-1759beda0ac8	2026-06-04 09:00:00.135492	2026-06-04 09:00:00.233508	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-af204ef6-8af5-4e19-bb91-25fe50ac553a	{"subscription_id": "97c6a42c-1419-4245-897c-3fde9b923cc6", "billing_cycle": 2, "auto_billing": true}	af204ef6-8af5-4e19-bb91-25fe50ac553a	2026-06-04 09:00:00.324946	2026-06-04 09:00:00.351862	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-fe8b0817-a066-4d2f-ba3e-533819d7639c	{"subscription_id": "76a45b07-cf7a-497a-bf00-3d2a870bebcc", "billing_cycle": 2, "auto_billing": true}	fe8b0817-a066-4d2f-ba3e-533819d7639c	2026-06-04 09:00:00.423225	2026-06-04 09:00:00.447618	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	bank_transfer	SUBSCRIPTION-f46176b1-8662-4151-88ad-3e20a8a64fea	{"subscription_id": "3027205a-aa04-4e8e-930c-8da96147c8a9", "billing_cycle": 2, "auto_billing": true}	f46176b1-8662-4151-88ad-3e20a8a64fea	2026-06-04 09:00:00.517458	2026-06-04 09:00:00.542541	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	bank_transfer	SUBSCRIPTION-e0dc018a-44dc-4e20-8ef1-8508cec7770a	{"subscription_id": "5af23431-9769-4e3a-8f39-94bdd13b7d67", "billing_cycle": 2, "auto_billing": true}	e0dc018a-44dc-4e20-8ef1-8508cec7770a	2026-06-04 09:00:00.611493	2026-06-04 09:00:00.636628	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	499998.00	subscription	success	qris	SUBSCRIPTION-872e853d-64d8-485a-9ea2-fea766f10564	{"subscription_id": "a7e8f381-386d-4cb5-a41c-842cd262f45d", "billing_cycle": 2, "auto_billing": true}	872e853d-64d8-485a-9ea2-fea766f10564	2026-06-04 09:00:00.707883	2026-06-04 09:00:00.731838	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-9308ea6a-270f-4d44-8e07-72c5edf832fd	{"subscription_id": "92641fdd-bb10-4282-a6e5-69a70309eb7b", "billing_cycle": 2, "auto_billing": true}	9308ea6a-270f-4d44-8e07-72c5edf832fd	2026-06-04 09:00:00.803722	2026-06-04 09:00:00.829836	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-e1db365c-631d-451d-a045-1208a33f281a	{"subscription_id": "ded4d128-3ecf-41fb-aa03-cb1ecc32e982", "billing_cycle": 2, "auto_billing": true}	e1db365c-631d-451d-a045-1208a33f281a	2026-06-04 09:00:00.897083	2026-06-04 09:00:00.923024	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-b694bd14-bc66-4a4a-9e50-d8cd07add700	{"subscription_id": "085581c9-4a52-4957-8669-d7593bf3b7c9", "billing_cycle": 2, "auto_billing": true}	b694bd14-bc66-4a4a-9e50-d8cd07add700	2026-06-04 09:00:00.99488	2026-06-04 09:00:01.018898	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-640ddb1c-db46-475c-8675-798e931b485d	{"subscription_id": "9ebd2580-a901-4197-a9ca-edf1cf3a0436", "billing_cycle": 2, "auto_billing": true}	640ddb1c-db46-475c-8675-798e931b485d	2026-06-04 09:00:01.090241	2026-06-04 09:00:01.113917	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-248a20ce-4d92-449b-9c85-45c2a0b73df5	{"subscription_id": "dd60637b-a81f-4e65-9578-369710e12077", "billing_cycle": 2, "auto_billing": true}	248a20ce-4d92-449b-9c85-45c2a0b73df5	2026-06-04 09:00:01.181691	2026-06-04 09:00:01.206931	t	\N
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	300000.00	subscription	success	bank_transfer	SUBSCRIPTION-5f428b53-3676-4756-bf61-a4c097d3b2ec	{"subscription_id": "8bd0c9af-49b3-42a6-84ec-79b6a3afae79", "billing_cycle": 2, "auto_billing": true}	5f428b53-3676-4756-bf61-a4c097d3b2ec	2026-06-04 09:00:01.276937	2026-06-04 09:00:01.301655	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-7d4ea92a-7241-4bce-a8fc-3b8fdc33988d	{"subscription_id": "5d73d74f-8f68-4f09-b14a-2ae97009eca4", "billing_cycle": 2, "auto_billing": true}	7d4ea92a-7241-4bce-a8fc-3b8fdc33988d	2026-06-04 09:00:01.367983	2026-06-04 09:00:01.393023	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-a356ebdf-76ca-495c-a2db-859d944128f4	{"subscription_id": "1b4e3bb8-42e5-4d44-aa9c-bc8f83c34b91", "billing_cycle": 2, "auto_billing": true}	a356ebdf-76ca-495c-a2db-859d944128f4	2026-06-04 09:00:01.460464	2026-06-04 09:00:01.484377	t	\N
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	500000.00	subscription	success	midtrans	\N	null	9e22a695-83c8-4579-ad27-aeaf6a0e8d90	2026-06-06 16:24:52.639261	2026-06-06 16:25:15.478772	t	e462fadf-ac63-4560-92ed-5f5e330b60fb
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	one_time	success	midtrans	\N	null	9ffa16c0-38dd-4493-a3ab-24043da446d1	2026-06-10 01:01:52.142182	2026-06-10 01:02:12.970951	t	\N
357bd5bf-909d-4317-83a5-556c926ed56a	\N	300000.00	subscription	pending	midtrans	\N	null	a72984a6-cb6c-4a5b-9451-3b48e4391383	2026-06-10 09:21:30.016169	2026-06-10 09:21:31.383147	t	79e70f47-dd49-423a-a399-a2829d9c0f78
8dd61c30-5521-431a-bebb-bbb676a73133	\N	300000.00	subscription	pending	midtrans	\N	null	5800ab2b-21a8-4618-9d37-d95cab9cfd52	2026-06-10 11:28:47.388094	2026-06-10 11:28:48.72061	t	57ebfb4c-a248-4255-9256-5018b0948ac7
8f567802-a7ad-4f4f-8534-bdc036b09b97	\N	10000.00	one_time	success	midtrans	\N	null	126d7a48-06ee-418e-acb5-1d2fbcd990eb	2026-06-10 12:44:02.83387	2026-06-10 12:44:50.467795	t	\N
10510d96-7171-4b5a-8ca0-b7090f8d6f58	\N	50000.00	one_time	pending	midtrans	\N	null	5a42842b-a286-4d19-ac47-624d332bfab3	2026-06-10 14:02:18.351521	2026-06-10 14:02:18.351523	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	one_time	cancelled	midtrans	\N	null	b0eaa242-b879-4a0d-a251-eb54c84dfabc	2026-06-15 07:27:34.316447	2026-06-15 07:27:42.129195	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	400000.00	one_time	success	midtrans	\N	null	0a78166d-e0e3-4e8c-adcc-b59e14935936	2026-06-17 06:37:31.850662	2026-06-17 06:38:11.303189	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-936aa129-a7c1-4509-bbe5-a0415208e2b5	{"subscription_id": "3502e3bb-0f2d-4c52-81bc-8ec444d1bb4a", "billing_cycle": 2, "auto_billing": true}	936aa129-a7c1-4509-bbe5-a0415208e2b5	2026-06-18 09:00:02.279233	2026-06-18 09:00:03.297007	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-01308c41-9583-4c3c-b9ed-8fe65b2a7940	{"subscription_id": "de5cf0e4-9fb7-4bec-ad4b-856c832c088b", "billing_cycle": 2, "auto_billing": true}	01308c41-9583-4c3c-b9ed-8fe65b2a7940	2026-06-18 09:00:13.226058	2026-06-18 09:00:14.193127	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-7be12ae1-a611-4fe0-b9aa-3b6eb928af15	{"subscription_id": "07e6ea4a-154a-40db-883e-84fd2aba5020", "billing_cycle": 2, "auto_billing": true}	7be12ae1-a611-4fe0-b9aa-3b6eb928af15	2026-06-18 09:00:15.637066	2026-06-18 09:00:16.375561	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-1db8f6d6-455c-4805-9ff4-b2f07e3ea429	{"subscription_id": "07e6ea4a-154a-40db-883e-84fd2aba5020", "billing_cycle": 2, "auto_billing": true}	1db8f6d6-455c-4805-9ff4-b2f07e3ea429	2026-06-18 09:00:20.724311	2026-06-18 09:00:21.703602	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-464fad88-e8b9-4084-bb86-7b1c32d83bd3	{"subscription_id": "9d830579-32b7-4b55-a302-2f1ad8fc9f15", "billing_cycle": 2, "auto_billing": true}	464fad88-e8b9-4084-bb86-7b1c32d83bd3	2026-06-18 09:00:37.185052	2026-06-18 09:00:37.893521	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-45b4cde2-9380-4f5d-a0e9-eb54e894a38b	{"subscription_id": "704dde7e-f48f-446b-8080-faf06f62ea65", "billing_cycle": 2, "auto_billing": true}	45b4cde2-9380-4f5d-a0e9-eb54e894a38b	2026-06-18 09:01:14.57888	2026-06-18 09:01:15.286512	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-63932533-22db-46e7-b61c-f11816c8fd3d	{"subscription_id": "0e901aea-4350-4a65-825d-02b3e75b2873", "billing_cycle": 2, "auto_billing": true}	63932533-22db-46e7-b61c-f11816c8fd3d	2026-06-18 09:01:35.558741	2026-06-18 09:01:36.525857	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-620b45e9-0097-4083-9ec4-f88818161241	{"subscription_id": "06b1bcac-0d29-4fe5-b021-00d31bbff5e5", "billing_cycle": 2, "auto_billing": true}	620b45e9-0097-4083-9ec4-f88818161241	2026-06-18 09:01:43.060373	2026-06-18 09:01:44.062283	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-2bb17189-59df-4065-b964-9284c522970f	{"subscription_id": "14750bb4-e68a-4ba4-89e6-4b0ae4d31e72", "billing_cycle": 2, "auto_billing": true}	2bb17189-59df-4065-b964-9284c522970f	2026-06-24 09:00:02.361528	2026-06-24 09:00:03.472032	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-0972e516-c508-4657-b955-aabf641ab7bf	{"subscription_id": "bc8c0c7b-e7e5-472b-a3d9-b234afdd2af9", "billing_cycle": 3, "auto_billing": true}	0972e516-c508-4657-b955-aabf641ab7bf	2026-07-04 09:00:02.295828	2026-07-04 09:00:03.572322	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-6de51528-2e2e-4d2d-b428-265571e59eea	{"subscription_id": "97c6a42c-1419-4245-897c-3fde9b923cc6", "billing_cycle": 4, "auto_billing": true}	6de51528-2e2e-4d2d-b428-265571e59eea	2026-07-04 09:00:09.251892	2026-07-04 09:00:10.424349	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-916f7472-da00-4277-b94f-ace0db8f0aa1	{"subscription_id": "76a45b07-cf7a-497a-bf00-3d2a870bebcc", "billing_cycle": 4, "auto_billing": true}	916f7472-da00-4277-b94f-ace0db8f0aa1	2026-07-04 09:00:13.79952	2026-07-04 09:00:15.020069	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	bank_transfer	SUBSCRIPTION-bbc2f86f-3574-4f57-b29b-e4254cd08390	{"subscription_id": "3027205a-aa04-4e8e-930c-8da96147c8a9", "billing_cycle": 4, "auto_billing": true}	bbc2f86f-3574-4f57-b29b-e4254cd08390	2026-07-04 09:00:18.384052	2026-07-04 09:00:19.582175	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	bank_transfer	SUBSCRIPTION-5cc670d6-0c20-4557-95a8-2959fd965d0e	{"subscription_id": "5af23431-9769-4e3a-8f39-94bdd13b7d67", "billing_cycle": 4, "auto_billing": true}	5cc670d6-0c20-4557-95a8-2959fd965d0e	2026-07-04 09:00:22.909506	2026-07-04 09:00:24.477453	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	499998.00	subscription	success	qris	SUBSCRIPTION-5c9d2067-d233-474a-bb96-7aff0af2a8db	{"subscription_id": "a7e8f381-386d-4cb5-a41c-842cd262f45d", "billing_cycle": 4, "auto_billing": true}	5c9d2067-d233-474a-bb96-7aff0af2a8db	2026-07-04 09:00:27.875827	2026-07-04 09:00:29.083148	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-85d61a07-195f-4f64-ad99-36cad6ab3f9b	{"subscription_id": "92641fdd-bb10-4282-a6e5-69a70309eb7b", "billing_cycle": 4, "auto_billing": true}	85d61a07-195f-4f64-ad99-36cad6ab3f9b	2026-07-04 09:00:32.408094	2026-07-04 09:00:33.583119	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-399ef0db-31f4-4929-9004-e1201870af6b	{"subscription_id": "ded4d128-3ecf-41fb-aa03-cb1ecc32e982", "billing_cycle": 4, "auto_billing": true}	399ef0db-31f4-4929-9004-e1201870af6b	2026-07-04 09:00:36.983037	2026-07-04 09:00:38.206003	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-abfc27fb-b18e-468d-8788-1f7cbb00fc59	{"subscription_id": "085581c9-4a52-4957-8669-d7593bf3b7c9", "billing_cycle": 4, "auto_billing": true}	abfc27fb-b18e-468d-8788-1f7cbb00fc59	2026-07-04 09:00:41.571137	2026-07-04 09:00:42.768257	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-783ed027-db25-4e91-89a7-9c674071e640	{"subscription_id": "9ebd2580-a901-4197-a9ca-edf1cf3a0436", "billing_cycle": 4, "auto_billing": true}	783ed027-db25-4e91-89a7-9c674071e640	2026-07-04 09:00:46.121964	2026-07-04 09:00:47.347009	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-a28b3b10-5dd3-4a3c-8471-ee4f0706d02c	{"subscription_id": "dd60637b-a81f-4e65-9578-369710e12077", "billing_cycle": 4, "auto_billing": true}	a28b3b10-5dd3-4a3c-8471-ee4f0706d02c	2026-07-04 09:00:50.740312	2026-07-04 09:00:51.946906	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-ac66541c-3d3b-454d-8f54-b4a53094d60f	{"subscription_id": "5d73d74f-8f68-4f09-b14a-2ae97009eca4", "billing_cycle": 4, "auto_billing": true}	ac66541c-3d3b-454d-8f54-b4a53094d60f	2026-07-04 09:00:55.264913	2026-07-04 09:00:56.438533	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-345368fb-b894-4b65-94dc-058c5bace609	{"subscription_id": "1b4e3bb8-42e5-4d44-aa9c-bc8f83c34b91", "billing_cycle": 4, "auto_billing": true}	345368fb-b894-4b65-94dc-058c5bace609	2026-07-04 09:00:59.836215	2026-07-04 09:01:01.055776	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-9c941504-f0cc-4eb1-93ae-db2b43e25a23	{"subscription_id": "ba5eabb8-10de-41a3-984d-5de77629ebc1", "billing_cycle": 2, "auto_billing": true}	9c941504-f0cc-4eb1-93ae-db2b43e25a23	2026-06-18 09:00:44.636164	2026-06-18 09:00:45.363536	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-a715d5c6-811e-4655-b1f9-0922b7772f0f	{"subscription_id": "06b1bcac-0d29-4fe5-b021-00d31bbff5e5", "billing_cycle": 2, "auto_billing": true}	a715d5c6-811e-4655-b1f9-0922b7772f0f	2026-06-18 09:01:36.959448	2026-06-18 09:01:37.687653	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-abbf0207-8a3d-4bd0-b976-5f54e24cad93	{"subscription_id": "763d75bf-7421-4e0c-8f90-f2f4749ccfaa", "billing_cycle": 2, "auto_billing": true}	abbf0207-8a3d-4bd0-b976-5f54e24cad93	2026-06-18 09:01:22.04636	2026-06-18 09:01:22.774971	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	one_time	pending	midtrans	\N	null	78685a78-9b50-48bb-911e-4ed35449ed3b	2026-06-24 21:21:16.741321	2026-06-24 21:21:16.741324	t	\N
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	500000.00	subscription	success	midtrans	SUBSCRIPTION-c5985cef-981e-4900-a4e9-c5fe1a50155f	{"subscription_id": "e462fadf-ac63-4560-92ed-5f5e330b60fb", "billing_cycle": 2, "auto_billing": true}	c5985cef-981e-4900-a4e9-c5fe1a50155f	2026-07-07 09:00:02.181099	2026-07-07 09:00:03.414986	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-61b6a05b-8f9d-420f-83ae-f0abed7644a6	{"subscription_id": "ba5eabb8-10de-41a3-984d-5de77629ebc1", "billing_cycle": 2, "auto_billing": true}	61b6a05b-8f9d-420f-83ae-f0abed7644a6	2026-06-18 09:00:50.681182	2026-06-18 09:00:51.645606	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-011684ff-afc9-4a06-bfd7-8f223b0b6206	{"subscription_id": "763d75bf-7421-4e0c-8f90-f2f4749ccfaa", "billing_cycle": 2, "auto_billing": true}	011684ff-afc9-4a06-bfd7-8f223b0b6206	2026-06-18 09:01:28.103634	2026-06-18 09:01:29.069437	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-b3d63a50-2e9a-4b98-b718-8cd47a075df8	{"subscription_id": "aed4e1fd-40c5-4dc7-ba6d-d67e419a7c52", "billing_cycle": 2, "auto_billing": true}	b3d63a50-2e9a-4b98-b718-8cd47a075df8	2026-06-18 09:00:58.116968	2026-06-18 09:00:59.082399	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-6a967c39-661f-4c9d-8613-335324ecad18	{"subscription_id": "fc1cabad-586b-49e2-96b2-295cff8ffe72", "billing_cycle": 2, "auto_billing": true}	6a967c39-661f-4c9d-8613-335324ecad18	2026-06-18 09:01:05.61744	2026-06-18 09:01:06.618093	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-5e9d5e2f-cb18-4466-9b03-b4e3f668ce06	{"subscription_id": "a7653005-5392-484e-a773-a39aba74da61", "billing_cycle": 4, "auto_billing": true}	5e9d5e2f-cb18-4466-9b03-b4e3f668ce06	2026-06-21 09:00:01.753954	2026-06-21 09:00:02.60234	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-6528615d-7a91-46ab-b796-a946f4d9a4b0	{"subscription_id": "802458a5-e416-45b8-8c2b-0503daff7ffc", "billing_cycle": 2, "auto_billing": true}	6528615d-7a91-46ab-b796-a946f4d9a4b0	2026-06-18 09:01:13.248907	2026-06-18 09:01:14.211452	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-764d9e55-75d7-40bb-9479-d750046a1305	{"subscription_id": "704dde7e-f48f-446b-8080-faf06f62ea65", "billing_cycle": 2, "auto_billing": true}	764d9e55-75d7-40bb-9479-d750046a1305	2026-06-18 09:01:20.657963	2026-06-18 09:01:21.611925	t	\N
f3ada4b1-2bba-4155-bb2e-5cee4b791390	\N	500000.00	subscription	success	qris	SUBSCRIPTION-4e20158d-2aee-43f8-a49d-6dd68db35a54	{"subscription_id": "85735449-e8aa-4eeb-a7fd-8c927af71b9b", "billing_cycle": 3, "auto_billing": true}	4e20158d-2aee-43f8-a49d-6dd68db35a54	2026-06-26 09:00:00.841175	2026-06-26 09:00:01.644681	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-014676af-716c-433e-92c2-a62f22125d8b	{"subscription_id": "aed4e1fd-40c5-4dc7-ba6d-d67e419a7c52", "billing_cycle": 2, "auto_billing": true}	014676af-716c-433e-92c2-a62f22125d8b	2026-06-18 09:00:52.015089	2026-06-18 09:00:52.732614	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-5bf493d5-40dc-4363-8d98-8458fe12cf8b	{"subscription_id": "a7653005-5392-484e-a773-a39aba74da61", "billing_cycle": 4, "auto_billing": true}	5bf493d5-40dc-4363-8d98-8458fe12cf8b	2026-06-21 09:00:02.322945	2026-06-21 09:00:03.409876	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	1000000.00	subscription	success	qris	SUBSCRIPTION-d257d209-dcc5-4496-8cdd-50359777b182	{"subscription_id": "1ec37dff-47be-4fb9-82c7-689e70e1a060", "billing_cycle": 4, "auto_billing": true}	d257d209-dcc5-4496-8cdd-50359777b182	2026-06-21 09:00:13.709304	2026-06-21 09:00:14.719735	t	\N
f3ada4b1-2bba-4155-bb2e-5cee4b791390	\N	500000.00	subscription	success	qris	SUBSCRIPTION-a6b2956f-31ad-4256-b4c5-bc8f7b3b024e	{"subscription_id": "85735449-e8aa-4eeb-a7fd-8c927af71b9b", "billing_cycle": 3, "auto_billing": true}	a6b2956f-31ad-4256-b4c5-bc8f7b3b024e	2026-06-26 09:00:02.207843	2026-06-26 09:00:03.188437	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-a496e7fc-4993-4823-9f05-e3f0d112fc2d	{"subscription_id": "fc1cabad-586b-49e2-96b2-295cff8ffe72", "billing_cycle": 2, "auto_billing": true}	a496e7fc-4993-4823-9f05-e3f0d112fc2d	2026-06-18 09:00:59.494193	2026-06-18 09:01:00.225736	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	1000000.00	subscription	success	qris	SUBSCRIPTION-ede62b87-068b-4801-9d12-e96a5c5b8fbc	{"subscription_id": "1ec37dff-47be-4fb9-82c7-689e70e1a060", "billing_cycle": 4, "auto_billing": true}	ede62b87-068b-4801-9d12-e96a5c5b8fbc	2026-06-21 09:00:09.804045	2026-06-21 09:00:10.608166	t	\N
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	200000.00	subscription	success	qris	SUBSCRIPTION-6dd72abb-d2a4-4d96-bc28-803ca83f3b97	{"subscription_id": "8aca0664-8451-4061-9b26-8a6056440a8f", "billing_cycle": 3, "auto_billing": true}	6dd72abb-d2a4-4d96-bc28-803ca83f3b97	2026-07-02 09:00:01.664055	2026-07-02 09:00:02.675316	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-6d2ab0b7-e6e8-45c2-b469-89764b9e8a12	{"subscription_id": "bc8c0c7b-e7e5-472b-a3d9-b234afdd2af9", "billing_cycle": 3, "auto_billing": true}	6d2ab0b7-e6e8-45c2-b469-89764b9e8a12	2026-07-04 09:00:01.654367	2026-07-04 09:00:02.601454	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-1c7e8887-d8b8-4549-9845-17e517778168	{"subscription_id": "97c6a42c-1419-4245-897c-3fde9b923cc6", "billing_cycle": 3, "auto_billing": true}	1c7e8887-d8b8-4549-9845-17e517778168	2026-07-04 09:00:05.329878	2026-07-04 09:00:06.226843	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-a1842fa8-a999-48cd-a235-f6a944ec9699	{"subscription_id": "76a45b07-cf7a-497a-bf00-3d2a870bebcc", "billing_cycle": 3, "auto_billing": true}	a1842fa8-a999-48cd-a235-f6a944ec9699	2026-07-04 09:00:08.901062	2026-07-04 09:00:09.799484	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	bank_transfer	SUBSCRIPTION-16e13524-f222-40d0-b313-715105e6b778	{"subscription_id": "3027205a-aa04-4e8e-930c-8da96147c8a9", "billing_cycle": 3, "auto_billing": true}	16e13524-f222-40d0-b313-715105e6b778	2026-07-04 09:00:12.473241	2026-07-04 09:00:13.371329	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	bank_transfer	SUBSCRIPTION-58744656-9ada-4373-995d-df5f2b63c406	{"subscription_id": "5af23431-9769-4e3a-8f39-94bdd13b7d67", "billing_cycle": 3, "auto_billing": true}	58744656-9ada-4373-995d-df5f2b63c406	2026-07-04 09:00:16.045555	2026-07-04 09:00:16.94301	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	499998.00	subscription	success	qris	SUBSCRIPTION-e33ed2d2-7e89-4f30-baf0-ad984c061711	{"subscription_id": "a7e8f381-386d-4cb5-a41c-842cd262f45d", "billing_cycle": 3, "auto_billing": true}	e33ed2d2-7e89-4f30-baf0-ad984c061711	2026-07-04 09:00:19.616794	2026-07-04 09:00:20.513965	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-0de486f3-c8cf-4c0c-ab44-4cb16b8bda24	{"subscription_id": "92641fdd-bb10-4282-a6e5-69a70309eb7b", "billing_cycle": 3, "auto_billing": true}	0de486f3-c8cf-4c0c-ab44-4cb16b8bda24	2026-07-04 09:00:23.18831	2026-07-04 09:00:24.085775	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-e9ae9c21-8db7-4250-ab9f-910ad17fb99e	{"subscription_id": "ded4d128-3ecf-41fb-aa03-cb1ecc32e982", "billing_cycle": 3, "auto_billing": true}	e9ae9c21-8db7-4250-ab9f-910ad17fb99e	2026-07-04 09:00:26.759532	2026-07-04 09:00:27.656002	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-4fa8e02d-077c-443e-aa59-9caddeb29b16	{"subscription_id": "085581c9-4a52-4957-8669-d7593bf3b7c9", "billing_cycle": 3, "auto_billing": true}	4fa8e02d-077c-443e-aa59-9caddeb29b16	2026-07-04 09:00:30.329765	2026-07-04 09:00:31.227218	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-11d4b4da-6a4b-4fa8-878b-ba8e009775c4	{"subscription_id": "9ebd2580-a901-4197-a9ca-edf1cf3a0436", "billing_cycle": 3, "auto_billing": true}	11d4b4da-6a4b-4fa8-878b-ba8e009775c4	2026-07-04 09:00:33.900229	2026-07-04 09:00:34.797394	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-05f0ca7d-aaa6-4875-970d-1956ea4b2df8	{"subscription_id": "dd60637b-a81f-4e65-9578-369710e12077", "billing_cycle": 3, "auto_billing": true}	05f0ca7d-aaa6-4875-970d-1956ea4b2df8	2026-07-04 09:00:37.473304	2026-07-04 09:00:38.658078	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-b7092c58-154a-42e4-8eb5-26aeed46e603	{"subscription_id": "5d73d74f-8f68-4f09-b14a-2ae97009eca4", "billing_cycle": 3, "auto_billing": true}	b7092c58-154a-42e4-8eb5-26aeed46e603	2026-07-04 09:00:41.332336	2026-07-04 09:00:42.229458	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-0bae5d1b-7af5-409f-b3b2-fc342e0a607c	{"subscription_id": "1b4e3bb8-42e5-4d44-aa9c-bc8f83c34b91", "billing_cycle": 3, "auto_billing": true}	0bae5d1b-7af5-409f-b3b2-fc342e0a607c	2026-07-04 09:00:44.901651	2026-07-04 09:00:45.798784	t	\N
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	500000.00	subscription	success	midtrans	SUBSCRIPTION-8379c223-7182-4cc6-98ff-3245d11afcad	{"subscription_id": "e462fadf-ac63-4560-92ed-5f5e330b60fb", "billing_cycle": 2, "auto_billing": true}	8379c223-7182-4cc6-98ff-3245d11afcad	2026-07-07 09:00:01.651649	2026-07-07 09:00:02.560345	t	\N
357bd5bf-909d-4317-83a5-556c926ed56a	\N	300000.00	subscription	success	midtrans	SUBSCRIPTION-bd5c5ce8-f45c-48d5-9dd7-13c1f1f99dd6	{"subscription_id": "79e70f47-dd49-423a-a399-a2829d9c0f78", "billing_cycle": 2, "auto_billing": true}	bd5c5ce8-f45c-48d5-9dd7-13c1f1f99dd6	2026-07-10 09:00:01.63711	2026-07-10 09:00:02.579263	t	\N
8dd61c30-5521-431a-bebb-bbb676a73133	\N	300000.00	subscription	success	midtrans	SUBSCRIPTION-ffe1b62a-9d86-40b3-a9e2-5dc942873660	{"subscription_id": "57ebfb4c-a248-4255-9256-5018b0948ac7", "billing_cycle": 2, "auto_billing": true}	ffe1b62a-9d86-40b3-a9e2-5dc942873660	2026-07-10 09:00:05.264754	2026-07-10 09:00:06.197227	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	300000.00	subscription	success	qris	SUBSCRIPTION-340d8c53-c510-4ffd-89e9-e2fdd59fc49c	{"subscription_id": "802458a5-e416-45b8-8c2b-0503daff7ffc", "billing_cycle": 2, "auto_billing": true}	340d8c53-c510-4ffd-89e9-e2fdd59fc49c	2026-06-18 09:01:06.98314	2026-06-18 09:01:07.689086	t	\N
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	500000.00	subscription	success	qris	SUBSCRIPTION-b8bc1cc8-6d2e-410b-a274-f20803010e42	{"subscription_id": "14750bb4-e68a-4ba4-89e6-4b0ae4d31e72", "billing_cycle": 2, "auto_billing": true}	b8bc1cc8-6d2e-410b-a274-f20803010e42	2026-06-24 09:00:01.701366	2026-06-24 09:00:02.506492	t	\N
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	200000.00	subscription	success	qris	SUBSCRIPTION-d7fddf74-fdcb-45ea-8735-769246f76d37	{"subscription_id": "8aca0664-8451-4061-9b26-8a6056440a8f", "billing_cycle": 3, "auto_billing": true}	d7fddf74-fdcb-45ea-8735-769246f76d37	2026-07-02 09:00:02.247535	2026-07-02 09:00:03.492597	t	\N
\.


--
-- Data for Name: donor_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.donor_profiles (user_id, total_donated, children_sponsored, subscription_status, corporate_name, tax_id, id, created_at, updated_at, is_active) FROM stdin;
00000000-0000-0000-0000-000000000001	0.00	0	inactive	\N	\N	e9e320fd-ab10-47a7-9661-9d5b111f9dd6	2026-04-18 04:53:31.464806	2026-04-18 04:53:31.464812	t
10000000-0000-0000-0000-000000000001	2500000.00	1	active	\N	\N	ba40a529-3634-4298-8ffb-bd13aae76705	2026-04-18 07:28:46.879949	2026-04-18 07:28:46.879954	t
52fae754-5e5d-41c9-9817-5c952533bd84	500000.00	0	inactive	\N	\N	0c7a4272-5ef5-4ae3-b43c-a3778abcde76	2026-04-20 01:53:59.381736	2026-04-20 01:55:20.159809	t
a4161fa7-0657-4037-ba49-33cb3b02b9cc	0.00	0	inactive	\N	\N	108ae365-0e26-4e93-90f0-f582f7b7c00e	2026-06-10 10:07:32.572629	2026-06-10 10:07:32.572633	t
10fcb99b-b830-4a2e-b35a-9979f9106c67	0.00	0	inactive	\N	\N	8c0b85b7-1dc4-4f9a-ae18-2d881c35bce5	2026-06-10 11:01:33.536044	2026-06-10 11:01:33.536049	t
8f567802-a7ad-4f4f-8534-bdc036b09b97	0.00	0	inactive	\N	\N	171e764d-55ef-45a0-8931-29d2e667056c	2026-06-10 12:32:56.5335	2026-06-10 12:32:56.533504	t
10510d96-7171-4b5a-8ca0-b7090f8d6f58	0.00	0	inactive	\N	\N	2d0657cf-e546-4f75-80a1-8f7b3b4aa4cc	2026-06-10 13:52:20.08753	2026-06-10 13:52:20.087534	t
f3ada4b1-2bba-4155-bb2e-5cee4b791390	2000000.00	0	inactive	\N	\N	e1a9e62e-23e6-4e0a-8af3-ceef30d9b31c	2026-04-27 13:48:10.559801	2026-06-26 09:00:06.21388	t
642a6f09-0362-449f-aa96-af1c02bcc955	0.00	0	inactive	\N	\N	7210b918-1c73-4ae7-8b56-762eb3f01461	2026-04-22 00:20:48.183236	2026-04-22 00:20:48.183241	t
ae19f5a1-35f1-413c-af42-c7001ee9492f	500000.00	0	inactive	\N	\N	3ab32284-36d3-4cd9-9b44-81599ef6a01e	2026-04-22 00:38:57.792589	2026-04-22 01:23:54.755395	t
b4a06baa-2cf5-4817-9dfe-73cb4506a674	0.00	0	inactive	\N	\N	d8037e7c-60d1-470e-9c54-74321c53c751	2026-05-09 16:03:36.42774	2026-05-09 16:03:36.427762	t
e848d29b-a53b-4cde-86cc-c6712dadce20	1500000.00	0	inactive	\N	\N	4fe68377-f57b-451c-9792-9af85edb110b	2026-05-26 01:36:47.336359	2026-05-26 01:36:47.336365	t
46f6f92d-39d9-4712-a2b8-73dd74ec44b6	0.00	0	inactive	\N	\N	e06b04b1-2d7a-4f51-b8d4-9629b75ec1f0	2026-06-10 04:20:19.034696	2026-06-10 04:20:19.034699	t
d50ed1f1-04be-4b0e-9b8c-16ddfd4606ce	0.00	0	inactive	\N	\N	eb86289b-f866-4d78-aa08-797eee58cb53	2026-06-10 09:22:22.087596	2026-06-10 09:22:22.087601	t
c99d71f2-8702-46a0-baf8-c775787f31fa	0.00	0	inactive	\N	\N	1313fc82-3723-41ad-a472-bbd123f1416c	2026-06-10 09:22:34.992165	2026-06-10 09:22:34.992169	t
0aa32472-f539-4888-ab3f-db23cb4e5743	0.00	0	inactive	\N	\N	1929dce4-50f8-4806-884c-945858f7f012	2026-06-10 09:23:57.835654	2026-06-10 09:23:57.835659	t
1018fa47-9476-4f11-b249-b064eb297dec	0.00	0	inactive	\N	\N	b7305f77-b794-4154-a28e-ba72ac28964d	2026-06-10 09:38:46.018454	2026-06-10 09:38:46.018458	t
3d77e2fc-dd8e-4c33-bb51-b0202d3d82ee	0.00	0	inactive	\N	\N	240066d8-9b5e-4e6b-a2ae-43b8a3b4a3f0	2026-06-10 09:41:57.963081	2026-06-10 09:41:57.963086	t
337efcff-35ee-4a55-ac77-2995542022ae	0.00	0	inactive	\N	\N	455debce-bf2b-4b68-91fa-693e6c86f8ce	2026-06-10 09:48:39.04546	2026-06-10 09:48:39.045464	t
a133c0c6-5c0e-43fd-bc17-f8a234272acb	0.00	0	inactive	\N	\N	8cbe204a-6f49-426c-acd8-ec9cb8b0b7af	2026-06-10 09:53:25.471758	2026-06-10 09:53:25.471762	t
8c398068-8879-4103-a677-814f137b8289	0.00	0	inactive	\N	\N	6575fbc6-1e34-42ca-a954-cd8d2d5568d8	2026-06-10 09:53:30.433679	2026-06-10 09:53:30.433682	t
78d4dbc5-65e0-446b-94e0-c18983a7667e	0.00	0	inactive	\N	\N	63ec32f1-32ca-485a-92a7-413063ed2017	2026-06-10 09:55:26.591009	2026-06-10 09:55:26.591013	t
fefb7140-07ec-4264-b667-faf9be1cf5af	0.00	0	inactive	\N	\N	470550ff-e004-4915-bc16-b7bd9b6ccecc	2026-06-10 09:55:43.842186	2026-06-10 09:55:43.84219	t
b460f35e-b398-4275-b71a-cfee0ffbb683	0.00	0	inactive	\N	\N	1a0fb5f4-04e1-4835-b898-d96ea9182b64	2026-06-10 09:59:53.032511	2026-06-10 09:59:53.032515	t
fbbcd506-dd25-4818-a9d3-83bc7ce032b1	0.00	0	inactive	\N	\N	66724294-1470-46af-9676-402a8538cfd8	2026-06-10 10:00:10.196205	2026-06-10 10:00:10.19621	t
ff0b961d-76d2-46f7-a245-82a4761d00e6	0.00	0	inactive	\N	\N	e44c136e-e8c4-4a92-bb26-9709f5cadbf1	2026-06-10 10:00:52.885134	2026-06-10 10:00:52.885138	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	37499994.00	0	inactive	\N	\N	db00b132-2753-45eb-8b20-745a169a1341	2026-04-20 15:21:43.652962	2026-07-04 09:01:00.812698	t
f1177ee0-66c6-4167-923c-aeb1824d3c34	2300000.00	0	cancelled	\N	\N	fbec3a84-103c-4376-83d3-e2dd6968a904	2026-05-03 09:57:46.787807	2026-07-07 09:00:03.178847	t
357bd5bf-909d-4317-83a5-556c926ed56a	300000.00	0	inactive	\N	\N	f9f01800-da99-41ba-8040-f1774567062f	2026-06-10 09:20:20.151085	2026-07-10 09:00:02.406469	t
8dd61c30-5521-431a-bebb-bbb676a73133	300000.00	0	inactive	\N	\N	55c35b92-9319-4320-8a79-ab4bdabb142a	2026-06-10 11:28:09.310014	2026-07-10 09:00:06.025154	t
\.


--
-- Data for Name: fies_surveys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fies_surveys (beneficiary_id, responses, score, classification, survey_date, survey_month, survey_year, id, created_at, updated_at, is_active) FROM stdin;
ee4f68ab-cc12-45f8-92b6-3c1f7422aff6	{"q1": 0, "q2": 1, "q3": 0, "q4": 1, "q5": 0, "q6": 1, "q7": 1, "q8": 1}	5	moderate	2026-04-18 00:00:00	4	2026	b6e86c8c-e252-4f98-8c3c-f247b7c2d610	2026-04-18 06:39:03.074423	2026-04-18 06:39:03.074431	t
20000000-0000-0000-0000-000000000001	{"q1": 1, "q2": 1, "q3": 1, "q4": 0, "q5": 0, "q6": 0, "q7": 0, "q8": 0}	3	moderate	2026-04-18 07:28:49.690817	4	2026	68862ba8-f990-4bde-bb0e-e4ce0cfda55a	2026-04-18 07:28:50.103039	2026-04-18 07:28:50.103045	t
20000000-0000-0000-0000-000000000001	{"q1": 1, "q2": 1, "q3": 0, "q4": 0, "q5": 0, "q6": 0, "q7": 0, "q8": 0}	2	food_secure	2026-03-19 07:28:49.690817	3	2026	64b75823-53f7-4150-a37d-344f5c96814b	2026-04-18 07:28:50.103059	2026-04-18 07:28:50.103062	t
20000000-0000-0000-0000-000000000001	{"q1": 1, "q2": 1, "q3": 1, "q4": 1, "q5": 0, "q6": 0, "q7": 0, "q8": 0}	4	moderate	2026-02-17 07:28:49.690817	2	2026	50281a1e-76ad-4f7c-925e-1b0e7de41890	2026-04-18 07:28:50.103076	2026-04-18 07:28:50.103078	t
20000000-0000-0000-0000-000000000001	{"q1": 1, "q2": 0, "q3": 0, "q4": 0, "q5": 0, "q6": 0, "q7": 0, "q8": 0}	1	food_secure	2026-01-18 07:28:49.690817	1	2026	6d540867-7f78-4ff3-9080-ae842c3b44f6	2026-04-18 07:28:50.103087	2026-04-18 07:28:50.103089	t
20000000-0000-0000-0000-000000000001	{"q1": 1, "q2": 1, "q3": 1, "q4": 1, "q5": 1, "q6": 0, "q7": 0, "q8": 0}	5	moderate	2025-12-19 07:28:49.690817	12	2025	b7bee9c4-5c59-4d3d-8afd-343c21e71e17	2026-04-18 07:28:50.103098	2026-04-18 07:28:50.1031	t
20000000-0000-0000-0000-000000000001	{"q1": 1, "q2": 1, "q3": 0, "q4": 0, "q5": 0, "q6": 0, "q7": 0, "q8": 0}	2	food_secure	2025-11-19 07:28:49.690817	11	2025	46398fca-a0a7-4f55-b7a7-f4f853ef5746	2026-04-18 07:28:50.103108	2026-04-18 07:28:50.10311	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	{"q1_worried_food": true, "q2_healthy_food": true, "q3_few_kinds": true, "q4_skipped_meal": true, "q5_less_than_should": true, "q6_hungry": true, "q7_no_eat_whole_day": true, "q8_reason": "Kekurangan uang"}	7	severe	2026-04-01 00:00:00	4	2026	0901bb1d-695d-4e6d-8751-7b865484cf42	2026-04-20 15:21:43.896266	2026-04-20 15:21:43.896273	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	{"q1": 1, "q2": 1, "q3": 1, "q4": 1, "q5": 1, "q6": 1, "q7": 1, "q8": 0}	7	severe	2026-05-03 00:00:00	5	2026	3e8ce9d5-acbf-4f50-b172-892c5731eeb0	2026-05-03 09:56:44.125642	2026-05-03 09:56:44.125642	t
319688e1-ad41-4c83-a381-a8a700681e3d	{"q1": 1, "q2": 1, "q3": 1, "q4": 0, "q5": 1, "q6": 0, "q7": 0, "q8": 0}	4	moderate	2026-05-19 00:00:00	5	2026	36cd871a-e7d8-4013-a734-0111f68af961	2026-05-19 08:50:09.879043	2026-05-19 08:50:09.879047	t
c5a8b3e9-5677-4577-aabc-a25446f0ae61	{"q1_worried_food": true, "q2_healthy_food": true, "q3_few_kinds": true, "q4_skipped_meal": true, "q5_less_than_should": true, "q6_hungry": true, "q7_no_eat_whole_day": true, "q8_reason": "Kekurangan uang"}	7	severe	2026-05-01 00:00:00	5	2026	77f9f4ca-c399-4932-bcf0-f9609ead3a4a	2026-05-26 01:36:47.56255	2026-05-26 01:36:47.562557	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	{"q1": 0, "q2": 0, "q3": 0, "q4": 0, "q5": 0, "q6": 0, "q7": 0, "q8": 1}	1	food_secure	2026-06-10 00:00:00	6	2026	3cd4009a-e71f-428e-9e95-dec5a5f6eeee	2026-06-10 04:31:57.548672	2026-06-10 04:31:57.548676	t
82147428-e16e-4ed8-9f62-bd5353a1b288	{"q1": 1, "q2": 0, "q3": 0, "q4": 0, "q5": 0, "q6": 0, "q7": 0, "q8": 0}	1	food_secure	2026-06-10 00:00:00	6	2026	3824ebf3-e777-44e4-a825-726a9e2eab8e	2026-06-10 09:51:15.754376	2026-06-10 09:51:15.754379	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	{"q1": 1, "q2": 1, "q3": 0, "q4": 1, "q5": 0, "q6": 1, "q7": 0, "q8": 1}	5	moderate	2026-06-10 00:00:00	6	2026	126410a2-c51b-4a71-80f0-e0fbf5f45deb	2026-06-10 10:27:41.279611	2026-06-10 10:27:41.279615	t
\.


--
-- Data for Name: nutrition_measurements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.nutrition_measurements (child_id, measurement_date, weight, height, muac, z_score_weight, z_score_height, z_score_weight_height, classification, id, created_at, updated_at, is_active) FROM stdin;
40000000-0000-0000-0000-000000000001	2026-04-13	11.90	86.00	14.50	-0.30	-0.20	-0.10	normal	b11a8cef-b046-48e3-886e-aa05f13b9ac0	2026-04-18 07:28:50.151237	2026-04-18 07:28:50.151243	t
40000000-0000-0000-0000-000000000001	2026-03-14	11.40	84.50	14.50	-0.45	-0.30	-0.20	normal	c6745b3a-b0a4-45c8-ac1a-163b3a3534f9	2026-04-18 07:28:50.151258	2026-04-18 07:28:50.15126	t
40000000-0000-0000-0000-000000000002	2026-04-11	13.20	91.00	14.50	0.10	0.05	0.08	normal	a8d39911-0a05-44b8-9425-6a65ba7188cf	2026-04-18 07:28:50.151268	2026-04-18 07:28:50.15127	t
40000000-0000-0000-0000-000000000002	2026-03-21	12.80	89.80	14.50	-0.15	-0.10	-0.12	normal	3db3fae9-bddb-45f2-a9b2-03e2cb917e7c	2026-04-18 07:28:50.151277	2026-04-18 07:28:50.151279	t
40000000-0000-0000-0000-000000000001	2026-02-17	10.90	82.30	14.50	-1.20	-1.10	-1.15	moderate_malnourished	5a8e2fc2-5107-4837-8bc1-d478eeded08b	2026-04-18 07:28:50.151286	2026-04-18 07:28:50.151287	t
62f4b179-81e2-446b-904e-4adfacd629a0	2026-04-20	4.00	60.00	\N	-3.43	-0.64	\N	severe_malnourished	8d8a97dd-10d3-4b99-81e2-160ac62acd45	2026-04-20 13:14:45.196119	2026-04-20 13:14:45.196126	t
387e42a2-85e6-41b5-b962-bf846afabb37	2025-10-22	8.00	70.00	12.00	-2.10	\N	\N	moderate_malnourished	f959ce63-eccf-4263-b498-8ecc8fdfc327	2026-04-20 15:21:43.933052	2026-04-20 15:21:43.933057	t
387e42a2-85e6-41b5-b962-bf846afabb37	2026-03-21	9.50	75.00	12.50	-1.20	\N	\N	normal	3316259e-240f-4514-a6c9-c218e6968e34	2026-04-20 15:21:43.933069	2026-04-20 15:21:43.933071	t
387e42a2-85e6-41b5-b962-bf846afabb37	2026-05-16	10.00	78.00	\N	-2.84	-8.41	\N	severe_malnourished	e7285d2f-fda5-4c79-9ef3-9bf213c4d402	2026-05-16 08:29:12.34326	2026-05-16 08:29:12.343271	t
04b63762-8074-47b6-b443-6a097505cd26	2026-05-18	2.50	40.00	\N	-3.40	-7.21	\N	severe_malnourished	28025031-b6a1-42d8-8686-fa18086cbade	2026-05-18 14:26:18.612476	2026-05-18 14:26:18.612476	t
04b63762-8074-47b6-b443-6a097505cd26	2026-05-04	2.00	35.00	\N	-4.40	-9.84	\N	severe_malnourished	623f6bf7-a0cf-4a44-afc1-c4e16b84cf3a	2026-05-18 14:26:58.692376	2026-05-18 14:26:58.692376	t
04b63762-8074-47b6-b443-6a097505cd26	2026-05-19	3.50	50.00	\N	-1.40	-1.95	\N	normal	bc1ba190-6b87-4fe8-8cdf-d8899ae3dac0	2026-05-19 07:19:43.30316	2026-05-19 07:19:43.30316	t
04b63762-8074-47b6-b443-6a097505cd26	2026-05-19	3.50	50.00	\N	-1.40	-1.95	\N	normal	82313d09-7ff6-462b-82c6-36a97e4ea95b	2026-05-19 07:19:51.785574	2026-05-19 07:19:51.785574	t
04b63762-8074-47b6-b443-6a097505cd26	2026-05-19	3.50	50.00	\N	-1.40	-1.95	\N	normal	29a9ec5a-5fb3-48f8-8b4f-962464429372	2026-05-19 07:19:54.094354	2026-05-19 07:19:54.094354	t
04b63762-8074-47b6-b443-6a097505cd26	2026-05-19	3.50	50.00	\N	-1.40	-1.95	\N	normal	84cf466a-0e15-4ae4-87cc-679d12b1c323	2026-05-19 07:20:05.937084	2026-05-19 07:20:05.937084	t
626b3390-2b7c-46ce-9943-3b47ecb5b3cd	2026-03-20	2.50	40.00	\N	-1.75	-5.06	\N	severe_malnourished	a2a787c6-5068-46f7-add2-1f405991022f	2026-05-19 08:51:16.664665	2026-05-19 08:51:16.664669	t
485325fa-62a0-4dec-9825-a14e970381df	2025-11-27	8.00	70.00	12.00	-2.10	\N	\N	moderate_malnourished	a7586249-0c5a-4f1d-96f1-8cc92c74d787	2026-05-26 01:36:47.609035	2026-05-26 01:36:47.609042	t
485325fa-62a0-4dec-9825-a14e970381df	2026-04-26	9.50	75.00	12.50	-1.20	\N	\N	normal	8e2d082a-b2be-4ca4-9ec7-5b987535668c	2026-05-26 01:36:47.609056	2026-05-26 01:36:47.609059	t
387e42a2-85e6-41b5-b962-bf846afabb37	2026-06-10	12.00	119.30	\N	-1.89	4.28	\N	normal	2fe62acc-8f66-4fbd-aa02-289e31ace058	2026-06-10 04:35:04.776788	2026-06-10 04:35:04.776791	t
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_items (order_id, product_id, quantity, price, subtotal, id, created_at, updated_at, is_active) FROM stdin;
70000000-0000-0000-0000-000000000001	8e2f9aae-677c-4aaa-9db3-84a67177142c	1	75000.00	75000.00	4cf0779c-ab54-491e-9a86-06ed7bab1276	2026-04-18 07:28:51.285775	2026-04-18 07:28:51.285783	t
70000000-0000-0000-0000-000000000001	92d77e1e-fb1a-4ad5-9cfb-43248982451d	2	32000.00	64000.00	03799e25-f7f0-4d73-8c1d-ba15f40e67da	2026-04-18 07:28:51.285797	2026-04-18 07:28:51.285801	t
70000000-0000-0000-0000-000000000002	6b5f2673-fb03-41b0-8c66-cda70ec9320a	1	68000.00	68000.00	7d7e88c3-b6dc-478b-9d5a-bf312ce13e12	2026-04-18 07:28:51.285814	2026-04-18 07:28:51.285818	t
70000000-0000-0000-0000-000000000002	443eb113-56a0-41a0-a779-682fb7c49f87	1	45000.00	45000.00	9abbac46-0e64-4731-bdf5-928d5285bc9a	2026-04-18 07:28:51.285828	2026-04-18 07:28:51.285832	t
3a60b719-f3c6-48ef-af1f-ea18c025f88f	70b9c4cc-8c93-4123-b017-312a80613a4f	1	16000.00	16000.00	fd640165-6760-44d0-b505-b521f03e4c04	2026-04-18 08:57:43.478815	2026-04-18 08:57:43.478819	t
3a60b719-f3c6-48ef-af1f-ea18c025f88f	b04a62c9-4464-4ed9-9452-a8174ac236a5	1	38000.00	38000.00	13ba9b72-5bad-4117-976e-d2168ac5abc0	2026-04-18 08:57:43.47883	2026-04-18 08:57:43.478832	t
2ba7a447-8aa9-4dc7-ad5e-fa580a2de882	1532b217-3691-4fb9-aa33-83320ac5dd0e	1	18000.00	18000.00	a3d21ec3-b689-441e-baeb-13f77df6ea16	2026-04-18 11:42:24.587817	2026-04-18 11:42:24.587822	t
2ba7a447-8aa9-4dc7-ad5e-fa580a2de882	6c1a7521-4128-4358-b576-fca4f5c099d4	1	42000.00	42000.00	74e68ae8-ffee-46ab-8013-b11a0a3a2759	2026-04-18 11:42:24.587834	2026-04-18 11:42:24.58784	t
02f7dd12-97f8-43a5-b55f-eb2229cbb700	bff8c61b-f916-452a-9c42-2aac1f8b9732	1	17000.00	17000.00	87601a07-2ec2-4846-996d-a9da4c0011c6	2026-04-18 11:42:25.627547	2026-04-18 11:42:25.627554	t
02f7dd12-97f8-43a5-b55f-eb2229cbb700	1c70b8b7-7e36-4f4c-b2cb-6c97e2904267	1	52000.00	52000.00	c5241126-06bd-455f-b222-8a69fdcefd91	2026-04-18 11:42:25.627568	2026-04-18 11:42:25.627571	t
02f7dd12-97f8-43a5-b55f-eb2229cbb700	70b9c4cc-8c93-4123-b017-312a80613a4f	1	16000.00	16000.00	106ad23b-db01-438b-8bcf-29c8096e4b4b	2026-04-18 11:42:25.627582	2026-04-18 11:42:25.627584	t
1ccd7edb-da25-4f51-b9df-fa5d07d3573f	70b9c4cc-8c93-4123-b017-312a80613a4f	2	16000.00	32000.00	976fd1e9-ba86-4349-80d4-329ed4835149	2026-04-19 13:43:09.815735	2026-04-19 13:43:09.815763	t
1ccd7edb-da25-4f51-b9df-fa5d07d3573f	1c70b8b7-7e36-4f4c-b2cb-6c97e2904267	1	52000.00	52000.00	0b0a3a9c-dad6-4cca-a3b6-2f80698005c3	2026-04-19 13:43:09.815776	2026-04-19 13:43:09.815779	t
1ccd7edb-da25-4f51-b9df-fa5d07d3573f	bff8c61b-f916-452a-9c42-2aac1f8b9732	1	17000.00	17000.00	81921e0c-ffc6-406e-84c1-405b8316b2fd	2026-04-19 13:43:09.815936	2026-04-19 13:43:09.815952	t
bca17548-4db0-4ec1-b837-45956237f364	e3823f8b-33a5-4c8e-9dca-4ed400c7acd8	1	25000.00	25000.00	a4b704bb-8913-46d5-b6d5-675fa72ac65d	2026-04-20 15:26:45.059903	2026-04-20 15:26:45.059908	t
bca17548-4db0-4ec1-b837-45956237f364	ba804e5d-7838-4adb-bea0-6ebcd8a1ca2f	1	75000.00	75000.00	5eb9e859-083d-4a57-93c6-def74b72583c	2026-04-20 15:26:45.059919	2026-04-20 15:26:45.059922	t
bca17548-4db0-4ec1-b837-45956237f364	da4fffaf-31d1-46c9-a173-88ac0ebfa332	2	15000.00	30000.00	99d1b096-be9d-4060-b169-8ec584ae0c3d	2026-04-20 15:26:45.05993	2026-04-20 15:26:45.059932	t
3d2302d8-e765-45ef-9447-46fa7235c499	e3823f8b-33a5-4c8e-9dca-4ed400c7acd8	1	25000.00	25000.00	0c7c55a2-5acd-429c-9328-f4128607c491	2026-04-20 15:27:31.124799	2026-04-20 15:27:31.124807	t
3d2302d8-e765-45ef-9447-46fa7235c499	ba804e5d-7838-4adb-bea0-6ebcd8a1ca2f	1	75000.00	75000.00	286dd5e7-d920-4968-9056-753623cd4d0f	2026-04-20 15:27:31.124821	2026-04-20 15:27:31.124826	t
3d2302d8-e765-45ef-9447-46fa7235c499	da4fffaf-31d1-46c9-a173-88ac0ebfa332	2	15000.00	30000.00	03497bc1-097b-4af9-8e85-d29cd740c5d5	2026-04-20 15:27:31.124837	2026-04-20 15:27:31.124841	t
9674fb83-bcf9-4fb2-ae5e-044ad6a71da7	de3d0c90-8920-4e95-bd1d-ba5bb0f94b15	1	15000.00	15000.00	dac24120-590a-4d43-a3fa-03d57a628cad	2026-04-21 06:55:18.510382	2026-04-21 06:55:18.51039	t
9674fb83-bcf9-4fb2-ae5e-044ad6a71da7	0d78dcb3-e2c4-4cd8-b76c-425d6a40986f	1	20000.00	20000.00	ce55f855-1d75-4dc1-8e19-0f9b39367743	2026-04-21 06:55:18.510406	2026-04-21 06:55:18.51041	t
9674fb83-bcf9-4fb2-ae5e-044ad6a71da7	e3823f8b-33a5-4c8e-9dca-4ed400c7acd8	1	25000.00	25000.00	11212177-619b-4c62-b273-db6670690fbe	2026-04-21 06:55:18.510424	2026-04-21 06:55:18.510428	t
d10a241e-6e20-482d-98fc-11d30cf39f54	de3d0c90-8920-4e95-bd1d-ba5bb0f94b15	2	15000.00	30000.00	b6b66692-886b-499f-b35f-e0b7c23c1a76	2026-04-22 04:00:23.627547	2026-04-22 04:00:23.627553	t
a38a2437-df44-4cb8-bd8c-b62a6c2ed40c	de3d0c90-8920-4e95-bd1d-ba5bb0f94b15	1	15000.00	15000.00	d8f66994-7e72-4992-b5de-d016f6728dcf	2026-04-22 04:15:06.281702	2026-04-22 04:15:06.281709	t
a38a2437-df44-4cb8-bd8c-b62a6c2ed40c	0d78dcb3-e2c4-4cd8-b76c-425d6a40986f	1	20000.00	20000.00	5b23a82a-a115-46bf-ac7f-c6d5e10c6384	2026-04-22 04:15:06.281725	2026-04-22 04:15:06.281729	t
a38a2437-df44-4cb8-bd8c-b62a6c2ed40c	da4fffaf-31d1-46c9-a173-88ac0ebfa332	1	15000.00	15000.00	8982e818-14d7-456c-a851-d5318f887921	2026-04-22 04:15:06.281741	2026-04-22 04:15:06.281744	t
a38a2437-df44-4cb8-bd8c-b62a6c2ed40c	ba804e5d-7838-4adb-bea0-6ebcd8a1ca2f	1	75000.00	75000.00	1d183e05-e241-446c-8f32-27154d607433	2026-04-22 04:15:06.281754	2026-04-22 04:15:06.281758	t
e1cfa694-1df0-4412-ae5c-95ff8fc15268	0d78dcb3-e2c4-4cd8-b76c-425d6a40986f	1	20000.00	20000.00	be2cc603-d6ef-4798-8674-4a119a20252a	2026-05-05 06:33:00.472237	2026-05-05 06:33:00.472237	t
e1cfa694-1df0-4412-ae5c-95ff8fc15268	ba804e5d-7838-4adb-bea0-6ebcd8a1ca2f	1	75000.00	75000.00	66ff870e-b49e-4e83-8d51-c152708d0ccb	2026-05-05 06:33:00.472237	2026-05-05 06:33:00.472237	t
e1cfa694-1df0-4412-ae5c-95ff8fc15268	e3823f8b-33a5-4c8e-9dca-4ed400c7acd8	1	25000.00	25000.00	ff750b1e-b8a7-45b8-b458-46df445a2e71	2026-05-05 06:33:00.472237	2026-05-05 06:33:00.472237	t
cf9fe09b-1df9-43f9-87dd-e08a30c2a739	f484d5ab-7c38-4bde-b1d5-0cb3a6a8b227	1	30000.00	30000.00	dbbc9560-4c6c-412e-af9f-88778513b622	2026-05-05 06:42:46.518013	2026-05-05 06:42:46.518013	t
00ab8637-d4cc-4013-abd0-87304040fcba	da4fffaf-31d1-46c9-a173-88ac0ebfa332	1	15000.00	15000.00	da842aa6-e676-4186-80aa-1118b3bbedac	2026-05-08 17:20:29.083136	2026-05-08 17:20:29.083141	t
00ab8637-d4cc-4013-abd0-87304040fcba	ba804e5d-7838-4adb-bea0-6ebcd8a1ca2f	1	75000.00	75000.00	7060817e-5ea1-4e7f-89b1-898969da97cc	2026-05-08 17:20:29.083152	2026-05-08 17:20:29.083154	t
00ab8637-d4cc-4013-abd0-87304040fcba	de3d0c90-8920-4e95-bd1d-ba5bb0f94b15	2	15000.00	30000.00	8aa89efc-7c26-4e00-82b3-8a970945d20b	2026-05-08 17:20:29.083162	2026-05-08 17:20:29.083164	t
00ab8637-d4cc-4013-abd0-87304040fcba	0d78dcb3-e2c4-4cd8-b76c-425d6a40986f	2	20000.00	40000.00	f3becb4a-d6e6-4aae-8734-51bae54d5e3f	2026-05-08 17:20:29.08317	2026-05-08 17:20:29.083172	t
de004d96-8855-4960-bb28-4c0b50e74f35	f484d5ab-7c38-4bde-b1d5-0cb3a6a8b227	1	30000.00	30000.00	0e26968c-77a8-49a9-bc8c-c59b05fb8d03	2026-05-19 07:07:22.862752	2026-05-19 07:07:22.862752	t
de004d96-8855-4960-bb28-4c0b50e74f35	ea137fe9-2f79-4c25-830b-3ae276c9ea7a	1	4000.00	4000.00	4b5180b1-ace0-4dac-b6bc-7d0002e52e84	2026-05-19 07:07:22.862752	2026-05-19 07:07:22.862752	t
bd73cb99-0427-45d7-b9b6-1eea3679a040	f484d5ab-7c38-4bde-b1d5-0cb3a6a8b227	1	30000.00	30000.00	bb875ffe-a66c-4b30-b2cd-539f2ac4abfc	2026-05-23 14:43:48.974373	2026-05-23 14:43:48.974373	t
bd73cb99-0427-45d7-b9b6-1eea3679a040	ea137fe9-2f79-4c25-830b-3ae276c9ea7a	1	4000.00	4000.00	346d99de-e0b1-4b75-8395-68faa448ae72	2026-05-23 14:43:48.974373	2026-05-23 14:43:48.974373	t
950ead93-8a2e-4ad0-8e67-cdd2dedd2a97	f484d5ab-7c38-4bde-b1d5-0cb3a6a8b227	1	30000.00	30000.00	2af6c852-f789-44a4-982b-45f3c3bea440	2026-05-23 14:56:13.08117	2026-05-23 14:56:13.08117	t
950ead93-8a2e-4ad0-8e67-cdd2dedd2a97	ea137fe9-2f79-4c25-830b-3ae276c9ea7a	3	4000.00	12000.00	5a709d56-e715-4190-b34c-842020d1a70e	2026-05-23 14:56:13.08117	2026-05-23 14:56:13.08117	t
8d6b8321-b178-4156-bc68-06047c183a08	ea137fe9-2f79-4c25-830b-3ae276c9ea7a	1	4000.00	4000.00	289ddbc8-dd05-4683-9218-82ea40717fa1	2026-05-23 15:12:14.767375	2026-05-23 15:12:14.767375	t
8d6b8321-b178-4156-bc68-06047c183a08	f484d5ab-7c38-4bde-b1d5-0cb3a6a8b227	2	30000.00	60000.00	cd94c46c-92e6-45a0-915d-99b87f00bfbd	2026-05-23 15:12:14.767375	2026-05-23 15:12:14.767375	t
a1634d6c-84a8-43cf-93dd-1f1d4ff0d38f	0d78dcb3-e2c4-4cd8-b76c-425d6a40986f	1	25000.00	25000.00	bc92d1ac-d8ad-4742-929a-bfcd37d7b7f7	2026-05-26 01:36:12.729124	2026-05-26 01:36:12.72913	t
a1634d6c-84a8-43cf-93dd-1f1d4ff0d38f	ba804e5d-7838-4adb-bea0-6ebcd8a1ca2f	1	75000.00	75000.00	033fbfac-cbda-4bc5-abe3-17b09c207622	2026-05-26 01:36:12.729141	2026-05-26 01:36:12.729143	t
a1634d6c-84a8-43cf-93dd-1f1d4ff0d38f	da4fffaf-31d1-46c9-a173-88ac0ebfa332	2	15000.00	30000.00	8307d296-1fb0-4797-a202-82fd1276b765	2026-05-26 01:36:12.729152	2026-05-26 01:36:12.729154	t
66a4724e-4493-4bdf-b5f2-7d0ff7c04d91	0d78dcb3-e2c4-4cd8-b76c-425d6a40986f	1	25000.00	25000.00	488ab947-a237-442e-92f1-c2f916ea0f00	2026-05-26 01:36:49.697942	2026-05-26 01:36:49.697969	t
66a4724e-4493-4bdf-b5f2-7d0ff7c04d91	ba804e5d-7838-4adb-bea0-6ebcd8a1ca2f	1	75000.00	75000.00	b6abfc6f-a7fc-46a3-8f55-e2e5987314ff	2026-05-26 01:36:49.697993	2026-05-26 01:36:49.697996	t
66a4724e-4493-4bdf-b5f2-7d0ff7c04d91	da4fffaf-31d1-46c9-a173-88ac0ebfa332	2	15000.00	30000.00	4813e00a-07cd-4312-a0d1-8a4fcc90b654	2026-05-26 01:36:49.698005	2026-05-26 01:36:49.698007	t
b2c30121-2fe5-4ae1-8f55-53232f1be650	ea137fe9-2f79-4c25-830b-3ae276c9ea7a	1	4000.00	4000.00	5ca0dcd5-31f9-4b6d-9e2d-adb0aa7640fd	2026-05-26 01:46:35.930045	2026-05-26 01:46:35.93005	t
2141f557-23d7-4971-8d7f-9655aeec30da	de3d0c90-8920-4e95-bd1d-ba5bb0f94b15	1	15000.00	15000.00	940a792b-9ac5-4da3-a543-db22b8a42da4	2026-05-26 01:46:37.506705	2026-05-26 01:46:37.50671	t
2141f557-23d7-4971-8d7f-9655aeec30da	0d78dcb3-e2c4-4cd8-b76c-425d6a40986f	1	20000.00	20000.00	1f402725-5ce0-4208-83eb-ea1af99be902	2026-05-26 01:46:37.506714	2026-05-26 01:46:37.506714	t
5c1b209a-c6cf-4aa2-931a-036300f21eab	0d78dcb3-e2c4-4cd8-b76c-425d6a40986f	1	20000.00	20000.00	c2adeef8-33a3-4a5a-8eba-6e60d8cef856	2026-06-01 11:39:58.359765	2026-06-01 11:39:58.359765	t
5c1b209a-c6cf-4aa2-931a-036300f21eab	de3d0c90-8920-4e95-bd1d-ba5bb0f94b15	1	15000.00	15000.00	6be22027-80e5-4ffe-8e5d-a75f546c4e32	2026-06-01 11:39:58.359765	2026-06-01 11:39:58.359765	t
e3ba2fd6-c4b5-4555-8efa-43e7142cb875	b0f9fae8-d91f-43ae-9e46-0cabea3045c5	1	28000.00	28000.00	69d65a06-96b8-4889-8e2f-61cf66878517	2026-06-01 11:39:58.82654	2026-06-01 11:39:58.82654	t
88549347-94cb-4d0e-9138-4263aeda90dd	20ec2b4b-64d1-4425-8171-98e25b7fa986	1	15000.00	15000.00	b004e5c2-6d69-4bd0-9fb0-e994d223f133	2026-06-01 11:39:59.316232	2026-06-01 11:39:59.316232	t
969f2a78-e47d-4b25-bc95-c16af3960a7f	ba804e5d-7838-4adb-bea0-6ebcd8a1ca2f	1	75000.00	75000.00	4c98738e-4b99-4cf8-8b3e-6eaf38242423	2026-06-01 12:49:31.533929	2026-06-01 12:49:31.533929	t
1962589e-3a02-4576-a532-a875d6022e73	ea137fe9-2f79-4c25-830b-3ae276c9ea7a	1	4000.00	4000.00	19fa6ebf-7131-41a2-9e4b-dfc73c1fc8b2	2026-06-01 12:49:32.068612	2026-06-01 12:49:32.068612	t
3773d316-ac12-457d-8013-a75b81dd12db	683cec80-403e-4955-9ade-05896f625ec3	1	25000.00	25000.00	8074537e-45de-4f9c-8077-fbdfaaa5ea5b	2026-06-01 12:49:32.581337	2026-06-01 12:49:32.581337	t
ca14e1a2-a6f2-4252-877c-e960f8fa1301	d6d242a2-e409-45e8-8e42-876992abaeab	1	20000.00	20000.00	ab34eed8-bce2-4779-beb6-6148b420482d	2026-06-10 04:33:18.532152	2026-06-10 04:33:18.532155	t
ca14e1a2-a6f2-4252-877c-e960f8fa1301	20ec2b4b-64d1-4425-8171-98e25b7fa986	1	15000.00	15000.00	5730d012-cc66-4fd0-a9da-7b463ddbc128	2026-06-10 04:33:18.532159	2026-06-10 04:33:18.532159	t
ed0fda70-6dad-47ee-b550-44f77c8ff137	ea137fe9-2f79-4c25-830b-3ae276c9ea7a	3	4000.00	12000.00	12f9694e-9c26-486c-96a3-464dea1e6036	2026-06-10 05:09:30.011581	2026-06-10 05:09:30.011585	t
5ff2fb4a-1bd1-4997-8033-b993bf0afe69	ff408132-0e2c-4c16-bdd7-50daf4027ef4	1	25000.00	25000.00	eb47ee2d-be19-4c72-b034-79a4a8c35ce1	2026-06-10 13:45:04.810785	2026-06-10 13:45:04.810788	t
5df0f64b-7ce6-4747-a83d-e2d9205cd438	f484d5ab-7c38-4bde-b1d5-0cb3a6a8b227	5	30000.00	150000.00	a4592366-4ca5-4e12-908e-fe0aa56df02b	2026-06-14 14:01:35.519607	2026-06-14 14:01:35.519607	t
b9b49caa-67cc-42b8-a227-9181efb34f53	ff408132-0e2c-4c16-bdd7-50daf4027ef4	2	25000.00	50000.00	ce7139be-54ed-4e57-bbba-5a7b6c03d344	2026-06-14 14:12:56.087016	2026-06-14 14:12:56.087016	t
9f4d67ee-181a-4d93-bc13-dba7a51e9e95	20ec2b4b-64d1-4425-8171-98e25b7fa986	2	15000.00	30000.00	5a3dedf3-a9b5-46b9-ad92-5546cc92432a	2026-06-14 14:12:56.694095	2026-06-14 14:12:56.694095	t
58ac8fdf-7b2b-48d3-b501-7a2d43cc2dad	de3d0c90-8920-4e95-bd1d-ba5bb0f94b15	1	15000.00	15000.00	dc25a342-fe74-456a-b965-d0ba88b837b8	2026-06-14 14:26:38.394303	2026-06-14 14:26:38.394303	t
75883b2d-9160-4f62-b3ad-7104f3fabee8	d6d242a2-e409-45e8-8e42-876992abaeab	1	20000.00	20000.00	8860b1cc-e3a0-49c4-a605-2868ac18dc82	2026-06-14 14:26:38.928167	2026-06-14 14:26:38.928167	t
4a84a0c7-18e4-4918-8bae-9ea1da489de9	f484d5ab-7c38-4bde-b1d5-0cb3a6a8b227	2	30000.00	60000.00	0d531e93-c1b9-4f2e-a366-6c81620c0aa0	2026-06-17 02:55:12.722745	2026-06-17 02:55:12.722749	t
b527d423-a0d3-42ca-bdc9-abfdb2d65063	f484d5ab-7c38-4bde-b1d5-0cb3a6a8b227	1	30000.00	30000.00	8e055dca-75b3-4cd6-90cf-a47787873fd8	2026-06-17 06:27:01.83078	2026-06-17 06:27:01.830783	t
b527d423-a0d3-42ca-bdc9-abfdb2d65063	ea137fe9-2f79-4c25-830b-3ae276c9ea7a	1	4000.00	4000.00	e52792b4-dace-4954-ab6d-cfc85e80a338	2026-06-17 06:27:01.830785	2026-06-17 06:27:01.830785	t
6b122fc3-3d3d-4191-9b28-1a1ca7f01fd0	f484d5ab-7c38-4bde-b1d5-0cb3a6a8b227	1	30000.00	30000.00	657b5b94-af62-4ecb-a341-6e42c2cfbc09	2026-06-17 06:39:55.871374	2026-06-17 06:39:55.871378	t
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (beneficiary_id, vendor_id, total_amount, voucher_used, cash_paid, status, payment_status, notes, id, created_at, updated_at, is_active, pickup_qr_code, pickup_expires_at, cancel_deadline, confirmed_by_vendor_id) FROM stdin;
20000000-0000-0000-0000-000000000001	30000000-0000-0000-0000-000000000001	139000.00	90000.00	49000.00	completed	paid	Order e2e 1	70000000-0000-0000-0000-000000000001	2026-04-15 07:28:50.205462	2026-04-18 07:28:51.17948	t	\N	\N	\N	\N
20000000-0000-0000-0000-000000000001	30000000-0000-0000-0000-000000000002	113000.00	50000.00	63000.00	processing	partial	Order e2e 2	70000000-0000-0000-0000-000000000002	2026-04-17 07:28:50.205462	2026-04-18 07:28:51.179485	t	\N	\N	\N	\N
ee4f68ab-cc12-45f8-92b6-3c1f7422aff6	30000000-0000-0000-0000-000000000002	54000.00	0.00	54000.00	pending	pending	\N	3a60b719-f3c6-48ef-af1f-ea18c025f88f	2026-04-18 08:57:43.271023	2026-04-18 08:57:43.27103	t	\N	\N	\N	\N
ee4f68ab-cc12-45f8-92b6-3c1f7422aff6	30000000-0000-0000-0000-000000000001	60000.00	0.00	60000.00	pending	pending	\N	2ba7a447-8aa9-4dc7-ad5e-fa580a2de882	2026-04-18 11:42:24.467703	2026-04-18 11:42:24.46771	t	\N	\N	\N	\N
ee4f68ab-cc12-45f8-92b6-3c1f7422aff6	30000000-0000-0000-0000-000000000002	85000.00	0.00	85000.00	pending	pending	\N	02f7dd12-97f8-43a5-b55f-eb2229cbb700	2026-04-18 11:42:25.524444	2026-04-18 11:42:25.524449	t	\N	\N	\N	\N
ee4f68ab-cc12-45f8-92b6-3c1f7422aff6	30000000-0000-0000-0000-000000000002	101000.00	0.00	101000.00	pending	pending	\N	1ccd7edb-da25-4f51-b9df-fa5d07d3573f	2026-04-19 13:43:09.681722	2026-04-19 13:43:09.681736	t	\N	\N	\N	\N
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	88975b2b-ba37-4178-92db-235e6d9f0ff0	150000.00	0.00	0.00	completed	pending	\N	bca17548-4db0-4ec1-b837-45956237f364	2026-04-20 15:26:45.032744	2026-04-20 15:26:45.03275	t	\N	\N	\N	\N
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	88975b2b-ba37-4178-92db-235e6d9f0ff0	150000.00	0.00	0.00	completed	pending	\N	3d2302d8-e765-45ef-9447-46fa7235c499	2026-04-20 15:27:31.060744	2026-04-20 15:27:31.060752	t	\N	\N	\N	\N
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	88975b2b-ba37-4178-92db-235e6d9f0ff0	60000.00	0.00	60000.00	pending	pending	\N	9674fb83-bcf9-4fb2-ae5e-044ad6a71da7	2026-04-21 06:55:18.04898	2026-04-21 06:55:18.04899	t	\N	\N	\N	\N
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	88975b2b-ba37-4178-92db-235e6d9f0ff0	30000.00	0.00	30000.00	pending	pending	\N	d10a241e-6e20-482d-98fc-11d30cf39f54	2026-04-22 04:00:23.42625	2026-04-22 04:00:23.426255	t	\N	\N	\N	\N
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	706ffe8f-d51e-4a2f-924f-8180d76dc558	30000.00	0.00	30000.00	pending	pending	\N	cf9fe09b-1df9-43f9-87dd-e08a30c2a739	2026-05-05 06:42:46.29722	2026-05-05 06:42:46.29722	t	\N	\N	\N	\N
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	88975b2b-ba37-4178-92db-235e6d9f0ff0	120000.00	0.00	120000.00	completed	pending	\N	e1cfa694-1df0-4412-ae5c-95ff8fc15268	2026-05-05 06:32:59.871977	2026-05-05 07:14:25.985253	t	\N	\N	\N	\N
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	88975b2b-ba37-4178-92db-235e6d9f0ff0	125000.00	0.00	125000.00	completed	pending	\N	a38a2437-df44-4cb8-bd8c-b62a6c2ed40c	2026-04-22 04:15:06.156726	2026-05-07 06:47:05.495964	t	\N	\N	\N	88975b2b-ba37-4178-92db-235e6d9f0ff0
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	88975b2b-ba37-4178-92db-235e6d9f0ff0	160000.00	160000.00	0.00	cancelled	paid	\N	00ab8637-d4cc-4013-abd0-87304040fcba	2026-05-08 17:20:28.830166	2026-05-09 17:30:00.696695	t	43D48FB8161849B994D9B9EB	2026-05-09 17:20:28.762122	2026-05-08 17:50:28.762122	\N
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	706ffe8f-d51e-4a2f-924f-8180d76dc558	34000.00	34000.00	0.00	cancelled	paid	Split order dari keranjang	de004d96-8855-4960-bb28-4c0b50e74f35	2026-05-19 07:07:22.043364	2026-05-20 07:30:03.699643	t	E0BB3C5D49AD4E509A9E1905	2026-05-20 07:07:21.82694	2026-05-19 07:37:21.82694	\N
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	706ffe8f-d51e-4a2f-924f-8180d76dc558	34000.00	34000.00	0.00	completed	paid	Split order dari keranjang	bd73cb99-0427-45d7-b9b6-1eea3679a040	2026-05-23 14:43:48.563195	2026-05-23 14:45:07.651763	t	4809A5158A3442EEB8491A38	2026-05-24 14:43:48.38663	2026-05-23 15:13:48.38663	706ffe8f-d51e-4a2f-924f-8180d76dc558
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	706ffe8f-d51e-4a2f-924f-8180d76dc558	42000.00	42000.00	0.00	completed	paid	Split order dari keranjang	950ead93-8a2e-4ad0-8e67-cdd2dedd2a97	2026-05-23 14:56:12.643126	2026-05-23 14:58:19.885328	t	FA7A2F9172924F16A5C7E6C9	2026-05-24 14:56:12.494922	2026-05-23 15:26:12.494922	706ffe8f-d51e-4a2f-924f-8180d76dc558
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	706ffe8f-d51e-4a2f-924f-8180d76dc558	64000.00	64000.00	0.00	completed	paid	Split order dari keranjang	8d6b8321-b178-4156-bc68-06047c183a08	2026-05-23 15:12:14.403631	2026-05-23 15:13:39.574513	t	46EBE2416C714ACF9C5FF262	2026-05-24 15:12:14.262015	2026-05-23 15:42:14.262015	706ffe8f-d51e-4a2f-924f-8180d76dc558
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	88975b2b-ba37-4178-92db-235e6d9f0ff0	150000.00	0.00	0.00	completed	pending	\N	a1634d6c-84a8-43cf-93dd-1f1d4ff0d38f	2026-05-26 01:36:12.67983	2026-05-26 01:36:12.679835	t	\N	\N	\N	\N
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	88975b2b-ba37-4178-92db-235e6d9f0ff0	150000.00	0.00	0.00	completed	pending	\N	66a4724e-4493-4bdf-b5f2-7d0ff7c04d91	2026-05-26 01:36:49.66349	2026-05-26 01:36:49.663499	t	\N	\N	\N	\N
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	88975b2b-ba37-4178-92db-235e6d9f0ff0	35000.00	35000.00	0.00	cancelled	paid	Split order dari keranjang	2141f557-23d7-4971-8d7f-9655aeec30da	2026-05-26 01:46:36.456717	2026-05-27 02:00:00.174918	t	58CE2621A2F24B81B97E0130	2026-05-27 01:46:34.679809	2026-05-26 02:16:34.679809	\N
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	706ffe8f-d51e-4a2f-924f-8180d76dc558	4000.00	4000.00	0.00	cancelled	paid	Split order dari keranjang	b2c30121-2fe5-4ae1-8f55-53232f1be650	2026-05-26 01:46:35.038648	2026-05-27 02:00:00.174922	t	1D5D87968C65480CB5B1E7B8	2026-05-27 01:46:34.679809	2026-05-26 02:16:34.679809	\N
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	88975b2b-ba37-4178-92db-235e6d9f0ff0	35000.00	35000.00	0.00	cancelled	paid	Split order dari keranjang	5c1b209a-c6cf-4aa2-931a-036300f21eab	2026-06-01 11:39:57.94393	2026-06-02 12:00:00.279029	t	8864E7EE63C744DBACA249F2	2026-06-02 11:39:57.74268	2026-06-01 12:09:57.74268	\N
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	6d6e430d-7a02-4b3e-b563-2b15dfe4a7cb	15000.00	15000.00	0.00	cancelled	paid	Split order dari keranjang	88549347-94cb-4d0e-9138-4263aeda90dd	2026-06-01 11:39:59.01039	2026-06-02 12:00:00.279032	t	2B8058F8DAFE47BAA3DA869E	2026-06-02 11:39:57.74268	2026-06-01 12:09:57.74268	\N
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	30000000-0000-0000-0000-000000000002	28000.00	28000.00	0.00	cancelled	paid	Split order dari keranjang	e3ba2fd6-c4b5-4555-8efa-43e7142cb875	2026-06-01 11:39:58.545423	2026-06-02 12:00:00.279033	t	F9DB1B43ECAA45CF97129712	2026-06-02 11:39:57.74268	2026-06-01 12:09:57.74268	\N
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	706ffe8f-d51e-4a2f-924f-8180d76dc558	4000.00	4000.00	0.00	cancelled	paid	Split order dari keranjang	1962589e-3a02-4576-a532-a875d6022e73	2026-06-01 12:49:31.739061	2026-06-02 13:00:00.140659	t	3F1C3C4B0AD7454194199879	2026-06-02 12:49:30.97009	2026-06-01 13:19:30.97009	\N
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	6d6e430d-7a02-4b3e-b563-2b15dfe4a7cb	25000.00	25000.00	0.00	cancelled	paid	Split order dari keranjang	3773d316-ac12-457d-8013-a75b81dd12db	2026-06-01 12:49:32.265345	2026-06-02 13:00:00.140663	t	317C505510CE4DA48F495B62	2026-06-02 12:49:30.97009	2026-06-01 13:19:30.97009	\N
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	88975b2b-ba37-4178-92db-235e6d9f0ff0	75000.00	75000.00	0.00	cancelled	paid	Split order dari keranjang	969f2a78-e47d-4b25-bc95-c16af3960a7f	2026-06-01 12:49:31.142846	2026-06-02 13:00:00.140664	t	D918C1C457EF46238CFC1AA3	2026-06-02 12:49:30.97009	2026-06-01 13:19:30.97009	\N
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	706ffe8f-d51e-4a2f-924f-8180d76dc558	12000.00	12000.00	0.00	completed	paid	Split order dari keranjang	ed0fda70-6dad-47ee-b550-44f77c8ff137	2026-06-10 05:09:28.895598	2026-06-10 05:11:00.456954	t	40C4E0CE265F45E78C542460	2026-06-11 05:09:28.528429	2026-06-10 05:39:28.528429	706ffe8f-d51e-4a2f-924f-8180d76dc558
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	7a1ee006-f94b-463b-9d47-f99241469e24	25000.00	25000.00	0.00	completed	paid	Split order dari keranjang	5ff2fb4a-1bd1-4997-8033-b993bf0afe69	2026-06-10 13:45:03.840141	2026-06-10 13:56:31.888911	t	12CF8EF7386A44418DDE74EE	2026-06-11 13:45:03.441521	2026-06-10 14:15:03.441521	7a1ee006-f94b-463b-9d47-f99241469e24
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	6d6e430d-7a02-4b3e-b563-2b15dfe4a7cb	35000.00	35000.00	0.00	cancelled	paid	Split order dari keranjang	ca14e1a2-a6f2-4252-877c-e960f8fa1301	2026-06-10 04:33:17.413791	2026-06-11 05:00:03.733789	t	F4952564C1434197A4AC0450	2026-06-11 04:33:17.043876	2026-06-10 05:03:17.043876	\N
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	88975b2b-ba37-4178-92db-235e6d9f0ff0	15000.00	15000.00	0.00	cancelled	paid	Split order dari keranjang	58ac8fdf-7b2b-48d3-b501-7a2d43cc2dad	2026-06-14 14:26:38.064445	2026-06-15 14:30:06.045924	t	F2CC63BED30441158EDE68D3	2026-06-15 14:26:37.915675	2026-06-14 14:56:37.915675	\N
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	706ffe8f-d51e-4a2f-924f-8180d76dc558	150000.00	150000.00	0.00	cancelled	paid	Split order dari keranjang	5df0f64b-7ce6-4747-a83d-e2d9205cd438	2026-06-14 14:01:35.158235	2026-06-15 14:30:06.045928	t	4DD118BE5214455AB2FA2635	2026-06-15 14:01:34.992142	2026-06-14 14:31:34.992142	\N
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	6d6e430d-7a02-4b3e-b563-2b15dfe4a7cb	20000.00	20000.00	0.00	cancelled	paid	Split order dari keranjang	75883b2d-9160-4f62-b3ad-7104f3fabee8	2026-06-14 14:26:38.610862	2026-06-15 14:30:06.045929	t	A5335F85682246ACBDC08463	2026-06-15 14:26:37.915675	2026-06-14 14:56:37.915675	\N
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	6d6e430d-7a02-4b3e-b563-2b15dfe4a7cb	30000.00	30000.00	0.00	cancelled	paid	Split order dari keranjang	9f4d67ee-181a-4d93-bc13-dba7a51e9e95	2026-06-14 14:12:56.317938	2026-06-15 14:30:06.045929	t	727803DABB694AF187642810	2026-06-15 14:12:55.550498	2026-06-14 14:42:55.550498	\N
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	7a1ee006-f94b-463b-9d47-f99241469e24	50000.00	50000.00	0.00	cancelled	paid	Split order dari keranjang	b9b49caa-67cc-42b8-a227-9181efb34f53	2026-06-14 14:12:55.721926	2026-06-15 14:30:06.04593	t	A1E976738B134A0FB309FA62	2026-06-15 14:12:55.550498	2026-06-14 14:42:55.550498	\N
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	706ffe8f-d51e-4a2f-924f-8180d76dc558	60000.00	60000.00	0.00	completed	paid	Split order dari keranjang	4a84a0c7-18e4-4918-8bae-9ea1da489de9	2026-06-17 02:55:11.639119	2026-06-17 02:58:05.564615	t	373CB3BB708B4FCF80A2D42A	2026-06-18 02:55:11.278459	2026-06-17 03:25:11.278459	706ffe8f-d51e-4a2f-924f-8180d76dc558
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	706ffe8f-d51e-4a2f-924f-8180d76dc558	30000.00	30000.00	0.00	completed	paid	Split order dari keranjang	6b122fc3-3d3d-4191-9b28-1a1ca7f01fd0	2026-06-17 06:39:54.96614	2026-06-17 06:43:30.30214	t	F33C4C656D734D8C8D33725E	2026-06-18 06:39:54.594961	2026-06-17 07:09:54.594961	706ffe8f-d51e-4a2f-924f-8180d76dc558
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	706ffe8f-d51e-4a2f-924f-8180d76dc558	34000.00	34000.00	0.00	cancelled	paid	Split order dari keranjang	b527d423-a0d3-42ca-bdc9-abfdb2d65063	2026-06-17 06:27:00.760327	2026-06-18 06:30:03.680917	t	ADD6B0EB5B0E4990B63A28C2	2026-06-18 06:27:00.407981	2026-06-17 06:57:00.407981	\N
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (vendor_id, category_id, name, description, price, voucher_price, stock_quantity, unit, images, approval_status, id, created_at, updated_at, is_active) FROM stdin;
30000000-0000-0000-0000-000000000002	f7b66693-9d12-450a-873d-84fa8f942872	Susu Bubuk 400gr	Produk e2e untuk Susu	52000.00	48000.00	38	pack	["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=600&fit=crop"]	approved	1c70b8b7-7e36-4f4c-b2cb-6c97e2904267	2026-04-18 07:28:49.629626	2026-05-09 17:51:31.210672	t
30000000-0000-0000-0000-000000000002	7cf46de2-2bff-4476-9c1d-e5376bdc2abb	Ikan Kembung 1kg	Produk e2e untuk Protein	45000.00	42000.00	55	kg	["https://images.unsplash.com/photo-1493770348161-369560ae357d?w=600&h=600&fit=crop"]	approved	443eb113-56a0-41a0-a779-682fb7c49f87	2026-04-18 07:28:49.629594	2026-05-09 17:51:31.210674	t
88975b2b-ba37-4178-92db-235e6d9f0ff0	0097fcac-654a-48be-8658-9606ecb05e19	Minyak Goreng	\N	20000.00	20000.00	57	1 L	["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=600&fit=crop"]	approved	0d78dcb3-e2c4-4cd8-b76c-425d6a40986f	2026-04-20 15:21:44.627634	2026-06-02 12:00:00.245331	t
3293b8aa-335d-4228-9e49-edc1aa133f6e	ccbe2f35-343c-4198-b875-b910da013afa	Beras 5kg	\N	15000.00	10000.00	100	pcs	["https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=600&fit=crop"]	approved	51534aee-33b9-48cb-8c09-30dbaad0adff	2026-04-19 13:51:55.283139	2026-06-10 05:07:26.80074	t
30000000-0000-0000-0000-000000000002	ba4ebdf7-535a-450d-892c-72886fa3f30d	Wortel Segar	Produk e2e untuk Sayuran	12000.00	10000.00	65	kg	["https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&h=600&fit=crop"]	approved	607f0bc3-03e2-41bc-adb0-fbbc0cf6949a	2026-04-18 07:28:49.629604	2026-05-09 17:51:31.210678	t
30000000-0000-0000-0000-000000000002	ccbe2f35-343c-4198-b875-b910da013afa	Beras Medium 5kg	Produk e2e untuk Beras	68000.00	64000.00	100	pack	["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=600&fit=crop"]	approved	6b5f2673-fb03-41b0-8c66-cda70ec9320a	2026-04-18 07:28:49.629586	2026-05-09 17:51:31.21068	t
30000000-0000-0000-0000-000000000001	7cf46de2-2bff-4476-9c1d-e5376bdc2abb	Ayam Potong 1kg	Produk e2e untuk Protein	42000.00	39000.00	34	kg	["https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=600&fit=crop"]	approved	6c1a7521-4128-4358-b576-fca4f5c099d4	2026-04-18 07:28:49.629653	2026-05-09 17:51:31.210681	t
30000000-0000-0000-0000-000000000002	f7b66693-9d12-450a-873d-84fa8f942872	Yogurt Plain	Produk e2e untuk Susu	16000.00	14000.00	21	pcs	["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=600&fit=crop"]	approved	70b9c4cc-8c93-4123-b017-312a80613a4f	2026-04-18 07:28:49.629686	2026-05-09 17:51:31.210683	t
30000000-0000-0000-0000-000000000001	ba4ebdf7-535a-450d-892c-72886fa3f30d	Bayam Segar	Produk e2e untuk Sayuran	10000.00	9000.00	80	ikat	["https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=600&fit=crop"]	approved	152fbadc-0fb3-4f2a-8e3f-249e174947ac	2026-04-18 07:28:49.62949	2026-05-09 17:51:31.210665	t
30000000-0000-0000-0000-000000000001	ba4ebdf7-535a-450d-892c-72886fa3f30d	Brokoli	Produk e2e untuk Sayuran	18000.00	15000.00	39	kg	["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop"]	approved	1532b217-3691-4fb9-aa33-83320ac5dd0e	2026-04-18 07:28:49.629665	2026-05-09 17:51:31.210668	t
30000000-0000-0000-0000-000000000001	31e860cf-a254-43d8-b48b-7ca432c32672	Pisang Ambon	Produk e2e untuk Buah	22000.00	20000.00	60	sisir	["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop"]	approved	178c2dc2-6dd9-4a01-9433-6f2cf170883f	2026-04-18 07:28:49.6295	2026-05-09 17:51:31.21067	t
30000000-0000-0000-0000-000000000001	ccbe2f35-343c-4198-b875-b910da013afa	Beras Premium 5kg	Produk e2e untuk Beras	75000.00	70000.00	120	pack	["https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&h=600&fit=crop"]	approved	8e2f9aae-677c-4aaa-9db3-84a67177142c	2026-04-18 07:28:49.62946	2026-05-09 17:51:31.210685	t
30000000-0000-0000-0000-000000000001	7cf46de2-2bff-4476-9c1d-e5376bdc2abb	Telur Ayam 1kg	Produk e2e untuk Protein	32000.00	30000.00	90	kg	["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=600&fit=crop"]	approved	92d77e1e-fb1a-4ad5-9cfb-43248982451d	2026-04-18 07:28:49.629478	2026-05-09 17:51:31.210687	t
30000000-0000-0000-0000-000000000001	09d47c16-5464-4b71-90bd-d28df7164f61	Minyak Goreng 1L	Produk e2e untuk Bumbu	18000.00	0.00	100	liter	["https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&h=600&fit=crop"]	approved	adbd0843-062b-4a6f-891d-6e55e4f50b7f	2026-04-18 07:28:49.629575	2026-05-09 17:51:31.210688	t
30000000-0000-0000-0000-000000000002	31e860cf-a254-43d8-b48b-7ca432c32672	Apel Fuji	Produk e2e untuk Buah	38000.00	34000.00	29	kg	["https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&h=600&fit=crop"]	approved	b04a62c9-4464-4ed9-9452-a8174ac236a5	2026-04-18 07:28:49.629677	2026-05-09 17:51:31.21069	t
30000000-0000-0000-0000-000000000002	09d47c16-5464-4b71-90bd-d28df7164f61	Gula Pasir 1kg	Produk e2e untuk Bumbu	17000.00	0.00	88	kg	["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=600&fit=crop"]	approved	bff8c61b-f916-452a-9c42-2aac1f8b9732	2026-04-18 07:28:49.629636	2026-05-09 17:51:31.210695	t
30000000-0000-0000-0000-000000000001	f7b66693-9d12-450a-873d-84fa8f942872	Susu UHT 1L	Produk e2e untuk Susu	19000.00	17000.00	70	liter	["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=600&fit=crop"]	approved	c053dbe6-8b21-4148-9027-f482983e8207	2026-04-18 07:28:49.629562	2026-05-09 17:51:31.210697	t
88975b2b-ba37-4178-92db-235e6d9f0ff0	f7b66693-9d12-450a-873d-84fa8f942872	Susu UHT	\N	15000.00	15000.00	79	1 L	["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop"]	approved	da4fffaf-31d1-46c9-a173-88ac0ebfa332	2026-04-20 15:21:44.62762	2026-05-09 17:51:31.210699	t
88975b2b-ba37-4178-92db-235e6d9f0ff0	7cf46de2-2bff-4476-9c1d-e5376bdc2abb	Telur Ayam	\N	25000.00	25000.00	98	10 pcs	["https://images.unsplash.com/photo-1493770348161-369560ae357d?w=600&h=600&fit=crop"]	approved	e3823f8b-33a5-4c8e-9dca-4ed400c7acd8	2026-04-20 15:21:44.627584	2026-05-09 17:51:31.210702	t
88975b2b-ba37-4178-92db-235e6d9f0ff0	0097fcac-654a-48be-8658-9606ecb05e19	Minyak	\N	10000.00	9500.00	0	pcs	["https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&h=600&fit=crop"]	approved	f3e696c7-2907-4b38-9047-4799a3f7a181	2026-04-21 01:49:42.747255	2026-05-09 17:51:31.210706	t
6d6e430d-7a02-4b3e-b563-2b15dfe4a7cb	7cf46de2-2bff-4476-9c1d-e5376bdc2abb	Telur Ayam	\N	25000.00	25000.00	100	10 pcs	[]	approved	683cec80-403e-4955-9ade-05896f625ec3	2026-05-26 01:36:49.545114	2026-06-02 13:00:00.119124	t
88975b2b-ba37-4178-92db-235e6d9f0ff0	565c4947-5da0-4f71-887a-1e9e1456f39e	Beras Premium	\N	75000.00	75000.00	48	5 kg	["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop"]	approved	ba804e5d-7838-4adb-bea0-6ebcd8a1ca2f	2026-04-20 15:21:44.627605	2026-06-02 13:00:00.119127	t
7a1ee006-f94b-463b-9d47-f99241469e24	\N	Telur ayam dummy	\N	25000.00	1000.00	9	kg	[]	approved	ff408132-0e2c-4c16-bdd7-50daf4027ef4	2026-06-10 13:30:08.370391	2026-06-15 14:30:04.300959	t
706ffe8f-d51e-4a2f-924f-8180d76dc558	565c4947-5da0-4f71-887a-1e9e1456f39e	Telur Bebek	\N	4000.00	4000.00	50	pcs	["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=600&fit=crop"]	approved	ea137fe9-2f79-4c25-830b-3ae276c9ea7a	2026-05-05 06:36:14.690562	2026-06-18 06:30:02.878763	t
706ffe8f-d51e-4a2f-924f-8180d76dc558	565c4947-5da0-4f71-887a-1e9e1456f39e	Beras Subsidi Premium 1Kg	\N	50000.00	50000.00	50	kg	["data:image/jpeg;base64,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"]	approved	fa97a6fb-6eb3-451b-a03b-60553710d09d	2026-05-05 06:35:43.153933	2026-06-17 03:01:49.597741	t
706ffe8f-d51e-4a2f-924f-8180d76dc558	565c4947-5da0-4f71-887a-1e9e1456f39e	Susu Kambing 1Ltr	\N	30000.00	30000.00	2	liter	["https://ydglsytahhjdoznvnfnc.supabase.co/storage/v1/object/public/nutriguard-uploads/product_images/maseudrjf2k_1781445630520.jpg"]	approved	f484d5ab-7c38-4bde-b1d5-0cb3a6a8b227	2026-05-05 06:37:16.543404	2026-06-18 06:30:02.878768	t
6d6e430d-7a02-4b3e-b563-2b15dfe4a7cb	565c4947-5da0-4f71-887a-1e9e1456f39e	Beras Premium	\N	75000.00	75000.00	50	5 kg	[]	approved	d27b6eac-4a43-4c54-b8ce-5cbc99ebf2b9	2026-05-26 01:36:49.545192	2026-05-26 01:36:49.545355	t
6d6e430d-7a02-4b3e-b563-2b15dfe4a7cb	f7b66693-9d12-450a-873d-84fa8f942872	Susu UHT	\N	15000.00	15000.00	80	1 L	[]	approved	eb07cafa-8f05-4728-b194-c90670454ff6	2026-05-26 01:36:49.545382	2026-05-26 01:36:49.545385	t
30000000-0000-0000-0000-000000000002	31e860cf-a254-43d8-b48b-7ca432c32672	Jeruk Manis	Produk e2e untuk Buah	28000.00	25000.00	45	kg	["https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=600&fit=crop"]	approved	b0f9fae8-d91f-43ae-9e46-0cabea3045c5	2026-04-18 07:28:49.629617	2026-06-02 12:00:00.245335	t
6d6e430d-7a02-4b3e-b563-2b15dfe4a7cb	b635909c-d8c5-4fef-a423-b21613f9c6b1	Gula Pasir	\N	15000.00	15000.00	70	1 kg	[]	approved	20ec2b4b-64d1-4425-8171-98e25b7fa986	2026-05-26 01:36:49.545408	2026-06-15 14:30:04.300951	t
6d6e430d-7a02-4b3e-b563-2b15dfe4a7cb	0097fcac-654a-48be-8658-9606ecb05e19	Minyak Goreng	\N	20000.00	20000.00	60	1 L	[]	approved	d6d242a2-e409-45e8-8e42-876992abaeab	2026-05-26 01:36:49.545396	2026-06-15 14:30:04.300957	t
88975b2b-ba37-4178-92db-235e6d9f0ff0	b635909c-d8c5-4fef-a423-b21613f9c6b1	Gula Pasir	\N	15000.00	15000.00	66	1 kg	["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=600&fit=crop"]	approved	de3d0c90-8920-4e95-bd1d-ba5bb0f94b15	2026-04-20 15:21:44.627646	2026-06-15 14:30:04.300957	t
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, user_id, full_name, phone, avatar_url, created_at, updated_at) FROM stdin;
b72f9ca0-a121-4ccc-8c88-6466f0d2f8c5	b4a06baa-2cf5-4817-9dfe-73cb4506a674	Achmad Faruq	\N	\N	2026-05-09 16:02:50.833517+00	2026-05-09 16:02:50.833517+00
ac3f7411-ffa3-452c-8225-887971fd1814	319688e1-ad41-4c83-a381-a8a700681e3d	Devin	\N	\N	2026-05-19 08:49:00.105246+00	2026-05-19 08:49:00.105246+00
86242cbb-7605-4ba9-952e-5c599ddbc3d8	e848d29b-a53b-4cde-86cc-c6712dadce20	\N	\N	\N	2026-05-26 01:36:48.905771+00	2026-05-26 01:36:48.905771+00
b394f5f6-33bb-44d3-8103-401127e87a7d	c5a8b3e9-5677-4577-aabc-a25446f0ae61	\N	\N	\N	2026-05-26 01:36:49.110016+00	2026-05-26 01:36:49.110016+00
a091f4d6-48a8-4de5-9708-db95d2f9fc73	6d6e430d-7a02-4b3e-b563-2b15dfe4a7cb	\N	\N	\N	2026-05-26 01:36:49.271562+00	2026-05-26 01:36:49.271562+00
a857a9a4-43e6-4eaa-a876-f2945a4f70ea	72bddb91-e66b-4823-8b1e-c7e88304cbeb	Nadwah Khairunnisa	\N	\N	2026-06-09 13:11:30.609608+00	2026-06-09 13:11:30.609608+00
8a6b11fc-11ec-43f4-8d9b-5154b84632d6	021f699b-bfce-4bc1-a01a-474b9d8c98bf	Nadwah Khairunnisa	\N	\N	2026-06-09 13:14:06.993703+00	2026-06-09 13:14:06.993703+00
986ca983-f0b0-4f36-9ca8-87212d9c1e3d	ae4bcc8a-3094-4ed9-97d0-846a046aea52	Ghaitsa Aulia	\N	\N	2026-06-09 13:17:15.223299+00	2026-06-09 13:17:15.223299+00
f958447d-6207-4a63-a5e0-5b10009539ef	ee1fc5d9-541b-4ee4-948c-c3e15ab36013	Hana Muthia Yusuf 2306252566	\N	\N	2026-06-09 13:17:40.693673+00	2026-06-09 13:17:40.693673+00
a2504448-4001-4789-9306-c2b6886e8f60	46f6f92d-39d9-4712-a2b8-73dd74ec44b6	hana muthia	\N	\N	2026-06-09 13:20:05.128367+00	2026-06-09 13:20:05.128367+00
9344c807-ec77-4b6c-bc4a-008075fb0e2d	679068fe-5f7b-426f-8bc5-702def6a2380	Ladiva Aulia	\N	\N	2026-06-09 16:20:42.459195+00	2026-06-09 16:20:42.459195+00
d5dd92fc-d3ac-4809-90a5-aad28ce9a910	8f567802-a7ad-4f4f-8534-bdc036b09b97	Kimberly Aureva Johannes	\N	\N	2026-06-09 17:19:02.598909+00	2026-06-09 17:19:02.598909+00
4f380a8d-f70b-4f1d-a44b-0de87f5cdc66	fe740ebf-30f7-4fe7-a1b8-5757f8113719	Kotali	\N	\N	2026-06-10 09:17:43.236999+00	2026-06-10 09:17:43.236999+00
f9cffb82-4f2e-43d3-8440-905a43aa360b	80d7d392-e7b5-4f75-8ff2-baa2ad3c8e48	Valencia Anjelina	\N	\N	2026-06-10 09:18:16.06647+00	2026-06-10 09:18:16.06647+00
87c41193-a4d7-4f4d-bea7-1e3ed0bca861	1faefcbe-4492-4063-88ae-45ea76cbe2fb	Vanesha Tania	\N	\N	2026-06-10 09:19:13.212839+00	2026-06-10 09:19:13.212839+00
0767100c-fcec-4007-ab14-e49cecea0139	b0a93dd4-8d79-4eea-bef9-d8e13bf54a46	Alicia Huang	\N	\N	2026-06-10 09:19:41.601288+00	2026-06-10 09:19:41.601288+00
af894665-395c-458e-ac98-1d72e8165326	357bd5bf-909d-4317-83a5-556c926ed56a	Devita	\N	\N	2026-06-10 09:20:16.03654+00	2026-06-10 09:20:16.03654+00
d84ffd19-f8de-46e8-a9df-b56e683d59fd	d50ed1f1-04be-4b0e-9b8c-16ddfd4606ce	Kotali	\N	\N	2026-06-10 09:22:21.169454+00	2026-06-10 09:22:21.169454+00
790b5b5a-9a4f-4bfd-811f-cd8583d9ffb9	c99d71f2-8702-46a0-baf8-c775787f31fa	Antoni Lim	\N	\N	2026-06-10 09:22:33.328506+00	2026-06-10 09:22:33.328506+00
fd69e76b-cde3-4dae-8df4-d9eeb5f05a6b	0aa32472-f539-4888-ab3f-db23cb4e5743	Candra 	\N	\N	2026-06-10 09:23:55.962654+00	2026-06-10 09:23:55.962654+00
825aae01-ee88-4bb4-a923-013ed763049e	0419ba30-33ce-40c0-bd61-31cfc233a271	Virly	\N	\N	2026-06-10 09:25:02.533248+00	2026-06-10 09:25:02.533248+00
575b0c2e-d5cf-4cec-b199-9b2fe2cf8334	b095701a-f443-489d-a0c6-4a3a15ee9bdb	Alicia	\N	\N	2026-06-10 09:26:46.684677+00	2026-06-10 09:26:46.684677+00
1632df0d-77fb-45bf-a695-7a4506faed19	82147428-e16e-4ed8-9f62-bd5353a1b288	Edbert Jonathan Lay	\N	\N	2026-06-10 09:29:13.192646+00	2026-06-10 09:29:13.192646+00
c0a5d8b1-59c1-44d1-a994-86753f2fdc81	1018fa47-9476-4f11-b249-b064eb297dec	Jason Lie	\N	\N	2026-06-10 09:38:44.093359+00	2026-06-10 09:38:44.093359+00
0cc5579a-a1e9-4d60-8c87-3444750380e7	16f078f8-7650-4e74-a56b-2e80141123d9	Brayden To	\N	\N	2026-06-10 09:40:39.914089+00	2026-06-10 09:40:39.914089+00
6878a7ef-4332-4bbf-ac5c-e35cd94d4026	3d77e2fc-dd8e-4c33-bb51-b0202d3d82ee	Brenda Aouren Tamia	\N	\N	2026-06-10 09:41:56.311275+00	2026-06-10 09:41:56.311275+00
d9169293-bf9c-455b-a5a7-43b58a880d26	bc1166f0-5e38-4cd0-9fe2-3faead0b87aa	Chindy Aulia	\N	\N	2026-06-10 09:44:55.852437+00	2026-06-10 09:44:55.852437+00
c29e709f-4cdc-4573-ab29-2a7063ecc015	5d964e27-02d2-483d-b3f9-e0561ef621a9	Laurensa Andi	\N	\N	2026-06-10 09:46:41.731563+00	2026-06-10 09:46:41.731563+00
627dc26e-55b9-4742-a9a1-d6fb125bc2fa	337efcff-35ee-4a55-ac77-2995542022ae	Agnes Monica	\N	\N	2026-06-10 09:48:36.943954+00	2026-06-10 09:48:36.943954+00
4cbf4842-d348-434d-acaf-d5d3a8bc69e8	0cfe9a0e-da21-4ad4-9e40-2b1fb4179c8a	caroline 1	\N	\N	2026-06-10 09:50:52.384525+00	2026-06-10 09:50:52.384525+00
30c4ba73-3325-401d-aec0-1c4388ecb2a0	a133c0c6-5c0e-43fd-bc17-f8a234272acb	kevin evanlone	\N	\N	2026-06-10 09:53:23.534663+00	2026-06-10 09:53:23.534663+00
a4dfc31a-8dec-4492-b08f-2e592785f124	8c398068-8879-4103-a677-814f137b8289	Violin Patrigia	\N	\N	2026-06-10 09:53:28.48756+00	2026-06-10 09:53:28.48756+00
642a26b4-593d-485f-b46a-c9f7d7f6346a	9ad88462-8f92-4291-a90b-805dba849619	blue flare fox	\N	\N	2026-06-10 09:53:55.243395+00	2026-06-10 09:53:55.243395+00
02f7a074-1957-487b-95f2-3b686fd00782	cd1f70bd-2086-4681-8437-b7c94c751791	Anglelika cd	\N	\N	2026-06-10 09:55:04.050332+00	2026-06-10 09:55:04.050332+00
98addc56-2026-4586-beb3-9668b46bdbfe	78d4dbc5-65e0-446b-94e0-c18983a7667e	Brayden To	\N	\N	2026-06-10 09:55:25.16315+00	2026-06-10 09:55:25.16315+00
c2ebbd81-6c8a-4a98-a3c9-9b3b197ff1ac	fefb7140-07ec-4264-b667-faf9be1cf5af	Bella	\N	\N	2026-06-10 09:55:41.497159+00	2026-06-10 09:55:41.497159+00
6efa3164-2750-43df-ad8e-31da12d4998e	b460f35e-b398-4275-b71a-cfee0ffbb683	audy sri hapsari 	\N	\N	2026-06-10 09:59:50.988821+00	2026-06-10 09:59:50.988821+00
898d1523-0b66-4358-a7a1-912fd36f4c4e	fbbcd506-dd25-4818-a9d3-83bc7ce032b1	Ovelia	\N	\N	2026-06-10 10:00:07.18743+00	2026-06-10 10:00:07.18743+00
b4378f2d-c7ae-411a-8c92-936ad81b2cb4	ff0b961d-76d2-46f7-a245-82a4761d00e6	Caroline	\N	\N	2026-06-10 10:00:50.988375+00	2026-06-10 10:00:50.988375+00
8d61e307-cf9d-4e5f-904e-9c39ee88211b	ed8b3b62-a4a1-4125-803d-af3312d3d642	Juanda Anggara	\N	\N	2026-06-10 10:05:30.684911+00	2026-06-10 10:05:30.684911+00
4a8f7cf8-876b-43ee-a0b0-79843eba75cf	a4161fa7-0657-4037-ba49-33cb3b02b9cc	Lielyani saputri louis	\N	\N	2026-06-10 10:07:31.089756+00	2026-06-10 10:07:31.089756+00
796eb4f9-4659-4ea1-8d03-f63dfd72afbf	d9ed441b-47a9-436d-bab9-4cb3e1499e18	Lielyana Saputri Louis	\N	\N	2026-06-10 10:09:31.661664+00	2026-06-10 10:09:31.661664+00
4ed24b9e-8e82-4da5-a36f-0fee664971b1	1238aed7-bb4f-4008-9ed9-c8db00aaaca1	Rian apriansha jayalie	\N	\N	2026-06-10 10:14:24.10335+00	2026-06-10 10:14:24.10335+00
ef831b99-b1d4-40a1-b73b-d8320b1093ee	793040a4-f4ed-4e82-99fc-8cb492ded4c1	Ferdy Danuarta 	\N	\N	2026-06-10 10:26:19.865547+00	2026-06-10 10:26:19.865547+00
9f7e0118-bf11-4b7a-aaae-9a1d953ca621	b18e30f5-1ba2-4697-a602-12b89d2473cd	Ferdy Danuarta 	\N	\N	2026-06-10 10:30:49.386159+00	2026-06-10 10:30:49.386159+00
13929d29-9078-4b44-bd44-cf6be19fee5d	10fcb99b-b830-4a2e-b35a-9979f9106c67	Desi Yulistiani	\N	\N	2026-06-10 11:01:30.278427+00	2026-06-10 11:01:30.278427+00
1e083731-448a-4acb-ba1a-7df241c38339	438671de-205c-4083-8610-cbf138757f36	Dyesty Salsazilla	\N	\N	2026-06-10 11:14:19.556207+00	2026-06-10 11:14:19.556207+00
1cf9a84d-dd61-4606-9479-14326a6b5d46	b1c35f5a-1ecb-46a4-904d-795a0029cc05	Andi Andi	\N	\N	2026-06-10 11:14:42.799914+00	2026-06-10 11:14:42.799914+00
4d2d874c-231b-4dde-b3c0-8602c9c6ee10	177b1fa3-0207-4b0a-9cac-450029fe8ac7	syarif fuddin	\N	\N	2026-06-10 11:21:09.552844+00	2026-06-10 11:21:09.552844+00
d3c203ce-4b42-46aa-ab4a-9d10e6e35eb8	8dd61c30-5521-431a-bebb-bbb676a73133	ilham	\N	\N	2026-06-10 11:28:05.966822+00	2026-06-10 11:28:05.966822+00
1c9feb4f-636f-48f3-a68b-85af4f6284e8	d49baa2e-a538-4ce8-90df-7135af799445	ilham	\N	\N	2026-06-10 11:35:53.610079+00	2026-06-10 11:35:53.610079+00
c98197ec-8e49-4cf6-9e6e-d29b86e1085d	ccaaf342-c293-485b-b064-7d9f2cd42b22	Jasper Imanuel	\N	\N	2026-06-10 11:36:30.158247+00	2026-06-10 11:36:30.158247+00
e8675e1b-da0b-4b16-aa0f-1b142e07899d	9a75328c-61d5-4768-85e5-9269775ca623	ilham	\N	\N	2026-06-10 11:37:26.588236+00	2026-06-10 11:37:26.588236+00
66a3a84c-51b1-4385-b38e-238d6cebb4fb	4086843e-872a-4a4b-8d3b-c332544ae077	Aandi Ssariputra	\N	\N	2026-06-10 11:52:40.780189+00	2026-06-10 11:52:40.780189+00
e04b16b4-c1f5-47d9-a22f-af8a7368d8e5	7a1ee006-f94b-463b-9d47-f99241469e24	Ladiva	\N	\N	2026-06-10 13:28:42.799804+00	2026-06-10 13:28:42.799804+00
fd011f58-094e-46c6-8bc6-eae308ae2c8a	b1d26638-7b8d-41ef-b98e-066637aea3f4	Armando Qiu	\N	\N	2026-06-10 13:50:10.9174+00	2026-06-10 13:50:10.9174+00
c8c8ebad-b5a6-40c3-a0d7-14596655ca7e	10510d96-7171-4b5a-8ca0-b7090f8d6f58	Armando Qiu	\N	\N	2026-06-10 13:52:18.611751+00	2026-06-10 13:52:18.611751+00
d1ec0d3b-77e8-447f-a64c-699aaf0af54a	d1e35067-6977-41c5-aeac-2d7b183dca75	alifah adilah	\N	\N	2026-06-10 18:55:54.289141+00	2026-06-10 18:55:54.289141+00
a7e303e8-5005-4ef6-8421-a877dddee5ee	fde7163c-0c71-4899-8fca-cefe928c121b	Alifah 	\N	\N	2026-06-10 18:58:39.414665+00	2026-06-10 18:58:39.414665+00
\.


--
-- Data for Name: settlements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.settlements (vendor_id, period_start, period_end, total_redemptions, admin_fee, net_amount, status, payout_date, bank_transfer_reference, id, created_at, updated_at, is_active) FROM stdin;
\.


--
-- Data for Name: stunting_risk_predictions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stunting_risk_predictions (id, created_at, updated_at, is_active, child_id, measurement_id, risk_score, risk_level, horizon_months, features, dominant_factors, model_version) FROM stdin;
6d38ad17-c322-44ad-ad9d-489392895944	2026-05-16 08:29:12.57247	2026-05-16 08:29:12.572475	t	387e42a2-85e6-41b5-b962-bf846afabb37	e7285d2f-fda5-4c79-9ef3-9bf213c4d402	0.9996	high	3	{"is_male": 0, "muac_cm": 0.0, "height_cm": 78.0, "weight_kg": 10.0, "age_months": 49, "fies_score": 7.0, "trend_score": 0.0, "delta_z_height": 0.0, "delta_z_weight": -1.64, "measurement_id": "e7285d2f-fda5-4c79-9ef3-9bf213c4d402", "z_score_height": -8.41, "z_score_weight": -2.84, "days_since_last": 56.0, "measurement_date": "2026-05-16"}	[{"name": "z_score_height", "label": "Z-score tinggi badan rendah", "value": -8.41, "direction": "risk", "contribution": 6.728}, {"name": "fies_score", "label": "Ketahanan pangan rumah tangga rendah", "value": 7.0, "direction": "risk", "contribution": 1.26}, {"name": "z_score_weight", "label": "Z-score berat badan rendah", "value": -2.84, "direction": "risk", "contribution": 1.136}]	logreg-v1
6569d7af-fd1c-441b-b6ca-e3a3e1877bb3	2026-05-18 14:26:19.102447	2026-05-18 14:26:19.108178	t	04b63762-8074-47b6-b443-6a097505cd26	28025031-b6a1-42d8-8686-fa18086cbade	1.0000	high	3	{"is_male": 0, "muac_cm": 0.0, "height_cm": 40.0, "weight_kg": 2.5, "age_months": 1, "fies_score": 7.0, "trend_score": 0.0, "delta_z_height": 0.0, "delta_z_weight": 0.0, "measurement_id": "28025031-b6a1-42d8-8686-fa18086cbade", "z_score_height": -7.21, "z_score_weight": -3.4, "days_since_last": 0.0, "measurement_date": "2026-05-18"}	[{"name": "z_score_height", "label": "Z-score tinggi badan rendah", "value": -7.21, "direction": "risk", "contribution": 31.5334}, {"name": "muac_cm", "label": "Lingkar lengan atas kecil", "value": 0.0, "direction": "risk", "contribution": 1.0043}, {"name": "fies_score", "label": "Ketahanan pangan rumah tangga rendah", "value": 7.0, "direction": "risk", "contribution": 0.787}]	logreg-v3-id-synthetic-calibrated
e5ad6ad2-bf2a-4ce7-b5c7-71eb1e17ea39	2026-05-18 14:26:59.440236	2026-05-18 14:26:59.440236	t	04b63762-8074-47b6-b443-6a097505cd26	28025031-b6a1-42d8-8686-fa18086cbade	1.0000	high	3	{"is_male": 0, "muac_cm": 0.0, "height_cm": 40.0, "weight_kg": 2.5, "age_months": 1, "fies_score": 7.0, "trend_score": 1.0, "delta_z_height": 2.63, "delta_z_weight": 1.0000000000000004, "measurement_id": "28025031-b6a1-42d8-8686-fa18086cbade", "z_score_height": -7.21, "z_score_weight": -3.4, "days_since_last": 14.0, "measurement_date": "2026-05-18"}	[{"name": "z_score_height", "label": "Z-score tinggi badan rendah", "value": -7.21, "direction": "risk", "contribution": 31.5334}, {"name": "delta_z_height", "label": "Tren Z-score tinggi membaik", "value": 2.63, "direction": "protective", "contribution": -10.7703}, {"name": "muac_cm", "label": "Lingkar lengan atas kecil", "value": 0.0, "direction": "risk", "contribution": 1.0043}]	logreg-v3-id-synthetic-calibrated
5b3570d0-9ab3-4e0a-95de-a79a56627258	2026-05-19 07:19:44.84099	2026-05-19 07:19:44.84099	t	04b63762-8074-47b6-b443-6a097505cd26	bc1ba190-6b87-4fe8-8cdf-d8899ae3dac0	0.0000	low	3	{"is_male": 0, "muac_cm": 0.0, "height_cm": 50.0, "weight_kg": 3.5, "age_months": 1, "fies_score": 7.0, "trend_score": 1.0, "delta_z_height": 5.26, "delta_z_weight": 2.0, "measurement_id": "bc1ba190-6b87-4fe8-8cdf-d8899ae3dac0", "z_score_height": -1.95, "z_score_weight": -1.4, "days_since_last": 1.0, "measurement_date": "2026-05-19"}	[{"name": "delta_z_height", "label": "Tren Z-score tinggi membaik", "value": 5.26, "direction": "protective", "contribution": -21.3506}, {"name": "z_score_height", "label": "Z-score tinggi badan rendah", "value": -1.95, "direction": "risk", "contribution": 2.4196}, {"name": "delta_z_weight", "label": "Z-score berat menurun", "value": 2.0, "direction": "risk", "contribution": 1.1075}]	logreg-v3-id-synthetic-calibrated
a7d6592d-567e-40b7-ab67-0c43b8e3ef85	2026-05-19 07:19:53.422506	2026-05-19 07:19:53.422506	t	04b63762-8074-47b6-b443-6a097505cd26	bc1ba190-6b87-4fe8-8cdf-d8899ae3dac0	0.6460	medium	3	{"is_male": 0, "muac_cm": 0.0, "height_cm": 50.0, "weight_kg": 3.5, "age_months": 1, "fies_score": 7.0, "trend_score": 0.0, "delta_z_height": 0.0, "delta_z_weight": 0.0, "measurement_id": "bc1ba190-6b87-4fe8-8cdf-d8899ae3dac0", "z_score_height": -1.95, "z_score_weight": -1.4, "days_since_last": 0.0, "measurement_date": "2026-05-19"}	[{"name": "z_score_height", "label": "Z-score tinggi badan rendah", "value": -1.95, "direction": "risk", "contribution": 2.4196}, {"name": "muac_cm", "label": "Lingkar lengan atas kecil", "value": 0.0, "direction": "risk", "contribution": 1.0043}, {"name": "fies_score", "label": "Ketahanan pangan rumah tangga rendah", "value": 7.0, "direction": "risk", "contribution": 0.787}]	logreg-v3-id-synthetic-calibrated
8562930d-bb11-4cee-b079-3c00e9ce7cd2	2026-05-19 07:19:55.406264	2026-05-19 07:19:55.406264	t	04b63762-8074-47b6-b443-6a097505cd26	bc1ba190-6b87-4fe8-8cdf-d8899ae3dac0	0.6460	medium	3	{"is_male": 0, "muac_cm": 0.0, "height_cm": 50.0, "weight_kg": 3.5, "age_months": 1, "fies_score": 7.0, "trend_score": 0.0, "delta_z_height": 0.0, "delta_z_weight": 0.0, "measurement_id": "bc1ba190-6b87-4fe8-8cdf-d8899ae3dac0", "z_score_height": -1.95, "z_score_weight": -1.4, "days_since_last": 0.0, "measurement_date": "2026-05-19"}	[{"name": "z_score_height", "label": "Z-score tinggi badan rendah", "value": -1.95, "direction": "risk", "contribution": 2.4196}, {"name": "muac_cm", "label": "Lingkar lengan atas kecil", "value": 0.0, "direction": "risk", "contribution": 1.0043}, {"name": "fies_score", "label": "Ketahanan pangan rumah tangga rendah", "value": 7.0, "direction": "risk", "contribution": 0.787}]	logreg-v3-id-synthetic-calibrated
42be9648-7189-488f-89fa-116058be9494	2026-05-19 07:20:06.716765	2026-05-19 07:20:06.716765	t	04b63762-8074-47b6-b443-6a097505cd26	bc1ba190-6b87-4fe8-8cdf-d8899ae3dac0	0.6460	medium	3	{"is_male": 0, "muac_cm": 0.0, "height_cm": 50.0, "weight_kg": 3.5, "age_months": 1, "fies_score": 7.0, "trend_score": 0.0, "delta_z_height": 0.0, "delta_z_weight": 0.0, "measurement_id": "bc1ba190-6b87-4fe8-8cdf-d8899ae3dac0", "z_score_height": -1.95, "z_score_weight": -1.4, "days_since_last": 0.0, "measurement_date": "2026-05-19"}	[{"name": "z_score_height", "label": "Z-score tinggi badan rendah", "value": -1.95, "direction": "risk", "contribution": 2.4196}, {"name": "muac_cm", "label": "Lingkar lengan atas kecil", "value": 0.0, "direction": "risk", "contribution": 1.0043}, {"name": "fies_score", "label": "Ketahanan pangan rumah tangga rendah", "value": 7.0, "direction": "risk", "contribution": 0.787}]	logreg-v3-id-synthetic-calibrated
5dc020b1-7a9c-4f39-b45a-d44e9bda87c8	2026-05-19 13:24:47.241031	2026-05-19 13:24:47.241042	t	387e42a2-85e6-41b5-b962-bf846afabb37	e7285d2f-fda5-4c79-9ef3-9bf213c4d402	1.0000	high	3	{"is_male": 0, "muac_cm": 0.0, "height_cm": 78.0, "weight_kg": 10.0, "age_months": 49, "fies_score": 7.0, "trend_score": 0.0, "delta_z_height": 0.0, "delta_z_weight": -1.64, "measurement_id": "e7285d2f-fda5-4c79-9ef3-9bf213c4d402", "z_score_height": -8.41, "z_score_weight": -2.84, "days_since_last": 56.0, "measurement_date": "2026-05-16"}	[{"name": "z_score_height", "label": "Z-score tinggi badan rendah", "value": -8.41, "direction": "risk", "contribution": 38.1753}, {"name": "muac_cm", "label": "Lingkar lengan atas kecil", "value": 0.0, "direction": "risk", "contribution": 1.0043}, {"name": "delta_z_weight", "label": "Tren Z-score berat membaik", "value": -1.64, "direction": "protective", "contribution": -0.8689}]	logreg-v3-id-synthetic-calibrated
26703030-7b0a-4e0d-8428-ff074850fe9a	2026-06-01 10:44:00.917622	2026-06-01 10:44:00.917622	t	387e42a2-85e6-41b5-b962-bf846afabb37	e7285d2f-fda5-4c79-9ef3-9bf213c4d402	1.0000	high	3	{"is_male": 0, "muac_cm": 0.0, "height_cm": 78.0, "weight_kg": 10.0, "age_months": 49, "fies_score": 7.0, "trend_score": 0.0, "delta_z_height": 0.0, "delta_z_weight": -1.64, "measurement_id": "e7285d2f-fda5-4c79-9ef3-9bf213c4d402", "z_score_height": -8.41, "z_score_weight": -2.84, "days_since_last": 56.0, "measurement_date": "2026-05-16"}	[{"name": "z_score_height", "label": "Z-score tinggi badan rendah", "value": -8.41, "direction": "risk", "contribution": 38.1753}, {"name": "muac_cm", "label": "Lingkar lengan atas kecil", "value": 0.0, "direction": "risk", "contribution": 1.0043}, {"name": "delta_z_weight", "label": "Tren Z-score berat membaik", "value": -1.64, "direction": "protective", "contribution": -0.8689}]	logreg-v3-id-synthetic-calibrated
6bf16d28-2878-43b5-9cc4-fb320bcd18d5	2026-06-10 04:35:06.221484	2026-06-10 04:35:06.221487	t	387e42a2-85e6-41b5-b962-bf846afabb37	2fe62acc-8f66-4fbd-aa02-289e31ace058	0.0000	low	3	{"is_male": 0, "muac_cm": 0.0, "height_cm": 119.3, "weight_kg": 12.0, "age_months": 50, "fies_score": 1.0, "trend_score": 1.0, "delta_z_height": 12.690000000000001, "delta_z_weight": 0.95, "measurement_id": "2fe62acc-8f66-4fbd-aa02-289e31ace058", "z_score_height": 4.28, "z_score_weight": -1.89, "days_since_last": 25.0, "measurement_date": "2026-06-10"}	[{"name": "delta_z_height", "label": "Tren Z-score tinggi membaik", "value": 12.69, "direction": "protective", "contribution": -51.2408}, {"name": "z_score_height", "label": "Z-score tinggi badan baik", "value": 4.28, "direction": "protective", "contribution": -32.063}, {"name": "muac_cm", "label": "Lingkar lengan atas kecil", "value": 0.0, "direction": "risk", "contribution": 1.0043}]	logreg-v3-id-synthetic-calibrated
\.


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscription_plans (name, description, price, currency, frequency, features, is_active, id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscriptions (donor_id, plan_id, plan_name, amount, currency, frequency, status, payment_method, next_billing_date, started_at, cancelled_at, paused_at, meta_data, id, created_at, updated_at, is_active) FROM stdin;
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	Custom Subscription	1000000.00	IDR	monthly	cancelled	qris	2026-06-04	2026-05-05 06:21:45.135884	2026-05-05 06:22:54.019491	\N	{"source_donation_id": "b384f9df-229c-4730-86a4-59a800fb3076", "plan_reference": "balita", "auto_created": true}	0de717b0-dd05-4f7c-9c32-bec338268b88	2026-05-05 06:21:45.137443	2026-05-05 06:22:54.257667	t
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	Custom Subscription	300000.00	IDR	monthly	paused	bank_transfer	2026-07-04	2026-05-05 06:14:57.473121	\N	2026-06-06 17:22:27.572431	{"source_donation_id": "269f952e-596d-43cc-9da1-977b51ed84cb", "plan_reference": "balita", "auto_created": true}	8bd0c9af-49b3-42a6-84ec-79b6a3afae79	2026-05-05 06:14:57.47801	2026-06-06 17:22:27.573438	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	500000.00	IDR	monthly	active	qris	2026-07-18	2026-05-19 08:58:04.20216	\N	\N	{"source_donation_id": "a6ad43c5-1533-47f2-8bbb-58f19e28cda5", "plan_reference": "1000hpk", "auto_created": true}	3502e3bb-0f2d-4c52-81bc-8ec444d1bb4a	2026-05-19 08:58:04.216567	2026-06-18 09:00:06.897788	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	500000.00	IDR	monthly	active	qris	2026-07-18	2026-05-19 09:00:14.129721	\N	\N	{"source_donation_id": "9dea60c0-a948-41de-be5b-91bdcb308fa0", "plan_reference": "1000hpk", "auto_created": true}	de5cf0e4-9fb7-4bec-ad4b-856c832c088b	2026-05-19 09:00:14.13048	2026-06-18 09:00:13.921693	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	500000.00	IDR	monthly	active	qris	2026-07-18	2026-05-19 09:00:27.433176	\N	\N	{"source_donation_id": "dda2a3f1-b22f-4df9-8110-3e18c9985bd7", "plan_reference": "1000hpk", "auto_created": true}	07e6ea4a-154a-40db-883e-84fd2aba5020	2026-05-19 09:00:27.433977	2026-06-18 09:00:20.450698	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	500000.00	IDR	monthly	active	qris	2026-07-18	2026-05-19 09:00:30.672856	\N	\N	{"source_donation_id": "30e9f3dd-76cc-49f7-88c8-a9ef1490ce9f", "plan_reference": "1000hpk", "auto_created": true}	2a5d374f-5282-4bba-971f-45db94bf1143	2026-05-19 09:00:30.673577	2026-06-18 09:00:28.004647	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	500000.00	IDR	monthly	active	qris	2026-07-18	2026-05-19 09:01:01.431767	\N	\N	{"source_donation_id": "ce89139c-34f6-47a0-94ff-9671c709f6d0", "plan_reference": "1000hpk", "auto_created": true}	b3e7595f-26fc-422f-9fa0-725398fd4412	2026-05-19 09:01:01.432787	2026-06-18 09:00:35.595031	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	300000.00	IDR	monthly	active	qris	2026-07-18	2026-05-19 09:02:57.565253	\N	\N	{"source_donation_id": "0715571b-08dc-448f-91bd-4bf68c3ca626", "plan_reference": "balita", "auto_created": true}	9d830579-32b7-4b55-a302-2f1ad8fc9f15	2026-05-19 09:02:57.567124	2026-06-18 09:00:43.008475	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	300000.00	IDR	monthly	active	qris	2026-07-18	2026-05-19 09:04:01.019425	\N	\N	{"source_donation_id": "5af3ff21-9117-4dfe-a529-513ba3f283c9", "plan_reference": "balita", "auto_created": true}	ba5eabb8-10de-41a3-984d-5de77629ebc1	2026-05-19 09:04:01.020219	2026-06-18 09:00:50.41466	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	300000.00	IDR	monthly	active	qris	2026-07-18	2026-05-19 09:12:22.303472	\N	\N	{"source_donation_id": "ebcbd77f-d522-4821-acf0-17fbb632e7f6", "plan_reference": "balita", "auto_created": true}	aed4e1fd-40c5-4dc7-ba6d-d67e419a7c52	2026-05-19 09:12:22.304208	2026-06-18 09:00:57.88255	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	300000.00	IDR	monthly	active	qris	2026-07-18	2026-05-19 09:12:24.779388	\N	\N	{"source_donation_id": "fefff3f3-b57d-43f0-9103-d35c5b6c97ba", "plan_reference": "balita", "auto_created": true}	fc1cabad-586b-49e2-96b2-295cff8ffe72	2026-05-19 09:12:24.780002	2026-06-18 09:01:05.385853	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	300000.00	IDR	monthly	active	qris	2026-07-18	2026-05-19 09:12:27.260024	\N	\N	{"source_donation_id": "2ecb3342-f873-49f0-9710-00d328de112c", "plan_reference": "balita", "auto_created": true}	802458a5-e416-45b8-8c2b-0503daff7ffc	2026-05-19 09:12:27.260758	2026-06-18 09:01:12.987095	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	500000.00	IDR	monthly	active	qris	2026-07-21	2026-04-22 04:18:52.277142	\N	\N	{"source_donation_id": "0ce571f3-fe8e-46b6-917f-64c3f71b5f75", "plan_reference": "1000hpk", "auto_created": true}	a7653005-5392-484e-a773-a39aba74da61	2026-04-22 04:18:52.279252	2026-06-21 09:00:07.124774	t
f3ada4b1-2bba-4155-bb2e-5cee4b791390	\N	Custom Subscription	500000.00	IDR	monthly	active	qris	2026-07-26	2026-04-27 13:48:51.364453	\N	\N	{"source_donation_id": "32a0183f-a55b-4d5b-92c8-2487403f5dc6", "plan_reference": "balita", "auto_created": true}	85735449-e8aa-4eeb-a7fd-8c927af71b9b	2026-04-27 13:48:51.368193	2026-06-26 09:00:04.989746	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	300000.00	IDR	monthly	active	qris	2026-08-03	2026-05-05 00:48:39.206945	\N	\N	{"source_donation_id": "aa5a8d93-d5dc-45a7-afef-5834e144a51a", "plan_reference": "balita", "auto_created": true}	bc8c0c7b-e7e5-472b-a3d9-b234afdd2af9	2026-05-05 00:48:39.209338	2026-07-04 09:00:03.693529	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	300000.00	IDR	monthly	active	qris	2026-08-03	2026-05-05 00:56:40.617653	\N	\N	{"source_donation_id": "a2261e9f-0d3d-43eb-8b8a-746332bc433e", "plan_reference": "balita", "auto_created": true}	97c6a42c-1419-4245-897c-3fde9b923cc6	2026-05-05 00:56:40.618291	2026-07-04 09:00:07.29356	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	300000.00	IDR	monthly	active	qris	2026-08-03	2026-05-05 00:58:34.747615	\N	\N	{"source_donation_id": "5b8eac2f-b81c-4c1c-979f-c737bec15fa4", "plan_reference": "balita", "auto_created": true}	76a45b07-cf7a-497a-bf00-3d2a870bebcc	2026-05-05 00:58:34.748359	2026-07-04 09:00:10.866436	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	300000.00	IDR	monthly	active	bank_transfer	2026-08-03	2026-05-05 00:59:11.002697	\N	\N	{"source_donation_id": "5ef7fd94-2dc1-42f3-ad20-ca9098dbcd3b", "plan_reference": "balita", "auto_created": true}	3027205a-aa04-4e8e-930c-8da96147c8a9	2026-05-05 00:59:11.003528	2026-07-04 09:00:14.438298	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	300000.00	IDR	monthly	active	bank_transfer	2026-08-03	2026-05-05 01:01:04.944375	\N	\N	{"source_donation_id": "a144df2e-4702-4ca3-a7f2-7df3b4735cba", "plan_reference": "balita", "auto_created": true}	5af23431-9769-4e3a-8f39-94bdd13b7d67	2026-05-05 01:01:04.945211	2026-07-04 09:00:18.010067	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	499998.00	IDR	monthly	active	qris	2026-08-03	2026-05-05 01:01:37.898112	\N	\N	{"source_donation_id": "349b70da-c31f-423b-8a68-bd5c9b41d721", "plan_reference": "1000hpk", "auto_created": true}	a7e8f381-386d-4cb5-a41c-842cd262f45d	2026-05-05 01:01:37.899036	2026-07-04 09:00:21.581524	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	300000.00	IDR	monthly	active	qris	2026-08-03	2026-05-05 01:05:14.159288	\N	\N	{"source_donation_id": "bd75ffb1-2496-4131-b95e-c2080114cf61", "plan_reference": "balita", "auto_created": true}	92641fdd-bb10-4282-a6e5-69a70309eb7b	2026-05-05 01:05:14.16142	2026-07-04 09:00:25.153422	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	300000.00	IDR	monthly	active	qris	2026-08-03	2026-05-05 01:13:00.574897	\N	\N	{"source_donation_id": "d40d8c70-55c7-45cc-8dad-ffb52e47dd3a", "plan_reference": "balita", "auto_created": true}	ded4d128-3ecf-41fb-aa03-cb1ecc32e982	2026-05-05 01:13:00.57749	2026-07-04 09:00:28.723528	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	500000.00	IDR	monthly	active	qris	2026-08-03	2026-05-05 01:21:14.859537	\N	\N	{"source_donation_id": "9f3b02e4-442f-44a7-910e-8cde0638e9c2", "plan_reference": "1000hpk", "auto_created": true}	085581c9-4a52-4957-8669-d7593bf3b7c9	2026-05-05 01:21:14.860339	2026-07-04 09:00:32.294201	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	500000.00	IDR	monthly	active	qris	2026-08-03	2026-05-05 01:25:38.542011	\N	\N	{"source_donation_id": "4bfb7829-c282-4bc5-bf9a-95fde3610a00", "plan_reference": "1000hpk", "auto_created": true}	9ebd2580-a901-4197-a9ca-edf1cf3a0436	2026-05-05 01:25:38.549966	2026-07-04 09:00:35.866819	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	300000.00	IDR	monthly	active	qris	2026-08-03	2026-05-05 01:31:55.535478	\N	\N	{"source_donation_id": "1e11adc0-84b8-4d40-af8f-8adc3b2d9aae", "plan_reference": "balita", "auto_created": true}	dd60637b-a81f-4e65-9578-369710e12077	2026-05-05 01:31:55.536292	2026-07-04 09:00:39.724879	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	500000.00	IDR	monthly	active	qris	2026-08-03	2026-05-05 07:36:05.21758	\N	\N	{"source_donation_id": "d6a01f08-6c26-4508-88c0-fa8f7732e0dd", "plan_reference": "1000hpk", "auto_created": true}	5d73d74f-8f68-4f09-b14a-2ae97009eca4	2026-05-05 07:36:05.220278	2026-07-04 09:00:43.295932	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	500000.00	IDR	monthly	active	qris	2026-08-03	2026-05-05 07:36:37.59352	\N	\N	{"source_donation_id": "8ac6def6-0242-4063-8fd3-e20efcca2252", "plan_reference": "1000hpk", "auto_created": true}	1b4e3bb8-42e5-4d44-aa9c-bc8f83c34b91	2026-05-05 07:36:37.594349	2026-07-04 09:00:46.865817	t
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	Custom Subscription	500000.00	IDR	monthly	active	midtrans	2026-08-06	2026-06-06 16:24:52.95514	\N	\N	{"source_donation_id": "9e22a695-83c8-4579-ad27-aeaf6a0e8d90", "plan_reference": "balita", "auto_created": true}	e462fadf-ac63-4560-92ed-5f5e330b60fb	2026-06-06 16:24:52.95614	2026-07-07 09:00:04.512461	t
357bd5bf-909d-4317-83a5-556c926ed56a	\N	Custom Subscription	300000.00	IDR	monthly	active	midtrans	2026-08-09	2026-06-10 09:21:31.174081	\N	\N	{"source_donation_id": "a72984a6-cb6c-4a5b-9451-3b48e4391383", "plan_reference": "balita", "auto_created": true}	79e70f47-dd49-423a-a399-a2829d9c0f78	2026-06-10 09:21:31.175236	2026-07-10 09:00:03.667824	t
8dd61c30-5521-431a-bebb-bbb676a73133	\N	Custom Subscription	300000.00	IDR	monthly	active	midtrans	2026-08-09	2026-06-10 11:28:48.521116	\N	\N	{"source_donation_id": "5800ab2b-21a8-4618-9d37-d95cab9cfd52", "plan_reference": "balita", "auto_created": true}	57ebfb4c-a248-4255-9256-5018b0948ac7	2026-06-10 11:28:48.521639	2026-07-10 09:00:07.296431	t
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	Custom Subscription	400000.00	IDR	monthly	paused	qris	2026-07-06	2026-06-06 15:59:42.468816	\N	2026-06-06 17:22:19.112165	{"source_donation_id": "f840837b-e665-4e89-8526-9cd415968964", "plan_reference": "balita", "auto_created": true}	4e943256-6531-43e1-9f53-71d8906e069b	2026-06-06 15:59:42.472183	2026-06-06 17:22:19.115402	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	300000.00	IDR	monthly	active	qris	2026-07-18	2026-05-19 10:44:29.069204	\N	\N	{"source_donation_id": "ffe5c004-bed7-4d8d-b13d-70002279d191", "plan_reference": "balita", "auto_created": true}	704dde7e-f48f-446b-8080-faf06f62ea65	2026-05-19 10:44:29.070517	2026-06-18 09:01:20.419604	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	300000.00	IDR	monthly	active	qris	2026-07-18	2026-05-19 10:47:57.222681	\N	\N	{"source_donation_id": "5eee11b1-cfa3-4fbe-88d1-b16343820a63", "plan_reference": "balita", "auto_created": true}	763d75bf-7421-4e0c-8f90-f2f4749ccfaa	2026-05-19 10:47:57.223511	2026-06-18 09:01:27.831029	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	300000.00	IDR	monthly	active	qris	2026-07-18	2026-05-19 13:20:35.620877	\N	\N	{"source_donation_id": "8d77e4b5-6d0b-4b31-813c-b84458c7d959", "plan_reference": "balita", "auto_created": true}	0e901aea-4350-4a65-825d-02b3e75b2873	2026-05-19 13:20:35.642064	2026-06-18 09:01:35.334679	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	300000.00	IDR	monthly	active	qris	2026-07-18	2026-05-19 13:20:59.780849	\N	\N	{"source_donation_id": "b561a692-010d-4b7c-bacc-4afda3479df6", "plan_reference": "balita", "auto_created": true}	06b1bcac-0d29-4fe5-b021-00d31bbff5e5	2026-05-19 13:20:59.782617	2026-06-18 09:01:42.840281	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	1000000.00	IDR	monthly	active	qris	2026-07-21	2026-04-22 03:12:44.978323	\N	\N	{"source_donation_id": "7cd126ff-5212-4670-a727-8b1027c8c396", "plan_reference": "1000hpk", "auto_created": true}	1ec37dff-47be-4fb9-82c7-689e70e1a060	2026-04-22 03:12:44.982156	2026-06-21 09:00:14.19306	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	\N	Custom Subscription	500000.00	IDR	monthly	active	qris	2026-07-24	2026-05-25 18:18:59.27997	\N	\N	{"source_donation_id": "3257f1cb-c4c1-4400-bd56-8eaf08b9dd83", "plan_reference": "balita", "auto_created": true, "amount_updated_at": "2026-06-10T01:01:11.144817"}	14750bb4-e68a-4ba4-89e6-4b0ae4d31e72	2026-05-25 18:18:59.28141	2026-06-24 09:00:06.926153	t
f1177ee0-66c6-4167-923c-aeb1824d3c34	\N	Custom Subscription	200000.00	IDR	monthly	active	qris	2026-08-01	2026-05-03 10:04:01.457464	\N	\N	{"source_donation_id": "06f005a4-1a6a-4fa2-ae36-8cda724e9653", "plan_reference": "balita", "auto_created": true, "amount_updated_at": "2026-06-06T17:22:52.832631"}	8aca0664-8451-4061-9b26-8a6056440a8f	2026-05-03 10:04:01.462478	2026-07-02 09:00:04.641608	t
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_profiles (user_id, full_name, nik, phone, address, date_of_birth, gender, avatar_url, id, created_at, updated_at, is_active) FROM stdin;
00000000-0000-0000-0000-000000000002	Penerima Demo	\N	\N	\N	\N	\N	\N	7c6479e6-11ee-4923-8e0e-bc2aef16f852	2026-04-18 04:52:48.053216	2026-04-18 04:52:48.053223	t
10fcb99b-b830-4a2e-b35a-9979f9106c67	Desi Yulistiani	\N	\N	\N	\N	\N	\N	d71dfa12-e767-49e4-94bd-2425628f8616	2026-06-10 11:01:33.349317	2026-06-10 11:01:33.349321	t
00000000-0000-0000-0000-000000000001	Donor Demo	\N	\N	\N	\N	male	\N	463933b7-0a36-4320-be33-6e6223c21cee	2026-04-18 04:53:31.396376	2026-04-18 05:00:33.177486	t
d68b8ec6-00cb-4672-aa5f-604bac0c86a1	Penerima1	\N	\N	\N	\N	\N	\N	5b6cbdfd-39f2-4bd4-bd7c-960ab7f46c93	2026-04-18 06:00:28.83498	2026-04-18 06:00:28.834985	t
ee4f68ab-cc12-45f8-92b6-3c1f7422aff6	Penerima1	\N	\N	\N	\N	\N	\N	0c32e0f6-cf30-4455-be65-e7ec09924488	2026-04-18 06:26:02.454355	2026-04-18 06:26:02.454361	t
10000000-0000-0000-0000-000000000001	Donor E2E	\N	081200000001	Jakarta	\N	female	\N	5cef2c99-aec8-4dbe-a055-ad479f887306	2026-04-18 07:28:46.625946	2026-04-18 07:28:46.625953	t
20000000-0000-0000-0000-000000000001	Penerima E2E	\N	082200000001	Bandung	\N	female	\N	59b17aa1-ccf6-4a97-a0bc-3eb0c0c19dec	2026-04-18 07:28:46.62597	2026-04-18 07:28:46.625973	t
30000000-0000-0000-0000-000000000001	Vendor A E2E	\N	083300000001	Bandung	\N	male	\N	f26c2b05-a5f2-4987-91bd-36b84ee88656	2026-04-18 07:28:46.625984	2026-04-18 07:28:46.625987	t
30000000-0000-0000-0000-000000000002	Vendor B E2E	\N	083300000002	Bandung	\N	female	\N	b029a90e-5429-47cf-a323-d1c5d35db830	2026-04-18 07:28:46.625998	2026-04-18 07:28:46.626	t
3293b8aa-335d-4228-9e49-edc1aa133f6e	vendor1	\N	\N	\N	\N	\N	\N	81aaade1-5ddf-4412-a83c-7c2b7a0a4788	2026-04-19 13:51:06.178145	2026-04-19 13:51:06.17815	t
f383af29-b1ef-431b-bb30-7f8d8c9f18a8	foto faruq	\N	\N	\N	\N	\N	\N	0456d9ef-2601-4df3-8561-5baea04592d6	2026-04-19 14:18:55.423797	2026-04-19 14:18:55.423803	t
52fae754-5e5d-41c9-9817-5c952533bd84	Donatur1	\N	\N	\N	\N	\N	\N	9343ea0b-9b3a-47b1-a2ac-8a39ddef39a9	2026-04-20 01:53:59.194195	2026-04-20 01:53:59.194203	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	Ani Wijaya	\N	082345678901	Jl. Thamrin No. 45, Jakarta	\N	\N	\N	3971c4d2-8271-4233-a253-e1d7fed4cedf	2026-04-20 15:21:43.770149	2026-04-20 15:21:43.770156	t
88975b2b-ba37-4178-92db-235e6d9f0ff0	Pak Tarno	\N	083456789012	Jl. Gatot Subroto No. 67, Jakarta	\N	\N	\N	047ef592-7b6e-478a-9834-6c45dc708678	2026-04-20 15:21:43.979583	2026-04-20 15:21:43.979607	t
642a6f09-0362-449f-aa96-af1c02bcc955	Donatur2	\N	\N	\N	\N	\N	\N	4b4e5e87-d774-4df3-9096-0a3866868792	2026-04-22 00:20:48.115559	2026-04-22 00:20:48.115564	t
ae19f5a1-35f1-413c-af42-c7001ee9492f	Donatur3	\N	\N	\N	\N	\N	\N	10912b85-8a6d-43b5-ab2a-7a8beded7eaa	2026-04-22 00:38:57.708362	2026-04-22 00:38:57.708369	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	Penerima01	\N	\N	\N	\N	\N	\N	5f4205a4-c5ee-446b-a13a-49dfb97b3db4	2026-04-27 13:47:22.567389	2026-04-27 13:47:22.567389	t
f3ada4b1-2bba-4155-bb2e-5cee4b791390	Devin Suryadi	\N	\N	\N	\N	\N	\N	bc24f6b0-3ef3-43dd-9186-7f84f4dd4e02	2026-04-27 13:48:10.280249	2026-04-27 13:48:10.280249	t
796ed162-2338-4ce8-b57d-6abea2a1f503	Admin	\N	\N	\N	\N	\N	\N	e8f2ba19-e4d6-483f-a0a4-ccf3f267c38c	2026-04-28 16:29:13.809671	2026-04-28 16:29:13.809671	t
f1177ee0-66c6-4167-923c-aeb1824d3c34	Donatur01	\N	08224564485945	\N	\N	\N	\N	d9777376-17f8-4f24-a49e-f1b7036977ab	2026-05-03 09:57:46.707979	2026-05-03 09:57:46.707979	t
706ffe8f-d51e-4a2f-924f-8180d76dc558	vendor01	\N	\N	\N	\N	\N	\N	2cd5cbb1-47f9-4dfe-8bd2-6d0627ad6967	2026-05-04 17:32:55.113831	2026-05-04 17:32:55.113831	t
b4a06baa-2cf5-4817-9dfe-73cb4506a674	Achmad Faruq	\N	\N	\N	\N	\N	\N	f747a651-eced-4ef0-af8d-6b3195967341	2026-05-09 16:02:57.139416	2026-05-09 16:02:57.139423	t
319688e1-ad41-4c83-a381-a8a700681e3d	Devin	\N	086534569851	ya	\N	\N	\N	6c0ba027-3bfc-44d1-ab03-8f6707c387e8	2026-05-19 08:49:05.598675	2026-05-19 08:49:05.598677	t
e848d29b-a53b-4cde-86cc-c6712dadce20	Siti Rahma	\N	081223344556	Jl. Kebon Kacang No. 10, Jakarta	\N	\N	\N	22a73b16-ba0e-41bd-aa63-5858b4e2c36b	2026-05-26 01:36:47.300965	2026-05-26 01:36:47.300971	t
c5a8b3e9-5677-4577-aabc-a25446f0ae61	Bapak Anton	\N	082334455667	Jl. Tanah Abang No. 15, Jakarta	\N	\N	\N	c6f86af1-866c-4e01-b5f5-f3edf5cd5d1b	2026-05-26 01:36:47.43102	2026-05-26 01:36:47.431026	t
6d6e430d-7a02-4b3e-b563-2b15dfe4a7cb	Ibu Kartini	\N	083445566778	Pasar Senen Blok A	\N	\N	\N	6ad17f91-28b1-4513-9210-64f48895b2e4	2026-05-26 01:36:47.645309	2026-05-26 01:36:47.645316	t
46f6f92d-39d9-4712-a2b8-73dd74ec44b6	hana muthia	\N	\N	\N	\N	\N	\N	ae428adf-51d5-4772-8c3b-4f49ae4c95eb	2026-06-10 04:20:18.842642	2026-06-10 04:20:18.842646	t
fe740ebf-30f7-4fe7-a1b8-5757f8113719	Kotali	\N	082269717711	KONI 1	\N	\N	\N	12c5d85b-bf04-4035-ae9f-6b8a72d1c1e7	2026-06-10 09:17:46.828367	2026-06-10 09:17:46.828371	t
80d7d392-e7b5-4f75-8ff2-baa2ad3c8e48	Valencia Anjelina	\N	\N	\N	\N	\N	\N	96ab612b-05e4-4bfe-ba7c-10963554b22f	2026-06-10 09:18:19.088666	2026-06-10 09:18:19.088671	t
357bd5bf-909d-4317-83a5-556c926ed56a	Devita	\N	085266689551	Jambi	\N	\N	\N	fa71190b-5e6e-4b52-a6e6-dba6f43b5325	2026-06-10 09:20:19.971155	2026-06-10 09:20:19.971159	t
d50ed1f1-04be-4b0e-9b8c-16ddfd4606ce	Kotali	\N	\N	\N	\N	\N	\N	6f2736a1-ff17-4f3f-8ba0-4d677a258a32	2026-06-10 09:22:21.898251	2026-06-10 09:22:21.898257	t
c99d71f2-8702-46a0-baf8-c775787f31fa	Antoni Lim	\N	089504024715	Thehok jambi , jambi selatan.	\N	\N	\N	a629a1d4-f58e-41cc-977f-e6a5fbc1449d	2026-06-10 09:22:34.813459	2026-06-10 09:22:34.813464	t
0aa32472-f539-4888-ab3f-db23cb4e5743	Candra 	\N	\N	\N	\N	\N	\N	622f1e75-c86b-474e-81ce-a18a3adc3b8f	2026-06-10 09:23:57.650341	2026-06-10 09:23:57.650346	t
0419ba30-33ce-40c0-bd61-31cfc233a271	Virly	\N	082184636475	\N	\N	\N	\N	45f2d86c-3d93-4145-9baa-297cde2f6e31	2026-06-10 09:25:07.596679	2026-06-10 09:25:07.596682	t
b095701a-f443-489d-a0c6-4a3a15ee9bdb	Alicia	\N	085891556089	\N	\N	\N	\N	7645e503-d6e4-43df-a549-9d15253ff6f5	2026-06-10 09:26:48.576103	2026-06-10 09:26:48.576107	t
82147428-e16e-4ed8-9f62-bd5353a1b288	Edbert Jonathan Lay	\N	\N	\N	\N	\N	\N	b2354c1b-5978-4d72-93d0-c031cee24389	2026-06-10 09:29:14.463825	2026-06-10 09:29:14.463829	t
1018fa47-9476-4f11-b249-b064eb297dec	Jason Lie	\N	\N	\N	\N	\N	\N	be57386f-ba98-4983-b630-dbc147383f7d	2026-06-10 09:38:45.83662	2026-06-10 09:38:45.836624	t
3d77e2fc-dd8e-4c33-bb51-b0202d3d82ee	Brenda Aouren Tamia	\N	085161615751	Jl. darma 2 rt 32 kota jambi	\N	\N	\N	994e4747-97c8-4b39-a117-b71c76edf570	2026-06-10 09:41:57.783407	2026-06-10 09:41:57.783411	t
5d964e27-02d2-483d-b3f9-e0561ef621a9	Laurensa Andi	\N	\N	\N	\N	\N	\N	dae542d0-7984-40b6-b508-f98cf1357997	2026-06-10 09:46:42.747769	2026-06-10 09:46:42.747773	t
337efcff-35ee-4a55-ac77-2995542022ae	Agnes Monica	\N	089652099766	jambi	\N	\N	\N	1ea2fefc-e8ef-4fba-b450-ef4d6ecfd067	2026-06-10 09:48:38.857761	2026-06-10 09:48:38.857764	t
a133c0c6-5c0e-43fd-bc17-f8a234272acb	kevin evanlone	\N	\N	\N	\N	\N	\N	ca453cf1-3c4e-49c2-892c-3756a65f78c7	2026-06-10 09:53:25.290749	2026-06-10 09:53:25.290753	t
8c398068-8879-4103-a677-814f137b8289	Violin Patrigia	\N	0895620032921	jln kol pol	\N	\N	\N	e3af30d1-5342-40f7-b754-91f56e30337f	2026-06-10 09:53:30.252276	2026-06-10 09:53:30.25228	t
78d4dbc5-65e0-446b-94e0-c18983a7667e	Brayden To	\N	082175428845	\N	\N	\N	\N	7231b3ad-7c9c-41a1-acd7-05107d9735c3	2026-06-10 09:55:26.40967	2026-06-10 09:55:26.409674	t
fefb7140-07ec-4264-b667-faf9be1cf5af	Bella	\N	087733208289	Jambi	\N	\N	\N	4b6773a6-9083-4bd3-9106-9aa0f5e90e12	2026-06-10 09:55:43.663181	2026-06-10 09:55:43.663184	t
b460f35e-b398-4275-b71a-cfee0ffbb683	audy sri hapsari 	\N	\N	\N	\N	\N	\N	3b00458d-98ec-4c91-b055-40179b4dc358	2026-06-10 09:59:52.852815	2026-06-10 09:59:52.85282	t
fbbcd506-dd25-4818-a9d3-83bc7ce032b1	Ovelia	\N	0887437573208	\N	\N	\N	\N	47e3abaf-e156-47fa-95b1-7d28db56c651	2026-06-10 10:00:10.017819	2026-06-10 10:00:10.017823	t
ff0b961d-76d2-46f7-a245-82a4761d00e6	Caroline	\N	\N	\N	\N	\N	\N	c1a1b243-b470-4298-b8bb-799ff10d344d	2026-06-10 10:00:52.705521	2026-06-10 10:00:52.705524	t
ed8b3b62-a4a1-4125-803d-af3312d3d642	Juanda Anggara	\N	082213100524	Kota jambi	\N	\N	\N	a1c04764-8265-4265-a9d6-c811a9c95199	2026-06-10 10:05:32.60191	2026-06-10 10:05:32.601914	t
a4161fa7-0657-4037-ba49-33cb3b02b9cc	Lielyani saputri louis	\N	\N	\N	\N	\N	\N	e14dd4ef-9859-4e72-b1ad-fad77f213374	2026-06-10 10:07:32.390725	2026-06-10 10:07:32.39073	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	Ferdy Danuarta 	\N	088276208297	Jl.barau-barau 1	\N	\N	\N	c9e005a9-dc3a-4a73-9af7-002e15cdf5f8	2026-06-10 10:26:22.808669	2026-06-10 10:26:22.808673	t
b18e30f5-1ba2-4697-a602-12b89d2473cd	Ferdy Danuarta 	\N	088276208297	Jl.barau-barau 1	\N	\N	\N	0ef4b804-5396-4db5-8efe-3b0ee03bff6b	2026-06-10 10:30:50.212446	2026-06-10 10:30:50.21245	t
438671de-205c-4083-8610-cbf138757f36	Dyesty Salsazilla	\N	083846143551	\N	\N	\N	\N	f18d1563-9931-4647-9763-0f01a3343104	2026-06-10 11:14:21.472713	2026-06-10 11:14:21.472717	t
8dd61c30-5521-431a-bebb-bbb676a73133	ilham	\N	082180713368	Jambi	\N	\N	\N	543a59ca-0e28-49b5-a15b-acd92d45e8c1	2026-06-10 11:28:09.123397	2026-06-10 11:28:09.123401	t
d49baa2e-a538-4ce8-90df-7135af799445	ilham	\N	081111111111	jambi	\N	\N	\N	721b0c67-e2f5-4d02-930a-e24183046caa	2026-06-10 11:35:54.399619	2026-06-10 11:35:54.399623	t
ccaaf342-c293-485b-b064-7d9f2cd42b22	Jasper Imanuel	\N	08521036321	-	\N	\N	\N	359762de-2774-4afa-8afa-44db0cdd83ef	2026-06-10 11:36:31.342862	2026-06-10 11:36:31.342866	t
9a75328c-61d5-4768-85e5-9269775ca623	ilham	\N	08222222222	jambi	\N	\N	\N	4d75504b-2e15-4e5a-b907-0ed222a9653f	2026-06-10 11:37:27.393856	2026-06-10 11:37:27.39386	t
8f567802-a7ad-4f4f-8534-bdc036b09b97	Kimberly Aureva Johannes	\N	082114529853	\N	\N	\N	\N	f9436561-e90a-4efa-bf54-b6f7e9c47aee	2026-06-10 12:32:56.312634	2026-06-10 12:32:56.312637	t
7a1ee006-f94b-463b-9d47-f99241469e24	Ladiva	\N	081311808604	\N	\N	\N	\N	68983356-b113-495d-ac52-023560fe8b08	2026-06-10 13:28:45.068787	2026-06-10 13:28:45.068791	t
10510d96-7171-4b5a-8ca0-b7090f8d6f58	Armando Qiu	\N	085268021972	\N	\N	\N	\N	00731455-e7a8-43cf-a6f6-afed6baa9e9f	2026-06-10 13:52:19.896646	2026-06-10 13:52:19.89665	t
fde7163c-0c71-4899-8fca-cefe928c121b	Alifah 	\N	\N	\N	\N	\N	\N	17ca3e60-4f18-4a20-a07f-3010cbcd7329	2026-06-10 18:58:43.155307	2026-06-10 18:58:43.15531	t
0ea01ac1-723f-484c-b2ca-fcf69a554b37	Budi Santoso	\N	081234567890	Jl. Sudirman No. 123, Jakarta	1987-06-11	\N	\N	5a00860d-6592-4bc4-a0e5-9f816f0ed208	2026-04-20 15:21:43.6217	2026-06-16 05:14:09.027058	t
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (id, user_id, role, created_at) FROM stdin;
\.


--
-- Data for Name: vendor_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendor_profiles (user_id, store_name, store_address, store_phone, bank_name, bank_account_number, bank_account_holder, settlement_status, approval_status, id, created_at, updated_at, is_active, wallet_balance, store_image_url, operating_hours, rating, total_transactions) FROM stdin;
30000000-0000-0000-0000-000000000001	Warung Sehat A	Jl. Sehat No. 10 Bandung	083300000001	BCA	1111111111	Vendor A E2E	active	approved	4ac23645-d967-4023-9d5c-2b722b77285d	2026-04-18 07:28:46.915749	2026-04-18 07:28:46.915755	t	\N	\N	\N	\N	\N
30000000-0000-0000-0000-000000000002	Toko Gizi B	Jl. Gizi No. 21 Bandung	083300000002	Mandiri	2222222222	Vendor B E2E	active	approved	ceaeda1d-7b88-4fbd-9dfd-c5d5c0c3ab5f	2026-04-18 07:28:46.915766	2026-04-18 07:28:46.915769	t	\N	\N	\N	\N	\N
3293b8aa-335d-4228-9e49-edc1aa133f6e	vendor1		\N	\N	\N	\N	active	approved	0500fbf5-81c1-4c53-bfca-1ffaa5fa831f	2026-04-19 13:51:06.208763	2026-04-28 16:45:37.372699	t	0.00	\N	\N	\N	\N
88975b2b-ba37-4178-92db-235e6d9f0ff0	Warung Sehat Jaya	Jl. Gatot Subroto No. 67, Jakarta	\N	BCA	1234567890	Pak Tarno	active	approved	79d2f102-4626-4a06-b43b-98cf7f3edab5	2026-04-20 15:21:44.013923	2026-05-26 01:44:17.782903	t	192550.00	\N	\N	\N	\N
6d6e430d-7a02-4b3e-b563-2b15dfe4a7cb	Toko Berkah Utama	Pasar Senen Blok A No. 12	\N	BCA	1234567890	Ibu Kartini	active	approved	a824c07a-0006-48c2-a49b-d15f375e97a5	2026-05-26 01:36:47.677449	2026-06-10 05:06:38.088827	t	0.00	\N	\N	\N	\N
9a75328c-61d5-4768-85e5-9269775ca623	ilham		\N	\N	\N	\N	active	approved	c4172732-3039-4411-9f7b-6c63255b4caf	2026-06-10 11:37:27.577088	2026-06-17 03:00:27.767455	t	0.00	\N	\N	\N	\N
ccaaf342-c293-485b-b064-7d9f2cd42b22	Jasper Imanuel		\N	\N	\N	\N	active	approved	d6f7822c-c1ec-4a8a-bfda-855dfce22959	2026-06-10 11:36:31.518642	2026-06-17 03:00:28.7456	t	0.00	\N	\N	\N	\N
438671de-205c-4083-8610-cbf138757f36	Dyesty Salsazilla		\N	\N	\N	\N	active	approved	b62e8088-86e8-4bcb-801d-9c1a8e1c856a	2026-06-10 11:14:21.656154	2026-06-17 03:00:45.712009	t	0.00	\N	\N	\N	\N
0419ba30-33ce-40c0-bd61-31cfc233a271	Virly		\N	\N	\N	\N	active	approved	c633c21e-abf7-46d3-9cf0-c23279b31de8	2026-06-10 09:25:07.783972	2026-06-17 03:01:19.587462	t	0.00	\N	\N	\N	\N
7a1ee006-f94b-463b-9d47-f99241469e24	Ladiva		\N	\N	\N	\N	active	approved	3db65d3e-d6c7-4a03-af7c-0e1c4608ac69	2026-06-10 13:28:45.264616	2026-06-17 03:04:38.221317	t	24750.00	\N	\N	\N	\N
706ffe8f-d51e-4a2f-924f-8180d76dc558	vendor01		\N	BCA	12354648	VENDOR01	active	approved	bea73525-a84a-424e-b133-3fea35a65b8e	2026-05-04 17:32:55.179548	2026-06-17 06:43:30.128483	t	139580.00	\N	\N	\N	\N
\.


--
-- Data for Name: voucher_allowed_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.voucher_allowed_categories (id, created_at, updated_at, is_active, category_id, is_allowed) FROM stdin;
439658fa-e8c1-4b65-a925-c75dbd9042f2	2026-04-18 07:28:49.578389	2026-04-18 07:28:49.578395	t	ccbe2f35-343c-4198-b875-b910da013afa	1
0ec3d463-10b9-4d05-8579-33a9c7e51d9f	2026-04-18 07:28:49.578407	2026-04-18 07:28:49.578409	t	7cf46de2-2bff-4476-9c1d-e5376bdc2abb	1
b19d2909-9730-467b-b963-b14b6c931389	2026-04-18 07:28:49.578418	2026-04-18 07:28:49.57842	t	ba4ebdf7-535a-450d-892c-72886fa3f30d	1
acfaa43e-a9d4-4a54-ace1-a5284ab455b5	2026-04-18 07:28:49.578428	2026-04-18 07:28:49.57843	t	31e860cf-a254-43d8-b48b-7ca432c32672	1
8cc4bbab-65f3-4161-91d4-4ada53ba81c3	2026-04-18 07:28:49.578437	2026-04-18 07:28:49.578439	t	f7b66693-9d12-450a-873d-84fa8f942872	1
c54ebf45-ce2a-45ec-9fc0-02b7340d4f92	2026-04-18 07:28:49.578446	2026-04-18 07:28:49.578448	t	09d47c16-5464-4b71-90bd-d28df7164f61	0
\.


--
-- Data for Name: voucher_locks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.voucher_locks (id, created_at, updated_at, is_active, voucher_id, locked_at, expires_at) FROM stdin;
\.


--
-- Data for Name: voucher_redemptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.voucher_redemptions (voucher_id, order_id, amount, id, created_at, updated_at, is_active) FROM stdin;
60000000-0000-0000-0000-000000000001	70000000-0000-0000-0000-000000000001	90000.00	a9a8dab1-ed99-42b4-9ebc-715276bc8cc2	2026-04-18 07:28:51.255438	2026-04-18 07:28:51.255445	t
60000000-0000-0000-0000-000000000002	70000000-0000-0000-0000-000000000002	50000.00	0a9f1f57-315e-4e92-bf85-0d116ff42e89	2026-04-18 07:28:51.255457	2026-04-18 07:28:51.25546	t
\.


--
-- Data for Name: voucher_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.voucher_transactions (id, created_at, updated_at, is_active, voucher_id, order_id, transaction_type, amount) FROM stdin;
0916fb0c-edf6-45f4-9925-0268965b4bc9	2026-03-29 07:28:50.205462	2026-04-18 07:28:51.230429	t	60000000-0000-0000-0000-000000000001	\N	allocated	350000.00
6c7eee73-9733-4fdc-843a-2f32b8d874cc	2026-04-15 07:28:50.205462	2026-04-18 07:28:51.230445	t	60000000-0000-0000-0000-000000000001	70000000-0000-0000-0000-000000000001	redeemed	90000.00
6496627d-b05f-4267-a896-9176eee37c89	2026-04-08 07:28:50.205462	2026-04-18 07:28:51.230455	t	60000000-0000-0000-0000-000000000002	\N	allocated	500000.00
fa77b785-a450-4053-8aab-de8c28e3a0e2	2026-04-17 07:28:50.205462	2026-04-18 07:28:51.230465	t	60000000-0000-0000-0000-000000000002	70000000-0000-0000-0000-000000000002	redeemed	50000.00
6e5fc817-65fc-4d5e-a396-08cc784ae841	2026-04-17 21:28:50.205462	2026-04-18 07:28:51.230473	t	60000000-0000-0000-0000-000000000002	\N	adjusted	15000.00
308f21ff-5109-4395-92d1-978f52bf17ea	2026-04-27 13:48:54.943893	2026-04-27 13:48:54.943893	t	668fb4de-f3ae-45d7-9ab6-f8669e52f0a8	\N	allocated	197652.59
f2e378bd-8db4-45cf-8be3-54f2f677d6e8	2026-04-27 13:48:55.128134	2026-04-27 13:48:55.128134	t	97f1c519-11a6-412c-8e30-077e401e2118	\N	allocated	155399.06
2f1a3ce4-b1de-45cd-b73e-f5f37461ee33	2026-04-27 13:48:55.248319	2026-04-27 13:48:55.248319	t	ee958cd7-6b7e-4e4e-bedc-b1ad319843a1	\N	allocated	146948.35
45aba00d-0f44-406a-ae38-8c8e0b0fa808	2026-05-05 01:27:32.821255	2026-05-05 01:27:32.821261	t	12aa725f-ae0a-4d1d-ad3d-0581cf24c5a2	\N	allocated	500000.00
6d0f6eb2-6eb3-4e92-846a-dce89beb38cb	2026-05-05 06:29:20.108784	2026-05-05 06:29:20.108784	t	ae1a9be6-5db1-4f70-990c-75258129bcb5	\N	allocated	300000.00
e6e6fc53-58b5-4217-a14e-867eab9b8976	2026-05-05 07:37:01.659623	2026-05-05 07:37:01.659667	t	19dd77e1-e2e0-48fd-af40-0b2e41b1b864	\N	allocated	500000.00
\.


--
-- Data for Name: vouchers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vouchers (code, beneficiary_id, donation_id, balance, allocated_date, expiry_date, status, id, created_at, updated_at, is_active) FROM stdin;
E2E-VOUCHER-A	20000000-0000-0000-0000-000000000001	50000000-0000-0000-0000-000000000001	150000.00	2026-03-29 07:28:50.205462	2026-05-28	active	60000000-0000-0000-0000-000000000001	2026-04-18 07:28:50.424422	2026-04-18 07:28:50.424429	t
E2E-VOUCHER-B	20000000-0000-0000-0000-000000000001	50000000-0000-0000-0000-000000000002	300000.00	2026-04-08 07:28:50.205462	2026-06-17	active	60000000-0000-0000-0000-000000000002	2026-04-18 07:28:50.424432	2026-04-18 07:28:50.424435	t
VCH-DEMO-1-C4737B	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	b4c46d52-1e9f-4fca-a810-c53e818cf7ab	350000.00	2026-04-20 15:21:44.49925	2026-05-20	active	bdcdbd73-6a7a-4c60-9c08-6d66091aed2b	2026-04-20 15:21:44.696348	2026-04-20 15:21:44.696356	t
VCH-DEMO-2-103713	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	a7acd029-a1f0-4d8d-b5fe-671c683c46ed	500000.00	2026-04-20 15:21:44.499594	2026-05-20	active	392c0e70-a8b5-486a-b365-e3f8f08e0884	2026-04-20 15:21:44.696374	2026-04-20 15:21:44.696376	t
VCH-DEMO-3-CB5269	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	9fcfd83d-0e24-469d-a65e-f35d426aa89b	500000.00	2026-04-20 15:21:44.499743	2026-05-20	active	5a329f49-b2dc-49e3-9ba3-d25564ae6ab0	2026-04-20 15:21:44.696389	2026-04-20 15:21:44.696392	t
VCH-DEMO-1-1F9CB9	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	9fcfd83d-0e24-469d-a65e-f35d426aa89b	350000.00	2026-04-20 15:26:44.473778	2026-05-20	active	ed8b0da0-1328-471a-ba36-c015c59a82e0	2026-04-20 15:26:44.791042	2026-04-20 15:26:44.791048	t
VCH-DEMO-2-7C8BAF	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	a7acd029-a1f0-4d8d-b5fe-671c683c46ed	500000.00	2026-04-20 15:26:44.474162	2026-05-20	active	fcddf1aa-99ec-492f-8ebe-67b9c005d71e	2026-04-20 15:26:44.791061	2026-04-20 15:26:44.791063	t
VCH-DEMO-3-44F9FC	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	b4c46d52-1e9f-4fca-a810-c53e818cf7ab	500000.00	2026-04-20 15:26:44.474273	2026-05-20	active	aacc6421-4b97-4e17-a5c2-147950d4bc22	2026-04-20 15:26:44.791074	2026-04-20 15:26:44.791076	t
VCH-DEMO-1-0CB00A	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	9fcfd83d-0e24-469d-a65e-f35d426aa89b	350000.00	2026-04-20 15:27:30.906963	2026-05-20	active	e174fabf-78a9-409d-bced-86c55759401d	2026-04-20 15:27:31.000898	2026-04-20 15:27:31.000905	t
VCH-DEMO-2-961956	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	a7acd029-a1f0-4d8d-b5fe-671c683c46ed	500000.00	2026-04-20 15:27:30.90739	2026-05-20	active	0b7718bd-e203-4c4a-9973-1848b4f1cbb5	2026-04-20 15:27:31.000922	2026-04-20 15:27:31.000926	t
VCH-DEMO-3-8DBD61	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	b4c46d52-1e9f-4fca-a810-c53e818cf7ab	500000.00	2026-04-20 15:27:30.907546	2026-05-20	active	3e63537f-2fb0-4412-b0eb-59a543e4d8b4	2026-04-20 15:27:31.000938	2026-04-20 15:27:31.000941	t
VCH-2026-136484	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	2d81792a-c250-4313-8171-4beb58a1c7d5	300000.00	2026-04-21 23:25:33.617299	2026-05-21	active	b53bf60f-d603-4342-89cc-0a27722b233a	2026-04-21 23:25:33.791346	2026-04-21 23:25:33.791351	t
VCH-2026-0A1D7E	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	337d5017-4a96-4a58-bacf-c52aa9e49210	300000.00	2026-04-21 23:29:15.287556	2026-05-21	active	3b7f75ef-7613-48a1-a35d-007103ec322c	2026-04-21 23:29:15.45264	2026-04-21 23:29:15.452645	t
VCH-2026-7751C7	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	26b40c9c-c251-4fce-b591-07adcfbe7a97	500000.00	2026-04-22 01:23:54.632635	2026-05-22	active	4d5a22fd-f254-4088-a9b2-1d22006911d0	2026-04-22 01:23:54.810905	2026-04-22 01:23:54.810912	t
VCH-2026-30A21C	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	c14884e2-907b-42ba-94c8-b535dc829c11	500000.00	2026-04-22 01:28:32.294007	2026-05-22	active	d562459f-5e20-4f3c-8f49-cb5471457a69	2026-04-22 01:28:32.459161	2026-04-22 01:28:32.459167	t
VCH-2026-06EE45	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	7cd126ff-5212-4670-a727-8b1027c8c396	1000000.00	2026-04-22 03:12:46.349603	2026-05-22	active	d0ee7f85-0fa8-40a0-9b90-ea1533e3558a	2026-04-22 03:12:46.525711	2026-04-22 03:12:46.525719	t
VCH-2026-0BF85B	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	0ce571f3-fe8e-46b6-917f-64c3f71b5f75	500000.00	2026-04-22 04:18:53.754118	2026-05-22	active	d252e549-5137-4747-ac8d-a6ae3a4a49f0	2026-04-22 04:18:53.889542	2026-04-22 04:18:53.889549	t
VCH-2026-B0DEE4	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	32a0183f-a55b-4d5b-92c8-2487403f5dc6	197652.59	2026-04-27 13:48:54.461153	2026-07-27	active	668fb4de-f3ae-45d7-9ab6-f8669e52f0a8	2026-04-27 13:48:54.735153	2026-04-27 13:48:54.735153	t
VCH-2026-E2DD39	ee4f68ab-cc12-45f8-92b6-3c1f7422aff6	32a0183f-a55b-4d5b-92c8-2487403f5dc6	155399.06	2026-04-27 13:48:54.461153	2026-07-27	active	97f1c519-11a6-412c-8e30-077e401e2118	2026-04-27 13:48:54.889668	2026-04-27 13:48:54.889668	t
VCH-2026-B11C89	20000000-0000-0000-0000-000000000001	32a0183f-a55b-4d5b-92c8-2487403f5dc6	146948.35	2026-04-27 13:48:54.461153	2026-07-27	active	ee958cd7-6b7e-4e4e-bedc-b1ad319843a1	2026-04-27 13:48:55.075543	2026-04-27 13:48:55.075543	t
VCH-2026-0DAFC8	f19ca67e-9299-40a3-ab61-e5dd911ccd2f	4bfb7829-c282-4bc5-bf9a-95fde3610a00	500000.00	2026-05-05 01:27:32.679696	2026-08-05	active	12aa725f-ae0a-4d1d-ad3d-0581cf24c5a2	2026-05-05 01:27:32.759735	2026-05-05 01:27:32.759741	t
VCH-2026-95DE26	f19ca67e-9299-40a3-ab61-e5dd911ccd2f	9c5135ca-bee5-43ef-a498-3719aac7210c	300000.00	2026-05-05 06:29:19.493085	2026-08-05	active	ae1a9be6-5db1-4f70-990c-75258129bcb5	2026-05-05 06:29:19.900677	2026-05-05 06:29:19.900677	t
VCH-2026-BCF0DB	f19ca67e-9299-40a3-ab61-e5dd911ccd2f	d6a01f08-6c26-4508-88c0-fa8f7732e0dd	500000.00	2026-05-05 07:37:00.584667	2026-08-05	active	19dd77e1-e2e0-48fd-af40-0b2e41b1b864	2026-05-05 07:37:01.352731	2026-05-05 07:37:01.352775	t
VCH-DEMO-1-6DE869	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	2d81792a-c250-4313-8171-4beb58a1c7d5	350000.00	2026-05-26 01:36:11.025725	2026-06-25	active	1064658f-f5bc-4e43-8ae7-153c2ec59df0	2026-05-26 01:36:12.582933	2026-05-26 01:36:12.582956	t
VCH-DEMO-2-26E79D	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	337d5017-4a96-4a58-bacf-c52aa9e49210	500000.00	2026-05-26 01:36:11.026095	2026-06-25	active	1a2a5705-de0c-42dc-86b0-9b693ac65ad9	2026-05-26 01:36:12.582969	2026-05-26 01:36:12.582971	t
VCH-DEMO-3-2FDBE9	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	fc0fe551-cbf5-4a66-807d-7a5f2ad1c54b	500000.00	2026-05-26 01:36:11.026223	2026-06-25	active	5d791688-dfc6-41a0-b783-bb6ed2102ab6	2026-05-26 01:36:12.582981	2026-05-26 01:36:12.582983	t
VCH-DEMO-4-AACF76	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	58a91f83-e198-4fcc-8468-73a05806f13d	500000.00	2026-05-26 01:36:11.02638	2026-06-25	active	25cd0eae-c0d7-4e85-adb6-bdbe2088f471	2026-05-26 01:36:12.582991	2026-05-26 01:36:12.582993	t
VCH-DEMO-5-0F10CB	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	818c79ba-3fa6-4d87-afcd-35b22585c0de	500000.00	2026-05-26 01:36:11.026533	2026-06-25	active	82e64646-2b8f-4f76-aeab-db69bf15739a	2026-05-26 01:36:12.583001	2026-05-26 01:36:12.583004	t
VCH-DEMO-6-0A2090	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	88864997-1e75-4cc0-8a7d-cdce9e455a58	500000.00	2026-05-26 01:36:11.026627	2026-06-25	active	6f1348c1-4cc6-4e38-af35-1335070a49ba	2026-05-26 01:36:12.583011	2026-05-26 01:36:12.583014	t
VCH-DEMO-7-126282	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	b802490b-9a20-4275-8c8d-6ebd070ade47	500000.00	2026-05-26 01:36:11.026711	2026-06-25	active	54d7422a-c996-4f71-94a1-04519f6893c6	2026-05-26 01:36:12.583022	2026-05-26 01:36:12.583024	t
VCH-DEMO-8-185E70	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	a50de577-1796-4ced-a9e6-674e0e742249	500000.00	2026-05-26 01:36:11.026807	2026-06-25	active	38300e58-e55a-4f01-8157-68e2d749eacd	2026-05-26 01:36:12.583032	2026-05-26 01:36:12.583034	t
VCH-DEMO-9-D6CB08	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	9fcfd83d-0e24-469d-a65e-f35d426aa89b	500000.00	2026-05-26 01:36:11.026945	2026-06-25	active	98f0188e-c68c-4f3e-95f4-2f014c2e5cd2	2026-05-26 01:36:12.583042	2026-05-26 01:36:12.583044	t
VCH-DEMO-10-8B24AB	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	a7acd029-a1f0-4d8d-b5fe-671c683c46ed	500000.00	2026-05-26 01:36:11.027055	2026-06-25	active	1a32b2f5-fb9f-4392-96dd-f4a61b18bb5d	2026-05-26 01:36:12.583052	2026-05-26 01:36:12.583054	t
VCH-DEMO-11-32A2F9	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	b4c46d52-1e9f-4fca-a810-c53e818cf7ab	500000.00	2026-05-26 01:36:11.027148	2026-06-25	active	d9fee3f7-0ad2-4da9-b448-321ea9d4ad64	2026-05-26 01:36:12.583061	2026-05-26 01:36:12.583063	t
VCH-DEMO-12-4D1392	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	b905a724-7bf4-438e-9baf-e665875cb94e	500000.00	2026-05-26 01:36:11.027248	2026-06-25	active	7f64ff5e-e02b-4617-bf7b-aa87ea03f411	2026-05-26 01:36:12.583071	2026-05-26 01:36:12.583073	t
VCH-DEMO-13-C444D0	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	cf4914f4-4dcc-48fc-a0f5-d90b4e2df1a2	500000.00	2026-05-26 01:36:11.027349	2026-06-25	active	6a0360be-aab3-4d95-89fa-756f24ee3c76	2026-05-26 01:36:12.583081	2026-05-26 01:36:12.583083	t
VCH-DEMO-14-04ABEF	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	6c7df20a-754e-4ef0-986b-5244d6603cbf	500000.00	2026-05-26 01:36:11.027446	2026-06-25	active	aa24179f-d004-4cd2-a42f-f35446f94be1	2026-05-26 01:36:12.583091	2026-05-26 01:36:12.583093	t
VCH-DEMO-15-2B1986	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	e7e32a97-5638-4152-877a-e8649a7b54b3	500000.00	2026-05-26 01:36:11.027547	2026-06-25	active	86732aec-e3aa-49f4-8ebc-a01ddaf134d3	2026-05-26 01:36:12.583101	2026-05-26 01:36:12.583103	t
VCH-DEMO-16-F5E727	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	dce7d4a5-033b-481a-acd8-baed5320a49d	500000.00	2026-05-26 01:36:11.027659	2026-06-25	active	c8b3fec8-5bb1-4235-aba4-a95ac1aa1cd0	2026-05-26 01:36:12.583111	2026-05-26 01:36:12.583113	t
VCH-DEMO-17-A47247	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	e27dea50-b000-4ffa-ae75-1cb67f5d5236	500000.00	2026-05-26 01:36:11.028096	2026-06-25	active	9e84660c-1515-4660-8e5e-a7ab1105d3ef	2026-05-26 01:36:12.583122	2026-05-26 01:36:12.583124	t
VCH-DEMO-18-8D01C4	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	4adf1f16-1425-4007-977a-46210fbe3b71	500000.00	2026-05-26 01:36:11.02818	2026-06-25	active	cd54a034-a56d-4fa4-8bff-bf3983f5db58	2026-05-26 01:36:12.583132	2026-05-26 01:36:12.583134	t
VCH-DEMO-19-CEC7FF	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	85795914-3dd8-4683-981d-74aafeab9767	500000.00	2026-05-26 01:36:11.02825	2026-06-25	active	b3ceb1c4-46fe-4905-93ca-7bf32b46366b	2026-05-26 01:36:12.583141	2026-05-26 01:36:12.583144	t
VCH-DEMO-20-F6CD22	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	5ad63a15-d27c-441c-b328-d3bfcd5cc61c	500000.00	2026-05-26 01:36:11.028349	2026-06-25	active	3f332ab5-7851-444b-b87b-959d930a9e8a	2026-05-26 01:36:12.583151	2026-05-26 01:36:12.583153	t
VCH-DEMO-21-E11575	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	f0705036-7d9c-4244-925f-d1054cf426c8	500000.00	2026-05-26 01:36:11.028432	2026-06-25	active	ef619c3b-751a-4e74-b53a-5ec194a35b93	2026-05-26 01:36:12.583161	2026-05-26 01:36:12.583163	t
VCH-DEMO-22-5A3DC2	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	95e8f6b3-922c-48d7-b14a-b3360e76b335	500000.00	2026-05-26 01:36:11.028517	2026-06-25	active	62a630cb-0df6-44f1-8461-f74081fd567c	2026-05-26 01:36:12.583171	2026-05-26 01:36:12.583173	t
VCH-DEMO-23-11A8EB	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	e7040ad7-0c16-4c5a-b07a-6fff6a4f7272	500000.00	2026-05-26 01:36:11.028597	2026-06-25	active	736e7d5d-c6f6-493a-bffb-eb4b274410d1	2026-05-26 01:36:12.58318	2026-05-26 01:36:12.583183	t
VCH-DEMO-24-68B091	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	dccba563-53b7-4542-b9c3-9d634f3bdc5a	500000.00	2026-05-26 01:36:11.028661	2026-06-25	active	206a2c9f-08af-4bcb-8efc-d813bb962e00	2026-05-26 01:36:12.58319	2026-05-26 01:36:12.583192	t
VCH-DEMO-25-A948CE	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	abb15c9b-5e89-4ce3-936f-bab39b40df1a	500000.00	2026-05-26 01:36:11.02873	2026-06-25	active	21a82b52-e506-41d4-819b-2419886c2c43	2026-05-26 01:36:12.5832	2026-05-26 01:36:12.583202	t
VCH-DEMO-26-CC999C	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	40302291-3d93-47e7-b428-042a8f0dc288	500000.00	2026-05-26 01:36:11.028793	2026-06-25	active	8d5f3772-214b-47d7-adb8-abb436ecde4c	2026-05-26 01:36:12.58321	2026-05-26 01:36:12.583212	t
VCH-DEMO-27-41187D	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	d40684ee-5a18-4287-b9c5-cff426d577c4	500000.00	2026-05-26 01:36:11.028891	2026-06-25	active	db2f5ad3-c55c-4703-8f37-23b196bba201	2026-05-26 01:36:12.583219	2026-05-26 01:36:12.583222	t
VCH-DEMO-28-D39FD8	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	469f36c5-6594-4fba-a57b-d56ad6d46ad5	500000.00	2026-05-26 01:36:11.028963	2026-06-25	active	a7b948cc-d8f4-43ef-aed7-a1a594081933	2026-05-26 01:36:12.583229	2026-05-26 01:36:12.583231	t
VCH-DEMO-29-18FE9B	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	d5a79831-f656-46fc-a42a-057a6d3e4491	500000.00	2026-05-26 01:36:11.029033	2026-06-25	active	d4a95c6a-688b-44b3-9fea-2cdd089db31e	2026-05-26 01:36:12.583238	2026-05-26 01:36:12.583241	t
VCH-DEMO-30-749987	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	c14884e2-907b-42ba-94c8-b535dc829c11	500000.00	2026-05-26 01:36:11.029094	2026-06-25	active	00d21bfd-cda3-4ad5-98e4-d36a6d2cf3a8	2026-05-26 01:36:12.583248	2026-05-26 01:36:12.583251	t
VCH-DEMO-31-C2CB3F	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	7cd126ff-5212-4670-a727-8b1027c8c396	500000.00	2026-05-26 01:36:11.029161	2026-06-25	active	44470d99-570e-4c2e-b757-00f6ec868e63	2026-05-26 01:36:12.583258	2026-05-26 01:36:12.58326	t
VCH-DEMO-32-0A1E81	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	0ce571f3-fe8e-46b6-917f-64c3f71b5f75	500000.00	2026-05-26 01:36:11.029223	2026-06-25	active	241be447-44e8-44d5-9110-6e38bd91aa54	2026-05-26 01:36:12.583267	2026-05-26 01:36:12.583269	t
VCH-DEMO-33-30AF0B	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	aa5a8d93-d5dc-45a7-afef-5834e144a51a	500000.00	2026-05-26 01:36:11.029289	2026-06-25	active	a34db89a-0f79-4c3e-9855-0cdc7e16f6ad	2026-05-26 01:36:12.583277	2026-05-26 01:36:12.583279	t
VCH-DEMO-34-581AC2	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	a2261e9f-0d3d-43eb-8b8a-746332bc433e	500000.00	2026-05-26 01:36:11.029358	2026-06-25	active	98553918-ea27-40e7-99cf-e440178775ed	2026-05-26 01:36:12.583287	2026-05-26 01:36:12.583289	t
VCH-DEMO-35-C69AF1	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	5b8eac2f-b81c-4c1c-979f-c737bec15fa4	500000.00	2026-05-26 01:36:11.029479	2026-06-25	active	3a8480f4-511d-4f82-91b4-8ae752e59656	2026-05-26 01:36:12.583296	2026-05-26 01:36:12.583298	t
VCH-DEMO-36-5166A4	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	5ef7fd94-2dc1-42f3-ad20-ca9098dbcd3b	500000.00	2026-05-26 01:36:11.029544	2026-06-25	active	18e875f2-3025-4917-b55b-c09332121005	2026-05-26 01:36:12.583305	2026-05-26 01:36:12.583308	t
VCH-DEMO-37-AD0005	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	a144df2e-4702-4ca3-a7f2-7df3b4735cba	500000.00	2026-05-26 01:36:11.029622	2026-06-25	active	9a1bcbe8-7114-4d3c-8ad3-c96243dc629a	2026-05-26 01:36:12.583315	2026-05-26 01:36:12.583317	t
VCH-DEMO-38-F3EC80	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	349b70da-c31f-423b-8a68-bd5c9b41d721	500000.00	2026-05-26 01:36:11.029684	2026-06-25	active	73e360ce-80c8-4254-99e6-85b3b8a0d9e6	2026-05-26 01:36:12.583324	2026-05-26 01:36:12.583326	t
VCH-DEMO-39-FC9742	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	bd75ffb1-2496-4131-b95e-c2080114cf61	500000.00	2026-05-26 01:36:11.029745	2026-06-25	active	0a7cb290-2377-4263-ae57-84c26a4f9995	2026-05-26 01:36:12.583333	2026-05-26 01:36:12.583336	t
VCH-DEMO-40-FBD390	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	d40d8c70-55c7-45cc-8dad-ffb52e47dd3a	500000.00	2026-05-26 01:36:11.029806	2026-06-25	active	a4952ed2-f3c9-487a-9993-5e2affdcb29c	2026-05-26 01:36:12.583343	2026-05-26 01:36:12.583345	t
VCH-DEMO-41-E891E0	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	9f3b02e4-442f-44a7-910e-8cde0638e9c2	500000.00	2026-05-26 01:36:11.029874	2026-06-25	active	79cf401a-9e5c-4260-87bc-df3d9d8fc188	2026-05-26 01:36:12.583353	2026-05-26 01:36:12.583355	t
VCH-DEMO-42-4CE864	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	b561a692-010d-4b7c-bacc-4afda3479df6	500000.00	2026-05-26 01:36:11.029956	2026-06-25	active	338e4912-1e70-40dd-b859-ec232356a3b1	2026-05-26 01:36:12.583363	2026-05-26 01:36:12.583365	t
VCH-DEMO-43-34CEEF	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	8d77e4b5-6d0b-4b31-813c-b84458c7d959	500000.00	2026-05-26 01:36:11.030035	2026-06-25	active	5ddb5502-0d4e-44ed-8288-06b27b8b3de9	2026-05-26 01:36:12.583372	2026-05-26 01:36:12.583374	t
VCH-DEMO-44-B885CC	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	4bfb7829-c282-4bc5-bf9a-95fde3610a00	500000.00	2026-05-26 01:36:11.030104	2026-06-25	active	06178398-3f4b-4e9a-bee2-5f9bcac86388	2026-05-26 01:36:12.583381	2026-05-26 01:36:12.583384	t
VCH-DEMO-45-AD274E	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	1e11adc0-84b8-4d40-af8f-8adc3b2d9aae	500000.00	2026-05-26 01:36:11.03017	2026-06-25	active	2b06fac6-4f22-400a-b75c-3ac26f877a02	2026-05-26 01:36:12.583391	2026-05-26 01:36:12.583393	t
VCH-DEMO-46-88CF6A	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	de5700b7-02b2-4be4-8aaa-ddcb19045cdd	500000.00	2026-05-26 01:36:11.030234	2026-06-25	active	3a060b5d-ce33-414b-bb60-100e8835949e	2026-05-26 01:36:12.5834	2026-05-26 01:36:12.583402	t
VCH-DEMO-47-64A847	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	06f0baba-8a07-4567-a108-c0068e5f3678	500000.00	2026-05-26 01:36:11.030295	2026-06-25	active	bb25bcae-5021-43ce-9f7c-d9e0d19d2747	2026-05-26 01:36:12.583409	2026-05-26 01:36:12.583411	t
VCH-DEMO-48-D535AB	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	8ac6def6-0242-4063-8fd3-e20efcca2252	500000.00	2026-05-26 01:36:11.030355	2026-06-25	active	65cdc4bd-801b-4af7-aeb2-5747e0ddf130	2026-05-26 01:36:12.583419	2026-05-26 01:36:12.583421	t
VCH-DEMO-49-997595	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	25b1c35e-3b29-43be-9b65-d8a48cef7a3f	500000.00	2026-05-26 01:36:11.030416	2026-06-25	active	e1fdc077-5d13-4028-b22a-bc43aa672aed	2026-05-26 01:36:12.583429	2026-05-26 01:36:12.583431	t
VCH-DEMO-50-0EF941	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	d6a01f08-6c26-4508-88c0-fa8f7732e0dd	500000.00	2026-05-26 01:36:11.030491	2026-06-25	active	0bc5bf0f-81fc-4d0b-8ab4-0d385250540d	2026-05-26 01:36:12.583438	2026-05-26 01:36:12.58344	t
VCH-DEMO-51-7C18F3	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	a6ad43c5-1533-47f2-8bbb-58f19e28cda5	500000.00	2026-05-26 01:36:11.030564	2026-06-25	active	1c6d8787-7032-4e41-99bc-2c7ac53dd6f5	2026-05-26 01:36:12.583447	2026-05-26 01:36:12.583449	t
VCH-DEMO-52-3EDF4C	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	9dea60c0-a948-41de-be5b-91bdcb308fa0	500000.00	2026-05-26 01:36:11.030626	2026-06-25	active	83c11d8f-bc0d-4e37-8d69-d0712263821b	2026-05-26 01:36:12.583456	2026-05-26 01:36:12.583458	t
VCH-DEMO-53-007B82	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	f673d639-c180-493b-94e1-53198b73ccb0	500000.00	2026-05-26 01:36:11.030689	2026-06-25	active	b51003e0-c462-4c9b-b1dd-c18fdaa0658e	2026-05-26 01:36:12.583466	2026-05-26 01:36:12.583468	t
VCH-DEMO-54-B712F5	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	dda2a3f1-b22f-4df9-8110-3e18c9985bd7	500000.00	2026-05-26 01:36:11.030749	2026-06-25	active	10ae0375-be9f-452d-aa5a-38ae3b4007fe	2026-05-26 01:36:12.583475	2026-05-26 01:36:12.583478	t
VCH-DEMO-55-B70038	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	30e9f3dd-76cc-49f7-88c8-a9ef1490ce9f	500000.00	2026-05-26 01:36:11.030811	2026-06-25	active	2438409c-2a28-4269-ac8a-6fc7370eea4a	2026-05-26 01:36:12.583485	2026-05-26 01:36:12.583487	t
VCH-DEMO-56-92C26E	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	ce89139c-34f6-47a0-94ff-9671c709f6d0	500000.00	2026-05-26 01:36:11.030872	2026-06-25	active	a97727ed-fc52-4dbc-8fa4-c539e6885f9c	2026-05-26 01:36:12.583495	2026-05-26 01:36:12.583497	t
VCH-DEMO-57-9786D9	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	3257f1cb-c4c1-4400-bd56-8eaf08b9dd83	500000.00	2026-05-26 01:36:11.03094	2026-06-25	active	bcd20ec2-228e-476c-97a4-25aa1db5119d	2026-05-26 01:36:12.583505	2026-05-26 01:36:12.583507	t
VCH-DEMO-58-DA7DA6	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	0715571b-08dc-448f-91bd-4bf68c3ca626	500000.00	2026-05-26 01:36:11.031021	2026-06-25	active	13f141ba-636b-4702-9bc9-c41f48712cbd	2026-05-26 01:36:12.583515	2026-05-26 01:36:12.583517	t
VCH-DEMO-59-5E12C8	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	5af3ff21-9117-4dfe-a529-513ba3f283c9	500000.00	2026-05-26 01:36:11.031097	2026-06-25	active	c97a47db-cf60-4196-8d2d-7b9d608e916f	2026-05-26 01:36:12.583524	2026-05-26 01:36:12.583526	t
VCH-DEMO-60-22F6FF	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	ebcbd77f-d522-4821-acf0-17fbb632e7f6	500000.00	2026-05-26 01:36:11.031159	2026-06-25	active	d39a80c2-004a-4461-b638-3a9708814291	2026-05-26 01:36:12.583533	2026-05-26 01:36:12.583536	t
VCH-DEMO-61-B5A515	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	fefff3f3-b57d-43f0-9103-d35c5b6c97ba	500000.00	2026-05-26 01:36:11.031231	2026-06-25	active	e4000f59-c05d-4d62-bd3d-b10d098667a4	2026-05-26 01:36:12.583543	2026-05-26 01:36:12.583545	t
VCH-DEMO-62-0D644F	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	2ecb3342-f873-49f0-9710-00d328de112c	500000.00	2026-05-26 01:36:11.031295	2026-06-25	active	2c52f8ed-9506-4bf0-8c5b-fee72d68aff3	2026-05-26 01:36:12.583553	2026-05-26 01:36:12.583555	t
VCH-DEMO-63-5D60D1	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	ffe5c004-bed7-4d8d-b13d-70002279d191	500000.00	2026-05-26 01:36:11.031362	2026-06-25	active	675e10cf-ad97-4350-b741-c85c5ff7ad88	2026-05-26 01:36:12.583562	2026-05-26 01:36:12.583564	t
VCH-DEMO-64-B02525	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	5eee11b1-cfa3-4fbe-88d1-b16343820a63	500000.00	2026-05-26 01:36:11.031423	2026-06-25	active	38248208-dd8e-4e03-b84d-3aadb1c2ff46	2026-05-26 01:36:12.583571	2026-05-26 01:36:12.583574	t
VCH-DEMO-1-C115FC	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	0ce571f3-fe8e-46b6-917f-64c3f71b5f75	350000.00	2026-05-26 01:36:47.942871	2026-06-25	active	869b02be-3262-4c0e-a781-2ee7c6392ea5	2026-05-26 01:36:49.585136	2026-05-26 01:36:49.585142	t
VCH-DEMO-2-DA77E5	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	06f0baba-8a07-4567-a108-c0068e5f3678	500000.00	2026-05-26 01:36:47.943198	2026-06-25	active	1b27b967-f0d0-4d0d-bf25-b7968bf67d46	2026-05-26 01:36:49.585156	2026-05-26 01:36:49.585158	t
VCH-DEMO-3-469919	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	0715571b-08dc-448f-91bd-4bf68c3ca626	500000.00	2026-05-26 01:36:47.943552	2026-06-25	active	02fbd223-b25d-4437-85b3-296063a02e81	2026-05-26 01:36:49.585172	2026-05-26 01:36:49.585174	t
VCH-DEMO-4-01ED5E	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	1e11adc0-84b8-4d40-af8f-8adc3b2d9aae	500000.00	2026-05-26 01:36:47.943694	2026-06-25	active	00f3e355-2ec7-4dd2-9a75-b5b3374ff0c7	2026-05-26 01:36:49.585184	2026-05-26 01:36:49.585186	t
VCH-DEMO-5-AC0436	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	25b1c35e-3b29-43be-9b65-d8a48cef7a3f	500000.00	2026-05-26 01:36:47.943814	2026-06-25	active	7dddc1c6-620e-4589-b72f-d43387676d1d	2026-05-26 01:36:49.585196	2026-05-26 01:36:49.585199	t
VCH-DEMO-6-97F6DC	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	2d81792a-c250-4313-8171-4beb58a1c7d5	500000.00	2026-05-26 01:36:47.943919	2026-06-25	active	2728c02b-89ec-48ba-a685-3989e79a2ccb	2026-05-26 01:36:49.585207	2026-05-26 01:36:49.58521	t
VCH-DEMO-7-F12412	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	2ecb3342-f873-49f0-9710-00d328de112c	500000.00	2026-05-26 01:36:47.944012	2026-06-25	active	98cdfd60-12bc-445a-972d-c9026afc8a87	2026-05-26 01:36:49.585218	2026-05-26 01:36:49.585221	t
VCH-DEMO-8-B4C520	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	30e9f3dd-76cc-49f7-88c8-a9ef1490ce9f	500000.00	2026-05-26 01:36:47.944121	2026-06-25	active	20f0c33a-084b-40c1-954f-9fc323b458b2	2026-05-26 01:36:49.585234	2026-05-26 01:36:49.585236	t
VCH-DEMO-9-89C0F6	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	3257f1cb-c4c1-4400-bd56-8eaf08b9dd83	500000.00	2026-05-26 01:36:47.944346	2026-06-25	active	90e78eed-51f1-4c6a-82e7-255c1db9359f	2026-05-26 01:36:49.585245	2026-05-26 01:36:49.585247	t
VCH-DEMO-10-7A68F8	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	337d5017-4a96-4a58-bacf-c52aa9e49210	500000.00	2026-05-26 01:36:47.944481	2026-06-25	active	af376b43-ccb3-49e4-bcc5-25f7c51c95e2	2026-05-26 01:36:49.585257	2026-05-26 01:36:49.58526	t
VCH-DEMO-11-B88631	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	349b70da-c31f-423b-8a68-bd5c9b41d721	500000.00	2026-05-26 01:36:47.944583	2026-06-25	active	db3db13a-b561-48c4-9fe9-81d8ad7621d7	2026-05-26 01:36:49.58527	2026-05-26 01:36:49.585272	t
VCH-DEMO-12-E014D7	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	40302291-3d93-47e7-b428-042a8f0dc288	500000.00	2026-05-26 01:36:47.944686	2026-06-25	active	5b9cba93-0260-413c-959b-196dc4a8880a	2026-05-26 01:36:49.58528	2026-05-26 01:36:49.585282	t
VCH-DEMO-13-1BA108	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	469f36c5-6594-4fba-a57b-d56ad6d46ad5	500000.00	2026-05-26 01:36:47.944787	2026-06-25	active	c225e6c8-9964-4907-a9e0-01ee0f3ee48a	2026-05-26 01:36:49.58529	2026-05-26 01:36:49.585293	t
VCH-DEMO-14-7F2906	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	4adf1f16-1425-4007-977a-46210fbe3b71	500000.00	2026-05-26 01:36:47.94488	2026-06-25	active	ef451fb0-15aa-4e64-9665-865aa8ad7ef0	2026-05-26 01:36:49.585302	2026-05-26 01:36:49.585304	t
VCH-DEMO-15-D82FD1	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	4bfb7829-c282-4bc5-bf9a-95fde3610a00	500000.00	2026-05-26 01:36:47.945085	2026-06-25	active	49f49e65-91ef-4ede-8323-0e6ef687c204	2026-05-26 01:36:49.585312	2026-05-26 01:36:49.585315	t
VCH-DEMO-16-721B8C	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	58a91f83-e198-4fcc-8468-73a05806f13d	500000.00	2026-05-26 01:36:47.945207	2026-06-25	active	7e072b16-a125-4750-9ba9-ab5f5609f046	2026-05-26 01:36:49.585324	2026-05-26 01:36:49.585327	t
VCH-DEMO-17-FC67A9	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	5ad63a15-d27c-441c-b328-d3bfcd5cc61c	500000.00	2026-05-26 01:36:47.945312	2026-06-25	active	28630b88-db6c-475a-84b7-05dddd61e52f	2026-05-26 01:36:49.585335	2026-05-26 01:36:49.585338	t
VCH-DEMO-18-FE7356	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	5af3ff21-9117-4dfe-a529-513ba3f283c9	500000.00	2026-05-26 01:36:47.9454	2026-06-25	active	38c32d30-e9a8-4143-b675-09a5bb86a1c6	2026-05-26 01:36:49.585346	2026-05-26 01:36:49.585348	t
VCH-DEMO-19-A52606	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	5b8eac2f-b81c-4c1c-979f-c737bec15fa4	500000.00	2026-05-26 01:36:47.945484	2026-06-25	active	13174112-1527-4706-9052-d7d715227a51	2026-05-26 01:36:49.585359	2026-05-26 01:36:49.585361	t
VCH-DEMO-20-8A18C9	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	5eee11b1-cfa3-4fbe-88d1-b16343820a63	500000.00	2026-05-26 01:36:47.945574	2026-06-25	active	648f893b-ea8e-4983-a1c3-335cbb2840dc	2026-05-26 01:36:49.585372	2026-05-26 01:36:49.585374	t
VCH-DEMO-21-5033F0	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	5ef7fd94-2dc1-42f3-ad20-ca9098dbcd3b	500000.00	2026-05-26 01:36:47.945656	2026-06-25	active	5712293d-0cb4-45e8-b8c1-d6efc9411d75	2026-05-26 01:36:49.585382	2026-05-26 01:36:49.585385	t
VCH-DEMO-22-8693AE	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	6c7df20a-754e-4ef0-986b-5244d6603cbf	500000.00	2026-05-26 01:36:47.94576	2026-06-25	active	c2bc271d-be14-44ea-a8b2-73e38e9ba333	2026-05-26 01:36:49.585392	2026-05-26 01:36:49.585394	t
VCH-DEMO-23-6D6F93	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	7cd126ff-5212-4670-a727-8b1027c8c396	500000.00	2026-05-26 01:36:47.945894	2026-06-25	active	50b51baa-2e88-47ce-9e82-f08d5d924b28	2026-05-26 01:36:49.585402	2026-05-26 01:36:49.585405	t
VCH-DEMO-24-C0E9DD	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	818c79ba-3fa6-4d87-afcd-35b22585c0de	500000.00	2026-05-26 01:36:47.946033	2026-06-25	active	a956f296-c92b-483e-9f38-8ed44df74317	2026-05-26 01:36:49.585412	2026-05-26 01:36:49.585414	t
VCH-DEMO-25-98BDC6	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	85795914-3dd8-4683-981d-74aafeab9767	500000.00	2026-05-26 01:36:47.946129	2026-06-25	active	d7324688-198c-44d0-8713-f22febe96c86	2026-05-26 01:36:49.585422	2026-05-26 01:36:49.585423	t
VCH-DEMO-26-12FF7D	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	88864997-1e75-4cc0-8a7d-cdce9e455a58	500000.00	2026-05-26 01:36:47.94623	2026-06-25	active	1f307195-4ae5-4f6f-943b-2ca49f73d5cd	2026-05-26 01:36:49.585431	2026-05-26 01:36:49.585433	t
VCH-DEMO-27-2A86C8	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	8ac6def6-0242-4063-8fd3-e20efcca2252	500000.00	2026-05-26 01:36:47.946322	2026-06-25	active	a4010f2a-ed92-4ec8-a3d8-4fb8e710d5d7	2026-05-26 01:36:49.58544	2026-05-26 01:36:49.585442	t
VCH-DEMO-28-BAE01A	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	8d77e4b5-6d0b-4b31-813c-b84458c7d959	500000.00	2026-05-26 01:36:47.94642	2026-06-25	active	a7a6204a-4666-4d18-905a-30858e5e82d6	2026-05-26 01:36:49.585448	2026-05-26 01:36:49.58545	t
VCH-DEMO-29-6052C9	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	95e8f6b3-922c-48d7-b14a-b3360e76b335	500000.00	2026-05-26 01:36:47.946517	2026-06-25	active	d4a07120-255b-44b8-ba62-9668976fce4d	2026-05-26 01:36:49.585456	2026-05-26 01:36:49.585458	t
VCH-DEMO-30-F46FE8	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	9dea60c0-a948-41de-be5b-91bdcb308fa0	500000.00	2026-05-26 01:36:47.946598	2026-06-25	active	d30f73f4-e749-469c-bd58-280ee02f128c	2026-05-26 01:36:49.585466	2026-05-26 01:36:49.585469	t
VCH-DEMO-31-AB80FA	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	9f3b02e4-442f-44a7-910e-8cde0638e9c2	500000.00	2026-05-26 01:36:47.946664	2026-06-25	active	b7d9c42d-3ea2-4ef8-831a-460063d97268	2026-05-26 01:36:49.585477	2026-05-26 01:36:49.585479	t
VCH-DEMO-32-6B9CD8	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	9fcfd83d-0e24-469d-a65e-f35d426aa89b	500000.00	2026-05-26 01:36:47.946725	2026-06-25	active	824450f1-c272-4fa9-b4ed-ae1ee60c8f4d	2026-05-26 01:36:49.585513	2026-05-26 01:36:49.585516	t
VCH-DEMO-33-DEB35B	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	a144df2e-4702-4ca3-a7f2-7df3b4735cba	500000.00	2026-05-26 01:36:47.946788	2026-06-25	active	6ba5152e-0944-42eb-8a88-bfc64e4b76b7	2026-05-26 01:36:49.585527	2026-05-26 01:36:49.58553	t
VCH-DEMO-34-2A7658	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	a2261e9f-0d3d-43eb-8b8a-746332bc433e	500000.00	2026-05-26 01:36:47.946849	2026-06-25	active	dc71140e-e503-4f96-b630-addf1643db66	2026-05-26 01:36:49.585539	2026-05-26 01:36:49.585542	t
VCH-DEMO-35-B5D99A	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	a50de577-1796-4ced-a9e6-674e0e742249	500000.00	2026-05-26 01:36:47.946912	2026-06-25	active	5940d519-b5cb-4cd6-b642-ad769163690c	2026-05-26 01:36:49.585555	2026-05-26 01:36:49.585559	t
VCH-DEMO-36-FB7748	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	a6ad43c5-1533-47f2-8bbb-58f19e28cda5	500000.00	2026-05-26 01:36:47.946974	2026-06-25	active	e8321843-7427-4a98-bb19-5d67c4cae2ee	2026-05-26 01:36:49.585569	2026-05-26 01:36:49.585573	t
VCH-DEMO-37-B9E7A9	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	a7acd029-a1f0-4d8d-b5fe-671c683c46ed	500000.00	2026-05-26 01:36:47.947037	2026-06-25	active	b18a0bdc-5725-4592-ba87-143aa06f5102	2026-05-26 01:36:49.585585	2026-05-26 01:36:49.585588	t
VCH-DEMO-38-73E8A2	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	aa5a8d93-d5dc-45a7-afef-5834e144a51a	500000.00	2026-05-26 01:36:47.947102	2026-06-25	active	9720b044-862c-4af7-8fbf-3082b21aeac4	2026-05-26 01:36:49.585597	2026-05-26 01:36:49.5856	t
VCH-DEMO-39-9BDFD8	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	abb15c9b-5e89-4ce3-936f-bab39b40df1a	500000.00	2026-05-26 01:36:47.947168	2026-06-25	active	cc87310f-b9a2-4708-974d-f4f09b0b2c98	2026-05-26 01:36:49.585611	2026-05-26 01:36:49.585614	t
VCH-DEMO-40-7E22DC	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	b4c46d52-1e9f-4fca-a810-c53e818cf7ab	500000.00	2026-05-26 01:36:47.947237	2026-06-25	active	ac6777f6-05bc-4a31-9c91-95c7a8eba455	2026-05-26 01:36:49.585623	2026-05-26 01:36:49.585629	t
VCH-DEMO-41-01B7F7	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	b561a692-010d-4b7c-bacc-4afda3479df6	500000.00	2026-05-26 01:36:47.947304	2026-06-25	active	b8bd0300-32bb-410b-8fd5-6b63d79bb5cb	2026-05-26 01:36:49.585638	2026-05-26 01:36:49.585643	t
VCH-DEMO-42-F3B205	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	b802490b-9a20-4275-8c8d-6ebd070ade47	500000.00	2026-05-26 01:36:47.947375	2026-06-25	active	12f06a52-aebf-4eaa-9053-1eb866818d25	2026-05-26 01:36:49.585653	2026-05-26 01:36:49.585655	t
VCH-DEMO-43-9ADCA1	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	b905a724-7bf4-438e-9baf-e665875cb94e	500000.00	2026-05-26 01:36:47.947445	2026-06-25	active	0f6b7f17-b7ad-4fe2-8761-0a2b050c459a	2026-05-26 01:36:49.585666	2026-05-26 01:36:49.585668	t
VCH-DEMO-44-070B38	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	bd75ffb1-2496-4131-b95e-c2080114cf61	500000.00	2026-05-26 01:36:47.947562	2026-06-25	active	754e4778-25a6-4b5b-a813-9f53d017668c	2026-05-26 01:36:49.585679	2026-05-26 01:36:49.585682	t
VCH-DEMO-45-9B7D1E	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	c14884e2-907b-42ba-94c8-b535dc829c11	500000.00	2026-05-26 01:36:47.947628	2026-06-25	active	758f7124-2433-405d-a680-6d92f3f5daaf	2026-05-26 01:36:49.585692	2026-05-26 01:36:49.585697	t
VCH-DEMO-46-7A6351	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	ce89139c-34f6-47a0-94ff-9671c709f6d0	500000.00	2026-05-26 01:36:47.94769	2026-06-25	active	c59e1b69-b374-4377-8e86-eadd365d8298	2026-05-26 01:36:49.585706	2026-05-26 01:36:49.585709	t
VCH-DEMO-47-5CB4C8	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	cf4914f4-4dcc-48fc-a0f5-d90b4e2df1a2	500000.00	2026-05-26 01:36:47.947765	2026-06-25	active	6e3723c6-26c0-43bf-abef-affbf608e544	2026-05-26 01:36:49.585719	2026-05-26 01:36:49.585723	t
VCH-DEMO-48-CEE61B	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	d40684ee-5a18-4287-b9c5-cff426d577c4	500000.00	2026-05-26 01:36:47.947836	2026-06-25	active	c5966917-39ae-4eeb-9579-80709e72e211	2026-05-26 01:36:49.585735	2026-05-26 01:36:49.585738	t
VCH-DEMO-49-4BAE79	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	d40d8c70-55c7-45cc-8dad-ffb52e47dd3a	500000.00	2026-05-26 01:36:47.947901	2026-06-25	active	f95f8cc7-6184-4e27-8784-5dffc9cbeb67	2026-05-26 01:36:49.585749	2026-05-26 01:36:49.585753	t
VCH-DEMO-50-3F7BDC	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	d5a79831-f656-46fc-a42a-057a6d3e4491	500000.00	2026-05-26 01:36:47.947963	2026-06-25	active	481996dd-f647-4afa-a5ef-7b97bf689133	2026-05-26 01:36:49.585765	2026-05-26 01:36:49.585768	t
VCH-DEMO-51-78DECD	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	d6a01f08-6c26-4508-88c0-fa8f7732e0dd	500000.00	2026-05-26 01:36:47.948024	2026-06-25	active	d867ef86-4768-4315-a418-7b5d12b51838	2026-05-26 01:36:49.58578	2026-05-26 01:36:49.585783	t
VCH-DEMO-52-8D2549	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	dccba563-53b7-4542-b9c3-9d634f3bdc5a	500000.00	2026-05-26 01:36:47.948086	2026-06-25	active	a331a856-b545-4f57-9d44-13fc4c82aa1d	2026-05-26 01:36:49.585792	2026-05-26 01:36:49.585797	t
VCH-DEMO-53-35B771	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	dce7d4a5-033b-481a-acd8-baed5320a49d	500000.00	2026-05-26 01:36:47.948148	2026-06-25	active	a5121b02-59a9-47bf-9e73-dbd271cd0594	2026-05-26 01:36:49.585805	2026-05-26 01:36:49.585811	t
VCH-DEMO-54-D49534	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	dda2a3f1-b22f-4df9-8110-3e18c9985bd7	500000.00	2026-05-26 01:36:47.948215	2026-06-25	active	b7aa2980-d58c-4303-bd21-01098db183f8	2026-05-26 01:36:49.585819	2026-05-26 01:36:49.585821	t
VCH-DEMO-55-134811	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	de5700b7-02b2-4be4-8aaa-ddcb19045cdd	500000.00	2026-05-26 01:36:47.948281	2026-06-25	active	02360484-5b56-46c8-a1b8-a17ab7b0740c	2026-05-26 01:36:49.585832	2026-05-26 01:36:49.585835	t
VCH-DEMO-56-5DDA94	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	e27dea50-b000-4ffa-ae75-1cb67f5d5236	500000.00	2026-05-26 01:36:47.948342	2026-06-25	active	3db88205-8b9a-468c-92b5-66fd9abef335	2026-05-26 01:36:49.585847	2026-05-26 01:36:49.58585	t
VCH-DEMO-57-A2B7CE	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	e7040ad7-0c16-4c5a-b07a-6fff6a4f7272	500000.00	2026-05-26 01:36:47.948408	2026-06-25	active	399cf23b-7782-421f-a3c7-48124ee9d934	2026-05-26 01:36:49.585858	2026-05-26 01:36:49.58586	t
VCH-DEMO-58-E51933	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	e7e32a97-5638-4152-877a-e8649a7b54b3	500000.00	2026-05-26 01:36:47.948494	2026-06-25	active	d0c406fb-ca9e-46a1-8ce3-f0dbb8d71723	2026-05-26 01:36:49.585867	2026-05-26 01:36:49.58587	t
VCH-DEMO-59-A080CB	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	ebcbd77f-d522-4821-acf0-17fbb632e7f6	500000.00	2026-05-26 01:36:47.948564	2026-06-25	active	8398c68b-a09b-4469-8a12-aa3848be5616	2026-05-26 01:36:49.585882	2026-05-26 01:36:49.585884	t
VCH-DEMO-60-09017A	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	f0705036-7d9c-4244-925f-d1054cf426c8	500000.00	2026-05-26 01:36:47.94866	2026-06-25	active	a2071644-fe63-4166-8055-14d75c97aa92	2026-05-26 01:36:49.585891	2026-05-26 01:36:49.585896	t
VCH-DEMO-61-ECD60D	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	f673d639-c180-493b-94e1-53198b73ccb0	500000.00	2026-05-26 01:36:47.948757	2026-06-25	active	7e7557ea-0d7e-4e38-9a86-65126d2cca6d	2026-05-26 01:36:49.585909	2026-05-26 01:36:49.585911	t
VCH-DEMO-62-2912E1	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	fc0fe551-cbf5-4a66-807d-7a5f2ad1c54b	500000.00	2026-05-26 01:36:47.948848	2026-06-25	active	df8293ac-fdd6-4e4e-aa0a-c1051cfcb84f	2026-05-26 01:36:49.58592	2026-05-26 01:36:49.585923	t
VCH-DEMO-63-5C6400	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	fefff3f3-b57d-43f0-9103-d35c5b6c97ba	500000.00	2026-05-26 01:36:47.948944	2026-06-25	active	4d716f39-df1a-4e2d-ae05-31f317001a32	2026-05-26 01:36:49.585939	2026-05-26 01:36:49.585941	t
VCH-DEMO-64-1A671A	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	ffe5c004-bed7-4d8d-b13d-70002279d191	500000.00	2026-05-26 01:36:47.949034	2026-06-25	active	4bad2c66-39a1-4f0b-98c3-80b1285ba713	2026-05-26 01:36:49.585953	2026-05-26 01:36:49.585956	t
\.


--
-- Data for Name: wallet_allocations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wallet_allocations (beneficiary_id, donation_id, original_amount, remaining_amount, allocated_at, expires_at, status, id, created_at, updated_at, is_active) FROM stdin;
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	06f0baba-8a07-4567-a108-c0068e5f3678	1000000.00	1000000.00	2026-05-22 09:00:03.242787	2026-08-20 09:00:03.242766	active	198dd376-9406-48d1-93d5-d91d54dae90f	2026-05-22 09:00:03.486644	2026-05-22 09:00:03.486651	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	25b1c35e-3b29-43be-9b65-d8a48cef7a3f	500000.00	500000.00	2026-05-22 09:00:07.808755	2026-08-20 09:00:07.808748	active	cd73d64f-3385-4e9c-a819-bc0d49d8ff40	2026-05-22 09:00:07.982582	2026-05-22 09:00:07.982584	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	f673d639-c180-493b-94e1-53198b73ccb0	500000.00	500000.00	2026-05-22 09:00:11.601357	2026-08-20 09:00:11.601344	active	f1c5a299-58fd-4b8a-b7aa-476f332e93a8	2026-05-22 09:00:11.850595	2026-05-22 09:00:11.850599	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	099847e9-9e77-46ef-a2b1-80bdfb8913ba	136923.08	136923.08	2026-06-18 09:00:44.188013	2026-09-16 09:00:44.187998	active	af9e7ae7-ff36-4e09-9ddf-b8223a2617f3	2026-06-18 09:00:44.427944	2026-06-18 09:00:44.427947	t
82147428-e16e-4ed8-9f62-bd5353a1b288	099847e9-9e77-46ef-a2b1-80bdfb8913ba	81538.46	81538.46	2026-06-18 09:00:44.90177	2026-09-16 09:00:44.901756	active	d3e56099-e544-4f84-9f31-211a5b6944ad	2026-06-18 09:00:45.139431	2026-06-18 09:00:45.139434	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	9c941504-f0cc-4eb1-93ae-db2b43e25a23	136923.08	136923.08	2026-06-18 09:00:45.362948	2026-09-16 09:00:45.362939	active	1e15e8e1-08f0-4fe7-82c1-43a5a679f77f	2026-06-18 09:00:45.544169	2026-06-18 09:00:45.544174	t
c5a8b3e9-5677-4577-aabc-a25446f0ae61	f79fbeab-ba4b-4759-acd8-2c31192e18cb	250000.00	250000.00	2026-05-27 09:00:00.257234	2026-08-25 09:00:00.257227	active	cc2a0662-d0df-41ce-9343-c92d0918e49e	2026-05-27 09:00:00.265761	2026-05-27 09:00:00.265764	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	f79fbeab-ba4b-4759-acd8-2c31192e18cb	250000.00	250000.00	2026-05-27 09:00:00.294495	2026-08-25 09:00:00.294489	active	b50be70b-6cf7-4d4b-a5cb-99fd4631fe3c	2026-05-27 09:00:00.298587	2026-05-27 09:00:00.298589	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	099847e9-9e77-46ef-a2b1-80bdfb8913ba	81538.46	81538.46	2026-06-18 09:00:45.850689	2026-09-16 09:00:45.850675	active	b21e54b3-edc1-4419-af97-615048db8533	2026-06-18 09:00:46.09086	2026-06-18 09:00:46.090866	t
82147428-e16e-4ed8-9f62-bd5353a1b288	9c941504-f0cc-4eb1-93ae-db2b43e25a23	81538.46	81538.46	2026-06-18 09:00:45.905172	2026-09-16 09:00:45.905162	active	b931812f-6153-40e2-891a-47867450a818	2026-06-18 09:00:47.725526	2026-06-18 09:00:47.725529	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	9c941504-f0cc-4eb1-93ae-db2b43e25a23	81538.46	81538.46	2026-06-18 09:00:48.26735	2026-09-16 09:00:48.26734	active	2452c7f6-820e-4af3-92f2-8286eaa08e01	2026-06-18 09:00:48.44815	2026-06-18 09:00:48.448153	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	61b6a05b-8f9d-420f-83ae-f0abed7644a6	136923.08	136923.08	2026-06-18 09:00:51.644878	2026-09-16 09:00:51.644868	active	a78b0f1d-61e4-4360-acac-fed1473b4da9	2026-06-18 09:00:51.885689	2026-06-18 09:00:51.885693	t
82147428-e16e-4ed8-9f62-bd5353a1b288	61b6a05b-8f9d-420f-83ae-f0abed7644a6	81538.46	81538.46	2026-06-18 09:00:52.366248	2026-09-16 09:00:52.366235	active	0ae8e165-9fed-42e9-9608-6af7f6ed945a	2026-06-18 09:00:52.6059	2026-06-18 09:00:52.605904	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	014676af-716c-433e-92c2-a62f22125d8b	136923.08	136923.08	2026-06-18 09:00:52.73204	2026-09-16 09:00:52.732029	active	ff14e9da-4322-4cf5-9086-a3c93f5fc38a	2026-06-18 09:00:52.912557	2026-06-18 09:00:52.912561	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	61b6a05b-8f9d-420f-83ae-f0abed7644a6	81538.46	81538.46	2026-06-18 09:00:53.325031	2026-09-16 09:00:53.325018	active	69a7db7d-feca-4030-92bb-629e65a260a1	2026-06-18 09:00:53.565677	2026-06-18 09:00:53.565681	t
82147428-e16e-4ed8-9f62-bd5353a1b288	014676af-716c-433e-92c2-a62f22125d8b	81538.46	81538.46	2026-06-18 09:00:53.269209	2026-09-16 09:00:53.2692	active	cd542c58-4e1d-4a84-8af5-f6f4db9defc0	2026-06-18 09:00:55.211394	2026-06-18 09:00:55.211398	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	de5700b7-02b2-4be4-8aaa-ddcb19045cdd	1000000.00	788000.00	2026-05-22 09:00:02.534577	2026-08-20 09:00:02.534569	active	dfc70f96-a04b-47a5-956b-0eb7a3ff7973	2026-05-22 09:00:02.713023	2026-06-17 02:55:11.82581	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	5d3a36d9-8242-4b60-916e-87049f812983	228205.13	228205.13	2026-06-18 09:00:02.517415	2026-09-16 09:00:02.517405	active	62f378ab-0bfc-4420-be00-0d9767842abc	2026-06-18 09:00:02.70263	2026-06-18 09:00:02.702634	t
82147428-e16e-4ed8-9f62-bd5353a1b288	5d3a36d9-8242-4b60-916e-87049f812983	135897.44	135897.44	2026-06-18 09:00:03.070345	2026-09-16 09:00:03.070335	active	88c62617-c32a-4de2-a577-f694998b5c90	2026-06-18 09:00:03.247929	2026-06-18 09:00:03.247933	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	936aa129-a7c1-4509-bbe5-a0415208e2b5	228205.13	228205.13	2026-06-18 09:00:03.295532	2026-09-16 09:00:03.295519	active	3afc5b1c-369e-4ff1-acf8-bf28bd2106d3	2026-06-18 09:00:03.536997	2026-06-18 09:00:03.537002	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	5d3a36d9-8242-4b60-916e-87049f812983	135897.43	135897.43	2026-06-18 09:00:03.792011	2026-09-16 09:00:03.792001	active	602c123e-7bd3-4a09-9694-145c7a98731f	2026-06-18 09:00:03.968111	2026-06-18 09:00:03.968115	t
82147428-e16e-4ed8-9f62-bd5353a1b288	936aa129-a7c1-4509-bbe5-a0415208e2b5	135897.44	135897.44	2026-06-18 09:00:04.012549	2026-09-16 09:00:04.012534	active	1ccdbac7-6133-4888-97ae-89fc1ec019db	2026-06-18 09:00:05.230904	2026-06-18 09:00:05.230908	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	936aa129-a7c1-4509-bbe5-a0415208e2b5	135897.43	135897.43	2026-06-18 09:00:05.950466	2026-09-16 09:00:05.950452	active	59c77e51-5c7f-4bf4-ad82-f4b6fd966535	2026-06-18 09:00:06.188276	2026-06-18 09:00:06.188282	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	9f4287b7-86e1-481e-995e-537809c5a1c5	228205.13	228205.13	2026-06-18 09:00:10.400469	2026-09-16 09:00:10.40046	active	7558914a-2d7b-462f-bfdd-b540df12541f	2026-06-18 09:00:10.585041	2026-06-18 09:00:10.585047	t
82147428-e16e-4ed8-9f62-bd5353a1b288	9f4287b7-86e1-481e-995e-537809c5a1c5	135897.44	135897.44	2026-06-18 09:00:10.951295	2026-09-16 09:00:10.951285	active	94d887b0-107c-4540-a6a5-ecb192118895	2026-06-18 09:00:11.134885	2026-06-18 09:00:11.134889	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	9f4287b7-86e1-481e-995e-537809c5a1c5	135897.43	135897.43	2026-06-18 09:00:11.680252	2026-09-16 09:00:11.680242	active	81d9c8bb-3574-40fd-8bb2-6e70071e980a	2026-06-18 09:00:11.861301	2026-06-18 09:00:11.861305	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	01308c41-9583-4c3c-b9ed-8fe65b2a7940	228205.13	228205.13	2026-06-18 09:00:14.192511	2026-09-16 09:00:14.192501	active	2538aef5-3ac0-42b3-bf1c-12c8a0fd3399	2026-06-18 09:00:14.434979	2026-06-18 09:00:14.434984	t
82147428-e16e-4ed8-9f62-bd5353a1b288	01308c41-9583-4c3c-b9ed-8fe65b2a7940	135897.44	135897.44	2026-06-18 09:00:14.914736	2026-09-16 09:00:14.914724	active	44ec9bea-933c-4835-984f-28628661ba7a	2026-06-18 09:00:15.154746	2026-06-18 09:00:15.15475	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	01308c41-9583-4c3c-b9ed-8fe65b2a7940	135897.43	135897.43	2026-06-18 09:00:15.877226	2026-09-16 09:00:15.877214	active	d4d4523c-b01e-4c49-8c7d-aabaa98a3479	2026-06-18 09:00:16.119108	2026-06-18 09:00:16.119114	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	7be12ae1-a611-4fe0-b9aa-3b6eb928af15	228205.13	228205.13	2026-06-18 09:00:16.374954	2026-09-16 09:00:16.374943	active	3bd4f54c-effb-4bf5-87e0-7fca64061bed	2026-06-18 09:00:16.556903	2026-06-18 09:00:16.556908	t
82147428-e16e-4ed8-9f62-bd5353a1b288	7be12ae1-a611-4fe0-b9aa-3b6eb928af15	135897.44	135897.44	2026-06-18 09:00:16.917594	2026-09-16 09:00:16.917585	active	6958c516-9b6c-49a5-8f7c-3f691aa48c31	2026-06-18 09:00:17.772201	2026-06-18 09:00:17.772204	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	7be12ae1-a611-4fe0-b9aa-3b6eb928af15	135897.43	135897.43	2026-06-18 09:00:18.313314	2026-09-16 09:00:18.313305	active	c5b7525d-0758-4991-b12c-c804ca168a3e	2026-06-18 09:00:18.496371	2026-06-18 09:00:18.496375	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	1db8f6d6-455c-4805-9ff4-b2f07e3ea429	228205.13	228205.13	2026-06-18 09:00:21.701731	2026-09-16 09:00:21.701713	active	92c68981-6906-4109-901e-a131df634d2e	2026-06-18 09:00:21.943607	2026-06-18 09:00:21.943611	t
82147428-e16e-4ed8-9f62-bd5353a1b288	1db8f6d6-455c-4805-9ff4-b2f07e3ea429	135897.44	135897.44	2026-06-18 09:00:22.42587	2026-09-16 09:00:22.425857	active	d14cd6f7-df74-4074-91e8-0860b33faf09	2026-06-18 09:00:22.667051	2026-06-18 09:00:22.667056	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	071fd337-25ab-4481-961f-dd7b40005ad7	228205.13	228205.13	2026-06-18 09:00:22.827972	2026-09-16 09:00:22.827965	active	1c50390b-92c9-4bbf-9063-b990d740c392	2026-06-18 09:00:23.012321	2026-06-18 09:00:23.012325	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	1db8f6d6-455c-4805-9ff4-b2f07e3ea429	135897.43	135897.43	2026-06-18 09:00:23.393157	2026-09-16 09:00:23.393146	active	41ec5a86-4ea9-430f-aec2-5672ff132923	2026-06-18 09:00:23.634361	2026-06-18 09:00:23.634366	t
82147428-e16e-4ed8-9f62-bd5353a1b288	071fd337-25ab-4481-961f-dd7b40005ad7	135897.44	135897.44	2026-06-18 09:00:23.376561	2026-09-16 09:00:23.376552	active	cc45ae94-b217-42dd-b12b-68a363f87ae0	2026-06-18 09:00:25.286408	2026-06-18 09:00:25.286412	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	071fd337-25ab-4481-961f-dd7b40005ad7	135897.43	135897.43	2026-06-18 09:00:25.832525	2026-09-16 09:00:25.832516	active	6950091b-05d4-4102-bdad-a8f8021b3dca	2026-06-18 09:00:26.014134	2026-06-18 09:00:26.014137	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	f007265a-f485-4156-a608-911ae1f3ec96	228205.13	228205.13	2026-06-18 09:00:29.230196	2026-09-16 09:00:29.230183	active	918f6aa6-ac4c-46d8-afbf-98e5e00651c3	2026-06-18 09:00:29.4788	2026-06-18 09:00:29.478805	t
82147428-e16e-4ed8-9f62-bd5353a1b288	f007265a-f485-4156-a608-911ae1f3ec96	135897.44	135897.44	2026-06-18 09:00:29.983069	2026-09-16 09:00:29.983057	active	e4a674b3-830d-4a5a-b644-2b61b7c1e30e	2026-06-18 09:00:30.233228	2026-06-18 09:00:30.233233	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	24bbf22c-320f-453d-89c2-81b64d29bca4	228205.13	228205.13	2026-06-18 09:00:30.343792	2026-09-16 09:00:30.343782	active	82b3deed-79f5-4c62-8ca8-a8871d8eaa1e	2026-06-18 09:00:30.520274	2026-06-18 09:00:30.520278	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	f007265a-f485-4156-a608-911ae1f3ec96	135897.43	135897.43	2026-06-18 09:00:30.990415	2026-09-16 09:00:30.990353	active	370577af-7b6b-4f3b-9105-26530eedc57e	2026-06-18 09:00:31.240851	2026-06-18 09:00:31.240856	t
82147428-e16e-4ed8-9f62-bd5353a1b288	24bbf22c-320f-453d-89c2-81b64d29bca4	135897.44	135897.44	2026-06-18 09:00:30.875005	2026-09-16 09:00:30.874996	active	17f6ae04-a4f4-47a4-90e4-d16a98f8cde9	2026-06-18 09:00:32.942049	2026-06-18 09:00:32.942053	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	24bbf22c-320f-453d-89c2-81b64d29bca4	135897.43	135897.43	2026-06-18 09:00:33.471226	2026-09-16 09:00:33.471217	active	c9beb6bd-bdb6-4889-9f14-2092969d4dcf	2026-06-18 09:00:33.647479	2026-06-18 09:00:33.647482	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	cc704126-b180-4017-a45e-31a5f6502379	228205.13	228205.13	2026-06-18 09:00:36.795827	2026-09-16 09:00:36.795818	active	ff9bcea7-fb94-4c66-9265-0aee150609cf	2026-06-18 09:00:37.035576	2026-06-18 09:00:37.035581	t
82147428-e16e-4ed8-9f62-bd5353a1b288	cc704126-b180-4017-a45e-31a5f6502379	135897.44	135897.44	2026-06-18 09:00:37.511285	2026-09-16 09:00:37.511272	active	cd20394a-be21-4602-b258-0f069a16a512	2026-06-18 09:00:37.751382	2026-06-18 09:00:37.751387	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	464fad88-e8b9-4084-bb86-7b1c32d83bd3	136923.08	136923.08	2026-06-18 09:00:37.893012	2026-09-16 09:00:37.893002	active	0e9d7b16-436d-4f66-b1e6-eb449bfcb5ed	2026-06-18 09:00:38.072052	2026-06-18 09:00:38.072055	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	cc704126-b180-4017-a45e-31a5f6502379	135897.43	135897.43	2026-06-18 09:00:38.466203	2026-09-16 09:00:38.466191	active	968473b7-afe8-49c5-aff4-28c285099a4c	2026-06-18 09:00:38.706081	2026-06-18 09:00:38.706086	t
82147428-e16e-4ed8-9f62-bd5353a1b288	464fad88-e8b9-4084-bb86-7b1c32d83bd3	81538.46	81538.46	2026-06-18 09:00:38.423882	2026-09-16 09:00:38.423871	active	4cb6c0c9-40d5-4967-9847-5baeabb46ab1	2026-06-18 09:00:40.344875	2026-06-18 09:00:40.344879	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	464fad88-e8b9-4084-bb86-7b1c32d83bd3	81538.46	81538.46	2026-06-18 09:00:40.873486	2026-09-16 09:00:40.873478	active	ee16a992-146e-48f4-ae78-7294a70a6a7b	2026-06-18 09:00:41.049594	2026-06-18 09:00:41.049599	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	014676af-716c-433e-92c2-a62f22125d8b	81538.46	81538.46	2026-06-18 09:00:55.749887	2026-09-16 09:00:55.74988	active	913ebb0c-9db5-4722-b90d-e6faa06f71a0	2026-06-18 09:00:55.928644	2026-06-18 09:00:55.928648	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	b3d63a50-2e9a-4b98-b718-8cd47a075df8	136923.08	136923.08	2026-06-18 09:00:59.081764	2026-09-16 09:00:59.081753	active	4f86d929-0a72-4780-9054-64de1b0f2060	2026-06-18 09:00:59.322669	2026-06-18 09:00:59.322674	t
82147428-e16e-4ed8-9f62-bd5353a1b288	b3d63a50-2e9a-4b98-b718-8cd47a075df8	81538.46	81538.46	2026-06-18 09:00:59.807374	2026-09-16 09:00:59.807363	active	eb8d69eb-075a-4e18-83da-4b6288590068	2026-06-18 09:01:00.049618	2026-06-18 09:01:00.049648	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	a496e7fc-4993-4823-9f05-e3f0d112fc2d	136923.08	136923.08	2026-06-18 09:01:00.22523	2026-09-16 09:01:00.225221	active	7d745ded-0fc3-4c52-ab0d-4bed21910709	2026-06-18 09:01:00.408826	2026-06-18 09:01:00.40883	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	b3d63a50-2e9a-4b98-b718-8cd47a075df8	81538.46	81538.46	2026-06-18 09:01:00.775908	2026-09-16 09:01:00.775896	active	5e4ac4bb-0c78-4e57-baf4-dc515f434f57	2026-06-18 09:01:01.017082	2026-06-18 09:01:01.017086	t
82147428-e16e-4ed8-9f62-bd5353a1b288	a496e7fc-4993-4823-9f05-e3f0d112fc2d	81538.46	81538.46	2026-06-18 09:01:00.771642	2026-09-16 09:01:00.771633	active	26c73fe4-97d3-4ac0-9809-e31ca347c961	2026-06-18 09:01:02.669976	2026-06-18 09:01:02.669979	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	a496e7fc-4993-4823-9f05-e3f0d112fc2d	81538.46	81538.46	2026-06-18 09:01:03.216964	2026-09-16 09:01:03.216954	active	7c6a2b0d-6811-4eed-a38b-835ee33b1bc3	2026-06-18 09:01:03.398395	2026-06-18 09:01:03.398399	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	6a967c39-661f-4c9d-8613-335324ecad18	136923.08	136923.08	2026-06-18 09:01:06.615551	2026-09-16 09:01:06.615535	active	556cb9a2-f7fb-44b7-b4f7-a4a38e088c9a	2026-06-18 09:01:06.868476	2026-06-18 09:01:06.86848	t
82147428-e16e-4ed8-9f62-bd5353a1b288	6a967c39-661f-4c9d-8613-335324ecad18	81538.46	81538.46	2026-06-18 09:01:07.367132	2026-09-16 09:01:07.367119	active	492a150c-eba8-42b7-acd0-ecc5aa3f8dca	2026-06-18 09:01:07.617813	2026-06-18 09:01:07.617817	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	6a967c39-661f-4c9d-8613-335324ecad18	81538.46	81538.46	2026-06-18 09:01:08.364713	2026-09-16 09:01:08.364702	active	b43a26da-7a59-4f9a-8ece-6eb51be7581a	2026-06-18 09:01:08.616379	2026-06-18 09:01:08.616383	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	6528615d-7a91-46ab-b796-a946f4d9a4b0	136923.08	136923.08	2026-06-18 09:01:14.210491	2026-09-16 09:01:14.210477	active	d0c9991d-c52e-4652-9221-67d341f04cf4	2026-06-18 09:01:14.449648	2026-06-18 09:01:14.449656	t
82147428-e16e-4ed8-9f62-bd5353a1b288	6528615d-7a91-46ab-b796-a946f4d9a4b0	81538.46	81538.46	2026-06-18 09:01:14.928249	2026-09-16 09:01:14.928236	active	d716e24d-2a4f-42a3-b783-271fb826bc57	2026-06-18 09:01:15.1708	2026-06-18 09:01:15.170804	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	6528615d-7a91-46ab-b796-a946f4d9a4b0	81538.46	81538.46	2026-06-18 09:01:15.886812	2026-09-16 09:01:15.886804	active	9cc60081-458f-4811-93fd-3b6dcd73afe3	2026-06-18 09:01:16.125102	2026-06-18 09:01:16.125107	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	764d9e55-75d7-40bb-9479-d750046a1305	136923.08	136923.08	2026-06-18 09:01:21.609979	2026-09-16 09:01:21.609969	active	865bf1cd-9de8-47ff-ba9e-b1d2bb0adeb4	2026-06-18 09:01:21.849689	2026-06-18 09:01:21.849693	t
82147428-e16e-4ed8-9f62-bd5353a1b288	764d9e55-75d7-40bb-9479-d750046a1305	81538.46	81538.46	2026-06-18 09:01:22.324205	2026-09-16 09:01:22.324196	active	45291456-d781-4308-9f9c-c9d6bd435bf2	2026-06-18 09:01:22.561321	2026-06-18 09:01:22.561325	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	764d9e55-75d7-40bb-9479-d750046a1305	81538.46	81538.46	2026-06-18 09:01:23.274487	2026-09-16 09:01:23.274474	active	38ab113e-d1db-4b8f-8d85-cb643f9d7b35	2026-06-18 09:01:23.512262	2026-06-18 09:01:23.512266	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	340d8c53-c510-4ffd-89e9-e2fdd59fc49c	136923.08	136923.08	2026-06-18 09:01:07.688597	2026-09-16 09:01:07.688588	active	9e348f3d-c493-48ba-889f-0dc704afe6ff	2026-06-18 09:01:07.867596	2026-06-18 09:01:07.8676	t
82147428-e16e-4ed8-9f62-bd5353a1b288	340d8c53-c510-4ffd-89e9-e2fdd59fc49c	81538.46	81538.46	2026-06-18 09:01:08.219504	2026-09-16 09:01:08.219495	active	5ae43151-2534-4de7-8532-411d7b5ce59a	2026-06-18 09:01:10.336834	2026-06-18 09:01:10.336838	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	340d8c53-c510-4ffd-89e9-e2fdd59fc49c	81538.46	81538.46	2026-06-18 09:01:10.866492	2026-09-16 09:01:10.866481	active	f625c5d0-1b16-4711-9d42-fb362bd0fd45	2026-06-18 09:01:11.042525	2026-06-18 09:01:11.042529	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	45b4cde2-9380-4f5d-a0e9-eb54e894a38b	136923.08	136923.08	2026-06-18 09:01:15.285965	2026-09-16 09:01:15.285956	active	0bdaf3b4-673d-40d6-801f-804fe1080b85	2026-06-18 09:01:15.461989	2026-06-18 09:01:15.461993	t
82147428-e16e-4ed8-9f62-bd5353a1b288	45b4cde2-9380-4f5d-a0e9-eb54e894a38b	81538.46	81538.46	2026-06-18 09:01:15.812985	2026-09-16 09:01:15.812975	active	aa5bc2d2-fba1-4b6e-9d9d-29e41bcded85	2026-06-18 09:01:17.763407	2026-06-18 09:01:17.763411	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	45b4cde2-9380-4f5d-a0e9-eb54e894a38b	81538.46	81538.46	2026-06-18 09:01:18.291016	2026-09-16 09:01:18.291004	active	93934acc-f074-41a7-a0ec-fdb29696b804	2026-06-18 09:01:18.467118	2026-06-18 09:01:18.467123	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	abbf0207-8a3d-4bd0-b976-5f54e24cad93	136923.08	136923.08	2026-06-18 09:01:22.774353	2026-09-16 09:01:22.774343	active	373306a8-9be5-4113-85a4-54d75a229bff	2026-06-18 09:01:22.955396	2026-06-18 09:01:22.955398	t
82147428-e16e-4ed8-9f62-bd5353a1b288	abbf0207-8a3d-4bd0-b976-5f54e24cad93	81538.46	81538.46	2026-06-18 09:01:23.316614	2026-09-16 09:01:23.316603	active	6c009b92-be93-4c4e-9d53-3cc23394a436	2026-06-18 09:01:25.143985	2026-06-18 09:01:25.143988	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	abbf0207-8a3d-4bd0-b976-5f54e24cad93	81538.46	81538.46	2026-06-18 09:01:25.685748	2026-09-16 09:01:25.685738	active	07c0101d-cb17-40e2-9a5c-07fcac88c2ee	2026-06-18 09:01:25.866559	2026-06-18 09:01:25.866564	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	011684ff-afc9-4a06-bfd7-8f223b0b6206	136923.08	136923.08	2026-06-18 09:01:29.068533	2026-09-16 09:01:29.06852	active	3e72eda5-0af6-4e94-b2c8-82eeed87b3fe	2026-06-18 09:01:29.311378	2026-06-18 09:01:29.311384	t
82147428-e16e-4ed8-9f62-bd5353a1b288	011684ff-afc9-4a06-bfd7-8f223b0b6206	81538.46	81538.46	2026-06-18 09:01:29.803214	2026-09-16 09:01:29.803202	active	1f0ef357-0528-4bd0-9075-0b246f9e2c7e	2026-06-18 09:01:30.04398	2026-06-18 09:01:30.043985	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	d3708f0a-3bbe-4f35-9ca7-1358f8d0f7c8	136923.08	136923.08	2026-06-18 09:01:30.158826	2026-09-16 09:01:30.158817	active	a43f81f2-7e50-4852-bdb2-9fab0ab75f0c	2026-06-18 09:01:30.337769	2026-06-18 09:01:30.337772	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	011684ff-afc9-4a06-bfd7-8f223b0b6206	81538.46	81538.46	2026-06-18 09:01:30.767241	2026-09-16 09:01:30.767227	active	1a18eda2-1b0f-40db-bf5a-ef8363a33906	2026-06-18 09:01:31.007967	2026-06-18 09:01:31.007972	t
82147428-e16e-4ed8-9f62-bd5353a1b288	d3708f0a-3bbe-4f35-9ca7-1358f8d0f7c8	81538.46	81538.46	2026-06-18 09:01:30.696261	2026-09-16 09:01:30.69625	active	90f72ac1-3b56-4fd9-a573-0dc53c72c10a	2026-06-18 09:01:32.65108	2026-06-18 09:01:32.651084	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	d3708f0a-3bbe-4f35-9ca7-1358f8d0f7c8	81538.46	81538.46	2026-06-18 09:01:33.187041	2026-09-16 09:01:33.18703	active	e4b9c086-0570-461e-b34b-49d258763c92	2026-06-18 09:01:33.365984	2026-06-18 09:01:33.365988	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	63932533-22db-46e7-b61c-f11816c8fd3d	136923.08	136923.08	2026-06-18 09:01:36.523581	2026-09-16 09:01:36.523569	active	d5936555-a9dd-4d74-839d-b169922d4e83	2026-06-18 09:01:36.765664	2026-06-18 09:01:36.765669	t
82147428-e16e-4ed8-9f62-bd5353a1b288	63932533-22db-46e7-b61c-f11816c8fd3d	81538.46	81538.46	2026-06-18 09:01:37.246359	2026-09-16 09:01:37.246349	active	c33068e5-6ddb-43ef-9761-7c8296eeeb09	2026-06-18 09:01:37.486706	2026-06-18 09:01:37.48671	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	a715d5c6-811e-4655-b1f9-0922b7772f0f	136923.08	136923.08	2026-06-18 09:01:37.687154	2026-09-16 09:01:37.687147	active	04c069be-ea88-422a-9419-f0aa3e0f344b	2026-06-18 09:01:37.86941	2026-06-18 09:01:37.869414	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	63932533-22db-46e7-b61c-f11816c8fd3d	81538.46	81538.46	2026-06-18 09:01:38.211877	2026-09-16 09:01:38.211869	active	a6e7e5a0-165b-4985-ab33-fa89502d4bce	2026-06-18 09:01:38.454288	2026-06-18 09:01:38.454293	t
82147428-e16e-4ed8-9f62-bd5353a1b288	a715d5c6-811e-4655-b1f9-0922b7772f0f	81538.46	81538.46	2026-06-18 09:01:38.232969	2026-09-16 09:01:38.232961	active	883984ac-e7ac-414e-baf9-c2bc3fa5f11a	2026-06-18 09:01:40.11284	2026-06-18 09:01:40.112844	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	a715d5c6-811e-4655-b1f9-0922b7772f0f	81538.46	81538.46	2026-06-18 09:01:40.657676	2026-09-16 09:01:40.657665	active	f26406d1-2703-47a3-815d-7918b62efff9	2026-06-18 09:01:40.839097	2026-06-18 09:01:40.839101	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	620b45e9-0097-4083-9ec4-f88818161241	136923.08	136923.08	2026-06-18 09:01:44.05776	2026-09-16 09:01:44.057747	active	2dc93ebf-af2a-4c6f-b368-8ce33f3e5b00	2026-06-18 09:01:44.31468	2026-06-18 09:01:44.314684	t
82147428-e16e-4ed8-9f62-bd5353a1b288	620b45e9-0097-4083-9ec4-f88818161241	81538.46	81538.46	2026-06-18 09:01:44.810689	2026-09-16 09:01:44.810679	active	d2f5daa8-10d6-4b41-a162-2932158d76c6	2026-06-18 09:01:45.062743	2026-06-18 09:01:45.062748	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	620b45e9-0097-4083-9ec4-f88818161241	81538.46	81538.46	2026-06-18 09:01:45.811726	2026-09-16 09:01:45.811715	active	83ea392c-3bbf-40c4-a15d-848af255cbee	2026-06-18 09:01:46.066022	2026-06-18 09:01:46.066028	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	5e9d5e2f-cb18-4466-9b03-b4e3f668ce06	228205.13	228205.13	2026-06-21 09:00:02.601748	2026-09-19 09:00:02.601738	active	f427c2a6-079c-4b28-b76d-d4478cb01580	2026-06-21 09:00:02.794603	2026-06-21 09:00:02.794607	t
82147428-e16e-4ed8-9f62-bd5353a1b288	5e9d5e2f-cb18-4466-9b03-b4e3f668ce06	135897.44	135897.44	2026-06-21 09:00:03.210582	2026-09-19 09:00:03.210574	active	e8fb7d81-c0e5-4fa4-ab2f-b29a6423f715	2026-06-21 09:00:03.398443	2026-06-21 09:00:03.398446	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	5bf493d5-40dc-4363-8d98-8458fe12cf8b	228205.13	228205.13	2026-06-21 09:00:03.408571	2026-09-19 09:00:03.408558	active	a668542a-db7c-439f-ac17-0c8a9289d375	2026-06-21 09:00:03.657606	2026-06-21 09:00:03.657609	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	5e9d5e2f-cb18-4466-9b03-b4e3f668ce06	135897.43	135897.43	2026-06-21 09:00:03.983235	2026-09-19 09:00:03.983228	active	4698307c-93b7-48e1-af8c-02ffb97ba5e7	2026-06-21 09:00:04.168813	2026-06-21 09:00:04.168815	t
82147428-e16e-4ed8-9f62-bd5353a1b288	5bf493d5-40dc-4363-8d98-8458fe12cf8b	135897.44	135897.44	2026-06-21 09:00:04.152281	2026-09-19 09:00:04.152269	active	d877f693-83bd-4aa3-a10b-f7c58984dc2e	2026-06-21 09:00:05.502658	2026-06-21 09:00:05.502663	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	5bf493d5-40dc-4363-8d98-8458fe12cf8b	135897.43	135897.43	2026-06-21 09:00:06.246466	2026-09-19 09:00:06.246453	active	5f158086-cdd7-4fcd-91c6-04fa9de7007e	2026-06-21 09:00:06.499234	2026-06-21 09:00:06.499238	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	ede62b87-068b-4801-9d12-e96a5c5b8fbc	456410.26	456410.26	2026-06-21 09:00:10.607679	2026-09-19 09:00:10.607668	active	cd23ab5c-aa68-4374-ad5b-670299c867d7	2026-06-21 09:00:10.798462	2026-06-21 09:00:10.798466	t
82147428-e16e-4ed8-9f62-bd5353a1b288	ede62b87-068b-4801-9d12-e96a5c5b8fbc	271794.87	271794.87	2026-06-21 09:00:11.178519	2026-09-19 09:00:11.178509	active	9daea1c7-e054-49f2-9f3e-8ccfea2481b8	2026-06-21 09:00:11.364252	2026-06-21 09:00:11.364257	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	ede62b87-068b-4801-9d12-e96a5c5b8fbc	271794.87	271794.87	2026-06-21 09:00:11.937351	2026-09-19 09:00:11.937339	active	9c866d48-b730-4c15-94b1-ca68aec8d682	2026-06-21 09:00:12.122526	2026-06-21 09:00:12.12253	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	d257d209-dcc5-4496-8cdd-50359777b182	456410.26	456410.26	2026-06-21 09:00:14.719155	2026-09-19 09:00:14.719145	active	784e6d52-8fa9-45a7-9058-2fc4b8702e46	2026-06-21 09:00:14.970837	2026-06-21 09:00:14.970842	t
82147428-e16e-4ed8-9f62-bd5353a1b288	d257d209-dcc5-4496-8cdd-50359777b182	271794.87	271794.87	2026-06-21 09:00:15.475028	2026-09-19 09:00:15.475016	active	968d76ea-bab7-4c8b-9a9a-88608f6d149a	2026-06-21 09:00:15.728178	2026-06-21 09:00:15.728184	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	d257d209-dcc5-4496-8cdd-50359777b182	271794.87	271794.87	2026-06-21 09:00:16.490278	2026-09-19 09:00:16.49027	active	d58b57a9-77d4-4ae4-9847-72e79dd978b7	2026-06-21 09:00:16.744009	2026-06-21 09:00:16.744014	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	b8bc1cc8-6d2e-410b-a274-f20803010e42	228205.13	228205.13	2026-06-24 09:00:02.505829	2026-09-22 09:00:02.505808	active	3d995ca5-a7e9-48bf-9360-c634ba02cffc	2026-06-24 09:00:02.686776	2026-06-24 09:00:02.68678	t
82147428-e16e-4ed8-9f62-bd5353a1b288	b8bc1cc8-6d2e-410b-a274-f20803010e42	135897.44	135897.44	2026-06-24 09:00:03.062216	2026-09-22 09:00:03.062209	active	0c7073e2-ba75-4044-9892-b9ad169ed722	2026-06-24 09:00:03.242653	2026-06-24 09:00:03.242657	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	2bb17189-59df-4065-b964-9284c522970f	228205.13	228205.13	2026-06-24 09:00:03.470871	2026-09-22 09:00:03.470861	active	13a93689-b910-45d4-a77e-f03dfac06cd1	2026-06-24 09:00:03.72929	2026-06-24 09:00:03.729299	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	b8bc1cc8-6d2e-410b-a274-f20803010e42	135897.43	135897.43	2026-06-24 09:00:03.822602	2026-09-22 09:00:03.822592	active	21114ada-4258-4f64-8cd3-be0fb8338f12	2026-06-24 09:00:04.001144	2026-06-24 09:00:04.001148	t
82147428-e16e-4ed8-9f62-bd5353a1b288	2bb17189-59df-4065-b964-9284c522970f	135897.44	135897.44	2026-06-24 09:00:04.24354	2026-09-22 09:00:04.243528	active	7756aae4-8fea-4082-a139-b6f72c796278	2026-06-24 09:00:05.28612	2026-06-24 09:00:05.286128	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	2bb17189-59df-4065-b964-9284c522970f	135897.43	135897.43	2026-06-24 09:00:06.041406	2026-09-22 09:00:06.041395	active	6e295710-d0c7-45bb-9bc3-b25cde2288ed	2026-06-24 09:00:06.29455	2026-06-24 09:00:06.294555	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	4e20158d-2aee-43f8-a49d-6dd68db35a54	228205.13	228205.13	2026-06-26 09:00:01.643236	2026-09-24 09:00:01.643227	active	76a7e099-5e67-48c9-81b5-72218e50236d	2026-06-26 09:00:01.819919	2026-06-26 09:00:01.819923	t
82147428-e16e-4ed8-9f62-bd5353a1b288	4e20158d-2aee-43f8-a49d-6dd68db35a54	135897.44	135897.44	2026-06-26 09:00:02.178149	2026-09-24 09:00:02.17814	active	2465e10d-25d5-4a5c-8abd-94a6807da63e	2026-06-26 09:00:02.351467	2026-06-26 09:00:02.351471	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	4e20158d-2aee-43f8-a49d-6dd68db35a54	135897.43	135897.43	2026-06-26 09:00:02.891331	2026-09-24 09:00:02.89132	active	c61f6f66-81d2-464d-933d-ed3367749a35	2026-06-26 09:00:03.062826	2026-06-26 09:00:03.062829	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	a6b2956f-31ad-4256-b4c5-bc8f7b3b024e	228205.13	228205.13	2026-06-26 09:00:03.187341	2026-09-24 09:00:03.187329	active	baccf0be-e11f-405f-9e26-c561f9f510e7	2026-06-26 09:00:03.427778	2026-06-26 09:00:03.427783	t
82147428-e16e-4ed8-9f62-bd5353a1b288	a6b2956f-31ad-4256-b4c5-bc8f7b3b024e	135897.44	135897.44	2026-06-26 09:00:03.915919	2026-09-24 09:00:03.915908	active	bf2b568c-38e6-4d99-bd8c-3a76dc934caa	2026-06-26 09:00:04.298851	2026-06-26 09:00:04.298855	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	a6b2956f-31ad-4256-b4c5-bc8f7b3b024e	135897.43	135897.43	2026-06-26 09:00:05.017943	2026-09-24 09:00:05.017932	active	dbccf1af-54f5-4e7c-82e1-897133269716	2026-06-26 09:00:05.257828	2026-06-26 09:00:05.257834	t
\.


--
-- Data for Name: wallet_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wallet_transactions (beneficiary_id, order_id, allocation_id, transaction_type, amount, balance_after, description, id, created_at, updated_at, is_active) FROM stdin;
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	a38a2437-df44-4cb8-bd8c-b62a6c2ed40c	\N	debit	125000.00	4522652.59	Pembelian dikonfirmasi vendor #a38a2437	5b181f4e-63e2-4036-af2f-10b203cda73a	2026-05-07 06:47:05.530519	2026-05-07 06:47:05.530524	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	00ab8637-d4cc-4013-abd0-87304040fcba	\N	hold	160000.00	4522652.59	Pemesanan 4 item	1e2c9650-aae9-4f6e-80bc-a45077652214	2026-05-08 17:20:28.871928	2026-05-08 17:20:29.055776	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	00ab8637-d4cc-4013-abd0-87304040fcba	\N	unhold	160000.00	4522652.59	Pesanan dibatalkan #00ab8637	05e9df74-0f87-4fe8-8036-9a41ea8b1f4b	2026-05-09 17:30:00.751215	2026-05-09 17:30:00.751226	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	de004d96-8855-4960-bb28-4c0b50e74f35	\N	hold	34000.00	1300000.00	Pemesanan multi-vendor (2 item)	1ef22eea-3af5-49ef-bb80-87ebeda31cb5	2026-05-19 07:07:22.23674	2026-05-19 07:07:22.647887	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	de004d96-8855-4960-bb28-4c0b50e74f35	\N	unhold	34000.00	1300000.00	Pesanan dibatalkan #de004d96	64355192-02ba-4938-8446-cd7e58e593d4	2026-05-20 07:30:02.808384	2026-05-20 07:30:02.808386	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	de004d96-8855-4960-bb28-4c0b50e74f35	\N	unhold	34000.00	1300000.00	Pesanan dibatalkan #de004d96	0dd55ec1-a812-498a-b35c-946d21c93608	2026-05-20 07:30:03.942062	2026-05-20 07:30:03.942066	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	\N	dfc70f96-a04b-47a5-956b-0eb7a3ff7973	credit	1000000.00	2300000.00	Alokasi donasi #de5700b7	4ce90f9e-5b89-4826-a117-3d6d28465797	2026-05-22 09:00:03.605307	2026-05-22 09:00:03.605309	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	\N	198dd376-9406-48d1-93d5-d91d54dae90f	credit	1000000.00	2300000.00	Alokasi donasi #06f0baba	5b65dadd-98ec-4f56-baf4-4be787440357	2026-05-22 09:00:04.693255	2026-05-22 09:00:04.69326	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	\N	cd73d64f-3385-4e9c-a819-bc0d49d8ff40	credit	500000.00	2800000.00	Alokasi donasi #25b1c35e	2d896245-f250-4371-9f08-25d6bdc92cde	2026-05-22 09:00:08.849818	2026-05-22 09:00:08.849819	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	\N	f1c5a299-58fd-4b8a-b7aa-476f332e93a8	credit	500000.00	3300000.00	Alokasi donasi #f673d639	5a76ab19-65e1-4f4e-b112-7bf360a415f1	2026-05-22 09:00:13.093783	2026-05-22 09:00:13.093788	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	bd73cb99-0427-45d7-b9b6-1eea3679a040	\N	hold	34000.00	3300000.00	Pemesanan multi-vendor (2 item)	98c9c9c8-6c79-4f6c-9624-af821bcd0841	2026-05-23 14:43:48.676688	2026-05-23 14:43:48.912405	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	bd73cb99-0427-45d7-b9b6-1eea3679a040	\N	debit	34000.00	3266000.00	Pembelian dikonfirmasi vendor #bd73cb99	02a11f52-dc9d-4ac8-a709-66c1e928426a	2026-05-23 14:45:07.706803	2026-05-23 14:45:07.706803	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	950ead93-8a2e-4ad0-8e67-cdd2dedd2a97	\N	hold	42000.00	3266000.00	Pemesanan multi-vendor (2 item)	ebc410a1-4735-42c4-a980-b468f9ad4c8b	2026-05-23 14:56:12.765193	2026-05-23 14:56:13.023887	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	950ead93-8a2e-4ad0-8e67-cdd2dedd2a97	\N	debit	42000.00	3224000.00	Pembelian dikonfirmasi vendor #950ead93	254f6457-7933-4a5d-b258-879cb9d508dd	2026-05-23 14:58:19.943127	2026-05-23 14:58:19.943127	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	8d6b8321-b178-4156-bc68-06047c183a08	\N	hold	64000.00	3224000.00	Pemesanan multi-vendor (2 item)	baf652cf-8c54-44fb-adfd-57f7efa405cf	2026-05-23 15:12:14.512284	2026-05-23 15:12:14.71755	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	8d6b8321-b178-4156-bc68-06047c183a08	\N	debit	64000.00	3160000.00	Pembelian dikonfirmasi vendor #8d6b8321	66dea57f-d951-4c64-9a57-83a4f2f63816	2026-05-23 15:13:39.634909	2026-05-23 15:13:39.634909	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	b2c30121-2fe5-4ae1-8f55-53232f1be650	\N	hold	4000.00	1350000.00	Pemesanan multi-vendor (1 item)	2723871f-5017-4944-a83c-773a9c1c111a	2026-05-26 01:46:35.216986	2026-05-26 01:46:35.753983	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	2141f557-23d7-4971-8d7f-9655aeec30da	\N	hold	35000.00	1350000.00	Pemesanan multi-vendor (2 item)	9f06a302-23ca-4385-a600-46c5a5b34bf6	2026-05-26 01:46:36.631684	2026-05-26 01:46:37.331375	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	b2c30121-2fe5-4ae1-8f55-53232f1be650	\N	unhold	4000.00	1350000.00	Pesanan dibatalkan #b2c30121	21e7ad2e-4d07-444f-91c5-bf648eb65afc	2026-05-27 02:00:00.201696	2026-05-27 02:00:00.201702	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	2141f557-23d7-4971-8d7f-9655aeec30da	\N	unhold	35000.00	1350000.00	Pesanan dibatalkan #2141f557	1e1d7606-bc32-4beb-a94a-20e25a58f784	2026-05-27 02:00:00.201706	2026-05-27 02:00:00.201707	t
c5a8b3e9-5677-4577-aabc-a25446f0ae61	\N	cc2a0662-d0df-41ce-9343-c92d0918e49e	credit	250000.00	1750000.00	Alokasi donasi #f79fbeab	92367664-ccf6-46a1-b145-fcbb5bb4e493	2026-05-27 09:00:00.302288	2026-05-27 09:00:00.302291	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	\N	b50be70b-6cf7-4d4b-a5cb-99fd4631fe3c	credit	250000.00	3410000.00	Alokasi donasi #f79fbeab	e30fdf14-f281-412c-b46d-54eac9db253c	2026-05-27 09:00:00.330661	2026-05-27 09:00:00.330663	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	5c1b209a-c6cf-4aa2-931a-036300f21eab	\N	hold	35000.00	1350000.00	Pemesanan multi-vendor (2 item)	bf4b2792-55ef-47df-aba8-2f87e69ad03d	2026-06-01 11:39:58.019299	2026-06-01 11:39:58.305712	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	e3ba2fd6-c4b5-4555-8efa-43e7142cb875	\N	hold	28000.00	1350000.00	Pemesanan multi-vendor (1 item)	98c937c6-3e70-42c0-9763-7db33115193c	2026-06-01 11:39:58.594014	2026-06-01 11:39:58.78262	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	88549347-94cb-4d0e-9138-4263aeda90dd	\N	hold	15000.00	1350000.00	Pemesanan multi-vendor (1 item)	fffbf30b-133d-4ce6-a787-caee2c551314	2026-06-01 11:39:59.060735	2026-06-01 11:39:59.243437	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	969f2a78-e47d-4b25-bc95-c16af3960a7f	\N	hold	75000.00	1350000.00	Pemesanan multi-vendor (1 item)	1af4b17e-2cea-4b64-9153-d94f861f9ab8	2026-06-01 12:49:31.243554	2026-06-01 12:49:31.471146	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	1962589e-3a02-4576-a532-a875d6022e73	\N	hold	4000.00	1350000.00	Pemesanan multi-vendor (1 item)	04a8014b-7faa-4099-8354-c104d259569c	2026-06-01 12:49:31.79253	2026-06-01 12:49:32.003224	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	3773d316-ac12-457d-8013-a75b81dd12db	\N	hold	25000.00	1350000.00	Pemesanan multi-vendor (1 item)	cb11d527-3717-4864-8294-542c55bec526	2026-06-01 12:49:32.324515	2026-06-01 12:49:32.523924	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	5c1b209a-c6cf-4aa2-931a-036300f21eab	\N	unhold	35000.00	1350000.00	Pesanan dibatalkan #5c1b209a	d145de21-9c9c-4d45-93e8-b85ee6973e04	2026-06-02 12:00:00.298203	2026-06-02 12:00:00.298206	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	e3ba2fd6-c4b5-4555-8efa-43e7142cb875	\N	unhold	28000.00	1350000.00	Pesanan dibatalkan #e3ba2fd6	18b7dd02-dae7-4224-9518-9138f37b5f42	2026-06-02 12:00:00.298212	2026-06-02 12:00:00.298213	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	88549347-94cb-4d0e-9138-4263aeda90dd	\N	unhold	15000.00	1350000.00	Pesanan dibatalkan #88549347	bf0aa346-f87d-4db3-a1a1-c55c0032e4fb	2026-06-02 12:00:00.298215	2026-06-02 12:00:00.298215	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	969f2a78-e47d-4b25-bc95-c16af3960a7f	\N	unhold	75000.00	1350000.00	Pesanan dibatalkan #969f2a78	968faf21-199d-4264-bd1f-3494da7ac04b	2026-06-02 13:00:00.15952	2026-06-02 13:00:00.159522	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	1962589e-3a02-4576-a532-a875d6022e73	\N	unhold	4000.00	1350000.00	Pesanan dibatalkan #1962589e	af364cc5-91f9-496d-b6d0-249679123756	2026-06-02 13:00:00.159526	2026-06-02 13:00:00.159526	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	3773d316-ac12-457d-8013-a75b81dd12db	\N	unhold	25000.00	1350000.00	Pesanan dibatalkan #3773d316	53beb156-abae-42bd-9655-986fbae03945	2026-06-02 13:00:00.159529	2026-06-02 13:00:00.159529	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	ca14e1a2-a6f2-4252-877c-e960f8fa1301	\N	hold	35000.00	1350000.00	Pemesanan multi-vendor (2 item)	8d84bcea-40d6-492c-a6f8-9c6399f93e08	2026-06-10 04:33:17.610442	2026-06-10 04:33:18.348572	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	ed0fda70-6dad-47ee-b550-44f77c8ff137	\N	hold	12000.00	3410000.00	Pemesanan multi-vendor (1 item)	c01eef48-2b76-4f9e-9e97-ec82fbafcb01	2026-06-10 05:09:29.272196	2026-06-10 05:09:29.833444	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	ed0fda70-6dad-47ee-b550-44f77c8ff137	\N	debit	12000.00	3398000.00	Pembelian dikonfirmasi vendor #ed0fda70	35a34190-c390-41f7-851e-b2ff8477567d	2026-06-10 05:11:00.639723	2026-06-10 05:11:00.639727	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	5ff2fb4a-1bd1-4997-8033-b993bf0afe69	\N	hold	25000.00	1350000.00	Pemesanan multi-vendor (1 item)	05785481-947f-4086-84e9-475158aa734b	2026-06-10 13:45:04.044339	2026-06-10 13:45:04.620305	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	5ff2fb4a-1bd1-4997-8033-b993bf0afe69	\N	debit	25000.00	1325000.00	Pembelian dikonfirmasi vendor #5ff2fb4a	8ee0e3ec-6469-4fcc-94f7-f1b53717f7c4	2026-06-10 13:56:32.082822	2026-06-10 13:56:32.082826	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	ca14e1a2-a6f2-4252-877c-e960f8fa1301	\N	unhold	35000.00	1325000.00	Pesanan dibatalkan #ca14e1a2	61562f28-ed71-452a-8435-37272f00345a	2026-06-11 05:00:02.85027	2026-06-11 05:00:02.850274	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	ca14e1a2-a6f2-4252-877c-e960f8fa1301	\N	unhold	35000.00	1325000.00	Pesanan dibatalkan #ca14e1a2	ebc1492c-dd30-4351-82be-35a7740fc894	2026-06-11 05:00:03.969712	2026-06-11 05:00:03.969716	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	5df0f64b-7ce6-4747-a83d-e2d9205cd438	\N	hold	150000.00	3398000.00	Pemesanan multi-vendor (1 item)	871a3f9e-5099-4d76-a216-39f01cfae417	2026-06-14 14:01:35.285568	2026-06-14 14:01:35.465773	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	b9b49caa-67cc-42b8-a227-9181efb34f53	\N	hold	50000.00	3398000.00	Pemesanan multi-vendor (1 item)	945b1120-fa2c-4a1f-a974-507abcfd74c8	2026-06-14 14:12:55.841483	2026-06-14 14:12:56.033367	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	9f4d67ee-181a-4d93-bc13-dba7a51e9e95	\N	hold	30000.00	3398000.00	Pemesanan multi-vendor (1 item)	2e8fdb4d-4685-46a3-a97f-42d078bc8dc1	2026-06-14 14:12:56.450777	2026-06-14 14:12:56.639424	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	58ac8fdf-7b2b-48d3-b501-7a2d43cc2dad	\N	hold	15000.00	3398000.00	Pemesanan multi-vendor (1 item)	14c9198b-be32-4621-9c0b-057c823a2f63	2026-06-14 14:26:38.173627	2026-06-14 14:26:38.342362	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	75883b2d-9160-4f62-b3ad-7104f3fabee8	\N	hold	20000.00	3398000.00	Pemesanan multi-vendor (1 item)	1ad6e2bd-c0e9-47e6-b290-a23e83df25bd	2026-06-14 14:26:38.717615	2026-06-14 14:26:38.874887	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	5df0f64b-7ce6-4747-a83d-e2d9205cd438	\N	unhold	150000.00	3398000.00	Pesanan dibatalkan #5df0f64b	16250509-18a6-4a4d-871e-061b29de8030	2026-06-15 14:30:04.486009	2026-06-15 14:30:04.486012	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	b9b49caa-67cc-42b8-a227-9181efb34f53	\N	unhold	50000.00	3398000.00	Pesanan dibatalkan #b9b49caa	5239e6d7-93eb-4ae9-8538-8d2009a1e951	2026-06-15 14:30:04.486015	2026-06-15 14:30:04.486015	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	9f4d67ee-181a-4d93-bc13-dba7a51e9e95	\N	unhold	30000.00	3398000.00	Pesanan dibatalkan #9f4d67ee	929f9356-3285-405d-a356-2205a5400b71	2026-06-15 14:30:04.486017	2026-06-15 14:30:04.486017	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	58ac8fdf-7b2b-48d3-b501-7a2d43cc2dad	\N	unhold	15000.00	3398000.00	Pesanan dibatalkan #58ac8fdf	1768ea8e-bbca-4393-b5de-695b3094c739	2026-06-15 14:30:04.486019	2026-06-15 14:30:04.486019	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	75883b2d-9160-4f62-b3ad-7104f3fabee8	\N	unhold	20000.00	3398000.00	Pesanan dibatalkan #75883b2d	c8f321d1-5855-4132-adec-deb7f52c6e7e	2026-06-15 14:30:04.48602	2026-06-15 14:30:04.48602	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	5df0f64b-7ce6-4747-a83d-e2d9205cd438	\N	unhold	150000.00	3398000.00	Pesanan dibatalkan #5df0f64b	f46bac12-05e4-4150-aed9-b8b21e24cf2e	2026-06-15 14:30:07.441062	2026-06-15 14:30:07.441066	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	b9b49caa-67cc-42b8-a227-9181efb34f53	\N	unhold	50000.00	3398000.00	Pesanan dibatalkan #b9b49caa	3379600f-3dad-4a6e-aae1-54d179f57fad	2026-06-15 14:30:07.441071	2026-06-15 14:30:07.441071	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	9f4d67ee-181a-4d93-bc13-dba7a51e9e95	\N	unhold	30000.00	3398000.00	Pesanan dibatalkan #9f4d67ee	a0dfdeb4-1950-4cc5-9272-890f0d9d52cf	2026-06-15 14:30:07.441075	2026-06-15 14:30:07.441076	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	58ac8fdf-7b2b-48d3-b501-7a2d43cc2dad	\N	unhold	15000.00	3398000.00	Pesanan dibatalkan #58ac8fdf	e3520af3-521f-4507-bd51-b4c01716386a	2026-06-15 14:30:07.441079	2026-06-15 14:30:07.441079	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	75883b2d-9160-4f62-b3ad-7104f3fabee8	\N	unhold	20000.00	3398000.00	Pesanan dibatalkan #75883b2d	375ba28d-779e-4edf-831c-9e913ed944ae	2026-06-15 14:30:07.441083	2026-06-15 14:30:07.441083	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	4a84a0c7-18e4-4918-8bae-9ea1da489de9	\N	hold	60000.00	3398000.00	Pemesanan multi-vendor (1 item)	45eb29e6-f6e9-4478-b3b2-9733039422fd	2026-06-17 02:55:12.004297	2026-06-17 02:55:12.544803	t
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	4a84a0c7-18e4-4918-8bae-9ea1da489de9	\N	debit	60000.00	3338000.00	Pembelian dikonfirmasi vendor #4a84a0c7	59289465-b3fb-4d88-b56f-830ca41799f6	2026-06-17 02:58:05.742792	2026-06-17 02:58:05.742797	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	b527d423-a0d3-42ca-bdc9-abfdb2d65063	\N	hold	34000.00	1325000.00	Pemesanan multi-vendor (2 item)	1240841a-ab45-4f41-b9ab-776745485949	2026-06-17 06:27:00.945157	2026-06-17 06:27:01.654936	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	6b122fc3-3d3d-4191-9b28-1a1ca7f01fd0	\N	hold	30000.00	1325000.00	Pemesanan multi-vendor (1 item)	c21af47f-9b19-4f5f-8559-e5b0361b83e7	2026-06-17 06:39:55.153995	2026-06-17 06:39:55.691529	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	6b122fc3-3d3d-4191-9b28-1a1ca7f01fd0	\N	debit	30000.00	1295000.00	Pembelian dikonfirmasi vendor #6b122fc3	8077f797-12b2-475a-80c6-fb3d8a9aaae1	2026-06-17 06:43:30.479425	2026-06-17 06:43:30.47943	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	b527d423-a0d3-42ca-bdc9-abfdb2d65063	\N	unhold	34000.00	1295000.00	Pesanan dibatalkan #b527d423	a91bbc91-c9e7-4864-b28e-5dbe3dc0a9aa	2026-06-18 06:30:02.789763	2026-06-18 06:30:02.789767	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	b527d423-a0d3-42ca-bdc9-abfdb2d65063	\N	unhold	34000.00	1295000.00	Pesanan dibatalkan #b527d423	fcd36005-b5a4-493a-9aa3-a2c6c1ee26a6	2026-06-18 06:30:03.924159	2026-06-18 06:30:03.924164	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	62f378ab-0bfc-4420-be00-0d9767842abc	credit	228205.13	228205.13	Alokasi donasi #5d3a36d9	72588f9a-4196-4010-8679-a8354a8d6b15	2026-06-18 09:00:03.42416	2026-06-18 09:00:03.424163	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	88c62617-c32a-4de2-a577-f694998b5c90	credit	135897.44	135897.44	Alokasi donasi #5d3a36d9	3706cac7-f2fa-47c3-8d09-774718374638	2026-06-18 09:00:04.143608	2026-06-18 09:00:04.143612	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	602c123e-7bd3-4a09-9694-145c7a98731f	credit	135897.43	1430897.43	Alokasi donasi #5d3a36d9	9538791e-0e58-49e4-85d6-95a9791476f1	2026-06-18 09:00:04.849919	2026-06-18 09:00:04.849924	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	3afc5b1c-369e-4ff1-acf8-bf28bd2106d3	credit	228205.13	228205.13	Alokasi donasi #936aa129	a40012de-bb5a-4339-ba62-7bf4cd59abeb	2026-06-18 09:00:05.470182	2026-06-18 09:00:05.470189	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	1ccdbac7-6133-4888-97ae-89fc1ec019db	credit	135897.44	135897.44	Alokasi donasi #936aa129	2adef409-ce5d-4083-bfa1-e1bc0abcceaa	2026-06-18 09:00:06.427508	2026-06-18 09:00:06.427512	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	59c77e51-5c7f-4bf4-ad82-f4b6fd966535	credit	135897.43	1430897.43	Alokasi donasi #936aa129	02fcba37-68a1-45c7-bdec-6b861e0038ad	2026-06-18 09:00:07.376701	2026-06-18 09:00:07.376705	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	7558914a-2d7b-462f-bfdd-b540df12541f	credit	228205.13	456410.26	Alokasi donasi #9f4287b7	3bd90193-b147-4403-b5da-1a11d20a5372	2026-06-18 09:00:11.316549	2026-06-18 09:00:11.316553	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	94d887b0-107c-4540-a6a5-ecb192118895	credit	135897.44	271794.88	Alokasi donasi #9f4287b7	cdc7b6be-0006-44c7-9fa7-6d0b7b80a73c	2026-06-18 09:00:12.041961	2026-06-18 09:00:12.041964	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	81d9c8bb-3574-40fd-8bb2-6e70071e980a	credit	135897.43	1566794.86	Alokasi donasi #9f4287b7	6e098529-e78b-4176-8e45-96efe3eb5ffe	2026-06-18 09:00:12.766625	2026-06-18 09:00:12.76663	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	2538aef5-3ac0-42b3-bf1c-12c8a0fd3399	credit	228205.13	684615.39	Alokasi donasi #01308c41	80520d01-dc28-496c-8ca1-a66c7cb4b3bb	2026-06-18 09:00:15.395817	2026-06-18 09:00:15.395822	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	44ec9bea-933c-4835-984f-28628661ba7a	credit	135897.44	407692.32	Alokasi donasi #01308c41	b2a2e31d-aaea-4a18-b431-76b7661943c3	2026-06-18 09:00:16.358627	2026-06-18 09:00:16.358632	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	d4d4523c-b01e-4c49-8c7d-aabaa98a3479	credit	135897.43	1702692.29	Alokasi donasi #01308c41	6d912dd7-f0c1-40b3-9e71-d72aaf47cc31	2026-06-18 09:00:17.324837	2026-06-18 09:00:17.324842	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	3bd4f54c-effb-4bf5-87e0-7fca64061bed	credit	228205.13	684615.39	Alokasi donasi #7be12ae1	07061b7e-f822-482c-9f0a-12e24f0bc9d9	2026-06-18 09:00:17.951748	2026-06-18 09:00:17.95175	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	6958c516-9b6c-49a5-8f7c-3f691aa48c31	credit	135897.44	407692.32	Alokasi donasi #7be12ae1	a456d678-338c-4622-bfff-ec5ddc56410b	2026-06-18 09:00:18.675419	2026-06-18 09:00:18.675423	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	c5b7525d-0758-4991-b12c-c804ca168a3e	credit	135897.43	1702692.29	Alokasi donasi #7be12ae1	eea1c540-1c1d-44d7-962b-937cf7213f7f	2026-06-18 09:00:19.391266	2026-06-18 09:00:19.39127	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	92c68981-6906-4109-901e-a131df634d2e	credit	228205.13	912820.52	Alokasi donasi #1db8f6d6	20d90f76-deaf-4209-9710-0a1ede31b979	2026-06-18 09:00:22.910367	2026-06-18 09:00:22.910373	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	d14cd6f7-df74-4074-91e8-0860b33faf09	credit	135897.44	543589.76	Alokasi donasi #1db8f6d6	336f172f-c12c-452c-948a-bdd93c99f2da	2026-06-18 09:00:23.875871	2026-06-18 09:00:23.875876	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	41ec5a86-4ea9-430f-aec2-5672ff132923	credit	135897.43	1838589.72	Alokasi donasi #1db8f6d6	d1637018-7328-4bcf-b55a-b880e2a0d5f8	2026-06-18 09:00:24.836956	2026-06-18 09:00:24.836961	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	1c50390b-92c9-4bbf-9063-b990d740c392	credit	228205.13	912820.52	Alokasi donasi #071fd337	37befe4f-f141-4031-af15-4f2aaad33276	2026-06-18 09:00:25.467445	2026-06-18 09:00:25.467448	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	cc45ae94-b217-42dd-b12b-68a363f87ae0	credit	135897.44	543589.76	Alokasi donasi #071fd337	f47ce9fa-5ea5-4d21-a898-659d886b698b	2026-06-18 09:00:26.195293	2026-06-18 09:00:26.195296	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	6950091b-05d4-4102-bdad-a8f8021b3dca	credit	135897.43	1838589.72	Alokasi donasi #071fd337	66625b11-72c1-4a33-8451-f2334078e22f	2026-06-18 09:00:26.920515	2026-06-18 09:00:26.920517	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	918f6aa6-ac4c-46d8-afbf-98e5e00651c3	credit	228205.13	1141025.65	Alokasi donasi #f007265a	a091fb54-6534-4fa5-981b-ec1fb2634157	2026-06-18 09:00:30.481174	2026-06-18 09:00:30.481178	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	e4a674b3-830d-4a5a-b644-2b61b7c1e30e	credit	135897.44	679487.20	Alokasi donasi #f007265a	832102dd-ef91-48e2-a5c9-8ebe221b4948	2026-06-18 09:00:31.489148	2026-06-18 09:00:31.489154	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	370577af-7b6b-4f3b-9105-26530eedc57e	credit	135897.43	1974487.15	Alokasi donasi #f007265a	52728f92-1292-499a-8c9b-bbaaf432f1bc	2026-06-18 09:00:32.482355	2026-06-18 09:00:32.482359	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	82b3deed-79f5-4c62-8ca8-a8871d8eaa1e	credit	228205.13	1141025.65	Alokasi donasi #24bbf22c	09eab113-dc21-4350-b639-6ae59e745ed2	2026-06-18 09:00:33.117675	2026-06-18 09:00:33.117679	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	17f6ae04-a4f4-47a4-90e4-d16a98f8cde9	credit	135897.44	679487.20	Alokasi donasi #24bbf22c	d6119e22-ebe4-4eeb-bae6-4ed829d45abe	2026-06-18 09:00:33.823173	2026-06-18 09:00:33.823178	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	c9beb6bd-bdb6-4889-9f14-2092969d4dcf	credit	135897.43	1974487.15	Alokasi donasi #24bbf22c	a9c01ec7-f5cb-4fc9-a93f-e18e062b8454	2026-06-18 09:00:34.527299	2026-06-18 09:00:34.527303	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	ff9bcea7-fb94-4c66-9265-0aee150609cf	credit	228205.13	1369230.78	Alokasi donasi #cc704126	6ae45268-781f-42f2-9dcd-9c92053a8fa7	2026-06-18 09:00:37.989706	2026-06-18 09:00:37.989711	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	cd20394a-be21-4602-b258-0f069a16a512	credit	135897.44	815384.64	Alokasi donasi #cc704126	228e1758-3727-44ff-af4f-5eb40e554d16	2026-06-18 09:00:38.945195	2026-06-18 09:00:38.945199	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	968473b7-afe8-49c5-aff4-28c285099a4c	credit	135897.43	2110384.58	Alokasi donasi #cc704126	4dd20149-0101-492e-a893-668f9ae93b6d	2026-06-18 09:00:39.897898	2026-06-18 09:00:39.897902	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	0e9d7b16-436d-4f66-b1e6-eb449bfcb5ed	credit	136923.08	1277948.73	Alokasi donasi #464fad88	6a75afd9-8993-43bc-8d8d-9126f8e8a74b	2026-06-18 09:00:40.521099	2026-06-18 09:00:40.521103	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	4cb6c0c9-40d5-4967-9847-5baeabb46ab1	credit	81538.46	761025.66	Alokasi donasi #464fad88	bf5dad7b-9133-459d-af27-1bf2b954d941	2026-06-18 09:00:41.22526	2026-06-18 09:00:41.225265	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	ee16a992-146e-48f4-ae78-7294a70a6a7b	credit	81538.46	2056025.61	Alokasi donasi #464fad88	fb600d99-4bdd-4b26-b3be-12ef93b6fbc7	2026-06-18 09:00:41.92969	2026-06-18 09:00:41.929694	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	af9e7ae7-ff36-4e09-9ddf-b8223a2617f3	credit	136923.08	1414871.81	Alokasi donasi #099847e9	b1fe2d71-43bf-424d-b6e3-d71e56c4fb79	2026-06-18 09:00:45.376042	2026-06-18 09:00:45.376047	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	d3e56099-e544-4f84-9f31-211a5b6944ad	credit	81538.46	842564.12	Alokasi donasi #099847e9	90f33bcc-76fe-4384-b154-1ab5ac236fe0	2026-06-18 09:00:46.328123	2026-06-18 09:00:46.328128	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	b21e54b3-edc1-4419-af97-615048db8533	credit	81538.46	2137564.07	Alokasi donasi #099847e9	da376d85-5f00-4bac-be6d-1d2c243efab2	2026-06-18 09:00:47.280348	2026-06-18 09:00:47.280353	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	1e15e8e1-08f0-4fe7-82c1-43a5a679f77f	credit	136923.08	1414871.81	Alokasi donasi #9c941504	6cac5584-35cc-457f-be8a-585607924a6a	2026-06-18 09:00:47.906058	2026-06-18 09:00:47.906063	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	b931812f-6153-40e2-891a-47867450a818	credit	81538.46	842564.12	Alokasi donasi #9c941504	d4cbad76-63b1-4fa1-8a8d-ae381dbe70d3	2026-06-18 09:00:48.628515	2026-06-18 09:00:48.628518	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	2452c7f6-820e-4af3-92f2-8286eaa08e01	credit	81538.46	2137564.07	Alokasi donasi #9c941504	139b2b54-c8b8-4ae1-8656-4e3bbb5eeba9	2026-06-18 09:00:49.350338	2026-06-18 09:00:49.350341	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	a78b0f1d-61e4-4360-acac-fed1473b4da9	credit	136923.08	1551794.89	Alokasi donasi #61b6a05b	3f2c01c1-f070-4c49-8476-e6236ad9fca6	2026-06-18 09:00:52.844997	2026-06-18 09:00:52.845001	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	0ae8e165-9fed-42e9-9608-6af7f6ed945a	credit	81538.46	924102.58	Alokasi donasi #61b6a05b	f5f9cb8b-2539-4845-b2e1-1f2757f22e7c	2026-06-18 09:00:53.806942	2026-06-18 09:00:53.806946	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	69a7db7d-feca-4030-92bb-629e65a260a1	credit	81538.46	2219102.53	Alokasi donasi #61b6a05b	ad44a95b-f7a4-48d1-8858-f8bf925ae2d5	2026-06-18 09:00:54.765896	2026-06-18 09:00:54.7659	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	ff14e9da-4322-4cf5-9086-a3c93f5fc38a	credit	136923.08	1551794.89	Alokasi donasi #014676af	bb7664c1-563f-4b24-a510-074d2e0891c3	2026-06-18 09:00:55.390111	2026-06-18 09:00:55.390115	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	cd542c58-4e1d-4a84-8af5-f6f4db9defc0	credit	81538.46	924102.58	Alokasi donasi #014676af	4a499bc4-7bd6-401a-a343-7208062e16f7	2026-06-18 09:00:56.109703	2026-06-18 09:00:56.109709	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	913ebb0c-9db5-4722-b90d-e6faa06f71a0	credit	81538.46	2219102.53	Alokasi donasi #014676af	450d7982-7c28-4131-b240-2d62ccfe73d4	2026-06-18 09:00:56.824033	2026-06-18 09:00:56.824037	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	4f86d929-0a72-4780-9054-64de1b0f2060	credit	136923.08	1688717.97	Alokasi donasi #b3d63a50	e6ddcbcd-0364-411d-b48e-2ad58cc21162	2026-06-18 09:01:00.290097	2026-06-18 09:01:00.290103	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	eb8d69eb-075a-4e18-83da-4b6288590068	credit	81538.46	1005641.04	Alokasi donasi #b3d63a50	48f51bbc-af90-4999-ba27-d48df9591b17	2026-06-18 09:01:01.256711	2026-06-18 09:01:01.256715	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	5e4ac4bb-0c78-4e57-baf4-dc515f434f57	credit	81538.46	2300640.99	Alokasi donasi #b3d63a50	0d2ad04b-d934-4f22-829a-da8ecbdd84d6	2026-06-18 09:01:02.219783	2026-06-18 09:01:02.219788	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	7d745ded-0fc3-4c52-ab0d-4bed21910709	credit	136923.08	1688717.97	Alokasi donasi #a496e7fc	5c9fb92b-7ffc-427d-8715-2f86a03f36f1	2026-06-18 09:01:02.852619	2026-06-18 09:01:02.852622	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	26c73fe4-97d3-4ac0-9809-e31ca347c961	credit	81538.46	1005641.04	Alokasi donasi #a496e7fc	10d8369b-30c4-4b0d-8552-37bb2c97e6ae	2026-06-18 09:01:03.579234	2026-06-18 09:01:03.579238	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	7c6a2b0d-6811-4eed-a38b-835ee33b1bc3	credit	81538.46	2300640.99	Alokasi donasi #a496e7fc	fd0b7ae5-aa66-4126-b9ab-4f339cc2e40b	2026-06-18 09:01:04.302947	2026-06-18 09:01:04.30295	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	556cb9a2-f7fb-44b7-b4f7-a4a38e088c9a	credit	136923.08	1825641.05	Alokasi donasi #6a967c39	4705c2ab-fcd5-4776-92d8-6fdfb548e9b6	2026-06-18 09:01:07.86616	2026-06-18 09:01:07.866165	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	492a150c-eba8-42b7-acd0-ecc5aa3f8dca	credit	81538.46	1087179.50	Alokasi donasi #6a967c39	c244ab48-a537-4844-bec4-0ed58df065da	2026-06-18 09:01:08.870228	2026-06-18 09:01:08.870233	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	b43a26da-7a59-4f9a-8ece-6eb51be7581a	credit	81538.46	2382179.45	Alokasi donasi #6a967c39	a8944f46-4952-4e6d-bb6b-8892981caea5	2026-06-18 09:01:09.869916	2026-06-18 09:01:09.869921	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	d0c9991d-c52e-4652-9221-67d341f04cf4	credit	136923.08	1962564.13	Alokasi donasi #6528615d	f8124add-7ff3-4777-b8b8-2170c63ce277	2026-06-18 09:01:15.409339	2026-06-18 09:01:15.409344	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	d716e24d-2a4f-42a3-b783-271fb826bc57	credit	81538.46	1168717.96	Alokasi donasi #6528615d	89116573-a0f8-4976-901c-a66536bc4a00	2026-06-18 09:01:16.363611	2026-06-18 09:01:16.363615	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	9cc60081-458f-4811-93fd-3b6dcd73afe3	credit	81538.46	2463717.91	Alokasi donasi #6528615d	6625f064-7eae-417d-8b47-6f5798465378	2026-06-18 09:01:17.316604	2026-06-18 09:01:17.316608	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	865bf1cd-9de8-47ff-ba9e-b1d2bb0adeb4	credit	136923.08	2099487.21	Alokasi donasi #764d9e55	120b4006-d590-403a-95f7-ff9e8b6b0431	2026-06-18 09:01:22.799543	2026-06-18 09:01:22.799548	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	45291456-d781-4308-9f9c-c9d6bd435bf2	credit	81538.46	1250256.42	Alokasi donasi #764d9e55	70e690d5-2d6a-4d57-a962-27e1ae29c51d	2026-06-18 09:01:23.749581	2026-06-18 09:01:23.749585	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	38ab113e-d1db-4b8f-8d85-cb643f9d7b35	credit	81538.46	2545256.37	Alokasi donasi #764d9e55	3f6fea2c-e9a9-4b04-914a-4746eeacd2fe	2026-06-18 09:01:24.698762	2026-06-18 09:01:24.698767	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	373306a8-9be5-4113-85a4-54d75a229bff	credit	136923.08	2099487.21	Alokasi donasi #abbf0207	e9597918-b7d3-4f88-8a9a-1ba19b12df28	2026-06-18 09:01:25.324483	2026-06-18 09:01:25.324487	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	6c009b92-be93-4c4e-9d53-3cc23394a436	credit	81538.46	1250256.42	Alokasi donasi #abbf0207	3b0a991e-8fae-47ad-ac0e-d26378dd0c88	2026-06-18 09:01:26.046906	2026-06-18 09:01:26.04691	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	07c0101d-cb17-40e2-9a5c-07fcac88c2ee	credit	81538.46	2545256.37	Alokasi donasi #abbf0207	d53e2ef3-d0a3-49a0-bdcc-e9f844e31537	2026-06-18 09:01:26.769166	2026-06-18 09:01:26.769169	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	3e72eda5-0af6-4e94-b2c8-82eeed87b3fe	credit	136923.08	2236410.29	Alokasi donasi #011684ff	5224b6dc-cbbd-43de-956f-7b2bcd3e957c	2026-06-18 09:01:30.284112	2026-06-18 09:01:30.284117	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	1f0ef357-0528-4bd0-9075-0b246f9e2c7e	credit	81538.46	1331794.88	Alokasi donasi #011684ff	caa60a85-c292-47bb-9da6-c77d3ffbfd20	2026-06-18 09:01:31.247445	2026-06-18 09:01:31.24745	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	1a18eda2-1b0f-40db-bf5a-ef8363a33906	credit	81538.46	2626794.83	Alokasi donasi #011684ff	8fda5403-dcad-4e54-9868-7d99383924c3	2026-06-18 09:01:32.205312	2026-06-18 09:01:32.205317	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	a43f81f2-7e50-4852-bdb2-9fab0ab75f0c	credit	136923.08	2236410.29	Alokasi donasi #d3708f0a	d8adb8d3-ffd1-4d3c-b370-6514f3507cbb	2026-06-18 09:01:32.829638	2026-06-18 09:01:32.829642	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	90f72ac1-3b56-4fd9-a573-0dc53c72c10a	credit	81538.46	1331794.88	Alokasi donasi #d3708f0a	35a612a3-76b3-4510-8f26-60231a420312	2026-06-18 09:01:33.544414	2026-06-18 09:01:33.544418	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	e4b9c086-0570-461e-b34b-49d258763c92	credit	81538.46	2626794.83	Alokasi donasi #d3708f0a	e967f3b0-06a4-4115-adf4-4729185ea203	2026-06-18 09:01:34.258006	2026-06-18 09:01:34.258009	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	d5936555-a9dd-4d74-839d-b169922d4e83	credit	136923.08	2373333.37	Alokasi donasi #63932533	1cbc16fe-2ae2-4c59-99a7-01dce10e7e44	2026-06-18 09:01:37.728807	2026-06-18 09:01:37.728829	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	c33068e5-6ddb-43ef-9761-7c8296eeeb09	credit	81538.46	1413333.34	Alokasi donasi #63932533	a0db3e72-8283-483a-a08e-d156bc716b22	2026-06-18 09:01:38.695037	2026-06-18 09:01:38.695042	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	a6e7e5a0-165b-4985-ab33-fa89502d4bce	credit	81538.46	2708333.29	Alokasi donasi #63932533	dd64c89c-a68d-4791-b148-180c681e5fb5	2026-06-18 09:01:39.662897	2026-06-18 09:01:39.662901	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	04c069be-ea88-422a-9419-f0aa3e0f344b	credit	136923.08	2373333.37	Alokasi donasi #a715d5c6	bc50c7a5-3543-4db5-a6cf-dbeb69f7d12b	2026-06-18 09:01:40.293935	2026-06-18 09:01:40.293939	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	883984ac-e7ac-414e-baf9-c2bc3fa5f11a	credit	81538.46	1413333.34	Alokasi donasi #a715d5c6	14a52a33-1c6d-43c1-88b9-27492a34645d	2026-06-18 09:01:41.020096	2026-06-18 09:01:41.020101	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	f26406d1-2703-47a3-815d-7918b62efff9	credit	81538.46	2708333.29	Alokasi donasi #a715d5c6	720dc5de-b06a-49d3-a56e-ac96c4de263d	2026-06-18 09:01:41.744055	2026-06-18 09:01:41.744058	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	2dc93ebf-af2a-4c6f-b368-8ce33f3e5b00	credit	136923.08	2510256.45	Alokasi donasi #620b45e9	9646755f-3d7c-424f-920f-4321ea6ba89a	2026-06-18 09:01:45.313127	2026-06-18 09:01:45.313132	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	d2f5daa8-10d6-4b41-a162-2932158d76c6	credit	81538.46	1494871.80	Alokasi donasi #620b45e9	6191effe-02bc-4c3a-8b74-652f3a27de89	2026-06-18 09:01:46.319711	2026-06-18 09:01:46.319717	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	83ea392c-3bbf-40c4-a15d-848af255cbee	credit	81538.46	2789871.75	Alokasi donasi #620b45e9	ade31f3a-aa7a-4dc0-8ea6-f257c241b4b6	2026-06-18 09:01:47.314269	2026-06-18 09:01:47.314274	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	9e348f3d-c493-48ba-889f-0dc704afe6ff	credit	136923.08	1825641.05	Alokasi donasi #340d8c53	073925b5-b669-473e-bb5c-2fc5a9c93401	2026-06-18 09:01:10.513876	2026-06-18 09:01:10.51388	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	5ae43151-2534-4de7-8532-411d7b5ce59a	credit	81538.46	1087179.50	Alokasi donasi #340d8c53	8e939064-0ef2-4c63-9ef5-794257a52bcf	2026-06-18 09:01:11.21811	2026-06-18 09:01:11.218114	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	f625c5d0-1b16-4711-9d42-fb362bd0fd45	credit	81538.46	2382179.45	Alokasi donasi #340d8c53	cc216532-bc32-4009-b262-ac58b1015cc8	2026-06-18 09:01:11.921105	2026-06-18 09:01:11.921109	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	0bdaf3b4-673d-40d6-801f-804fe1080b85	credit	136923.08	1962564.13	Alokasi donasi #45b4cde2	0fe631b9-eaa3-48bc-b769-2ecc90e0a568	2026-06-18 09:01:17.939043	2026-06-18 09:01:17.939048	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	aa5bc2d2-fba1-4b6e-9d9d-29e41bcded85	credit	81538.46	1168717.96	Alokasi donasi #45b4cde2	4e2fddbb-d268-4acb-babf-e7f44d807f40	2026-06-18 09:01:18.642425	2026-06-18 09:01:18.64243	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	93934acc-f074-41a7-a0ec-fdb29696b804	credit	81538.46	2463717.91	Alokasi donasi #45b4cde2	3058fe38-0224-493f-9d72-ae870f892d7f	2026-06-18 09:01:19.345137	2026-06-18 09:01:19.345142	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	f427c2a6-079c-4b28-b76d-d4478cb01580	credit	228205.13	2738461.58	Alokasi donasi #5e9d5e2f	a0d8b7bc-d7fd-4353-a484-999ad1ab0c86	2026-06-21 09:00:03.58439	2026-06-21 09:00:03.584394	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	e8fb7d81-c0e5-4fa4-ab2f-b29a6423f715	credit	135897.44	1630769.24	Alokasi donasi #5e9d5e2f	d2c2c939-46b7-4e78-9cc7-d281cd733bbf	2026-06-21 09:00:04.354109	2026-06-21 09:00:04.354113	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	4698307c-93b7-48e1-af8c-02ffb97ba5e7	credit	135897.43	2925769.18	Alokasi donasi #5e9d5e2f	4d8df0fc-1f5d-47c1-99df-eb44464b1f10	2026-06-21 09:00:05.096051	2026-06-21 09:00:05.096054	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	a668542a-db7c-439f-ac17-0c8a9289d375	credit	228205.13	2738461.58	Alokasi donasi #5bf493d5	6c62de1d-3c4a-4079-b980-84a2ae2e2e74	2026-06-21 09:00:05.750462	2026-06-21 09:00:05.750469	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	d877f693-83bd-4aa3-a10b-f7c58984dc2e	credit	135897.44	1630769.24	Alokasi donasi #5bf493d5	8fd25efc-584e-424b-9dcd-0fe44962e3d2	2026-06-21 09:00:06.745782	2026-06-21 09:00:06.745787	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	5f158086-cdd7-4fcd-91c6-04fa9de7007e	credit	135897.43	2925769.18	Alokasi donasi #5bf493d5	1a05403b-5e41-4653-9e93-72ef359864df	2026-06-21 09:00:07.737429	2026-06-21 09:00:07.737433	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	cd23ab5c-aa68-4374-ad5b-670299c867d7	credit	456410.26	3194871.84	Alokasi donasi #ede62b87	33842442-6157-4206-945c-398487c78769	2026-06-21 09:00:11.54882	2026-06-21 09:00:11.548824	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	9daea1c7-e054-49f2-9f3e-8ccfea2481b8	credit	271794.87	1902564.11	Alokasi donasi #ede62b87	f77e30c6-05a8-4619-b892-86297b585feb	2026-06-21 09:00:12.307156	2026-06-21 09:00:12.307161	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	9c866d48-b730-4c15-94b1-ca68aec8d682	credit	271794.87	3197564.05	Alokasi donasi #ede62b87	37054c3f-9771-4ff8-bae0-32cc08b5985c	2026-06-21 09:00:13.046949	2026-06-21 09:00:13.046952	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	784e6d52-8fa9-45a7-9058-2fc4b8702e46	credit	456410.26	3651282.10	Alokasi donasi #d257d209	631f64bc-1a89-4a87-baed-3c3be8a54144	2026-06-21 09:00:15.979588	2026-06-21 09:00:15.979593	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	968d76ea-bab7-4c8b-9a9a-88608f6d149a	credit	271794.87	2174358.98	Alokasi donasi #d257d209	f0acce61-56be-4b15-9faf-53b8660badaa	2026-06-21 09:00:16.995265	2026-06-21 09:00:16.99527	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	d58b57a9-77d4-4ae4-9847-72e79dd978b7	credit	271794.87	3469358.92	Alokasi donasi #d257d209	6af7e3c6-0a64-44ef-a9d0-d3c934bc3319	2026-06-21 09:00:18.009831	2026-06-21 09:00:18.009836	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	3d995ca5-a7e9-48bf-9360-c634ba02cffc	credit	228205.13	3879487.23	Alokasi donasi #b8bc1cc8	aec48308-abb0-4796-a9a6-0e565a05f58e	2026-06-24 09:00:03.420888	2026-06-24 09:00:03.420891	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	0c7073e2-ba75-4044-9892-b9ad169ed722	credit	135897.44	2310256.42	Alokasi donasi #b8bc1cc8	41798a09-b617-49e5-88f9-49a5b4dfd08b	2026-06-24 09:00:04.179334	2026-06-24 09:00:04.179339	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	21114ada-4258-4f64-8cd3-be0fb8338f12	credit	135897.43	3605256.35	Alokasi donasi #b8bc1cc8	a12ca642-56df-4dbf-a5c0-415d740452bc	2026-06-24 09:00:04.891928	2026-06-24 09:00:04.891931	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	13a93689-b910-45d4-a77e-f03dfac06cd1	credit	228205.13	3879487.23	Alokasi donasi #2bb17189	c74b34cd-e8b3-46c2-bb31-e1a69c617511	2026-06-24 09:00:05.537395	2026-06-24 09:00:05.537401	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	7756aae4-8fea-4082-a139-b6f72c796278	credit	135897.44	2310256.42	Alokasi donasi #2bb17189	5dcc4dfc-a4c3-4dae-a540-3add3d471636	2026-06-24 09:00:06.546304	2026-06-24 09:00:06.546309	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	6e295710-d0c7-45bb-9bc3-b25cde2288ed	credit	135897.43	3605256.35	Alokasi donasi #2bb17189	88f0cc20-7485-4862-ae5b-4357bcea8737	2026-06-24 09:00:07.559886	2026-06-24 09:00:07.559891	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	76a7e099-5e67-48c9-81b5-72218e50236d	credit	228205.13	4107692.36	Alokasi donasi #4e20158d	db85015c-e8c6-41f8-a0ab-98f0ba5d86b3	2026-06-26 09:00:02.523473	2026-06-26 09:00:02.523477	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	2465e10d-25d5-4a5c-8abd-94a6807da63e	credit	135897.44	2446153.86	Alokasi donasi #4e20158d	696ba024-abbc-476b-bbf3-8aaacefcb969	2026-06-26 09:00:03.233697	2026-06-26 09:00:03.233701	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	c61f6f66-81d2-464d-933d-ed3367749a35	credit	135897.43	3741153.78	Alokasi donasi #4e20158d	26d6a9ec-4cc9-4b93-bd82-4592f8376231	2026-06-26 09:00:03.917973	2026-06-26 09:00:03.917976	t
793040a4-f4ed-4e82-99fc-8cb492ded4c1	\N	baccf0be-e11f-405f-9e26-c561f9f510e7	credit	228205.13	4107692.36	Alokasi donasi #a6b2956f	82b073b6-d896-41f6-8c98-dc28d04cf812	2026-06-26 09:00:04.539075	2026-06-26 09:00:04.539081	t
82147428-e16e-4ed8-9f62-bd5353a1b288	\N	bf2b568c-38e6-4d99-bd8c-3a76dc934caa	credit	135897.44	2446153.86	Alokasi donasi #a6b2956f	991cc21e-9ea6-4119-85e6-56da35ce40c3	2026-06-26 09:00:05.496209	2026-06-26 09:00:05.496213	t
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	\N	dbccf1af-54f5-4e7c-82e1-897133269716	credit	135897.43	3741153.78	Alokasi donasi #a6b2956f	49822144-7ffc-4328-b2d7-9c74ce057c0d	2026-06-26 09:00:06.45348	2026-06-26 09:00:06.453484	t
\.


--
-- Data for Name: withdrawals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.withdrawals (vendor_id, amount, bank_name, bank_account_number, bank_account_holder, status, transfer_reference, completed_at, notes, id, created_at, updated_at, is_active) FROM stdin;
706ffe8f-d51e-4a2f-924f-8180d76dc558	100000.00	BCA	12354648	VENDOR01	completed	WTH-20260523221935	2026-05-23 15:19:35.042776	\N	68b2292c-aeea-4ff9-a25f-ff1895a55967	2026-05-23 15:19:35.098881	2026-05-23 15:19:35.098881	t
88975b2b-ba37-4178-92db-235e6d9f0ff0	50000.00	BCA	1234567890	Pak Tarno	completed	WTH-20260526014417	2026-05-26 01:44:17.781635	\N	c190c589-47f6-4ecb-9b0b-fd7b5ff8eda4	2026-05-26 01:44:17.962187	2026-05-26 01:44:17.962191	t
\.


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: beneficiary_profiles beneficiary_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beneficiary_profiles
    ADD CONSTRAINT beneficiary_profiles_pkey PRIMARY KEY (id);


--
-- Name: billing_history billing_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_history
    ADD CONSTRAINT billing_history_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: children children_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.children
    ADD CONSTRAINT children_pkey PRIMARY KEY (id);


--
-- Name: donations donations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_pkey PRIMARY KEY (id);


--
-- Name: donor_profiles donor_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donor_profiles
    ADD CONSTRAINT donor_profiles_pkey PRIMARY KEY (id);


--
-- Name: fies_surveys fies_surveys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fies_surveys
    ADD CONSTRAINT fies_surveys_pkey PRIMARY KEY (id);


--
-- Name: nutrition_measurements nutrition_measurements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nutrition_measurements
    ADD CONSTRAINT nutrition_measurements_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: settlements settlements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT settlements_pkey PRIMARY KEY (id);


--
-- Name: stunting_risk_predictions stunting_risk_predictions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stunting_risk_predictions
    ADD CONSTRAINT stunting_risk_predictions_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: vendor_profiles vendor_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_profiles
    ADD CONSTRAINT vendor_profiles_pkey PRIMARY KEY (id);


--
-- Name: voucher_allowed_categories voucher_allowed_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voucher_allowed_categories
    ADD CONSTRAINT voucher_allowed_categories_pkey PRIMARY KEY (id);


--
-- Name: voucher_locks voucher_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voucher_locks
    ADD CONSTRAINT voucher_locks_pkey PRIMARY KEY (id);


--
-- Name: voucher_redemptions voucher_redemptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voucher_redemptions
    ADD CONSTRAINT voucher_redemptions_pkey PRIMARY KEY (id);


--
-- Name: voucher_transactions voucher_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voucher_transactions
    ADD CONSTRAINT voucher_transactions_pkey PRIMARY KEY (id);


--
-- Name: vouchers vouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_pkey PRIMARY KEY (id);


--
-- Name: wallet_allocations wallet_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_allocations
    ADD CONSTRAINT wallet_allocations_pkey PRIMARY KEY (id);


--
-- Name: wallet_transactions wallet_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);


--
-- Name: withdrawals withdrawals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_pkey PRIMARY KEY (id);


--
-- Name: idx_allowed_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_allowed_category ON public.voucher_allowed_categories USING btree (category_id, is_allowed);


--
-- Name: idx_audit_log_user_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_user_entity ON public.audit_logs USING btree (user_id, entity_type);


--
-- Name: idx_audit_logs_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_active ON public.audit_logs USING btree (created_at) WHERE (is_active = true);


--
-- Name: idx_beneficiary_profiles_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_beneficiary_profiles_active ON public.beneficiary_profiles USING btree (user_id) WHERE (is_active = true);


--
-- Name: idx_billing_history_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_history_date ON public.billing_history USING btree (billing_date);


--
-- Name: idx_billing_history_subscription; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_history_subscription ON public.billing_history USING btree (subscription_id);


--
-- Name: idx_cart_beneficiary_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cart_beneficiary_created ON public.cart_items USING btree (beneficiary_id, created_at);


--
-- Name: idx_cart_beneficiary_product; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_cart_beneficiary_product ON public.cart_items USING btree (beneficiary_id, product_id);


--
-- Name: idx_children_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_children_active ON public.children USING btree (beneficiary_id) WHERE (is_active = true);


--
-- Name: idx_donation_created_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_donation_created_status ON public.donations USING btree (created_at, status);


--
-- Name: idx_donation_donor_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_donation_donor_status ON public.donations USING btree (donor_id, status);


--
-- Name: idx_donation_subscription; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_donation_subscription ON public.donations USING btree (subscription_id);


--
-- Name: idx_donations_active_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_donations_active_status ON public.donations USING btree (created_at, status) WHERE (is_active = true);


--
-- Name: idx_donor_profiles_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_donor_profiles_active ON public.donor_profiles USING btree (user_id) WHERE (is_active = true);


--
-- Name: idx_fies_survey_beneficiary_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fies_survey_beneficiary_period ON public.fies_surveys USING btree (beneficiary_id, survey_year, survey_month);


--
-- Name: idx_fies_surveys_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fies_surveys_active ON public.fies_surveys USING btree (survey_year, survey_month) WHERE (is_active = true);


--
-- Name: idx_nutrition_measurement_child_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nutrition_measurement_child_date ON public.nutrition_measurements USING btree (child_id, measurement_date);


--
-- Name: idx_nutrition_measurements_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nutrition_measurements_active ON public.nutrition_measurements USING btree (measurement_date) WHERE (is_active = true);


--
-- Name: idx_order_beneficiary_vendor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_beneficiary_vendor ON public.orders USING btree (beneficiary_id, vendor_id);


--
-- Name: idx_order_status_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_status_created ON public.orders USING btree (status, created_at);


--
-- Name: idx_orders_active_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_active_status ON public.orders USING btree (created_at, status) WHERE (is_active = true);


--
-- Name: idx_product_name_vendor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_name_vendor ON public.products USING btree (name, vendor_id);


--
-- Name: idx_product_vendor_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_vendor_category ON public.products USING btree (vendor_id, category_id);


--
-- Name: idx_products_active_approval; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_active_approval ON public.products USING btree (approval_status) WHERE (is_active = true);


--
-- Name: idx_settlement_vendor_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_settlement_vendor_period ON public.settlements USING btree (vendor_id, period_start);


--
-- Name: idx_settlements_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_settlements_active ON public.settlements USING btree (period_start) WHERE (is_active = true);


--
-- Name: idx_stunting_risk_child_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stunting_risk_child_created ON public.stunting_risk_predictions USING btree (child_id, created_at);


--
-- Name: idx_subscription_donor_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_donor_status ON public.subscriptions USING btree (donor_id, status);


--
-- Name: idx_subscription_next_billing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_next_billing ON public.subscriptions USING btree (next_billing_date);


--
-- Name: idx_subscription_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_plan ON public.subscriptions USING btree (plan_id);


--
-- Name: idx_user_profiles_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_active ON public.user_profiles USING btree (created_at) WHERE (is_active = true);


--
-- Name: idx_vendor_profiles_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_profiles_active ON public.vendor_profiles USING btree (user_id) WHERE (is_active = true);


--
-- Name: idx_voucher_beneficiary_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_voucher_beneficiary_status ON public.vouchers USING btree (beneficiary_id, status);


--
-- Name: idx_voucher_code_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_voucher_code_status ON public.vouchers USING btree (code, status);


--
-- Name: idx_voucher_lock_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_voucher_lock_expires ON public.voucher_locks USING btree (expires_at);


--
-- Name: idx_voucher_transaction_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_voucher_transaction_created ON public.voucher_transactions USING btree (voucher_id, created_at);


--
-- Name: idx_voucher_transaction_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_voucher_transaction_type ON public.voucher_transactions USING btree (voucher_id, transaction_type);


--
-- Name: idx_vouchers_active_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vouchers_active_status ON public.vouchers USING btree (status, expiry_date) WHERE (is_active = true);


--
-- Name: idx_wallet_allocation_beneficiary_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_allocation_beneficiary_status ON public.wallet_allocations USING btree (beneficiary_id, status);


--
-- Name: idx_wallet_allocation_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_allocation_expires ON public.wallet_allocations USING btree (expires_at);


--
-- Name: idx_wallet_tx_beneficiary_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_tx_beneficiary_created ON public.wallet_transactions USING btree (beneficiary_id, created_at);


--
-- Name: idx_wallet_tx_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_tx_order ON public.wallet_transactions USING btree (order_id);


--
-- Name: ix_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: ix_audit_logs_entity_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_logs_entity_id ON public.audit_logs USING btree (entity_id);


--
-- Name: ix_audit_logs_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_logs_id ON public.audit_logs USING btree (id);


--
-- Name: ix_audit_logs_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_logs_is_active ON public.audit_logs USING btree (is_active);


--
-- Name: ix_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: ix_beneficiary_profiles_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_beneficiary_profiles_created_at ON public.beneficiary_profiles USING btree (created_at);


--
-- Name: ix_beneficiary_profiles_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_beneficiary_profiles_id ON public.beneficiary_profiles USING btree (id);


--
-- Name: ix_beneficiary_profiles_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_beneficiary_profiles_is_active ON public.beneficiary_profiles USING btree (is_active);


--
-- Name: ix_beneficiary_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_beneficiary_profiles_user_id ON public.beneficiary_profiles USING btree (user_id);


--
-- Name: ix_billing_history_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_billing_history_created_at ON public.billing_history USING btree (created_at);


--
-- Name: ix_billing_history_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_billing_history_id ON public.billing_history USING btree (id);


--
-- Name: ix_billing_history_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_billing_history_is_active ON public.billing_history USING btree (is_active);


--
-- Name: ix_billing_history_subscription_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_billing_history_subscription_id ON public.billing_history USING btree (subscription_id);


--
-- Name: ix_cart_items_beneficiary_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_cart_items_beneficiary_id ON public.cart_items USING btree (beneficiary_id);


--
-- Name: ix_cart_items_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_cart_items_created_at ON public.cart_items USING btree (created_at);


--
-- Name: ix_cart_items_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_cart_items_id ON public.cart_items USING btree (id);


--
-- Name: ix_cart_items_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_cart_items_is_active ON public.cart_items USING btree (is_active);


--
-- Name: ix_cart_items_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_cart_items_product_id ON public.cart_items USING btree (product_id);


--
-- Name: ix_categories_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_categories_created_at ON public.categories USING btree (created_at);


--
-- Name: ix_categories_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_categories_id ON public.categories USING btree (id);


--
-- Name: ix_categories_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_categories_is_active ON public.categories USING btree (is_active);


--
-- Name: ix_categories_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_categories_name ON public.categories USING btree (name);


--
-- Name: ix_categories_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_categories_slug ON public.categories USING btree (slug);


--
-- Name: ix_children_beneficiary_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_children_beneficiary_id ON public.children USING btree (beneficiary_id);


--
-- Name: ix_children_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_children_created_at ON public.children USING btree (created_at);


--
-- Name: ix_children_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_children_id ON public.children USING btree (id);


--
-- Name: ix_children_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_children_is_active ON public.children USING btree (is_active);


--
-- Name: ix_donations_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_donations_created_at ON public.donations USING btree (created_at);


--
-- Name: ix_donations_donor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_donations_donor_id ON public.donations USING btree (donor_id);


--
-- Name: ix_donations_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_donations_id ON public.donations USING btree (id);


--
-- Name: ix_donations_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_donations_is_active ON public.donations USING btree (is_active);


--
-- Name: ix_donations_midtrans_transaction_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_donations_midtrans_transaction_id ON public.donations USING btree (midtrans_transaction_id);


--
-- Name: ix_donations_recipient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_donations_recipient_id ON public.donations USING btree (recipient_id);


--
-- Name: ix_donations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_donations_status ON public.donations USING btree (status);


--
-- Name: ix_donor_profiles_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_donor_profiles_created_at ON public.donor_profiles USING btree (created_at);


--
-- Name: ix_donor_profiles_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_donor_profiles_id ON public.donor_profiles USING btree (id);


--
-- Name: ix_donor_profiles_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_donor_profiles_is_active ON public.donor_profiles USING btree (is_active);


--
-- Name: ix_donor_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_donor_profiles_user_id ON public.donor_profiles USING btree (user_id);


--
-- Name: ix_fies_surveys_beneficiary_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_fies_surveys_beneficiary_id ON public.fies_surveys USING btree (beneficiary_id);


--
-- Name: ix_fies_surveys_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_fies_surveys_created_at ON public.fies_surveys USING btree (created_at);


--
-- Name: ix_fies_surveys_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_fies_surveys_id ON public.fies_surveys USING btree (id);


--
-- Name: ix_fies_surveys_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_fies_surveys_is_active ON public.fies_surveys USING btree (is_active);


--
-- Name: ix_fies_surveys_survey_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_fies_surveys_survey_date ON public.fies_surveys USING btree (survey_date);


--
-- Name: ix_nutrition_measurements_child_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_nutrition_measurements_child_id ON public.nutrition_measurements USING btree (child_id);


--
-- Name: ix_nutrition_measurements_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_nutrition_measurements_created_at ON public.nutrition_measurements USING btree (created_at);


--
-- Name: ix_nutrition_measurements_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_nutrition_measurements_id ON public.nutrition_measurements USING btree (id);


--
-- Name: ix_nutrition_measurements_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_nutrition_measurements_is_active ON public.nutrition_measurements USING btree (is_active);


--
-- Name: ix_nutrition_measurements_measurement_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_nutrition_measurements_measurement_date ON public.nutrition_measurements USING btree (measurement_date);


--
-- Name: ix_order_items_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_order_items_created_at ON public.order_items USING btree (created_at);


--
-- Name: ix_order_items_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_order_items_id ON public.order_items USING btree (id);


--
-- Name: ix_order_items_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_order_items_is_active ON public.order_items USING btree (is_active);


--
-- Name: ix_order_items_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_order_items_order_id ON public.order_items USING btree (order_id);


--
-- Name: ix_order_items_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_order_items_product_id ON public.order_items USING btree (product_id);


--
-- Name: ix_orders_beneficiary_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_orders_beneficiary_id ON public.orders USING btree (beneficiary_id);


--
-- Name: ix_orders_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_orders_created_at ON public.orders USING btree (created_at);


--
-- Name: ix_orders_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_orders_id ON public.orders USING btree (id);


--
-- Name: ix_orders_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_orders_is_active ON public.orders USING btree (is_active);


--
-- Name: ix_orders_pickup_qr_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_orders_pickup_qr_code ON public.orders USING btree (pickup_qr_code);


--
-- Name: ix_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_orders_status ON public.orders USING btree (status);


--
-- Name: ix_orders_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_orders_vendor_id ON public.orders USING btree (vendor_id);


--
-- Name: ix_products_approval_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_products_approval_status ON public.products USING btree (approval_status);


--
-- Name: ix_products_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_products_category_id ON public.products USING btree (category_id);


--
-- Name: ix_products_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_products_created_at ON public.products USING btree (created_at);


--
-- Name: ix_products_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_products_id ON public.products USING btree (id);


--
-- Name: ix_products_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_products_is_active ON public.products USING btree (is_active);


--
-- Name: ix_products_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_products_name ON public.products USING btree (name);


--
-- Name: ix_products_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_products_vendor_id ON public.products USING btree (vendor_id);


--
-- Name: ix_settlements_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_settlements_created_at ON public.settlements USING btree (created_at);


--
-- Name: ix_settlements_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_settlements_id ON public.settlements USING btree (id);


--
-- Name: ix_settlements_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_settlements_is_active ON public.settlements USING btree (is_active);


--
-- Name: ix_settlements_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_settlements_status ON public.settlements USING btree (status);


--
-- Name: ix_settlements_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_settlements_vendor_id ON public.settlements USING btree (vendor_id);


--
-- Name: ix_stunting_risk_predictions_child_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_stunting_risk_predictions_child_id ON public.stunting_risk_predictions USING btree (child_id);


--
-- Name: ix_stunting_risk_predictions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_stunting_risk_predictions_created_at ON public.stunting_risk_predictions USING btree (created_at);


--
-- Name: ix_stunting_risk_predictions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_stunting_risk_predictions_id ON public.stunting_risk_predictions USING btree (id);


--
-- Name: ix_stunting_risk_predictions_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_stunting_risk_predictions_is_active ON public.stunting_risk_predictions USING btree (is_active);


--
-- Name: ix_stunting_risk_predictions_measurement_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_stunting_risk_predictions_measurement_id ON public.stunting_risk_predictions USING btree (measurement_id);


--
-- Name: ix_stunting_risk_predictions_risk_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_stunting_risk_predictions_risk_level ON public.stunting_risk_predictions USING btree (risk_level);


--
-- Name: ix_subscription_plans_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_subscription_plans_created_at ON public.subscription_plans USING btree (created_at);


--
-- Name: ix_subscription_plans_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_subscription_plans_id ON public.subscription_plans USING btree (id);


--
-- Name: ix_subscriptions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_subscriptions_created_at ON public.subscriptions USING btree (created_at);


--
-- Name: ix_subscriptions_donor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_subscriptions_donor_id ON public.subscriptions USING btree (donor_id);


--
-- Name: ix_subscriptions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_subscriptions_id ON public.subscriptions USING btree (id);


--
-- Name: ix_subscriptions_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_subscriptions_is_active ON public.subscriptions USING btree (is_active);


--
-- Name: ix_subscriptions_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_subscriptions_plan_id ON public.subscriptions USING btree (plan_id);


--
-- Name: ix_subscriptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_subscriptions_status ON public.subscriptions USING btree (status);


--
-- Name: ix_user_profiles_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_user_profiles_created_at ON public.user_profiles USING btree (created_at);


--
-- Name: ix_user_profiles_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_user_profiles_id ON public.user_profiles USING btree (id);


--
-- Name: ix_user_profiles_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_user_profiles_is_active ON public.user_profiles USING btree (is_active);


--
-- Name: ix_user_profiles_nik; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_user_profiles_nik ON public.user_profiles USING btree (nik);


--
-- Name: ix_user_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_user_profiles_user_id ON public.user_profiles USING btree (user_id);


--
-- Name: ix_vendor_profiles_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_vendor_profiles_created_at ON public.vendor_profiles USING btree (created_at);


--
-- Name: ix_vendor_profiles_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_vendor_profiles_id ON public.vendor_profiles USING btree (id);


--
-- Name: ix_vendor_profiles_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_vendor_profiles_is_active ON public.vendor_profiles USING btree (is_active);


--
-- Name: ix_vendor_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_vendor_profiles_user_id ON public.vendor_profiles USING btree (user_id);


--
-- Name: ix_voucher_allowed_categories_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_voucher_allowed_categories_category_id ON public.voucher_allowed_categories USING btree (category_id);


--
-- Name: ix_voucher_allowed_categories_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_voucher_allowed_categories_created_at ON public.voucher_allowed_categories USING btree (created_at);


--
-- Name: ix_voucher_allowed_categories_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_voucher_allowed_categories_id ON public.voucher_allowed_categories USING btree (id);


--
-- Name: ix_voucher_allowed_categories_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_voucher_allowed_categories_is_active ON public.voucher_allowed_categories USING btree (is_active);


--
-- Name: ix_voucher_locks_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_voucher_locks_created_at ON public.voucher_locks USING btree (created_at);


--
-- Name: ix_voucher_locks_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_voucher_locks_expires_at ON public.voucher_locks USING btree (expires_at);


--
-- Name: ix_voucher_locks_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_voucher_locks_id ON public.voucher_locks USING btree (id);


--
-- Name: ix_voucher_locks_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_voucher_locks_is_active ON public.voucher_locks USING btree (is_active);


--
-- Name: ix_voucher_locks_voucher_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_voucher_locks_voucher_id ON public.voucher_locks USING btree (voucher_id);


--
-- Name: ix_voucher_redemptions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_voucher_redemptions_created_at ON public.voucher_redemptions USING btree (created_at);


--
-- Name: ix_voucher_redemptions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_voucher_redemptions_id ON public.voucher_redemptions USING btree (id);


--
-- Name: ix_voucher_redemptions_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_voucher_redemptions_is_active ON public.voucher_redemptions USING btree (is_active);


--
-- Name: ix_voucher_redemptions_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_voucher_redemptions_order_id ON public.voucher_redemptions USING btree (order_id);


--
-- Name: ix_voucher_redemptions_voucher_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_voucher_redemptions_voucher_id ON public.voucher_redemptions USING btree (voucher_id);


--
-- Name: ix_voucher_transactions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_voucher_transactions_created_at ON public.voucher_transactions USING btree (created_at);


--
-- Name: ix_voucher_transactions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_voucher_transactions_id ON public.voucher_transactions USING btree (id);


--
-- Name: ix_voucher_transactions_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_voucher_transactions_is_active ON public.voucher_transactions USING btree (is_active);


--
-- Name: ix_voucher_transactions_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_voucher_transactions_order_id ON public.voucher_transactions USING btree (order_id);


--
-- Name: ix_voucher_transactions_transaction_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_voucher_transactions_transaction_type ON public.voucher_transactions USING btree (transaction_type);


--
-- Name: ix_voucher_transactions_voucher_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_voucher_transactions_voucher_id ON public.voucher_transactions USING btree (voucher_id);


--
-- Name: ix_vouchers_beneficiary_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_vouchers_beneficiary_id ON public.vouchers USING btree (beneficiary_id);


--
-- Name: ix_vouchers_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_vouchers_code ON public.vouchers USING btree (code);


--
-- Name: ix_vouchers_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_vouchers_created_at ON public.vouchers USING btree (created_at);


--
-- Name: ix_vouchers_donation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_vouchers_donation_id ON public.vouchers USING btree (donation_id);


--
-- Name: ix_vouchers_expiry_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_vouchers_expiry_date ON public.vouchers USING btree (expiry_date);


--
-- Name: ix_vouchers_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_vouchers_id ON public.vouchers USING btree (id);


--
-- Name: ix_vouchers_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_vouchers_is_active ON public.vouchers USING btree (is_active);


--
-- Name: ix_vouchers_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_vouchers_status ON public.vouchers USING btree (status);


--
-- Name: ix_wallet_allocations_beneficiary_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_wallet_allocations_beneficiary_id ON public.wallet_allocations USING btree (beneficiary_id);


--
-- Name: ix_wallet_allocations_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_wallet_allocations_created_at ON public.wallet_allocations USING btree (created_at);


--
-- Name: ix_wallet_allocations_donation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_wallet_allocations_donation_id ON public.wallet_allocations USING btree (donation_id);


--
-- Name: ix_wallet_allocations_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_wallet_allocations_expires_at ON public.wallet_allocations USING btree (expires_at);


--
-- Name: ix_wallet_allocations_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_wallet_allocations_id ON public.wallet_allocations USING btree (id);


--
-- Name: ix_wallet_allocations_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_wallet_allocations_is_active ON public.wallet_allocations USING btree (is_active);


--
-- Name: ix_wallet_allocations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_wallet_allocations_status ON public.wallet_allocations USING btree (status);


--
-- Name: ix_wallet_transactions_allocation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_wallet_transactions_allocation_id ON public.wallet_transactions USING btree (allocation_id);


--
-- Name: ix_wallet_transactions_beneficiary_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_wallet_transactions_beneficiary_id ON public.wallet_transactions USING btree (beneficiary_id);


--
-- Name: ix_wallet_transactions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_wallet_transactions_created_at ON public.wallet_transactions USING btree (created_at);


--
-- Name: ix_wallet_transactions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_wallet_transactions_id ON public.wallet_transactions USING btree (id);


--
-- Name: ix_wallet_transactions_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_wallet_transactions_is_active ON public.wallet_transactions USING btree (is_active);


--
-- Name: ix_wallet_transactions_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_wallet_transactions_order_id ON public.wallet_transactions USING btree (order_id);


--
-- Name: ix_wallet_transactions_transaction_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_wallet_transactions_transaction_type ON public.wallet_transactions USING btree (transaction_type);


--
-- Name: ix_withdrawals_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_withdrawals_created_at ON public.withdrawals USING btree (created_at);


--
-- Name: ix_withdrawals_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_withdrawals_id ON public.withdrawals USING btree (id);


--
-- Name: ix_withdrawals_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_withdrawals_is_active ON public.withdrawals USING btree (is_active);


--
-- Name: ix_withdrawals_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_withdrawals_status ON public.withdrawals USING btree (status);


--
-- Name: ix_withdrawals_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_withdrawals_vendor_id ON public.withdrawals USING btree (vendor_id);


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE SET NULL;


--
-- Name: beneficiary_profiles beneficiary_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beneficiary_profiles
    ADD CONSTRAINT beneficiary_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;


--
-- Name: billing_history billing_history_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_history
    ADD CONSTRAINT billing_history_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_beneficiary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_beneficiary_id_fkey FOREIGN KEY (beneficiary_id) REFERENCES public.beneficiary_profiles(user_id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: children children_beneficiary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.children
    ADD CONSTRAINT children_beneficiary_id_fkey FOREIGN KEY (beneficiary_id) REFERENCES public.beneficiary_profiles(user_id) ON DELETE CASCADE;


--
-- Name: donations donations_donor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_donor_id_fkey FOREIGN KEY (donor_id) REFERENCES public.donor_profiles(user_id) ON DELETE CASCADE;


--
-- Name: donations donations_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.beneficiary_profiles(user_id) ON DELETE SET NULL;


--
-- Name: donations donations_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;


--
-- Name: donor_profiles donor_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donor_profiles
    ADD CONSTRAINT donor_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;


--
-- Name: fies_surveys fies_surveys_beneficiary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fies_surveys
    ADD CONSTRAINT fies_surveys_beneficiary_id_fkey FOREIGN KEY (beneficiary_id) REFERENCES public.beneficiary_profiles(user_id) ON DELETE CASCADE;


--
-- Name: orders fk_orders_confirmed_by_vendor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_orders_confirmed_by_vendor FOREIGN KEY (confirmed_by_vendor_id) REFERENCES public.vendor_profiles(user_id) ON DELETE SET NULL;


--
-- Name: nutrition_measurements nutrition_measurements_child_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nutrition_measurements
    ADD CONSTRAINT nutrition_measurements_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: orders orders_beneficiary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_beneficiary_id_fkey FOREIGN KEY (beneficiary_id) REFERENCES public.beneficiary_profiles(user_id) ON DELETE CASCADE;


--
-- Name: orders orders_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(user_id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: products products_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(user_id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: settlements settlements_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT settlements_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(user_id) ON DELETE CASCADE;


--
-- Name: stunting_risk_predictions stunting_risk_predictions_child_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stunting_risk_predictions
    ADD CONSTRAINT stunting_risk_predictions_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;


--
-- Name: stunting_risk_predictions stunting_risk_predictions_measurement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stunting_risk_predictions
    ADD CONSTRAINT stunting_risk_predictions_measurement_id_fkey FOREIGN KEY (measurement_id) REFERENCES public.nutrition_measurements(id) ON DELETE SET NULL;


--
-- Name: subscriptions subscriptions_donor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_donor_id_fkey FOREIGN KEY (donor_id) REFERENCES public.donor_profiles(user_id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vendor_profiles vendor_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_profiles
    ADD CONSTRAINT vendor_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;


--
-- Name: voucher_allowed_categories voucher_allowed_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voucher_allowed_categories
    ADD CONSTRAINT voucher_allowed_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: voucher_locks voucher_locks_voucher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voucher_locks
    ADD CONSTRAINT voucher_locks_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES public.vouchers(id) ON DELETE CASCADE;


--
-- Name: voucher_redemptions voucher_redemptions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voucher_redemptions
    ADD CONSTRAINT voucher_redemptions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: voucher_redemptions voucher_redemptions_voucher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voucher_redemptions
    ADD CONSTRAINT voucher_redemptions_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES public.vouchers(id) ON DELETE CASCADE;


--
-- Name: voucher_transactions voucher_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voucher_transactions
    ADD CONSTRAINT voucher_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: voucher_transactions voucher_transactions_voucher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voucher_transactions
    ADD CONSTRAINT voucher_transactions_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES public.vouchers(id) ON DELETE CASCADE;


--
-- Name: vouchers vouchers_beneficiary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_beneficiary_id_fkey FOREIGN KEY (beneficiary_id) REFERENCES public.beneficiary_profiles(user_id) ON DELETE CASCADE;


--
-- Name: vouchers vouchers_donation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_donation_id_fkey FOREIGN KEY (donation_id) REFERENCES public.donations(id) ON DELETE CASCADE;


--
-- Name: wallet_allocations wallet_allocations_beneficiary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_allocations
    ADD CONSTRAINT wallet_allocations_beneficiary_id_fkey FOREIGN KEY (beneficiary_id) REFERENCES public.beneficiary_profiles(user_id) ON DELETE CASCADE;


--
-- Name: wallet_allocations wallet_allocations_donation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_allocations
    ADD CONSTRAINT wallet_allocations_donation_id_fkey FOREIGN KEY (donation_id) REFERENCES public.donations(id) ON DELETE SET NULL;


--
-- Name: wallet_transactions wallet_transactions_allocation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_allocation_id_fkey FOREIGN KEY (allocation_id) REFERENCES public.wallet_allocations(id) ON DELETE SET NULL;


--
-- Name: wallet_transactions wallet_transactions_beneficiary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_beneficiary_id_fkey FOREIGN KEY (beneficiary_id) REFERENCES public.beneficiary_profiles(user_id) ON DELETE CASCADE;


--
-- Name: wallet_transactions wallet_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: withdrawals withdrawals_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(user_id) ON DELETE CASCADE;


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));


--
-- Name: user_roles Admins can read all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: user_roles Users can insert their own role on signup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own role on signup" ON public.user_roles FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: user_roles Users can read their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read their own roles" ON public.user_roles FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: alembic_version; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.alembic_version ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: beneficiary_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.beneficiary_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: cart_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: children; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

--
-- Name: donations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

--
-- Name: donor_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.donor_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: fies_surveys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fies_surveys ENABLE ROW LEVEL SECURITY;

--
-- Name: nutrition_measurements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.nutrition_measurements ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: settlements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: vendor_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: voucher_allowed_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.voucher_allowed_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: voucher_locks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.voucher_locks ENABLE ROW LEVEL SECURITY;

--
-- Name: voucher_redemptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.voucher_redemptions ENABLE ROW LEVEL SECURITY;

--
-- Name: voucher_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.voucher_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: vouchers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict Yz7pUB0KPAznkzPyAl7OlaXogjpNZuDoHlRBJ4MHRQCyQnc6QAJDafGvpotoWG1

