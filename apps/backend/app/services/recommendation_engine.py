"""
Recommendation Engine
Rule-based nutrition recommendations based on FIES and Z-Score data
"""
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
import logging

from app.models.nutrition import FIESSurvey, NutritionMeasurement

logger = logging.getLogger(__name__)


class RecommendationEngine:
    @staticmethod
    def generate(
        db: Session,
        beneficiary_id: str,
        child_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate rule-based recommendations based on FIES and nutrition data"""
        recommendations: List[Dict[str, Any]] = []

        # Get latest FIES
        fies = (
            db.query(FIESSurvey)
            .filter(FIESSurvey.beneficiary_id == beneficiary_id)
            .order_by(FIESSurvey.survey_date.desc())
            .first()
        )

        # Get latest measurements for child
        if child_id:
            measurements = (
                db.query(NutritionMeasurement)
                .filter(NutritionMeasurement.child_id == child_id)
                .order_by(NutritionMeasurement.measurement_date.desc())
                .limit(5)
                .all()
            )

            if measurements:
                latest = measurements[0]

                # Height-based recommendations (stunting)
                if latest.z_score_height is not None and float(latest.z_score_height) < -2:
                    severity = "high" if float(latest.z_score_height) < -3 else "medium"
                    recommendations.append({
                        "id": f"rec_height_{latest.id}",
                        "category": "nutrition",
                        "priority": severity,
                        "title": "Dukung Pertumbuhan Tinggi Badan",
                        "description": "Anak menunjukkan tanda-tanda stunting berdasarkan pengukuran terakhir.",
                        "action_items": [
                            "Tingkatkan makanan kaya kalsium (susu, telur, ikan)",
                            "Pastikan tidur cukup (10-12 jam untuk balita)",
                            "Berikan makanan bergizi seimbang setiap hari",
                            "Konsultasikan dengan tenaga kesehatan",
                        ],
                        "based_on": {
                            "z_score_height": float(latest.z_score_height),
                            "classification": latest.classification or "unknown",
                        },
                    })

                # Weight-based recommendations (wasting)
                if latest.z_score_weight is not None and float(latest.z_score_weight) < -2:
                    severity = "high" if float(latest.z_score_weight) < -3 else "medium"
                    recommendations.append({
                        "id": f"rec_weight_{latest.id}",
                        "category": "nutrition",
                        "priority": severity,
                        "title": "Tingkatkan Asupan Protein",
                        "description": "Berat badan anak di bawah standar WHO. Pertimbangkan meningkatkan asupan protein.",
                        "action_items": [
                            "Sertakan telur, ikan, atau ayam dalam makanan harian",
                            "Tambahkan tempe atau tahu sebagai sumber protein",
                            "Berikan susu formula atau UHT secara teratur",
                        ],
                        "based_on": {
                            "z_score_weight": float(latest.z_score_weight),
                            "classification": latest.classification or "unknown",
                        },
                    })

        # FIES-based recommendations
        if fies:
            if fies.score > 5:
                recommendations.append({
                    "id": f"rec_fies_severe_{fies.id}",
                    "category": "food_security",
                    "priority": "high",
                    "title": "Dukungan Ketahanan Pangan",
                    "description": "Skor FIES Anda menunjukkan ketahanan pangan yang buruk. Segera cari bantuan tambahan.",
                    "action_items": [
                        "Hubungi puskesmas atau dinas sosial terdekat",
                        "Daftar untuk alokasi voucher tambahan",
                        "Manfaatkan program bantuan pangan pemerintah",
                    ],
                    "based_on": {
                        "fies_score": fies.score,
                        "classification": fies.classification,
                    },
                })
            elif fies.score > 2:
                recommendations.append({
                    "id": f"rec_fies_moderate_{fies.id}",
                    "category": "food_security",
                    "priority": "medium",
                    "title": "Optimalkan Penggunaan Voucher",
                    "description": "Skor FIES Anda menunjukkan ketahanan pangan sedang. Gunakan voucher untuk pangan bergizi.",
                    "action_items": [
                        "Prioritaskan pembelian protein (telur, ikan, susu)",
                        "Rencanakan menu mingguan untuk memaksimalkan voucher",
                        "Manfaatkan katalog pangan bergizi",
                    ],
                    "based_on": {
                        "fies_score": fies.score,
                        "classification": fies.classification,
                    },
                })

        # Default recommendation if nothing critical
        if not recommendations:
            recommendations.append({
                "id": "rec_general",
                "category": "nutrition",
                "priority": "low",
                "title": "Pertahankan Pola Asuh Gizi Baik",
                "description": "Status gizi anak Anda baik. Terus pertahankan pola makan bergizi seimbang.",
                "action_items": [
                    "Lanjutkan pemberian makanan bergizi seimbang",
                    "Pantau pertumbuhan anak secara berkala",
                    "Isi survei FIES setiap bulan",
                ],
                "based_on": {
                    "status": "all_good",
                },
            })

        next_review = date.today() + timedelta(days=30)

        return {
            "beneficiary_id": beneficiary_id,
            "generated_at": datetime.utcnow(),
            "recommendations": recommendations,
            "next_review_date": next_review,
        }
