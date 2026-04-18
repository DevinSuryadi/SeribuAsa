# Backend - NutriGuard API

FastAPI backend for NutriGuard platform.

## Setup

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload
```

## Test

```bash
pytest
```

## Lint

```bash
ruff check .
mypy app/
```

## Seed E2E Dummy Data

Deterministic seeder for end-to-end flows (catalog, cart, orders, vouchers, FIES, nutrition).

Run from `apps/backend`:

```bash
# Fast baseline for local testing
python seed_database.py --mode minimal-e2e --reset

# Richer dataset for dashboard/demo scenarios
python seed_database.py --mode full-demo --reset
```

Notes:

- The seeder is idempotent (safe to run repeatedly).
- `--reset` clears domain data before reseeding.
- Works for both SQLite fallback and PostgreSQL/Supabase dev (uses `DATABASE_URL`).
