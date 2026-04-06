import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CreditCard, Pause, Play, XCircle, ArrowUp, Baby, CheckCircle, Heart, Wallet, QrCode, Landmark } from 'lucide-react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { formatIDR, formatDate } from '@/lib/format';
import { getDonations } from '@/services/donations';
import { toast } from 'sonner';

const paymentMethods = [
  { id: 'qris', label: 'QRIS', icon: QrCode },
  { id: 'va_bca', label: 'VA BCA', icon: Landmark },
  { id: 'va_mandiri', label: 'VA Mandiri', icon: Landmark },
  { id: 'gopay', label: 'GoPay', icon: Wallet },
  { id: 'cc', label: 'Kartu Kredit', icon: CreditCard },
];

const upgradePlans = [
  { id: '1000hpk', name: 'Paket 1000 HPK', price: 500000, icon: Heart },
];

const DonorLangganan = () => {
  const { user } = useAuth();
  const [showCancel, setShowCancel] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paused, setPaused] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('');
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      getDonations()
        .then((data) => {
          setSubscriptions(data.items || []);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [user]);

  const currentPlan = useMemo(() => {
    if (subscriptions.length === 0) return { name: 'Belum ada langganan', price: 0, icon: Baby };
    const latest = subscriptions[0];
    const config = latest.subscription_config || {};
    return {
      name: config.plan_name || `Langganan ${formatIDR(latest.amount)}/bulan`,
      price: parseFloat(latest.amount),
      icon: Baby,
    };
  }, [subscriptions]);

  const totalPaid = useMemo(
    () => subscriptions.filter((s) => s.status === 'success').reduce((sum, s) => sum + parseFloat(s.amount || 0), 0),
    [subscriptions]
  );

  const currentPaymentMethod = useMemo(() => {
    if (subscriptions.length === 0) return 'qris';
    return subscriptions[0].payment_method || 'qris';
  }, [subscriptions]);

  const currentMethodLabel = paymentMethods.find((m) => m.id === currentPaymentMethod)?.label || 'QRIS';

  const handleUpgrade = (plan: typeof upgradePlans[0]) => {
    setShowUpgrade(false);
    toast.success(`Berhasil upgrade ke ${plan.name}!`, { description: `Tagihan berikutnya: ${formatIDR(plan.price)}/bulan` });
  };

  const handleChangePayment = () => {
    if (selectedPayment) {
      setShowPayment(false);
      const method = paymentMethods.find((m) => m.id === selectedPayment);
      toast.success(`Metode pembayaran diubah ke ${method?.label}`);
    }
  };

  const handleCancel = () => {
    setShowCancel(false);
    setCancelled(true);
    toast.warning('Langganan dibatalkan', { description: 'Bantuan akan berhenti di akhir periode.' });
  };

  const handleReactivate = () => {
    setCancelled(false);
    toast.success('Langganan diaktifkan kembali!');
  };

  if (loading) {
    return (
      <DashboardLayout title="Kelola Langganan" subtitle="Atur langganan donasi bulanan Anda.">
        <div className="space-y-4">
          <Card><CardContent className="pt-6"><div className="animate-pulse space-y-3"><div className="h-10 w-48 bg-secondary rounded" /><div className="h-4 w-32 bg-secondary rounded" /><div className="grid grid-cols-2 gap-3 mt-4">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-12 bg-secondary rounded" />))}</div></div></CardContent></Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Kelola Langganan" subtitle="Atur langganan donasi bulanan Anda.">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Gagal memuat data</p>
            <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-1 h-3 w-3" /> Coba Lagi
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Kelola Langganan" subtitle="Atur langganan donasi bulanan Anda.">
      <div className="space-y-6">
        {/* Active Subscription */}
        <Card className={cancelled ? 'border-destructive/30' : 'border-primary/30'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cancelled ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                  <currentPlan.icon className={`h-5 w-5 ${cancelled ? 'text-destructive' : 'text-primary'}`} />
                </div>
                <div>
                  <CardTitle>{currentPlan.name}</CardTitle>
                  <CardDescription>
                    {subscriptions.length > 0
                      ? `Langganan sejak ${formatDate(subscriptions[subscriptions.length - 1]?.created_at)}`
                      : 'Belum ada langganan aktif'}
                  </CardDescription>
                </div>
              </div>
              <Badge className={
                cancelled ? 'bg-destructive/10 text-destructive border-destructive/20'
                : paused ? 'bg-orange-100 text-orange-700 border-orange-200'
                : 'bg-primary/10 text-primary border-primary/20'
              }>
                {cancelled ? 'Dibatalkan' : paused ? 'Dijeda' : subscriptions.length > 0 ? 'Aktif' : 'Tidak Aktif'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-secondary/50 p-4 grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Jumlah:</span><div className="font-bold text-foreground">{currentPlan.price > 0 ? `${formatIDR(currentPlan.price)}/bulan` : '—'}</div></div>
              <div><span className="text-muted-foreground">Metode:</span><div className="font-medium text-foreground">{currentMethodLabel}</div></div>
              <div><span className="text-muted-foreground">Pembayaran Berikutnya:</span><div className="font-medium text-foreground">{cancelled ? '—' : subscriptions.length > 0 ? 'Bulan depan' : '—'}</div></div>
              <div><span className="text-muted-foreground">Total Dibayar:</span><div className="font-medium text-foreground">{totalPaid > 0 ? formatIDR(totalPaid) : '—'}</div></div>
            </div>

            <div className="flex flex-wrap gap-2">
              {!cancelled && subscriptions.length > 0 ? (
                <>
                  <Button variant="outline" className="gap-2" onClick={() => { setPaused(!paused); toast.info(paused ? 'Langganan dilanjutkan' : 'Langganan dijeda'); }}>
                    {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {paused ? 'Lanjutkan' : 'Jeda'}
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => setShowUpgrade(true)}>
                    <ArrowUp className="h-4 w-4" /> Upgrade
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => { setSelectedPayment(currentPaymentMethod); setShowPayment(true); }}>
                    <CreditCard className="h-4 w-4" /> Ganti Pembayaran
                  </Button>
                  <Button variant="ghost" className="gap-2 text-destructive" onClick={() => setShowCancel(true)}>
                    <XCircle className="h-4 w-4" /> Batalkan
                  </Button>
                </>
              ) : cancelled ? (
                <Button className="gap-2" onClick={handleReactivate}>
                  <Play className="h-4 w-4" /> Aktifkan Kembali
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">Anda belum memiliki langganan aktif.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Dialog */}
        <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upgrade Langganan</DialogTitle>
              <DialogDescription>Pilih paket yang lebih tinggi untuk dampak lebih besar.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {upgradePlans.map((plan) => (
                <Card key={plan.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleUpgrade(plan)}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <plan.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{plan.name}</div>
                        <div className="text-sm text-muted-foreground">{formatIDR(plan.price)}/bulan</div>
                      </div>
                    </div>
                    <Button size="sm">Pilih</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Change Payment Dialog */}
        <Dialog open={showPayment} onOpenChange={setShowPayment}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ganti Metode Pembayaran</DialogTitle>
              <DialogDescription>Pilih metode pembayaran baru untuk langganan Anda.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Metode Pembayaran</Label>
                <Select value={selectedPayment} onValueChange={setSelectedPayment}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih metode" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <span className="flex items-center gap-2">
                          <m.icon className="h-4 w-4" /> {m.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowPayment(false)}>Batal</Button>
                <Button onClick={handleChangePayment} disabled={!selectedPayment || selectedPayment === currentPaymentMethod}>Simpan</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Confirmation */}
        <Dialog open={showCancel} onOpenChange={setShowCancel}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Batalkan Langganan?</DialogTitle>
              <DialogDescription>
                Langganan Anda akan dihentikan di akhir periode yang sudah dibayar.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowCancel(false)}>Tidak, Tetap Lanjut</Button>
              <Button variant="destructive" onClick={handleCancel}>Ya, Batalkan</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Billing History */}
        <Card>
          <CardHeader><CardTitle>Riwayat Tagihan</CardTitle></CardHeader>
          <CardContent>
            {subscriptions.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Belum ada riwayat tagihan</p>
              </div>
            ) : (
              subscriptions.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between border-b border-border/50 py-3 last:border-0">
                  <div className="text-sm text-muted-foreground">{formatDate(bill.created_at)}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">{formatIDR(bill.amount)}</span>
                    <Badge variant="outline" className={`text-[10px] ${
                      bill.status === 'success' ? 'bg-primary/10 text-primary border-primary/20' :
                      bill.status === 'pending' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                      'bg-destructive/10 text-destructive border-destructive/20'
                    }`}>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {bill.status === 'success' ? 'Lunas' : bill.status === 'pending' ? 'Pending' : bill.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DonorLangganan;
