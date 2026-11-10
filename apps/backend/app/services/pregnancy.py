"""Pregnancy timeline and antenatal check-up rules for children registered in the womb.

Reference values follow the Indonesian maternal and child health (KIA) handbook:
- expected birth date by Naegele's rule (280 days after the last menstrual period),
- mid-upper arm circumference (LiLA) below 23.5 cm indicates chronic energy deficiency (KEK),
- fetal heart rate between 120 and 160 beats per minute,
- fundal height in centimetres close to the gestational age in weeks from week 20 to 36.
"""

from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import update
from sqlalchemy.orm import Session

from app.models.user import Child
from app.utils.local_time import wib_today

PREGNANCY_LENGTH = timedelta(days=280)
KEK_MUAC_THRESHOLD_CM = Decimal("23.5")
NORMAL_FETAL_HEART_RATE_BPM = (120, 160)
FUNDAL_HEIGHT_RULE_WEEKS = (20, 36)
FUNDAL_HEIGHT_TOLERANCE_CM = Decimal("2")


class PrenatalClassification:
    NORMAL = "normal"
    KEK_RISK = "kek_risk"
    NEEDS_REVIEW = "needs_review"


@dataclass(frozen=True)
class PrenatalAssessment:
    classification: str
    findings: tuple[str, ...]


def expected_birth_date(last_menstrual_period: date) -> date:
    return last_menstrual_period + PREGNANCY_LENGTH


def gestational_age_weeks(last_menstrual_period: date, on: date) -> int:
    return max(0, (on - last_menstrual_period).days // 7)


def default_unborn_name(mother_name: str) -> str:
    """Hospital naming convention for a baby whose name has not been chosen yet."""
    return f"Bayi Ny. {mother_name}"


def assess_prenatal_check(
    *,
    gestational_weeks: int,
    maternal_muac: Decimal,
    fundal_height: Decimal | None,
    fetal_heart_rate: int | None,
) -> PrenatalAssessment:
    """Flag readings that need follow-up. This is a screening aid, not a diagnosis."""
    findings: list[str] = []
    needs_review = False

    if fundal_height is not None and FUNDAL_HEIGHT_RULE_WEEKS[0] <= gestational_weeks <= FUNDAL_HEIGHT_RULE_WEEKS[1]:
        if abs(fundal_height - gestational_weeks) > FUNDAL_HEIGHT_TOLERANCE_CM:
            needs_review = True
            findings.append(
                f"Tinggi fundus uteri tidak sesuai dengan usia kehamilan {gestational_weeks} minggu."
            )

    if fetal_heart_rate is not None:
        low, high = NORMAL_FETAL_HEART_RATE_BPM
        if not low <= fetal_heart_rate <= high:
            needs_review = True
            findings.append(f"Denyut jantung janin di luar rentang normal {low}-{high} kali per menit.")

    kek_risk = maternal_muac < KEK_MUAC_THRESHOLD_CM
    if kek_risk:
        findings.append("LiLA ibu di bawah 23,5 cm menunjukkan risiko kurang energi kronis (KEK).")

    if needs_review:
        classification = PrenatalClassification.NEEDS_REVIEW
    elif kek_risk:
        classification = PrenatalClassification.KEK_RISK
    else:
        classification = PrenatalClassification.NORMAL
    return PrenatalAssessment(classification=classification, findings=tuple(findings))


def promote_due_pregnancies(db: Session, *, family_id: UUID | None = None, today: date | None = None) -> int:
    """Treat children whose expected birth date has passed as born on that date.

    The facility can later confirm the actual birth date and gender. Antenatal records stay
    attached to the child, and children registered after birth are never touched.
    """
    statement = (
        update(Child)
        .where(
            Child.is_active.is_(True),
            Child.date_of_birth.is_(None),
            Child.expected_birth_date <= (today or wib_today()),
        )
        .values(date_of_birth=Child.expected_birth_date)
        .execution_options(synchronize_session=False)
    )
    if family_id is not None:
        statement = statement.where(Child.family_id == family_id)
    promoted = db.execute(statement).rowcount
    if promoted:
        db.commit()
    return promoted
