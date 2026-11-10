"""Current FIES and growth facts for a family managed by a facility."""

from sqlalchemy.orm import Session

from app.models.facility import RecipientFamily
from app.models.nutrition import FIESSurvey, NutritionMeasurement, PrenatalMeasurement
from app.models.user import Child
from app.services.fies_calculator import FIESCalculator
from app.services.pregnancy import gestational_age_weeks
from app.services.recommendation_engine import RecommendationEngine
from app.utils.local_time import wib_today


FIES_AFFIRMATIVE_LABELS = (
    "khawatir makanan habis",
    "kesulitan memperoleh makanan sehat dan bergizi",
    "pilihan makanan terbatas",
    "melewatkan waktu makan",
    "porsi makan berkurang",
    "kehabisan makanan di rumah",
    "lapar tanpa makan",
    "tidak makan seharian",
)


def build_family_assessment(db: Session, family: RecipientFamily) -> dict:
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
    growth = []
    child_facts = []
    measurement_ids = []
    summary_lines = []
    priority = "unknown"

    if survey:
        priority = "high" if survey.score > 5 else "medium" if survey.score > 2 else "low"
        summary_lines.append(
            f"FIES {survey.survey_date.date().isoformat()}: skor {survey.score}/8 "
            f"({FIESCalculator.get_classification_display(survey.classification)})."
        )
        reported = [
            label for number, label in enumerate(FIES_AFFIRMATIVE_LABELS, start=1)
            if survey.responses.get(f"q{number}") == 1
        ]
        if reported:
            summary_lines.append("Kondisi pangan yang dilaporkan: " + ", ".join(reported) + ".")
    else:
        summary_lines.append("Survei FIES belum tersedia.")

    if not children:
        summary_lines.append("Belum ada anak terdaftar.")

    for child in children:
        if child.is_unborn:
            growth.append(_unborn_child_facts(db, child, summary_lines))
            continue
        measurement = (
            db.query(NutritionMeasurement)
            .filter_by(child_id=child.id, is_active=True)
            .order_by(NutritionMeasurement.measurement_date.desc(), NutritionMeasurement.created_at.desc())
            .first()
        )
        child_facts.append((child, measurement))
        measurement_data = None
        if measurement:
            measurement_ids.append(str(measurement.id))
            height_score = float(measurement.z_score_height) if measurement.z_score_height is not None else None
            weight_score = float(measurement.z_score_weight) if measurement.z_score_weight is not None else None
            scores = (height_score, weight_score)
            if any(score is not None and score < -3 for score in scores):
                priority = "high"
            elif any(score is not None and score < -2 for score in scores) and priority != "high":
                priority = "medium"
            elif priority == "unknown":
                priority = "low"
            measurement_data = {
                "id": measurement.id,
                "measurement_date": measurement.measurement_date,
                "weight": measurement.weight,
                "height": measurement.height,
                "z_score_weight": measurement.z_score_weight,
                "z_score_height": measurement.z_score_height,
                "classification": measurement.classification,
            }
            summary_lines.append(
                f"{child.full_name}: pengukuran {measurement.measurement_date.isoformat()}, "
                f"BB {measurement.weight} kg, TB {measurement.height} cm, "
                f"z-score BB {weight_score if weight_score is not None else '-'}, "
                f"TB {height_score if height_score is not None else '-'}."
            )
        else:
            summary_lines.append(f"{child.full_name}: belum ada pengukuran gizi.")
        growth.append({
            "child_id": child.id,
            "child_name": child.full_name,
            "status": "born",
            "date_of_birth": child.date_of_birth,
            "expected_birth_date": child.expected_birth_date,
            "gestational_age_weeks": None,
            "latest_measurement": measurement_data,
            "latest_prenatal_check": None,
        })

    recommendations = RecommendationEngine.generate_for_family(survey, child_facts)
    return {
        "family_id": family.id,
        "fies": {
            "id": survey.id,
            "score": survey.score,
            "classification": survey.classification,
            "survey_date": survey.survey_date,
        } if survey else None,
        "children": growth,
        "summary_text": "\n".join(summary_lines),
        "suggested_priority": priority,
        "recommendations": recommendations,
        "has_assessment": bool(survey or measurement_ids),
    }


def _unborn_child_facts(db: Session, child: Child, summary_lines: list[str]) -> dict:
    """Summarise a child still in the womb with the latest antenatal check-up."""
    weeks = gestational_age_weeks(child.last_menstrual_period, wib_today())
    check = (
        db.query(PrenatalMeasurement)
        .filter_by(child_id=child.id, is_active=True)
        .order_by(PrenatalMeasurement.measurement_date.desc(), PrenatalMeasurement.created_at.desc())
        .first()
    )
    summary_lines.append(
        f"{child.full_name}: dalam kandungan, usia kehamilan {weeks} minggu, "
        f"perkiraan lahir {child.expected_birth_date.isoformat()}."
    )
    return {
        "child_id": child.id,
        "child_name": child.full_name,
        "status": "unborn",
        "date_of_birth": None,
        "expected_birth_date": child.expected_birth_date,
        "gestational_age_weeks": weeks,
        "latest_measurement": None,
        "latest_prenatal_check": {
            "id": check.id,
            "measurement_date": check.measurement_date,
            "gestational_age_weeks": check.gestational_age_weeks,
            "maternal_weight": float(check.maternal_weight),
            "maternal_muac": float(check.maternal_muac),
            "fundal_height": float(check.fundal_height) if check.fundal_height is not None else None,
            "classification": check.classification,
        } if check else None,
    }
