"""
Nutrition and System Models
- NutritionMeasurement: Child growth tracking
- FIESSurvey: Food insecurity survey
"""
from sqlalchemy import Column, String, Text, Date, DateTime, Enum, Integer, Numeric, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from app.models.base import BaseModel


# Enum for nutrition classification
class NutritionClassificationEnum(str, enum.Enum):
    normal = "Normal"
    at_risk = "At Risk"
    moderate_malnutrition = "Moderate Acute Malnutrition"
    severe_malnutrition = "Severe Acute Malnutrition"
    wasted = "Wasted"
    stunted = "Stunted"


# ============================================
# NutritionMeasurement - Child growth tracking
# ============================================
class NutritionMeasurement(BaseModel):
    __tablename__ = "nutrition_measurements"
    
    # Foreign key
    child_id = Column(UUID(as_uuid=True), ForeignKey("children.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Measurement data
    measurement_date = Column(Date, nullable=False, index=True)
    weight = Column(Numeric(5, 2), nullable=False)  # kg
    height = Column(Numeric(5, 2), nullable=False)  # cm
    muac = Column(Numeric(5, 2), nullable=True)  # Mid-Upper Arm Circumference (cm)
    
    # Z-scores (WHO standards)
    z_score_weight = Column(Numeric(5, 2))  # Weight-for-age Z-score
    z_score_height = Column(Numeric(5, 2))  # Height-for-age Z-score
    z_score_weight_height = Column(Numeric(5, 2))  # Weight-for-height Z-score
    
    # Classification based on Z-scores
    classification = Column(String(50))
    
    # Relationship
    child = relationship("Child", back_populates="nutrition_measurements")
    
    def __repr__(self):
        return f"<NutritionMeasurement {self.child_id} - {self.measurement_date}>"
    
    def calculate_z_scores(self, reference_data: dict) -> None:
        """
        Calculate Z-scores based on WHO reference data.
        This should be called before saving.
        """
        pass


# ============================================
# FIESSurvey - Food insecurity survey
# ============================================
class FIESSurvey(BaseModel):
    __tablename__ = "fies_surveys"
    
    # Foreign key
    beneficiary_id = Column(UUID(as_uuid=True), ForeignKey("beneficiary_profiles.user_id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Survey responses (8 questions)
    responses = Column(JSONB, nullable=False)
    
    # Score and classification
    score = Column(Integer, nullable=False)  # 0-8
    classification = Column(String(50), nullable=False)  # food_secure, moderate, severe
    
    # Survey period
    survey_date = Column(DateTime, nullable=False, index=True)
    survey_month = Column(Integer, nullable=False)  # 1-12
    survey_year = Column(Integer, nullable=False)
    
    # Relationship
    beneficiary_profile = relationship("BeneficiaryProfile", back_populates="fies_surveys")
    
    def __repr__(self):
        return f"<FIESSurvey {self.beneficiary_id} - Score: {self.score} ({self.classification})>"
    
    @staticmethod
    def calculate_score(responses: dict) -> int:
        """
        Calculate FIES score from responses.
        Each 'yes' answer = 1 point.
        Score range: 0-8
        """
        return sum(1 for answer in responses.values() if answer.lower() == "yes")
    
    @staticmethod
    def classify_score(score: int) -> str:
        """Classify food security status based on score"""
        if score <= 2:
            return "food_secure"
        elif score <= 5:
            return "moderate"
        else:
            return "severe"
