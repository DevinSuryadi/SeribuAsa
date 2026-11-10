"""Weekly food aid quota for each family, sized by 1000-day beneficiaries and FIES level.

Each child under two years and each child still in the womb counts as one beneficiary.
The amount per beneficiary follows the latest FIES result. A week runs Monday to Sunday in
WIB, and cancelled or rejected orders no longer use the quota.
"""

from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.nutrition import FIESSurvey
from app.models.product import Order
from app.models.user import Child
from app.utils.child_age import age_in_months
from app.utils.local_time import wib_midnight_as_utc, wib_today

WEEKLY_AID_PER_BENEFICIARY = {
    "severe": Decimal("100000"),
    "moderate": Decimal("75000"),
    "food_secure": Decimal("50000"),
}
ELIGIBLE_CHILD_AGE_MONTHS = 24
QUOTA_RELEASING_STATUSES = ("cancelled", "rejected")

MISSING_SURVEY_MESSAGE = (
    "Keluarga belum memiliki hasil survei FIES. Lakukan survei FIES terlebih dahulu "
    "sebelum memesan bantuan pangan."
)
NO_BENEFICIARY_MESSAGE = (
    "Keluarga belum memiliki anak berusia di bawah 2 tahun atau anak dalam kandungan yang "
    "terdaftar. Bantuan pangan diberikan untuk sasaran 1000 Hari Pertama Kehidupan."
)


class AidQuotaError(Exception):
    """Raised when an order cannot be placed within the family's weekly aid quota."""


@dataclass(frozen=True)
class FamilyAidQuota:
    period_start: date
    period_end: date
    fies_classification: str | None
    amount_per_beneficiary: Decimal
    children_under_two: int
    unborn_children: int
    used_amount: Decimal
    blocked_reason: str | None

    @property
    def beneficiaries(self) -> int:
        return self.children_under_two + self.unborn_children

    @property
    def weekly_limit(self) -> Decimal:
        return self.amount_per_beneficiary * self.beneficiaries

    @property
    def remaining_amount(self) -> Decimal:
        return max(self.weekly_limit - self.used_amount, Decimal("0"))


def aid_week(day: date) -> tuple[date, date]:
    """Return the Monday and Sunday of the week containing ``day``."""
    start = day - timedelta(days=day.weekday())
    return start, start + timedelta(days=6)


def calculate_family_aid_quota(db: Session, family_id: UUID, *, today: date | None = None) -> FamilyAidQuota:
    today = today or wib_today()
    period_start, period_end = aid_week(today)

    survey = (
        db.query(FIESSurvey)
        .filter_by(family_id=family_id, is_active=True)
        .order_by(FIESSurvey.survey_date.desc(), FIESSurvey.created_at.desc())
        .first()
    )
    children_under_two, unborn_children = _count_beneficiaries(db, family_id, today)
    classification = survey.classification if survey else None

    if survey is None:
        blocked_reason = MISSING_SURVEY_MESSAGE
    elif children_under_two + unborn_children == 0:
        blocked_reason = NO_BENEFICIARY_MESSAGE
    else:
        blocked_reason = None

    return FamilyAidQuota(
        period_start=period_start,
        period_end=period_end,
        fies_classification=classification,
        amount_per_beneficiary=WEEKLY_AID_PER_BENEFICIARY.get(classification, Decimal("0")),
        children_under_two=children_under_two,
        unborn_children=unborn_children,
        used_amount=_used_amount(db, family_id, period_start),
        blocked_reason=blocked_reason,
    )


def ensure_order_within_aid_quota(
    db: Session, family_id: UUID, amount: Decimal, *, today: date | None = None
) -> FamilyAidQuota:
    """Raise :class:`AidQuotaError` unless the family may receive ``amount`` this week."""
    quota = calculate_family_aid_quota(db, family_id, today=today)
    if quota.blocked_reason:
        raise AidQuotaError(quota.blocked_reason)
    if amount > quota.remaining_amount:
        raise AidQuotaError(
            f"Total pesanan {_rupiah(amount)} melebihi sisa kuota mingguan keluarga sebesar "
            f"{_rupiah(quota.remaining_amount)}. Kuota mingguan diperbarui setiap hari Senin."
        )
    return quota


def _count_beneficiaries(db: Session, family_id: UUID, today: date) -> tuple[int, int]:
    children_under_two = 0
    unborn_children = 0
    for child in db.query(Child).filter_by(family_id=family_id, is_active=True):
        birth_date = child.date_of_birth
        # A pregnancy past its expected birth date counts as a newborn even before it is recorded.
        if birth_date is None and child.expected_birth_date <= today:
            birth_date = child.expected_birth_date
        if birth_date is None:
            unborn_children += 1
        elif age_in_months(birth_date, today) < ELIGIBLE_CHILD_AGE_MONTHS:
            children_under_two += 1
    return children_under_two, unborn_children


def _used_amount(db: Session, family_id: UUID, period_start: date) -> Decimal:
    used = (
        db.query(func.coalesce(func.sum(Order.total_amount), 0))
        .filter(
            Order.family_id == family_id,
            Order.order_flow == "facility_delivery",
            Order.is_active.is_(True),
            Order.status.notin_(QUOTA_RELEASING_STATUSES),
            Order.created_at >= wib_midnight_as_utc(period_start),
            Order.created_at < wib_midnight_as_utc(period_start + timedelta(days=7)),
        )
        .scalar()
    )
    return Decimal(str(used))


def _rupiah(amount: Decimal) -> str:
    return "Rp" + f"{amount:,.0f}".replace(",", ".")
