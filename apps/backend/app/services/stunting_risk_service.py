"""
Stunting Risk Prediction Service

Implements early-warning AI for stunting risk over a 3-month horizon using
a Logistic Regression model with hand-tuned coefficients calibrated against
WHO height-for-age z-score conventions.

Pipeline:
  1) extract_features(child, measurements, fies)
  2) predict(features) -> {score, level, dominant_factors}
  3) save_prediction(db, ...)

The LR coefficients live in MODEL_COEFFICIENTS below. They were chosen so
that a child already at HAZ <= -2 with negative growth velocity falls into
the "high" bucket, while a stable child at HAZ >= -1 falls into "low".
Coefficients can be replaced with values learned offline without changing
this module's interface.
"""
from __future__ import annotations

import json
import logging
import math
from dataclasses import dataclass, asdict, field
from datetime import date
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.nutrition import (
    FIESSurvey,
    NutritionMeasurement,
    StuntingRiskPrediction,
)
from app.models.user import Child
from app.services.zscore_calculator import ZScoreCalculator


logger = logging.getLogger(__name__)

MODEL_VERSION = "logreg-v1"
HORIZON_MONTHS = 3

# Risk thresholds (probability of stunting at horizon)
THRESHOLD_MEDIUM = 0.35
THRESHOLD_HIGH = 0.65

# Hardcoded Logistic Regression coefficients (fallback / default).
# Negative weights *reduce* risk (protective factors); positive weights raise
# risk. The intercept biases toward "low" so a healthy default child scores
# well below THRESHOLD_MEDIUM.
#
# These are calibrated against WHO height-for-age z-score conventions: a child
# at HAZ <= -2 with negative growth velocity falls into "high"; a stable child
# at HAZ >= -1 falls into "low".
#
# IMPORTANT: hardcoded coefs only use features that are already standardized
# or bounded (z-scores, deltas, trend, fies, is_male). Raw weight_kg/height_cm/
# age_months/muac_cm/days_since_last are zero-weighted here because they need a
# StandardScaler to be comparable; trained model from train_stunting_model.py
# fills in proper coefs + scaler params (see _load_model below).
#
# To replace with trained weights, run scripts/train_stunting_model.py — the
# loader below auto-picks up stunting_model.json if present.
DEFAULT_COEFFICIENTS: Dict[str, float] = {
    "intercept": -2.00,
    "age_months": 0.0,
    "is_male": 0.10,
    "weight_kg": 0.0,
    "height_cm": 0.0,
    "muac_cm": 0.0,
    "z_score_height": -0.80,        # strongest protective factor
    "z_score_weight": -0.40,
    "delta_z_height": -1.00,        # improving HAZ ⇒ lower risk
    "delta_z_weight": -0.50,
    "days_since_last": 0.0,
    "trend_score": -0.35,           # +1 improving / -1 declining
    "fies_score": 0.18,             # 0..8, higher ⇒ more food insecurity
}

MODEL_FILE = Path(__file__).parent / "stunting_model.json"


def _load_model() -> tuple[Dict[str, float], Optional[Dict[str, float]], Optional[Dict[str, float]], str, float, float]:
    """Load coefficients from stunting_model.json if present, else defaults.

    Returns (coefficients, feature_means, feature_stds, version, threshold_medium, threshold_high).
    feature_means/stds are None when using hardcoded coefs (no scaling needed).
    """
    if not MODEL_FILE.exists():
        return DEFAULT_COEFFICIENTS, None, None, MODEL_VERSION, THRESHOLD_MEDIUM, THRESHOLD_HIGH

    try:
        payload = json.loads(MODEL_FILE.read_text(encoding="utf-8"))
        names = payload["feature_names"]
        coefs_scaled = payload["coefficients_scaled"]
        means = payload["feature_means"]
        stds = payload["feature_stds"]
        intercept = payload["intercept_scaled"]
        thresholds = payload.get("thresholds", {})
        version = payload.get("model_version", "logreg-trained")

        coef_map: Dict[str, float] = {"intercept": float(intercept)}
        mean_map: Dict[str, float] = {}
        std_map: Dict[str, float] = {}
        for name, c, m, s in zip(names, coefs_scaled, means, stds):
            coef_map[name] = float(c)
            mean_map[name] = float(m)
            std_map[name] = float(s)

        logger.info("Loaded trained stunting model: version=%s", version)
        return (
            coef_map,
            mean_map,
            std_map,
            version,
            float(thresholds.get("medium", THRESHOLD_MEDIUM)),
            float(thresholds.get("high", THRESHOLD_HIGH)),
        )
    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:
        logger.warning(
            "Failed to load %s (%s) — falling back to hardcoded coefficients",
            MODEL_FILE.name,
            exc,
        )
        return DEFAULT_COEFFICIENTS, None, None, MODEL_VERSION, THRESHOLD_MEDIUM, THRESHOLD_HIGH


(
    MODEL_COEFFICIENTS,
    FEATURE_MEANS,
    FEATURE_STDS,
    ACTIVE_MODEL_VERSION,
    ACTIVE_THRESHOLD_MEDIUM,
    ACTIVE_THRESHOLD_HIGH,
) = _load_model()

PROTECTIVE_LABELS = {
    "z_score_height": "Z-score tinggi badan baik",
    "z_score_weight": "Z-score berat badan baik",
    "delta_z_height": "Tren Z-score tinggi membaik",
    "delta_z_weight": "Tren Z-score berat membaik",
    "muac_cm": "Lingkar lengan atas sehat",
    "weight_kg": "Berat badan memadai",
    "height_cm": "Tinggi badan memadai",
    "trend_score": "Tren pertumbuhan positif",
}

RISK_LABELS = {
    "z_score_height": "Z-score tinggi badan rendah",
    "z_score_weight": "Z-score berat badan rendah",
    "delta_z_height": "Z-score tinggi menurun",
    "delta_z_weight": "Z-score berat menurun",
    "fies_score": "Ketahanan pangan rumah tangga rendah",
    "days_since_last": "Jeda kunjungan pemantauan terlalu lama",
    "is_male": "Faktor jenis kelamin",
    "age_months": "Umur balita",
    "trend_score": "Tren pertumbuhan menurun",
    "muac_cm": "Lingkar lengan atas kecil",
}


@dataclass
class StuntingFeatures:
    """Feature vector fed into the Logistic Regression model."""

    age_months: int
    is_male: int  # 1 male, 0 female
    weight_kg: float
    height_cm: float
    muac_cm: float
    z_score_weight: float
    z_score_height: float
    delta_z_height: float
    delta_z_weight: float
    days_since_last: float
    trend_score: float          # -1, 0, +1
    fies_score: float           # 0..8
    measurement_id: Optional[str] = None
    measurement_date: Optional[str] = None

    def as_model_input(self) -> Dict[str, float]:
        """Return only the keys the model consumes."""
        return {
            "age_months": float(self.age_months),
            "is_male": float(self.is_male),
            "weight_kg": float(self.weight_kg),
            "height_cm": float(self.height_cm),
            "muac_cm": float(self.muac_cm),
            "z_score_weight": float(self.z_score_weight),
            "z_score_height": float(self.z_score_height),
            "delta_z_height": float(self.delta_z_height),
            "delta_z_weight": float(self.delta_z_weight),
            "days_since_last": float(self.days_since_last),
            "trend_score": float(self.trend_score),
            "fies_score": float(self.fies_score),
        }


def _age_months(dob: date, ref: Optional[date] = None) -> int:
    ref = ref or date.today()
    months = (ref.year - dob.year) * 12 + (ref.month - dob.month)
    return max(0, min(60, months))


def _to_float(value, default: float = 0.0) -> float:
    if value is None:
        return default
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def extract_features(
    child: Child,
    measurements: Sequence[NutritionMeasurement],
    fies: Optional[FIESSurvey] = None,
) -> Optional[StuntingFeatures]:
    """Build a feature vector from the child's measurement history.

    Expects measurements ordered DESC by measurement_date. Returns None when
    no measurements exist.
    """
    if not measurements:
        return None

    latest = measurements[0]
    previous = measurements[1] if len(measurements) >= 2 else None

    ref_date = latest.measurement_date or date.today()
    age_months = _age_months(child.date_of_birth, ref_date)

    gender_value = child.gender.value if child.gender else "male"

    weight_kg = _to_float(latest.weight)
    height_cm = _to_float(latest.height)
    muac_cm = _to_float(latest.muac, default=0.0)

    # Backfill z-scores if missing (older records pre-AI rollout).
    if latest.z_score_weight is None or latest.z_score_height is None:
        zs = ZScoreCalculator.calculate(
            age_months=age_months,
            gender=gender_value,
            weight=weight_kg,
            height=height_cm,
        )
        z_weight = zs["z_score_weight"]
        z_height = zs["z_score_height"]
    else:
        z_weight = _to_float(latest.z_score_weight)
        z_height = _to_float(latest.z_score_height)

    if previous is not None:
        prev_z_weight = _to_float(previous.z_score_weight, default=z_weight)
        prev_z_height = _to_float(previous.z_score_height, default=z_height)
        delta_z_weight = z_weight - prev_z_weight
        delta_z_height = z_height - prev_z_height
        prev_date = previous.measurement_date or ref_date
        days_since_last = max(0, (ref_date - prev_date).days)

        if delta_z_height > 0.3:
            trend_score = 1.0
        elif delta_z_height < -0.3:
            trend_score = -1.0
        else:
            trend_score = 0.0
    else:
        delta_z_weight = 0.0
        delta_z_height = 0.0
        days_since_last = 0.0
        trend_score = 0.0

    fies_score = _to_float(fies.score, default=2.0) if fies else 2.0

    return StuntingFeatures(
        age_months=age_months,
        is_male=1 if gender_value == "male" else 0,
        weight_kg=weight_kg,
        height_cm=height_cm,
        muac_cm=muac_cm,
        z_score_weight=z_weight,
        z_score_height=z_height,
        delta_z_height=delta_z_height,
        delta_z_weight=delta_z_weight,
        days_since_last=float(days_since_last),
        trend_score=trend_score,
        fies_score=fies_score,
        measurement_id=str(latest.id),
        measurement_date=ref_date.isoformat(),
    )


def _sigmoid(x: float) -> float:
    if x >= 0:
        return 1.0 / (1.0 + math.exp(-x))
    e = math.exp(x)
    return e / (1.0 + e)


def _classify(score: float) -> str:
    if score >= ACTIVE_THRESHOLD_HIGH:
        return "high"
    if score >= ACTIVE_THRESHOLD_MEDIUM:
        return "medium"
    return "low"


def _scaled_value(name: str, value: float) -> float:
    """Apply StandardScaler transform if trained model has scaler params."""
    if FEATURE_MEANS is None or FEATURE_STDS is None:
        return value
    mean = FEATURE_MEANS.get(name, 0.0)
    std = FEATURE_STDS.get(name, 1.0) or 1.0
    return (value - mean) / std


def _dominant_factors(
    feature_values: Dict[str, float],
    top_n: int = 3,
) -> List[Dict[str, Any]]:
    """Rank features by absolute contribution to the logit.

    Each contribution = coefficient * (scaled) value. Sign tells whether the
    factor pushed the prediction toward higher or lower risk.
    """
    contributions = []
    for name, coef in MODEL_COEFFICIENTS.items():
        if name == "intercept":
            continue
        raw = feature_values.get(name, 0.0)
        scaled = _scaled_value(name, raw)
        contrib = coef * scaled
        if contrib == 0.0:
            continue
        direction = "risk" if contrib > 0 else "protective"
        label_map = RISK_LABELS if direction == "risk" else PROTECTIVE_LABELS
        contributions.append(
            {
                "name": name,
                "label": label_map.get(name, name),
                "value": round(raw, 3),
                "contribution": round(contrib, 4),
                "direction": direction,
            }
        )

    contributions.sort(key=lambda c: abs(c["contribution"]), reverse=True)
    return contributions[:top_n]


def predict(features: StuntingFeatures) -> Dict[str, Any]:
    """Run the LR model and return score + level + explanation."""
    feature_values = features.as_model_input()

    logit = MODEL_COEFFICIENTS["intercept"]
    for name, coef in MODEL_COEFFICIENTS.items():
        if name == "intercept":
            continue
        raw = feature_values.get(name, 0.0)
        logit += coef * _scaled_value(name, raw)

    score = _sigmoid(logit)
    level = _classify(score)

    return {
        "risk_score": round(score, 4),
        "risk_level": level,
        "horizon_months": HORIZON_MONTHS,
        "model_version": ACTIVE_MODEL_VERSION,
        "dominant_factors": _dominant_factors(feature_values),
        "features": asdict(features),
    }


def predict_for_child(
    db: Session,
    child: Child,
    persist: bool = True,
) -> Optional[Dict[str, Any]]:
    """Pull history, build features, run prediction, optionally persist."""
    measurements = (
        db.query(NutritionMeasurement)
        .filter(NutritionMeasurement.child_id == child.id)
        .order_by(NutritionMeasurement.measurement_date.desc())
        .limit(6)
        .all()
    )
    if not measurements:
        return None

    fies = (
        db.query(FIESSurvey)
        .filter(FIESSurvey.beneficiary_id == child.beneficiary_id)
        .order_by(FIESSurvey.survey_date.desc())
        .first()
    )

    features = extract_features(child, measurements, fies)
    if features is None:
        return None

    result = predict(features)

    if persist:
        record = StuntingRiskPrediction(
            child_id=child.id,
            measurement_id=measurements[0].id,
            risk_score=Decimal(str(result["risk_score"])),
            risk_level=result["risk_level"],
            horizon_months=result["horizon_months"],
            features=result["features"],
            dominant_factors=result["dominant_factors"],
            model_version=result["model_version"],
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        result["id"] = str(record.id)
        result["created_at"] = record.created_at.isoformat()

    return result


def get_latest_prediction(db: Session, child_id: UUID) -> Optional[StuntingRiskPrediction]:
    return (
        db.query(StuntingRiskPrediction)
        .filter(StuntingRiskPrediction.child_id == child_id)
        .order_by(StuntingRiskPrediction.created_at.desc())
        .first()
    )


def list_high_risk(db: Session, limit: int = 50) -> List[StuntingRiskPrediction]:
    """Latest prediction per child, filtered to medium/high risk."""
    rows = (
        db.query(StuntingRiskPrediction)
        .filter(StuntingRiskPrediction.risk_level.in_(["medium", "high"]))
        .order_by(StuntingRiskPrediction.created_at.desc())
        .limit(limit * 4)
        .all()
    )
    seen: set = set()
    result: List[StuntingRiskPrediction] = []
    for row in rows:
        if row.child_id in seen:
            continue
        seen.add(row.child_id)
        result.append(row)
        if len(result) >= limit:
            break
    return result
