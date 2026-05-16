# Fitur AI: Stunting Risk Prediction (Early Warning System)

> Sistem peringatan dini berbasis AI untuk memprediksi risiko stunting balita 3 bulan ke depan.
> Bagian dari platform NutriGuard.

---

## 1. Ringkasan Fitur

### 1.1 Tujuan

Memberikan peringatan dini ke beneficiary (orang tua/wali) dan admin/government tentang anak-anak yang berisiko mengalami stunting dalam 3 bulan ke depan, agar intervensi gizi bisa dilakukan **sebelum** kondisi memburuk.

### 1.2 Alur Tingkat Tinggi

```
Beneficiary input pengukuran (BB/TB/MUAC)
            ↓
   Z-score dihitung (WHO standards)
            ↓
   AI inference (Logistic Regression)
            ↓
   Output: risk_score (0..1) + level (low/medium/high) + faktor dominan
            ↓
   Disimpan ke DB (audit trail)
            ↓
   ┌──────────────┴──────────────┐
   ↓                             ↓
Beneficiary Dashboard        Admin Dashboard
(widget per anak)          (list high-risk priority)
```

### 1.3 Hasil yang Diberikan ke User

Per anak, AI mengembalikan:

| Field | Tipe | Penjelasan |
|---|---|---|
| `risk_score` | 0..1 | Probabilitas stunting dalam 3 bulan |
| `risk_level` | low / medium / high | Klasifikasi 3 tier |
| `dominant_factors` | array (top 3) | Faktor paling berpengaruh + arah (risk/protective) + label Indonesia |
| `horizon_months` | 3 | Jendela prediksi (bulan) |
| `model_version` | string | Versi model yang dipakai |

Threshold klasifikasi:

```
score < 0.35           → low
0.35 ≤ score < 0.65    → medium
score ≥ 0.65           → high
```

---

## 2. Model AI

### 2.1 Algoritma: Logistic Regression

**Pilihan dibanding alternatif:**

| Algoritma | Kelebihan | Kekurangan | Verdict |
|---|---|---|---|
| **Logistic Regression** | Interpretable, koefisien jelas, ringan, cocok skripsi | Linear assumption | ✅ Dipilih |
| Random Forest | Non-linear | Sulit interpret, runtime berat | ❌ |
| XGBoost | Akurasi tinggi | Overkill untuk 12 fitur, runtime berat | ❌ |
| Neural Network | Deep features | Overfitting di dataset kecil, tidak interpretable | ❌ |

**Alasan pilih LR:**
1. **Interpretable** — koefisien tiap fitur bisa langsung dijelaskan ("HAZ rendah → risiko naik")
2. **Audit-friendly** — examiner skripsi bisa verifikasi formula
3. **Lean runtime** — sigmoid + dot product, zero ML deps di production
4. **Cukup untuk 12 fitur** — non-linearity tidak dibutuhkan untuk causal chain yang sudah jelas

### 2.2 Formula

```
logit = intercept + Σ (coefficient_i × feature_i)
score = sigmoid(logit) = 1 / (1 + exp(-logit))
level = classify(score, thresholds)
```

Untuk model trained: tiap feature di-standardize dulu via StandardScaler:
```
feature_i_scaled = (feature_i - mean_i) / std_i
```

### 2.3 Feature Vector (12 dimensi)

| # | Nama | Sumber | Tipe | Justifikasi |
|---|---|---|---|---|
| 1 | `age_months` | DOB anak | int 0..60 | Umur = exposure cumulative |
| 2 | `is_male` | child.gender | 0/1 | Boys higher prevalence per WHO |
| 3 | `weight_kg` | latest measurement | float | Raw biological |
| 4 | `height_cm` | latest measurement | float | Raw biological |
| 5 | `muac_cm` | latest measurement | float | Mid-Upper Arm Circumference (acute malnutrition) |
| 6 | `z_score_weight` | WAZ via WHO | float | Weight-for-age |
| 7 | `z_score_height` | HAZ via WHO | float | Height-for-age (paling kuat) |
| 8 | `delta_z_height` | HAZ(t) - HAZ(t-1) | float | Growth velocity tinggi |
| 9 | `delta_z_weight` | WAZ(t) - WAZ(t-1) | float | Growth velocity berat |
| 10 | `days_since_last` | gap visit | int | Pemantauan jarang = risiko |
| 11 | `trend_score` | derived dari delta HAZ | -1/0/+1 | Diskrit untuk interpretability |
| 12 | `fies_score` | latest FIESSurvey.score | 0..8 | Food insecurity rumah tangga |

**3 kategori fitur:**
- **Biologis** (1-5): kondisi anak saat ini
- **Riwayat pertumbuhan** (6-11): tren historis
- **Lingkungan** (12): konteks rumah tangga

### 2.4 Output Probabilistic

Sigmoid memberikan probabilitas terkalibrasi (0..1) bukan binary 0/1. Threshold 3-tier (low/medium/high) memberikan nuansa untuk decision-making admin daripada binary stunted/normal.

---

## 3. Data: Synthetic Cohort

### 3.1 Kenapa Synthetic?

1. **Real data belum tersedia** — DB `nutrition_measurements` masih kosong di staging
2. **Privacy-safe** — tidak ada PII anak asli di skripsi atau repo
3. **Reproducible** — `seed=42` selalu menghasilkan data identik
4. **Audit-friendly** — examiner bisa generate ulang & verify

### 3.2 Generator (Latent SES Model)

**Konsep:** ada faktor laten **socio-economic status (SES)** yang menggerakkan multiple observed variables (FIES, growth deviation, follow-up gap). Ini meniru causal chain di literatur:

```
SES rendah → Food Insecurity tinggi → Asupan gizi kurang → Pertumbuhan terhambat → Stunting
```

**Generator pseudocode:**

```python
rng = np.random.default_rng(seed=42)
n = 10_000

# Demografis
age_months = rng.integers(0, 60, size=n)
is_male = rng.integers(0, 2, size=n)

# Latent factor
ses = rng.normal(0, 1, size=n)

# Observed: FIES dipengaruhi SES
fies_score = clip(round(4 + 1.6 * ses + noise), 0, 8)

# Anthropometric: deviate dari WHO median, biased oleh SES
weight_median = WHO_weight_median(age_months, is_male)
height_median = WHO_height_median(age_months, is_male)
weight_kg = max(2.0, weight_median + noise - 0.35 * ses)
height_cm = max(45.0, height_median + noise - 0.9 * ses)

# Z-scores via fixed approximate SDs
z_score_weight = (weight_kg - weight_median) / 1.05
z_score_height = (height_cm - height_median) / 3.2

# Historical: anak SES rendah cenderung decline
delta_z_height = rng.normal(-0.05 * ses, 0.4)
delta_z_weight = rng.normal(-0.04 * ses, 0.35)

# Visit gap: SES rendah → gap lebih panjang
days_since_last = clip(normal(70 + 18 * max(0, ses), 25), 14, 365)
```

### 3.3 Label Generator (Probabilistic)

**Penting:** label `stunted=1/0` dibuat **probabilistic** lewat sigmoid + Bernoulli sampling. Ini mencegah model **belajar circular rule** (kalau label deterministic, LR akan recover rule 100% — tidak realistic).

```python
logit = (-1.4
         - 1.05 * z_score_height       # HAZ rendah → risiko naik
         - 0.55 * z_score_weight       # WAZ rendah → risiko naik
         - 1.10 * delta_z_height       # growth menurun → risiko naik
         - 0.50 * delta_z_weight
         + 0.20 * (fies_score - 2)     # food insecure → risiko naik
         + 0.012 * age_months          # umur cumulative
         + 0.10 * is_male              # gender bias
         - 0.18 * (muac_cm - 13.5)     # MUAC kecil → risiko naik
         + 0.004 * days_since_last     # gap besar → risiko naik
         - 0.30 * trend_score          # trend positif → protective
         + rng.normal(0, 0.4))         # irreducible noise

prob = sigmoid(logit)
label = (rng.random() < prob)         # Bernoulli sample
```

### 3.4 Validitas Statistik

| Aspek | Validasi |
|---|---|
| Stunting prevalence baseline | ~21% (match data Indonesia Riskesdas) |
| WHO median curves | Real, piecewise linear approximation |
| Causal chain SES → FIES → growth | Match literatur (Black et al. 2013) |
| Label noise | sigma=0.4 → AUC ceiling ~0.85 (realistic) |

### 3.5 Kenapa 10.000 Sample?

- LR dengan 12 fitur butuh O(1k) untuk converge
- 10k → tight CI di koefisien (±0.05)
- Stratified split: 80/20 (train+val) / test, lalu 85/15 (train) / val
- Class-balanced training (`class_weight='balanced'`)

Bisa dinaikkan ke 50k kalau butuh tighter metrics — runtime tetap di bawah 5 detik.

---

## 4. Training Pipeline

### 4.1 Workflow

```
synthetic data (10k samples)
        ↓
StandardScaler (fit pada train)
        ↓
GridSearchCV (5-fold CV, scoring=AUC)
   C ∈ {0.1, 0.5, 1.0, 2.0, 5.0}
        ↓
Best estimator → train(X_train_scaled, y_train)
        ↓
Eval on validation set (sanity check)
        ↓
Eval on test set (reportable metrics)
        ↓
Export coefficients + scaler params + thresholds → JSON
```

### 4.2 Hyperparameter Search

```python
GridSearchCV(
    LogisticRegression(max_iter=2000, class_weight='balanced', solver='liblinear'),
    param_grid={'C': [0.1, 0.5, 1.0, 2.0, 5.0], 'penalty': ['l2']},
    scoring='roc_auc',
    cv=5,
    n_jobs=-1,
)
```

- **L2 regularization** — mencegah overfitting
- **Class-balanced** — handle imbalance (~21% stunted)
- **AUC scoring** — robust terhadap threshold choice
- **5-fold CV** — stable estimate pada 10k samples

### 4.3 Reported Metrics

Test set (held-out, 2k samples):
- AUC, Accuracy, Precision, Recall, F1
- Confusion matrix
- Per-class classification report (`not_stunted`, `stunted`)

Saved ke `stunting_model_metrics.json` untuk audit skripsi.

### 4.4 Eksekusi: 2 Cara

**A. Lokal (butuh install deps):**
```bash
cd apps/backend
pip install numpy==1.26.4 scikit-learn==1.4.2 pandas==2.2.2
python -m scripts.train_stunting_model --n-samples 10000 --seed 42
```

**B. Colab (recommended — zero local deps):**
1. Upload `colab/train_stunting_model.ipynb` ke Google Colab
2. `Runtime → Run all` (~1 menit)
3. Cell terakhir auto-download `stunting_model.json` + metrics
4. Move `stunting_model.json` ke `apps/backend/app/services/`
5. Restart backend → service auto-detect

Detail di `colab/README.md`.

---

## 5. Deployment & Runtime

### 5.1 Strategi: JSON Artifact

Model di-export sebagai **JSON file**, bukan pickle. Alasan:

- **Audit-friendly** — koefisien bisa dibaca manusia, dimasukkan ke skripsi
- **No version coupling** — tidak terikat versi sklearn
- **Lean runtime** — backend tidak butuh sklearn, cuma `math.exp` dari stdlib
- **Diff-friendly** — git diff antar versi model jelas terbaca

### 5.2 Skema `stunting_model.json`

```json
{
  "model_version": "logreg-v2-synthetic",
  "trained_at": "2026-05-16T...",
  "horizon_months": 3,
  "feature_names": ["age_months", "is_male", ...],
  "coefficients_scaled": [0.012, 0.10, ...],
  "intercept_scaled": -1.40,
  "feature_means": [29.5, 0.5, ...],
  "feature_stds": [17.3, 0.5, ...],
  "thresholds": {"medium": 0.35, "high": 0.65},
  "training": {"n_samples": 10000, "seed": 42, "best_C": 1.0, "cv_best_auc": 0.812},
  "feature_importance": [{"name": "z_score_height", "coef_scaled": -0.94, "abs": 0.94}, ...]
}
```

### 5.3 Service Auto-Loader

`apps/backend/app/services/stunting_risk_service.py:_load_model()`:

```
At module import:
  if stunting_model.json EXISTS:
      load coefs + scaler params + thresholds
      version = JSON.model_version
  else:
      use DEFAULT_COEFFICIENTS (hardcoded fallback)
      version = "logreg-v1"
```

**Fallback design** memastikan service tetap jalan kalau JSON belum di-train atau corrupt — tinggal log warning.

### 5.4 Runtime Inference (Pure Python)

```python
def predict(features):
    feature_values = features.as_model_input()
    logit = MODEL_COEFFICIENTS["intercept"]
    for name, coef in MODEL_COEFFICIENTS.items():
        if name == "intercept": continue
        raw = feature_values.get(name, 0.0)
        logit += coef * _scaled_value(name, raw)  # apply StandardScaler if trained
    score = sigmoid(logit)
    level = classify(score)
    return {score, level, dominant_factors, ...}
```

Total runtime: <1 ms per prediction. Tidak butuh numpy/sklearn di production.

### 5.5 Persistence

Setiap prediksi disimpan ke tabel `stunting_risk_predictions`:

```sql
- id (uuid)
- child_id (fk children)
- measurement_id (fk nutrition_measurements)
- risk_score (numeric 5,4)
- risk_level (varchar: low|medium|high)
- horizon_months (int default 3)
- features (jsonb — snapshot semua input features)
- dominant_factors (jsonb — top 3 contributors)
- model_version (varchar)
- created_at, updated_at, is_active
```

Audit trail: bisa replay prediksi historis, bandingkan model version, debug edge case.

---

## 6. Integrasi Sistem

### 6.1 Backend API Endpoints

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/nutrition/risk/{child_id}` | beneficiary, admin | Latest prediksi 1 anak |
| POST | `/nutrition/risk/{child_id}/recompute` | beneficiary, admin | Force recompute |
| GET | `/nutrition/risk/{child_id}/history` | beneficiary, admin | Riwayat prediksi anak |
| GET | `/nutrition/risk/beneficiary/me` | beneficiary | Semua anak user login + risk |
| GET | `/nutrition/risk/high-risk` | admin, government | List anak medium+high (priority queue) |

### 6.2 Auto-Trigger

```
POST /nutrition/measurements (input pengukuran baru)
    ↓ (after_insert hook)
predict_for_child(db, child) dijalankan otomatis
    ↓
Risk prediction tersimpan, tersedia langsung di dashboard
```

User tidak perlu manual klik "predict" — setiap kali ada data baru, prediksi auto-update.

### 6.3 Frontend

**Beneficiary Dashboard** (`apps/frontend/src/components/dashboard/StuntingRiskCard.tsx`):
- Widget AI early warning per anak
- Skor % besar + badge level berwarna (emerald/amber/rose)
- Top 3 faktor dominan dengan ikon arah
- Tombol "Perbarui" (recompute) + "Lihat Rekomendasi"
- Empty / loading / error state

**Admin Dashboard** (planned):
- Tabel prioritas anak high-risk
- Filter berdasarkan level + kelurahan/kecamatan
- Export ke laporan intervensi

---

## 7. Calibration & Sanity Check

Test 5 profil hand-crafted dengan hardcoded coefs:

| Profil | HAZ | Trend | FIES | Score | Level |
|---|---|---|---|---|---|
| High-risk | -2.1 | declining | 5 | 0.88 | high ✅ |
| Medium-risk | -1.5 | stable | 3 | 0.58 | medium ✅ |
| Borderline | -1.0 | stable | 2 | 0.37 | medium ✅ |
| Healthy | 0.0 | stable | 1 | 0.14 | low ✅ |
| Low-risk | +0.1 | improving | 0 | 0.05 | low ✅ |

Spread sehat — tidak clipping ke ekstrem 0 atau 1.

---

## 8. State Sekarang

### 8.1 Yang Sudah Jadi

- ✅ Backend service dengan auto-loader (JSON → fallback hardcoded)
- ✅ 5 API endpoints dengan role-based access
- ✅ Auto-trigger setiap input pengukuran baru
- ✅ DB migration `stunting_risk_predictions` applied (table + 7 indexes)
- ✅ Frontend widget di Beneficiary Dashboard
- ✅ Frontend page `/dashboard/rekomendasi-ai` (existing)
- ✅ Synthetic data generator (notebook + script)
- ✅ Training pipeline dengan GridSearchCV + StandardScaler
- ✅ JSON exporter
- ✅ Colab package siap pakai
- ✅ Hardcoded coefs terkalibrasi (high=0.88, medium=0.58, low=0.05)

### 8.2 Yang Belum / Optional

- ⏳ Run training di Colab → generate `stunting_model.json` → commit
- ⏳ Halaman admin list high-risk priority (endpoint ready, UI belum)
- ⏳ Real-data retraining (skripsi cukup synthetic — future iteration)

### 8.3 Cara Train Sekarang

```bash
# Buka colab/train_stunting_model.ipynb di Google Colab
# Runtime → Run all
# Download stunting_model.json
# mv ke apps/backend/app/services/
# Restart backend
```

Service akan otomatis pakai weights yang baru dengan zero code change.

---

## 9. Justifikasi Skripsi

### Kontribusi Teknis
1. **Causal-aware synthetic data generator** dengan latent SES factor (bukan random)
2. **Probabilistic labeling** untuk avoid circular learning (sigmoid + Bernoulli)
3. **JSON-based deployment** — model artifact terlepas dari sklearn version
4. **Pure-python runtime inference** — production-grade tanpa heavy ML deps
5. **3-tier classification** dengan threshold yang justified secara epidemiologi

### Validasi
- AUC test set ≥ 0.80 (target realistic untuk noisy synthetic)
- Class-balanced training menangani imbalance 21% prevalence
- Stratified split menjamin distribusi class konsisten
- 5-fold CV mengurangi variance estimate koefisien

### Reproducibility
- `seed=42` di seluruh pipeline
- Synthetic data NOT committed (regenerable on-demand)
- Model JSON committed (~5KB, audit trail)
- Notebook self-documenting

---

## 10. Lokasi File

```
apps/backend/
├── app/
│   ├── api/nutrition.py                     # 5 risk endpoints
│   ├── models/nutrition.py                  # StuntingRiskPrediction model
│   ├── schemas/nutrition.py                 # Pydantic schemas
│   └── services/
│       ├── stunting_risk_service.py         # Inference engine + auto-loader
│       ├── stunting_model.json              # (generated, committed)
│       ├── stunting_model_metrics.json      # (generated, optional commit)
│       └── STUNTING_AI.md                   # Module-level reference
├── alembic/versions/
│   └── add_stunting_risk_predictions_table.py  # DB migration
└── scripts/
    └── train_stunting_model.py              # Local training (needs ML deps)

apps/frontend/src/
├── components/dashboard/StuntingRiskCard.tsx  # Widget UI
├── services/stunting-risk.ts                  # Typed API client
└── pages/dashboard/RekomendasiAI.tsx          # Recommendation page

colab/
├── train_stunting_model.ipynb              # Colab notebook
└── README.md                               # Colab usage guide

docs/
└── STUNTING_AI_FEATURE.md                  # (this file)
```
