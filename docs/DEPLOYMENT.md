# Deployment guide

SeribuAsa is a monorepo: deploy the FastAPI backend to Railway first, then deploy
the Vite frontend to Vercel. Environment files are intentionally ignored by Git;
configure their values in each provider's dashboard.

## 1. Rotate exposed credentials

Before the next production deployment, rotate the Supabase service-role key and
database password. Older repository history contained deployment credentials, so
removing them from the current source tree is not enough. Also change the demo
user password if those users exist. Do not place replacement values in Git.

## 2. Railway backend

Create a service from this repository with these settings:

- Root Directory: `/apps/backend`
- Config file path: `/apps/backend/railway.json`
- Builder: Dockerfile (defined by `railway.json`)
- Public Networking: enabled; generate a Railway domain
- Healthcheck: `/health` (defined by `railway.json`)

Railway has announced that legacy Config as Code files will stop applying to
legacy services on December 1, 2026. Mirror the builder, healthcheck, restart, and
watch-path settings in Railway's service configuration when migrating to its
Infrastructure as Code flow.

Set these service variables using real values, not the examples:

| Variable                 | Required production value                                     |
| ------------------------ | ------------------------------------------------------------- |
| `DATABASE_URL`           | Supabase PostgreSQL connection string                         |
| `SUPABASE_URL`           | Supabase project URL                                          |
| `SUPABASE_ANON_KEY`      | Current Supabase publishable/anon key                         |
| `SUPABASE_SERVICE_KEY`   | Newly rotated service-role key                                |
| `MIDTRANS_SERVER_KEY`    | Midtrans server key for the selected environment              |
| `MIDTRANS_CLIENT_KEY`    | Matching Midtrans client key                                  |
| `MIDTRANS_IS_PRODUCTION` | `true` only when using production Midtrans keys               |
| `CORS_ORIGINS`           | Comma-separated Vercel/custom frontend origins, without paths |
| `DEV_MODE`               | `false`                                                       |
| `TEST_MODE`              | `false`                                                       |

`PORT` is injected by Railway and must not be hard-coded. `JWT_SECRET_KEY` is not
currently used by the Supabase authentication path; if custom JWT support is
enabled later, set it to a newly generated random secret.

After deployment, verify both endpoints:

```text
https://<railway-domain>/health
https://<railway-domain>/docs
```

The health endpoint must return HTTP 200 before continuing.

## 3. Vercel frontend

Import the same repository into a Vercel project and set:

- Framework Preset: Vite
- Root Directory: `apps/frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Node.js: 20 or newer

Configure all variables for Production and Preview as appropriate:

| Variable                        | Required value                                    |
| ------------------------------- | ------------------------------------------------- |
| `VITE_SUPABASE_URL`             | Same Supabase project URL used by the backend     |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable/anon key, never the service-role key  |
| `VITE_API_BASE_URL`             | `https://<railway-domain>/api/v1`                 |
| `VITE_MIDTRANS_CLIENT_KEY`      | Client key matching backend Midtrans mode         |
| `VITE_MIDTRANS_IS_PRODUCTION`   | Same mode as `MIDTRANS_IS_PRODUCTION`             |
| `VITE_SUPABASE_STORAGE_BUCKET`  | `nutriguard-uploads` unless intentionally changed |

The production build fails early when a required frontend value is missing or is
still a placeholder. After changing a Vercel variable, redeploy so it is embedded
in the Vite bundle.

## 4. Final verification

1. Add the final Vercel domain and custom domain to Railway `CORS_ORIGINS`.
2. Redeploy Railway after changing CORS variables.
3. Redeploy Vercel after setting `VITE_API_BASE_URL`.
4. Open the browser network panel and confirm API requests target the new Railway
   domain and receive successful responses.
5. Test authentication, one read flow, and one write flow with non-production
   payment credentials before enabling Midtrans production mode.

Never upload `.env`, `.env.production`, or `.env.railway` to Git. Treat them as
local references only and keep dashboard variables as the deployment source of
truth.

Deployments are provider-managed: connect `main` in the Vercel and Railway Git
integrations. GitHub Actions only validates the source; it does not store provider
tokens or duplicate deployments through a separate SSH pipeline.
