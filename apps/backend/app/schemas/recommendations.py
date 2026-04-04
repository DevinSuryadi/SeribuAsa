"""
Recommendation Schemas
Pydantic schemas for AI-powered nutrition recommendations
"""
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime, date


# ============================================
# Recommendation Schemas
# ============================================
class RecommendationItem(BaseModel):
    id: str
    category: str  # nutrition, food_security, supplements, medical
    priority: str  # high, medium, low
    title: str
    description: str
    action_items: List[str]
    based_on: Dict[str, Any]


class RecommendationResponse(BaseModel):
    beneficiary_id: str
    generated_at: datetime
    recommendations: List[RecommendationItem]
    next_review_date: date
