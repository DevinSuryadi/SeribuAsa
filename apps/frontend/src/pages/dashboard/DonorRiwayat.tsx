import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText, Search, Heart } from 'lucide-react';
import { formatIDR, formatDate } from '@/lib/format';
import { mockDonorTransactions } from '@/data/mockData';
import { toast } from 'sonner';

const statusColor: Record<string, string> = {
  success: 'bg-primary/10 text-primary border-primary/20',
  pending: 'bg-accent/10 text-accent-foreground border-accent/20',
  failed: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusLabel: Record<string, string> = {
  success: 'Sukses',
  pending: 'Pending',
  failed: 'Gagal',
};

const DonorRiwayat = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filtered = mockDonorTransactions.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search && !t.plan.toLowerCase().includes(search.toLowerCase()) && !t.recipient?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalDonated = filtered
    .filter((t) => t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <DashboardLayout title="Riwayat Donasi" subtitle="Semua transaksi donasi Anda.">
      <div className="space-y-6">
        {/* Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total donasi berhasil</p>
            <p className="text-2xl font-bold text-primary">{formatIDR(totalDonated)}</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => toast.success('Mengunduh riwayat...')}>
            <Download className="h-4 w-4" /> Unduh
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari donasi..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1.5">
            {['all', 'success', 'pending', 'failed'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {s === 'all' ? 'Semua' : statusLabel[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction List */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary" />
                      <div>
                        <div className="h-4 w-32 bg-secondary rounded" />
                        <div className="h-3 w-24 bg-secondary rounded mt-2" />
                      </div>
                    </div>
                    <div className="h-8 w-24 bg-secondary rounded" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Tidak ada donasi ditemukan</p>
                <Button variant="link" onClick={() => navigate('/donation/create')} className="mt-2">
                  Buat donasi pertama Anda
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 -mx-2 px-2 rounded-lg transition-colors hover:bg-secondary/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{t.plan}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(t.date)} • {t.method}</div>
                        {t.recipient && <div className="text-xs text-muted-foreground mt-0.5">{t.recipient}</div>}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <div className="font-semibold text-foreground">{formatIDR(t.amount)}</div>
                        <Badge variant="outline" className={`text-[10px] ${statusColor[t.status]}`}>
                          {statusLabel[t.status]}
                        </Badge>
                      </div>
                      {t.status === 'success' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.success('Mengunduh kwitansi...')}>
                          <Download className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DonorRiwayat;
