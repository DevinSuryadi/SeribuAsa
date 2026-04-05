# Deployment Guide

## Architecture

| Component | Platform | Purpose |
|-----------|----------|---------|
| **Frontend** | Vercel | React SPA hosting, automatic deployments |
| **Backend** | Render or Railway | FastAPI API server |
| **Database + Auth** | Supabase | PostgreSQL, authentication, real-time |

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │     │      Backend     │     │     Supabase    │
│    (Vercel)     │────▶│ (Render/Railway) │────▶│  (DB + Auth)    │
│  React + Vite   │     │   FastAPI        │     │  PostgreSQL     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
     HTTPS                    HTTPS                    HTTPS
```

---

## CI/CD Pipeline

### GitHub Actions Workflows

| Workflow | File | Triggers |
|----------|------|----------|
| Backend CI | `.github/workflows/ci-backend.yml` | Push/PR to main, staging, feature/* |
| Frontend CI | `.github/workflows/ci-frontend.yml` | Push/PR to main, staging, feature/* |

### Pipeline Stages

**Backend CI:** Ruff lint → Mypy type check → Pytest with coverage  
**Frontend CI:** ESLint → Vitest unit tests

### Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `staging` | Integration branch for features |
| `feature/*` | Feature development branches |

Use Conventional Commits: `feat(scope): description`, `fix(scope): description`

---

## 1. Supabase Setup (Database + Auth)

### Prerequisites
- Supabase project created at https://supabase.com
- Project URL and keys available in Settings > API

### Run Migrations

```bash
# Via Supabase CLI
supabase db push

# Or manually in Supabase Dashboard > SQL Editor
# Copy contents of apps/supabase/migrations/*.sql
```

### Required Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (auto-created on signup) |
| `user_roles` | Role assignments (donor, beneficiary, vendor, admin) |
| `donations` | Donation records |
| `vouchers` | E-voucher records |
| `voucher_redemptions` | Redemption tracking |
| `products` | Product catalog |
| `categories` | Product categories |
| `orders` | Order records |
| `order_items` | Order line items |
| `settlements` | Vendor settlement records |
| `fies_surveys` | FIES survey responses |
| `nutrition_measurements` | Child growth measurements |
| `children` | Child records |

### Auth Configuration

1. Go to **Authentication > Providers**
2. Enable **Email** provider
3. (Optional) Enable email confirmation
4. Ensure `handle_new_user()` trigger is active (auto-creates profiles on signup)

### Get Your Credentials

| Variable | Where to Find |
|----------|---------------|
| `SUPABASE_URL` | Settings > API > Project URL |
| `SUPABASE_ANON_KEY` | Settings > API > anon public key |
| `SUPABASE_SERVICE_KEY` | Settings > API > service_role key |
| `DATABASE_URL` | Settings > Database > Connection string |

---

## 2. Backend Deployment (Render)

### Option A: Render

1. **Connect Repository**
   - Go to https://render.com → New Web Service
   - Connect your GitHub repository
   - Select branch: `main`

2. **Configure Service**
   - **Root Directory:** `apps/backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment:** Python 3

3. **Add Environment Variables**

| Variable | Value |
|----------|-------|
| `DEV_MODE` | `false` |
| `DATABASE_URL` | `postgresql://...` (from Supabase) |
| `SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` |
| `SUPABASE_ANON_KEY` | Your anon key |
| `SUPABASE_SERVICE_KEY` | Your service key |
| `JWT_SECRET_KEY` | Generate a strong random key (min 32 chars) |
| `CORS_ORIGINS` | `https://your-vercel-domain.vercel.app` |

4. **Deploy**
   - Click "Create Web Service"
   - Note the deployed URL (e.g., `https://nutriguard-api.onrender.com`)

### Option B: Railway

1. **Connect Repository**
   - Go to https://railway.app → New Project → Deploy from GitHub
   - Select your repository

2. **Configure**
   - **Root Directory:** `apps/backend`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Add environment variables (same as Render above)

3. **Deploy**
   - Railway auto-detects Python and installs requirements
   - Note the deployed URL

---

## 3. Frontend Deployment (Vercel)

1. **Connect Repository**
   - Go to https://vercel.com → New Project
   - Import your GitHub repository
   - Select branch: `main`

2. **Configure Build**
   - **Framework Preset:** Vite
   - **Root Directory:** `apps/frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

3. **Add Environment Variables**

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your anon public key |
| `VITE_API_URL` | `https://your-backend.onrender.com/api/v1` |

4. **Update API Base URL**
   - Edit `apps/frontend/src/services/api.ts` to use environment variable:
   ```ts
   const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
   ```

5. **Deploy**
   - Click "Deploy"
   - Vercel provides a URL (e.g., `https://your-app.vercel.app`)

---

## 4. Post-Deployment Checklist

### Backend
- [ ] Health check returns 200: `GET https://your-backend.onrender.com/health`
- [ ] API docs accessible: `GET https://your-backend.onrender.com/docs`
- [ ] CORS allows frontend domain
- [ ] `DEV_MODE=false` (disable mock auth in production)

### Frontend
- [ ] App loads without errors
- [ ] Login/Register works with Supabase Auth
- [ ] API calls reach backend successfully
- [ ] Demo buttons still work (if `DEV_MODE=true` on backend for staging)

### Supabase
- [ ] All migrations applied
- [ ] Auth email provider enabled
- [ ] RLS policies active on all tables
- [ ] `handle_new_user()` trigger working

---

## Environment Variables Summary

### Backend (Render/Railway)

```env
DEV_MODE=false
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET_KEY=strong-random-secret-min-32-chars
CORS_ORIGINS=https://your-app.vercel.app
```

### Frontend (Vercel)

```env
VITE_SUPABASE_URL=https://PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_API_URL=https://your-backend.onrender.com/api/v1
```

---

## Staging vs Production

| Environment | Backend URL | Frontend URL | DEV_MODE |
|-------------|-------------|--------------|----------|
| **Local** | `http://localhost:8000` | `http://localhost:5173` | `true` |
| **Staging** | staging backend URL | staging Vercel URL | `true` |
| **Production** | production backend URL | production Vercel URL | `false` |

### Deploying to Staging

```bash
git push origin staging
# Render/Railway: auto-deploys from staging branch
# Vercel: configure preview deployments or staging environment
```

### Promoting to Production

```bash
git checkout main
git merge staging
git push origin main
# All platforms auto-deploy from main branch
```
