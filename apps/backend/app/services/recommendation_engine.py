"""
Recommendation Engine
Rule-based nutrition recommendations based on FIES and Z-Score data
"""
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
import logging

from app.models.nutrition import FIESSurvey, NutritionMeasurement
from app.models.user import Child

logger = logging.getLogger(__name__)


class RecommendationEngine:
    @staticmethod
    def generate_for_family(
        fies: Optional[FIESSurvey],
        child_facts: List[tuple[Child, Optional[NutritionMeasurement]]],
    ) -> List[Dict[str, Any]]:
        """Adapt the existing FIES/growth rules to a facility's family record.

        These are review prompts, not product prescriptions or clinical diagnoses.
        """
        recommendations: List[Dict[str, Any]] = []

        if fies and fies.score > 2:
            severe = fies.score > 5
            recommendations.append({
                "id": f"family_fies_{fies.id}",
                "category": "food_security",
                "priority": "high" if severe else "medium",
                "title": "Tinjau akses pangan keluarga",
                "description": f"Skor FIES terakhir {fies.score}/8. Tinjau hambatan keluarga dalam memperoleh pangan yang cukup dan bergizi.",
                "action_items": [
                    "Konfirmasi kondisi pangan dan jumlah anggota keluarga",
                    "Susun kebutuhan bantuan pangan yang sesuai kondisi keluarga",
                    "Tinjau kembali kondisi pada asesmen berikutnya",
                ],
                "based_on": {"fies_survey_id": str(fies.id), "fies_score": fies.score},
            })

        for child, measurement in child_facts:
            if measurement is None:
                continue
            for metric, score, title in (
                ("height", measurement.z_score_height, "tinggi badan"),
                ("weight", measurement.z_score_weight, "berat badan"),
            ):
                if score is None or float(score) >= -2:
                    continue
                recommendations.append({
                    "id": f"family_{metric}_{measurement.id}",
                    "category": "nutrition",
                    "priority": "high" if float(score) < -3 else "medium",
                    "title": f"Tinjau pertumbuhan {title} {child.full_name}",
                    "description": f"Z-score {title} pada pengukuran {measurement.measurement_date.isoformat()} berada di bawah -2. Verifikasi hasil dan tentukan tindak lanjut oleh fasilitas kesehatan.",
                    "action_items": [
                        "Periksa ulang pengukuran dan riwayat pertumbuhan",
                        "Tentukan dukungan pangan sesuai usia dan kondisi anak",
                        "Jadwalkan pemantauan berikutnya",
                    ],
                    "based_on": {
                        "child_id": str(child.id),
                        "measurement_id": str(measurement.id),
                        "z_score": float(score),
                    },
                })

        if not recommendations and (fies or any(measurement for _, measurement in child_facts)):
            recommendations.append({
                "id": "family_monitoring",
                "category": "monitoring",
                "priority": "low",
                "title": "Lanjutkan pemantauan keluarga",
                "description": "Data terbaru belum memunculkan prioritas dari aturan ini. Tetap tinjau kondisi keluarga secara berkala.",
                "action_items": [
                    "Perbarui survei FIES secara berkala",
                    "Catat pengukuran pertumbuhan anak berikutnya",
                ],
                "based_on": {"status": "no_rule_triggered"},
            })

        return recommendations

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
