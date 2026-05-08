import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  ShoppingBasket,
  Info,
  RefreshCw,
  Apple,
  Target,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
} from 'lucide-react';
import { useStaggerChildren } from '@/hooks/useStaggerChildren';
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getRecommendations } from '@/services/recommendations';
import { toast } from 'sonner';
import foto from '@/assets/recomAI-image.svg';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  action_items?: string[];
  impact_score?: number;
}

const categoryLabel: Record<string, string> = {
  nutrition: 'Nutrisi',
  gizi: 'Gizi',
  stunting: 'Stunting',
  protein: 'Protein',
};

const categoryIcon: Record<string, React.ElementType> = {
  nutrition: TrendingUp,
  gizi: TrendingUp,
  stunting: Target,
  protein: Apple,
  default: TrendingUp,
};

const priorityConfig = {
  high: {
    color: 'text-rose-700',
    progress: 'bg-rose-500',
  },
  medium: {
    color: 'text-amber-700',
    progress: 'bg-amber-500',
  },
  low: {
    color: 'text-emerald-800',
    progress: 'bg-[#2f6f4e]',
  },
};

function RecommendationCard({ rec, index }: { rec: Recommendation; index: number }) {
  const cfg = priorityConfig[rec.priority] || priorityConfig.low;
  const categoryKey = rec.category?.toLowerCase();
  const CatIcon = categoryIcon[categoryKey] || categoryIcon.default;
  const impactPct = Math.min(100, Math.max(20, rec.impact_score ?? 60));

  return (
    <article
      className="group relative overflow-hidden rounded-[18px] border border-[#dde8de] bg-white shadow-[0_10px_30px_rgba(27,51,39,0.055)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(27,51,39,0.08)]"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="h-6 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 text-[11px] font-semibold text-emerald-800"
          >
            <CatIcon className="mr-1.5 h-3 w-3" />
            {categoryLabel[categoryKey] || rec.category}
          </Badge>
        </div>

        <div className="grid gap-3">
          <div>
            <h3 className="text-base font-semibold tracking-[-0.02em] text-[#17231d] sm:text-lg">
              {rec.title}
            </h3>

            <p className="mt-1.5 max-w-3xl text-xs leading-5 text-[#66756d] sm:text-sm">
              {rec.description}
            </p>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-4">
              <p className="text-xs font-medium text-[#617066]">Dampak Nutrisi</p>
              <p className={`text-sm font-bold ${cfg.color}`}>{impactPct}%</p>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#edf2ee]">
              <div
                className={`h-full rounded-full ${cfg.progress} transition-all duration-700`}
                style={{ width: `${impactPct}%` }}
              />
            </div>
          </div>

          {!!rec.action_items?.length && (
            <div className="flex flex-wrap gap-2">
              {rec.action_items.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe7dc] bg-[#f7faf7] px-2.5 py-1.5 text-xs text-[#53645b]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#2f6f4e]" />
                  {item}
                </span>
              ))}
            </div>
          )}

          <div>
            <Button
              size="sm"
              className="h-9 rounded-lg bg-[#165c3c] px-3.5 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(22,92,60,0.18)] transition-all hover:bg-[#0f4a30]"
              asChild
            >
              <Link to="/dashboard/katalog">
                <ShoppingBasket className="mr-2 h-3.5 w-3.5" />
                Belanja Paket Ini
                <ArrowRight className="ml-2 h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

const RekomendasiAI = () => {
  const gridRef = useStaggerChildren({ stagger: 0.12 });
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getRecommendations();
      setRecommendations(res.data?.recommendations || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat rekomendasi';
      setError(msg);
      toast.error('Gagal memuat rekomendasi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const highCount = recommendations.filter((r) => r.priority === 'high').length;
  const mediumCount = recommendations.filter((r) => r.priority === 'medium').length;
  const lowCount = recommendations.filter((r) => r.priority === 'low').length;

  return (
    <DashboardLayout
      title="Rekomendasi Nutrisi AI"
      subtitle="Saran paket nutrisi berdasarkan kebutuhan keluarga Anda."
    >
      <div className="relative mx-auto max-w-[1800px] space-y-4 pb-3">
        <div className="pointer-events-none absolute right-0 top-12 -z-10 h-52 w-52 rounded-full bg-emerald-100/25 blur-3xl" />

        <section className="relative overflow-hidden rounded-[18px] border border-[#d9e6da] bg-[#f7faf6] shadow-[0_10px_34px_rgba(27,51,39,0.055)]">
          <div className="absolute inset-0 bg-gradient-to-r from-[#f8fbf8] via-[#f8fbf8]/96 to-[#f8fbf8]/38" />

          <div className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-[62%] lg:block">
            <img
              src={foto}
              alt=""
              aria-hidden="true"
              className="absolute right-0 top-1/2 h-[130%] w-full -translate-y-1/2 object-contain object-right opacity-95"
              style={{
                WebkitMaskImage:
                  'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.18) 10%, black 28%, black 100%)',
                maskImage:
                  'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.18) 10%, black 28%, black 100%)',
              }}
            />

            <div className="absolute inset-y-0 left-0 w-56 bg-gradient-to-r from-[#f8fbf8] via-[#f8fbf8]/90 to-transparent" />
          </div>

          <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-[#f8fbf8] via-[#f8fbf8]/72 to-transparent" />

          <div className="relative z-10 grid min-h-[145px] items-center gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(280px,1fr)] lg:px-6 lg:py-5">
            <div className="max-w-md">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#d7e5d8] bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-[#2f6f4e] shadow-sm">
                <Sparkles className="h-3 w-3" />
                AI Powered
              </div>

              <h2 className="text-xl font-semibold tracking-[-0.04em] text-[#17231d] sm:text-2xl lg:text-[26px] lg:leading-[1.08]">
                Analisis Gizi Cerdas
              </h2>

              <p className="mt-2 max-w-md text-xs leading-5 text-[#5f6f67] sm:text-sm">
                Rekomendasi disusun berdasarkan{' '}
                <strong className="font-bold text-[#165c3c]">
                  pedoman Kemenkes RI
                </strong>{' '}
                dan{' '}
                <strong className="font-bold text-[#165c3c]">panduan WHO</strong>,
                disesuaikan dengan kondisi anak Anda.
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  className="h-9 rounded-lg bg-[#165c3c] px-3.5 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(22,92,60,0.18)] transition-all hover:bg-[#0f4a30]"
                  onClick={fetchRecommendations}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`mr-2 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                  />
                  Perbarui Analisis
                </Button>

                <Button
                  variant="outline"
                  className="h-9 rounded-lg border-[#cfded1] bg-white/85 px-3.5 text-xs font-semibold text-[#165c3c] shadow-sm transition-all hover:!border-[#165c3c] hover:!bg-[#eef5ee] hover:!text-[#0f4a30]"
                  asChild
                >
                  <Link to="/dashboard/survei-fies">
                    <ClipboardList className="mr-2 h-3.5 w-3.5" />
                    Isi Survei FIES
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative hidden h-full min-h-[120px] lg:block" />

            <div className="relative block overflow-hidden rounded-xl border border-[#d9e6da] bg-white/70 lg:hidden">
              <img
                src={foto}
                alt="Ilustrasi bahan makanan sehat"
                className="h-28 w-full object-contain object-right"
              />
            </div>
          </div>
        </section>

        {loading && (
          <section className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-[18px] border border-[#dfe8df] bg-white shadow-[0_10px_30px_rgba(27,51,39,0.055)]"
              >
                <div className="p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="flex gap-2">
                      <div className="h-6 w-20 rounded-full bg-[#edf2ee]" />
                      <div className="h-6 w-20 rounded-full bg-[#edf2ee]" />
                    </div>
                    <div className="h-4 w-3/4 rounded bg-[#edf2ee]" />
                    <div className="h-3.5 w-full rounded bg-[#edf2ee]" />
                    <div className="h-3.5 w-2/3 rounded bg-[#edf2ee]" />
                    <div className="h-1.5 w-full rounded-full bg-[#edf2ee]" />
                    <div className="flex gap-2">
                      <div className="h-7 w-52 rounded-full bg-[#edf2ee]" />
                      <div className="h-7 w-44 rounded-full bg-[#edf2ee]" />
                      <div className="h-7 w-36 rounded-full bg-[#edf2ee]" />
                    </div>
                    <div className="h-9 w-36 rounded-lg bg-[#edf2ee]" />
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {!loading && error && (
          <Card className="rounded-[18px] border border-red-200 bg-red-50/70 shadow-[0_10px_30px_rgba(127,29,29,0.055)]">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-red-600">
                <AlertCircle className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-red-700">
                  Gagal memuat rekomendasi
                </p>
                <p className="mt-0.5 text-xs text-red-700/70">{error}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchRecommendations}
                className="h-8 shrink-0 rounded-lg border-red-200 bg-white text-xs text-red-700 hover:bg-red-50"
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Coba Lagi
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && recommendations.length === 0 && (
          <section className="rounded-[18px] border border-dashed border-[#cadbcd] bg-white/80 px-5 py-8 text-center shadow-[0_10px_30px_rgba(27,51,39,0.055)]">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef5ee] text-[#2f6f4e]">
              <Sparkles className="h-5 w-5" />
            </div>

            <h3 className="text-base font-bold tracking-[-0.02em] text-[#17231d]">
              Belum Ada Rekomendasi
            </h3>

            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-[#66756d] sm:text-sm">
              Isi survei FIES dan input data gizi anak untuk mendapatkan rekomendasi personal.
            </p>

            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <Button
                className="h-9 rounded-lg bg-[#165c3c] px-3.5 text-xs font-semibold text-white hover:bg-[#0f4a30]"
                asChild
              >
                <Link to="/dashboard/survei-fies">
                  <Target className="mr-2 h-3.5 w-3.5" />
                  Isi Survei FIES
                </Link>
              </Button>

              <Button
                variant="outline"
                className="h-9 rounded-lg border-[#cfded1] bg-white px-3.5 text-xs font-semibold text-[#165c3c] hover:bg-[#f7faf7]"
                asChild
              >
                <Link to="/dashboard/pemantauan-gizi">
                  <TrendingUp className="mr-2 h-3.5 w-3.5" />
                  Input Data Gizi
                </Link>
              </Button>
            </div>
          </section>
        )}

        {!loading && !error && recommendations.length > 0 && (
          <section ref={gridRef} className="space-y-3">
            <div className="border-b border-[#dfe8df]">
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  className="relative inline-flex h-9 items-center gap-1.5 text-sm font-semibold text-[#165c3c]"
                >
                  <Info className="h-4 w-4" />
                  Info
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-[#6b776f]">
              <span className="rounded-full bg-[#eef5ee] px-2.5 py-1.5 font-semibold text-[#165c3c]">
                {recommendations.length} rekomendasi
              </span>

              {!!highCount && (
                <span className="rounded-full bg-rose-50 px-2.5 py-1.5 font-semibold text-rose-700">
                  {highCount} prioritas tinggi
                </span>
              )}

              {!!mediumCount && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1.5 font-semibold text-amber-700">
                  {mediumCount} prioritas sedang
                </span>
              )}

              {!!lowCount && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1.5 font-semibold text-emerald-800">
                  {lowCount} info
                </span>
              )}
            </div>

            <div className="space-y-3">
              {(['high', 'medium', 'low'] as const).map((priority) => {
                const group = recommendations.filter((r) => r.priority === priority);
                if (!group.length) return null;

                return (
                  <div key={priority} className="space-y-2.5">
                    <div className="space-y-3">
                      {group.map((rec, i) => (
                        <RecommendationCard key={rec.id} rec={rec} index={i} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RekomendasiAI;