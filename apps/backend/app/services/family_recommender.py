"""Rekomendasi tindakan dan kelompok pangan untuk keluarga sasaran 1000 HPK.

Modul ini hanya memakai pustaka standar Python sehingga dapat dipakai bersama oleh:

- notebook pelatihan ``apps/backend/ml/family_recommender/train_family_recommender.ipynb``;
- backend (runtime) yang memuat ``family_recommender_model.json`` di folder ini.

Fitur, kebijakan program, aturan keamanan, inferensi, dan akumulasi keluarga ditulis
satu kali di sini agar hasil saat pelatihan sama persis dengan hasil di aplikasi.

Alur per keluarga:

1. Setiap sasaran (anak 0-23 bulan atau kehamilan) diubah menjadi vektor fitur,
   bersama skor FIES keluarga.
2. Model logistic regression per keputusan ("head") memberi probabilitas.
3. Kebijakan program (gizi seimbang, batas usia) dan aturan keamanan klinis
   menimpa keputusan yang tidak boleh bergantung pada model.
4. Keputusan seluruh sasaran diakumulasi menjadi tindakan keluarga, kelompok pangan,
   dan porsi anggaran kuota mingguan.
5. Opsional: keranjang produk disusun dari katalog vendor dalam batas anggaran.

Hasilnya adalah alat bantu keputusan petugas fasilitas kesehatan, bukan diagnosis.
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable, Mapping, Sequence

MODEL_FORMAT = "family-recommender/v1"
MODEL_FILE = Path(__file__).with_name("family_recommender_model.json")

# ---------------------------------------------------------------------------
# Basis pengetahuan: ambang klinis dan kebijakan program
# ---------------------------------------------------------------------------
ELIGIBLE_CHILD_AGE_MONTHS = 24  # sama dengan family_aid_quota.ELIGIBLE_CHILD_AGE_MONTHS
FIES_MODERATE_MIN = 3  # FIESCalculator.classify_score: 0-2 aman, 3-5 sedang, 6-8 berat
FIES_SEVERE_MIN = 6
Z_MODERATE = -2.0  # WHO: z-score < -2 SD pendek / berat badan kurang
Z_SEVERE = -3.0  # WHO: z-score < -3 SD sangat pendek / berat badan sangat kurang
CHILD_MUAC_MODERATE_CM = 12.5  # LiLA anak 6-59 bulan < 12,5 cm: gizi kurang
CHILD_MUAC_SEVERE_CM = 11.5  # LiLA anak < 11,5 cm: gizi buruk
CHILD_MUAC_MIN_AGE_MONTHS = 6
DECLINE_DELTA_Z = -0.3  # penurunan z-score antarpengukuran yang dianggap tren menurun
MATERNAL_KEK_MUAC_CM = 23.5  # pregnancy.KEK_MUAC_THRESHOLD_CM
TRIMESTER_2_WEEK = 14
TRIMESTER_3_WEEK = 28
STALE_DATA_DAYS = 45  # data lebih lama dari ini perlu diperbarui


@dataclass(frozen=True)
class FoodGroup:
    key: str
    label: str
    examples: str
    catalog_categories: tuple[str, ...]  # nama atau slug kategori produk, huruf kecil
    budget_weight: float  # bobot biaya relatif per sasaran per tingkat kebutuhan


@dataclass(frozen=True)
class Action:
    key: str
    label: str
    description: str


FOOD_GROUPS: tuple[FoodGroup, ...] = (
    FoodGroup("protein_hewani", "Protein hewani", "telur, ikan, ayam, daging", ("protein",), 3.0),
    FoodGroup("makanan_pokok", "Makanan pokok", "beras dan sumber karbohidrat", ("beras", "pokok"), 1.5),
    FoodGroup("sayuran", "Sayuran", "sayuran hijau dan berwarna", ("sayuran",), 1.0),
    FoodGroup("buah", "Buah", "buah segar", ("buah",), 1.0),
    FoodGroup("susu", "Susu dan olahannya", "susu, yogurt; untuk anak 12 bulan ke atas dan ibu hamil", ("susu",), 2.0),
    FoodGroup("minyak", "Minyak/lemak", "penambah energi MP-ASI dan makanan tambahan", ("minyak",), 0.5),
)

# Kategori yang tidak pernah direkomendasikan beserta alasannya.
NOT_RECOMMENDED_CATEGORIES = {
    "gula": "Gula tambahan tidak dianjurkan untuk anak di bawah 2 tahun.",
    "bumbu": "Bumbu bukan sumber zat gizi utama sasaran 1000 HPK.",
}

ACTIONS: tuple[Action, ...] = (
    Action(
        "rujuk_nakes",
        "Konsultasikan ke dokter atau ahli gizi",
        "Temuan masuk kategori berat atau memburuk; konfirmasi pengukuran dan tentukan tata laksana.",
    ),
    Action(
        "pantau_ketat",
        "Pantau ulang dalam 2 minggu",
        "Ukur ulang pertumbuhan atau periksa ulang kehamilan lebih cepat dari jadwal rutin.",
    ),
    Action(
        "pmt_ibu_hamil",
        "Makanan tambahan (PMT) ibu hamil KEK",
        "Makanan tambahan tinggi energi dan protein untuk ibu hamil dengan LiLA di bawah 23,5 cm.",
    ),
    Action(
        "pmt_balita",
        "Makanan tambahan (PMT) anak",
        "Untuk anak dengan gizi kurang atau berat badan yang tidak naik.",
    ),
    Action(
        "konseling_gizi",
        "Berikan konseling gizi",
        "Konseling ASI eksklusif, MP-ASI, atau gizi ibu hamil sesuai sasaran.",
    ),
)

FAMILY_ACTION_FOOD_ACCESS = Action(
    "tinjau_akses_pangan",
    "Tinjau akses pangan keluarga",
    "Hasil FIES menunjukkan kerawanan pangan; tinjau hambatan keluarga dan hubungkan dengan program bantuan sosial setempat.",
)

FOOD_GROUP_KEYS = tuple(group.key for group in FOOD_GROUPS)
ACTION_KEYS = tuple(action.key for action in ACTIONS)
FOOD_REC_HEADS = tuple(f"food_{key}_rec" for key in FOOD_GROUP_KEYS)
FOOD_PRIO_HEADS = tuple(f"food_{key}_prio" for key in FOOD_GROUP_KEYS)
ACTION_HEADS = tuple(f"act_{key}" for key in ACTION_KEYS)
ALL_HEADS = FOOD_REC_HEADS + FOOD_PRIO_HEADS + ACTION_HEADS

# Kelompok pangan "Isi Piringku" yang selalu dianjurkan untuk setiap sasaran.
BALANCED_DIET_GROUPS = ("protein_hewani", "makanan_pokok", "sayuran", "buah")

# Keputusan yang dipelajari model per jenis sasaran. Head lain ditetapkan kebijakan.
LEARNED_HEADS: dict[str, tuple[str, ...]] = {
    "child": (
        "food_protein_hewani_prio",
        "food_makanan_pokok_prio",
        "food_susu_rec",
        "food_susu_prio",
        "food_minyak_rec",
        "food_minyak_prio",
        "act_rujuk_nakes",
        "act_pantau_ketat",
        "act_konseling_gizi",
        "act_pmt_balita",
    ),
    "pregnancy": (
        "food_protein_hewani_prio",
        "food_makanan_pokok_prio",
        "food_susu_rec",
        "food_minyak_rec",
        "act_rujuk_nakes",
        "act_pantau_ketat",
        "act_konseling_gizi",
        "act_pmt_ibu_hamil",
    ),
}
MEMBER_TYPES = tuple(LEARNED_HEADS)

LEVEL_LABELS = {0: "tidak", 1: "dianjurkan", 2: "prioritas"}

# ---------------------------------------------------------------------------
# Fitur
# ---------------------------------------------------------------------------
AGE_BANDS = ("0_5", "6_11", "12_23")
CHILD_INTERACTION_FLAGS = (
    "at_risk",
    "energy_deficit",
    "stunted_or_underweight",
    "weight_faltering",
    "underweight_or_declining",
    "fies_at_least_moderate",
    "fies_severe",
)
FIES_FEATURES = ("fies_available", "fies_score", "fies_at_least_moderate", "fies_severe")
CHILD_BASE_FEATURES = (
    "age_months",
    "age_0_5",
    "age_6_11",
    "age_12_23",
    "is_male",
    "has_measurement",
    "haz",
    "waz",
    "stunted",
    "severely_stunted",
    "underweight",
    "severely_underweight",
    "muac_available",
    "muac_deficit",
    "muac_moderate",
    "muac_severe",
    "has_previous",
    "delta_haz",
    "delta_waz",
    "declining",
    "weight_faltering",
    "stunted_and_declining",
    "energy_deficit",
    "any_deficit",
    "at_risk",
)
PREGNANCY_BASE_FEATURES = (
    "gestational_weeks",
    "trimester_1",
    "trimester_2",
    "trimester_3",
    "has_check",
    "lila_deficit",
    "kek",
    "needs_review",
)
FEATURE_NAMES: dict[str, tuple[str, ...]] = {
    "child": FIES_FEATURES
    + CHILD_BASE_FEATURES
    + tuple(f"{flag}_x_age_{band}" for band in AGE_BANDS for flag in CHILD_INTERACTION_FLAGS),
    "pregnancy": FIES_FEATURES + PREGNANCY_BASE_FEATURES,
}

_AGE_BAND_LABELS = {"0_5": "usia 0-5 bulan", "6_11": "usia 6-11 bulan", "12_23": "usia 12-23 bulan"}
_FLAG_LABELS = {
    "at_risk": "masalah atau tren pertumbuhan menurun",
    "energy_deficit": "kekurangan energi (BB kurang atau LiLA rendah)",
    "stunted_or_underweight": "pendek atau berat badan kurang",
    "weight_faltering": "berat badan tidak naik",
    "underweight_or_declining": "berat badan kurang atau tren menurun",
    "fies_at_least_moderate": "keluarga rawan pangan",
    "fies_severe": "keluarga rawan pangan berat",
}
FEATURE_LABELS: dict[str, str] = {
    "fies_available": "Survei FIES tersedia",
    "fies_score": "Skor FIES keluarga",
    "fies_at_least_moderate": "Keluarga rawan pangan (FIES >= 3)",
    "fies_severe": "Keluarga rawan pangan berat (FIES >= 6)",
    "age_months": "Usia anak",
    "age_0_5": "Usia 0-5 bulan (ASI eksklusif)",
    "age_6_11": "Usia 6-11 bulan (awal MP-ASI)",
    "age_12_23": "Usia 12-23 bulan",
    "is_male": "Anak laki-laki",
    "has_measurement": "Sudah ada pengukuran",
    "haz": "Z-score tinggi badan",
    "waz": "Z-score berat badan",
    "stunted": "Pendek (z-score TB < -2)",
    "severely_stunted": "Sangat pendek (z-score TB < -3)",
    "underweight": "Berat badan kurang (z-score BB < -2)",
    "severely_underweight": "Berat badan sangat kurang (z-score BB < -3)",
    "muac_available": "LiLA anak tercatat",
    "muac_deficit": "LiLA anak di bawah 12,5 cm",
    "muac_moderate": "LiLA anak 11,5-12,5 cm (gizi kurang)",
    "muac_severe": "LiLA anak < 11,5 cm (gizi buruk)",
    "has_previous": "Ada pengukuran sebelumnya",
    "delta_haz": "Perubahan z-score TB",
    "delta_waz": "Perubahan z-score BB",
    "declining": "Tren z-score menurun",
    "weight_faltering": "Berat badan tidak naik",
    "stunted_and_declining": "Pendek dan tren menurun",
    "energy_deficit": "Kekurangan energi (BB kurang atau LiLA rendah)",
    "any_deficit": "Ada masalah pertumbuhan",
    "at_risk": "Masalah atau tren pertumbuhan menurun",
    "gestational_weeks": "Usia kehamilan",
    "trimester_1": "Trimester 1",
    "trimester_2": "Trimester 2",
    "trimester_3": "Trimester 3",
    "has_check": "Sudah ada pemeriksaan kehamilan",
    "lila_deficit": "LiLA ibu di bawah 23,5 cm",
    "kek": "Risiko KEK (LiLA ibu < 23,5 cm)",
    "needs_review": "Pemeriksaan kehamilan perlu ditinjau",
}
for _band in AGE_BANDS:
    for _flag in CHILD_INTERACTION_FLAGS:
        FEATURE_LABELS[f"{_flag}_x_age_{_band}"] = (
            f"{_FLAG_LABELS[_flag].capitalize()} pada {_AGE_BAND_LABELS[_band]}"
        )

# Alasan pada kartu hanya diambil dari indikator klinis bernilai 1 yang maknanya jelas.
# Fitur kontinu (skor, z-score, selisih) dan fitur administratif tidak dipakai sebagai alasan.
_REASON_LABELS: dict[str, str] = {
    name: FEATURE_LABELS[name]
    for name in (
        "fies_at_least_moderate", "fies_severe",
        "age_0_5", "age_6_11", "age_12_23",
        "stunted", "severely_stunted", "underweight", "severely_underweight",
        "muac_moderate", "muac_severe", "declining", "weight_faltering", "stunted_and_declining",
        "energy_deficit", "any_deficit", "at_risk",
        "trimester_1", "trimester_2", "trimester_3", "kek", "needs_review",
    )
}
_REASON_LABELS.update({
    "stunted_or_underweight": "Pendek atau berat badan kurang",
    "underweight_or_declining": "Berat badan kurang atau tren menurun",
})
for _band in AGE_BANDS:
    for _flag in CHILD_INTERACTION_FLAGS:
        _REASON_LABELS[f"{_flag}_x_age_{_band}"] = _REASON_LABELS[_flag]


def _num(value: Any) -> float | None:
    """Return a float, or None for empty values (None, "", NaN, pandas NA). Decimal is accepted."""
    if value is None or (isinstance(value, str) and not value.strip()):
        return None
    try:
        number = float(value)
    except TypeError:  # pandas.NA
        return None
    return None if math.isnan(number) else number


def _is(value: Any, expected: str) -> bool:
    return isinstance(value, str) and value == expected


def age_band(age_months: int) -> str:
    if age_months < 6:
        return "0_5"
    if age_months < 12:
        return "6_11"
    return "12_23"


def fies_flags(fies_score: Any, *, shift: int = 0) -> dict[str, Any]:
    """FIES indicators. ``shift`` lets the training notebook simulate rater variation."""
    score = _num(fies_score)
    available = score is not None
    return {
        "fies_available": available,
        "fies_score": score if available else 0.0,
        "fies_at_least_moderate": available and score >= FIES_MODERATE_MIN + shift,
        "fies_severe": available and score >= FIES_SEVERE_MIN + shift,
    }


def child_flags(
    member: Mapping[str, Any],
    *,
    z_cut: float = Z_MODERATE,
    muac_cut: float = CHILD_MUAC_MODERATE_CM,
    decline_cut: float = DECLINE_DELTA_Z,
) -> dict[str, Any]:
    """Growth indicators for a child. Severe cut-offs are fixed (safety rules)."""
    age = int(member["age_months"])
    haz, waz = _num(member.get("haz")), _num(member.get("waz"))
    measured = haz is not None and waz is not None
    muac = _num(member.get("muac_cm")) if measured and age >= CHILD_MUAC_MIN_AGE_MONTHS else None
    prev_haz, prev_waz = _num(member.get("prev_haz")), _num(member.get("prev_waz"))
    has_previous = measured and prev_haz is not None and prev_waz is not None
    delta_haz = haz - prev_haz if has_previous else 0.0
    delta_waz = waz - prev_waz if has_previous else 0.0

    stunted = measured and haz < z_cut
    underweight = measured and waz < z_cut
    muac_low = muac is not None and muac < muac_cut
    muac_severe = muac is not None and muac < CHILD_MUAC_SEVERE_CM
    declining = has_previous and (delta_haz < decline_cut or delta_waz < decline_cut)
    weight_faltering = has_previous and delta_waz < decline_cut
    energy_deficit = underweight or muac_low
    any_deficit = stunted or underweight or muac_low
    return {
        "age_months": age,
        "band": age_band(age),
        "measured": measured,
        "haz": haz if measured else 0.0,
        "waz": waz if measured else 0.0,
        "muac": muac,
        "has_previous": has_previous,
        "delta_haz": delta_haz,
        "delta_waz": delta_waz,
        "stunted": stunted,
        "severely_stunted": measured and haz < Z_SEVERE,
        "underweight": underweight,
        "severely_underweight": measured and waz < Z_SEVERE,
        "muac_moderate": muac_low and not muac_severe,
        "muac_severe": muac_severe,
        "declining": declining,
        "weight_faltering": weight_faltering,
        "stunted_and_declining": stunted and declining,
        "energy_deficit": energy_deficit,
        "any_deficit": any_deficit,
        "at_risk": any_deficit or declining,
    }


def pregnancy_flags(member: Mapping[str, Any], *, kek_cut: float = MATERNAL_KEK_MUAC_CM) -> dict[str, Any]:
    """Pregnancy indicators. KEK is read from LiLA directly because the stored
    classification shows ``needs_review`` instead of ``kek_risk`` when both apply."""
    weeks = int(member["gestational_weeks"])
    lila = _num(member.get("lila_cm"))
    has_check = lila is not None
    return {
        "gestational_weeks": weeks,
        "trimester": 1 if weeks < TRIMESTER_2_WEEK else 2 if weeks < TRIMESTER_3_WEEK else 3,
        "has_check": has_check,
        "lila": lila,
        "kek": has_check and lila < kek_cut,
        "needs_review": _is(member.get("prenatal_classification"), "needs_review"),
    }


def member_features(member: Mapping[str, Any], fies_score: Any) -> dict[str, float]:
    """Numeric feature vector (ordered as FEATURE_NAMES[member_type])."""
    member_type = member["member_type"]
    q = fies_flags(fies_score)
    values: dict[str, float] = {name: float(q[name]) for name in FIES_FEATURES}

    if member_type == "child":
        f = child_flags(member)
        band = f["band"]
        muac = f["muac"]
        values.update(
            age_months=float(f["age_months"]),
            age_0_5=float(band == "0_5"),
            age_6_11=float(band == "6_11"),
            age_12_23=float(band == "12_23"),
            is_male=float(_is(member.get("sex"), "male")),
            has_measurement=float(f["measured"]),
            haz=f["haz"],
            waz=f["waz"],
            muac_available=float(muac is not None),
            muac_deficit=max(0.0, CHILD_MUAC_MODERATE_CM - muac) if muac is not None else 0.0,
            has_previous=float(f["has_previous"]),
            delta_haz=f["delta_haz"],
            delta_waz=f["delta_waz"],
        )
        for name in (
            "stunted",
            "severely_stunted",
            "underweight",
            "severely_underweight",
            "muac_moderate",
            "muac_severe",
            "declining",
            "weight_faltering",
            "stunted_and_declining",
            "energy_deficit",
            "any_deficit",
            "at_risk",
        ):
            values[name] = float(f[name])
        combined = {
            "at_risk": f["at_risk"],
            "energy_deficit": f["energy_deficit"],
            "stunted_or_underweight": f["stunted"] or f["underweight"],
            "weight_faltering": f["weight_faltering"],
            "underweight_or_declining": f["underweight"] or f["declining"],
            "fies_at_least_moderate": q["fies_at_least_moderate"],
            "fies_severe": q["fies_severe"],
        }
        for b in AGE_BANDS:
            for flag in CHILD_INTERACTION_FLAGS:
                values[f"{flag}_x_age_{b}"] = float(band == b and combined[flag])
    elif member_type == "pregnancy":
        f = pregnancy_flags(member)
        values.update(
            gestational_weeks=float(f["gestational_weeks"]),
            trimester_1=float(f["trimester"] == 1),
            trimester_2=float(f["trimester"] == 2),
            trimester_3=float(f["trimester"] == 3),
            has_check=float(f["has_check"]),
            lila_deficit=max(0.0, MATERNAL_KEK_MUAC_CM - f["lila"]) if f["has_check"] else 0.0,
            kek=float(f["kek"]),
            needs_review=float(f["needs_review"]),
        )
    else:
        raise ValueError(f"Jenis sasaran tidak dikenal: {member_type!r}")

    return {name: values[name] for name in FEATURE_NAMES[member_type]}


# ---------------------------------------------------------------------------
# Kebijakan program dan aturan keamanan (tidak dipelajari model)
# ---------------------------------------------------------------------------
def policy_decisions(member: Mapping[str, Any]) -> dict[str, int]:
    """Decisions fixed by programme policy: every head the model does not learn,
    plus age restrictions on learned heads."""
    member_type = member["member_type"]
    fixed = {head: 0 for head in ALL_HEADS if head not in LEARNED_HEADS[member_type]}
    for key in BALANCED_DIET_GROUPS:
        fixed[f"food_{key}_rec"] = 1
    if member_type == "child":
        age = int(member["age_months"])
        if age < 12:  # susu sapi/UHT bukan minuman utama sebelum 12 bulan
            fixed.update(food_susu_rec=0, food_susu_prio=0)
        if age < 6:  # ASI eksklusif: belum ada MP-ASI atau PMT untuk bayi
            fixed.update(food_minyak_rec=0, food_minyak_prio=0, act_pmt_balita=0)
    return fixed


def safety_decisions(member: Mapping[str, Any]) -> dict[str, int]:
    """Hard clinical rules that always apply, whatever the model predicts."""
    if member["member_type"] == "child":
        f = child_flags(member)
        severe = f["severely_stunted"] or f["severely_underweight"] or f["muac_severe"]
    else:
        severe = pregnancy_flags(member)["needs_review"]
    return {"act_rujuk_nakes": 1, "act_pantau_ketat": 1} if severe else {}


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------
def load_model(path: str | Path | None = None) -> dict[str, Any]:
    """Load and validate the exported model so training/runtime drift fails loudly."""
    with open(path or MODEL_FILE, encoding="utf-8") as handle:
        model = json.load(handle)
    if model.get("format") != MODEL_FORMAT:
        raise ValueError(f"Format model tidak dikenal: {model.get('format')!r}")
    for member_type in MEMBER_TYPES:
        spec = model["member_types"][member_type]
        if tuple(spec["features"]) != FEATURE_NAMES[member_type]:
            raise ValueError(f"Daftar fitur model '{member_type}' tidak sama dengan modul ini")
        if set(spec["heads"]) != set(LEARNED_HEADS[member_type]):
            raise ValueError(f"Daftar head model '{member_type}' tidak sama dengan modul ini")
    return model


def _sigmoid(x: float) -> float:
    if x >= 0:
        return 1.0 / (1.0 + math.exp(-x))
    e = math.exp(x)
    return e / (1.0 + e)


def _contributions(spec: Mapping[str, Any], head: Mapping[str, Any], x: Mapping[str, float]) -> list[tuple[str, float]]:
    return [
        (name, coef * ((x[name] - mean) / scale))
        for name, coef, mean, scale in zip(spec["features"], head["coef"], spec["mean"], spec["scale"])
    ]


def predict_member(model: Mapping[str, Any], member: Mapping[str, Any], fies_score: Any) -> dict[str, float]:
    """Probability for every learned head of this member."""
    spec = model["member_types"][member["member_type"]]
    x = member_features(member, fies_score)
    return {
        name: _sigmoid(head["intercept"] + sum(c for _, c in _contributions(spec, head, x)))
        for name, head in spec["heads"].items()
    }


def _reasons(
    spec: Mapping[str, Any],
    head: Mapping[str, Any],
    x: Mapping[str, float],
    top_n: int = 2,
    min_relative: float = 0.3,
) -> list[str]:
    """Readable clinical indicators (value 1) that pushed this decision up the most.

    Indicators contributing less than ``min_relative`` of the strongest one are dropped,
    so weak, merely correlated features are not shown as reasons.
    """
    ranked = sorted(
        (
            (name, c)
            for name, c in _contributions(spec, head, x)
            if c > 0 and x[name] == 1 and name in _REASON_LABELS
        ),
        key=lambda item: item[1],
        reverse=True,
    )
    if ranked:
        ranked = [(name, c) for name, c in ranked if c >= min_relative * ranked[0][1]]
    labels: list[str] = []
    for name, _ in ranked:
        label = _REASON_LABELS[name]
        if label not in labels:
            labels.append(label)
        if len(labels) == top_n:
            break
    return labels


def member_label(member: Mapping[str, Any]) -> str:
    name = member.get("name")
    if isinstance(name, str) and name.strip():
        return name.strip()
    if member["member_type"] == "pregnancy":
        return f"Kehamilan {int(member['gestational_weeks'])} minggu"
    return f"Anak {int(member['age_months'])} bulan"


def describe_member(member: Mapping[str, Any]) -> str:
    """Short factual summary shown next to the recommendation."""
    if member["member_type"] == "pregnancy":
        f = pregnancy_flags(member)
        text = f"usia kehamilan {f['gestational_weeks']} minggu (trimester {f['trimester']})"
        if f["has_check"]:
            text += f", LiLA ibu {f['lila']:.1f} cm" + (" (risiko KEK)" if f["kek"] else "")
        else:
            text += ", belum ada pemeriksaan"
        if f["needs_review"]:
            text += ", hasil pemeriksaan perlu ditinjau"
        return text
    f = child_flags(member)
    text = f"usia {f['age_months']} bulan"
    if not f["measured"]:
        return text + ", belum ada pengukuran"
    text += f", z-score TB {f['haz']:.2f}, BB {f['waz']:.2f}"
    if f["muac"] is not None:
        text += f", LiLA {f['muac']:.1f} cm"
    if f["has_previous"]:
        text += f", perubahan z-score TB {f['delta_haz']:+.2f} dan BB {f['delta_waz']:+.2f}"
    return text


def decide_member(model: Mapping[str, Any], member: Mapping[str, Any], fies_score: Any) -> dict[str, Any]:
    """Model probabilities -> thresholds -> policy and safety overrides for one member."""
    member_type = member["member_type"]
    spec = model["member_types"][member_type]
    x = member_features(member, fies_score)
    probabilities = predict_member(model, member, fies_score)

    decisions: dict[str, int] = {}
    sources: dict[str, str] = {}
    reasons: dict[str, list[str]] = {}
    for name, head in spec["heads"].items():
        decisions[name] = int(probabilities[name] >= head["threshold"])
        sources[name] = "model"
        reasons[name] = _reasons(spec, head, x)

    overrides = []
    for source, rules in (("kebijakan", policy_decisions(member)), ("keamanan", safety_decisions(member))):
        for name, value in rules.items():
            overridden = name in decisions and decisions[name] != value
            if overridden:
                overrides.append({"head": name, "model": decisions[name], "final": value, "source": source})
            if value and (name not in spec["heads"] or overridden):
                reasons[name] = [RULE_REASONS[source]]
            decisions[name] = value
            sources[name] = source
    return member_result(member, decisions, probabilities=probabilities, sources=sources, reasons=reasons, overrides=overrides)


RULE_REASONS = {
    "kebijakan": "Kebutuhan gizi seimbang harian (Isi Piringku)",
    "keamanan": "Temuan berat: z-score < -3, LiLA anak < 11,5 cm, atau pemeriksaan kehamilan perlu ditinjau",
}


def member_result(
    member: Mapping[str, Any],
    decisions: Mapping[str, int],
    *,
    probabilities: Mapping[str, float] | None = None,
    sources: Mapping[str, str] | None = None,
    reasons: Mapping[str, list[str]] | None = None,
    overrides: Sequence[Mapping[str, Any]] = (),
) -> dict[str, Any]:
    """Package decisions for aggregation. The notebook also feeds guideline labels here."""
    missing = set(ALL_HEADS) - set(decisions)
    if missing:
        raise ValueError(f"Keputusan belum lengkap: {sorted(missing)}")
    return {
        "label": member_label(member),
        "member_type": member["member_type"],
        "summary": describe_member(member),
        "decisions": {head: int(decisions[head]) for head in ALL_HEADS},
        # 2 = prioritas (prioritas selalu berarti dibutuhkan), 1 = dianjurkan, 0 = tidak.
        "food_levels": {
            key: 2 if decisions[f"food_{key}_prio"] else int(decisions[f"food_{key}_rec"])
            for key in FOOD_GROUP_KEYS
        },
        "probabilities": {k: round(v, 4) for k, v in (probabilities or {}).items()},
        "sources": dict(sources or {}),
        "reasons": dict(reasons or {}),
        "overrides": list(overrides),
        "member": dict(member),
    }


# ---------------------------------------------------------------------------
# Akumulasi keluarga
# ---------------------------------------------------------------------------
def in_scope(member: Mapping[str, Any]) -> tuple[bool, str]:
    if member.get("member_type") == "pregnancy":
        return True, ""
    if member.get("member_type") == "child":
        if int(member["age_months"]) < ELIGIBLE_CHILD_AGE_MONTHS:
            return True, ""
        return False, "Anak berusia 24 bulan ke atas tidak termasuk sasaran 1000 HPK."
    return False, "Jenis sasaran tidak dikenal."


def data_checks(family: Mapping[str, Any]) -> list[dict[str, str]]:
    """Data that must be completed or refreshed before trusting the recommendation."""
    checks = []
    fies_days = _num(family.get("fies_days_since"))
    if _num(family.get("fies_score")) is None:
        checks.append({"key": "fies_missing", "label": "Lakukan survei FIES", "member": "Keluarga"})
    elif fies_days is not None and fies_days > STALE_DATA_DAYS:
        checks.append({"key": "fies_stale", "label": "Perbarui survei FIES", "member": "Keluarga"})
    for member in family.get("members", []):
        ok, _ = in_scope(member)
        if not ok:
            continue
        name = member_label(member)
        if member["member_type"] == "child":
            if _num(member.get("haz")) is None or _num(member.get("waz")) is None:
                checks.append({"key": "measurement_missing", "label": "Lakukan pengukuran pertumbuhan", "member": name})
            elif (_num(member.get("days_since_measurement")) or 0) > STALE_DATA_DAYS:
                checks.append({"key": "measurement_stale", "label": "Ukur ulang pertumbuhan", "member": name})
        else:
            if _num(member.get("lila_cm")) is None:
                checks.append({"key": "check_missing", "label": "Lakukan pemeriksaan kehamilan", "member": name})
            elif (_num(member.get("days_since_check")) or 0) > STALE_DATA_DAYS:
                checks.append({"key": "check_stale", "label": "Periksa ulang kehamilan", "member": name})
    return checks


def allocate_budget(food_groups: Sequence[Mapping[str, Any]], weekly_budget: float | None) -> list[dict[str, Any]]:
    """Split the weekly budget across needed groups: accumulated need x relative cost."""
    weights = {group.key: group.budget_weight for group in FOOD_GROUPS}
    needed = [g for g in food_groups if g["level"] > 0]
    total = sum(g["score"] * weights[g["key"]] for g in needed)
    shares = [g["score"] * weights[g["key"]] / total if total else 0.0 for g in needed]

    budgets: list[int | None] = [None] * len(needed)
    if weekly_budget and total:
        # Largest-remainder rounding so the group budgets add up exactly to the quota.
        raw = [int(weekly_budget) * share for share in shares]
        budgets = [int(math.floor(value)) for value in raw]
        remainder = int(weekly_budget) - sum(budgets)
        for i in sorted(range(len(raw)), key=lambda i: raw[i] - budgets[i], reverse=True)[:remainder]:
            budgets[i] += 1

    return [
        {"key": g["key"], "level": g["level"], "share": round(share, 4), "budget": budget}
        for g, share, budget in zip(needed, shares, budgets)
    ]


def aggregate_family(
    member_results: Sequence[Mapping[str, Any]],
    fies_score: Any,
    *,
    weekly_budget: float | None = None,
    excluded: Sequence[Mapping[str, str]] = (),
    checks: Sequence[Mapping[str, str]] = (),
) -> dict[str, Any]:
    """Accumulate every member's decisions into one family recommendation."""
    fies = fies_flags(fies_score)

    actions = []
    for action in ACTIONS:
        head = f"act_{action.key}"
        members = [m for m in member_results if m["decisions"][head]]
        if members:
            actions.append({
                "key": action.key,
                "label": action.label,
                "description": action.description,
                "members": [m["label"] for m in members],
                "member_reasons": [{"member": m["label"], "reasons": m["reasons"].get(head, [])} for m in members],
                "sources": sorted({m["sources"].get(head, "model") for m in members}),
            })
    if fies["fies_at_least_moderate"]:
        fies_reason = FEATURE_LABELS["fies_severe" if fies["fies_severe"] else "fies_at_least_moderate"]
        actions.append({
            "key": FAMILY_ACTION_FOOD_ACCESS.key,
            "label": FAMILY_ACTION_FOOD_ACCESS.label,
            "description": FAMILY_ACTION_FOOD_ACCESS.description,
            "members": ["Keluarga"],
            "member_reasons": [{"member": "Keluarga", "reasons": [fies_reason]}],
            "sources": ["aturan_fies"],
        })

    food_groups = []
    for group in FOOD_GROUPS:
        contributors = []
        for m in member_results:
            level = m["food_levels"][group.key]
            if level:
                prio_head = f"food_{group.key}_prio"
                rec_head = f"food_{group.key}_rec"
                contributors.append({
                    "member": m["label"],
                    "level": LEVEL_LABELS[level],
                    "reasons": m["reasons"].get(prio_head if level == 2 else rec_head, []),
                })
        levels = [m["food_levels"][group.key] for m in member_results]
        food_groups.append({
            "key": group.key,
            "label": group.label,
            "examples": group.examples,
            "catalog_categories": list(group.catalog_categories),
            "level": max(levels, default=0),
            "level_label": LEVEL_LABELS[max(levels, default=0)],
            "score": sum(levels),  # akumulasi: jumlah tingkat kebutuhan seluruh sasaran
            "members": contributors,
        })

    allocation = allocate_budget(food_groups, weekly_budget)
    shares = {a["key"]: a for a in allocation}
    for g in food_groups:
        g["share"] = shares.get(g["key"], {}).get("share", 0.0)
        g["budget"] = shares.get(g["key"], {}).get("budget")
    food_groups.sort(key=lambda g: (-g["level"], -g["share"]))

    action_keys = {a["key"] for a in actions}
    if "rujuk_nakes" in action_keys or fies["fies_severe"]:
        priority = "high"
    elif action_keys & {"pantau_ketat", "pmt_balita", "pmt_ibu_hamil"} or fies["fies_at_least_moderate"]:
        priority = "medium"
    else:
        priority = "low"

    return {
        "priority": priority,
        "actions": actions,
        "food_groups": food_groups,
        "weekly_budget": int(weekly_budget) if weekly_budget else None,
        "members": [
            {k: m[k] for k in ("label", "member_type", "summary", "food_levels", "probabilities", "sources", "overrides")}
            for m in member_results
        ],
        "excluded_members": list(excluded),
        "data_checks": list(checks),
        "not_recommended": [{"category": k, "reason": v} for k, v in NOT_RECOMMENDED_CATEGORIES.items()],
    }


def recommend_family(
    family: Mapping[str, Any],
    model: Mapping[str, Any] | None = None,
    *,
    weekly_budget: float | None = None,
    products: Iterable[Mapping[str, Any]] | None = None,
) -> dict[str, Any]:
    """Full pipeline for one family.

    ``family``: {"fies_score": int | None, "fies_days_since": int | None,
                 "members": [child or pregnancy dicts]}
    child:      {"member_type": "child", "age_months", "sex", "haz", "waz", "muac_cm",
                 "prev_haz", "prev_waz", "days_since_measurement", "name"?}
    pregnancy:  {"member_type": "pregnancy", "gestational_weeks", "lila_cm",
                 "prenatal_classification", "days_since_check", "name"?}
    ``weekly_budget``: remaining weekly aid quota (Rupiah), e.g. FamilyAidQuota.remaining_amount.
    ``products``: catalog rows {"id", "name", "category", "price", "stock"?} to build a basket.
    """
    model = model or load_model()
    results, excluded = [], []
    for member in family.get("members", []):
        ok, reason = in_scope(member)
        if ok:
            results.append(decide_member(model, member, family.get("fies_score")))
        else:
            excluded.append({"member": member_label(member), "reason": reason})
    recommendation = aggregate_family(
        results,
        family.get("fies_score"),
        weekly_budget=weekly_budget,
        excluded=excluded,
        checks=data_checks(family),
    )
    recommendation["model_version"] = model.get("model_version")
    if products is not None and weekly_budget:
        recommendation["basket"] = build_basket(recommendation["food_groups"], products)
    return recommendation


# ---------------------------------------------------------------------------
# Keranjang produk
# ---------------------------------------------------------------------------
def build_basket(food_groups: Sequence[Mapping[str, Any]], products: Iterable[Mapping[str, Any]]) -> dict[str, Any]:
    """Pick catalog products within each group's budget.

    Pass 1 fills each group's own budget, cheapest product first and one unit per product
    per round so the basket stays varied. Pass 2 spends what is left (including budget of
    groups with no product in the catalog), one unit at a time: groups that got nothing in
    pass 1 first (e.g. a 5 kg rice pack that is pricier than its share), then the most-needed
    and least-funded groups.
    """
    groups = [g for g in food_groups if g["level"] > 0 and g.get("budget")]
    by_group: dict[str, list[dict[str, Any]]] = {g["key"]: [] for g in groups}
    category_to_group = {cat: g.key for g in FOOD_GROUPS for cat in g.catalog_categories}
    for product in products:
        key = category_to_group.get(str(product.get("category") or "").strip().casefold())
        price = _num(product.get("price"))
        if key in by_group and price and price > 0:
            by_group[key].append({**product, "price": price})
    for items in by_group.values():
        items.sort(key=lambda p: (p["price"], str(p.get("name", ""))))

    quantities: dict[Any, int] = {}
    chosen: dict[Any, dict[str, Any]] = {}
    spent_by_group = {g["key"]: 0.0 for g in groups}

    def pid_of(product: Mapping[str, Any]) -> Any:
        return product.get("id", product.get("name"))

    def in_stock(product: Mapping[str, Any]) -> bool:
        stock = _num(product.get("stock"))
        return stock is None or quantities.get(pid_of(product), 0) < stock

    def add(product: Mapping[str, Any], key: str) -> None:
        pid = pid_of(product)
        quantities[pid] = quantities.get(pid, 0) + 1
        chosen[pid] = {**product, "group": key}

    def add_round(key: str, budget_left: float) -> float:
        """Add at most one unit of each affordable product; return the amount spent."""
        spent = 0.0
        for product in by_group[key]:
            if in_stock(product) and spent + product["price"] <= budget_left:
                add(product, key)
                spent += product["price"]
        return spent

    leftover = 0.0
    for g in groups:
        budget = float(g["budget"])
        while True:
            spent = add_round(g["key"], budget - spent_by_group[g["key"]])
            if spent == 0:
                break
            spent_by_group[g["key"]] += spent
        leftover += budget - spent_by_group[g["key"]]

    def pass_two_rank(g: Mapping[str, Any]) -> tuple:
        # Groups that got nothing yet come first, then higher need, then the least funded.
        spent = spent_by_group[g["key"]]
        return (spent > 0, -g["level"], spent / float(g["budget"]), -g["share"])

    while leftover > 0:
        candidates = []
        for g in groups:
            affordable = [p for p in by_group[g["key"]] if in_stock(p) and p["price"] <= leftover]
            if affordable:
                candidates.append((g, affordable))
        if not candidates:
            break
        g, affordable = min(candidates, key=lambda c: pass_two_rank(c[0]))
        # Prefer the product chosen least so far to keep the basket varied.
        product = min(affordable, key=lambda p: (quantities.get(pid_of(p), 0), p["price"]))
        add(product, g["key"])
        spent_by_group[g["key"]] += product["price"]
        leftover -= product["price"]

    ordered = sorted(groups, key=lambda g: (-g["level"], -g["share"]))

    items = [
        {
            "product_id": pid,
            "name": product.get("name"),
            "group": product["group"],
            "category": product.get("category"),
            "price": int(round(product["price"])),
            "quantity": quantities[pid],
            "subtotal": int(round(product["price"] * quantities[pid])),
        }
        for pid, product in chosen.items()
    ]
    order = {key: index for index, key in enumerate(g["key"] for g in ordered)}
    items.sort(key=lambda item: (order[item["group"]], item["price"]))
    return {
        "items": items,
        "total": sum(item["subtotal"] for item in items),
        "unspent": int(round(leftover)),
        "spent_by_group": {key: int(round(value)) for key, value in spent_by_group.items()},
        "groups_without_products": [g["key"] for g in groups if not by_group[g["key"]]],
    }
