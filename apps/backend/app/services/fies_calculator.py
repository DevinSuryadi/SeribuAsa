"""
FIES Calculator Service
Business logic for FIES survey scoring and classification
"""
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import Optional, Dict, List
import logging

from app.models.nutrition import FIESSurvey
from app.models.user import BeneficiaryProfile

logger = logging.getLogger(__name__)

CLASSIFICATION_LABELS = {
    "food_secure": "Ketahanan Pangan Baik",
    "moderate": "Ketahanan Pangan Sedang",
    "severe": "Ketahanan Pangan Buruk",
}

CLASSIFICATION_RECOMMENDATIONS = {
    "food_secure": [
        "Pertahankan pola makan bergizi seimbang",
        "Terus pantau status gizi anak secara berkala",
    ],
    "moderate": [
        "Pertimbangkan untuk mendaftar program bantuan nutrisi",
        "Rencanakan makanan untuk memaksimalkan sumber daya yang tersedia",
        "Konsultasikan dengan puskesmas terdekat",
    ],
    "severe": [
        "Segera hubungi puskesmas atau tenaga kesehatan",
        "Daftar untuk bantuan voucher tambahan",
        "Prioritaskan makanan bergizi tinggi dengan biaya terjangkau",
    ],
}


class FIESCalculator:
    @staticmethod
    def calculate_score(responses: Dict[str, int]) -> int:
        """Calculate FIES score from responses (sum of all values)"""
        return sum(responses.values())

    @staticmethod
    def classify_score(score: int) -> str:
        """Classify food security status based on score"""
        if score <= 2:
            return "food_secure"
        elif score <= 5:
            return "moderate"
        else:
            return "severe"

    @staticmethod
    def get_classification_display(classification: str) -> str:
        return CLASSIFICATION_LABELS.get(classification, classification)

    @staticmethod
    def get_recommendations(classification: str) -> List[str]:
        return CLASSIFICATION_RECOMMENDATIONS.get(classification, [])

    @staticmethod
    def is_survey_available() -> tuple[bool, str]:
        """Survey is always available."""
        return True, ""

    @staticmethod
    def check_already_submitted(db: Session, beneficiary_id: str, month: int, year: int) -> Optional[FIESSurvey]:
        """Check if beneficiary already submitted survey this month"""
        return db.query(FIESSurvey).filter(
            FIESSurvey.beneficiary_id == beneficiary_id,
            FIESSurvey.survey_month == month,
            FIESSurvey.survey_year == year,
        ).first()

    @staticmethod
    def submit_survey(
        db: Session,
        beneficiary_id: str,
        responses: Dict[str, int],
        survey_date: Optional[date] = None,
    ) -> FIESSurvey:
        """Submit FIES survey with full validation"""
        today = date.today()
        survey_dt = survey_date or today

        # Check duplicate
        existing = FIESCalculator.check_already_submitted(
            db, beneficiary_id, today.month, today.year
        )
        if existing:
            raise ValueError("Sudah mengisi survei bulan ini")

        # Calculate
        score = FIESCalculator.calculate_score(responses)
        classification = FIESCalculator.classify_score(score)

        # Save
        survey = FIESSurvey(
            beneficiary_id=beneficiary_id,
            responses=responses,
            score=score,
            classification=classification,
            survey_date=datetime.combine(survey_dt, datetime.min.time()),
            survey_month=today.month,
            survey_year=today.year,
        )
        db.add(survey)

        # Update beneficiary profile
        beneficiary = db.query(BeneficiaryProfile).filter(
            BeneficiaryProfile.user_id == beneficiary_id
        ).first()
        if beneficiary:
            beneficiary.fies_score = score
            beneficiary.fies_classification = classification

        db.commit()
        db.refresh(survey)
        logger.info(f"FIES survey submitted: {survey.id}, score={score}, classification={classification}")
        return survey

    @staticmethod
    def get_history(db: Session, beneficiary_id: str) -> dict:
        """Get FIES survey history with trend analysis"""
        surveys = (
            db.query(FIESSurvey)
            .filter(FIESSurvey.beneficiary_id == beneficiary_id)
            .order_by(FIESSurvey.survey_date.desc())
            .all()
        )

        trend = {"improving": False, "score_change": 0, "previous_classification": None}

        if len(surveys) >= 2:
            latest = surveys[0]
            previous = surveys[1]
            trend["score_change"] = latest.score - previous.score
            trend["improving"] = latest.score < previous.score
            trend["previous_classification"] = previous.classification
        elif len(surveys) == 1:
            trend["previous_classification"] = None

        return {
            "beneficiary_id": beneficiary_id,
            "surveys": surveys,
            "trend": trend,
        }
