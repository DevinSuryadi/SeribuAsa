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
