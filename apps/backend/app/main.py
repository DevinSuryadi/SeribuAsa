import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="NutriGuard API")


def get_cors_origins() -> list[str]:
    """Read comma-separated allowed origins from the environment."""
    configured_origins = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:5174",
    )
    return [origin.strip() for origin in configured_origins.split(",") if origin.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Welcome to NutriGuard API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
