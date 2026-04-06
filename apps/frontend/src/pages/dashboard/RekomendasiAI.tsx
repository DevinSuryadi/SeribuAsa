import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, ShoppingBasket, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { useStaggerChildren } from '@/hooks/useStaggerChildren';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecommendations } from '@/services/recommendations';
import { toast } from 'sonner';

const RekomendasiAI = () => {
  const gridRef = useStaggerChildren({ stagger: 0.15 });
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getRecommendations();
      setRecommendations(res.data?.recommendations || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat rekomendasi');
      toast.error('Gagal memuat rekomendasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const priorityColor: Record<string, string> = {
    high: 'bg-destructive/10 text-destructive border-destructive/20',
    medium: 'bg-accent/10 text-accent-foreground border-accent/20',
    low: 'bg-primary/10 text-primary border-primary/20',
  };

  const priorityLabel: Record<string, string> = {
    high: 'Prioritas Tinggi',
    medium: 'Prioritas Sedang',
    low: 'Info',
  };

  if (loading) {
    return (
      <DashboardLayout title="Rekomendasi Nutrisi" subtitle="Saran paket nutrisi berdasarkan kebutuhan keluarga Anda.">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><div className="animate-pulse space-y-3"><div className="h-6 w-48 bg-secondary rounded" /><div className="h-4 w-32 bg-secondary rounded" /><div className="h-4 w-full bg-secondary rounded" /></div></CardContent></Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Rekomendasi Nutrisi" subtitle="Saran paket nutrisi berdasarkan kebutuhan keluarga Anda.">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Gagal memuat data</p>
            <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRecommendations}>
            <RefreshCw className="mr-1 h-3 w-3" /> Coba Lagi
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Rekomendasi Nutrisi" subtitle="Saran paket nutrisi berdasarkan kebutuhan keluarga Anda.">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-accent" />
        </div>

        <div className="rounded-lg bg-secondary/50 border border-border p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            Rekomendasi ini disusun berdasarkan <strong className="text-foreground">pedoman gizi Kemenkes RI</strong> dan <strong className="text-foreground">panduan WHO</strong>, disesuaikan dengan tahap kehamilan atau usia anak Anda. Sistem kami menggunakan pendekatan berbasis aturan yang siap ditingkatkan ke model AI.
          </div>
        </div>

        {recommendations.length === 0 ? (
          <Card className="text-center"><CardContent className="pt-8 pb-8"><Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" /><p className="text-muted-foreground">Belum ada rekomendasi</p><p className="text-sm text-muted-foreground/70 mt-1">Isi survei FIES dan input data gizi anak untuk mendapatkan rekomendasi</p></CardContent></Card>
        ) : (
          <div ref={gridRef} className="space-y-4">
            {recommendations.map((rec) => (
              <Card key={rec.id} className="transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={`text-[10px] ${priorityColor[rec.priority] || ''}`}>
                          {priorityLabel[rec.priority] || rec.priority}
                        </Badge>
                        <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/20">
                          <Sparkles className="h-3 w-3 mr-1" /> {rec.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {rec.action_items && rec.action_items.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {rec.action_items.map((item: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
                      ))}
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">{rec.description}</p>

                  <Button variant="outline" className="gap-2" asChild>
                    <Link to="/dashboard/katalog">
                      <ShoppingBasket className="h-4 w-4" /> Belanja Paket Ini
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RekomendasiAI;
