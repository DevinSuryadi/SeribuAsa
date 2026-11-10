"""Schema for a family's weekly food aid quota."""

from datetime import date

from pydantic import BaseModel

from app.services.family_aid_quota import FamilyAidQuota


class FamilyAidQuotaResponse(BaseModel):
    eligible: bool
    blocked_reason: str | None
    period_start: date
    period_end: date
    fies_classification: str | None
    amount_per_beneficiary: float
    children_under_two: int
    unborn_children: int
    beneficiaries: int
    weekly_limit: float
    used_amount: float
    remaining_amount: float

    @classmethod
    def from_quota(cls, quota: FamilyAidQuota) -> "FamilyAidQuotaResponse":
        return cls(
            eligible=quota.blocked_reason is None,
            blocked_reason=quota.blocked_reason,
            period_start=quota.period_start,
            period_end=quota.period_end,
            fies_classification=quota.fies_classification,
            amount_per_beneficiary=float(quota.amount_per_beneficiary),
            children_under_two=quota.children_under_two,
            unborn_children=quota.unborn_children,
            beneficiaries=quota.beneficiaries,
            weekly_limit=float(quota.weekly_limit),
            used_amount=float(quota.used_amount),
            remaining_amount=float(quota.remaining_amount),
        )
