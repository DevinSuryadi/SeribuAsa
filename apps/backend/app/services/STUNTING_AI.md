# Stunting Risk AI

Early-warning model for child stunting risk over a 3-month horizon.

## Runtime Flow

```text
POST /nutrition/measurements
  -> calculate WHO-style z-scores
  -> stunting_risk_service.predict_for_child()
  -> persist StuntingRiskPrediction
  -> frontend reads /nutrition/risk/beneficiary/me
```

The backend runtime uses `app/services/stunting_risk_service.py`. It loads:

- `app/services/stunting_model.json` when present;
- fallback hardcoded coefficients if the JSON is missing or invalid.

The runtime has no sklearn/numpy/pandas dependency. It performs a pure-Python
standardization, dot product, and sigmoid.

## Training Assets

Training files are stored separately from runtime code:

- `apps/backend/ml/stunting/train_stunting_model.ipynb`
- `apps/backend/ml/stunting/artifacts/stunting_model.json`
- `apps/backend/ml/stunting/artifacts/stunting_model_metrics.json`

The notebook also writes a runtime copy to:

- `apps/backend/app/services/stunting_model.json`

Restart the backend after exporting a new runtime model.

## Inputs

The model consumes the same fields available from the application:

| Feature | Source |
| --- | --- |
| `age_months` | child date of birth and measurement date |
| `is_male` | child gender |
| `weight_kg` | latest measurement, retained for runtime compatibility |
| `height_cm` | latest measurement, retained for runtime compatibility |
| `muac_cm` | latest measurement, optional, defaults to `0.0` |
| `z_score_weight` | calculated by `ZScoreCalculator` |
| `z_score_height` | calculated by `ZScoreCalculator` |
| `delta_z_height` | latest HAZ minus previous HAZ |
| `delta_z_weight` | latest WAZ minus previous WAZ |
| `days_since_last` | days between latest and previous measurement |
| `trend_score` | `1`, `0`, or `-1` from HAZ trend |
| `fies_score` | latest FIES score, default `2.0` |

The current trained model excludes raw `weight_kg` and `height_cm` from
learning by exporting zero coefficients for both. Z-scores already encode the
age/sex-adjusted anthropometric signal more safely.

## Risk Buckets

```text
score < 0.35         -> low
0.35 <= score < 0.65 -> medium
score >= 0.65        -> high
```

## Current Model

Current runtime model:

- version: `logreg-v3-id-synthetic-calibrated`
- synthetic target future stunting rate: `21.5%`
- horizon label: `future_z_score_height < -2` after simulated 3-month growth
- test AUC from metrics artifact: about `0.978`

This is a supervised machine-learning model trained on synthetic Indonesian
demo data. It is suitable for application prototyping and academic
demonstration, but not a clinical diagnostic model. Replace or recalibrate it
with real local Posyandu/Puskesmas data before using it for health decisions.

## API

- `GET /api/v1/nutrition/risk/beneficiary/me`
- `GET /api/v1/nutrition/risk/high-risk`
- `GET /api/v1/nutrition/risk/{child_id}`
- `POST /api/v1/nutrition/risk/{child_id}/recompute`
- `GET /api/v1/nutrition/risk/{child_id}/history`

