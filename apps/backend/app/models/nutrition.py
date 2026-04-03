"""
Nutrition and System Models
- NutritionMeasurement: Child growth tracking
- FIESSurvey: Food insecurity survey
- Settlement: Vendor settlements
- AuditLog: System audit trail
"""
from sqlalchemy import Column, String, Date, DateTime, Integer, Numeric, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel


# Enum for nutrition classification
class NutritionClassificationEnum(str, enum.Enum):
    normal = "Normal"
    at_risk = "At Risk"
    moderate_malnutrition = "Moderate Acute Malnutrition"
    severe_malnutrition = "Severe Acute Malnutrition"
    wasted = "Wasted"
    stunted = "Stunted"


# Enum for settlement status
class SettlementStatusEnum(str, enum.Enum):
    calculating = "calculating"
    ready = "ready"
    paid = "paid"
    cancelled = "cancelled"


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


# ============================================
# Settlement - Vendor settlements
# ============================================
class Settlement(BaseModel):
    __tablename__ = "settlements"
    
    # Foreign key
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendor_profiles.user_id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Settlement period
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    
    # Amounts
    total_redemptions = Column(Numeric(15, 2), nullable=False)
    admin_fee = Column(Numeric(15, 2), default=0)
    net_amount = Column(Numeric(15, 2), nullable=False)
    
    # Status
    status = Column(String(50), nullable=False, default=SettlementStatusEnum.calculating, index=True)
    
    # Payout information
    payout_date = Column(Date)
    bank_transfer_reference = Column(String(255))
    
    # Relationship
    vendor_profile = relationship("VendorProfile", back_populates="settlements")
    
    def __repr__(self):
        return f"<Settlement {self.vendor_id} - {self.period_start} to {self.period_end}>"
    
    def calculate_net_amount(self) -> None:
        """Calculate net amount after deducting admin fee"""
        self.net_amount = self.total_redemptions - self.admin_fee


# ============================================
# AuditLog - System audit trail
# ============================================
class AuditLog(BaseModel):
    __tablename__ = "audit_logs"
    
    # Foreign key
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.user_id", ondelete="SET NULL"), index=True)
    
    # Action details
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)  # e.g., "donation", "voucher", "order"
    entity_id = Column(UUID(as_uuid=True), index=True)
    
    # Old and new values (for updates)
    old_values = Column(JSONB, nullable=True)
    new_values = Column(JSONB, nullable=True)
    
    # Request information
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    
    def __repr__(self):
        return f"<AuditLog {self.action} by {self.user_id} on {self.entity_type}:{self.entity_id}>"


# ============================================
# Indexes for performance
# ============================================
Index("idx_nutrition_measurement_child_date", NutritionMeasurement.child_id, NutritionMeasurement.measurement_date)
Index("idx_fies_survey_beneficiary_period", FIESSurvey.beneficiary_id, FIESSurvey.survey_year, FIESSurvey.survey_month)
Index("idx_settlement_vendor_period", Settlement.vendor_id, Settlement.period_start)
Index("idx_audit_log_user_entity", AuditLog.user_id, AuditLog.entity_type)
