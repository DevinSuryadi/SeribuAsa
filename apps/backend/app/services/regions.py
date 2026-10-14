"""Versioned province and regency reference for product delivery areas."""

import json
from pathlib import Path

_DATA = json.loads((Path(__file__).resolve().parents[1] / "data" / "regions.json").read_text(encoding="utf-8"))
PROVINCES = {row["code"]: row["name"] for row in _DATA["provinces"]}
REGENCIES = {row["code"]: row for row in _DATA["regencies"]}


def provinces() -> list[dict[str, str]]:
    return _DATA["provinces"]


def regencies(province_code: str) -> list[dict[str, str]]:
    return [row for row in _DATA["regencies"] if row["province_code"] == province_code]


def valid_area(province_code: str, regency_code: str) -> bool:
    return province_code in PROVINCES and REGENCIES.get(regency_code, {}).get("province_code") == province_code


def area_names(province_code: str | None, regency_code: str | None) -> tuple[str | None, str | None]:
    return PROVINCES.get(province_code), REGENCIES.get(regency_code, {}).get("name")
