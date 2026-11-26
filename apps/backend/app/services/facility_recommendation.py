"""AI action and food recommendation for a family managed by a facility.

Collects the latest FIES survey, child growth measurements and antenatal checks, then
runs the family recommender model (trained in ``ml/family_recommender``). Food group
budgets are split from the family's remaining weekly aid quota.
"""

from datetime import date
from functools import lru_cache

from sqlalchemy.orm import Session

from app.models.facility import RecipientFamily
from app.models.nutrition import FIESSurvey, NutritionMeasurement, PrenatalMeasurement
from app.models.user import Child
from app.services import family_recommender
from app.services.family_aid_quota import calculate_family_aid_quota
from app.services.pregnancy import gestational_age_weeks
from app.utils.child_age import age_in_months
from app.utils.local_time import wib_today


@lru_cache(maxsize=1)
def _model() -> dict:
    return family_recommender.load_model()


def build_family_recommendation(db: Session, family: RecipientFamily, *, today: date | None = None) -> dict:
    today = today or wib_today()
    survey = (
        db.query(FIESSurvey)
        .filter_by(family_id=family.id, is_active=True)
        .order_by(FIESSurvey.survey_date.desc(), FIESSurvey.created_at.desc())
        .first()
    )
    children = (
        db.query(Child)
        .filter_by(family_id=family.id, is_active=True)
        .order_by(Child.date_of_birth.desc().nulls_first(), Child.created_at.desc())
        .all()
    )
    members = [
        _pregnancy_member(db, child, today) if child.is_unborn else _child_member(db, child, today)
        for child in children
    ]
    quota = calculate_family_aid_quota(db, family.id, today=today)
    weekly_budget = None if quota.blocked_reason else int(quota.remaining_amount)
    return family_recommender.recommend_family(
        {
            "fies_score": survey.score if survey else None,
            "fies_days_since": (today - survey.survey_date.date()).days if survey else None,
            "members": members,
        },
        _model(),
        weekly_budget=weekly_budget,
    )


def _child_member(db: Session, child: Child, today: date) -> dict:
    """A born child with its latest two growth measurements (for the trend)."""
    measurements = (
        db.query(NutritionMeasurement)
        .filter_by(child_id=child.id, is_active=True)
        .order_by(NutritionMeasurement.measurement_date.desc(), NutritionMeasurement.created_at.desc())
        .limit(2)
        .all()
    )
    latest = measurements[0] if measurements else None
    previous = measurements[1] if len(measurements) > 1 else None
    return {
        "member_type": "child",
        "name": child.full_name,
        "age_months": age_in_months(child.date_of_birth, today),
        "sex": child.gender.value if child.gender else None,
        "haz": latest.z_score_height if latest else None,
        "waz": latest.z_score_weight if latest else None,
        "muac_cm": latest.muac if latest else None,
        "prev_haz": previous.z_score_height if previous else None,
        "prev_waz": previous.z_score_weight if previous else None,
        "days_since_measurement": (today - latest.measurement_date).days if latest else None,
    }


def _pregnancy_member(db: Session, child: Child, today: date) -> dict:
    """A child still in the womb, described by the mother's latest antenatal check."""
    check = (
        db.query(PrenatalMeasurement)
        .filter_by(child_id=child.id, is_active=True)
        .order_by(PrenatalMeasurement.measurement_date.desc(), PrenatalMeasurement.created_at.desc())
        .first()
    )
    return {
        "member_type": "pregnancy",
        "name": child.full_name,
        "gestational_weeks": gestational_age_weeks(child.last_menstrual_period, today),
        "lila_cm": check.maternal_muac if check else None,
        "prenatal_classification": check.classification if check else None,
        "days_since_check": (today - check.measurement_date).days if check else None,
    }
