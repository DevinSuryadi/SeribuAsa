import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  recomputeChildRisk,
  RISK_LEVEL_LABEL,
  type RiskLevel,
} from "@/services/stunting-risk";
import { useStuntingRisk } from "@/hooks/useBeneficiaryData";
import { toast } from "sonner";

const levelStyles: Record<
  RiskLevel,
  { wrap: string; badge: string; text: string; icon: typeof ShieldCheck }
> = {
  low: {
    wrap: "border-emerald-200 bg-emerald-50/60",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    text: "text-emerald-700",
    icon: ShieldCheck,
  },
  medium: {
    wrap: "border-amber-200 bg-amber-50/70",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    text: "text-amber-700",
    icon: AlertTriangle,
  },
  high: {
    wrap: "border-rose-200 bg-rose-50/70",
    badge: "bg-rose-100 text-rose-800 border-rose-200",
    text: "text-rose-700",
    icon: AlertTriangle,
  },
};

interface Props {
  className?: string;
}

export default function StuntingRiskCard({ className = "" }: Props) {
  const { data: items, isLoading: loading, error, mutate } = useStuntingRisk();
  const [recomputing, setRecomputing] = useState<string | null>(null);

  const onRecompute = async (childId: string) => {
    try {
      setRecomputing(childId);
      await recomputeChildRisk(childId);
      await mutate();
      toast.success("Prediksi risiko diperbarui");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui";
      toast.error(msg);
    } finally {
      setRecomputing(null);
    }
  };


  if (loading) {
    return (
      <section
        className={`rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] ${className}`}
      >
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500">Memuat prediksi risiko...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        className={`rounded-[18px] border border-rose-200 bg-rose-50/60 p-4 ${className}`}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-700">
              Gagal memuat prediksi risiko stunting
            </p>
            <p className="mt-0.5 text-xs text-rose-600/80">{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => mutate()}
              className="mt-2 h-8 border-rose-200 bg-white text-xs text-rose-700 hover:bg-rose-50"
            >
              <RefreshCw className="mr-1.5 h-3 w-3" />
              Coba lagi
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section
        className={`rounded-[18px] border border-dashed border-emerald-200 bg-emerald-50/40 p-5 text-center ${className}`}
      >
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600">
          <Brain className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-bold text-emerald-900">
          Prediksi Risiko Stunting Belum Tersedia
        </h3>
        <p className="mx-auto mt-1 max-w-md text-xs text-emerald-800/70">
          Catat pengukuran berat dan tinggi anak terlebih dahulu agar AI dapat
          menghitung risiko stunting 3 bulan ke depan.
        </p>
        <Button asChild size="sm" className="mt-3 h-8 bg-emerald-700 text-xs">
          <Link to="/dashboard/pemantauan-gizi">
            <ArrowRight className="mr-1.5 h-3 w-3" />
            Input Data Gizi
          </Link>
        </Button>
      </section>
    );
  }

  return (
    <section
      className={`rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] ${className}`}
    >
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Brain className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Peringatan Dini Berbasis AI
          </p>
          <h3 className="text-sm font-bold text-slate-900 sm:text-base">
            Prediksi Risiko Stunting (3 Bulan)
          </h3>
        </div>
      </header>

      <div className="space-y-2.5">
        {items.map(({ child, prediction }) => {
          const style = levelStyles[prediction.risk_level];
          const Icon = style.icon;
          const scorePct = Math.round(prediction.risk_score * 100);
          const topFactors = (prediction.dominant_factors || []).slice(0, 3);

          return (
            <article
              key={child.id}
              className={`rounded-2xl border p-3 ${style.wrap}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">
                    {child.full_name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {child.age_months} bulan
                    {child.gender ? ` • ${child.gender === "male" ? "Laki-laki" : "Perempuan"}` : ""}
                  </p>
                </div>

                <Badge className={`gap-1 border ${style.badge}`}>
                  <Icon className="h-3 w-3" />
                  Risiko {RISK_LEVEL_LABEL[prediction.risk_level]}
                </Badge>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <div className={`text-2xl font-black tracking-tight ${style.text}`}>
                  {scorePct}%
                </div>
                <div className="flex-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/80">
                    <div
                      className={`h-full rounded-full ${
                        prediction.risk_level === "high"
                          ? "bg-rose-500"
                          : prediction.risk_level === "medium"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(2, scorePct))}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Probabilitas stunting dalam {prediction.horizon_months} bulan
                  </p>
                </div>
              </div>

              {topFactors.length > 0 && (
                <ul className="mt-2.5 grid gap-1">
                  {topFactors.map((f) => {
                    const FIcon =
                      f.direction === "risk" ? TrendingUp : TrendingDown;
                    return (
                      <li
                        key={f.name}
                        className="flex items-start gap-1.5 text-[11px] text-slate-700"
                      >
                        {f.direction === "risk" ? (
                          <FIcon className="mt-0.5 h-3 w-3 shrink-0 text-rose-500" />
                        ) : (
                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                        )}
                        <span>
                          <strong className="font-semibold">{f.label}</strong>
                          {" — "}
                          <span className="text-slate-500">
                            nilai {f.value}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRecompute(child.id)}
                  disabled={recomputing === child.id}
                  className="h-8 border-slate-200 bg-white text-xs"
                >
                  <RefreshCw
                    className={`mr-1.5 h-3 w-3 ${
                      recomputing === child.id ? "animate-spin" : ""
                    }`}
                  />
                  Perbarui
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="h-8 bg-emerald-700 text-xs hover:bg-emerald-800"
                >
                  <Link to="/dashboard/rekomendasi-ai">
                    Lihat Rekomendasi
                    <ArrowRight className="ml-1.5 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
