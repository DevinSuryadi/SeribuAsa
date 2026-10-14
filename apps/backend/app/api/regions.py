"""Public read-only administrative area reference."""

from fastapi import APIRouter, HTTPException

from app.services.regions import PROVINCES, provinces, regencies

router = APIRouter(prefix="/regions", tags=["regions"])


@router.get("/provinces")
def list_provinces():
    return provinces()


@router.get("/provinces/{province_code}/regencies")
def list_regencies(province_code: str):
    if province_code not in PROVINCES:
        raise HTTPException(status_code=404, detail="Provinsi tidak ditemukan")
    return regencies(province_code)
