# Development Setup Guide

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **Python** 3.11+
- **npm** or **pnpm**
- **Git**
- **Supabase** project (for database + auth)

## Backend Setup

### 1. Install Dependencies

```bash
cd apps/backend
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` file in `apps/backend/`:

```env
# Application
APP_NAME=NutriGuard API
APP_VERSION=1.0.0
LOG_LEVEL=INFO

# Dev Mode (enables mock auth for demo buttons)
DEV_MODE=true

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# Database - Supabase PostgreSQL
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres

# Supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# JWT
JWT_SECRET_KEY=your-secret-key-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Test Mode
TEST_MODE=false
```

### 3. Run Database Migrations

```bash
cd apps/backend
alembic upgrade head
```

### 4. Start Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

### 5. Run Tests

```bash
pytest tests/ -v
```

## Frontend Setup

### 1. Install Dependencies

```bash
cd apps/frontend
npm install
```

### 2. Configure Environment

Create `.env` file in `apps/frontend/`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

### 3. Start Development Server

```bash
npm run dev
```

App available at: `http://localhost:5173`

### 4. Run Tests

```bash
# Unit tests
npm run test:run

# E2E tests
npm run e2e

# E2E tests with UI
npm run e2e:ui
```

## Environment Variables Reference

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `DEV_MODE` | Yes | Enable mock auth for demo (`true`/`false`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon/publishable key |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key |
| `JWT_SECRET_KEY` | Yes | Secret for JWT validation |
| `CORS_ORIGINS` | Yes | Comma-separated allowed origins |
| `TEST_MODE` | No | Enable test mode (`true`/`false`) |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/publishable key |

## Demo Accounts

When `DEV_MODE=true`, use the demo buttons on the login page:

| Role | Email | Access |
|------|-------|--------|
| Donatur | donor@nutriguard.id | Donor dashboard |
| Penerima | penerima@nutriguard.id | Beneficiary dashboard |
| Vendor | vendor@nutriguard.id | Vendor dashboard |

## Troubleshooting

### Backend won't start
- Ensure PostgreSQL is accessible via `DATABASE_URL`
- Check that `SUPABASE_URL` and keys are correct
- Verify Python 3.11+ is installed

### Frontend can't connect to backend
- Ensure backend is running on `http://localhost:8000`
- Check CORS origins include `http://localhost:5173`
- Verify `VITE_SUPABASE_URL` matches backend `SUPABASE_URL`

### Auth not working
- Ensure Supabase Auth is enabled in your project
- Check that `user_roles` and `profiles` tables exist
- For demo mode, ensure `DEV_MODE=true` in backend `.env`
