import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CreditCard, Download, CheckCircle, Clock, ArrowRight, Wallet, Calendar } from 'lucide-react';
import { formatIDR, formatDate } from '@/lib/format';
import { useStaggerChildren } from '@/hooks/useStaggerChildren';
import { toast } from 'sonner';

const settlements = [
  { id: 's1', period: 'Februari 2026', amount: 3600000, status: 'pending', date: '2026-02-28', items: 24, method: 'Transfer Bank BCA' },
  { id: 's2', period: 'Januari 2026', amount: 4200000, status: 'lunas', date: '2026-02-05', items: 28, method: 'Transfer Bank BCA' },
  { id: 's3', period: 'Desember 2025', amount: 3800000, status: 'lunas', date: '2026-01-06', items: 22, method: 'Transfer Bank BCA' },
  { id: 's4', period: 'November 2025', amount: 3100000, status: 'lunas', date: '2025-12-05', items: 19, method: 'Transfer Bank BCA' },
  { id: 's5', period: 'Oktober 2025', amount: 2900000, status: 'lunas', date: '2025-11-04', items: 17, method: 'Transfer Bank BCA' },
];

const VendorSettlement = () => {
  const navigate = useNavigate();
  const gridRef = useStaggerChildren({ stagger: 0.1 });
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<typeof settlements[0] | null>(null);
  const [loading, setLoading] = useState(true);

  const totalEarned = settlements.filter(s => s.status === 'lunas').reduce((a, b) => a + b.amount, 0);
  const pending = settlements.filter(s => s.status === 'pending');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleClaim = (settlement: typeof settlements[0]) => {
    setSelectedSettlement(settlement);
    setShowClaimModal(true);
  };

  const handleClaimSubmit = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success(`Klaim berhasil diajukan. Pencairan ${formatIDR(selectedSettlement?.amount || 0)} akan diproses dalam 1-3 hari kerja.`);
    setShowClaimModal(false);
    setSelectedSettlement(null);
  };

  return (
    <DashboardLayout title="Settlement" subtitle="Riwayat pencairan dana voucher yang telah ditukarkan.">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settlement</h1>
            <p className="text-sm text-muted-foreground">Riwayat pencairan dana voucher yang telah ditukarkan.</p>
          </div>
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
              <p className="text-xs text-muted-foreground/70 mt-0.5">4 periode</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 mb-3">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">{formatIDR(pending.reduce((a, b) => a + b.amount, 0))}</div>
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
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 border-b border-border/50 pb-4 last:border-0 animate-pulse">
                      <div className="h-10 w-10 rounded-full bg-secondary" />
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-secondary rounded" />
                        <div className="h-3 w-24 bg-secondary rounded mt-2" />
                      </div>
                      <div className="h-8 w-24 bg-secondary rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                settlements.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 border-b border-border/50 pb-4 last:border-0 last:pb-0">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${s.status === 'lunas' ? 'bg-primary/10' : 'bg-accent/10'}`}>
                      {s.status === 'lunas' ? <CheckCircle className="h-5 w-5 text-primary" /> : <Clock className="h-5 w-5 text-accent" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">Periode {s.period}</div>
                      <div className="text-xs text-muted-foreground">{s.items} transaksi · {s.method}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-foreground">{formatIDR(s.amount)}</div>
                      <div className="flex items-center gap-2 mt-1 justify-end">
                        <Badge variant="outline" className={`text-[10px] ${s.status === 'lunas' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-accent/10 text-accent-foreground border-accent/20'}`}>
                          {s.status === 'lunas' ? 'Dicairkan' : 'Pending'}
                        </Badge>
                        {s.status === 'pending' && (
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
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Claim Modal */}
      <Dialog open={showClaimModal} onOpenChange={setShowClaimModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Klaim Settlement</DialogTitle>
            <DialogDescription>Ajukan pencairan dana untuk periode {selectedSettlement?.period}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary/50 p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Periode:</span><span className="font-medium">{selectedSettlement?.period}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Jumlah:</span><span className="font-bold text-primary">{formatIDR(selectedSettlement?.amount || 0)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Transaksi:</span><span className="font-medium">{selectedSettlement?.items} item</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Metode:</span><span className="font-medium">{selectedSettlement?.method}</span></div>
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
