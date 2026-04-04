import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CreditCard, Download, CheckCircle, Clock, ArrowRight, Wallet, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { formatIDR, formatDate } from '@/lib/format';
import { useStaggerChildren } from '@/hooks/useStaggerChildren';
import { apiFetch } from '@/services/api';
import { toast } from 'sonner';

const VendorSettlement = () => {
  const { user } = useAuth();
  const gridRef = useStaggerChildren({ stagger: 0.1 });
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<any | null>(null);

  const fetchSettlements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch('/settlements/?page=1&page_size=20');
      setSettlements(data.items || []);
    } catch (err: any) {
      setError(err.message);
      toast.error('Gagal memuat data settlement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchSettlements();
  }, [user]);

  const totalEarned = useMemo(
    () => settlements.filter((s) => s.status === 'paid' || s.status === 'ready').reduce((a, b) => a + parseFloat(b.net_amount || 0), 0),
    [settlements]
  );

  const pending = useMemo(
    () => settlements.filter((s) => s.status === 'ready' || s.status === 'pending'),
    [settlements]
  );

  const pendingTotal = useMemo(
    () => pending.reduce((a, b) => a + parseFloat(b.net_amount || 0), 0),
    [pending]
  );

  const handleClaim = (settlement: any) => {
    setSelectedSettlement(settlement);
    setShowClaimModal(true);
  };

  const handleClaimSubmit = async () => {
    toast.success(`Klaim berhasil diajukan. Pencairan ${formatIDR(selectedSettlement?.net_amount || 0)} akan diproses dalam 1-3 hari kerja.`);
    setShowClaimModal(false);
    setSelectedSettlement(null);
  };

  const statusLabel: Record<string, string> = {
    calculating: 'Menghitung',
    ready: 'Siap Cair',
    paid: 'Dicairkan',
    cancelled: 'Dibatalkan',
  };

  const statusColor: Record<string, string> = {
    calculating: 'bg-secondary text-muted-foreground',
    ready: 'bg-accent/10 text-accent-foreground border-accent/20',
    paid: 'bg-primary/10 text-primary border-primary/20',
    cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  if (loading) {
    return (
      <DashboardLayout title="Settlement" subtitle="Riwayat pencairan dana voucher yang telah ditukarkan.">
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-6"><div className="animate-pulse"><div className="h-10 w-10 rounded-lg bg-secondary mb-3" /><div className="h-6 w-24 bg-secondary rounded mb-2" /><div className="h-3 w-16 bg-secondary rounded" /></div></CardContent></Card>
            ))}
          </div>
          <Card><CardContent className="pt-6"><div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="flex items-center gap-3 border-b border-border/50 pb-4 last:border-0 animate-pulse"><div className="h-10 w-10 rounded-full bg-secondary" /><div className="flex-1"><div className="h-4 w-32 bg-secondary rounded" /><div className="h-3 w-24 bg-secondary rounded mt-2" /></div><div className="h-8 w-24 bg-secondary rounded" /></div>))}</div></CardContent></Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Settlement" subtitle="Riwayat pencairan dana voucher yang telah ditukarkan.">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Gagal memuat data</p>
            <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSettlements}>
            <RefreshCw className="mr-1 h-3 w-3" /> Coba Lagi
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settlement" subtitle="Riwayat pencairan dana voucher yang telah ditukarkan.">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1" />
          <Button variant="outline" className="gap-2 self-start" onClick={() => toast.success('Mengunduh laporan...')}>
            <Download className="h-4 w-4" /> Unduh Laporan
          </Button>
        </div>

        {/* KPI */}
        <div ref={gridRef} className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-primary tracking-tight truncate">{formatIDR(totalEarned)}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Dicairkan</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">{settlements.filter((s) => s.status === 'paid').length} periode</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 mb-3">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">{formatIDR(pendingTotal)}</div>
              <p className="text-sm text-muted-foreground mt-1">Menunggu Cair</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">{pending.length} periode</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary mb-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground tracking-tight">BCA</div>
              <p className="text-sm text-muted-foreground mt-1">Rekening Tujuan</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">****4821</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary mb-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground tracking-tight">Tgl 5</div>
              <p className="text-sm text-muted-foreground mt-1">Jadwal Cair</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Setiap bulan</p>
            </CardContent>
          </Card>
        </div>

        {/* Settlement List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riwayat Settlement</CardTitle>
            <CardDescription>Pencairan dana dari penukaran voucher</CardDescription>
          </CardHeader>
          <CardContent>
            {settlements.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Belum ada settlement</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Settlement akan muncul setelah ada penukaran voucher</p>
              </div>
            ) : (
              <div className="space-y-4">
                {settlements.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 border-b border-border/50 pb-4 last:border-0 last:pb-0">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${s.status === 'paid' ? 'bg-primary/10' : 'bg-accent/10'}`}>
                      {s.status === 'paid' ? <CheckCircle className="h-5 w-5 text-primary" /> : <Clock className="h-5 w-5 text-accent" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        Periode {s.period_start ? formatDate(s.period_start) : '-'} s/d {s.period_end ? formatDate(s.period_end) : '-'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {s.vendor_store_name || 'Vendor'}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-foreground">{formatIDR(s.net_amount)}</div>
                      <div className="flex items-center gap-2 mt-1 justify-end">
                        <Badge variant="outline" className={`text-[10px] ${statusColor[s.status] || ''}`}>
                          {statusLabel[s.status] || s.status}
                        </Badge>
                        {(s.status === 'ready' || s.status === 'calculating') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs gap-1"
                            onClick={() => handleClaim(s)}
                          >
                            <ArrowRight className="h-3 w-3" /> Klaim
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Claim Modal */}
      <Dialog open={showClaimModal} onOpenChange={setShowClaimModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Klaim Settlement</DialogTitle>
            <DialogDescription>
              Ajukan pencairan dana untuk periode {selectedSettlement?.period_start ? formatDate(selectedSettlement.period_start) : '-'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary/50 p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Periode:</span><span className="font-medium">{selectedSettlement?.period_start ? formatDate(selectedSettlement.period_start) : '-'} s/d {selectedSettlement?.period_end ? formatDate(selectedSettlement.period_end) : '-'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Redemptions:</span><span className="font-medium">{formatIDR(selectedSettlement?.total_redemptions || 0)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Admin Fee:</span><span className="font-medium">{formatIDR(selectedSettlement?.admin_fee || 0)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Jumlah Bersih:</span><span className="font-bold text-primary">{formatIDR(selectedSettlement?.net_amount || 0)}</span></div>
            </div>
            <Button className="w-full" onClick={handleClaimSubmit}>Ajukan Klaim</Button>
            <Button variant="ghost" className="w-full" onClick={() => setShowClaimModal(false)}>Batal</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default VendorSettlement;
