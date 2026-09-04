"""
Stunting Risk Model — Synthetic Training Pipeline
==================================================

End-to-end script that generates a synthetic balita cohort, trains a
Logistic Regression model to predict 3-month-ahead stunting risk, evaluates
the model, and exports coefficients to JSON for runtime inference.

USAGE
-----
    cd apps/backend
    python -m scripts.train_stunting_model
    # or with custom params
    python -m scripts.train_stunting_model --n-samples 20000 --seed 42

OUTPUTS (committed to git)
--------------------------
    apps/backend/ml/stunting/artifacts/stunting_model.json          — training copy
    apps/backend/ml/stunting/artifacts/stunting_model_metrics.json  — eval report
    apps/backend/app/services/stunting_model.json                   — runtime copy

DATA HANDLING
-------------
Synthetic data is regenerated on-demand using a fixed numpy seed for
reproducibility. The dataset is NOT committed — anyone with the script
gets identical samples by re-running it.

LABEL CONSTRUCTION
------------------
Stunting label at t+3mo is generated probabilistically (sigmoid of a hidden
risk-causing rule with noise). This avoids circular learning where the
model perfectly recovers a deterministic rule.

WHY THIS DESIGN
---------------
- LR with ~12 features needs O(1k) samples to converge; 10k gives stable
  coefficient estimates and tight CI.
- JSON export keeps runtime lean: backend loads 13 floats, no sklearn at
  request time.
- Reproducibility via seed = audit-friendly + identical re-train per run.
"""
from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.preprocessing import StandardScaler


# ---------------------------------------------------------------------------
# Configuration — feature order MUST match runtime extractor.
# ---------------------------------------------------------------------------
FEATURE_NAMES: List[str] = [
    "age_months",
    "is_male",
    "weight_kg",
    "height_cm",
    "muac_cm",
    "z_score_weight",
    "z_score_height",
    "delta_z_height",
    "delta_z_weight",
    "days_since_last",
    "trend_score",
    "fies_score",
]

BACKEND_DIR = Path(__file__).resolve().parents[1]
SERVICE_DIR = BACKEND_DIR / "app" / "services"
ARTIFACT_DIR = BACKEND_DIR / "ml" / "stunting" / "artifacts"
MODEL_FILE = ARTIFACT_DIR / "stunting_model.json"
METRICS_FILE = ARTIFACT_DIR / "stunting_model_metrics.json"
RUNTIME_MODEL_FILE = SERVICE_DIR / "stunting_model.json"

THRESHOLD_MEDIUM = 0.35
THRESHOLD_HIGH = 0.65
MODEL_VERSION = "logreg-v2-synthetic"


# ---------------------------------------------------------------------------
# Synthetic data generator
# ---------------------------------------------------------------------------
@dataclass
class CohortConfig:
    n_samples: int = 10_000
    seed: int = 42
    stunted_baseline_rate: float = 0.21  # WHO Indonesia ~21% prevalence


def _who_weight_median(age_months: np.ndarray, is_male: np.ndarray) -> np.ndarray:
    """Approx WHO weight-for-age median (kg). Linear-piecewise fit."""
    base = np.where(
        age_months < 6,
        3.3 + age_months * 0.7,
        np.where(
            age_months < 24,
            7.5 + (age_months - 6) * 0.22,
            11.5 + (age_months - 24) * 0.18,
        ),
    )
    return base + is_male * 0.3


def _who_height_median(age_months: np.ndarray, is_male: np.ndarray) -> np.ndarray:
    """Approx WHO height-for-age median (cm). Linear-piecewise fit."""
    base = np.where(
        age_months < 6,
        50 + age_months * 2.8,
        np.where(
            age_months < 24,
            66 + (age_months - 6) * 1.1,
            85 + (age_months - 24) * 0.7,
        ),
    )
    return base + is_male * 0.6


def generate_cohort(cfg: CohortConfig) -> pd.DataFrame:
    """Build a synthetic balita dataset.

    Each row = a single measurement event with derived history features.
    Produces realistic correlations: low FIES → poorer growth → lower z-scores
    → higher stunting risk at horizon.
    """
    rng = np.random.default_rng(cfg.seed)
    n = cfg.n_samples

    age_months = rng.integers(0, 60, size=n)
    is_male = rng.integers(0, 2, size=n)

    # Latent socio-economic factor: drives FIES, growth shortfall, follow-up gap.
    ses = rng.normal(0, 1, size=n)
    fies_raw = 4 + 1.6 * ses + rng.normal(0, 1, size=n)
    fies_score = np.clip(np.round(fies_raw), 0, 8).astype(int)

    # Growth deviation from WHO median driven by SES + random.
    weight_median = _who_weight_median(age_months, is_male)
    height_median = _who_height_median(age_months, is_male)

    weight_noise = rng.normal(0, 0.9, size=n) - 0.35 * ses
    height_noise = rng.normal(0, 2.4, size=n) - 0.9 * ses

    weight_kg = np.maximum(2.0, weight_median + weight_noise)
    height_cm = np.maximum(45.0, height_median + height_noise)
    muac_cm = np.clip(13.5 + (weight_kg - weight_median) * 0.6 + rng.normal(0, 0.6, n), 9, 18)

    # Z-scores using fixed approximate SDs (good enough for synthetic).
    weight_sd = 1.05
    height_sd = 3.2
    z_score_weight = (weight_kg - weight_median) / weight_sd
    z_score_height = (height_cm - height_median) / height_sd

    # History: previous visit deltas. Children with bad SES tend to decline.
    delta_z_height = rng.normal(0, 0.4, size=n) - 0.18 * np.maximum(0, ses) * (-1)
    delta_z_height = rng.normal(-0.05 * ses, 0.4, size=n)
    delta_z_weight = rng.normal(-0.04 * ses, 0.35, size=n)

    days_since_last = np.clip(
        rng.normal(70 + 18 * np.maximum(0, ses), 25, size=n), 14, 365
    ).astype(int)

    trend_score = np.where(
        delta_z_height > 0.3, 1.0, np.where(delta_z_height < -0.3, -1.0, 0.0)
    )

    df = pd.DataFrame(
        {
            "age_months": age_months,
            "is_male": is_male,
            "weight_kg": weight_kg.round(2),
            "height_cm": height_cm.round(1),
            "muac_cm": muac_cm.round(2),
            "z_score_weight": z_score_weight.round(3),
            "z_score_height": z_score_height.round(3),
            "delta_z_height": delta_z_height.round(3),
            "delta_z_weight": delta_z_weight.round(3),
            "days_since_last": days_since_last,
            "trend_score": trend_score,
            "fies_score": fies_score.astype(float),
        }
    )

    # Probabilistic stunting label at t+3mo. Hidden rule blends z-scores,
    # growth velocity, food insecurity, age. Sigmoid + Bernoulli sample.
    logit = (
        -1.4
        - 1.05 * z_score_height
        - 0.55 * z_score_weight
        - 1.10 * delta_z_height
        - 0.50 * delta_z_weight
        + 0.20 * (fies_score - 2)
        + 0.012 * age_months
        + 0.10 * is_male
        - 0.18 * (muac_cm - 13.5)
        + 0.004 * days_since_last
        - 0.30 * trend_score
        + rng.normal(0, 0.4, size=n)  # irreducible noise
    )
    prob = 1.0 / (1.0 + np.exp(-logit))
    df["label"] = (rng.random(size=n) < prob).astype(int)

    actual_rate = df["label"].mean()
    print(f"[data] synthesized {n} samples, stunted rate = {actual_rate:.1%}")

    return df


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------
def train(df: pd.DataFrame, seed: int) -> Tuple[LogisticRegression, StandardScaler, Dict]:
    X = df[FEATURE_NAMES].to_numpy(dtype=float)
    y = df["label"].to_numpy(dtype=int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=seed
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train, test_size=0.15, stratify=y_train, random_state=seed
    )

    print(f"[split] train={len(X_train)} val={len(X_val)} test={len(X_test)}")

    # Scale features so coefficients are comparable + sklearn solver stable.
    # We export the SCALED coefs along with mean/scale; runtime applies the
    # same transform via stored scaler params (no sklearn dep at runtime).
    scaler = StandardScaler().fit(X_train)
    X_train_s = scaler.transform(X_train)
    X_val_s = scaler.transform(X_val)
    X_test_s = scaler.transform(X_test)

    grid = GridSearchCV(
        LogisticRegression(max_iter=2000, class_weight="balanced", solver="liblinear"),
        param_grid={"C": [0.1, 0.5, 1.0, 2.0, 5.0], "penalty": ["l2"]},
        scoring="roc_auc",
        cv=5,
        n_jobs=-1,
    )
    grid.fit(X_train_s, y_train)
    model: LogisticRegression = grid.best_estimator_
    print(f"[tune ] best C={grid.best_params_['C']} cv_auc={grid.best_score_:.4f}")

    # Eval on val + test (only test reported to skripsi; val for sanity).
    val_pred = model.predict_proba(X_val_s)[:, 1]
    test_pred = model.predict_proba(X_test_s)[:, 1]
    test_label = (test_pred >= 0.5).astype(int)

    metrics = {
        "val_auc": float(roc_auc_score(y_val, val_pred)),
        "test_auc": float(roc_auc_score(y_test, test_pred)),
        "test_accuracy": float(accuracy_score(y_test, test_label)),
        "test_precision": float(precision_score(y_test, test_label, zero_division=0)),
        "test_recall": float(recall_score(y_test, test_label, zero_division=0)),
        "test_f1": float(f1_score(y_test, test_label, zero_division=0)),
        "confusion_matrix": confusion_matrix(y_test, test_label).tolist(),
        "classification_report": classification_report(
            y_test, test_label, target_names=["not_stunted", "stunted"], output_dict=True
        ),
        "best_C": grid.best_params_["C"],
        "cv_best_auc": float(grid.best_score_),
    }
    print(
        "[eval ] "
        f"AUC={metrics['test_auc']:.3f} "
        f"F1={metrics['test_f1']:.3f} "
        f"P={metrics['test_precision']:.3f} "
        f"R={metrics['test_recall']:.3f}"
    )

    return model, scaler, metrics


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------
def export_model(
    model: LogisticRegression,
    scaler: StandardScaler,
    metrics: Dict,
    cfg: CohortConfig,
) -> None:
    """Dump model artifacts and deploy a runtime copy:
      apps/backend/ml/stunting/artifacts/stunting_model.json
      apps/backend/ml/stunting/artifacts/stunting_model_metrics.json
      apps/backend/app/services/stunting_model.json
    """
    coef = model.coef_.flatten().tolist()
    intercept = float(model.intercept_[0])
    means = scaler.mean_.tolist()
    stds = scaler.scale_.tolist()

    feature_importance = sorted(
        [
            {"name": name, "coef_scaled": float(c), "abs": abs(float(c))}
            for name, c in zip(FEATURE_NAMES, coef)
        ],
        key=lambda x: x["abs"],
        reverse=True,
    )

    payload = {
        "model_version": MODEL_VERSION,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "horizon_months": 3,
        "feature_names": FEATURE_NAMES,
        "coefficients_scaled": coef,
        "intercept_scaled": intercept,
        "feature_means": means,
        "feature_stds": stds,
        "thresholds": {
            "medium": THRESHOLD_MEDIUM,
            "high": THRESHOLD_HIGH,
        },
        "training": {
            "n_samples": cfg.n_samples,
            "seed": cfg.seed,
            "best_C": metrics["best_C"],
            "cv_best_auc": metrics["cv_best_auc"],
        },
        "feature_importance": feature_importance,
    }

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    SERVICE_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    RUNTIME_MODEL_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    METRICS_FILE.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    print(f"[save ] {MODEL_FILE.relative_to(Path.cwd()) if MODEL_FILE.is_relative_to(Path.cwd()) else MODEL_FILE}")
    print(f"[save ] {RUNTIME_MODEL_FILE.relative_to(Path.cwd()) if RUNTIME_MODEL_FILE.is_relative_to(Path.cwd()) else RUNTIME_MODEL_FILE}")
    print(f"[save ] {METRICS_FILE.relative_to(Path.cwd()) if METRICS_FILE.is_relative_to(Path.cwd()) else METRICS_FILE}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(description="Train stunting risk LR model.")
    parser.add_argument("--n-samples", type=int, default=10_000)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    cfg = CohortConfig(n_samples=args.n_samples, seed=args.seed)

    print("=" * 60)
    print("Stunting Risk Model — synthetic training pipeline")
    print("=" * 60)
    df = generate_cohort(cfg)
    model, scaler, metrics = train(df, seed=cfg.seed)
    export_model(model, scaler, metrics, cfg)

    print()
    print("Top features (by |coef_scaled|):")
    for f in sorted(
        zip(FEATURE_NAMES, model.coef_.flatten()),
        key=lambda x: abs(x[1]),
        reverse=True,
    )[:5]:
        print(f"   {f[0]:<20} {f[1]:+.4f}")
    print()
    print("Done. Commit stunting_model.json to deploy the new weights.")


if __name__ == "__main__":
    main()
