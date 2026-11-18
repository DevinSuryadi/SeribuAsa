from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel


class ImpactPeriod(BaseModel):
    start_date: date | None
    end_date: date


class DashboardSummary(BaseModel):
    received: Decimal
    pooled_received: Decimal
    legacy_received: Decimal
    reserved: Decimal
    spent: Decimal
    available: Decimal
    distributed: Decimal
    donations: int
    families: int
    facilities: int
    distributions: int


class ImpactMonth(BaseModel):
    month: str
    amount: Decimal
    count: int


class ImpactRegion(BaseModel):
    code: str
    name: str
    amount: Decimal
    families: int
    distributions: int


class ImpactDonation(BaseModel):
    id: str
    created_at: datetime
    amount: Decimal
    flow: str
    reserved: Decimal
    spent: Decimal


class DashboardImpactResponse(BaseModel):
    scope: Literal["personal", "platform"]
    period: ImpactPeriod
    generated_at: datetime
    summary: DashboardSummary
    trend: list[ImpactMonth]
    regions: list[ImpactRegion]
    recent_donations: list[ImpactDonation]
