import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText, Search, Heart, RefreshCw, AlertCircle } from 'lucide-react';
import { formatIDR, formatDate } from '@/lib/format';
import { getDonations } from '@/services/donations';
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
  const { user } = useAuth();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchDonations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDonations();
      setDonations(data.items || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat riwayat donasi');
      toast.error('Gagal memuat riwayat donasi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchDonations();
    }
  }, [user, fetchDonations]);

  const filtered = useMemo(() => donations.filter((d: any) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (search) {
      const typeLabel = d.type === 'subscription' ? 'Donasi Langganan' : 'Donasi Satu Kali';
      return typeLabel.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  }), [donations, search, statusFilter]);

  const totalDonated = useMemo(
    () => filtered.filter((d: any) => d.status === 'success').reduce((sum: number, d: any) => sum + parseFloat(d.amount || 0), 0),
    [filtered]
  );

  if (loading) {
    return (
      <DashboardLayout title="Riwayat Donasi" subtitle="Semua transaksi donasi Anda.">
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
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
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Riwayat Donasi" subtitle="Semua transaksi donasi Anda.">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Gagal memuat data</p>
            <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDonations}>
            <RefreshCw className="mr-1 h-3 w-3" /> Coba Lagi
          </Button>
        </div>
      </DashboardLayout>
    );
  }

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
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Tidak ada donasi ditemukan</p>
                <Button variant="link" onClick={() => navigate('/donation/create')} className="mt-2">
                  Buat donasi pertama Anda
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((d: any) => {
                  const typeLabel = d.type === 'subscription' ? 'Donasi Langganan' : 'Donasi Satu Kali';
                  return (
                    <div
                      key={d.id}
                      className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 -mx-2 px-2 rounded-lg transition-colors hover:bg-secondary/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{typeLabel}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(d.created_at)} • {d.payment_method?.replace('_', ' ')}</div>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <div className="font-semibold text-foreground">{formatIDR(d.amount)}</div>
                          <Badge variant="outline" className={`text-[10px] ${statusColor[d.status]}`}>
                            {statusLabel[d.status] || d.status}
                          </Badge>
                        </div>
                        {d.status === 'success' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.success('Mengunduh kwitansi...')}>
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DonorRiwayat;
