"""
Z-Score Calculator Service
WHO Z-Score calculation using growth standards
"""
from typing import Dict, Any
import logging

from app.utils.who_growth_standards import get_who_weight_reference, get_who_height_reference

logger = logging.getLogger(__name__)


class ZScoreCalculator:
    @staticmethod
    def calculate_zscore(measurement: float, median: float, sd: float) -> float:
        """Calculate Z-Score: (measurement - median) / SD"""
        if sd == 0:
            return 0.0
        return round((measurement - median) / sd, 2)

    @staticmethod
    def classify_zscore(z_score: float) -> str:
        """
        Classify Z-Score:
        - Normal: >= -2
        - Moderate malnourished: -3 to -2
        - Severe malnourished: < -3
        """
        if z_score >= -2:
            return "normal"
        elif z_score >= -3:
            return "moderate_malnourished"
        else:
            return "severe_malnourished"

    @staticmethod
    def calculate(
        age_months: int,
        gender: str,
        weight: float,
        height: float,
    ) -> Dict[str, Any]:
        """Calculate Z-Scores for weight and height"""
        weight_ref = get_who_weight_reference(age_months, gender)
        height_ref = get_who_height_reference(age_months, gender)

        z_weight = ZScoreCalculator.calculate_zscore(weight, weight_ref["median"], weight_ref["sd"])
        z_height = ZScoreCalculator.calculate_zscore(height, height_ref["median"], height_ref["sd"])

        return {
            "z_score_weight": z_weight,
            "z_score_height": z_height,
            "weight_classification": ZScoreCalculator.classify_zscore(z_weight),
            "height_classification": ZScoreCalculator.classify_zscore(z_height),
            "who_reference": {
                "weight_median": weight_ref["median"],
                "weight_sd": weight_ref["sd"],
                "height_median": height_ref["median"],
                "height_sd": height_ref["sd"],
            },
        }

    @staticmethod
    def get_growth_chart_data(age_months: int, gender: str) -> Dict[str, Any]:
        """Get WHO reference data for growth chart rendering"""
        weight_ref = get_who_weight_reference(age_months, gender)
        height_ref = get_who_height_reference(age_months, gender)

        return {
            "who_reference": {
                "weight_for_age": {
                    "median": weight_ref["median"],
                    "sd_minus_3": round(weight_ref["median"] - 3 * weight_ref["sd"], 2),
                    "sd_minus_2": round(weight_ref["median"] - 2 * weight_ref["sd"], 2),
                    "sd_plus_2": round(weight_ref["median"] + 2 * weight_ref["sd"], 2),
                },
                "height_for_age": {
                    "median": height_ref["median"],
                    "sd_minus_3": round(height_ref["median"] - 3 * height_ref["sd"], 2),
                    "sd_minus_2": round(height_ref["median"] - 2 * height_ref["sd"], 2),
                    "sd_plus_2": round(height_ref["median"] + 2 * height_ref["sd"], 2),
                },
            },
            "trend": "stable",
        }
