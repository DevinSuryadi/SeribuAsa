# SeribuAsa — NutriGuard Platform

> A child nutrition donation platform that connects donors, beneficiaries, and vendors through a voucher-based nutrition assistance system.

## Overview

SeribuAsa enables donors to contribute to child nutrition programs, beneficiaries to receive and redeem nutrition vouchers, and vendors to provide approved food products. The platform includes AI-powered nutrition recommendations, WHO Z-Score growth monitoring, and FIES food insecurity surveys.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy, Pydantic |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth (JWT) + mock auth for demo |
| **Testing** | Pytest (backend), Vitest (frontend), Playwright (E2E) |
| **CI/CD** | GitHub Actions |

## Quick Start

```bash
# Backend
cd apps/backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd apps/frontend
npm install
npm run dev
```

See [docs/SETUP.md](docs/SETUP.md) for detailed setup instructions.

## Project Structure

```
SeribuAsa/
├── apps/
│   ├── backend/              # FastAPI backend
│   │   ├── app/
│   │   │   ├── api/          # API routers (9 modules)
│   │   │   ├── models/       # SQLAlchemy models
│   │   │   ├── schemas/      # Pydantic schemas
│   │   │   ├── services/     # Business logic
│   │   │   ├── middleware/   # Auth middleware
│   │   │   └── utils/        # WHO growth standards
│   │   └── tests/            # 50 unit tests
│   ├── frontend/             # React + TypeScript frontend
│   │   ├── src/
│   │   │   ├── pages/        # 15 dashboard pages + auth + landing
│   │   │   ├── components/   # UI components + dashboard layout
│   │   │   ├── services/     # API service layer
│   │   │   └── contexts/     # Auth context (Supabase)
│   │   └── e2e/              # Playwright E2E tests
│   └── supabase/             # Database migrations
├── .github/workflows/        # CI/CD pipelines
└── docs/                     # Documentation
```

## Features

- **Donor Dashboard** — Track donations, view impact metrics, manage subscriptions
- **Beneficiary Dashboard** — Voucher wallet, food catalog, FIES surveys, nutrition monitoring, AI recommendations
- **Vendor Dashboard** — Product management, order processing, settlement tracking
- **AI Recommendations** — Rule-based nutrition recommendations based on FIES and Z-Score data
- **WHO Z-Score** — Child growth monitoring using WHO 2006 growth standards
- **FIES Survey** — Food Insecurity Experience Scale assessment (monthly)

## API Documentation

See [docs/API.md](docs/API.md) for the complete API reference with 26 endpoints.

## Deployment

Deployed on **Vercel** (frontend) + **Render/Railway** (backend) + **Supabase** (database + auth).

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment instructions.

## Status

| Component | Status |
|-----------|--------|
| Backend APIs | ✅ 26 endpoints across 9 modules |
| Frontend Pages | ✅ 15 dashboard pages (all connected) |
| Authentication | ✅ Supabase Auth + mock demo |
| Backend Tests | ✅ 50/50 passing |
| E2E Tests | ✅ 5/5 passing |
| CI/CD | ✅ All checks passing |

## License

Private — Project PPL1 Team 8
