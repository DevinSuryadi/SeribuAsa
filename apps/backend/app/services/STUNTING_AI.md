# Stunting Risk AI — Module Overview

Early-warning AI for child stunting risk over a 3-month horizon. Logistic
Regression on 12 features (biological + growth history + food security).

## Architecture

```
[measurement input] → extract_features → predict() → score + level + factors
                                              ↓
                                  StuntingRiskPrediction (DB)
```

- **Service**: `app/services/stunting_risk_service.py` — pure-python sigmoid + dot product. Zero ML deps at runtime.
- **API**: `app/api/nutrition.py` — `/nutrition/risk/{child_id}`, `/recompute`, `/history`, `/beneficiary/me`, `/high-risk`.
- **Frontend**: `apps/frontend/src/components/dashboard/StuntingRiskCard.tsx`.
- **Auto-trigger**: every `POST /nutrition/measurements` runs `predict_for_child` post-insert.

## Feature Vector (12 dim)

| Name | Source | Notes |
|------|--------|-------|
| `age_months` | child DOB | clipped 0..60 |
| `is_male` | child.gender | 0/1 |
| `weight_kg` | latest measurement | raw |
| `height_cm` | latest measurement | raw |
| `muac_cm` | latest measurement | raw, 0 if missing |
| `z_score_weight` | WAZ via `ZScoreCalculator` | |
| `z_score_height` | HAZ via `ZScoreCalculator` | strongest predictor |
| `delta_z_height` | HAZ(t) − HAZ(t-1) | growth velocity |
| `delta_z_weight` | WAZ(t) − WAZ(t-1) | |
| `days_since_last` | gap between visits | |
| `trend_score` | +1 / 0 / −1 derived from `delta_z_height` | |
| `fies_score` | latest `FIESSurvey.score` | 0..8, default 2 |

Order in `train_stunting_model.py:FEATURE_NAMES` MUST match
`StuntingFeatures.as_model_input()` keys.

## Risk Classification

```
score < 0.35           → low
0.35 ≤ score < 0.65    → medium
score ≥ 0.65           → high
```

Thresholds in `THRESHOLD_MEDIUM` / `THRESHOLD_HIGH` (overridable via trained
model JSON).

## Model State

**Currently using hardcoded coefficients** (`DEFAULT_COEFFICIENTS`).

Calibration anchors:
- HAZ ≤ -2 + declining trend + low FIES → ~0.88 (high)
- HAZ ≈ -1.5 stable + mid FIES → ~0.58 (medium)
- HAZ ≈ 0 healthy → ~0.14 (low)

Hardcoded coefs zero out raw scale features (`weight_kg`, `height_cm`,
`age_months`, `muac_cm`, `days_since_last`) because they need a StandardScaler
to be comparable. Trained model fills these in with proper scaler params.

## Retraining (Optional)

When ready to replace hardcoded coefs with synthetic-trained ones:

```bash
cd apps/backend
pip install numpy==1.26.4 scikit-learn==1.4.2 pandas==2.2.2
python -m scripts.train_stunting_model --n-samples 10000 --seed 42
```

Outputs:
- `app/services/stunting_model.json` — coefs + scaler params + thresholds
- `app/services/stunting_model_metrics.json` — AUC / F1 / confusion matrix

Service auto-detects `stunting_model.json` on next import. No code change
needed. If load fails, falls back to `DEFAULT_COEFFICIENTS` with a warning log.

## Dev / Deploy Notes

- Runtime: only `math` from stdlib (sigmoid). Zero ML deps in `requirements.txt`.
- `numpy/sklearn/pandas` are dev-only — needed only when retraining locally.
- Synthetic data NOT committed. Reproducible via `--seed 42`.
- Model JSON IS committed (~5KB, audit-friendly).

## Testing

```bash
./venv/Scripts/python.exe -c "
from app.services.stunting_risk_service import predict, StuntingFeatures
f = StuntingFeatures(age_months=24, is_male=1, weight_kg=10.5, height_cm=80,
    muac_cm=13.2, z_score_weight=-1.2, z_score_height=-2.1,
    delta_z_height=-0.4, delta_z_weight=-0.2, days_since_last=90,
    trend_score=-1.0, fies_score=5)
print(predict(f))
"
```

Expected `risk_level: high` for HAZ ≤ -2 declining profile.
