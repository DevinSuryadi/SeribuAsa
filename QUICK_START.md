# 🚀 Quick Start Guide

## 5-Minute Setup

### 1. Install Pre-commit Hooks
```bash
pip install pre-commit
pre-commit install
```

### 2. Run Backend Tests
```bash
cd apps/backend
pip install -r requirements.txt
pytest tests/ -v
```

### 3. Run Frontend Tests
```bash
cd apps/frontend
npm install
npm run test:run
```

### 4. Run Linting
```bash
# Backend
cd apps/backend
ruff check .

# Frontend
cd apps/frontend
npm run lint
```

---

## Common Commands

### Testing

```bash
# Backend - all tests
cd apps/backend && pytest tests/ -v

# Backend - with coverage
cd apps/backend && pytest tests/ -v --cov=app

# Backend - specific test file
cd apps/backend && pytest tests/test_utils.py -v

# Backend - specific test
cd apps/backend && pytest tests/test_utils.py::TestVoucherCodeGenerator::test_generate_voucher_code_format -v

# Frontend - all tests
cd apps/frontend && npm run test:run

# Frontend - with coverage
cd apps/frontend && npm run test:coverage

# Frontend - watch mode
cd apps/frontend && npm run test
```

### Linting

```bash
# Backend - check
cd apps/backend && ruff check .

# Backend - fix
cd apps/backend && ruff check . --fix

# Backend - type check
cd apps/backend && mypy app/ --ignore-missing-imports

# Backend - security
cd apps/backend && bandit -r app/

# Frontend - check
cd apps/frontend && npm run lint

# Frontend - fix
cd apps/frontend && npm run lint -- --fix

# Frontend - format
cd apps/frontend && npx prettier --write .
```

### Pre-commit

```bash
# Install hooks
pre-commit install

# Run on all files
pre-commit run --all-files

# Run specific hook
pre-commit run ruff --all-files

# Skip hooks (not recommended)
git commit --no-verify
```

---

## Workflow

### Development
```
1. Create feature branch
   git checkout -b feature/my-feature

2. Make changes

3. Run tests locally
   pytest tests/ -v (backend)
   npm run test:run (frontend)

4. Run linting
   ruff check . (backend)
   npm run lint (frontend)

5. Commit changes
   git add .
   git commit -m "feat: add my feature"
   (pre-commit hooks run automatically)

6. Push to GitHub
   git push origin feature/my-feature

7. Create Pull Request
   (CI runs automatically)

8. Wait for CI to pass

9. Get code review

10. Merge to staging
    (CD deploys to staging)

11. Test in staging

12. Merge to main
    (CD deploys to production)
```

---

## Troubleshooting

### Tests Fail Locally

```bash
# Backend
cd apps/backend
pip install -r requirements.txt --upgrade
pytest tests/ -v --tb=short

# Frontend
cd apps/frontend
rm -rf node_modules package-lock.json
npm install
npm run test:run
```

### Linting Errors

```bash
# Backend - auto-fix
cd apps/backend && ruff check . --fix

# Frontend - auto-fix
cd apps/frontend && npm run lint -- --fix
```

### Pre-commit Hooks Fail

```bash
# Check what's wrong
pre-commit run --all-files

# Fix issues
# (usually auto-fixed by hooks)

# Try again
git add .
git commit -m "fix: resolve linting issues"
```

### CI Pipeline Fails

1. Check GitHub Actions logs
2. Look for error messages
3. Run same command locally
4. Fix issues
5. Push again

---

## File Locations

| What | Where |
|------|-------|
| Backend tests | `apps/backend/tests/` |
| Frontend tests | `apps/frontend/src/__tests__/` |
| CI workflows | `.github/workflows/ci-*.yml` |
| CD workflows | `.github/workflows/cd-*.yml` |
| Pre-commit config | `.pre-commit-config.yaml` |
| Pytest config | `apps/backend/pytest.ini` |
| Package.json | `apps/frontend/package.json` |
| Requirements | `apps/backend/requirements.txt` |

---

## Documentation

| Document | Purpose |
|----------|---------|
| README_TESTING.md | Overview of everything |
| TESTING_GUIDE.md | Detailed how-to guide |
| TESTING_STATUS.md | Comprehensive status |
| CI_CD_SUMMARY.md | CI/CD details |
| IMPLEMENTATION_CHECKLIST.md | Action items |
| QUICK_START.md | This file |

---

## Key Metrics

- **Backend Tests:** 115 tests ✅
- **Frontend Tests:** 0 tests (to be created)
- **CI Pipeline:** ✅ Working
- **CD Pipeline:** ✅ Ready (needs secrets)
- **Linting:** ✅ Configured
- **Pre-commit:** ✅ Configured

---

## Next Steps

1. [ ] Install pre-commit hooks
2. [ ] Run tests locally
3. [ ] Configure GitHub secrets
4. [ ] Test CI pipeline
5. [ ] Test CD pipeline
6. [ ] Create frontend tests
7. [ ] Increase coverage

---

## Help

- 📖 Read TESTING_GUIDE.md for detailed instructions
- 🔍 Check GitHub Actions logs for CI failures
- 💬 Ask team for help
- 📞 Contact DevOps team

