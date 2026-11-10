"""Test helpers that make a facility family eligible for weekly food aid."""

from datetime import date, datetime, timedelta

from app.models.facility import RecipientFamily
from app.models.nutrition import FIESSurvey
from app.models.user import Child, GenderEnum

# Tables the weekly aid quota reads when a facility places an order.
AID_ELIGIBILITY_MODELS = (Child, FIESSurvey)

FIES_SCORES = {"food_secure": 1, "moderate": 4, "severe": 7}


def add_fies_survey(db, family: RecipientFamily, classification: str, survey_day: date | None = None) -> FIESSurvey:
    survey_day = survey_day or date.today()
    score = FIES_SCORES[classification]
    survey = FIESSurvey(
        family_id=family.id,
        responses={f"q{number}": 1 if number <= score else 0 for number in range(1, 9)},
        score=score,
        classification=classification,
        survey_date=datetime.combine(survey_day, datetime.min.time()),
        survey_month=survey_day.month,
        survey_year=survey_day.year,
    )
    db.add(survey)
    return survey


def make_family_eligible(db, family: RecipientFamily, *, children_under_two: int = 2, classification: str = "severe") -> None:
    """Give the family toddlers and a FIES result so orders fit within the weekly quota."""
    for number in range(1, children_under_two + 1):
        db.add(Child(
            family_id=family.id,
            full_name=f"Anak {number}",
            date_of_birth=date.today() - timedelta(days=180),
            gender=GenderEnum.female,
        ))
    add_fies_survey(db, family, classification)
