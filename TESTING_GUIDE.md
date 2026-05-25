# Testing & CI/CD Guide

## 🚀 Quick Start

### Backend Testing

```bash
# Navigate to backend directory
cd apps/backend

# Install dependencies
pip install -r requirements.txt

# Run all tests
pytest tests/ -v

# Run tests with coverage
pytest tests/ -v --cov=app --cov-report=html

# Run specific test file
pytest tests/test_utils.py -v

# Run specific test class
pytest tests/test_wallet_service.py::TestWalletServiceCredit -v

# Run specific test
pytest tests/test_wallet_service.py::TestWalletServiceCredit::test_credit_increases_balance -v
```

### Frontend Testing

```bash
# Navigate to frontend directory
cd apps/frontend

# Install dependencies
npm install

# Run all tests
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run E2E tests
npm run e2e

# Run E2E tests with UI
npm run e2e:ui

# Run E2E tests in headed mode
npm run e2e:headed
```

---

## 📋 Test Structure

### Backend Tests

```
apps/backend/tests/
├── __init__.py
├── conftest.py                    # Pytest fixtures
├── test_utils.py                  # Utility functions (38 tests)
├── test_wallet_service.py         # Wallet operations (21 tests)
├── test_product_service.py        # Product management (29 tests)
├── test_donation_service.py       # Donation management (27 tests)
├── test_auth.py                   # Authentication
├── test_api_endpoints.py          # API endpoints
├── test_models.py                 # Database models
├── test_services.py               # Service layer
├── test_admin.py                  # Admin operations
├── test_donations.py              # Donation flows
├── test_vouchers.py               # Voucher operations
├── test_donation_allocation.py    # Allocation logic
├── test_voucher_qr_redemption.py  # QR code redemption
├── test_alerts_smoke.py           # Alert system
└── test_main.py                   # Main app
```

### Frontend Tests

```
apps/frontend/src/
├── __tests__/
│   ├── components/                # Component tests (to be created)
│   ├── hooks/                     # Hook tests (to be created)
│   ├── stores/                    # Store tests (to be created)
│   └── utils/                     # Utility tests (to be created)
└── ...
```

---

## 🔍 Linting & Code Quality

### Backend Linting

```bash
cd apps/backend

# Run Ruff linter
ruff check .

# Run Ruff with auto-fix
ruff check . --fix

# Run Mypy type checker
mypy app/ --ignore-missing-imports

# Run Bandit security scanner
bandit -r app/

# Run all checks
ruff check . && mypy app/ --ignore-missing-imports && bandit -r app/
```

### Frontend Linting

```bash
cd apps/frontend

# Run ESLint
npm run lint

# Run Prettier (format check)
npx prettier --check .

# Format code with Prettier
npx prettier --write .

# Run all checks
npm run lint && npx prettier --check .
```

---

## 🔄 Pre-commit Hooks

### Setup Pre-commit

```bash
# Install pre-commit
pip install pre-commit

# Install the git hooks
pre-commit install

# Run pre-commit on all files
pre-commit run --all-files

# Run specific hook
pre-commit run ruff --all-files
```

### What Pre-commit Does

- ✅ Ruff linting and formatting
- ✅ Mypy type checking
- ✅ Bandit security scanning
- ✅ YAML/JSON validation
- ✅ ESLint for JavaScript/TypeScript
- ✅ Prettier formatting
- ✅ Markdown linting
- ✅ Commit message validation

---

## 🚀 CI/CD Pipeline

### GitHub Actions Workflows

#### Backend CI (`.github/workflows/ci-backend.yml`)
- **Triggers:** Push to main/staging/feature/*, PR to main/staging
- **Jobs:**
  1. **Lint** - Ruff + Mypy
  2. **Test** - Pytest with coverage

#### Backend CD (`.github/workflows/cd-backend.yml`)
- **Triggers:** Push to main/staging (backend files changed)
- **Jobs:**
  1. **Build** - Docker image build
  2. **Test Image** - Run tests in container
  3. **Deploy Staging** - Deploy to staging (on staging branch)
  4. **Deploy Production** - Deploy to production (on main branch)

#### Frontend CI (`.github/workflows/ci-frontend.yml`)
- **Triggers:** Push to main/staging/feature/*, PR to main/staging
- **Jobs:**
  1. **Lint** - ESLint
  2. **Test** - Vitest

#### Frontend CD (`.github/workflows/cd-frontend.yml`)
- **Triggers:** Push to main/staging (frontend files changed)
- **Jobs:**
  1. **Build** - Build application
  2. **Build Docker** - Docker image build
  3. **Deploy Staging** - Deploy to staging (on staging branch)
  4. **Deploy Production** - Deploy to production (on main branch)

---

## 📊 Coverage Reports

### Backend Coverage

```bash
cd apps/backend

# Generate coverage report
pytest tests/ --cov=app --cov-report=html

# View report
open htmlcov/index.html  # macOS
start htmlcov/index.html # Windows
xdg-open htmlcov/index.html # Linux
```

### Frontend Coverage

```bash
cd apps/frontend

# Generate coverage report
npm run test:coverage

# View report
open coverage/index.html  # macOS
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

---

## 🔐 Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nutriguard

# JWT
JWT_SECRET_KEY=your-secret-key-here

# App
APP_NAME=NutriGuard API
DEBUG=false

# Testing
TEST_MODE=false
```

### Frontend (.env)

```env
# API
VITE_API_URL=http://localhost:8000

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Environment
VITE_ENV=development
```

---

## 🐛 Debugging Tests

### Backend Debugging

```bash
cd apps/backend

# Run with verbose output
pytest tests/ -vv

# Run with print statements
pytest tests/ -s

# Run with pdb on failure
pytest tests/ --pdb

# Run with pdb on first failure
pytest tests/ -x --pdb

# Run with detailed traceback
pytest tests/ --tb=long
```

### Frontend Debugging

```bash
cd apps/frontend

# Run with debug output
npm run test -- --reporter=verbose

# Run specific test file
npm run test -- test_file.test.ts

# Run with UI
npm run test:ui
```

---

## 📈 Test Metrics

### Current Status

| Component | Tests | Coverage | Status |
|-----------|-------|----------|--------|
| Backend Utils | 38 | - | ✅ Complete |
| Backend Wallet | 21 | - | ✅ Complete |
| Backend Product | 29 | - | ✅ Complete |
| Backend Donation | 27 | - | ✅ Complete |
| Backend Total | 115 | 0%* | ⚠️ Partial |
| Frontend | 0 | - | ❌ Missing |

*Coverage threshold can be increased in CI

### Target Metrics

- Backend: 70%+ coverage
- Frontend: 60%+ coverage
- All tests passing in CI
- No linting errors
- No security issues

---

## 🔗 Useful Commands

### Run Everything Locally

```bash
# Backend
cd apps/backend
pip install -r requirements.txt
ruff check . && mypy app/ --ignore-missing-imports && pytest tests/ -v --cov=app

# Frontend
cd apps/frontend
npm install
npm run lint && npm run test:run
```

### Check CI Status

```bash
# View workflow runs
gh run list

# View specific workflow
gh run view <run-id>

# View logs
gh run view <run-id> --log
```

### Manual Deployment

```bash
# Trigger workflow manually
gh workflow run cd-backend.yml -f environment=staging
gh workflow run cd-frontend.yml -f environment=staging
```

---

## 🆘 Troubleshooting

### Backend Issues

**Issue:** Tests fail with database errors
```bash
# Solution: Use in-memory SQLite for tests
export DATABASE_URL=sqlite:///:memory:
pytest tests/
```

**Issue:** Mypy errors
```bash
# Solution: Install type stubs
pip install types-python-jose types-passlib types-requests
```

**Issue:** Import errors
```bash
# Solution: Install dependencies
pip install -r requirements.txt
```

### Frontend Issues

**Issue:** Tests fail with module not found
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue:** ESLint errors
```bash
# Solution: Auto-fix issues
npm run lint -- --fix
```

---

## 📚 Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Vitest Documentation](https://vitest.dev/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Ruff Documentation](https://docs.astral.sh/ruff/)
- [Mypy Documentation](https://mypy.readthedocs.io/)
- [ESLint Documentation](https://eslint.org/)

