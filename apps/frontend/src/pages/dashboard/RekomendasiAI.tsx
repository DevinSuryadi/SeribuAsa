import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, ShoppingBasket, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { mockRecommendations } from '@/data/mockData';
import { useStaggerChildren } from '@/hooks/useStaggerChildren';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const RekomendasiAI = () => {
  const gridRef = useStaggerChildren({ stagger: 0.15 });
  const [expanded, setExpanded] = useState<string | null>(null);

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

        <div ref={gridRef} className="space-y-4">
          {mockRecommendations.map((rec) => (
            <Card key={rec.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2 bg-accent/10 text-accent-foreground border-accent/20">
                      <Sparkles className="h-3 w-3 mr-1" /> {rec.forGroup}
                    </Badge>
                    <CardTitle className="text-lg">{rec.title}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{rec.confidence}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {rec.items.map((item) => (
                    <Badge key={item} variant="secondary">{item}</Badge>
                  ))}
                </div>

                <button
                  onClick={() => setExpanded(expanded === rec.id ? null : rec.id)}
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  {expanded === rec.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  Mengapa rekomendasi ini?
                </button>

                {expanded === rec.id && (
                  <div className="rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
                    {rec.reason}
                  </div>
                )}

                <Button variant="outline" className="gap-2" asChild>
                  <Link to="/dashboard/katalog">
                    <ShoppingBasket className="h-4 w-4" /> Belanja Paket Ini
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RekomendasiAI;
