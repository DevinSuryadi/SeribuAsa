import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles, ShoppingBasket, Info, RefreshCw, Zap, Leaf, Apple,
  Target, TrendingUp, ArrowRight, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { useStaggerChildren } from '@/hooks/useStaggerChildren';
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getRecommendations } from '@/services/recommendations';
import { toast } from 'sonner';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  action_items?: string[];
  impact_score?: number;
}

const priorityConfig = {
  high: {
    label: 'Prioritas Tinggi',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    strip: 'bg-red-500',
    badge: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertCircle,
  },
  medium: {
    label: 'Prioritas Sedang',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    strip: 'bg-amber-400',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Zap,
  },
  low: {
    label: 'Info',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    strip: 'bg-blue-400',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Info,
  },
};

const categoryIcon: Record<string, React.ElementType> = {
  gizi: Leaf,
  stunting: Target,
  protein: Apple,
  default: TrendingUp,
};

function RecommendationCard({ rec, index }: { rec: Recommendation; index: number }) {
  const cfg = priorityConfig[rec.priority] || priorityConfig.low;
  const PriorityIcon = cfg.icon;
  const CatIcon = categoryIcon[rec.category?.toLowerCase()] || categoryIcon.default;
  const impactPct = Math.min(100, Math.max(20, rec.impact_score ?? 60 + index * 7));

  return (
    <div
      className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Priority color strip */}
      <div className={`w-1 flex-shrink-0 ${cfg.strip}`} />

      <div className="flex-1 p-5">
        {/* Header badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className={`text-[10px] font-semibold border ${cfg.badge} flex items-center gap-1`}>
              <PriorityIcon className="h-2.5 w-2.5" />
              {cfg.label}
            </Badge>
            <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 flex items-center gap-1">
              <CatIcon className="h-2.5 w-2.5" />
              {rec.category}
            </Badge>
          </div>
          <div className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg ${cfg.bg}`}>
            <Sparkles className={`h-4 w-4 ${cfg.color}`} />
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-foreground text-base mb-2 leading-snug group-hover:text-primary transition-colors">
          {rec.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {rec.description}
        </p>

        {/* Impact progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Dampak Nutrisi</p>
            <p className="text-[10px] font-bold text-foreground">{impactPct}%</p>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${cfg.strip}`}
              style={{ width: `${impactPct}%` }}
            />
          </div>
        </div>

        {/* Action items */}
        {rec.action_items && rec.action_items.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {rec.action_items.map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground border border-border hover:bg-primary/5 hover:text-primary hover:border-primary/20 cursor-default transition-colors"
              >
                <CheckCircle2 className="h-2.5 w-2.5" />
                {item}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 group/btn border-primary/20 hover:bg-primary hover:text-primary-foreground transition-colors" asChild>
          <Link to="/dashboard/katalog">
            <ShoppingBasket className="h-3 w-3" />
            Belanja Paket Ini
            <ArrowRight className="h-3 w-3 ml-auto opacity-0 -translate-x-1 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all" />
          </Link>
        </Button>
      </div>
    </div>
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

  return (
    <DashboardLayout title="Rekomendasi Nutrisi AI" subtitle="Saran paket nutrisi berdasarkan kebutuhan keluarga Anda.">
      <div className="space-y-6">

        {/* AI Hero Banner */}
        <div
          className="relative rounded-2xl overflow-hidden p-6"
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #7c3aed 100%)' }}
        >
          {/* Animated sparkle circles */}
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/5 animate-pulse" />
          <div className="absolute right-16 bottom-2 h-16 w-16 rounded-full bg-white/5" />
          <div className="absolute left-1/2 top-1 h-10 w-10 rounded-full bg-white/5" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-0 text-xs">AI Powered</Badge>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Analisis Gizi Cerdas</h2>
              <p className="text-sm text-white/75 max-w-sm leading-relaxed">
                Rekomendasi disusun berdasarkan{' '}
                <strong className="text-white">pedoman Kemenkes RI</strong> &{' '}
                <strong className="text-white">panduan WHO</strong>, disesuaikan kondisi anak Anda.
              </p>
            </div>
            <div className="flex-shrink-0 hidden sm:flex flex-col items-center gap-1 text-white/60">
              <div className="text-3xl font-extrabold text-white">{recommendations.length}</div>
              <div className="text-xs">Rekomendasi</div>
            </div>
          </div>

          <div className="relative z-10 mt-4 flex gap-2">
            <Button
              size="sm"
              className="bg-white text-blue-700 hover:bg-blue-50 border-0 text-xs font-semibold gap-1.5"
              onClick={fetchRecommendations}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              Perbarui Analisis
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 text-xs gap-1.5"
              asChild
            >
              <Link to="/dashboard/survei-fies">
                <Target className="h-3 w-3" />
                Isi Survei FIES
              </Link>
            </Button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex bg-card border border-border rounded-2xl overflow-hidden">
                <div className="w-1 bg-secondary flex-shrink-0" />
                <div className="flex-1 p-5 animate-pulse space-y-3">
                  <div className="flex gap-2">
                    <div className="h-5 w-24 bg-secondary rounded-full" />
                    <div className="h-5 w-20 bg-secondary rounded-full" />
                  </div>
                  <div className="h-5 w-3/4 bg-secondary rounded" />
                  <div className="h-4 w-full bg-secondary rounded" />
                  <div className="h-4 w-2/3 bg-secondary rounded" />
                  <div className="h-1.5 w-full bg-secondary rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Gagal memuat rekomendasi</p>
                <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchRecommendations} className="flex-shrink-0">
                <RefreshCw className="mr-1 h-3 w-3" /> Coba Lagi
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && recommendations.length === 0 && (
          <div className="text-center rounded-2xl border border-dashed border-border bg-card py-16 px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Belum Ada Rekomendasi</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
              Isi survei FIES dan input data gizi anak untuk mendapatkan rekomendasi personal.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button asChild>
                <Link to="/dashboard/survei-fies">
                  <Target className="h-4 w-4 mr-2" /> Isi Survei FIES
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/dashboard/pemantauan-gizi">
                  <TrendingUp className="h-4 w-4 mr-2" /> Input Data Gizi
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Recommendations Grid */}
        {!loading && !error && recommendations.length > 0 && (
          <div ref={gridRef} className="space-y-4">
            {/* Priority summary bar */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{recommendations.length} rekomendasi</span>
              <span>·</span>
              {(['high', 'medium', 'low'] as const).map((p) => {
                const count = recommendations.filter((r) => r.priority === p).length;
                if (!count) return null;
                return (
                  <span key={p} className={`font-medium ${priorityConfig[p].color}`}>
                    {count} {priorityConfig[p].label.toLowerCase()}
                  </span>
                );
              })}
            </div>

            {/* Cards grouped by priority */}
            {(['high', 'medium', 'low'] as const).map((priority) => {
              const group = recommendations.filter((r) => r.priority === priority);
              if (!group.length) return null;
              return (
                <div key={priority}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`h-2 w-2 rounded-full ${priorityConfig[priority].strip}`} />
                    <p className={`text-xs font-semibold uppercase tracking-wider ${priorityConfig[priority].color}`}>
                      {priorityConfig[priority].label}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {group.map((rec, i) => (
                      <RecommendationCard key={rec.id} rec={rec} index={i} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RekomendasiAI;
