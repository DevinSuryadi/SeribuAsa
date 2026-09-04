--
-- PostgreSQL database dump
--

\restrict kOvsyGSkS22WXpGhsrcpmjiGmt5otoOQ8lAh681hXFYfJyQpPs6U890fqrRyAss

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
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom_claims_allowlist text[] DEFAULT '{}'::text[] NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


--
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.custom_oauth_providers (id, provider_type, identifier, name, client_id, client_secret, acceptable_client_ids, scopes, pkce_enabled, attribute_mapping, authorization_params, enabled, email_optional, issuer, discovery_url, skip_nonce_check, cached_discovery, discovery_cached_at, authorization_url, token_url, userinfo_url, jwks_uri, created_at, updated_at, custom_claims_allowlist) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
611f2479-0027-4aac-a8b7-8b37b57d0819	\N	\N	\N	\N	google			2026-06-10 09:46:18.960097+00	2026-06-10 09:46:18.960097+00	oauth	\N	\N	http://localhost:5173	\N	\N	f
3cbe313d-8a96-45da-abdb-e0ba0af60854	\N	\N	\N	\N	google			2026-06-10 09:49:17.206073+00	2026-06-10 09:49:17.206073+00	oauth	\N	\N	http://localhost:5173	\N	\N	f
b24f81fe-0488-44e2-a567-2e53774a2749	\N	\N	\N	\N	google			2026-04-07 06:07:01.934197+00	2026-04-07 06:07:01.934197+00	oauth	\N	\N	http://localhost:5173/login	\N	\N	f
4cf879a8-7e6b-4dd4-8f6c-0ed2abec98b7	\N	\N	\N	\N	google			2026-06-10 09:51:23.845702+00	2026-06-10 09:51:23.845702+00	oauth	\N	\N	http://localhost:5173	\N	\N	f
45999664-9c47-4cc4-ab56-4eb46a4af8a5	\N	\N	\N	\N	google			2026-04-07 06:20:13.589693+00	2026-04-07 06:20:13.589693+00	oauth	\N	\N	http://localhost:5173/login	\N	\N	f
2d96827c-b72d-40c3-97c9-d80de66b9652	\N	\N	\N	\N	google			2026-06-10 09:59:17.638842+00	2026-06-10 09:59:17.638842+00	oauth	\N	\N	http://localhost:5173	\N	\N	f
4d86b83e-65b0-4ebd-a3a4-726ba7467c7e	\N	\N	\N	\N	google			2026-06-10 10:00:31.096328+00	2026-06-10 10:00:31.096328+00	oauth	\N	\N	http://localhost:5173	\N	\N	f
830729e9-c1a2-4968-9764-780e1df888a2	\N	\N	\N	\N	google			2026-06-10 10:14:03.453433+00	2026-06-10 10:14:03.453433+00	oauth	\N	\N	http://localhost:5173	\N	\N	f
d8d45f36-806f-4078-8ff3-4d1f8e0c6aba	\N	\N	\N	\N	google			2026-04-19 14:18:21.538538+00	2026-04-19 14:18:21.538538+00	oauth	\N	\N	http://localhost:5173/login	\N	\N	f
1cd856ef-55b6-42cf-a22e-62e934f41214	\N	\N	\N	\N	google			2026-04-24 15:18:16.169918+00	2026-04-24 15:18:16.169918+00	oauth	\N	\N	http://localhost:5173/login	\N	\N	f
cc0eb1bb-709f-4333-810a-62c67cc5cd06	\N	\N	\N	\N	google			2026-04-24 15:18:24.017979+00	2026-04-24 15:18:24.017979+00	oauth	\N	\N	http://localhost:5173/login	\N	\N	f
de4bddfd-922c-4ec2-a5dc-0a4301688649	\N	\N	\N	\N	google			2026-05-15 09:27:44.531502+00	2026-05-15 09:27:44.531502+00	oauth	\N	\N	http://localhost:5173/login	\N	\N	f
c8162e6d-68e7-49a2-a66c-459864cb2142	\N	\N	\N	\N	google			2026-05-19 07:43:02.824595+00	2026-05-19 07:43:02.824595+00	oauth	\N	\N	http://localhost:5173/login	\N	\N	f
52b86d40-1029-4d0b-b907-c3d230f7ea2e	\N	\N	\N	\N	google			2026-06-10 18:57:57.306841+00	2026-06-10 18:57:57.306841+00	oauth	\N	\N	http://localhost:5173	\N	\N	f
078b62ae-3a92-40a2-8c3c-8ac229c64dd9	\N	\N	\N	\N	google			2026-05-25 18:41:07.654796+00	2026-05-25 18:41:07.654796+00	oauth	\N	\N	http://localhost:5173/login	\N	\N	f
c71d753a-1286-4dec-be06-dcc9a703bc7b	\N	\N	\N	\N	google			2026-05-25 18:49:28.955397+00	2026-05-25 18:49:28.955397+00	oauth	\N	\N	http://localhost:5173/login	\N	\N	f
af142df7-05cc-412f-96b3-5727b69bb882	\N	\N	\N	\N	google			2026-05-25 18:50:35.904234+00	2026-05-25 18:50:35.904234+00	oauth	\N	\N	http://localhost:5173/login	\N	\N	f
ee2ee495-2c17-4cd4-ad4f-e524261e7e14	\N	\N	\N	\N	google			2026-05-26 04:24:27.60213+00	2026-05-26 04:24:27.60213+00	oauth	\N	\N	http://localhost:5173/login	\N	\N	f
a908f095-e0fb-4233-b911-355cee2cb384	\N	\N	\N	\N	google			2026-05-26 04:29:39.076933+00	2026-05-26 04:29:39.076933+00	oauth	\N	\N	http://localhost:5173/login	\N	\N	f
f3cd6880-b250-4205-bb28-5b1bf6cbf559	\N	\N	\N	\N	google			2026-06-09 13:11:48.647427+00	2026-06-09 13:11:48.647427+00	oauth	\N	\N	http://localhost:5173	\N	\N	f
37ee0c4f-5464-4390-b8ad-d9597e838182	\N	\N	\N	\N	google			2026-06-16 04:55:35.348391+00	2026-06-16 04:55:35.348391+00	oauth	\N	\N	http://localhost:5173/login	\N	\N	f
d6f57b78-8ee2-42c7-8305-b921c9bc648b	\N	\N	\N	\N	google			2026-06-16 05:03:22.027751+00	2026-06-16 05:03:22.027751+00	oauth	\N	\N	http://localhost:5173/login	\N	\N	f
18ee1da3-04ec-4754-af49-8972f1563010	\N	\N	\N	\N	google			2026-06-10 09:17:32.184661+00	2026-06-10 09:17:32.184661+00	oauth	\N	\N	http://localhost:5173	\N	\N	f
94d7275d-efbd-46e8-a030-3da525c84514	\N	\N	\N	\N	google			2026-06-10 09:24:03.677709+00	2026-06-10 09:24:03.677709+00	oauth	\N	\N	http://localhost:5173	\N	\N	f
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
110271860191377595706	0f639158-6f69-4764-9356-34162a491f92	{"iss": "https://accounts.google.com", "sub": "110271860191377595706", "name": "Achmd Farq", "email": "farqachmd@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLwFt3TMjXaSU1sU3oa9rZJEfx-7Rcvu-aOatmAjL0eb-_9Yg=s96-c", "full_name": "Achmd Farq", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLwFt3TMjXaSU1sU3oa9rZJEfx-7Rcvu-aOatmAjL0eb-_9Yg=s96-c", "provider_id": "110271860191377595706", "email_verified": true, "phone_verified": false}	google	2026-04-07 06:15:38.496243+00	2026-04-07 06:15:38.49629+00	2026-04-07 06:15:38.49629+00	6c33cf85-3afb-4e48-915a-588603606022
103131656179784509724	db79d4e9-89e4-4001-9942-28044f68bfb0	{"iss": "https://accounts.google.com", "sub": "103131656179784509724", "name": "Lulu Law", "email": "lululaaww@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocI1f4FSCoDUNF5Gj-mQaEkItsq6s-h_uqX1gQs09Typ8xdOopw=s96-c", "full_name": "Lulu Law", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocI1f4FSCoDUNF5Gj-mQaEkItsq6s-h_uqX1gQs09Typ8xdOopw=s96-c", "provider_id": "103131656179784509724", "email_verified": true, "phone_verified": false}	google	2026-04-07 06:15:54.322905+00	2026-04-07 06:15:54.322953+00	2026-04-07 06:15:54.322953+00	a324e511-4fe9-4a88-bde6-502ffc715864
d68b8ec6-00cb-4672-aa5f-604bac0c86a1	d68b8ec6-00cb-4672-aa5f-604bac0c86a1	{"sub": "d68b8ec6-00cb-4672-aa5f-604bac0c86a1", "email": "penerima@gmail.com", "full_name": "penerima", "email_verified": false, "phone_verified": false}	email	2026-04-05 11:47:56.656094+00	2026-04-05 11:47:56.656145+00	2026-04-05 11:47:56.656145+00	5bc8715c-a0cc-4a0a-89fb-0b247e42423d
ee4f68ab-cc12-45f8-92b6-3c1f7422aff6	ee4f68ab-cc12-45f8-92b6-3c1f7422aff6	{"sub": "ee4f68ab-cc12-45f8-92b6-3c1f7422aff6", "role": "beneficiary", "email": "penerima1@gmail.com", "phone": null, "address": null, "full_name": "Penerima1", "email_verified": false, "phone_verified": false}	email	2026-04-18 06:26:00.851131+00	2026-04-18 06:26:00.851181+00	2026-04-18 06:26:00.851181+00	a4451852-b48c-4155-95ae-2e7c9be3a660
103658095970827797134	f383af29-b1ef-431b-bb30-7f8d8c9f18a8	{"iss": "https://accounts.google.com", "sub": "103658095970827797134", "name": "foto faruq", "email": "fotofaruq2@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJb0mBsxh29_ESOfpdRrBZYVcEvmdf8uDWQjYFsV2QBvlqwCA=s96-c", "full_name": "foto faruq", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJb0mBsxh29_ESOfpdRrBZYVcEvmdf8uDWQjYFsV2QBvlqwCA=s96-c", "provider_id": "103658095970827797134", "email_verified": true, "phone_verified": false}	google	2026-04-19 14:18:39.167215+00	2026-04-19 14:18:39.167264+00	2026-04-19 14:20:01.704333+00	7d416f0d-01c3-4a2c-a7fa-a59374b9fa82
642a6f09-0362-449f-aa96-af1c02bcc955	642a6f09-0362-449f-aa96-af1c02bcc955	{"sub": "642a6f09-0362-449f-aa96-af1c02bcc955", "role": "donor", "email": "donatur2@gmail.com", "phone": null, "address": null, "full_name": "Donatur2", "email_verified": false, "phone_verified": false}	email	2026-04-22 00:20:47.266878+00	2026-04-22 00:20:47.266926+00	2026-04-22 00:20:47.266926+00	262d29a3-863b-44a5-8e84-501296099f24
796ed162-2338-4ce8-b57d-6abea2a1f503	796ed162-2338-4ce8-b57d-6abea2a1f503	{"sub": "796ed162-2338-4ce8-b57d-6abea2a1f503", "email": "admin@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-28 16:21:40.985556+00	2026-04-28 16:21:40.98561+00	2026-04-28 16:21:40.98561+00	5500685b-8777-442c-bea6-72bbd526c618
3d08937b-c6ab-43f6-9a51-f4b384585c62	3d08937b-c6ab-43f6-9a51-f4b384585c62	{"sub": "3d08937b-c6ab-43f6-9a51-f4b384585c62", "email": "faruq123@gmail.com", "full_name": "faruq", "email_verified": false, "phone_verified": false}	email	2026-04-05 16:01:01.420085+00	2026-04-05 16:01:01.420127+00	2026-04-05 16:01:01.420127+00	643183e5-cddd-45fa-89e6-21e1edc38f6b
80d7d392-e7b5-4f75-8ff2-baa2ad3c8e48	80d7d392-e7b5-4f75-8ff2-baa2ad3c8e48	{"sub": "80d7d392-e7b5-4f75-8ff2-baa2ad3c8e48", "role": "beneficiary", "email": "valenciaanjelina@gmail.com", "phone": null, "address": null, "full_name": "Valencia Anjelina", "email_verified": false, "phone_verified": false}	email	2026-06-10 09:18:16.071968+00	2026-06-10 09:18:16.072012+00	2026-06-10 09:18:16.072012+00	6b1d8d2a-2a25-4734-a844-fc5064935fa0
100895118706626920045	b4a06baa-2cf5-4817-9dfe-73cb4506a674	{"iss": "https://accounts.google.com", "sub": "100895118706626920045", "name": "Achmad Faruq", "email": "raja11.faruq@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLeDRYJ-CNjrADYghc27HWYjCyXbcjZiVDScIqIFgExwB0_wi4=s96-c", "full_name": "Achmad Faruq", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLeDRYJ-CNjrADYghc27HWYjCyXbcjZiVDScIqIFgExwB0_wi4=s96-c", "provider_id": "100895118706626920045", "email_verified": true, "phone_verified": false}	google	2026-05-09 16:02:50.893331+00	2026-05-09 16:02:50.893386+00	2026-05-19 08:08:21.765908+00	5bff55f7-b0e8-48ba-b300-fc14ccc5b934
72bddb91-e66b-4823-8b1e-c7e88304cbeb	72bddb91-e66b-4823-8b1e-c7e88304cbeb	{"sub": "72bddb91-e66b-4823-8b1e-c7e88304cbeb", "role": "donor", "email": "nadwahkh31@gmail.com", "phone": "0895320631772", "address": "Tangerang", "full_name": "Nadwah Khairunnisa", "email_verified": false, "phone_verified": false}	email	2026-06-09 13:11:30.667812+00	2026-06-09 13:11:30.667861+00	2026-06-09 13:11:30.667861+00	8e25b4d1-2ef6-4157-9bfd-46759d457c6a
103548275483768707389	ee1fc5d9-541b-4ee4-948c-c3e15ab36013	{"iss": "https://accounts.google.com", "sub": "103548275483768707389", "name": "Hana Muthia Yusuf 2306252566", "email": "hana.muthia@ui.ac.id", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKEiuZn1SZpEHA3M7H7Qz5iVgq3Nqr3X71bq9gGPrrk-WrU3g=s96-c", "full_name": "Hana Muthia Yusuf 2306252566", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKEiuZn1SZpEHA3M7H7Qz5iVgq3Nqr3X71bq9gGPrrk-WrU3g=s96-c", "provider_id": "103548275483768707389", "custom_claims": {"hd": "ui.ac.id"}, "email_verified": true, "phone_verified": false}	google	2026-06-09 13:17:40.714565+00	2026-06-09 13:17:40.714617+00	2026-06-09 13:17:40.714617+00	981c6b6b-dfce-4616-988d-1688f6c884b4
c99d71f2-8702-46a0-baf8-c775787f31fa	c99d71f2-8702-46a0-baf8-c775787f31fa	{"sub": "c99d71f2-8702-46a0-baf8-c775787f31fa", "role": "donor", "email": "bochip19@gmail.com", "phone": "089504024715", "address": "Thehok jambi , jambi selatan.", "full_name": "Antoni Lim", "email_verified": false, "phone_verified": false}	email	2026-06-10 09:22:33.331757+00	2026-06-10 09:22:33.331801+00	2026-06-10 09:22:33.331801+00	f9b5af67-6ab0-4856-aa22-f5c34ce623f5
107023484150270075469	679068fe-5f7b-426f-8bc5-702def6a2380	{"iss": "https://accounts.google.com", "sub": "107023484150270075469", "name": "Ladiva Aulia", "email": "ladivaaulia1326@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLv6YVNu9mU6-1mhGUuiaZYhGMMMAYDSXrEp4c2lrjf3_yve54=s96-c", "full_name": "Ladiva Aulia", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLv6YVNu9mU6-1mhGUuiaZYhGMMMAYDSXrEp4c2lrjf3_yve54=s96-c", "provider_id": "107023484150270075469", "email_verified": true, "phone_verified": false}	google	2026-06-09 16:20:42.530395+00	2026-06-09 16:20:42.530445+00	2026-06-10 13:25:12.922256+00	aa4214f4-a545-4383-96f8-f548825a62b9
d50ed1f1-04be-4b0e-9b8c-16ddfd4606ce	d50ed1f1-04be-4b0e-9b8c-16ddfd4606ce	{"sub": "d50ed1f1-04be-4b0e-9b8c-16ddfd4606ce", "role": "donor", "email": "lolkotali@gmail.com", "phone": null, "address": null, "full_name": "Kotali", "email_verified": false, "phone_verified": false}	email	2026-06-10 09:22:21.185072+00	2026-06-10 09:22:21.185117+00	2026-06-10 09:22:21.185117+00	9270ee20-5508-4a37-8230-dae99b67548e
cc5b179f-d89f-4392-9367-805c5ee21801	cc5b179f-d89f-4392-9367-805c5ee21801	{"sub": "cc5b179f-d89f-4392-9367-805c5ee21801", "email": "faruq1234@gmail.com", "full_name": "achhh", "email_verified": false, "phone_verified": false}	email	2026-04-05 17:53:58.619445+00	2026-04-05 17:53:58.619497+00	2026-04-05 17:53:58.619497+00	7b0be61d-f3f8-4bc5-bdab-ce6b47c52470
fb786028-4d27-4051-a3a8-9b2ea43df395	fb786028-4d27-4051-a3a8-9b2ea43df395	{"sub": "fb786028-4d27-4051-a3a8-9b2ea43df395", "role": "donor", "email": "donaturtesttest@gmail.com", "phone": "08675434567", "address": "dahjkahdkjahdkja", "full_name": "DonaturTestTest", "email_verified": false, "phone_verified": false}	email	2026-04-07 06:57:40.634196+00	2026-04-07 06:57:40.634258+00	2026-04-07 06:57:40.634258+00	ac197bf6-d1b3-4978-bd98-aff8e5c58172
112534055204974450269	77aa5e96-34a0-4366-8308-1bc8e5358d06	{"iss": "https://accounts.google.com", "sub": "112534055204974450269", "name": "Achmad Faruq", "email": "faruqmahdison@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJn9WOPI8EDPOP5mIkO9YWZH_sbtibiadPGSAtiRATzlvPzmA=s96-c", "full_name": "Achmad Faruq", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJn9WOPI8EDPOP5mIkO9YWZH_sbtibiadPGSAtiRATzlvPzmA=s96-c", "provider_id": "112534055204974450269", "email_verified": true, "phone_verified": false}	google	2026-04-07 07:01:26.20249+00	2026-04-07 07:01:26.202536+00	2026-04-07 07:01:26.202536+00	ac51c465-904e-401e-ad21-8879ae9fa8ef
52fae754-5e5d-41c9-9817-5c952533bd84	52fae754-5e5d-41c9-9817-5c952533bd84	{"sub": "52fae754-5e5d-41c9-9817-5c952533bd84", "role": "donor", "email": "donatur1@gmail.com", "phone": null, "address": null, "full_name": "Donatur1", "email_verified": false, "phone_verified": false}	email	2026-04-20 01:53:58.2684+00	2026-04-20 01:53:58.268453+00	2026-04-20 01:53:58.268453+00	667333dd-b8ce-4149-8dec-fe666a6513e0
ae19f5a1-35f1-413c-af42-c7001ee9492f	ae19f5a1-35f1-413c-af42-c7001ee9492f	{"sub": "ae19f5a1-35f1-413c-af42-c7001ee9492f", "role": "donor", "email": "donatur3@gmail.com", "phone": null, "address": null, "full_name": "Donatur3", "email_verified": false, "phone_verified": false}	email	2026-04-22 00:38:57.145342+00	2026-04-22 00:38:57.145392+00	2026-04-22 00:38:57.145392+00	e6d99248-c3b2-42a3-91c1-e413b4d4f8db
b327894c-5063-4980-adf4-9f42d8739525	b327894c-5063-4980-adf4-9f42d8739525	{"sub": "b327894c-5063-4980-adf4-9f42d8739525", "email": "achmad@gmail.com", "full_name": "achmad", "email_verified": false, "phone_verified": false}	email	2026-04-05 18:26:20.752678+00	2026-04-05 18:26:20.752727+00	2026-04-05 18:26:20.752727+00	9a643482-786b-4cbf-9c97-37003058b8df
f1177ee0-66c6-4167-923c-aeb1824d3c34	f1177ee0-66c6-4167-923c-aeb1824d3c34	{"sub": "f1177ee0-66c6-4167-923c-aeb1824d3c34", "role": "donor", "email": "donatur01@gmail.com", "phone": "08224564485945", "address": null, "full_name": "Donatur01", "email_verified": false, "phone_verified": false}	email	2026-05-03 09:57:44.039511+00	2026-05-03 09:57:44.039574+00	2026-05-03 09:57:44.039574+00	357b453a-88f7-4411-af15-0231c6877419
319688e1-ad41-4c83-a381-a8a700681e3d	319688e1-ad41-4c83-a381-a8a700681e3d	{"sub": "319688e1-ad41-4c83-a381-a8a700681e3d", "role": "beneficiary", "email": "devintest@gmail.com", "phone": "086534569851", "address": "ya", "full_name": "Devin", "email_verified": false, "phone_verified": false}	email	2026-05-19 08:49:00.1418+00	2026-05-19 08:49:00.141856+00	2026-05-19 08:49:00.141856+00	449e33da-9240-4fc4-9662-ff3e4071d2e6
021f699b-bfce-4bc1-a01a-474b9d8c98bf	021f699b-bfce-4bc1-a01a-474b9d8c98bf	{"sub": "021f699b-bfce-4bc1-a01a-474b9d8c98bf", "role": "donor", "email": "nadwah23001@mail.unpad.ac.id", "phone": "0895320631772", "address": "Tangerang", "full_name": "Nadwah Khairunnisa", "email_verified": false, "phone_verified": false}	email	2026-06-09 13:14:07.036463+00	2026-06-09 13:14:07.036538+00	2026-06-09 13:14:07.036538+00	cf3bfc6a-a5de-4d41-bafe-b6ab95381109
46f6f92d-39d9-4712-a2b8-73dd74ec44b6	46f6f92d-39d9-4712-a2b8-73dd74ec44b6	{"sub": "46f6f92d-39d9-4712-a2b8-73dd74ec44b6", "role": "donor", "email": "hanamuthiayusuf@gmail.com", "phone": null, "address": null, "full_name": "hana muthia", "email_verified": false, "phone_verified": false}	email	2026-06-09 13:20:05.143732+00	2026-06-09 13:20:05.143781+00	2026-06-09 13:20:05.143781+00	f0e84497-fdab-4f01-818d-1be57d10fc4f
105054331689439736856	021f699b-bfce-4bc1-a01a-474b9d8c98bf	{"iss": "https://accounts.google.com", "sub": "105054331689439736856", "name": "NADWAH KHAIRUNNISA", "email": "nadwah23001@mail.unpad.ac.id", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJr2JEADJulOcMebtX_4cNlmt48D1jGY7dQN2JZ3-uetb87Vg=s96-c", "full_name": "NADWAH KHAIRUNNISA", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJr2JEADJulOcMebtX_4cNlmt48D1jGY7dQN2JZ3-uetb87Vg=s96-c", "provider_id": "105054331689439736856", "custom_claims": {"hd": "mail.unpad.ac.id"}, "email_verified": true, "phone_verified": false}	google	2026-06-09 13:14:20.949209+00	2026-06-09 13:14:20.949254+00	2026-06-09 15:55:07.37003+00	0af7406f-f7c9-4ed7-96dd-b677929d9986
8f567802-a7ad-4f4f-8534-bdc036b09b97	8f567802-a7ad-4f4f-8534-bdc036b09b97	{"sub": "8f567802-a7ad-4f4f-8534-bdc036b09b97", "role": "donor", "email": "kivjo27@gmail.com", "phone": "082114529853", "address": null, "full_name": "Kimberly Aureva Johannes", "email_verified": false, "phone_verified": false}	email	2026-06-09 17:19:02.641064+00	2026-06-09 17:19:02.641114+00	2026-06-09 17:19:02.641114+00	270d722c-c3f1-4d8f-8e60-0bf08fda906f
357bd5bf-909d-4317-83a5-556c926ed56a	357bd5bf-909d-4317-83a5-556c926ed56a	{"sub": "357bd5bf-909d-4317-83a5-556c926ed56a", "role": "donor", "email": "devittaasarii04@gmail.com", "phone": "085266689551", "address": "Jambi", "full_name": "Devita", "email_verified": false, "phone_verified": false}	email	2026-06-10 09:20:16.039463+00	2026-06-10 09:20:16.039508+00	2026-06-10 09:20:16.039508+00	921a70d1-0398-4e73-ab57-cc82c423ff56
0aa32472-f539-4888-ab3f-db23cb4e5743	0aa32472-f539-4888-ab3f-db23cb4e5743	{"sub": "0aa32472-f539-4888-ab3f-db23cb4e5743", "role": "donor", "email": "candragaul1122@gmail.com", "phone": null, "address": null, "full_name": "Candra ", "email_verified": false, "phone_verified": false}	email	2026-06-10 09:23:55.990777+00	2026-06-10 09:23:55.990828+00	2026-06-10 09:23:55.990828+00	a6b25bcb-e11b-4f71-ab21-d7091b1bef75
0419ba30-33ce-40c0-bd61-31cfc233a271	0419ba30-33ce-40c0-bd61-31cfc233a271	{"sub": "0419ba30-33ce-40c0-bd61-31cfc233a271", "role": "vendor", "email": "viryyy0265@gmail.com", "phone": "082184636475", "address": null, "full_name": "Virly", "email_verified": false, "phone_verified": false}	email	2026-06-10 09:25:02.544273+00	2026-06-10 09:25:02.544351+00	2026-06-10 09:25:02.544351+00	fbe8e1c8-9d4a-489e-962b-3974fa5f62c0
106965379152356551841	b0a93dd4-8d79-4eea-bef9-d8e13bf54a46	{"iss": "https://accounts.google.com", "sub": "106965379152356551841", "name": "Alicia Huang", "email": "aliciahuang05@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocIHjDFOwD2IVDX2ACurSXpvUO9XZ7wEmYBuIIIYmEOnAvovOg=s96-c", "full_name": "Alicia Huang", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocIHjDFOwD2IVDX2ACurSXpvUO9XZ7wEmYBuIIIYmEOnAvovOg=s96-c", "provider_id": "106965379152356551841", "email_verified": true, "phone_verified": false}	google	2026-06-10 09:19:41.605564+00	2026-06-10 09:19:41.605608+00	2026-06-10 09:25:08.615927+00	aafc104f-2592-428a-b4c4-2bd123905123
b095701a-f443-489d-a0c6-4a3a15ee9bdb	b095701a-f443-489d-a0c6-4a3a15ee9bdb	{"sub": "b095701a-f443-489d-a0c6-4a3a15ee9bdb", "role": "beneficiary", "email": "aliciahuang359@gmail.com", "phone": "085891556089", "address": null, "full_name": "Alicia", "email_verified": false, "phone_verified": false}	email	2026-06-10 09:26:46.692067+00	2026-06-10 09:26:46.69212+00	2026-06-10 09:26:46.69212+00	f92e3bf1-9475-4a59-89d8-c53368062dda
82147428-e16e-4ed8-9f62-bd5353a1b288	82147428-e16e-4ed8-9f62-bd5353a1b288	{"sub": "82147428-e16e-4ed8-9f62-bd5353a1b288", "role": "beneficiary", "email": "edbertjonathan257@gmail.com", "phone": null, "address": null, "full_name": "Edbert Jonathan Lay", "email_verified": false, "phone_verified": false}	email	2026-06-10 09:29:13.205967+00	2026-06-10 09:29:13.206015+00	2026-06-10 09:29:13.206015+00	4433137b-00d1-420e-925a-4db8925ca83d
103572714365743012136	1faefcbe-4492-4063-88ae-45ea76cbe2fb	{"iss": "https://accounts.google.com", "sub": "103572714365743012136", "name": "Vanesha Tania", "email": "vaneshatania3@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocIuVhPc0eACqy97xgz7XBQ3bCu1up6YPHzSj32dZifbOshdVA=s96-c", "full_name": "Vanesha Tania", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocIuVhPc0eACqy97xgz7XBQ3bCu1up6YPHzSj32dZifbOshdVA=s96-c", "provider_id": "103572714365743012136", "email_verified": true, "phone_verified": false}	google	2026-06-10 09:19:13.22784+00	2026-06-10 09:19:13.227883+00	2026-06-10 09:31:20.584793+00	45f4eab7-9978-4c02-9ff1-706434914d1a
77aa5e96-34a0-4366-8308-1bc8e5358d06	77aa5e96-34a0-4366-8308-1bc8e5358d06	{"sub": "77aa5e96-34a0-4366-8308-1bc8e5358d06", "email": "faruqmahdison@gmail.com", "full_name": "test", "email_verified": false, "phone_verified": false}	email	2026-04-05 19:13:13.978992+00	2026-04-05 19:13:13.979036+00	2026-04-05 19:13:13.979036+00	8dd7a94c-ceea-4e68-a459-22501f5e5492
3d25b86d-1723-4594-92ed-2c1bdd3a8e11	3d25b86d-1723-4594-92ed-2c1bdd3a8e11	{"sub": "3d25b86d-1723-4594-92ed-2c1bdd3a8e11", "email": "testing12@gmail.com", "full_name": "achmad faruq", "email_verified": false, "phone_verified": false}	email	2026-04-06 03:45:18.324448+00	2026-04-06 03:45:18.324497+00	2026-04-06 03:45:18.324497+00	2725dba6-5a10-468d-b59a-383bbcf40fec
8d910256-6a25-45e2-b41b-88063f499570	8d910256-6a25-45e2-b41b-88063f499570	{"sub": "8d910256-6a25-45e2-b41b-88063f499570", "email": "testing13@gmail.com", "full_name": "testing13", "email_verified": false, "phone_verified": false}	email	2026-04-06 06:51:19.448605+00	2026-04-06 06:51:19.448675+00	2026-04-06 06:51:19.448675+00	bb094128-da8b-41aa-ab4a-e2e286e3e294
ffb38e44-aed8-4479-bf55-aa1ca7c76214	ffb38e44-aed8-4479-bf55-aa1ca7c76214	{"sub": "ffb38e44-aed8-4479-bf55-aa1ca7c76214", "email": "devin@gmail.com", "full_name": "Devin", "email_verified": false, "phone_verified": false}	email	2026-04-06 12:55:05.877498+00	2026-04-06 12:55:05.877573+00	2026-04-06 12:55:05.877573+00	c7ecaf6b-8e02-413d-9096-26cc32185434
06394c98-b0bd-4a0f-9a4f-07382dd6051e	06394c98-b0bd-4a0f-9a4f-07382dd6051e	{"sub": "06394c98-b0bd-4a0f-9a4f-07382dd6051e", "email": "donaturtest@gmail.com", "full_name": "DonaturTest", "email_verified": false, "phone_verified": false}	email	2026-04-06 13:52:19.469972+00	2026-04-06 13:52:19.470017+00	2026-04-06 13:52:19.470017+00	08fa6c2f-4599-49b2-9ba8-7a052367acc1
729463e8-d692-479c-a79d-d77e43fe3277	729463e8-d692-479c-a79d-d77e43fe3277	{"sub": "729463e8-d692-479c-a79d-d77e43fe3277", "email": "penerimatest@gmail.com", "full_name": "PenerimaTest", "email_verified": false, "phone_verified": false}	email	2026-04-06 13:58:01.942576+00	2026-04-06 13:58:01.942629+00	2026-04-06 13:58:01.942629+00	4ff15b47-73f4-4d4e-b94e-0852937714ec
07cf6ecc-d375-4a45-9d83-9e2380f5c6d7	07cf6ecc-d375-4a45-9d83-9e2380f5c6d7	{"sub": "07cf6ecc-d375-4a45-9d83-9e2380f5c6d7", "email": "test14@gmail.com", "full_name": "test", "email_verified": false, "phone_verified": false}	email	2026-04-06 14:05:49.287083+00	2026-04-06 14:05:49.28713+00	2026-04-06 14:05:49.28713+00	06a5d487-dc91-4d89-ade6-bd0362f57e88
99cecaee-8a99-493b-88ad-b457e4d5e45e	99cecaee-8a99-493b-88ad-b457e4d5e45e	{"sub": "99cecaee-8a99-493b-88ad-b457e4d5e45e", "email": "vendor@gmail.com", "full_name": "VendorTest", "email_verified": false, "phone_verified": false}	email	2026-04-06 15:54:02.021089+00	2026-04-06 15:54:02.02114+00	2026-04-06 15:54:02.02114+00	80178634-3c55-46e6-8dfc-845c4b646a9f
f19ca67e-9299-40a3-ab61-e5dd911ccd2f	f19ca67e-9299-40a3-ab61-e5dd911ccd2f	{"sub": "f19ca67e-9299-40a3-ab61-e5dd911ccd2f", "role": "beneficiary", "email": "penerima01@gmail.com", "phone": null, "address": null, "full_name": "Penerima01", "email_verified": false, "phone_verified": false}	email	2026-04-27 13:02:36.728284+00	2026-04-27 13:02:36.728349+00	2026-04-27 13:02:36.728349+00	481c7582-cfa1-42e1-a89a-4b66979302d0
7ca8a80f-cf29-48c9-a5fa-6b9555ff3563	7ca8a80f-cf29-48c9-a5fa-6b9555ff3563	{"sub": "7ca8a80f-cf29-48c9-a5fa-6b9555ff3563", "role": "donor", "email": "donaturtest2@gmail.com", "phone": "08456982367", "address": "Jatinangor test", "full_name": "DonaturTest2", "email_verified": false, "phone_verified": false}	email	2026-04-07 01:39:38.706084+00	2026-04-07 01:39:38.706134+00	2026-04-07 01:39:38.706134+00	d3764145-9322-425b-acca-66fdc76ff47f
3293b8aa-335d-4228-9e49-edc1aa133f6e	3293b8aa-335d-4228-9e49-edc1aa133f6e	{"sub": "3293b8aa-335d-4228-9e49-edc1aa133f6e", "role": "vendor", "email": "vendor1@gmail.com", "phone": null, "address": null, "full_name": "vendor1", "email_verified": false, "phone_verified": false}	email	2026-04-19 13:51:05.683957+00	2026-04-19 13:51:05.684015+00	2026-04-19 13:51:05.684015+00	340a768a-af25-4a84-8302-c0300b344140
0ea01ac1-723f-484c-b2ca-fcf69a554b37	0ea01ac1-723f-484c-b2ca-fcf69a554b37	{"sub": "0ea01ac1-723f-484c-b2ca-fcf69a554b37", "email": "demo-donor@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-20 15:08:31.332367+00	2026-04-20 15:08:31.332417+00	2026-04-20 15:08:31.332417+00	2042ef24-007f-483f-9609-d1a13193c4af
5450bfc1-bc5a-4494-bbff-65f6eb7a5f82	5450bfc1-bc5a-4494-bbff-65f6eb7a5f82	{"sub": "5450bfc1-bc5a-4494-bbff-65f6eb7a5f82", "email": "testing1234@gmail.com", "full_name": "Testing1234", "email_verified": false, "phone_verified": false}	email	2026-04-07 06:10:08.636177+00	2026-04-07 06:10:08.636229+00	2026-04-07 06:10:08.636229+00	59cfc9d6-95a9-427f-b900-ea036992ffda
d28f7ab8-1f48-4e4b-bd84-96219085bd7e	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	{"sub": "d28f7ab8-1f48-4e4b-bd84-96219085bd7e", "email": "demo-penerima@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-20 15:08:31.563638+00	2026-04-20 15:08:31.56369+00	2026-04-20 15:08:31.56369+00	529db3d3-e12a-40bb-ad34-e83aeb1d3e13
e848d29b-a53b-4cde-86cc-c6712dadce20	e848d29b-a53b-4cde-86cc-c6712dadce20	{"sub": "e848d29b-a53b-4cde-86cc-c6712dadce20", "email": "demo2-donor@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-05-26 01:36:48.935111+00	2026-05-26 01:36:48.935166+00	2026-05-26 01:36:48.935166+00	61f7ebc7-362b-48a6-80ad-73ebab32c5b1
c5a8b3e9-5677-4577-aabc-a25446f0ae61	c5a8b3e9-5677-4577-aabc-a25446f0ae61	{"sub": "c5a8b3e9-5677-4577-aabc-a25446f0ae61", "email": "demo2-penerima@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-05-26 01:36:49.112958+00	2026-05-26 01:36:49.113014+00	2026-05-26 01:36:49.113014+00	733ea28a-9c41-4681-a92c-9a8ad3d1a829
0ee371fa-c985-47fb-a4b6-a5e4f37506e0	0ee371fa-c985-47fb-a4b6-a5e4f37506e0	{"sub": "0ee371fa-c985-47fb-a4b6-a5e4f37506e0", "role": "donor", "email": "test123456@gmail.com", "phone": "0812345678", "address": "tygkhjnbvxgsrdytusaascaskcbasjk", "full_name": "test", "email_verified": false, "phone_verified": false}	email	2026-04-14 08:17:38.311255+00	2026-04-14 08:17:38.311329+00	2026-04-14 08:17:38.311329+00	8c96c33d-19fa-406c-802c-188eb167db15
88975b2b-ba37-4178-92db-235e6d9f0ff0	88975b2b-ba37-4178-92db-235e6d9f0ff0	{"sub": "88975b2b-ba37-4178-92db-235e6d9f0ff0", "email": "demo-vendor@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-20 15:08:31.805048+00	2026-04-20 15:08:31.805095+00	2026-04-20 15:08:31.805095+00	2c75dec0-dd73-4f06-827e-f20aac85f0c9
1a618fcf-a69d-42fb-ab65-8b6c2b75f276	1a618fcf-a69d-42fb-ab65-8b6c2b75f276	{"sub": "1a618fcf-a69d-42fb-ab65-8b6c2b75f276", "role": "beneficiary", "email": "penerima02@gmail.com", "phone": null, "address": null, "full_name": "Penerima02", "email_verified": false, "phone_verified": false}	email	2026-04-27 13:04:00.855933+00	2026-04-27 13:04:00.855988+00	2026-04-27 13:04:00.855988+00	722ec39e-b180-436d-864b-7e60b5097d5e
706ffe8f-d51e-4a2f-924f-8180d76dc558	706ffe8f-d51e-4a2f-924f-8180d76dc558	{"sub": "706ffe8f-d51e-4a2f-924f-8180d76dc558", "role": "vendor", "email": "vendor01@gmail.com", "phone": null, "address": null, "full_name": "vendor01", "email_verified": false, "phone_verified": false}	email	2026-05-04 17:32:53.93337+00	2026-05-04 17:32:53.93342+00	2026-05-04 17:32:53.93342+00	b80af26c-78db-411a-a6d9-d93104e9ffe0
6d6e430d-7a02-4b3e-b563-2b15dfe4a7cb	6d6e430d-7a02-4b3e-b563-2b15dfe4a7cb	{"sub": "6d6e430d-7a02-4b3e-b563-2b15dfe4a7cb", "email": "demo2-vendor@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-05-26 01:36:49.273192+00	2026-05-26 01:36:49.273242+00	2026-05-26 01:36:49.273242+00	839d1a7b-4280-40ca-b5bc-4ce87da21fb3
116221558678453623945	ae4bcc8a-3094-4ed9-97d0-846a046aea52	{"iss": "https://accounts.google.com", "sub": "116221558678453623945", "name": "Ghaitsa Aulia", "email": "ghaitsaadia@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLcwbKrfXKw54kH01GRoEZB9iG6MMQhLSLxhRT4AteqX-3xv_LKDg=s96-c", "full_name": "Ghaitsa Aulia", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLcwbKrfXKw54kH01GRoEZB9iG6MMQhLSLxhRT4AteqX-3xv_LKDg=s96-c", "provider_id": "116221558678453623945", "email_verified": true, "phone_verified": false}	google	2026-06-09 13:17:15.251068+00	2026-06-09 13:17:15.251121+00	2026-06-09 13:17:15.251121+00	050c3f57-a4e3-4ced-bb97-44546d1294c2
fe740ebf-30f7-4fe7-a1b8-5757f8113719	fe740ebf-30f7-4fe7-a1b8-5757f8113719	{"sub": "fe740ebf-30f7-4fe7-a1b8-5757f8113719", "role": "beneficiary", "email": "liekotali6@gmail.com", "phone": "082269717711", "address": "KONI 1", "full_name": "Kotali", "email_verified": false, "phone_verified": false}	email	2026-06-10 09:17:43.296428+00	2026-06-10 09:17:43.296479+00	2026-06-10 09:17:43.296479+00	c8572c85-2569-42b3-8977-041ae756105d
1018fa47-9476-4f11-b249-b064eb297dec	1018fa47-9476-4f11-b249-b064eb297dec	{"sub": "1018fa47-9476-4f11-b249-b064eb297dec", "role": "donor", "email": "jason13lie@gmail.com", "phone": null, "address": null, "full_name": "Jason Lie", "email_verified": false, "phone_verified": false}	email	2026-06-10 09:38:44.112686+00	2026-06-10 09:38:44.112742+00	2026-06-10 09:38:44.112742+00	bce95cbb-d08c-4d15-bbe2-063be9407304
115826118483477265474	16f078f8-7650-4e74-a56b-2e80141123d9	{"iss": "https://accounts.google.com", "sub": "115826118483477265474", "name": "Brayden To", "email": "asun33830@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJN660ceVq3pX7qGpLOnRpyVq7wmtP2Fk2bfrtt6ktpgQc2vA=s96-c", "full_name": "Brayden To", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJN660ceVq3pX7qGpLOnRpyVq7wmtP2Fk2bfrtt6ktpgQc2vA=s96-c", "provider_id": "115826118483477265474", "email_verified": true, "phone_verified": false}	google	2026-06-10 09:40:39.937017+00	2026-06-10 09:40:39.937066+00	2026-06-10 09:40:39.937066+00	f944a026-2970-4baa-9b49-a6ff65086a56
3d77e2fc-dd8e-4c33-bb51-b0202d3d82ee	3d77e2fc-dd8e-4c33-bb51-b0202d3d82ee	{"sub": "3d77e2fc-dd8e-4c33-bb51-b0202d3d82ee", "role": "donor", "email": "auristelabussiness@gmail.com", "phone": "085161615751", "address": "Jl. darma 2 rt 32 kota jambi", "full_name": "Brenda Aouren Tamia", "email_verified": false, "phone_verified": false}	email	2026-06-10 09:41:56.331449+00	2026-06-10 09:41:56.3315+00	2026-06-10 09:41:56.3315+00	9e0caf03-debb-4838-a68a-5e9e4a35f126
5d964e27-02d2-483d-b3f9-e0561ef621a9	5d964e27-02d2-483d-b3f9-e0561ef621a9	{"sub": "5d964e27-02d2-483d-b3f9-e0561ef621a9", "role": "beneficiary", "email": "laurensaandi@gmail.com", "phone": null, "address": null, "full_name": "Laurensa Andi", "email_verified": false, "phone_verified": false}	email	2026-06-10 09:46:41.735346+00	2026-06-10 09:46:41.735393+00	2026-06-10 09:46:41.735393+00	4fdaf479-55f4-4a9d-9a19-616c05778b6c
337efcff-35ee-4a55-ac77-2995542022ae	337efcff-35ee-4a55-ac77-2995542022ae	{"sub": "337efcff-35ee-4a55-ac77-2995542022ae", "role": "donor", "email": "agnesmonica0465@gmail.com", "phone": "089652099766", "address": "jambi", "full_name": "Agnes Monica", "email_verified": false, "phone_verified": false}	email	2026-06-10 09:48:36.96841+00	2026-06-10 09:48:36.96846+00	2026-06-10 09:48:36.96846+00	36046b3f-61ec-4c08-ae3c-d971bd0e486c
117622003159861793016	bc1166f0-5e38-4cd0-9fe2-3faead0b87aa	{"iss": "https://accounts.google.com", "sub": "117622003159861793016", "name": "Chindy Aulia", "email": "chindyauliam8888@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLzgTUv9QJqmBI0aqXtUUVYXMom_OgEGeVf1f7O2vtMa2aURo2c=s96-c", "full_name": "Chindy Aulia", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLzgTUv9QJqmBI0aqXtUUVYXMom_OgEGeVf1f7O2vtMa2aURo2c=s96-c", "provider_id": "117622003159861793016", "email_verified": true, "phone_verified": false}	google	2026-06-10 09:44:55.905638+00	2026-06-10 09:44:55.905715+00	2026-06-10 09:49:48.436525+00	680d14d3-ce55-4ed3-8182-a329389aae16
107845089820842100678	0cfe9a0e-da21-4ad4-9e40-2b1fb4179c8a	{"iss": "https://accounts.google.com", "sub": "107845089820842100678", "name": "caroline 1", "email": "caroline123115@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJUgiDNsCt8MbgAXi_Y4rL5yV2Om0sa9pKxgkWMHPjsFh3lOvY=s96-c", "full_name": "caroline 1", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJUgiDNsCt8MbgAXi_Y4rL5yV2Om0sa9pKxgkWMHPjsFh3lOvY=s96-c", "provider_id": "107845089820842100678", "email_verified": true, "phone_verified": false}	google	2026-06-10 09:50:52.392727+00	2026-06-10 09:50:52.392773+00	2026-06-10 09:55:55.201091+00	91320136-7492-4224-b2bb-6deb2e646083
a133c0c6-5c0e-43fd-bc17-f8a234272acb	a133c0c6-5c0e-43fd-bc17-f8a234272acb	{"sub": "a133c0c6-5c0e-43fd-bc17-f8a234272acb", "role": "donor", "email": "kevinevanlone22@gmail.com", "phone": null, "address": null, "full_name": "kevin evanlone", "email_verified": false, "phone_verified": false}	email	2026-06-10 09:53:23.546668+00	2026-06-10 09:53:23.546724+00	2026-06-10 09:53:23.546724+00	95c919b4-dff7-438e-a218-2bb314aa087d
8c398068-8879-4103-a677-814f137b8289	8c398068-8879-4103-a677-814f137b8289	{"sub": "8c398068-8879-4103-a677-814f137b8289", "role": "donor", "email": "violinpatricia56@gmail.com", "phone": "0895620032921", "address": "jln kol pol", "full_name": "Violin Patrigia", "email_verified": false, "phone_verified": false}	email	2026-06-10 09:53:28.49093+00	2026-06-10 09:53:28.490984+00	2026-06-10 09:53:28.490984+00	2939adf0-1886-4425-a98d-1346e074b24f
108460020138259535328	9ad88462-8f92-4291-a90b-805dba849619	{"iss": "https://accounts.google.com", "sub": "108460020138259535328", "name": "blue flare fox", "email": "blueflarefox02@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJqCKjw_ow1QTKkZdcS5kOdcoQzCyBpY65dbvhU6bXbArptE94=s96-c", "full_name": "blue flare fox", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJqCKjw_ow1QTKkZdcS5kOdcoQzCyBpY65dbvhU6bXbArptE94=s96-c", "provider_id": "108460020138259535328", "email_verified": true, "phone_verified": false}	google	2026-06-10 09:53:55.256528+00	2026-06-10 09:53:55.256611+00	2026-06-10 09:53:55.256611+00	5f970c15-b993-4f50-9cd0-993efcc63ac2
ff0b961d-76d2-46f7-a245-82a4761d00e6	ff0b961d-76d2-46f7-a245-82a4761d00e6	{"sub": "ff0b961d-76d2-46f7-a245-82a4761d00e6", "role": "donor", "email": "emailbalcek@gmail.com", "phone": null, "address": null, "full_name": "Caroline", "email_verified": false, "phone_verified": false}	email	2026-06-10 10:00:50.991368+00	2026-06-10 10:00:50.991414+00	2026-06-10 10:00:50.991414+00	63663925-7406-441a-9cfd-46c46bcf7204
78d4dbc5-65e0-446b-94e0-c18983a7667e	78d4dbc5-65e0-446b-94e0-c18983a7667e	{"sub": "78d4dbc5-65e0-446b-94e0-c18983a7667e", "role": "donor", "email": "brayseribuasa@gmail.com", "phone": "082175428845", "address": null, "full_name": "Brayden To", "email_verified": false, "phone_verified": false}	email	2026-06-10 09:55:25.167149+00	2026-06-10 09:55:25.167192+00	2026-06-10 09:55:25.167192+00	94673526-5d3b-43eb-b5ea-5947a6a956f4
104756530756440027519	cd1f70bd-2086-4681-8437-b7c94c751791	{"iss": "https://accounts.google.com", "sub": "104756530756440027519", "name": "Anglelika cd", "email": "anglelikacd@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJ8nW3_VokdYhPTnOcYCHRSJv5syR9_s8i81WBx6YwCSVR1vg=s96-c", "full_name": "Anglelika cd", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJ8nW3_VokdYhPTnOcYCHRSJv5syR9_s8i81WBx6YwCSVR1vg=s96-c", "provider_id": "104756530756440027519", "email_verified": true, "phone_verified": false}	google	2026-06-10 09:55:04.056034+00	2026-06-10 09:55:04.056079+00	2026-06-10 09:55:40.462473+00	f18a3e8f-b4b4-41d4-a961-8df6b3b34295
fefb7140-07ec-4264-b667-faf9be1cf5af	fefb7140-07ec-4264-b667-faf9be1cf5af	{"sub": "fefb7140-07ec-4264-b667-faf9be1cf5af", "role": "donor", "email": "chindyaulia8888@gmail.com", "phone": "087733208289", "address": "Jambi", "full_name": "Bella", "email_verified": false, "phone_verified": false}	email	2026-06-10 09:55:41.50104+00	2026-06-10 09:55:41.501083+00	2026-06-10 09:55:41.501083+00	24925955-cb3e-4200-b5af-e1c67fbd6df4
b460f35e-b398-4275-b71a-cfee0ffbb683	b460f35e-b398-4275-b71a-cfee0ffbb683	{"sub": "b460f35e-b398-4275-b71a-cfee0ffbb683", "role": "donor", "email": "audysrihapsari01@gmail.com", "phone": null, "address": null, "full_name": "audy sri hapsari ", "email_verified": false, "phone_verified": false}	email	2026-06-10 09:59:51.009758+00	2026-06-10 09:59:51.009806+00	2026-06-10 09:59:51.009806+00	89da80f7-29de-46e7-a7d0-ef2625bbcbec
fbbcd506-dd25-4818-a9d3-83bc7ce032b1	fbbcd506-dd25-4818-a9d3-83bc7ce032b1	{"sub": "fbbcd506-dd25-4818-a9d3-83bc7ce032b1", "role": "donor", "email": "oveliaangesti@gmail.com", "phone": "0887437573208", "address": null, "full_name": "Ovelia", "email_verified": false, "phone_verified": false}	email	2026-06-10 10:00:07.191906+00	2026-06-10 10:00:07.191951+00	2026-06-10 10:00:07.191951+00	f78a11a9-4511-4cb1-804b-924171382773
ed8b3b62-a4a1-4125-803d-af3312d3d642	ed8b3b62-a4a1-4125-803d-af3312d3d642	{"sub": "ed8b3b62-a4a1-4125-803d-af3312d3d642", "role": "beneficiary", "email": "jujuangga7@gmail.com", "phone": "082213100524", "address": "Kota jambi", "full_name": "Juanda Anggara", "email_verified": false, "phone_verified": false}	email	2026-06-10 10:05:30.710587+00	2026-06-10 10:05:30.710635+00	2026-06-10 10:05:30.710635+00	b9b9f577-fc8d-4526-884b-dda7ab0ff598
a4161fa7-0657-4037-ba49-33cb3b02b9cc	a4161fa7-0657-4037-ba49-33cb3b02b9cc	{"sub": "a4161fa7-0657-4037-ba49-33cb3b02b9cc", "role": "donor", "email": "lielyanislouis@gmail.com", "phone": null, "address": null, "full_name": "Lielyani saputri louis", "email_verified": false, "phone_verified": false}	email	2026-06-10 10:07:31.127973+00	2026-06-10 10:07:31.128027+00	2026-06-10 10:07:31.128027+00	7487fffa-2eb5-4e58-9520-e416fd6f4f20
115892088147175431728	d9ed441b-47a9-436d-bab9-4cb3e1499e18	{"iss": "https://accounts.google.com", "sub": "115892088147175431728", "name": "Lielyana Saputri Louis", "email": "lielyanaslouis@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJKfU8iuNl259CXzROPfZHhwwnHb_pLUbN_vzbagyHQ5Us3wpvg=s96-c", "full_name": "Lielyana Saputri Louis", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJKfU8iuNl259CXzROPfZHhwwnHb_pLUbN_vzbagyHQ5Us3wpvg=s96-c", "provider_id": "115892088147175431728", "email_verified": true, "phone_verified": false}	google	2026-06-10 10:09:31.698042+00	2026-06-10 10:09:31.698088+00	2026-06-10 10:12:48.527378+00	8adfc90d-14a1-4fb2-865a-8e20a567786e
106879713471666280012	177b1fa3-0207-4b0a-9cac-450029fe8ac7	{"iss": "https://accounts.google.com", "sub": "106879713471666280012", "name": "syarif fuddin", "email": "syarifuddin046@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKCPnzqc3j-yZcIEcEdnZnXukf2mK3S8cHr3nLjNlkOKsKycE4=s96-c", "full_name": "syarif fuddin", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKCPnzqc3j-yZcIEcEdnZnXukf2mK3S8cHr3nLjNlkOKsKycE4=s96-c", "provider_id": "106879713471666280012", "email_verified": true, "phone_verified": false}	google	2026-06-10 11:21:09.591089+00	2026-06-10 11:21:09.591139+00	2026-06-10 11:21:09.591139+00	7a87cd48-3b81-4884-91cd-fd5bd1ccb287
8dd61c30-5521-431a-bebb-bbb676a73133	8dd61c30-5521-431a-bebb-bbb676a73133	{"sub": "8dd61c30-5521-431a-bebb-bbb676a73133", "role": "donor", "email": "milhamsyahr07@gmail.com", "phone": "082180713368", "address": "Jambi", "full_name": "ilham", "email_verified": false, "phone_verified": false}	email	2026-06-10 11:28:05.996234+00	2026-06-10 11:28:05.996287+00	2026-06-10 11:28:05.996287+00	3438c5db-0244-425b-bbc2-f2b35eae199c
7a1ee006-f94b-463b-9d47-f99241469e24	7a1ee006-f94b-463b-9d47-f99241469e24	{"sub": "7a1ee006-f94b-463b-9d47-f99241469e24", "role": "vendor", "email": "demovendor@gmail.com", "phone": "081311808604", "address": null, "full_name": "Ladiva", "email_verified": false, "phone_verified": false}	email	2026-06-10 13:28:42.845415+00	2026-06-10 13:28:42.845471+00	2026-06-10 13:28:42.845471+00	caf15f34-18cc-4cd2-8533-6bf32a1ed862
115764405819703444700	1238aed7-bb4f-4008-9ed9-c8db00aaaca1	{"iss": "https://accounts.google.com", "sub": "115764405819703444700", "name": "Rian apriansha jayalie", "email": "rianapriansha19@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKnCtUVN_K7gtEp0W04wh-wzNMQthDjg6OXP3fv5WVPy9LvNg=s96-c", "full_name": "Rian apriansha jayalie", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKnCtUVN_K7gtEp0W04wh-wzNMQthDjg6OXP3fv5WVPy9LvNg=s96-c", "provider_id": "115764405819703444700", "email_verified": true, "phone_verified": false}	google	2026-06-10 10:14:24.120677+00	2026-06-10 10:14:24.120745+00	2026-06-10 10:15:41.332881+00	a6ef3118-3f66-4655-81b1-a9ff988c2094
793040a4-f4ed-4e82-99fc-8cb492ded4c1	793040a4-f4ed-4e82-99fc-8cb492ded4c1	{"sub": "793040a4-f4ed-4e82-99fc-8cb492ded4c1", "role": "beneficiary", "email": "ferdydanuarta05@gmail.com", "phone": "088276208297", "address": "Jl.barau-barau 1", "full_name": "Ferdy Danuarta ", "email_verified": false, "phone_verified": false}	email	2026-06-10 10:26:19.88586+00	2026-06-10 10:26:19.885918+00	2026-06-10 10:26:19.885918+00	0374d3dd-0102-43c4-9e19-e5b22797e27f
102564699094453384549	793040a4-f4ed-4e82-99fc-8cb492ded4c1	{"iss": "https://accounts.google.com", "sub": "102564699094453384549", "name": "Ferdy Danuarta", "email": "ferdydanuarta05@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKvePK21IZMDd8d4P4pNSla15hFLOkmD9epYQhi_HwWXRF1bX4=s96-c", "full_name": "Ferdy Danuarta", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKvePK21IZMDd8d4P4pNSla15hFLOkmD9epYQhi_HwWXRF1bX4=s96-c", "provider_id": "102564699094453384549", "email_verified": true, "phone_verified": false}	google	2026-06-10 10:28:36.254683+00	2026-06-10 10:28:36.254725+00	2026-06-10 10:28:36.254725+00	3d212d3a-40e1-4f38-a742-fa8b1ef0975c
b18e30f5-1ba2-4697-a602-12b89d2473cd	b18e30f5-1ba2-4697-a602-12b89d2473cd	{"sub": "b18e30f5-1ba2-4697-a602-12b89d2473cd", "role": "beneficiary", "email": "ferdydanuarta899@gmail.com", "phone": "088276208297", "address": "Jl.barau-barau 1", "full_name": "Ferdy Danuarta ", "email_verified": false, "phone_verified": false}	email	2026-06-10 10:30:49.411552+00	2026-06-10 10:30:49.411619+00	2026-06-10 10:30:49.411619+00	4ad60f86-222f-47b5-adc2-9edeba967f55
10fcb99b-b830-4a2e-b35a-9979f9106c67	10fcb99b-b830-4a2e-b35a-9979f9106c67	{"sub": "10fcb99b-b830-4a2e-b35a-9979f9106c67", "role": "donor", "email": "desiyulistiani2019@gmail.com", "phone": null, "address": null, "full_name": "Desi Yulistiani", "email_verified": false, "phone_verified": false}	email	2026-06-10 11:01:30.355975+00	2026-06-10 11:01:30.356049+00	2026-06-10 11:01:30.356049+00	6164fccb-385c-4591-9661-5277582573a3
438671de-205c-4083-8610-cbf138757f36	438671de-205c-4083-8610-cbf138757f36	{"sub": "438671de-205c-4083-8610-cbf138757f36", "role": "vendor", "email": "dystysalsa@gmail.com", "phone": "083846143551", "address": null, "full_name": "Dyesty Salsazilla", "email_verified": false, "phone_verified": false}	email	2026-06-10 11:14:19.586362+00	2026-06-10 11:14:19.586425+00	2026-06-10 11:14:19.586425+00	ce61f2a7-ce35-4aac-b099-a70a913b5fe5
d49baa2e-a538-4ce8-90df-7135af799445	d49baa2e-a538-4ce8-90df-7135af799445	{"sub": "d49baa2e-a538-4ce8-90df-7135af799445", "role": "beneficiary", "email": "milhamsyahr01@gmail.com", "phone": "081111111111", "address": "jambi", "full_name": "ilham", "email_verified": false, "phone_verified": false}	email	2026-06-10 11:35:53.628329+00	2026-06-10 11:35:53.628375+00	2026-06-10 11:35:53.628375+00	1a10e760-049f-4719-9217-784f13f6c817
ccaaf342-c293-485b-b064-7d9f2cd42b22	ccaaf342-c293-485b-b064-7d9f2cd42b22	{"sub": "ccaaf342-c293-485b-b064-7d9f2cd42b22", "role": "vendor", "email": "jasperimanuel6@gmail.com", "phone": "08521036321", "address": "-", "full_name": "Jasper Imanuel", "email_verified": false, "phone_verified": false}	email	2026-06-10 11:36:30.163217+00	2026-06-10 11:36:30.163266+00	2026-06-10 11:36:30.163266+00	79f79d82-b1ab-41b1-836c-3a706b0bb716
9a75328c-61d5-4768-85e5-9269775ca623	9a75328c-61d5-4768-85e5-9269775ca623	{"sub": "9a75328c-61d5-4768-85e5-9269775ca623", "role": "vendor", "email": "milhamsyahr02@gmail.com", "phone": "08222222222", "address": "jambi", "full_name": "ilham", "email_verified": false, "phone_verified": false}	email	2026-06-10 11:37:26.612414+00	2026-06-10 11:37:26.612463+00	2026-06-10 11:37:26.612463+00	1612371f-9590-4aa5-a12c-91f45a7d623f
108220576805003684571	b1c35f5a-1ecb-46a4-904d-795a0029cc05	{"iss": "https://accounts.google.com", "sub": "108220576805003684571", "name": "Andi Andi", "email": "andisariputra8b@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKXMjDDnZ8n5u2kh--_DGVxXEzBKEl1Ws9LMy7x4BAanXxRAg=s96-c", "full_name": "Andi Andi", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKXMjDDnZ8n5u2kh--_DGVxXEzBKEl1Ws9LMy7x4BAanXxRAg=s96-c", "provider_id": "108220576805003684571", "email_verified": true, "phone_verified": false}	google	2026-06-10 11:14:42.809061+00	2026-06-10 11:14:42.809112+00	2026-06-10 11:43:07.753858+00	b8b8a2f2-6c40-421c-a7b0-21218de710ec
102920213433449213617	4086843e-872a-4a4b-8d3b-c332544ae077	{"iss": "https://accounts.google.com", "sub": "102920213433449213617", "name": "Aandi Ssariputra", "email": "ssariputraaandi@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLNvzkvPNd2XWqs95hs_B4xCZA8v49LncD0nkq7Kiz7NtE8kw=s96-c", "full_name": "Aandi Ssariputra", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLNvzkvPNd2XWqs95hs_B4xCZA8v49LncD0nkq7Kiz7NtE8kw=s96-c", "provider_id": "102920213433449213617", "email_verified": true, "phone_verified": false}	google	2026-06-10 11:52:40.811354+00	2026-06-10 11:52:40.811405+00	2026-06-10 11:52:40.811405+00	86a814d8-8a1b-464f-aa53-58795725284f
114985003469822960772	b1d26638-7b8d-41ef-b98e-066637aea3f4	{"iss": "https://accounts.google.com", "sub": "114985003469822960772", "name": "Armando Qiu", "email": "armandoqiu9313@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKh958bnd2rGmuvjWqGNdh7nedyqqWhRuWedNZLaHZVSHUWKDcc=s96-c", "full_name": "Armando Qiu", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKh958bnd2rGmuvjWqGNdh7nedyqqWhRuWedNZLaHZVSHUWKDcc=s96-c", "provider_id": "114985003469822960772", "email_verified": true, "phone_verified": false}	google	2026-06-10 13:50:10.95189+00	2026-06-10 13:50:10.951937+00	2026-06-10 13:50:10.951937+00	20f69bd9-cfe7-4a76-b74f-d0c4eafca9e3
10510d96-7171-4b5a-8ca0-b7090f8d6f58	10510d96-7171-4b5a-8ca0-b7090f8d6f58	{"sub": "10510d96-7171-4b5a-8ca0-b7090f8d6f58", "role": "donor", "email": "armandoqiu154@gmail.com", "phone": "085268021972", "address": null, "full_name": "Armando Qiu", "email_verified": false, "phone_verified": false}	email	2026-06-10 13:52:18.638164+00	2026-06-10 13:52:18.638212+00	2026-06-10 13:52:18.638212+00	0233ac66-716e-4a16-9f81-8dd35d122b9a
fde7163c-0c71-4899-8fca-cefe928c121b	fde7163c-0c71-4899-8fca-cefe928c121b	{"sub": "fde7163c-0c71-4899-8fca-cefe928c121b", "role": "beneficiary", "email": "alifahjambi123@gmail.com", "phone": null, "address": null, "full_name": "Alifah ", "email_verified": false, "phone_verified": false}	email	2026-06-10 18:58:39.426054+00	2026-06-10 18:58:39.426102+00	2026-06-10 18:58:39.426102+00	be488120-612f-4883-9060-88258b81d56e
112177835752991544438	fde7163c-0c71-4899-8fca-cefe928c121b	{"iss": "https://accounts.google.com", "sub": "112177835752991544438", "name": "Alifah Adilah", "email": "alifahjambi123@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLPhVmeYOX1qsuMemlAUuK13t6qz5pPn1jz7lazgRYrm3EVHLM=s96-c", "full_name": "Alifah Adilah", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLPhVmeYOX1qsuMemlAUuK13t6qz5pPn1jz7lazgRYrm3EVHLM=s96-c", "provider_id": "112177835752991544438", "email_verified": true, "phone_verified": false}	google	2026-06-10 19:00:02.74688+00	2026-06-10 19:00:02.746926+00	2026-06-10 19:00:02.746926+00	fd10daea-0a81-426b-94d1-c24a6b6a8b31
113723493935695165544	d1e35067-6977-41c5-aeac-2d7b183dca75	{"iss": "https://accounts.google.com", "sub": "113723493935695165544", "name": "alifah adilah", "email": "alifahadilah106@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJt1jHYzjgDJJSXR0CTcLvesgE1PpEnezmRCoZGObD7GYMJ8Q=s96-c", "full_name": "alifah adilah", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJt1jHYzjgDJJSXR0CTcLvesgE1PpEnezmRCoZGObD7GYMJ8Q=s96-c", "provider_id": "113723493935695165544", "email_verified": true, "phone_verified": false}	google	2026-06-10 18:55:54.441354+00	2026-06-10 18:55:54.441406+00	2026-06-10 19:03:57.186719+00	dd18dda2-f34f-4b5f-a4be-87591bf68e3f
100490998847823577671	f3ada4b1-2bba-4155-bb2e-5cee4b791390	{"iss": "https://accounts.google.com", "sub": "100490998847823577671", "name": "Devin Suryadi", "email": "devinsurya95@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKfVAP0SwV4fCy4N7aM3vUoYefsJ6F2HeYLCVMfYqxDYY3IU7w=s96-c", "full_name": "Devin Suryadi", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKfVAP0SwV4fCy4N7aM3vUoYefsJ6F2HeYLCVMfYqxDYY3IU7w=s96-c", "provider_id": "100490998847823577671", "email_verified": true, "phone_verified": false}	google	2026-04-06 18:16:13.39967+00	2026-04-06 18:16:13.399718+00	2026-09-03 06:25:47.764335+00	c10fa1f0-370e-4322-893a-fd9451f79900
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
d5a84408-d32c-4308-a3ad-f93194539836	2026-04-06 06:40:32.199959+00	2026-04-06 06:40:32.199959+00	password	9fd93412-c03c-490d-b3e8-01bcf8207af0
5c4ab2bb-2ecf-4cf0-a482-82908a2185bb	2026-04-06 13:17:32.750219+00	2026-04-06 13:17:32.750219+00	password	99f3cedd-6db7-4ba4-8909-560a40ad4766
33369753-fd36-4533-89ac-04b830cfe8fa	2026-06-09 13:11:30.720908+00	2026-06-09 13:11:30.720908+00	password	107728e4-2e78-4be6-9ee9-41d64eb03518
77c1920b-47f2-4e58-886d-c1777e8c2ac6	2026-06-09 13:14:07.057968+00	2026-06-09 13:14:07.057968+00	password	bcafcb6a-e28e-4f54-a1e9-aa3250dbf723
e84e5e4f-50ea-4313-ae63-cfc6a9e480d7	2026-06-09 13:14:20.958841+00	2026-06-09 13:14:20.958841+00	oauth	fa6e560d-ed48-4c84-9b1c-e68831514935
e53ad2bf-a656-4fcf-bfdc-2dbe86cdb1a4	2026-06-09 13:17:15.262889+00	2026-06-09 13:17:15.262889+00	oauth	57d770d0-44d8-42b4-bfb4-5389081f4d8d
b4c5cadc-e1da-40f0-8a30-0893a4761323	2026-06-09 13:17:40.729178+00	2026-06-09 13:17:40.729178+00	oauth	4d493507-1b16-4bfc-97d1-bf3e67a30a91
18c78307-cdf0-464c-9689-49c6f1e3c257	2026-09-03 06:25:47.842397+00	2026-09-03 06:25:47.842397+00	oauth	22f29e11-0b20-4b72-b525-553515306647
d2ff820a-f993-4d95-ad0a-5e652c4ca1b8	2026-06-09 15:55:07.416379+00	2026-06-09 15:55:07.416379+00	oauth	b1f9cc05-62bd-48dc-8200-76aeaa3fc81b
daf7acc3-d6ab-4ec5-ab97-569fa29de586	2026-06-09 16:20:42.558059+00	2026-06-09 16:20:42.558059+00	oauth	933d340d-9544-46b0-a882-12f85a3ff2ea
791d2561-90b5-422d-9826-825472e12549	2026-06-09 16:22:25.988558+00	2026-06-09 16:22:25.988558+00	oauth	c8a25a14-b914-4b57-ba90-e88b298f1a73
302bc694-66de-4215-bd0e-c7256dab48a1	2026-06-09 16:23:48.372705+00	2026-06-09 16:23:48.372705+00	oauth	33e3eda6-8535-4494-b57a-8bc47c0a864c
ee726a8b-ba3d-4cd0-a65c-a8159f6e7aa7	2026-06-09 16:25:28.654844+00	2026-06-09 16:25:28.654844+00	oauth	14a95136-faee-4ccf-8922-c70907c8e578
1b0716ab-da5a-4ac2-b8b2-5de7dc727735	2026-06-09 16:26:00.279696+00	2026-06-09 16:26:00.279696+00	oauth	f1b37198-4939-48ef-afe3-26a3e4845353
288f2810-a160-4cf6-9038-330606094823	2026-06-09 16:27:26.405494+00	2026-06-09 16:27:26.405494+00	oauth	64f757aa-92b7-4e65-87fb-5c34b1f3781c
caa6af88-ba1c-4cdb-8df8-dea87dfb5a30	2026-06-09 16:29:01.79059+00	2026-06-09 16:29:01.79059+00	otp	64da435f-0f00-437f-92bd-01067351deab
17b76aa3-ac2d-4026-972b-2c3ac7797103	2026-04-07 06:15:38.50337+00	2026-04-07 06:15:38.50337+00	oauth	aae57fc4-d1c8-470a-b953-55438f980808
89fbfbf0-156a-481f-81a5-8859ea344516	2026-06-09 16:29:21.846958+00	2026-06-09 16:29:21.846958+00	oauth	19b9e161-1778-4237-933a-d6aaf5cd758e
71cd5ea4-2e8e-4994-8a02-3b03e227cf8e	2026-04-14 08:17:38.33283+00	2026-04-14 08:17:38.33283+00	password	4bb44957-19c9-4a4f-a89c-f417e89f46cd
c70e692b-1826-48ff-8803-6a87b86beff7	2026-05-19 08:08:00.291511+00	2026-05-19 08:08:00.291511+00	oauth	5ba0a31c-d4fe-4b98-988b-1e0adaf8950a
8980754e-1031-41ec-981f-490ca9aa3982	2026-05-19 08:08:21.770437+00	2026-05-19 08:08:21.770437+00	oauth	ca12e177-b135-46ae-bcfa-b6f4a5485001
fbc0c727-ca06-4657-9823-5730f5ead46d	2026-06-10 09:18:16.082867+00	2026-06-10 09:18:16.082867+00	password	3952d3d3-296a-401b-9eb0-a0e46eeb88a4
7278d853-a7df-4755-90dd-9e95a1dbdc2e	2026-06-10 09:19:13.240243+00	2026-06-10 09:19:13.240243+00	oauth	86217335-b17a-4d2c-a4ad-e9c6c5b2beb4
e809515f-4804-4244-8f1a-e61c940d6ff3	2026-06-10 09:19:29.873277+00	2026-06-10 09:19:29.873277+00	oauth	e9b64c0c-6b66-4230-9d60-1330d7e709f1
6da71846-e9ed-41e0-a3dd-a209b2e759b0	2026-06-10 09:19:41.61324+00	2026-06-10 09:19:41.61324+00	oauth	b4af69e1-bfcd-4ac6-af67-d802e04b62e9
f581e39d-3bda-4f8d-8bb0-87dcdecf6082	2026-06-10 09:20:16.046788+00	2026-06-10 09:20:16.046788+00	password	e5d9158a-c74b-4326-ba8d-63480aff1555
053309e5-f0f6-4403-8919-7b8b827d679d	2026-06-10 09:20:34.998809+00	2026-06-10 09:20:34.998809+00	oauth	855cd395-7aaa-419b-8148-1a86dfc99cf1
47554482-4671-4cf1-9b11-b4c1221bec70	2026-06-10 09:22:21.195737+00	2026-06-10 09:22:21.195737+00	password	b8e230bf-2d1d-406c-86c6-fb2da527f334
f68a7330-de4f-4f77-aba9-3e2fec179cfd	2026-06-10 09:22:33.338887+00	2026-06-10 09:22:33.338887+00	password	7f17ab8c-da66-4a4e-8fa2-bdf9ac10a9e1
ada900aa-f650-4e20-9c8f-466500b64c17	2026-06-10 09:23:56.007568+00	2026-06-10 09:23:56.007568+00	password	1a551cb0-d5a0-4b81-9d6e-14ec8357f660
05077449-0d81-4a04-a060-ed2328e7a3f2	2026-06-10 09:24:51.041081+00	2026-06-10 09:24:51.041081+00	otp	d3c230f6-ff88-4030-9b09-ee24a0e1db7d
12fccf68-dcad-43ee-9680-87ec1f8004f5	2026-06-10 09:25:02.573791+00	2026-06-10 09:25:02.573791+00	password	e551bc87-3242-484a-b9ff-8db30f116c49
263c7830-5117-487b-9deb-12bf97ac7d8e	2026-06-10 09:25:08.621184+00	2026-06-10 09:25:08.621184+00	oauth	5fd72157-0edd-4604-9864-e11963b07a48
74d59fc7-db06-4a51-8a92-a57492736869	2026-06-10 09:26:46.70164+00	2026-06-10 09:26:46.70164+00	password	1ca212ff-0e1d-4afb-8ed5-4cf0a7022ad0
33226bb7-a917-4939-9365-335d5ad228f3	2026-06-10 09:29:13.215204+00	2026-06-10 09:29:13.215204+00	password	a86a3d29-cdb4-49c7-9038-da2120784ada
8dd0912f-bb22-46e6-aa10-e17c7c0d53d0	2026-06-10 09:31:20.596034+00	2026-06-10 09:31:20.596034+00	oauth	3eb81fb9-2d01-490a-b648-e3aedf472c7a
13aadbaa-8adf-41b1-82d9-73848e92c103	2026-06-10 09:38:44.129063+00	2026-06-10 09:38:44.129063+00	password	834d3c03-9253-4300-a807-32f5c22ceeef
e4c1f355-bca3-4b17-866b-ab3475af893f	2026-06-10 09:40:39.949376+00	2026-06-10 09:40:39.949376+00	oauth	b283dbf1-f89a-4f34-9df7-954936878874
ffc511f1-604b-4547-9046-53bfa5ffd807	2026-06-10 09:44:55.920946+00	2026-06-10 09:44:55.920946+00	oauth	7a382810-1c52-46ec-8a7c-d5fa8e16ca8d
3951603a-e87b-46e1-b36e-8df6507b2171	2026-06-10 09:45:58.616499+00	2026-06-10 09:45:58.616499+00	oauth	0db55baf-3a12-47b1-9d97-c69da8f81c25
fe0b9bd7-960d-4853-ba45-6247d77a82c8	2026-06-10 09:46:41.742403+00	2026-06-10 09:46:41.742403+00	password	8f86909d-f85f-42e0-9bfd-baca0c03cea6
959f7c40-2bd0-4ad8-aab1-a4556bd91e1a	2026-06-10 09:48:36.985869+00	2026-06-10 09:48:36.985869+00	password	af48f0b2-4bb2-486e-938d-8b906c064845
dea72719-3d1d-4397-b4d2-89359edb80c2	2026-06-10 09:49:22.343797+00	2026-06-10 09:49:22.343797+00	otp	52b986b1-0558-4cf0-85df-1e5f2d7817d2
86bace8d-3edc-4ac3-8c47-bd33e2dd0629	2026-06-10 09:49:48.441469+00	2026-06-10 09:49:48.441469+00	oauth	550cd784-d4eb-4c20-a5f7-f8311d5fc236
c6c99510-60d0-4bb6-9993-dfe0a04deb19	2026-06-10 09:50:52.401362+00	2026-06-10 09:50:52.401362+00	oauth	17b62373-6531-48d9-8add-6de6e747d431
3d425472-3e66-46c9-896b-bd0785b5fb5b	2026-06-10 09:51:57.179315+00	2026-06-10 09:51:57.179315+00	oauth	e1f91f9a-c9f0-4139-89ca-d38fd33a02c0
787ed704-9b6e-4f74-b98e-0ced6cb3c84c	2026-06-10 09:53:23.557671+00	2026-06-10 09:53:23.557671+00	password	af9df8ba-70c3-467c-8f33-22511fd1ce18
9f911b5f-266b-44a6-bb98-357abf58269a	2026-06-10 09:53:28.498424+00	2026-06-10 09:53:28.498424+00	password	8da21142-ddf2-421c-ae99-01f502dc145b
d5cda035-291e-4638-8144-1fdd9ba93031	2026-06-10 09:53:55.268749+00	2026-06-10 09:53:55.268749+00	oauth	e23a2248-19b0-47db-b71b-81ae0279b286
029ed293-69c7-4872-965f-bb986220dacc	2026-06-10 09:54:58.671021+00	2026-06-10 09:54:58.671021+00	oauth	fea9a6ea-eb3e-4cb8-ac9b-372ff4bc8ff6
c3228fad-46aa-4017-8762-38e53fdb3743	2026-06-10 09:55:04.065562+00	2026-06-10 09:55:04.065562+00	oauth	ea6b7916-85ae-4aeb-9c8f-df4d78bcedaa
196b5730-e60e-4f0b-bd1d-18732855945d	2026-06-10 09:55:25.174502+00	2026-06-10 09:55:25.174502+00	password	a42c4d5d-2443-4d25-926c-6ee9d8aca1d5
c18f3732-e4d5-4b9b-99c7-cd6f393335fb	2026-06-10 09:55:40.46837+00	2026-06-10 09:55:40.46837+00	oauth	e5ba3376-4fbb-4e13-a03c-9da08a1b2c68
2e4cb8c5-17f0-4d1b-9024-ef5cfa3bc870	2026-06-10 09:55:41.509163+00	2026-06-10 09:55:41.509163+00	password	56d3974d-99e4-49b4-99f0-ee356d0aa366
81aa1be8-fbe8-4a25-b32b-0f1fee7470dd	2026-06-10 09:55:55.20466+00	2026-06-10 09:55:55.20466+00	oauth	d7509742-de1a-4d59-9875-1f013b1e6dbe
e03149c4-af69-47e7-b1a8-407f93fc7c3d	2026-06-10 09:57:05.650619+00	2026-06-10 09:57:05.650619+00	otp	cbfec25b-a1c9-440c-8744-c0dba0519d50
9f9c2078-2757-441a-b7b6-41bb5039b708	2026-06-10 09:59:51.024662+00	2026-06-10 09:59:51.024662+00	password	60ec59f5-c85e-4919-858a-bd673606bff1
acff1c57-ba87-4e4f-a607-5454c98cf6e7	2026-06-10 10:00:07.201023+00	2026-06-10 10:00:07.201023+00	password	53b139b6-950b-47dc-923c-ad44ced11342
342a455a-a00c-4067-a1ba-590a9ce6f61a	2026-06-10 10:00:51.002799+00	2026-06-10 10:00:51.002799+00	password	54aad616-027b-4d59-a92d-a9630ec2eea1
05fb4bfd-d62a-4293-a1fa-4d1fb6d83435	2026-06-10 10:05:30.724335+00	2026-06-10 10:05:30.724335+00	password	607eb4a9-ee25-4de5-bf4a-4731f3ba645c
bd98520c-76f6-4308-99f5-009471d79a0b	2026-06-10 10:07:31.145738+00	2026-06-10 10:07:31.145738+00	password	938cb9df-9ce6-4b78-a388-833d649b6dff
c11c7808-2cfa-414c-9631-f3bd6920c4dc	2026-06-10 10:09:31.717409+00	2026-06-10 10:09:31.717409+00	oauth	a3046b2b-bb14-4584-b578-df1780b8c141
aec7cd6d-0754-4b9c-9a42-05852084696a	2026-06-10 10:12:48.538835+00	2026-06-10 10:12:48.538835+00	oauth	95f25804-8de0-4120-863e-bd4f01cb06a6
7aaca09c-9c1b-4662-8568-459e3cc26979	2026-06-10 10:14:24.138923+00	2026-06-10 10:14:24.138923+00	oauth	315f4edb-f9a6-4d2f-9fa5-8c69d830b390
0e2dc5ab-e5e6-4a25-8cf6-d7a6ad2645c4	2026-06-10 10:14:35.464378+00	2026-06-10 10:14:35.464378+00	oauth	826db1b5-e1d2-49c6-8cc5-26c05ce6d612
f40f8e69-00cb-4a54-864c-aaaf9dbb8b1f	2026-06-10 10:15:04.677172+00	2026-06-10 10:15:04.677172+00	oauth	ff0b09b4-fd6d-44db-bc6a-9907e9417221
f7a82363-f2c5-4c66-91a5-15ab8a6a1283	2026-06-10 10:15:16.549256+00	2026-06-10 10:15:16.549256+00	oauth	c0dd6ac3-9fd9-4bff-a8bc-66e0fa407575
2efc6d98-1027-4de5-8076-ad74f7397c7c	2026-06-10 10:15:41.346966+00	2026-06-10 10:15:41.346966+00	oauth	96a91ff4-3e23-4025-b9eb-a245103ccf1c
0f701554-1455-4590-9bb6-6685beb5f6de	2026-06-10 10:26:19.902982+00	2026-06-10 10:26:19.902982+00	password	10c741f3-5a18-415a-8385-a6767e5b176e
5443e015-c88d-41ab-a12c-0e84765d5c16	2026-06-10 10:28:36.268124+00	2026-06-10 10:28:36.268124+00	oauth	6280f40f-3b11-4a73-88bf-d6d7a943023d
2bc30be1-4177-4a97-9314-305f6144877a	2026-06-10 10:30:49.428952+00	2026-06-10 10:30:49.428952+00	password	f5b39c1a-1c99-4139-9d5b-5207a2ee4cba
6e11fa9b-cdab-4470-8b14-597ddb420bdf	2026-06-10 11:01:30.410073+00	2026-06-10 11:01:30.410073+00	password	fb39bc54-f79f-43e7-9c7d-26f826e4a2a7
32f765fd-6431-4572-a3fe-883a7a1640de	2026-06-10 11:14:19.608295+00	2026-06-10 11:14:19.608295+00	password	3e8f957a-753f-409f-ac04-81fa0be411a8
bd0af7be-67dd-4461-9f84-cc43ecc2af00	2026-06-10 11:14:42.820702+00	2026-06-10 11:14:42.820702+00	oauth	2bf53d8d-b8c6-48f0-bcb0-8e3439c42a2d
200e0b72-b454-413e-9056-0936da46538c	2026-06-10 11:21:09.61017+00	2026-06-10 11:21:09.61017+00	oauth	722d9c5b-7321-48a8-b7a5-9478650efe80
260cf52a-1a68-4353-b291-ed94ecfc8fb9	2026-06-10 11:31:16.828371+00	2026-06-10 11:31:16.828371+00	oauth	900f7335-f767-4a71-b829-d3b60721f8af
de8312e8-0e95-40ac-8c9c-736a86b0f36c	2026-06-10 11:36:30.172746+00	2026-06-10 11:36:30.172746+00	password	bfb9777d-8a57-4b17-b540-b3cbf1c12743
2c43a4e7-5d32-4e08-a12d-1c3f9b1a4dc3	2026-06-10 11:43:07.772645+00	2026-06-10 11:43:07.772645+00	oauth	7c7e1d2e-c626-4684-a3b6-fd42eb507f5b
1d4d32c9-f409-41cb-9bac-8aa3b4526154	2026-06-10 11:52:40.828581+00	2026-06-10 11:52:40.828581+00	oauth	84551a0a-c175-40f5-b5d2-005aaffb008e
281806cd-9379-48f2-9f8e-6fd967b73291	2026-06-10 12:53:58.812158+00	2026-06-10 12:53:58.812158+00	password	3f3f0182-2ab4-4e5e-b0b7-7ba6c5e42054
a71afe59-62a0-4e29-99a2-599cdbe9d5ca	2026-06-10 13:23:15.86954+00	2026-06-10 13:23:15.86954+00	oauth	8ebba4af-8d27-4d46-8f1c-1636262ec8f2
2fbcd74c-c431-4e4b-8b0d-bf77bab61067	2026-06-10 13:25:12.947184+00	2026-06-10 13:25:12.947184+00	oauth	86d35d08-58de-4779-a0e0-1a5209da7b3a
34ef8286-6011-45c5-8666-798047c1d07e	2026-06-10 13:28:42.865638+00	2026-06-10 13:28:42.865638+00	password	0124b1a5-8f12-46cc-a4b9-6a8f97e07bf2
1eca8189-59e4-4f87-8e08-36aadb7d6729	2026-06-10 13:50:10.976057+00	2026-06-10 13:50:10.976057+00	oauth	779488e7-a57d-473f-abab-65e6c57267d2
be38d65f-07be-4033-b53b-ec953fef4391	2026-06-10 13:52:18.660519+00	2026-06-10 13:52:18.660519+00	password	8d36ae3c-7241-4d3a-8a7c-45ce1a6557ae
c08a32d7-fda8-4d84-9f14-7c836e15e87a	2026-06-10 18:55:54.505707+00	2026-06-10 18:55:54.505707+00	oauth	e4e94f00-f3b9-44de-9635-7b1c52774ede
e70fb238-65ce-498f-afce-a9d1627629bd	2026-06-10 19:03:57.19817+00	2026-06-10 19:03:57.19817+00	oauth	17a934ad-4a14-43db-b7c7-e7048a816dc6
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
f574cfc3-67c2-40ec-af33-2003b7e105f5	3d08937b-c6ab-43f6-9a51-f4b384585c62	confirmation_token	1727b5a75155aa88aeceeeac29c12bb1c8cc3e69726821afb9fc47d0	faruq123@gmail.com	2026-04-05 16:01:03.073575	2026-04-05 16:01:03.073575
d6a9aa4e-51f3-4d8b-9f57-50acef9390a5	cc5b179f-d89f-4392-9367-805c5ee21801	confirmation_token	56a36a58866bbabcfefbe8def1c4ed130a6fd660ea07092e897dc2ef	faruq1234@gmail.com	2026-04-05 17:54:00.417564	2026-04-05 17:54:00.417564
259bfc6a-66da-4d09-8c41-244814f4985e	b327894c-5063-4980-adf4-9f42d8739525	confirmation_token	c06c5369096b1a91e9f71103992fa068075763498ffa3b718b2fe719	achmad@gmail.com	2026-04-05 18:26:22.471071	2026-04-05 18:26:22.471071
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
00000000-0000-0000-0000-000000000000	3	dg7ezkng6xgh	3d25b86d-1723-4594-92ed-2c1bdd3a8e11	f	2026-04-06 06:40:32.193961+00	2026-04-06 06:40:32.193961+00	\N	d5a84408-d32c-4308-a3ad-f93194539836
00000000-0000-0000-0000-000000000000	7	dycbe4ro37kz	ffb38e44-aed8-4479-bf55-aa1ca7c76214	f	2026-04-06 13:17:32.748901+00	2026-04-06 13:17:32.748901+00	\N	5c4ab2bb-2ecf-4cf0-a482-82908a2185bb
00000000-0000-0000-0000-000000000000	584	vkjuzwd62s4r	80d7d392-e7b5-4f75-8ff2-baa2ad3c8e48	f	2026-06-10 09:18:16.080351+00	2026-06-10 09:18:16.080351+00	\N	fbc0c727-ca06-4657-9823-5730f5ead46d
00000000-0000-0000-0000-000000000000	585	j62xpwirllxo	1faefcbe-4492-4063-88ae-45ea76cbe2fb	f	2026-06-10 09:19:13.238348+00	2026-06-10 09:19:13.238348+00	\N	7278d853-a7df-4755-90dd-9e95a1dbdc2e
00000000-0000-0000-0000-000000000000	586	cdt7znwtn3yl	1faefcbe-4492-4063-88ae-45ea76cbe2fb	f	2026-06-10 09:19:29.872019+00	2026-06-10 09:19:29.872019+00	\N	e809515f-4804-4244-8f1a-e61c940d6ff3
00000000-0000-0000-0000-000000000000	587	gssgqhr6adas	b0a93dd4-8d79-4eea-bef9-d8e13bf54a46	f	2026-06-10 09:19:41.612118+00	2026-06-10 09:19:41.612118+00	\N	6da71846-e9ed-41e0-a3dd-a209b2e759b0
00000000-0000-0000-0000-000000000000	588	zksjjq2df3d6	357bd5bf-909d-4317-83a5-556c926ed56a	f	2026-06-10 09:20:16.045627+00	2026-06-10 09:20:16.045627+00	\N	f581e39d-3bda-4f8d-8bb0-87dcdecf6082
00000000-0000-0000-0000-000000000000	589	p6po3ovumgu7	1faefcbe-4492-4063-88ae-45ea76cbe2fb	f	2026-06-10 09:20:34.996769+00	2026-06-10 09:20:34.996769+00	\N	053309e5-f0f6-4403-8919-7b8b827d679d
00000000-0000-0000-0000-000000000000	33	epxwkkbs5qaz	0f639158-6f69-4764-9356-34162a491f92	f	2026-04-07 06:15:38.502138+00	2026-04-07 06:15:38.502138+00	\N	17b76aa3-ac2d-4026-972b-2c3ac7797103
00000000-0000-0000-0000-000000000000	590	gr6cngnxwk7c	d50ed1f1-04be-4b0e-9b8c-16ddfd4606ce	f	2026-06-10 09:22:21.193016+00	2026-06-10 09:22:21.193016+00	\N	47554482-4671-4cf1-9b11-b4c1221bec70
00000000-0000-0000-0000-000000000000	591	yyklavhhpgqj	c99d71f2-8702-46a0-baf8-c775787f31fa	f	2026-06-10 09:22:33.337461+00	2026-06-10 09:22:33.337461+00	\N	f68a7330-de4f-4f77-aba9-3e2fec179cfd
00000000-0000-0000-0000-000000000000	592	o6eqptu7c24e	0aa32472-f539-4888-ab3f-db23cb4e5743	f	2026-06-10 09:23:56.002558+00	2026-06-10 09:23:56.002558+00	\N	ada900aa-f650-4e20-9c8f-466500b64c17
00000000-0000-0000-0000-000000000000	593	52u2gcyeyzp3	b0a93dd4-8d79-4eea-bef9-d8e13bf54a46	f	2026-06-10 09:24:51.030972+00	2026-06-10 09:24:51.030972+00	\N	05077449-0d81-4a04-a060-ed2328e7a3f2
00000000-0000-0000-0000-000000000000	594	xq3eqxbuqtoa	0419ba30-33ce-40c0-bd61-31cfc233a271	f	2026-06-10 09:25:02.563434+00	2026-06-10 09:25:02.563434+00	\N	12fccf68-dcad-43ee-9680-87ec1f8004f5
00000000-0000-0000-0000-000000000000	595	jlpoedbnstgy	b0a93dd4-8d79-4eea-bef9-d8e13bf54a46	f	2026-06-10 09:25:08.619964+00	2026-06-10 09:25:08.619964+00	\N	263c7830-5117-487b-9deb-12bf97ac7d8e
00000000-0000-0000-0000-000000000000	596	hbp4oymhaptp	b095701a-f443-489d-a0c6-4a3a15ee9bdb	f	2026-06-10 09:26:46.699774+00	2026-06-10 09:26:46.699774+00	\N	74d59fc7-db06-4a51-8a92-a57492736869
00000000-0000-0000-0000-000000000000	597	fej6bxfxv766	82147428-e16e-4ed8-9f62-bd5353a1b288	f	2026-06-10 09:29:13.213513+00	2026-06-10 09:29:13.213513+00	\N	33226bb7-a917-4939-9365-335d5ad228f3
00000000-0000-0000-0000-000000000000	598	jtmjnn5avwgh	1faefcbe-4492-4063-88ae-45ea76cbe2fb	f	2026-06-10 09:31:20.593765+00	2026-06-10 09:31:20.593765+00	\N	8dd0912f-bb22-46e6-aa10-e17c7c0d53d0
00000000-0000-0000-0000-000000000000	599	wy4qp5u4hgwx	1018fa47-9476-4f11-b249-b064eb297dec	f	2026-06-10 09:38:44.124367+00	2026-06-10 09:38:44.124367+00	\N	13aadbaa-8adf-41b1-82d9-73848e92c103
00000000-0000-0000-0000-000000000000	448	a56uhby2aptx	b4a06baa-2cf5-4817-9dfe-73cb4506a674	f	2026-05-19 08:08:00.290241+00	2026-05-19 08:08:00.290241+00	\N	c70e692b-1826-48ff-8803-6a87b86beff7
00000000-0000-0000-0000-000000000000	449	7o6sx5zpeqkd	b4a06baa-2cf5-4817-9dfe-73cb4506a674	f	2026-05-19 08:08:21.769136+00	2026-05-19 08:08:21.769136+00	\N	8980754e-1031-41ec-981f-490ca9aa3982
00000000-0000-0000-0000-000000000000	600	rf6wphruspih	16f078f8-7650-4e74-a56b-2e80141123d9	f	2026-06-10 09:40:39.947261+00	2026-06-10 09:40:39.947261+00	\N	e4c1f355-bca3-4b17-866b-ab3475af893f
00000000-0000-0000-0000-000000000000	46	6hg46onyu5bu	0ee371fa-c985-47fb-a4b6-a5e4f37506e0	t	2026-04-14 08:17:38.330061+00	2026-04-14 14:38:10.248594+00	\N	71cd5ea4-2e8e-4994-8a02-3b03e227cf8e
00000000-0000-0000-0000-000000000000	47	6bkbeuzdewaw	0ee371fa-c985-47fb-a4b6-a5e4f37506e0	f	2026-04-14 14:38:10.256164+00	2026-04-14 14:38:10.256164+00	6hg46onyu5bu	71cd5ea4-2e8e-4994-8a02-3b03e227cf8e
00000000-0000-0000-0000-000000000000	541	c6fxsh7lmb2x	72bddb91-e66b-4823-8b1e-c7e88304cbeb	f	2026-06-09 13:11:30.714346+00	2026-06-09 13:11:30.714346+00	\N	33369753-fd36-4533-89ac-04b830cfe8fa
00000000-0000-0000-0000-000000000000	542	rwbkugftc24p	021f699b-bfce-4bc1-a01a-474b9d8c98bf	f	2026-06-09 13:14:07.0547+00	2026-06-09 13:14:07.0547+00	\N	77c1920b-47f2-4e58-886d-c1777e8c2ac6
00000000-0000-0000-0000-000000000000	543	pxgdwc5jeygx	021f699b-bfce-4bc1-a01a-474b9d8c98bf	f	2026-06-09 13:14:20.957576+00	2026-06-09 13:14:20.957576+00	\N	e84e5e4f-50ea-4313-ae63-cfc6a9e480d7
00000000-0000-0000-0000-000000000000	544	uemfwbwbya5t	ae4bcc8a-3094-4ed9-97d0-846a046aea52	f	2026-06-09 13:17:15.261141+00	2026-06-09 13:17:15.261141+00	\N	e53ad2bf-a656-4fcf-bfdc-2dbe86cdb1a4
00000000-0000-0000-0000-000000000000	545	t3nttd6b5ugi	ee1fc5d9-541b-4ee4-948c-c3e15ab36013	f	2026-06-09 13:17:40.727956+00	2026-06-09 13:17:40.727956+00	\N	b4c5cadc-e1da-40f0-8a30-0893a4761323
00000000-0000-0000-0000-000000000000	548	wrz2plwjfcvl	021f699b-bfce-4bc1-a01a-474b9d8c98bf	f	2026-06-09 15:55:07.412805+00	2026-06-09 15:55:07.412805+00	\N	d2ff820a-f993-4d95-ad0a-5e652c4ca1b8
00000000-0000-0000-0000-000000000000	602	3rxgg6e3k7h4	bc1166f0-5e38-4cd0-9fe2-3faead0b87aa	f	2026-06-10 09:44:55.918528+00	2026-06-10 09:44:55.918528+00	\N	ffc511f1-604b-4547-9046-53bfa5ffd807
00000000-0000-0000-0000-000000000000	550	3k5hylt2quhi	679068fe-5f7b-426f-8bc5-702def6a2380	f	2026-06-09 16:20:42.555628+00	2026-06-09 16:20:42.555628+00	\N	daf7acc3-d6ab-4ec5-ab97-569fa29de586
00000000-0000-0000-0000-000000000000	603	3z2hq3kxrqnf	bc1166f0-5e38-4cd0-9fe2-3faead0b87aa	f	2026-06-10 09:45:58.615322+00	2026-06-10 09:45:58.615322+00	\N	3951603a-e87b-46e1-b36e-8df6507b2171
00000000-0000-0000-0000-000000000000	604	v7maazjbimbh	5d964e27-02d2-483d-b3f9-e0561ef621a9	f	2026-06-10 09:46:41.74121+00	2026-06-10 09:46:41.74121+00	\N	fe0b9bd7-960d-4853-ba45-6247d77a82c8
00000000-0000-0000-0000-000000000000	551	i2i54yfyfbgu	679068fe-5f7b-426f-8bc5-702def6a2380	f	2026-06-09 16:22:25.986761+00	2026-06-09 16:22:25.986761+00	\N	791d2561-90b5-422d-9826-825472e12549
00000000-0000-0000-0000-000000000000	552	nauvowfnwmyz	679068fe-5f7b-426f-8bc5-702def6a2380	f	2026-06-09 16:23:48.36906+00	2026-06-09 16:23:48.36906+00	\N	302bc694-66de-4215-bd0e-c7256dab48a1
00000000-0000-0000-0000-000000000000	553	tmzvykqe5vwk	679068fe-5f7b-426f-8bc5-702def6a2380	f	2026-06-09 16:25:28.652708+00	2026-06-09 16:25:28.652708+00	\N	ee726a8b-ba3d-4cd0-a65c-a8159f6e7aa7
00000000-0000-0000-0000-000000000000	554	vi452hz3d6ph	679068fe-5f7b-426f-8bc5-702def6a2380	f	2026-06-09 16:26:00.277834+00	2026-06-09 16:26:00.277834+00	\N	1b0716ab-da5a-4ac2-b8b2-5de7dc727735
00000000-0000-0000-0000-000000000000	555	jiyggaxs7qiz	679068fe-5f7b-426f-8bc5-702def6a2380	f	2026-06-09 16:27:26.403652+00	2026-06-09 16:27:26.403652+00	\N	288f2810-a160-4cf6-9038-330606094823
00000000-0000-0000-0000-000000000000	556	an5w6ks3chhu	679068fe-5f7b-426f-8bc5-702def6a2380	f	2026-06-09 16:29:01.789387+00	2026-06-09 16:29:01.789387+00	\N	caa6af88-ba1c-4cdb-8df8-dea87dfb5a30
00000000-0000-0000-0000-000000000000	557	upu7zq3kzerd	679068fe-5f7b-426f-8bc5-702def6a2380	f	2026-06-09 16:29:21.845687+00	2026-06-09 16:29:21.845687+00	\N	89fbfbf0-156a-481f-81a5-8859ea344516
00000000-0000-0000-0000-000000000000	605	m35qk65f5iqp	337efcff-35ee-4a55-ac77-2995542022ae	f	2026-06-10 09:48:36.982744+00	2026-06-10 09:48:36.982744+00	\N	959f7c40-2bd0-4ad8-aab1-a4556bd91e1a
00000000-0000-0000-0000-000000000000	606	sc554y5l6sqb	bc1166f0-5e38-4cd0-9fe2-3faead0b87aa	f	2026-06-10 09:49:22.342342+00	2026-06-10 09:49:22.342342+00	\N	dea72719-3d1d-4397-b4d2-89359edb80c2
00000000-0000-0000-0000-000000000000	607	k7qepob6sshv	bc1166f0-5e38-4cd0-9fe2-3faead0b87aa	f	2026-06-10 09:49:48.439501+00	2026-06-10 09:49:48.439501+00	\N	86bace8d-3edc-4ac3-8c47-bd33e2dd0629
00000000-0000-0000-0000-000000000000	608	twpwqk5rqryq	0cfe9a0e-da21-4ad4-9e40-2b1fb4179c8a	f	2026-06-10 09:50:52.399266+00	2026-06-10 09:50:52.399266+00	\N	c6c99510-60d0-4bb6-9993-dfe0a04deb19
00000000-0000-0000-0000-000000000000	609	wf727obm3mi7	0cfe9a0e-da21-4ad4-9e40-2b1fb4179c8a	f	2026-06-10 09:51:57.177962+00	2026-06-10 09:51:57.177962+00	\N	3d425472-3e66-46c9-896b-bd0785b5fb5b
00000000-0000-0000-0000-000000000000	610	udrk7xu2do7s	a133c0c6-5c0e-43fd-bc17-f8a234272acb	f	2026-06-10 09:53:23.556035+00	2026-06-10 09:53:23.556035+00	\N	787ed704-9b6e-4f74-b98e-0ced6cb3c84c
00000000-0000-0000-0000-000000000000	611	jpqurjhld7y4	8c398068-8879-4103-a677-814f137b8289	f	2026-06-10 09:53:28.497184+00	2026-06-10 09:53:28.497184+00	\N	9f911b5f-266b-44a6-bb98-357abf58269a
00000000-0000-0000-0000-000000000000	612	sq5xrsfooovi	9ad88462-8f92-4291-a90b-805dba849619	f	2026-06-10 09:53:55.266534+00	2026-06-10 09:53:55.266534+00	\N	d5cda035-291e-4638-8144-1fdd9ba93031
00000000-0000-0000-0000-000000000000	613	5elyml5pjxoq	0cfe9a0e-da21-4ad4-9e40-2b1fb4179c8a	f	2026-06-10 09:54:58.669517+00	2026-06-10 09:54:58.669517+00	\N	029ed293-69c7-4872-965f-bb986220dacc
00000000-0000-0000-0000-000000000000	614	pxjasqhsxuwz	cd1f70bd-2086-4681-8437-b7c94c751791	f	2026-06-10 09:55:04.064261+00	2026-06-10 09:55:04.064261+00	\N	c3228fad-46aa-4017-8762-38e53fdb3743
00000000-0000-0000-0000-000000000000	615	xum6732u7oxv	78d4dbc5-65e0-446b-94e0-c18983a7667e	f	2026-06-10 09:55:25.173275+00	2026-06-10 09:55:25.173275+00	\N	196b5730-e60e-4f0b-bd1d-18732855945d
00000000-0000-0000-0000-000000000000	616	lynifxgk2xq3	cd1f70bd-2086-4681-8437-b7c94c751791	f	2026-06-10 09:55:40.467043+00	2026-06-10 09:55:40.467043+00	\N	c18f3732-e4d5-4b9b-99c7-cd6f393335fb
00000000-0000-0000-0000-000000000000	617	7hqrkmk35uhd	fefb7140-07ec-4264-b667-faf9be1cf5af	f	2026-06-10 09:55:41.507997+00	2026-06-10 09:55:41.507997+00	\N	2e4cb8c5-17f0-4d1b-9024-ef5cfa3bc870
00000000-0000-0000-0000-000000000000	618	sed7pfvcbu24	0cfe9a0e-da21-4ad4-9e40-2b1fb4179c8a	f	2026-06-10 09:55:55.20347+00	2026-06-10 09:55:55.20347+00	\N	81aa1be8-fbe8-4a25-b32b-0f1fee7470dd
00000000-0000-0000-0000-000000000000	619	lulszs3ug25i	0cfe9a0e-da21-4ad4-9e40-2b1fb4179c8a	f	2026-06-10 09:57:05.649291+00	2026-06-10 09:57:05.649291+00	\N	e03149c4-af69-47e7-b1a8-407f93fc7c3d
00000000-0000-0000-0000-000000000000	620	mvct77gsislm	b460f35e-b398-4275-b71a-cfee0ffbb683	f	2026-06-10 09:59:51.022643+00	2026-06-10 09:59:51.022643+00	\N	9f9c2078-2757-441a-b7b6-41bb5039b708
00000000-0000-0000-0000-000000000000	621	3xrnuq7q5fw4	fbbcd506-dd25-4818-a9d3-83bc7ce032b1	f	2026-06-10 10:00:07.199144+00	2026-06-10 10:00:07.199144+00	\N	acff1c57-ba87-4e4f-a607-5454c98cf6e7
00000000-0000-0000-0000-000000000000	622	lbi5aw7u3xy2	ff0b961d-76d2-46f7-a245-82a4761d00e6	f	2026-06-10 10:00:51.00149+00	2026-06-10 10:00:51.00149+00	\N	342a455a-a00c-4067-a1ba-590a9ce6f61a
00000000-0000-0000-0000-000000000000	623	oldv7wp6mlnb	ed8b3b62-a4a1-4125-803d-af3312d3d642	f	2026-06-10 10:05:30.721952+00	2026-06-10 10:05:30.721952+00	\N	05fb4bfd-d62a-4293-a1fa-4d1fb6d83435
00000000-0000-0000-0000-000000000000	625	pnjh6orwqaiw	d9ed441b-47a9-436d-bab9-4cb3e1499e18	f	2026-06-10 10:09:31.714525+00	2026-06-10 10:09:31.714525+00	\N	c11c7808-2cfa-414c-9631-f3bd6920c4dc
00000000-0000-0000-0000-000000000000	626	l3a455l6523o	d9ed441b-47a9-436d-bab9-4cb3e1499e18	f	2026-06-10 10:12:48.536229+00	2026-06-10 10:12:48.536229+00	\N	aec7cd6d-0754-4b9c-9a42-05852084696a
00000000-0000-0000-0000-000000000000	627	yrxiar3ajefi	1238aed7-bb4f-4008-9ed9-c8db00aaaca1	f	2026-06-10 10:14:24.135558+00	2026-06-10 10:14:24.135558+00	\N	7aaca09c-9c1b-4662-8568-459e3cc26979
00000000-0000-0000-0000-000000000000	628	y6h7tidrk7e7	1238aed7-bb4f-4008-9ed9-c8db00aaaca1	f	2026-06-10 10:14:35.463179+00	2026-06-10 10:14:35.463179+00	\N	0e2dc5ab-e5e6-4a25-8cf6-d7a6ad2645c4
00000000-0000-0000-0000-000000000000	629	dejup2us6tpw	1238aed7-bb4f-4008-9ed9-c8db00aaaca1	f	2026-06-10 10:15:04.675891+00	2026-06-10 10:15:04.675891+00	\N	f40f8e69-00cb-4a54-864c-aaaf9dbb8b1f
00000000-0000-0000-0000-000000000000	630	vhtt3favd2jc	1238aed7-bb4f-4008-9ed9-c8db00aaaca1	f	2026-06-10 10:15:16.547896+00	2026-06-10 10:15:16.547896+00	\N	f7a82363-f2c5-4c66-91a5-15ab8a6a1283
00000000-0000-0000-0000-000000000000	631	um3vpr4ewbfv	1238aed7-bb4f-4008-9ed9-c8db00aaaca1	f	2026-06-10 10:15:41.34506+00	2026-06-10 10:15:41.34506+00	\N	2efc6d98-1027-4de5-8076-ad74f7397c7c
00000000-0000-0000-0000-000000000000	632	atiqm23tw4cl	793040a4-f4ed-4e82-99fc-8cb492ded4c1	f	2026-06-10 10:26:19.900248+00	2026-06-10 10:26:19.900248+00	\N	0f701554-1455-4590-9bb6-6685beb5f6de
00000000-0000-0000-0000-000000000000	633	mxymkpthylvm	793040a4-f4ed-4e82-99fc-8cb492ded4c1	f	2026-06-10 10:28:36.265664+00	2026-06-10 10:28:36.265664+00	\N	5443e015-c88d-41ab-a12c-0e84765d5c16
00000000-0000-0000-0000-000000000000	634	cg3u367xbq64	b18e30f5-1ba2-4697-a602-12b89d2473cd	f	2026-06-10 10:30:49.424852+00	2026-06-10 10:30:49.424852+00	\N	2bc30be1-4177-4a97-9314-305f6144877a
00000000-0000-0000-0000-000000000000	636	q6o52333fr3y	438671de-205c-4083-8610-cbf138757f36	f	2026-06-10 11:14:19.605783+00	2026-06-10 11:14:19.605783+00	\N	32f765fd-6431-4572-a3fe-883a7a1640de
00000000-0000-0000-0000-000000000000	637	ls4llm2vl222	b1c35f5a-1ecb-46a4-904d-795a0029cc05	f	2026-06-10 11:14:42.818077+00	2026-06-10 11:14:42.818077+00	\N	bd0af7be-67dd-4461-9f84-cc43ecc2af00
00000000-0000-0000-0000-000000000000	638	csty4tq4wibq	177b1fa3-0207-4b0a-9cac-450029fe8ac7	f	2026-06-10 11:21:09.606883+00	2026-06-10 11:21:09.606883+00	\N	200e0b72-b454-413e-9056-0936da46538c
00000000-0000-0000-0000-000000000000	640	3tfyfsk7bu3u	b1c35f5a-1ecb-46a4-904d-795a0029cc05	f	2026-06-10 11:31:16.826097+00	2026-06-10 11:31:16.826097+00	\N	260cf52a-1a68-4353-b291-ed94ecfc8fb9
00000000-0000-0000-0000-000000000000	643	de37wtbij6kg	ccaaf342-c293-485b-b064-7d9f2cd42b22	f	2026-06-10 11:36:30.170724+00	2026-06-10 11:36:30.170724+00	\N	de8312e8-0e95-40ac-8c9c-736a86b0f36c
00000000-0000-0000-0000-000000000000	645	26ut7rqejym6	b1c35f5a-1ecb-46a4-904d-795a0029cc05	f	2026-06-10 11:43:07.770568+00	2026-06-10 11:43:07.770568+00	\N	2c43a4e7-5d32-4e08-a12d-1c3f9b1a4dc3
00000000-0000-0000-0000-000000000000	646	wmucf2x4lryx	4086843e-872a-4a4b-8d3b-c332544ae077	f	2026-06-10 11:52:40.82507+00	2026-06-10 11:52:40.82507+00	\N	1d4d32c9-f409-41cb-9bac-8aa3b4526154
00000000-0000-0000-0000-000000000000	668	tdp6dy3fznvf	8f567802-a7ad-4f4f-8534-bdc036b09b97	t	2026-06-11 04:02:54.175403+00	2026-06-26 05:04:17.880081+00	mk7vohd5rhlv	281806cd-9379-48f2-9f8e-6fd967b73291
00000000-0000-0000-0000-000000000000	651	d7vqqwpct375	679068fe-5f7b-426f-8bc5-702def6a2380	f	2026-06-10 13:23:15.857839+00	2026-06-10 13:23:15.857839+00	\N	a71afe59-62a0-4e29-99a2-599cdbe9d5ca
00000000-0000-0000-0000-000000000000	652	g35sj5we7r4v	679068fe-5f7b-426f-8bc5-702def6a2380	f	2026-06-10 13:25:12.943371+00	2026-06-10 13:25:12.943371+00	\N	2fbcd74c-c431-4e4b-8b0d-bf77bab61067
00000000-0000-0000-0000-000000000000	653	azblwplhnoza	7a1ee006-f94b-463b-9d47-f99241469e24	f	2026-06-10 13:28:42.863575+00	2026-06-10 13:28:42.863575+00	\N	34ef8286-6011-45c5-8666-798047c1d07e
00000000-0000-0000-0000-000000000000	659	4nnlnfqftxxd	b1d26638-7b8d-41ef-b98e-066637aea3f4	f	2026-06-10 13:50:10.973577+00	2026-06-10 13:50:10.973577+00	\N	1eca8189-59e4-4f87-8e08-36aadb7d6729
00000000-0000-0000-0000-000000000000	650	l3fcgs2oijkt	8f567802-a7ad-4f4f-8534-bdc036b09b97	t	2026-06-10 12:53:58.808581+00	2026-06-10 14:05:30.436177+00	\N	281806cd-9379-48f2-9f8e-6fd967b73291
00000000-0000-0000-0000-000000000000	662	zqy5itw7g7ce	d1e35067-6977-41c5-aeac-2d7b183dca75	f	2026-06-10 18:55:54.47537+00	2026-06-10 18:55:54.47537+00	\N	c08a32d7-fda8-4d84-9f14-7c836e15e87a
00000000-0000-0000-0000-000000000000	666	nfqygnuciikj	d1e35067-6977-41c5-aeac-2d7b183dca75	f	2026-06-10 19:03:57.196241+00	2026-06-10 19:03:57.196241+00	\N	e70fb238-65ce-498f-afce-a9d1627629bd
00000000-0000-0000-0000-000000000000	660	sjce6vsp37g4	10510d96-7171-4b5a-8ca0-b7090f8d6f58	t	2026-06-10 13:52:18.656991+00	2026-06-11 03:13:03.064541+00	\N	be38d65f-07be-4033-b53b-ec953fef4391
00000000-0000-0000-0000-000000000000	667	5nf2lfrfoolx	10510d96-7171-4b5a-8ca0-b7090f8d6f58	f	2026-06-11 03:13:03.085162+00	2026-06-11 03:13:03.085162+00	sjce6vsp37g4	be38d65f-07be-4033-b53b-ec953fef4391
00000000-0000-0000-0000-000000000000	661	mk7vohd5rhlv	8f567802-a7ad-4f4f-8534-bdc036b09b97	t	2026-06-10 14:05:30.443988+00	2026-06-11 04:02:54.166478+00	l3fcgs2oijkt	281806cd-9379-48f2-9f8e-6fd967b73291
00000000-0000-0000-0000-000000000000	624	xeeu6silqrak	a4161fa7-0657-4037-ba49-33cb3b02b9cc	t	2026-06-10 10:07:31.143806+00	2026-06-12 17:53:46.321662+00	\N	bd98520c-76f6-4308-99f5-009471d79a0b
00000000-0000-0000-0000-000000000000	669	rusmqrxpzfha	a4161fa7-0657-4037-ba49-33cb3b02b9cc	f	2026-06-12 17:53:46.348778+00	2026-06-12 17:53:46.348778+00	xeeu6silqrak	bd98520c-76f6-4308-99f5-009471d79a0b
00000000-0000-0000-0000-000000000000	635	bsiuupynx7gx	10fcb99b-b830-4a2e-b35a-9979f9106c67	t	2026-06-10 11:01:30.39791+00	2026-06-13 01:24:28.80905+00	\N	6e11fa9b-cdab-4470-8b14-597ddb420bdf
00000000-0000-0000-0000-000000000000	670	t5ljee7bd5ns	10fcb99b-b830-4a2e-b35a-9979f9106c67	t	2026-06-13 01:24:28.833159+00	2026-06-14 08:30:30.352156+00	bsiuupynx7gx	6e11fa9b-cdab-4470-8b14-597ddb420bdf
00000000-0000-0000-0000-000000000000	671	d7glqfdyn6wv	10fcb99b-b830-4a2e-b35a-9979f9106c67	f	2026-06-14 08:30:30.381138+00	2026-06-14 08:30:30.381138+00	t5ljee7bd5ns	6e11fa9b-cdab-4470-8b14-597ddb420bdf
00000000-0000-0000-0000-000000000000	736	fk5druktkowu	8f567802-a7ad-4f4f-8534-bdc036b09b97	f	2026-06-26 05:04:17.900207+00	2026-06-26 05:04:17.900207+00	tdp6dy3fznvf	281806cd-9379-48f2-9f8e-6fd967b73291
00000000-0000-0000-0000-000000000000	739	ceibengmd7ap	f3ada4b1-2bba-4155-bb2e-5cee4b791390	f	2026-09-03 06:25:47.816359+00	2026-09-03 06:25:47.816359+00	\N	18c78307-cdf0-464c-9689-49c6f1e3c257
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
20260302000000
20260625000000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
d5a84408-d32c-4308-a3ad-f93194539836	3d25b86d-1723-4594-92ed-2c1bdd3a8e11	2026-04-06 06:40:32.185175+00	2026-04-06 06:40:32.185175+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0	114.122.79.195	\N	\N	\N	\N	\N
5c4ab2bb-2ecf-4cf0-a482-82908a2185bb	ffb38e44-aed8-4479-bf55-aa1ca7c76214	2026-04-06 13:17:32.744053+00	2026-04-06 13:17:32.744053+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0	114.122.105.218	\N	\N	\N	\N	\N
daf7acc3-d6ab-4ec5-ab97-569fa29de586	679068fe-5f7b-426f-8bc5-702def6a2380	2026-06-09 16:20:42.54825+00	2026-06-09 16:20:42.54825+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	36.90.42.108	\N	\N	\N	\N	\N
791d2561-90b5-422d-9826-825472e12549	679068fe-5f7b-426f-8bc5-702def6a2380	2026-06-09 16:22:25.98477+00	2026-06-09 16:22:25.98477+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	36.90.42.108	\N	\N	\N	\N	\N
302bc694-66de-4215-bd0e-c7256dab48a1	679068fe-5f7b-426f-8bc5-702def6a2380	2026-06-09 16:23:48.365258+00	2026-06-09 16:23:48.365258+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	36.90.42.108	\N	\N	\N	\N	\N
ee726a8b-ba3d-4cd0-a65c-a8159f6e7aa7	679068fe-5f7b-426f-8bc5-702def6a2380	2026-06-09 16:25:28.650049+00	2026-06-09 16:25:28.650049+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	36.90.42.108	\N	\N	\N	\N	\N
1b0716ab-da5a-4ac2-b8b2-5de7dc727735	679068fe-5f7b-426f-8bc5-702def6a2380	2026-06-09 16:26:00.277004+00	2026-06-09 16:26:00.277004+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/380.0.788317806 Mobile/15E148 Safari/604.1	36.90.42.108	\N	\N	\N	\N	\N
33369753-fd36-4533-89ac-04b830cfe8fa	72bddb91-e66b-4823-8b1e-c7e88304cbeb	2026-06-09 13:11:30.695708+00	2026-06-09 13:11:30.695708+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/30.0 Chrome/143.0.0.0 Mobile Safari/537.36	103.82.127.240	\N	\N	\N	\N	\N
77c1920b-47f2-4e58-886d-c1777e8c2ac6	021f699b-bfce-4bc1-a01a-474b9d8c98bf	2026-06-09 13:14:07.050212+00	2026-06-09 13:14:07.050212+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	103.82.127.240	\N	\N	\N	\N	\N
e84e5e4f-50ea-4313-ae63-cfc6a9e480d7	021f699b-bfce-4bc1-a01a-474b9d8c98bf	2026-06-09 13:14:20.956673+00	2026-06-09 13:14:20.956673+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	103.82.127.240	\N	\N	\N	\N	\N
e53ad2bf-a656-4fcf-bfdc-2dbe86cdb1a4	ae4bcc8a-3094-4ed9-97d0-846a046aea52	2026-06-09 13:17:15.259347+00	2026-06-09 13:17:15.259347+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Safari/604.1	182.2.52.11	\N	\N	\N	\N	\N
b4c5cadc-e1da-40f0-8a30-0893a4761323	ee1fc5d9-541b-4ee4-948c-c3e15ab36013	2026-06-09 13:17:40.726995+00	2026-06-09 13:17:40.726995+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	114.10.42.119	\N	\N	\N	\N	\N
d2ff820a-f993-4d95-ad0a-5e652c4ca1b8	021f699b-bfce-4bc1-a01a-474b9d8c98bf	2026-06-09 15:55:07.399726+00	2026-06-09 15:55:07.399726+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0	111.94.29.181	\N	\N	\N	\N	\N
288f2810-a160-4cf6-9038-330606094823	679068fe-5f7b-426f-8bc5-702def6a2380	2026-06-09 16:27:26.402355+00	2026-06-09 16:27:26.402355+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/380.0.788317806 Mobile/15E148 Safari/604.1	36.90.42.108	\N	\N	\N	\N	\N
caa6af88-ba1c-4cdb-8df8-dea87dfb5a30	679068fe-5f7b-426f-8bc5-702def6a2380	2026-06-09 16:29:01.788535+00	2026-06-09 16:29:01.788535+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/380.0.788317806 Mobile/15E148 Safari/604.1	36.90.42.108	\N	\N	\N	\N	\N
89fbfbf0-156a-481f-81a5-8859ea344516	679068fe-5f7b-426f-8bc5-702def6a2380	2026-06-09 16:29:21.844878+00	2026-06-09 16:29:21.844878+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/380.0.788317806 Mobile/15E148 Safari/604.1	36.90.42.108	\N	\N	\N	\N	\N
18c78307-cdf0-464c-9689-49c6f1e3c257	f3ada4b1-2bba-4155-bb2e-5cee4b791390	2026-09-03 06:25:47.794376+00	2026-09-03 06:25:47.794376+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	103.165.38.221	\N	\N	\N	\N	\N
17b76aa3-ac2d-4026-972b-2c3ac7797103	0f639158-6f69-4764-9356-34162a491f92	2026-04-07 06:15:38.501359+00	2026-04-07 06:15:38.501359+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0	114.122.70.91	\N	\N	\N	\N	\N
053309e5-f0f6-4403-8919-7b8b827d679d	1faefcbe-4492-4063-88ae-45ea76cbe2fb	2026-06-10 09:20:34.994292+00	2026-06-10 09:20:34.994292+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	103.147.236.161	\N	\N	\N	\N	\N
c70e692b-1826-48ff-8803-6a87b86beff7	b4a06baa-2cf5-4817-9dfe-73cb4506a674	2026-05-19 08:08:00.289392+00	2026-05-19 08:08:00.289392+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	114.122.83.224	\N	\N	\N	\N	\N
8980754e-1031-41ec-981f-490ca9aa3982	b4a06baa-2cf5-4817-9dfe-73cb4506a674	2026-05-19 08:08:21.768023+00	2026-05-19 08:08:21.768023+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	114.122.83.224	\N	\N	\N	\N	\N
71cd5ea4-2e8e-4994-8a02-3b03e227cf8e	0ee371fa-c985-47fb-a4b6-a5e4f37506e0	2026-04-14 08:17:38.328598+00	2026-04-14 14:38:10.268145+00	\N	aal1	\N	2026-04-14 14:38:10.268028	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0	114.10.45.255	\N	\N	\N	\N	\N
fbc0c727-ca06-4657-9823-5730f5ead46d	80d7d392-e7b5-4f75-8ff2-baa2ad3c8e48	2026-06-10 09:18:16.079279+00	2026-06-10 09:18:16.079279+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/30.0 Chrome/143.0.0.0 Mobile Safari/537.36	182.253.95.65	\N	\N	\N	\N	\N
7278d853-a7df-4755-90dd-9e95a1dbdc2e	1faefcbe-4492-4063-88ae-45ea76cbe2fb	2026-06-10 09:19:13.236817+00	2026-06-10 09:19:13.236817+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	103.147.236.161	\N	\N	\N	\N	\N
e809515f-4804-4244-8f1a-e61c940d6ff3	1faefcbe-4492-4063-88ae-45ea76cbe2fb	2026-06-10 09:19:29.871155+00	2026-06-10 09:19:29.871155+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	103.147.236.161	\N	\N	\N	\N	\N
6da71846-e9ed-41e0-a3dd-a209b2e759b0	b0a93dd4-8d79-4eea-bef9-d8e13bf54a46	2026-06-10 09:19:41.611404+00	2026-06-10 09:19:41.611404+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	103.147.236.243	\N	\N	\N	\N	\N
f581e39d-3bda-4f8d-8bb0-87dcdecf6082	357bd5bf-909d-4317-83a5-556c926ed56a	2026-06-10 09:20:16.044817+00	2026-06-10 09:20:16.044817+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	103.147.237.65	\N	\N	\N	\N	\N
47554482-4671-4cf1-9b11-b4c1221bec70	d50ed1f1-04be-4b0e-9b8c-16ddfd4606ce	2026-06-10 09:22:21.192166+00	2026-06-10 09:22:21.192166+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	125.165.173.218	\N	\N	\N	\N	\N
f68a7330-de4f-4f77-aba9-3e2fec179cfd	c99d71f2-8702-46a0-baf8-c775787f31fa	2026-06-10 09:22:33.336654+00	2026-06-10 09:22:33.336654+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	182.253.95.70	\N	\N	\N	\N	\N
ada900aa-f650-4e20-9c8f-466500b64c17	0aa32472-f539-4888-ab3f-db23cb4e5743	2026-06-10 09:23:56.000864+00	2026-06-10 09:23:56.000864+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	103.47.134.71	\N	\N	\N	\N	\N
05077449-0d81-4a04-a060-ed2328e7a3f2	b0a93dd4-8d79-4eea-bef9-d8e13bf54a46	2026-06-10 09:24:51.014661+00	2026-06-10 09:24:51.014661+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	103.147.236.247	\N	\N	\N	\N	\N
12fccf68-dcad-43ee-9680-87ec1f8004f5	0419ba30-33ce-40c0-bd61-31cfc233a271	2026-06-10 09:25:02.561894+00	2026-06-10 09:25:02.561894+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/30.0 Chrome/143.0.0.0 Mobile Safari/537.36	103.3.221.202	\N	\N	\N	\N	\N
263c7830-5117-487b-9deb-12bf97ac7d8e	b0a93dd4-8d79-4eea-bef9-d8e13bf54a46	2026-06-10 09:25:08.61798+00	2026-06-10 09:25:08.61798+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	103.147.236.247	\N	\N	\N	\N	\N
74d59fc7-db06-4a51-8a92-a57492736869	b095701a-f443-489d-a0c6-4a3a15ee9bdb	2026-06-10 09:26:46.698821+00	2026-06-10 09:26:46.698821+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	103.147.236.247	\N	\N	\N	\N	\N
33226bb7-a917-4939-9365-335d5ad228f3	82147428-e16e-4ed8-9f62-bd5353a1b288	2026-06-10 09:29:13.212213+00	2026-06-10 09:29:13.212213+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	182.3.71.156	\N	\N	\N	\N	\N
8dd0912f-bb22-46e6-aa10-e17c7c0d53d0	1faefcbe-4492-4063-88ae-45ea76cbe2fb	2026-06-10 09:31:20.591388+00	2026-06-10 09:31:20.591388+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	103.147.236.161	\N	\N	\N	\N	\N
13aadbaa-8adf-41b1-82d9-73848e92c103	1018fa47-9476-4f11-b249-b064eb297dec	2026-06-10 09:38:44.121946+00	2026-06-10 09:38:44.121946+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1	103.154.224.121	\N	\N	\N	\N	\N
e4c1f355-bca3-4b17-866b-ab3475af893f	16f078f8-7650-4e74-a56b-2e80141123d9	2026-06-10 09:40:39.945795+00	2026-06-10 09:40:39.945795+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	110.139.125.125	\N	\N	\N	\N	\N
ffc511f1-604b-4547-9046-53bfa5ffd807	bc1166f0-5e38-4cd0-9fe2-3faead0b87aa	2026-06-10 09:44:55.916049+00	2026-06-10 09:44:55.916049+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/30.0 Chrome/143.0.0.0 Mobile Safari/537.36	140.213.184.253	\N	\N	\N	\N	\N
3951603a-e87b-46e1-b36e-8df6507b2171	bc1166f0-5e38-4cd0-9fe2-3faead0b87aa	2026-06-10 09:45:58.614467+00	2026-06-10 09:45:58.614467+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/30.0 Chrome/143.0.0.0 Mobile Safari/537.36	140.213.184.253	\N	\N	\N	\N	\N
fe0b9bd7-960d-4853-ba45-6247d77a82c8	5d964e27-02d2-483d-b3f9-e0561ef621a9	2026-06-10 09:46:41.740451+00	2026-06-10 09:46:41.740451+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	103.147.237.221	\N	\N	\N	\N	\N
959f7c40-2bd0-4ad8-aab1-a4556bd91e1a	337efcff-35ee-4a55-ac77-2995542022ae	2026-06-10 09:48:36.979918+00	2026-06-10 09:48:36.979918+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 15; en; Infinix X6850B Build/SP1A.210812.016) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.7778.215 HiBrowser/v3.00.03.01;lang=id;nation=ID;locale=id_ID UWS/ Mobile Safari/537.36	114.10.118.132	\N	\N	\N	\N	\N
dea72719-3d1d-4397-b4d2-89359edb80c2	bc1166f0-5e38-4cd0-9fe2-3faead0b87aa	2026-06-10 09:49:22.340791+00	2026-06-10 09:49:22.340791+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/30.0 Chrome/143.0.0.0 Mobile Safari/537.36	140.213.185.163	\N	\N	\N	\N	\N
86bace8d-3edc-4ac3-8c47-bd33e2dd0629	bc1166f0-5e38-4cd0-9fe2-3faead0b87aa	2026-06-10 09:49:48.438571+00	2026-06-10 09:49:48.438571+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/30.0 Chrome/143.0.0.0 Mobile Safari/537.36	140.213.185.163	\N	\N	\N	\N	\N
c6c99510-60d0-4bb6-9993-dfe0a04deb19	0cfe9a0e-da21-4ad4-9e40-2b1fb4179c8a	2026-06-10 09:50:52.398434+00	2026-06-10 09:50:52.398434+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	182.3.73.31	\N	\N	\N	\N	\N
3d425472-3e66-46c9-896b-bd0785b5fb5b	0cfe9a0e-da21-4ad4-9e40-2b1fb4179c8a	2026-06-10 09:51:57.177035+00	2026-06-10 09:51:57.177035+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	182.3.73.31	\N	\N	\N	\N	\N
787ed704-9b6e-4f74-b98e-0ced6cb3c84c	a133c0c6-5c0e-43fd-bc17-f8a234272acb	2026-06-10 09:53:23.554705+00	2026-06-10 09:53:23.554705+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	103.147.236.69	\N	\N	\N	\N	\N
9f911b5f-266b-44a6-bb98-357abf58269a	8c398068-8879-4103-a677-814f137b8289	2026-06-10 09:53:28.49641+00	2026-06-10 09:53:28.49641+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Safari/604.1	114.10.104.200	\N	\N	\N	\N	\N
d5cda035-291e-4638-8144-1fdd9ba93031	9ad88462-8f92-4291-a90b-805dba849619	2026-06-10 09:53:55.265356+00	2026-06-10 09:53:55.265356+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	182.3.73.114	\N	\N	\N	\N	\N
029ed293-69c7-4872-965f-bb986220dacc	0cfe9a0e-da21-4ad4-9e40-2b1fb4179c8a	2026-06-10 09:54:58.667692+00	2026-06-10 09:54:58.667692+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	103.3.221.202	\N	\N	\N	\N	\N
c3228fad-46aa-4017-8762-38e53fdb3743	cd1f70bd-2086-4681-8437-b7c94c751791	2026-06-10 09:55:04.063392+00	2026-06-10 09:55:04.063392+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	119.235.212.210	\N	\N	\N	\N	\N
196b5730-e60e-4f0b-bd1d-18732855945d	78d4dbc5-65e0-446b-94e0-c18983a7667e	2026-06-10 09:55:25.172562+00	2026-06-10 09:55:25.172562+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	114.10.104.169	\N	\N	\N	\N	\N
c18f3732-e4d5-4b9b-99c7-cd6f393335fb	cd1f70bd-2086-4681-8437-b7c94c751791	2026-06-10 09:55:40.466166+00	2026-06-10 09:55:40.466166+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	119.235.212.210	\N	\N	\N	\N	\N
2e4cb8c5-17f0-4d1b-9024-ef5cfa3bc870	fefb7140-07ec-4264-b667-faf9be1cf5af	2026-06-10 09:55:41.507172+00	2026-06-10 09:55:41.507172+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/30.0 Chrome/143.0.0.0 Mobile Safari/537.36	140.213.184.137	\N	\N	\N	\N	\N
81aa1be8-fbe8-4a25-b32b-0f1fee7470dd	0cfe9a0e-da21-4ad4-9e40-2b1fb4179c8a	2026-06-10 09:55:55.202722+00	2026-06-10 09:55:55.202722+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	103.3.221.202	\N	\N	\N	\N	\N
e03149c4-af69-47e7-b1a8-407f93fc7c3d	0cfe9a0e-da21-4ad4-9e40-2b1fb4179c8a	2026-06-10 09:57:05.64725+00	2026-06-10 09:57:05.64725+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	103.3.221.202	\N	\N	\N	\N	\N
9f9c2078-2757-441a-b7b6-41bb5039b708	b460f35e-b398-4275-b71a-cfee0ffbb683	2026-06-10 09:59:51.021161+00	2026-06-10 09:59:51.021161+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1	182.3.71.72	\N	\N	\N	\N	\N
acff1c57-ba87-4e4f-a607-5454c98cf6e7	fbbcd506-dd25-4818-a9d3-83bc7ce032b1	2026-06-10 10:00:07.197972+00	2026-06-10 10:00:07.197972+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.6 Mobile/15E148 Safari/604.1	172.225.74.114	\N	\N	\N	\N	\N
342a455a-a00c-4067-a1ba-590a9ce6f61a	ff0b961d-76d2-46f7-a245-82a4761d00e6	2026-06-10 10:00:50.996602+00	2026-06-10 10:00:50.996602+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	103.3.221.202	\N	\N	\N	\N	\N
05fb4bfd-d62a-4293-a1fa-4d1fb6d83435	ed8b3b62-a4a1-4125-803d-af3312d3d642	2026-06-10 10:05:30.719573+00	2026-06-10 10:05:30.719573+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows; U; Windows NT 5.2; en-US) AppleWebKit/537.36 (KHTML, like Gecko)  VivoBrowser/16.0.4.2 Chrome/131.0.6778.200 Safari/537.36	182.3.70.52	\N	\N	\N	\N	\N
c11c7808-2cfa-414c-9631-f3bd6920c4dc	d9ed441b-47a9-436d-bab9-4cb3e1499e18	2026-06-10 10:09:31.712175+00	2026-06-10 10:09:31.712175+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1	114.10.104.194	\N	\N	\N	\N	\N
aec7cd6d-0754-4b9c-9a42-05852084696a	d9ed441b-47a9-436d-bab9-4cb3e1499e18	2026-06-10 10:12:48.534647+00	2026-06-10 10:12:48.534647+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1	114.10.104.194	\N	\N	\N	\N	\N
7aaca09c-9c1b-4662-8568-459e3cc26979	1238aed7-bb4f-4008-9ed9-c8db00aaaca1	2026-06-10 10:14:24.133373+00	2026-06-10 10:14:24.133373+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows; U; Windows NT 5.2; en-US) AppleWebKit/537.36 (KHTML, like Gecko)  VivoBrowser/16.0.4.2 Chrome/131.0.6778.200 Safari/537.36	140.213.190.107	\N	\N	\N	\N	\N
0e2dc5ab-e5e6-4a25-8cf6-d7a6ad2645c4	1238aed7-bb4f-4008-9ed9-c8db00aaaca1	2026-06-10 10:14:35.461741+00	2026-06-10 10:14:35.461741+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows; U; Windows NT 5.2; en-US) AppleWebKit/537.36 (KHTML, like Gecko)  VivoBrowser/16.0.4.2 Chrome/131.0.6778.200 Safari/537.36	140.213.190.107	\N	\N	\N	\N	\N
f40f8e69-00cb-4a54-864c-aaaf9dbb8b1f	1238aed7-bb4f-4008-9ed9-c8db00aaaca1	2026-06-10 10:15:04.674846+00	2026-06-10 10:15:04.674846+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows; U; Windows NT 5.2; en-US) AppleWebKit/537.36 (KHTML, like Gecko)  VivoBrowser/16.0.4.2 Chrome/131.0.6778.200 Safari/537.36	140.213.190.107	\N	\N	\N	\N	\N
f7a82363-f2c5-4c66-91a5-15ab8a6a1283	1238aed7-bb4f-4008-9ed9-c8db00aaaca1	2026-06-10 10:15:16.546983+00	2026-06-10 10:15:16.546983+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows; U; Windows NT 5.2; en-US) AppleWebKit/537.36 (KHTML, like Gecko)  VivoBrowser/16.0.4.2 Chrome/131.0.6778.200 Safari/537.36	114.10.104.138	\N	\N	\N	\N	\N
2efc6d98-1027-4de5-8076-ad74f7397c7c	1238aed7-bb4f-4008-9ed9-c8db00aaaca1	2026-06-10 10:15:41.34221+00	2026-06-10 10:15:41.34221+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows; U; Windows NT 5.2; en-US) AppleWebKit/537.36 (KHTML, like Gecko)  VivoBrowser/16.0.4.2 Chrome/131.0.6778.200 Safari/537.36	114.10.104.138	\N	\N	\N	\N	\N
0f701554-1455-4590-9bb6-6685beb5f6de	793040a4-f4ed-4e82-99fc-8cb492ded4c1	2026-06-10 10:26:19.896466+00	2026-06-10 10:26:19.896466+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	114.79.5.105	\N	\N	\N	\N	\N
5443e015-c88d-41ab-a12c-0e84765d5c16	793040a4-f4ed-4e82-99fc-8cb492ded4c1	2026-06-10 10:28:36.263087+00	2026-06-10 10:28:36.263087+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	114.79.5.105	\N	\N	\N	\N	\N
2bc30be1-4177-4a97-9314-305f6144877a	b18e30f5-1ba2-4697-a602-12b89d2473cd	2026-06-10 10:30:49.422733+00	2026-06-10 10:30:49.422733+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	114.79.5.105	\N	\N	\N	\N	\N
32f765fd-6431-4572-a3fe-883a7a1640de	438671de-205c-4083-8610-cbf138757f36	2026-06-10 11:14:19.60181+00	2026-06-10 11:14:19.60181+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1	114.10.41.175	\N	\N	\N	\N	\N
bd0af7be-67dd-4461-9f84-cc43ecc2af00	b1c35f5a-1ecb-46a4-904d-795a0029cc05	2026-06-10 11:14:42.816718+00	2026-06-10 11:14:42.816718+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	114.10.104.196	\N	\N	\N	\N	\N
200e0b72-b454-413e-9056-0936da46538c	177b1fa3-0207-4b0a-9cac-450029fe8ac7	2026-06-10 11:21:09.604377+00	2026-06-10 11:21:09.604377+00	\N	aal1	\N	\N	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.5 Safari/605.1.15	114.122.106.210	\N	\N	\N	\N	\N
260cf52a-1a68-4353-b291-ed94ecfc8fb9	b1c35f5a-1ecb-46a4-904d-795a0029cc05	2026-06-10 11:31:16.823795+00	2026-06-10 11:31:16.823795+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	114.10.104.196	\N	\N	\N	\N	\N
de8312e8-0e95-40ac-8c9c-736a86b0f36c	ccaaf342-c293-485b-b064-7d9f2cd42b22	2026-06-10 11:36:30.169668+00	2026-06-10 11:36:30.169668+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1	114.125.248.172	\N	\N	\N	\N	\N
2c43a4e7-5d32-4e08-a12d-1c3f9b1a4dc3	b1c35f5a-1ecb-46a4-904d-795a0029cc05	2026-06-10 11:43:07.767611+00	2026-06-10 11:43:07.767611+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	114.10.104.196	\N	\N	\N	\N	\N
1d4d32c9-f409-41cb-9bac-8aa3b4526154	4086843e-872a-4a4b-8d3b-c332544ae077	2026-06-10 11:52:40.822539+00	2026-06-10 11:52:40.822539+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	114.10.104.196	\N	\N	\N	\N	\N
a71afe59-62a0-4e29-99a2-599cdbe9d5ca	679068fe-5f7b-426f-8bc5-702def6a2380	2026-06-10 13:23:15.84852+00	2026-06-10 13:23:15.84852+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	182.3.100.84	\N	\N	\N	\N	\N
2fbcd74c-c431-4e4b-8b0d-bf77bab61067	679068fe-5f7b-426f-8bc5-702def6a2380	2026-06-10 13:25:12.939489+00	2026-06-10 13:25:12.939489+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	182.3.100.84	\N	\N	\N	\N	\N
34ef8286-6011-45c5-8666-798047c1d07e	7a1ee006-f94b-463b-9d47-f99241469e24	2026-06-10 13:28:42.860521+00	2026-06-10 13:28:42.860521+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	182.3.100.84	\N	\N	\N	\N	\N
1eca8189-59e4-4f87-8e08-36aadb7d6729	b1d26638-7b8d-41ef-b98e-066637aea3f4	2026-06-10 13:50:10.967164+00	2026-06-10 13:50:10.967164+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/30.0 Chrome/143.0.0.0 Mobile Safari/537.36	103.154.224.121	\N	\N	\N	\N	\N
281806cd-9379-48f2-9f8e-6fd967b73291	8f567802-a7ad-4f4f-8534-bdc036b09b97	2026-06-10 12:53:58.800428+00	2026-06-26 05:04:17.931536+00	\N	aal1	\N	2026-06-26 05:04:17.931394	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.5 Mobile/15E148 Safari/604.1	182.2.37.69	\N	\N	\N	\N	\N
c08a32d7-fda8-4d84-9f14-7c836e15e87a	d1e35067-6977-41c5-aeac-2d7b183dca75	2026-06-10 18:55:54.459487+00	2026-06-10 18:55:54.459487+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/30.0 Chrome/143.0.0.0 Mobile Safari/537.36	182.3.71.228	\N	\N	\N	\N	\N
e70fb238-65ce-498f-afce-a9d1627629bd	d1e35067-6977-41c5-aeac-2d7b183dca75	2026-06-10 19:03:57.194252+00	2026-06-10 19:03:57.194252+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/30.0 Chrome/143.0.0.0 Mobile Safari/537.36	182.3.71.228	\N	\N	\N	\N	\N
be38d65f-07be-4033-b53b-ec953fef4391	10510d96-7171-4b5a-8ca0-b7090f8d6f58	2026-06-10 13:52:18.6526+00	2026-06-11 03:13:03.111461+00	\N	aal1	\N	2026-06-11 03:13:03.111339	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/30.0 Chrome/143.0.0.0 Mobile Safari/537.36	182.3.73.125	\N	\N	\N	\N	\N
bd98520c-76f6-4308-99f5-009471d79a0b	a4161fa7-0657-4037-ba49-33cb3b02b9cc	2026-06-10 10:07:31.139283+00	2026-06-12 17:53:46.376173+00	\N	aal1	\N	2026-06-12 17:53:46.376069	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	103.147.237.146	\N	\N	\N	\N	\N
6e11fa9b-cdab-4470-8b14-597ddb420bdf	10fcb99b-b830-4a2e-b35a-9979f9106c67	2026-06-10 11:01:30.385155+00	2026-06-14 08:30:30.415773+00	\N	aal1	\N	2026-06-14 08:30:30.415643	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.6 Mobile/15E148 Safari/604.1	114.79.0.91	\N	\N	\N	\N	\N
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	3d08937b-c6ab-43f6-9a51-f4b384585c62	authenticated	authenticated	faruq123@gmail.com	$2a$10$HlnOEOWrpI1y5zl2wAQ8muQsSltt0kY629duAHRuDJRqSvj9VULL6	\N	\N	1727b5a75155aa88aeceeeac29c12bb1c8cc3e69726821afb9fc47d0	2026-04-05 16:01:01.422157+00		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"sub": "3d08937b-c6ab-43f6-9a51-f4b384585c62", "email": "faruq123@gmail.com", "full_name": "faruq", "email_verified": false, "phone_verified": false}	\N	2026-04-05 16:01:01.417648+00	2026-04-05 16:01:03.061456+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	06394c98-b0bd-4a0f-9a4f-07382dd6051e	authenticated	authenticated	donaturtest@gmail.com	$2a$10$JKqlFceIOWLiY/Pzb7PwRuQkLr.ox9CAAbXVCgZp30jVNRFUI8KSG	2026-04-06 13:52:19.475552+00	\N		\N		\N			\N	2026-04-07 06:43:30.404175+00	{"provider": "email", "providers": ["email"]}	{"sub": "06394c98-b0bd-4a0f-9a4f-07382dd6051e", "email": "donaturtest@gmail.com", "full_name": "DonaturTest", "email_verified": true, "phone_verified": false}	\N	2026-04-06 13:52:19.457605+00	2026-04-14 08:12:40.202813+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	8d910256-6a25-45e2-b41b-88063f499570	authenticated	authenticated	testing13@gmail.com	$2a$10$v3K/rRlRJ5JS/wp6dsGxruaVYRUdAKZBv.YYCEfrWJVZj5lI7Tmeq	2026-04-06 06:51:19.452818+00	\N		\N		\N			\N	2026-04-06 06:51:19.458693+00	{"provider": "email", "providers": ["email"]}	{"sub": "8d910256-6a25-45e2-b41b-88063f499570", "email": "testing13@gmail.com", "full_name": "testing13", "email_verified": true, "phone_verified": false}	\N	2026-04-06 06:51:19.431754+00	2026-04-06 06:51:19.464523+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	729463e8-d692-479c-a79d-d77e43fe3277	authenticated	authenticated	penerimatest@gmail.com	$2a$10$KMRJeKXtVZy/p7sYuCEsgesl6eZqk9RMwkQL9q4HsDR2PMvzFmQCq	2026-04-06 13:58:01.94577+00	\N		\N		\N			\N	2026-04-06 16:40:38.398177+00	{"provider": "email", "providers": ["email"]}	{"sub": "729463e8-d692-479c-a79d-d77e43fe3277", "email": "penerimatest@gmail.com", "full_name": "PenerimaTest", "email_verified": true, "phone_verified": false}	\N	2026-04-06 13:58:01.929167+00	2026-04-06 16:40:38.400605+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	3d25b86d-1723-4594-92ed-2c1bdd3a8e11	authenticated	authenticated	testing12@gmail.com	$2a$10$iiIOf4m6dFibqFFI9EtU4OgR1JnYV9pEZUZgJZG.FvCvKACrj7S..	2026-04-06 03:45:18.33736+00	\N		\N		\N			\N	2026-04-06 06:40:32.185046+00	{"provider": "email", "providers": ["email"]}	{"sub": "3d25b86d-1723-4594-92ed-2c1bdd3a8e11", "email": "testing12@gmail.com", "full_name": "achmad faruq", "email_verified": true, "phone_verified": false}	\N	2026-04-06 03:45:18.288095+00	2026-04-06 06:40:32.199163+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	99cecaee-8a99-493b-88ad-b457e4d5e45e	authenticated	authenticated	vendor@gmail.com	$2a$10$DcfVcjcCVY.BsaYLPgCIqecAEvmLsUAOsqhx6nryS2vB3NuwFoYXG	2026-04-06 15:54:02.024499+00	\N		\N		\N			\N	2026-04-06 16:41:19.064294+00	{"provider": "email", "providers": ["email"]}	{"sub": "99cecaee-8a99-493b-88ad-b457e4d5e45e", "email": "vendor@gmail.com", "full_name": "VendorTest", "email_verified": true, "phone_verified": false}	\N	2026-04-06 15:54:02.005898+00	2026-04-06 16:41:19.079713+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	ffb38e44-aed8-4479-bf55-aa1ca7c76214	authenticated	authenticated	devin@gmail.com	$2a$10$aD1xPbg0.jxKWXFGitEN0OFNwZWz/QVXM3aMn.QX3BbV0YIhEUuYi	2026-04-06 12:55:05.886105+00	\N		\N		\N			\N	2026-04-06 13:17:32.743947+00	{"provider": "email", "providers": ["email"]}	{"sub": "ffb38e44-aed8-4479-bf55-aa1ca7c76214", "email": "devin@gmail.com", "full_name": "Devin", "email_verified": true, "phone_verified": false}	\N	2026-04-06 12:55:05.855154+00	2026-04-06 13:17:32.749873+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	07cf6ecc-d375-4a45-9d83-9e2380f5c6d7	authenticated	authenticated	test14@gmail.com	$2a$10$k6IYY894EImuaGr1GS0SgOtCpAjgpZV8LJMiLnfgmVzu16zq.bU2O	2026-04-06 14:05:49.291449+00	\N		\N		\N			\N	2026-04-06 14:05:49.294492+00	{"provider": "email", "providers": ["email"]}	{"sub": "07cf6ecc-d375-4a45-9d83-9e2380f5c6d7", "email": "test14@gmail.com", "full_name": "test", "email_verified": true, "phone_verified": false}	\N	2026-04-06 14:05:49.270923+00	2026-04-06 14:05:49.301124+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	d68b8ec6-00cb-4672-aa5f-604bac0c86a1	authenticated	authenticated	penerima@gmail.com	$2a$10$.4Ep1YVzXJ0O77oFxbX2zu1fpRMU9oh.QosYyM5V4eopGU7DYyKUS	2026-04-18 06:00:28.669626+00	\N		2026-04-05 11:47:56.663942+00		\N			\N	2026-04-18 06:00:28.69223+00	{"provider": "email", "providers": ["email"]}	{"sub": "d68b8ec6-00cb-4672-aa5f-604bac0c86a1", "email": "penerima@gmail.com", "full_name": "penerima", "email_verified": true, "phone_verified": false}	\N	2026-04-05 11:47:56.630937+00	2026-04-18 06:00:28.724495+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	cc5b179f-d89f-4392-9367-805c5ee21801	authenticated	authenticated	faruq1234@gmail.com	$2a$10$H9FKmqGGqd749TD8MM3dHOShN1/PKrwrAEckNmUdT.KzgWrF66qN6	\N	\N	56a36a58866bbabcfefbe8def1c4ed130a6fd660ea07092e897dc2ef	2026-04-05 17:53:58.633497+00		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"sub": "cc5b179f-d89f-4392-9367-805c5ee21801", "email": "faruq1234@gmail.com", "full_name": "achhh", "email_verified": false, "phone_verified": false}	\N	2026-04-05 17:53:58.590148+00	2026-04-05 17:54:00.397792+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	b327894c-5063-4980-adf4-9f42d8739525	authenticated	authenticated	achmad@gmail.com	$2a$10$6M5gjaNJac2vBwHVpTlzGO97mxFIsM6DQda.iiUuFA6BzcrrpNQcu	\N	\N	c06c5369096b1a91e9f71103992fa068075763498ffa3b718b2fe719	2026-04-05 18:26:20.758805+00		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"sub": "b327894c-5063-4980-adf4-9f42d8739525", "email": "achmad@gmail.com", "full_name": "achmad", "email_verified": false, "phone_verified": false}	\N	2026-04-05 18:26:20.731542+00	2026-04-05 18:26:22.467868+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	f3ada4b1-2bba-4155-bb2e-5cee4b791390	authenticated	authenticated	devinsurya95@gmail.com	\N	2026-04-06 18:16:13.406124+00	\N		\N		\N			\N	2026-09-03 06:25:47.793371+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "100490998847823577671", "name": "Devin Suryadi", "email": "devinsurya95@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKfVAP0SwV4fCy4N7aM3vUoYefsJ6F2HeYLCVMfYqxDYY3IU7w=s96-c", "full_name": "Devin Suryadi", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKfVAP0SwV4fCy4N7aM3vUoYefsJ6F2HeYLCVMfYqxDYY3IU7w=s96-c", "provider_id": "100490998847823577671", "email_verified": true, "phone_verified": false}	\N	2026-04-06 18:16:13.388351+00	2026-09-03 06:25:47.841751+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	7ca8a80f-cf29-48c9-a5fa-6b9555ff3563	authenticated	authenticated	donaturtest2@gmail.com	$2a$10$/7SPvG69Mu4/Ggbor3.lx.ff.floPHGhHW4/ZsTmLX87DsJ4odj8G	2026-04-07 01:39:38.719062+00	\N		\N		\N			\N	2026-04-18 17:08:12.652209+00	{"provider": "email", "providers": ["email"]}	{"sub": "7ca8a80f-cf29-48c9-a5fa-6b9555ff3563", "role": "donor", "email": "donaturtest2@gmail.com", "phone": "08456982367", "address": "Jatinangor test", "full_name": "DonaturTest2", "email_verified": true, "phone_verified": false}	\N	2026-04-07 01:39:38.682052+00	2026-04-18 17:08:12.666072+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	5450bfc1-bc5a-4494-bbff-65f6eb7a5f82	authenticated	authenticated	testing1234@gmail.com	$2a$10$7Up9wU/mrbuWNipDSKtfreUnVNNT/qkZBpwYoutehaL8XHwCHdulC	2026-04-07 06:10:08.650266+00	\N		\N		\N			\N	2026-04-07 06:10:53.025147+00	{"provider": "email", "providers": ["email"]}	{"sub": "5450bfc1-bc5a-4494-bbff-65f6eb7a5f82", "email": "testing1234@gmail.com", "full_name": "Testing1234", "email_verified": true, "phone_verified": false}	\N	2026-04-07 06:10:08.60837+00	2026-04-07 06:10:53.028929+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	0f639158-6f69-4764-9356-34162a491f92	authenticated	authenticated	farqachmd@gmail.com	\N	2026-04-07 06:15:38.499197+00	\N		\N		\N			\N	2026-04-07 06:15:38.501239+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "110271860191377595706", "name": "Achmd Farq", "email": "farqachmd@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLwFt3TMjXaSU1sU3oa9rZJEfx-7Rcvu-aOatmAjL0eb-_9Yg=s96-c", "full_name": "Achmd Farq", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLwFt3TMjXaSU1sU3oa9rZJEfx-7Rcvu-aOatmAjL0eb-_9Yg=s96-c", "provider_id": "110271860191377595706", "email_verified": true, "phone_verified": false}	\N	2026-04-07 06:15:38.491364+00	2026-04-07 06:15:38.503069+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	db79d4e9-89e4-4001-9942-28044f68bfb0	authenticated	authenticated	lululaaww@gmail.com	\N	2026-04-07 06:15:54.325341+00	\N		\N		\N			\N	2026-04-07 06:15:54.326684+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "103131656179784509724", "name": "Lulu Law", "email": "lululaaww@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocI1f4FSCoDUNF5Gj-mQaEkItsq6s-h_uqX1gQs09Typ8xdOopw=s96-c", "full_name": "Lulu Law", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocI1f4FSCoDUNF5Gj-mQaEkItsq6s-h_uqX1gQs09Typ8xdOopw=s96-c", "provider_id": "103131656179784509724", "email_verified": true, "phone_verified": false}	\N	2026-04-07 06:15:54.32103+00	2026-04-07 06:15:54.328341+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	ee4f68ab-cc12-45f8-92b6-3c1f7422aff6	authenticated	authenticated	penerima1@gmail.com	$2a$10$d53ThTm0WCI8Og4nRJwmu.b1GpiU/Qk5CbsJ1q2YbLYTmgveYoIyu	2026-04-18 06:26:00.855666+00	\N		\N		\N			\N	2026-04-20 14:15:23.735006+00	{"provider": "email", "providers": ["email"]}	{"sub": "ee4f68ab-cc12-45f8-92b6-3c1f7422aff6", "role": "beneficiary", "email": "penerima1@gmail.com", "full_name": "Penerima1", "email_verified": true, "phone_verified": false}	\N	2026-04-18 06:26:00.842639+00	2026-04-20 14:35:39.55852+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	0ee371fa-c985-47fb-a4b6-a5e4f37506e0	authenticated	authenticated	test123456@gmail.com	$2a$10$B5GdjkGxTS8QbUKtfmG.AO3d3RJTRvD7jFJ7cHp2TKJ2MSY2csHjm	2026-04-14 08:17:38.318456+00	\N		\N		\N			\N	2026-04-14 08:17:38.3285+00	{"provider": "email", "providers": ["email"]}	{"sub": "0ee371fa-c985-47fb-a4b6-a5e4f37506e0", "role": "donor", "email": "test123456@gmail.com", "phone": "0812345678", "address": "tygkhjnbvxgsrdytusaascaskcbasjk", "full_name": "test", "email_verified": true, "phone_verified": false}	\N	2026-04-14 08:17:38.285615+00	2026-04-14 14:38:10.260541+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	fb786028-4d27-4051-a3a8-9b2ea43df395	authenticated	authenticated	donaturtesttest@gmail.com	$2a$10$chRJz5eBp3SxZ8KHg4mtLuWPR/ZVfy1HCDI0SKY5J2jgG40lGGQfu	2026-04-07 06:57:40.63965+00	\N		\N		\N			\N	2026-04-07 06:57:40.651381+00	{"provider": "email", "providers": ["email"]}	{"sub": "fb786028-4d27-4051-a3a8-9b2ea43df395", "role": "donor", "email": "donaturtesttest@gmail.com", "phone": "08675434567", "address": "dahjkahdkjahdkja", "full_name": "DonaturTestTest", "email_verified": true, "phone_verified": false}	\N	2026-04-07 06:57:40.600459+00	2026-04-07 06:57:40.657478+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	77aa5e96-34a0-4366-8308-1bc8e5358d06	authenticated	authenticated	faruqmahdison@gmail.com	$2a$10$fdjo9eANdWCg2l0Oz3acEuDC2Y.JerQs.IzVPeva4ZGgEFZ7k0rPO	2026-04-05 19:13:13.981674+00	\N		\N		\N			\N	2026-04-07 07:01:26.208961+00	{"provider": "google", "providers": ["google", "email"]}	{"iss": "https://accounts.google.com", "sub": "112534055204974450269", "name": "Achmad Faruq", "email": "faruqmahdison@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJn9WOPI8EDPOP5mIkO9YWZH_sbtibiadPGSAtiRATzlvPzmA=s96-c", "full_name": "Achmad Faruq", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJn9WOPI8EDPOP5mIkO9YWZH_sbtibiadPGSAtiRATzlvPzmA=s96-c", "provider_id": "112534055204974450269", "email_verified": true, "phone_verified": false}	\N	2026-04-05 19:13:13.975376+00	2026-04-14 05:27:29.003755+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	796ed162-2338-4ce8-b57d-6abea2a1f503	authenticated	authenticated	admin@gmail.com	$2a$10$89QlbVDyMz1Fx62eWOltNusIYUq/od8iNH1RMqKYs197QoetTE1Hm	2026-04-28 16:21:40.992897+00	\N		\N		\N			\N	2026-09-03 06:26:50.673179+00	{"role": "admin", "provider": "email", "providers": ["email"]}	{"role": "admin", "full_name": "Admin", "email_verified": true}	\N	2026-04-28 16:21:40.971291+00	2026-09-03 06:26:50.677503+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	fefb7140-07ec-4264-b667-faf9be1cf5af	authenticated	authenticated	chindyaulia8888@gmail.com	$2a$10$PDZQreBUUEMIZMd2c.0xsuP.H/v.csFhJ5.8jf0fVToUVa3tOEAzC	2026-06-10 09:55:41.503157+00	\N		\N		\N			\N	2026-06-10 09:55:41.507064+00	{"provider": "email", "providers": ["email"]}	{"sub": "fefb7140-07ec-4264-b667-faf9be1cf5af", "role": "donor", "email": "chindyaulia8888@gmail.com", "phone": "087733208289", "address": "Jambi", "full_name": "Bella", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:55:41.497565+00	2026-06-10 09:55:41.508878+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	78d4dbc5-65e0-446b-94e0-c18983a7667e	authenticated	authenticated	brayseribuasa@gmail.com	$2a$10$l8weVQc6rNmYPhdmt8MaaurkGsaypuYk.UHI7VflOM/Zn5FAlG5zu	2026-06-10 09:55:25.169485+00	\N		\N		\N			\N	2026-06-10 09:55:25.172454+00	{"provider": "email", "providers": ["email"]}	{"sub": "78d4dbc5-65e0-446b-94e0-c18983a7667e", "role": "donor", "email": "brayseribuasa@gmail.com", "phone": "082175428845", "full_name": "Brayden To", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:55:25.163581+00	2026-06-10 09:55:25.174215+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	0ea01ac1-723f-484c-b2ca-fcf69a554b37	authenticated	authenticated	demo-donor@gmail.com	$2a$10$No5XvVBYXRSxOU/X0OqRNua0tFRoN17O.uAGbuCvCBRZwLlweiiR6	2026-04-20 15:08:31.338525+00	\N		\N		\N			\N	2026-09-03 07:27:29.405685+00	{"provider": "email", "providers": ["email"]}	{"demo": true, "email_verified": true}	\N	2026-04-20 15:08:31.322316+00	2026-09-03 07:27:29.475017+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	52fae754-5e5d-41c9-9817-5c952533bd84	authenticated	authenticated	donatur1@gmail.com	$2a$10$qLhs9ONRJ6.LbRzEvbb5WOhc/T6LTgAtPvtIrlEWou7QzZ1M5rogq	2026-04-20 01:53:58.281491+00	\N		\N		\N			\N	2026-04-20 13:50:17.928822+00	{"provider": "email", "providers": ["email"]}	{"sub": "52fae754-5e5d-41c9-9817-5c952533bd84", "role": "donor", "email": "donatur1@gmail.com", "full_name": "Donatur1", "email_verified": true, "phone_verified": false}	\N	2026-04-20 01:53:58.24877+00	2026-04-20 13:50:17.942863+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	3293b8aa-335d-4228-9e49-edc1aa133f6e	authenticated	authenticated	vendor1@gmail.com	$2a$10$IK5.NPvsqnIZfzQD8Nh4butcApA7tpBjG.mb4QS854aN3VszWb/AG	2026-04-19 13:51:05.693691+00	\N		\N		\N			\N	2026-04-20 13:51:24.895009+00	{"provider": "email", "providers": ["email"]}	{"sub": "3293b8aa-335d-4228-9e49-edc1aa133f6e", "role": "vendor", "email": "vendor1@gmail.com", "full_name": "vendor1", "email_verified": true, "phone_verified": false}	\N	2026-04-19 13:51:05.654219+00	2026-04-20 13:51:24.904777+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	f383af29-b1ef-431b-bb30-7f8d8c9f18a8	authenticated	authenticated	fotofaruq2@gmail.com	\N	2026-04-19 14:18:39.171749+00	\N		\N		\N			\N	2026-04-19 14:20:01.707784+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "103658095970827797134", "name": "foto faruq", "email": "fotofaruq2@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJb0mBsxh29_ESOfpdRrBZYVcEvmdf8uDWQjYFsV2QBvlqwCA=s96-c", "full_name": "foto faruq", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJb0mBsxh29_ESOfpdRrBZYVcEvmdf8uDWQjYFsV2QBvlqwCA=s96-c", "provider_id": "103658095970827797134", "email_verified": true, "phone_verified": false}	\N	2026-04-19 14:18:39.162261+00	2026-04-19 15:19:56.532347+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	1a618fcf-a69d-42fb-ab65-8b6c2b75f276	authenticated	authenticated	penerima02@gmail.com	$2a$10$AvlVT4gzWPvGTaG72ZVNueiv9yN3z.NoZmZkwi4fmbxbcrXMd5WJi	2026-04-27 13:04:00.860967+00	\N		\N		\N			\N	2026-04-27 13:04:00.864542+00	{"provider": "email", "providers": ["email"]}	{"sub": "1a618fcf-a69d-42fb-ab65-8b6c2b75f276", "role": "beneficiary", "email": "penerima02@gmail.com", "full_name": "Penerima02", "email_verified": true, "phone_verified": false}	\N	2026-04-27 13:04:00.814187+00	2026-04-27 13:04:00.872263+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	ae19f5a1-35f1-413c-af42-c7001ee9492f	authenticated	authenticated	donatur3@gmail.com	$2a$10$PBNF08SdaJsAcLD8vBuBvuxUzGJRWtwNXgC4kN9WWk7YNyP5FcQPW	2026-04-22 00:38:57.149286+00	\N		\N		\N			\N	2026-04-22 00:38:57.152265+00	{"provider": "email", "providers": ["email"]}	{"sub": "ae19f5a1-35f1-413c-af42-c7001ee9492f", "role": "donor", "email": "donatur3@gmail.com", "full_name": "Donatur3", "email_verified": true, "phone_verified": false}	\N	2026-04-22 00:38:57.13512+00	2026-04-22 00:38:57.155684+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	f1177ee0-66c6-4167-923c-aeb1824d3c34	authenticated	authenticated	donatur01@gmail.com	$2a$10$ZIbWjBwSWqX9Aa.13T/rwusbHWkqMKqIjLMjJfy175kWCmkgzt0Ue	2026-05-03 09:57:44.050002+00	\N		\N		\N			\N	2026-06-17 02:49:06.341897+00	{"provider": "email", "providers": ["email"]}	{"sub": "f1177ee0-66c6-4167-923c-aeb1824d3c34", "role": "donor", "email": "donatur01@gmail.com", "phone": "08224564485945", "full_name": "Donatur01", "email_verified": true, "phone_verified": false}	\N	2026-05-03 09:57:44.003173+00	2026-06-17 02:49:06.399113+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	642a6f09-0362-449f-aa96-af1c02bcc955	authenticated	authenticated	donatur2@gmail.com	$2a$10$ei78rH/dA6O/I64ltvZHOu2wBdFD4RZg7BlxWL.epn/k49BKeppEa	2026-04-22 00:20:47.280939+00	\N		\N		\N			\N	2026-04-22 00:20:47.288471+00	{"provider": "email", "providers": ["email"]}	{"sub": "642a6f09-0362-449f-aa96-af1c02bcc955", "role": "donor", "email": "donatur2@gmail.com", "full_name": "Donatur2", "email_verified": true, "phone_verified": false}	\N	2026-04-22 00:20:47.250484+00	2026-04-22 00:20:47.313949+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	d28f7ab8-1f48-4e4b-bd84-96219085bd7e	authenticated	authenticated	demo-penerima@gmail.com	$2a$10$T07v1AunqayWS1EaZYHlle.xPPn1zMReNz9vV3/jb1ZLUD/JrgfRy	2026-04-20 15:08:31.565021+00	\N		\N		\N			\N	2026-06-24 21:22:06.593482+00	{"provider": "email", "providers": ["email"]}	{"demo": true, "email_verified": true}	\N	2026-04-20 15:08:31.562471+00	2026-06-24 21:22:06.620604+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	88975b2b-ba37-4178-92db-235e6d9f0ff0	authenticated	authenticated	demo-vendor@gmail.com	$2a$10$jWPBZOsUTpr5rvsPlCeNhuliZkYcFax1jvqfwkWtM.iI3uCbYewZy	2026-04-20 15:08:31.806851+00	\N		\N		\N			\N	2026-06-24 21:23:35.502155+00	{"provider": "email", "providers": ["email"]}	{"demo": true, "email_verified": true}	\N	2026-04-20 15:08:31.803992+00	2026-06-24 21:23:35.505273+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	706ffe8f-d51e-4a2f-924f-8180d76dc558	authenticated	authenticated	vendor01@gmail.com	$2a$10$YGunI/LBuxSf01/8gllvy.KTgoZXIBQTR1hrKJ62EBZU.dQZbQA8y	2026-05-04 17:32:53.948879+00	\N		\N		\N			\N	2026-06-17 06:43:00.670213+00	{"provider": "email", "providers": ["email"]}	{"sub": "706ffe8f-d51e-4a2f-924f-8180d76dc558", "role": "vendor", "email": "vendor01@gmail.com", "full_name": "vendor01", "email_verified": true, "phone_verified": false}	\N	2026-05-04 17:32:53.915987+00	2026-06-17 06:43:00.681458+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	f19ca67e-9299-40a3-ab61-e5dd911ccd2f	authenticated	authenticated	penerima01@gmail.com	$2a$10$LAQfgBaAtWllZMmzEdl/d.gQ55a9DitWRxZzIXDJ8vWAq3iCr9kL2	2026-04-27 13:02:36.743166+00	\N		\N		\N			\N	2026-06-17 06:25:51.798991+00	{"provider": "email", "providers": ["email"]}	{"sub": "f19ca67e-9299-40a3-ab61-e5dd911ccd2f", "role": "beneficiary", "email": "penerima01@gmail.com", "full_name": "Penerima01", "email_verified": true, "phone_verified": false}	\N	2026-04-27 13:02:36.706712+00	2026-06-17 06:25:51.815918+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	319688e1-ad41-4c83-a381-a8a700681e3d	authenticated	authenticated	devintest@gmail.com	$2a$10$/YpcSUh65bBffgVhySDUD.Hu/pDAPi3NyVVmdhqt2RDEM2UXvvcRi	2026-05-19 08:49:00.147257+00	\N		\N		\N			\N	2026-05-19 08:49:00.155163+00	{"provider": "email", "providers": ["email"]}	{"sub": "319688e1-ad41-4c83-a381-a8a700681e3d", "role": "beneficiary", "email": "devintest@gmail.com", "phone": "086534569851", "address": "ya", "full_name": "Devin", "email_verified": true, "phone_verified": false}	\N	2026-05-19 08:49:00.10557+00	2026-06-10 05:02:19.27106+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	72bddb91-e66b-4823-8b1e-c7e88304cbeb	authenticated	authenticated	nadwahkh31@gmail.com	$2a$10$BMfT2r3MDmQyxqZT2rE.Ou2SGEUi6rWUS03Kx0SGdnt7XB/F1rbMq	2026-06-09 13:11:30.67912+00	\N		\N		\N			\N	2026-06-09 13:11:30.690135+00	{"provider": "email", "providers": ["email"]}	{"sub": "72bddb91-e66b-4823-8b1e-c7e88304cbeb", "role": "donor", "email": "nadwahkh31@gmail.com", "phone": "0895320631772", "address": "Tangerang", "full_name": "Nadwah Khairunnisa", "email_verified": true, "phone_verified": false}	\N	2026-06-09 13:11:30.610656+00	2026-06-09 13:11:30.720374+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	b4a06baa-2cf5-4817-9dfe-73cb4506a674	authenticated	authenticated	raja11.faruq@gmail.com	\N	2026-05-09 16:02:50.903612+00	\N		\N		\N			\N	2026-05-19 08:08:21.767949+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "100895118706626920045", "name": "Achmad Faruq", "email": "raja11.faruq@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLeDRYJ-CNjrADYghc27HWYjCyXbcjZiVDScIqIFgExwB0_wi4=s96-c", "full_name": "Achmad Faruq", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLeDRYJ-CNjrADYghc27HWYjCyXbcjZiVDScIqIFgExwB0_wi4=s96-c", "provider_id": "100895118706626920045", "email_verified": true, "phone_verified": false}	\N	2026-05-09 16:02:50.846245+00	2026-05-19 08:08:21.770124+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	e848d29b-a53b-4cde-86cc-c6712dadce20	authenticated	authenticated	demo2-donor@gmail.com	$2a$10$Imdq.Ixw/wyf4j4vqBMy5O7QDTg49UocuVw9GPauOLe7dlBdj6.dG	2026-05-26 01:36:48.941785+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"demo": true, "email_verified": true}	\N	2026-05-26 01:36:48.908796+00	2026-05-26 01:36:48.943281+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	16f078f8-7650-4e74-a56b-2e80141123d9	authenticated	authenticated	asun33830@gmail.com	\N	2026-06-10 09:40:39.94138+00	\N		\N		\N			\N	2026-06-10 09:40:39.944651+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "115826118483477265474", "name": "Brayden To", "email": "asun33830@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJN660ceVq3pX7qGpLOnRpyVq7wmtP2Fk2bfrtt6ktpgQc2vA=s96-c", "full_name": "Brayden To", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJN660ceVq3pX7qGpLOnRpyVq7wmtP2Fk2bfrtt6ktpgQc2vA=s96-c", "provider_id": "115826118483477265474", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:40:39.925729+00	2026-06-10 09:40:39.948871+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	c5a8b3e9-5677-4577-aabc-a25446f0ae61	authenticated	authenticated	demo2-penerima@gmail.com	$2a$10$HCetGfsSC.tJTCD5OG6zYuhxNw6UA4As5rFoqy2lihFIu.PLvRSkO	2026-05-26 01:36:49.114249+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"demo": true, "email_verified": true}	\N	2026-05-26 01:36:49.110361+00	2026-05-26 01:36:49.116365+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	6d6e430d-7a02-4b3e-b563-2b15dfe4a7cb	authenticated	authenticated	demo2-vendor@gmail.com	$2a$10$WsICoakota5JyXLRFKtaoeZxQ0iVD2UWdzcR2Sn8tQ8QKLKWeltQu	2026-05-26 01:36:49.274876+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"demo": true, "email_verified": true}	\N	2026-05-26 01:36:49.271861+00	2026-05-26 01:36:49.276206+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	bc1166f0-5e38-4cd0-9fe2-3faead0b87aa	authenticated	authenticated	chindyauliam8888@gmail.com	\N	2026-06-10 09:44:55.910287+00	\N		\N		2026-06-10 09:49:06.255509+00			\N	2026-06-10 09:49:48.438499+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "117622003159861793016", "name": "Chindy Aulia", "email": "chindyauliam8888@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLzgTUv9QJqmBI0aqXtUUVYXMom_OgEGeVf1f7O2vtMa2aURo2c=s96-c", "full_name": "Chindy Aulia", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLzgTUv9QJqmBI0aqXtUUVYXMom_OgEGeVf1f7O2vtMa2aURo2c=s96-c", "provider_id": "117622003159861793016", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:44:55.870369+00	2026-06-10 09:49:48.44117+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	5d964e27-02d2-483d-b3f9-e0561ef621a9	authenticated	authenticated	laurensaandi@gmail.com	$2a$10$7WH7X7lJF4RD9hVmzUeKVe.bXKR2zC7U0GLgwAZB5beFedK3Y/tv2	2026-06-10 09:46:41.737418+00	\N		\N		\N			\N	2026-06-10 09:46:41.74037+00	{"provider": "email", "providers": ["email"]}	{"sub": "5d964e27-02d2-483d-b3f9-e0561ef621a9", "role": "beneficiary", "email": "laurensaandi@gmail.com", "full_name": "Laurensa Andi", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:46:41.732516+00	2026-06-10 09:46:41.742108+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	b1c35f5a-1ecb-46a4-904d-795a0029cc05	authenticated	authenticated	andisariputra8b@gmail.com	\N	2026-06-10 11:14:42.813336+00	\N		\N		\N			\N	2026-06-10 11:43:07.765512+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "108220576805003684571", "name": "Andi Andi", "email": "andisariputra8b@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKXMjDDnZ8n5u2kh--_DGVxXEzBKEl1Ws9LMy7x4BAanXxRAg=s96-c", "full_name": "Andi Andi", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKXMjDDnZ8n5u2kh--_DGVxXEzBKEl1Ws9LMy7x4BAanXxRAg=s96-c", "provider_id": "108220576805003684571", "email_verified": true, "phone_verified": false}	\N	2026-06-10 11:14:42.803066+00	2026-06-10 11:43:07.772189+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	021f699b-bfce-4bc1-a01a-474b9d8c98bf	authenticated	authenticated	nadwah23001@mail.unpad.ac.id	$2a$10$Qz5nLJqfITSxrt/B60X7ye3BoPDgvOa1fxgDHfS.3PBxSUlTpoyWG	2026-06-09 13:14:07.041313+00	\N		\N		\N			\N	2026-06-09 15:55:07.397788+00	{"provider": "email", "providers": ["email", "google"]}	{"iss": "https://accounts.google.com", "sub": "105054331689439736856", "name": "NADWAH KHAIRUNNISA", "role": "donor", "email": "nadwah23001@mail.unpad.ac.id", "phone": "0895320631772", "address": "Tangerang", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJr2JEADJulOcMebtX_4cNlmt48D1jGY7dQN2JZ3-uetb87Vg=s96-c", "full_name": "NADWAH KHAIRUNNISA", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJr2JEADJulOcMebtX_4cNlmt48D1jGY7dQN2JZ3-uetb87Vg=s96-c", "provider_id": "105054331689439736856", "custom_claims": {"hd": "mail.unpad.ac.id"}, "email_verified": true, "phone_verified": false}	\N	2026-06-09 13:14:06.995701+00	2026-06-09 15:55:07.415444+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	3d77e2fc-dd8e-4c33-bb51-b0202d3d82ee	authenticated	authenticated	auristelabussiness@gmail.com	$2a$10$lRACcwmdHhpB2JL6CmBPVuRLDDX0rCMuRFdZRJ29wGIJQfwC/Bayq	2026-06-10 09:41:56.335144+00	\N		\N		\N			\N	2026-06-10 09:41:56.339669+00	{"provider": "email", "providers": ["email"]}	{"sub": "3d77e2fc-dd8e-4c33-bb51-b0202d3d82ee", "role": "donor", "email": "auristelabussiness@gmail.com", "phone": "085161615751", "address": "Jl. darma 2 rt 32 kota jambi", "full_name": "Brenda Aouren Tamia", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:41:56.312486+00	2026-06-10 09:41:56.343592+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	ae4bcc8a-3094-4ed9-97d0-846a046aea52	authenticated	authenticated	ghaitsaadia@gmail.com	\N	2026-06-09 13:17:15.255696+00	\N		\N		\N			\N	2026-06-09 13:17:15.258547+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "116221558678453623945", "name": "Ghaitsa Aulia", "email": "ghaitsaadia@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLcwbKrfXKw54kH01GRoEZB9iG6MMQhLSLxhRT4AteqX-3xv_LKDg=s96-c", "full_name": "Ghaitsa Aulia", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLcwbKrfXKw54kH01GRoEZB9iG6MMQhLSLxhRT4AteqX-3xv_LKDg=s96-c", "provider_id": "116221558678453623945", "email_verified": true, "phone_verified": false}	\N	2026-06-09 13:17:15.237696+00	2026-06-09 13:17:15.262448+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	337efcff-35ee-4a55-ac77-2995542022ae	authenticated	authenticated	agnesmonica0465@gmail.com	$2a$10$OkCMfO9zDEKmSykznefoL.2RkD6CmwNLttkLhuBT9.frcTYmw/gn2	2026-06-10 09:48:36.971474+00	\N		\N		\N			\N	2026-06-10 09:48:36.978737+00	{"provider": "email", "providers": ["email"]}	{"sub": "337efcff-35ee-4a55-ac77-2995542022ae", "role": "donor", "email": "agnesmonica0465@gmail.com", "phone": "089652099766", "address": "jambi", "full_name": "Agnes Monica", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:48:36.945099+00	2026-06-10 09:48:36.984557+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	ee1fc5d9-541b-4ee4-948c-c3e15ab36013	authenticated	authenticated	hana.muthia@ui.ac.id	\N	2026-06-09 13:17:40.722894+00	\N		\N		\N			\N	2026-06-09 13:17:40.725503+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "103548275483768707389", "name": "Hana Muthia Yusuf 2306252566", "email": "hana.muthia@ui.ac.id", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKEiuZn1SZpEHA3M7H7Qz5iVgq3Nqr3X71bq9gGPrrk-WrU3g=s96-c", "full_name": "Hana Muthia Yusuf 2306252566", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKEiuZn1SZpEHA3M7H7Qz5iVgq3Nqr3X71bq9gGPrrk-WrU3g=s96-c", "provider_id": "103548275483768707389", "custom_claims": {"hd": "ui.ac.id"}, "email_verified": true, "phone_verified": false}	\N	2026-06-09 13:17:40.709006+00	2026-06-09 13:17:40.728878+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	46f6f92d-39d9-4712-a2b8-73dd74ec44b6	authenticated	authenticated	hanamuthiayusuf@gmail.com	$2a$10$n0rTdBL4xpW0hFL2sP4.Q.oTWo.sejNj5F4W4ba4jVkqz2NWdoZLW	2026-06-09 13:20:05.146479+00	\N		\N		\N			\N	2026-06-09 15:56:20.125163+00	{"provider": "email", "providers": ["email"]}	{"sub": "46f6f92d-39d9-4712-a2b8-73dd74ec44b6", "role": "donor", "email": "hanamuthiayusuf@gmail.com", "full_name": "hana muthia", "email_verified": true, "phone_verified": false}	\N	2026-06-09 13:20:05.129449+00	2026-06-10 04:20:16.422436+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	8f567802-a7ad-4f4f-8534-bdc036b09b97	authenticated	authenticated	kivjo27@gmail.com	$2a$10$HQ1SyiZmILQRgjuPZ00sduBtWhi0xEaSP0JROA0DTHN/XW8Npy3bu	2026-06-09 17:19:02.645542+00	\N		\N		\N			\N	2026-06-10 12:53:58.798664+00	{"provider": "email", "providers": ["email"]}	{"sub": "8f567802-a7ad-4f4f-8534-bdc036b09b97", "role": "donor", "email": "kivjo27@gmail.com", "phone": "082114529853", "full_name": "Kimberly Aureva Johannes", "email_verified": true, "phone_verified": false}	\N	2026-06-09 17:19:02.599238+00	2026-06-26 05:04:17.918269+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	679068fe-5f7b-426f-8bc5-702def6a2380	authenticated	authenticated	ladivaaulia1326@gmail.com	\N	2026-06-09 16:20:42.541207+00	\N		\N		2026-06-09 16:28:37.29459+00			\N	2026-06-10 13:25:12.937447+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "107023484150270075469", "name": "Ladiva Aulia", "email": "ladivaaulia1326@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLv6YVNu9mU6-1mhGUuiaZYhGMMMAYDSXrEp4c2lrjf3_yve54=s96-c", "full_name": "Ladiva Aulia", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLv6YVNu9mU6-1mhGUuiaZYhGMMMAYDSXrEp4c2lrjf3_yve54=s96-c", "provider_id": "107023484150270075469", "email_verified": true, "phone_verified": false}	\N	2026-06-09 16:20:42.488191+00	2026-06-10 13:25:12.946676+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	80d7d392-e7b5-4f75-8ff2-baa2ad3c8e48	authenticated	authenticated	valenciaanjelina@gmail.com	$2a$10$S98FX4ZEJ5Z9SqT5Wqco3O2jr9b6pX7MIypwe.2bXL79vqPWH.tTW	2026-06-10 09:18:16.075331+00	\N		\N		\N			\N	2026-06-10 09:18:16.079198+00	{"provider": "email", "providers": ["email"]}	{"sub": "80d7d392-e7b5-4f75-8ff2-baa2ad3c8e48", "role": "beneficiary", "email": "valenciaanjelina@gmail.com", "full_name": "Valencia Anjelina", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:18:16.067536+00	2026-06-10 09:18:16.082368+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	fe740ebf-30f7-4fe7-a1b8-5757f8113719	authenticated	authenticated	liekotali6@gmail.com	$2a$10$Ft8YsPqbbKR5x.m1Zv9D8ecusQinuy0jDCAM.qiSOrynF9BomJeJO	2026-06-10 09:17:43.3143+00	\N		\N		\N			\N	2026-06-10 09:17:43.329588+00	{"provider": "email", "providers": ["email"]}	{"sub": "fe740ebf-30f7-4fe7-a1b8-5757f8113719", "role": "beneficiary", "email": "liekotali6@gmail.com", "phone": "082269717711", "address": "KONI 1", "full_name": "Kotali", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:17:43.237338+00	2026-06-10 09:17:43.36932+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	c99d71f2-8702-46a0-baf8-c775787f31fa	authenticated	authenticated	bochip19@gmail.com	$2a$10$OfbtDsotOuIiUYlaYfkx1ezqi5WbfKJ47XGvgXGOipgtIxBJP3LRG	2026-06-10 09:22:33.334067+00	\N		\N		\N			\N	2026-06-10 09:22:33.336574+00	{"provider": "email", "providers": ["email"]}	{"sub": "c99d71f2-8702-46a0-baf8-c775787f31fa", "role": "donor", "email": "bochip19@gmail.com", "phone": "089504024715", "address": "Thehok jambi , jambi selatan.", "full_name": "Antoni Lim", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:22:33.32892+00	2026-06-10 09:22:33.338538+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	1018fa47-9476-4f11-b249-b064eb297dec	authenticated	authenticated	jason13lie@gmail.com	$2a$10$lyqOvxDbmj6PFNLH68Vv1ul/4b/RkQmIj3zwGdqO8OGJZh7//i.I2	2026-06-10 09:38:44.117599+00	\N		\N		\N			\N	2026-06-10 09:38:44.120995+00	{"provider": "email", "providers": ["email"]}	{"sub": "1018fa47-9476-4f11-b249-b064eb297dec", "role": "donor", "email": "jason13lie@gmail.com", "full_name": "Jason Lie", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:38:44.093695+00	2026-06-10 09:38:44.128517+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	b0a93dd4-8d79-4eea-bef9-d8e13bf54a46	authenticated	authenticated	aliciahuang05@gmail.com	\N	2026-06-10 09:19:41.609904+00	\N		\N		2026-06-10 09:24:21.644811+00			\N	2026-06-10 09:25:08.617903+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "106965379152356551841", "name": "Alicia Huang", "email": "aliciahuang05@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocIHjDFOwD2IVDX2ACurSXpvUO9XZ7wEmYBuIIIYmEOnAvovOg=s96-c", "full_name": "Alicia Huang", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocIHjDFOwD2IVDX2ACurSXpvUO9XZ7wEmYBuIIIYmEOnAvovOg=s96-c", "provider_id": "106965379152356551841", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:19:41.603524+00	2026-06-10 09:25:08.620906+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	357bd5bf-909d-4317-83a5-556c926ed56a	authenticated	authenticated	devittaasarii04@gmail.com	$2a$10$bLo0AtCXf9kPMb8qSxJF7.I7kj14Ha6jlMU0BRqovkt5p.yfk12JK	2026-06-10 09:20:16.042137+00	\N		\N		\N			\N	2026-06-10 09:20:16.044733+00	{"provider": "email", "providers": ["email"]}	{"sub": "357bd5bf-909d-4317-83a5-556c926ed56a", "role": "donor", "email": "devittaasarii04@gmail.com", "phone": "085266689551", "address": "Jambi", "full_name": "Devita", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:20:16.036848+00	2026-06-10 09:20:16.046515+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	d50ed1f1-04be-4b0e-9b8c-16ddfd4606ce	authenticated	authenticated	lolkotali@gmail.com	$2a$10$bfL6Mt4CoRrmuVyEdjJY8eiSf7JRBmSmS1P8EptW5rYM3/q2a4Xlm	2026-06-10 09:22:21.188081+00	\N		\N		\N			\N	2026-06-10 09:22:21.192069+00	{"provider": "email", "providers": ["email"]}	{"sub": "d50ed1f1-04be-4b0e-9b8c-16ddfd4606ce", "role": "donor", "email": "lolkotali@gmail.com", "full_name": "Kotali", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:22:21.169884+00	2026-06-10 09:22:21.195357+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	0aa32472-f539-4888-ab3f-db23cb4e5743	authenticated	authenticated	candragaul1122@gmail.com	$2a$10$igVjJ.apsf5VMpEsVE8UqOYePxRDyXhjkLAjNUib3VJZhYNsGqS9G	2026-06-10 09:23:55.993927+00	\N		\N		\N			\N	2026-06-10 09:23:55.999614+00	{"provider": "email", "providers": ["email"]}	{"sub": "0aa32472-f539-4888-ab3f-db23cb4e5743", "role": "donor", "email": "candragaul1122@gmail.com", "full_name": "Candra ", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:23:55.963677+00	2026-06-10 09:23:56.006985+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	1faefcbe-4492-4063-88ae-45ea76cbe2fb	authenticated	authenticated	vaneshatania3@gmail.com	\N	2026-06-10 09:19:13.231369+00	\N		\N		\N			\N	2026-06-10 09:31:20.589421+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "103572714365743012136", "name": "Vanesha Tania", "email": "vaneshatania3@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocIuVhPc0eACqy97xgz7XBQ3bCu1up6YPHzSj32dZifbOshdVA=s96-c", "full_name": "Vanesha Tania", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocIuVhPc0eACqy97xgz7XBQ3bCu1up6YPHzSj32dZifbOshdVA=s96-c", "provider_id": "103572714365743012136", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:19:13.220469+00	2026-06-10 09:31:20.595532+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	0419ba30-33ce-40c0-bd61-31cfc233a271	authenticated	authenticated	viryyy0265@gmail.com	$2a$10$VheGFHIpRkrE48isn5HS.O1UZYAOVo3GvPhZM1KDI4ArS23v9cPC.	2026-06-10 09:25:02.547829+00	\N		\N		\N			\N	2026-06-10 09:25:02.561712+00	{"provider": "email", "providers": ["email"]}	{"sub": "0419ba30-33ce-40c0-bd61-31cfc233a271", "role": "vendor", "email": "viryyy0265@gmail.com", "phone": "082184636475", "full_name": "Virly", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:25:02.533633+00	2026-06-10 09:25:02.566631+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	b095701a-f443-489d-a0c6-4a3a15ee9bdb	authenticated	authenticated	aliciahuang359@gmail.com	$2a$10$qO.v78yQd9uYTWPl5WuV4uNJz3T2wYWFdd6GdtJfukP/.WZ1XzFwS	2026-06-10 09:26:46.694815+00	\N		\N		\N			\N	2026-06-10 09:26:46.698742+00	{"provider": "email", "providers": ["email"]}	{"sub": "b095701a-f443-489d-a0c6-4a3a15ee9bdb", "role": "beneficiary", "email": "aliciahuang359@gmail.com", "phone": "085891556089", "full_name": "Alicia", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:26:46.685003+00	2026-06-10 09:26:46.701194+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	82147428-e16e-4ed8-9f62-bd5353a1b288	authenticated	authenticated	edbertjonathan257@gmail.com	$2a$10$lq/EUQUxXq.KrFuka1ODw.3X.JfuO3fa/SQtMK3mjGqfEyUG3u4KO	2026-06-10 09:29:13.208695+00	\N		\N		\N			\N	2026-06-10 09:29:13.212136+00	{"provider": "email", "providers": ["email"]}	{"sub": "82147428-e16e-4ed8-9f62-bd5353a1b288", "role": "beneficiary", "email": "edbertjonathan257@gmail.com", "full_name": "Edbert Jonathan Lay", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:29:13.192958+00	2026-06-10 09:29:13.21477+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	cd1f70bd-2086-4681-8437-b7c94c751791	authenticated	authenticated	anglelikacd@gmail.com	\N	2026-06-10 09:55:04.06059+00	\N		\N		\N			\N	2026-06-10 09:55:40.466073+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "104756530756440027519", "name": "Anglelika cd", "email": "anglelikacd@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJ8nW3_VokdYhPTnOcYCHRSJv5syR9_s8i81WBx6YwCSVR1vg=s96-c", "full_name": "Anglelika cd", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJ8nW3_VokdYhPTnOcYCHRSJv5syR9_s8i81WBx6YwCSVR1vg=s96-c", "provider_id": "104756530756440027519", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:55:04.052209+00	2026-06-10 09:55:40.468021+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	8c398068-8879-4103-a677-814f137b8289	authenticated	authenticated	violinpatricia56@gmail.com	$2a$10$UIALCK0VnKK31WuI6zNrauN1mh4bf./SPEPaPfJjyLl0roa2CxZvq	2026-06-10 09:53:28.492986+00	\N		\N		\N			\N	2026-06-10 09:53:28.496294+00	{"provider": "email", "providers": ["email"]}	{"sub": "8c398068-8879-4103-a677-814f137b8289", "role": "donor", "email": "violinpatricia56@gmail.com", "phone": "0895620032921", "address": "jln kol pol", "full_name": "Violin Patrigia", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:53:28.487928+00	2026-06-10 09:53:28.498179+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	ed8b3b62-a4a1-4125-803d-af3312d3d642	authenticated	authenticated	jujuangga7@gmail.com	$2a$10$ojttBcGbcECY.6jVSYi8pu7SWQ65J5Ppm67e7Yj890dSt/D7i9X0i	2026-06-10 10:05:30.713672+00	\N		\N		\N			\N	2026-06-10 10:05:30.718475+00	{"provider": "email", "providers": ["email"]}	{"sub": "ed8b3b62-a4a1-4125-803d-af3312d3d642", "role": "beneficiary", "email": "jujuangga7@gmail.com", "phone": "082213100524", "address": "Kota jambi", "full_name": "Juanda Anggara", "email_verified": true, "phone_verified": false}	\N	2026-06-10 10:05:30.685254+00	2026-06-10 10:05:30.723821+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	0cfe9a0e-da21-4ad4-9e40-2b1fb4179c8a	authenticated	authenticated	caroline123115@gmail.com	\N	2026-06-10 09:50:52.396772+00	\N		\N		2026-06-10 09:56:54.817584+00			\N	2026-06-10 09:57:05.646218+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "107845089820842100678", "name": "caroline 1", "email": "caroline123115@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJUgiDNsCt8MbgAXi_Y4rL5yV2Om0sa9pKxgkWMHPjsFh3lOvY=s96-c", "full_name": "caroline 1", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJUgiDNsCt8MbgAXi_Y4rL5yV2Om0sa9pKxgkWMHPjsFh3lOvY=s96-c", "provider_id": "107845089820842100678", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:50:52.38809+00	2026-06-10 09:57:05.650334+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	a133c0c6-5c0e-43fd-bc17-f8a234272acb	authenticated	authenticated	kevinevanlone22@gmail.com	$2a$10$O0L3rLA3g5d2kv2ZkGuSM.8N0VMDtHH8Bx56jCJtRQJMYIfbRBaWe	2026-06-10 09:53:23.549554+00	\N		\N		\N			\N	2026-06-10 09:53:23.553476+00	{"provider": "email", "providers": ["email"]}	{"sub": "a133c0c6-5c0e-43fd-bc17-f8a234272acb", "role": "donor", "email": "kevinevanlone22@gmail.com", "full_name": "kevin evanlone", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:53:23.535073+00	2026-06-10 09:53:23.55733+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	9ad88462-8f92-4291-a90b-805dba849619	authenticated	authenticated	blueflarefox02@gmail.com	\N	2026-06-10 09:53:55.262642+00	\N		\N		\N			\N	2026-06-10 09:53:55.265227+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "108460020138259535328", "name": "blue flare fox", "email": "blueflarefox02@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJqCKjw_ow1QTKkZdcS5kOdcoQzCyBpY65dbvhU6bXbArptE94=s96-c", "full_name": "blue flare fox", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJqCKjw_ow1QTKkZdcS5kOdcoQzCyBpY65dbvhU6bXbArptE94=s96-c", "provider_id": "108460020138259535328", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:53:55.247714+00	2026-06-10 09:53:55.268255+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	fbbcd506-dd25-4818-a9d3-83bc7ce032b1	authenticated	authenticated	oveliaangesti@gmail.com	$2a$10$RviXnVeZj9MEqGanZ/JgOuPG4E5b1IQujpBvfHHrMQH7D9dA48LSK	2026-06-10 10:00:07.194652+00	\N		\N		\N			\N	2026-06-10 10:00:07.19789+00	{"provider": "email", "providers": ["email"]}	{"sub": "fbbcd506-dd25-4818-a9d3-83bc7ce032b1", "role": "donor", "email": "oveliaangesti@gmail.com", "phone": "0887437573208", "full_name": "Ovelia", "email_verified": true, "phone_verified": false}	\N	2026-06-10 10:00:07.187753+00	2026-06-10 10:00:07.200573+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	b460f35e-b398-4275-b71a-cfee0ffbb683	authenticated	authenticated	audysrihapsari01@gmail.com	$2a$10$mSUHKvNGOC3lfhbPwzmGWub72g3fasvqHPum4pyisJaAcF5pLjRwa	2026-06-10 09:59:51.015212+00	\N		\N		\N			\N	2026-06-10 09:59:51.020152+00	{"provider": "email", "providers": ["email"]}	{"sub": "b460f35e-b398-4275-b71a-cfee0ffbb683", "role": "donor", "email": "audysrihapsari01@gmail.com", "full_name": "audy sri hapsari ", "email_verified": true, "phone_verified": false}	\N	2026-06-10 09:59:50.990813+00	2026-06-10 09:59:51.024225+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	ff0b961d-76d2-46f7-a245-82a4761d00e6	authenticated	authenticated	emailbalcek@gmail.com	$2a$10$s0DZ6tmNAGa/zk6skf5duehWdpPcJWvjmtqQv4ES1clgcBCbMyvIO	2026-06-10 10:00:50.993387+00	\N		\N		\N			\N	2026-06-10 10:00:50.996514+00	{"provider": "email", "providers": ["email"]}	{"sub": "ff0b961d-76d2-46f7-a245-82a4761d00e6", "role": "donor", "email": "emailbalcek@gmail.com", "full_name": "Caroline", "email_verified": true, "phone_verified": false}	\N	2026-06-10 10:00:50.988676+00	2026-06-10 10:00:51.002489+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	a4161fa7-0657-4037-ba49-33cb3b02b9cc	authenticated	authenticated	lielyanislouis@gmail.com	$2a$10$Cmyc8DEEp.yFcbIf.WfdyOFIV.tOsnQF75qIZoImG3PYpyub3ZWi2	2026-06-10 10:07:31.130874+00	\N		\N		\N			\N	2026-06-10 10:07:31.1377+00	{"provider": "email", "providers": ["email"]}	{"sub": "a4161fa7-0657-4037-ba49-33cb3b02b9cc", "role": "donor", "email": "lielyanislouis@gmail.com", "full_name": "Lielyani saputri louis", "email_verified": true, "phone_verified": false}	\N	2026-06-10 10:07:31.092819+00	2026-06-12 17:53:46.360561+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	10fcb99b-b830-4a2e-b35a-9979f9106c67	authenticated	authenticated	desiyulistiani2019@gmail.com	$2a$10$t4XK6KwsEecqc/oXBgiH8e59ksCcV58elodM/6KOEo6w3KuQvTHIC	2026-06-10 11:01:30.364168+00	\N		\N		\N			\N	2026-06-10 11:01:30.384084+00	{"provider": "email", "providers": ["email"]}	{"sub": "10fcb99b-b830-4a2e-b35a-9979f9106c67", "role": "donor", "email": "desiyulistiani2019@gmail.com", "full_name": "Desi Yulistiani", "email_verified": true, "phone_verified": false}	\N	2026-06-10 11:01:30.29652+00	2026-06-14 08:30:30.397413+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	1238aed7-bb4f-4008-9ed9-c8db00aaaca1	authenticated	authenticated	rianapriansha19@gmail.com	\N	2026-06-10 10:14:24.12803+00	\N		\N		\N			\N	2026-06-10 10:15:41.34049+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "115764405819703444700", "name": "Rian apriansha jayalie", "email": "rianapriansha19@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKnCtUVN_K7gtEp0W04wh-wzNMQthDjg6OXP3fv5WVPy9LvNg=s96-c", "full_name": "Rian apriansha jayalie", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKnCtUVN_K7gtEp0W04wh-wzNMQthDjg6OXP3fv5WVPy9LvNg=s96-c", "provider_id": "115764405819703444700", "email_verified": true, "phone_verified": false}	\N	2026-06-10 10:14:24.10907+00	2026-06-10 10:15:41.346659+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	d9ed441b-47a9-436d-bab9-4cb3e1499e18	authenticated	authenticated	lielyanaslouis@gmail.com	\N	2026-06-10 10:09:31.706126+00	\N		\N		\N			\N	2026-06-10 10:12:48.532705+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "115892088147175431728", "name": "Lielyana Saputri Louis", "email": "lielyanaslouis@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJKfU8iuNl259CXzROPfZHhwwnHb_pLUbN_vzbagyHQ5Us3wpvg=s96-c", "full_name": "Lielyana Saputri Louis", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJKfU8iuNl259CXzROPfZHhwwnHb_pLUbN_vzbagyHQ5Us3wpvg=s96-c", "provider_id": "115892088147175431728", "email_verified": true, "phone_verified": false}	\N	2026-06-10 10:09:31.679959+00	2026-06-10 10:12:48.538323+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	793040a4-f4ed-4e82-99fc-8cb492ded4c1	authenticated	authenticated	ferdydanuarta05@gmail.com	$2a$10$cLUEcyWXbf5F8BbXaXHaL.60UHk6FJYzDgkLdHTJFadWpRtAtD2ae	2026-06-10 10:26:19.890037+00	\N		\N		\N			\N	2026-06-10 10:28:36.263002+00	{"provider": "email", "providers": ["email", "google"]}	{"iss": "https://accounts.google.com", "sub": "102564699094453384549", "name": "Ferdy Danuarta", "role": "beneficiary", "email": "ferdydanuarta05@gmail.com", "phone": "088276208297", "address": "Jl.barau-barau 1", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKvePK21IZMDd8d4P4pNSla15hFLOkmD9epYQhi_HwWXRF1bX4=s96-c", "full_name": "Ferdy Danuarta", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKvePK21IZMDd8d4P4pNSla15hFLOkmD9epYQhi_HwWXRF1bX4=s96-c", "provider_id": "102564699094453384549", "email_verified": true, "phone_verified": false}	\N	2026-06-10 10:26:19.867636+00	2026-06-10 10:28:36.267641+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	b18e30f5-1ba2-4697-a602-12b89d2473cd	authenticated	authenticated	ferdydanuarta899@gmail.com	$2a$10$m2X3w1XeDOsja7h9VSRhSes.2QPH.fN5A8O/hE2Keal9taidRRh0a	2026-06-10 10:30:49.414538+00	\N		\N		\N			\N	2026-06-10 10:30:49.42168+00	{"provider": "email", "providers": ["email"]}	{"sub": "b18e30f5-1ba2-4697-a602-12b89d2473cd", "role": "beneficiary", "email": "ferdydanuarta899@gmail.com", "phone": "088276208297", "address": "Jl.barau-barau 1", "full_name": "Ferdy Danuarta ", "email_verified": true, "phone_verified": false}	\N	2026-06-10 10:30:49.386484+00	2026-06-10 10:30:49.428449+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	438671de-205c-4083-8610-cbf138757f36	authenticated	authenticated	dystysalsa@gmail.com	$2a$10$aJ6Wi/1M.ONdKAD.q.FTNeW.k/RAp6vU5dEtJpJG0EZSc5MigL37K	2026-06-10 11:14:19.593114+00	\N		\N		\N			\N	2026-06-10 11:14:19.600715+00	{"provider": "email", "providers": ["email"]}	{"sub": "438671de-205c-4083-8610-cbf138757f36", "role": "vendor", "email": "dystysalsa@gmail.com", "phone": "083846143551", "full_name": "Dyesty Salsazilla", "email_verified": true, "phone_verified": false}	\N	2026-06-10 11:14:19.56162+00	2026-06-10 11:14:19.607755+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	ccaaf342-c293-485b-b064-7d9f2cd42b22	authenticated	authenticated	jasperimanuel6@gmail.com	$2a$10$pKwK5SPSUOZwJSvX75lSxeSoG2/TiDuZOeQ3tOvpWEgQ1eNMTgccO	2026-06-10 11:36:30.166078+00	\N		\N		\N			\N	2026-06-10 11:36:30.169557+00	{"provider": "email", "providers": ["email"]}	{"sub": "ccaaf342-c293-485b-b064-7d9f2cd42b22", "role": "vendor", "email": "jasperimanuel6@gmail.com", "phone": "08521036321", "address": "-", "full_name": "Jasper Imanuel", "email_verified": true, "phone_verified": false}	\N	2026-06-10 11:36:30.158594+00	2026-06-10 11:36:30.172293+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	177b1fa3-0207-4b0a-9cac-450029fe8ac7	authenticated	authenticated	syarifuddin046@gmail.com	\N	2026-06-10 11:21:09.597725+00	\N		\N		\N			\N	2026-06-10 11:21:09.602531+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "106879713471666280012", "name": "syarif fuddin", "email": "syarifuddin046@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKCPnzqc3j-yZcIEcEdnZnXukf2mK3S8cHr3nLjNlkOKsKycE4=s96-c", "full_name": "syarif fuddin", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKCPnzqc3j-yZcIEcEdnZnXukf2mK3S8cHr3nLjNlkOKsKycE4=s96-c", "provider_id": "106879713471666280012", "email_verified": true, "phone_verified": false}	\N	2026-06-10 11:21:09.575101+00	2026-06-10 11:21:09.609697+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	d49baa2e-a538-4ce8-90df-7135af799445	authenticated	authenticated	milhamsyahr01@gmail.com	$2a$10$jyLpVqP7UVzMcE26Z6v7gea10fORwg.FV6qJPWvUMjJIy2FKST9rC	2026-06-10 11:35:53.633165+00	\N		\N		\N			\N	2026-06-10 11:35:53.63697+00	{"provider": "email", "providers": ["email"]}	{"sub": "d49baa2e-a538-4ce8-90df-7135af799445", "role": "beneficiary", "email": "milhamsyahr01@gmail.com", "phone": "081111111111", "address": "jambi", "full_name": "ilham", "email_verified": true, "phone_verified": false}	\N	2026-06-10 11:35:53.610421+00	2026-06-10 11:35:53.640586+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	8dd61c30-5521-431a-bebb-bbb676a73133	authenticated	authenticated	milhamsyahr07@gmail.com	$2a$10$4YIrTgrN/px4hnqvT1etYeDsREeXYhpes6KwFwRDlNieWW971DQLe	2026-06-10 11:28:05.999561+00	\N		\N		\N			\N	2026-06-10 11:34:21.381135+00	{"provider": "email", "providers": ["email"]}	{"sub": "8dd61c30-5521-431a-bebb-bbb676a73133", "role": "donor", "email": "milhamsyahr07@gmail.com", "phone": "082180713368", "address": "Jambi", "full_name": "ilham", "email_verified": true, "phone_verified": false}	\N	2026-06-10 11:28:05.968083+00	2026-06-10 11:34:21.395417+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	9a75328c-61d5-4768-85e5-9269775ca623	authenticated	authenticated	milhamsyahr02@gmail.com	$2a$10$KEp/FWR0lNSUIYCE8.6RwOs5Zzu4XiiDUBT3uzPPwdWl4A1eJJxxO	2026-06-10 11:37:26.61447+00	\N		\N		\N			\N	2026-06-10 11:37:26.622257+00	{"provider": "email", "providers": ["email"]}	{"sub": "9a75328c-61d5-4768-85e5-9269775ca623", "role": "vendor", "email": "milhamsyahr02@gmail.com", "phone": "08222222222", "address": "jambi", "full_name": "ilham", "email_verified": true, "phone_verified": false}	\N	2026-06-10 11:37:26.588603+00	2026-06-10 11:37:26.626432+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	4086843e-872a-4a4b-8d3b-c332544ae077	authenticated	authenticated	ssariputraaandi@gmail.com	\N	2026-06-10 11:52:40.815768+00	\N		\N		\N			\N	2026-06-10 11:52:40.820597+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "102920213433449213617", "name": "Aandi Ssariputra", "email": "ssariputraaandi@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLNvzkvPNd2XWqs95hs_B4xCZA8v49LncD0nkq7Kiz7NtE8kw=s96-c", "full_name": "Aandi Ssariputra", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLNvzkvPNd2XWqs95hs_B4xCZA8v49LncD0nkq7Kiz7NtE8kw=s96-c", "provider_id": "102920213433449213617", "email_verified": true, "phone_verified": false}	\N	2026-06-10 11:52:40.795251+00	2026-06-10 11:52:40.826869+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	10510d96-7171-4b5a-8ca0-b7090f8d6f58	authenticated	authenticated	armandoqiu154@gmail.com	$2a$10$LvJWa.tRGQjgVoPupsTaCeNMUMbZMhZdlj26gqDwTLqmSY/6eYtuu	2026-06-10 13:52:18.644846+00	\N		\N		\N			\N	2026-06-10 13:52:18.650716+00	{"provider": "email", "providers": ["email"]}	{"sub": "10510d96-7171-4b5a-8ca0-b7090f8d6f58", "role": "donor", "email": "armandoqiu154@gmail.com", "phone": "085268021972", "full_name": "Armando Qiu", "email_verified": true, "phone_verified": false}	\N	2026-06-10 13:52:18.613036+00	2026-06-11 03:13:03.095446+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	b1d26638-7b8d-41ef-b98e-066637aea3f4	authenticated	authenticated	armandoqiu9313@gmail.com	\N	2026-06-10 13:50:10.957605+00	\N		\N		\N			\N	2026-06-10 13:50:10.965208+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "114985003469822960772", "name": "Armando Qiu", "email": "armandoqiu9313@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKh958bnd2rGmuvjWqGNdh7nedyqqWhRuWedNZLaHZVSHUWKDcc=s96-c", "full_name": "Armando Qiu", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKh958bnd2rGmuvjWqGNdh7nedyqqWhRuWedNZLaHZVSHUWKDcc=s96-c", "provider_id": "114985003469822960772", "email_verified": true, "phone_verified": false}	\N	2026-06-10 13:50:10.926454+00	2026-06-10 13:50:10.975605+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	7a1ee006-f94b-463b-9d47-f99241469e24	authenticated	authenticated	demovendor@gmail.com	$2a$10$AmrimfBjkXw7lYXjJpWlneLqeEtDl3gxQ8DvuFDKATilCB/r0m/9i	2026-06-10 13:28:42.849415+00	\N		\N		\N			\N	2026-06-10 13:28:42.859408+00	{"provider": "email", "providers": ["email"]}	{"sub": "7a1ee006-f94b-463b-9d47-f99241469e24", "role": "vendor", "email": "demovendor@gmail.com", "phone": "081311808604", "full_name": "Ladiva", "email_verified": true, "phone_verified": false}	\N	2026-06-10 13:28:42.800137+00	2026-06-10 13:28:42.865169+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	d1e35067-6977-41c5-aeac-2d7b183dca75	authenticated	authenticated	alifahadilah106@gmail.com	\N	2026-06-10 18:55:54.449692+00	\N		\N		\N			\N	2026-06-10 19:03:57.192362+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "113723493935695165544", "name": "alifah adilah", "email": "alifahadilah106@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJt1jHYzjgDJJSXR0CTcLvesgE1PpEnezmRCoZGObD7GYMJ8Q=s96-c", "full_name": "alifah adilah", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJt1jHYzjgDJJSXR0CTcLvesgE1PpEnezmRCoZGObD7GYMJ8Q=s96-c", "provider_id": "113723493935695165544", "email_verified": true, "phone_verified": false}	\N	2026-06-10 18:55:54.378848+00	2026-06-10 19:03:57.197698+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	fde7163c-0c71-4899-8fca-cefe928c121b	authenticated	authenticated	alifahjambi123@gmail.com	$2a$10$2OkYFhlc.GxUqrYKBdvoJe/HOyF732l/C1qKHyLYVoaJEvt4bNiq6	2026-06-10 18:58:39.429553+00	\N		\N		\N			\N	2026-06-10 19:00:24.064939+00	{"provider": "email", "providers": ["email", "google"]}	{"iss": "https://accounts.google.com", "sub": "112177835752991544438", "name": "Alifah Adilah", "role": "beneficiary", "email": "alifahjambi123@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLPhVmeYOX1qsuMemlAUuK13t6qz5pPn1jz7lazgRYrm3EVHLM=s96-c", "full_name": "Alifah Adilah", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLPhVmeYOX1qsuMemlAUuK13t6qz5pPn1jz7lazgRYrm3EVHLM=s96-c", "provider_id": "112177835752991544438", "email_verified": true, "phone_verified": false}	\N	2026-06-10 18:58:39.415016+00	2026-06-10 19:00:24.067503+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.webauthn_challenges (id, user_id, challenge_type, session_data, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.webauthn_credentials (id, user_id, credential_id, public_key, attestation_type, aaguid, sign_count, transports, backup_eligible, backed_up, friendly_name, created_at, updated_at, last_used_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: -
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 741, true);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict kOvsyGSkS22WXpGhsrcpmjiGmt5otoOQ8lAh681hXFYfJyQpPs6U890fqrRyAss

