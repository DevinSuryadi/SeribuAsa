import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CreditCard, Pause, Play, XCircle, ArrowUp, Baby, CheckCircle, Heart, Wallet, QrCode, Landmark } from 'lucide-react';
import { formatIDR } from '@/lib/format';
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
  const [showCancel, setShowCancel] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paused, setPaused] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [currentPlan] = useState({ name: 'Adopsi Nutrisi 1 Balita', price: 300000, icon: Baby });
  const [currentPayment] = useState('qris');
  const [selectedPayment, setSelectedPayment] = useState('');

  const handleUpgrade = (plan: typeof upgradePlans[0]) => {
    setShowUpgrade(false);
    toast.success(`Berhasil upgrade ke ${plan.name}!`, { description: `Tagihan berikutnya: ${formatIDR(plan.price)}/bulan` });
  };

  const handleChangePayment = () => {
    if (selectedPayment) {
      setShowPayment(false);
      const method = paymentMethods.find(m => m.id === selectedPayment);
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

  const currentMethodLabel = paymentMethods.find(m => m.id === currentPayment)?.label || 'QRIS';

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
                  <CardDescription>Langganan bulanan sejak November 2025</CardDescription>
                </div>
              </div>
              <Badge className={
                cancelled ? 'bg-destructive/10 text-destructive border-destructive/20'
                : paused ? 'bg-accent/10 text-accent-foreground border-accent/20'
                : 'bg-primary/10 text-primary border-primary/20'
              }>
                {cancelled ? 'Dibatalkan' : paused ? 'Dijeda' : 'Aktif'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-secondary/50 p-4 grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Jumlah:</span><div className="font-bold text-foreground">{formatIDR(currentPlan.price)}/bulan</div></div>
              <div><span className="text-muted-foreground">Metode:</span><div className="font-medium text-foreground">{currentMethodLabel}</div></div>
              <div><span className="text-muted-foreground">Pembayaran Berikutnya:</span><div className="font-medium text-foreground">{cancelled ? '—' : '1 Apr 2026'}</div></div>
              <div><span className="text-muted-foreground">Total Dibayar:</span><div className="font-medium text-foreground">{formatIDR(1200000)}</div></div>
            </div>

            <div className="flex flex-wrap gap-2">
              {!cancelled ? (
                <>
                  <Button variant="outline" className="gap-2" onClick={() => { setPaused(!paused); toast.info(paused ? 'Langganan dilanjutkan' : 'Langganan dijeda'); }}>
                    {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {paused ? 'Lanjutkan' : 'Jeda'}
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => setShowUpgrade(true)}>
                    <ArrowUp className="h-4 w-4" /> Upgrade
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => { setSelectedPayment(currentPayment); setShowPayment(true); }}>
                    <CreditCard className="h-4 w-4" /> Ganti Pembayaran
                  </Button>
                  <Button variant="ghost" className="gap-2 text-destructive" onClick={() => setShowCancel(true)}>
                    <XCircle className="h-4 w-4" /> Batalkan
                  </Button>
                </>
              ) : (
                <Button className="gap-2" onClick={handleReactivate}>
                  <Play className="h-4 w-4" /> Aktifkan Kembali
                </Button>
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
                <Button onClick={handleChangePayment} disabled={!selectedPayment || selectedPayment === currentPayment}>Simpan</Button>
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
                Langganan Anda akan dihentikan di akhir periode yang sudah dibayar. 8 keluarga yang Anda dukung akan kehilangan bantuan nutrisi bulanan.
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
            {[
              { date: '1 Mar 2026', amount: 300000, status: 'Lunas' },
              { date: '1 Feb 2026', amount: 300000, status: 'Lunas' },
              { date: '1 Jan 2026', amount: 300000, status: 'Lunas' },
              { date: '1 Des 2025', amount: 300000, status: 'Lunas' },
            ].map((bill, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border/50 py-3 last:border-0">
                <div className="text-sm text-muted-foreground">{bill.date}</div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">{formatIDR(bill.amount)}</span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                    <CheckCircle className="h-3 w-3 mr-1" />{bill.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DonorLangganan;
