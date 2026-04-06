# AGENTS.md - SeribuAsa Development Guide

This guide is for AI agents operating in the SeribuAsa (nutri-guard) codebase.

## Project Overview

SeribuAsa is a food insecurity platform in Indonesia with:
- **Frontend**: React 19 + Vite + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: FastAPI (Python 3.11) + SQLAlchemy + PostgreSQL
- **Auth**: Supabase for auth, backend PostgreSQL for user profiles
- **Monorepo**: Turborepo with workspaces in `apps/*` and `packages/*`

---

## Commands

### Root (Monorepo)

```bash
# Run all commands in both apps
npm run dev          # Start all dev servers
npm run build        # Build all apps
npm run lint         # Lint all apps
npm run test         # Test all apps
npm run type-check   # Type-check all apps
npm run format       # Format code with Prettier
npm run format:check # Check formatting
```

### Frontend (`apps/frontend`)

```bash
cd apps/frontend

# Dev server
npm run dev                     # Start Vite dev server
npm run build                   # Production build
npm run lint                    # ESLint check

# Testing
npm run test                    # Run all tests with watch
npm run test:run                # Run tests once (CI)
npm run test:ui                 # Run tests with Vitest UI
npm run test:coverage           # Generate coverage report

# Run single test
npx vitest run src/path/to/testfile.test.ts
npx vitest run --testNamePattern "test name"  # Run by name

# E2E Tests (Playwright)
npm run e2e                     # Run all e2e tests
npm run e2e:ui                 # E2E with UI
npm run e2e:headed             # Run in headed browser
```

### Backend (`apps/backend`)

```bash
cd apps/backend

# Install dependencies
pip install -e ".[test]"        # With test dependencies

# Run server
uvicorn app.main:app --reload   # Dev server on port 8000

# Linting & Type checking
ruff check .                    # Ruff linter
mypy app/                      # MyPy type checker

# Testing (Pytest)
pytest                          # Run all tests
pytest -v                      # Verbose output
pytest tests/test_file.py      # Run single test file
pytest tests/test_file.py::TestClass::test_method  # Run single test
pytest -k "test_name"          # Run by keyword pattern

# With coverage
pytest --cov=app --cov-report=term-missing
```

---

## Code Style

### TypeScript / React (Frontend)

**File Organization**
- Components: `src/components/ui/` (shadcn/ui), `src/components/[feature]/`
- Pages: `src/pages/`
- Hooks: `src/hooks/`
- Contexts: `src/contexts/`
- Types: `src/types/`
- Utils: `src/lib/utils.ts` (cn helper)

**Naming Conventions**
- Components: PascalCase (e.g., `Button.tsx`, `UserProfile.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth.ts`)
- Types/Interfaces: PascalCase (e.g., `UserProfile`, `ApiResponse`)
- Files: kebab-case (e.g., `user-profile.tsx`, `api-client.ts`)
- Constants: SCREAMING_SNAKE_CASE

**Imports (use path aliases)**
```typescript
// Use @ alias for src/
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

// Relative imports for nearby files
import { Button } from "./button"
```

**Type Annotations**
- Prefer explicit types over `any`
- Use `interface` for object shapes, `type` for unions/aliases
- Generics are encouraged for reusable components
- Example:
```typescript
interface UserProfile {
  id: string
  full_name: string
  email: string
  role: "donor" | "beneficiary" | "vendor"
}

function useUser<T>(id: string): Promise<T> { ... }
```

**Error Handling**
- Use try/catch with async/await
- Display user-friendly error messages
- Log errors to console for debugging
- Example:
```typescript
try {
  await signIn(email, password)
} catch (error) {
  console.error("Login failed:", error)
  toast.error("Username atau password salah")
}
```

**UI Guidelines**
- Use TailwindCSS with shadcn/ui components
- Auth pages: use `bg-gray-100` background
- Use `cn()` from `@/lib/utils` to merge classes
- Radix UI primitives for accessibility

### Python / FastAPI (Backend)

**File Organization**
- Routes: `app/api/`
- Models: `app/models/`
- Schemas: `app/schemas/`
- Services: `app/services/`
- Middleware: `app/middleware/`

**Naming Conventions**
- Functions: snake_case (e.g., `get_user_profile`)
- Classes: PascalCase (e.g., `UserProfile`)
- Constants: SCREAMING_SNAKE_CASE
- Files: snake_case (e.g., `user_profile.py`)

**Imports**
```python
# Standard library
from typing import Optional
from datetime import datetime

# Third party
from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session

# Local
from app.models.user import User
from app.schemas.user import UserCreate
```

**Type Annotations**
- Use Python 3.11+ type hints
- Prefer explicit types
- Use `Optional` instead of `| None`
- Example:
```python
def get_user(user_id: str, db: Session) -> Optional[User]:
    ...
```

**Error Handling**
- Use FastAPI's `HTTPException` for API errors
- Return appropriate HTTP status codes:
  - 400: Bad Request (validation errors)
  - 401: Unauthorized
  - 404: Not Found
  - 500: Internal Server Error
- Example:
```python
from fastapi import HTTPException

@router.get("/users/{user_id}")
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

**Database (SQLAlchemy)**
- Use async with SQLAlchemy 2.0 style
- Use dependency injection for database sessions
- Define models in `app/models/`
- Example:
```python
from sqlalchemy import Column, String, Integer
from app.models.base import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
```

**Pydantic Schemas**
- Define request/response models in `app/schemas/`
- Use `BaseModel` for input validation
- Example:
```python
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
```

---

## Git Conventions

- Use **Conventional Commits**:
  - `feat: add user registration`
  - `fix: resolve login error`
  - `refactor: simplify auth flow`
  - `docs: update README`
  - `test: add tests for user service`

- Branch naming: `feature/description`, `fix/description`, `hotfix/description`

---

## Environment Variables

### Frontend (`.env`)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:8000
```

### Backend (`.env`)
```
DATABASE_URL=postgresql://...
SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_SERVICE_KEY=...
```

---

## Testing Guidelines

- Write tests for new features
- Frontend: Vitest for unit tests, Playwright for e2e
- Backend: Pytest with fixtures from `conftest.py`
- Run tests before committing
- Minimum 80% coverage for critical paths