import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode, CheckCircle, XCircle, Search,  Loader2, RefreshCw, Eye, EyeOff, Printer } from 'lucide-react';
import { formatIDR } from '@/lib/format';
import { toast } from 'sonner';

type Step = 'scan' | 'review' | 'success' | 'failed';

interface Transaction {
  beneficiary_name: string;
  created_at: string;
  amount: number;
}

interface VoucherData {
  code: string;
  beneficiary_name: string;
  amount: number;
  description: string;
}

const PenukaranVoucherVendor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('scan');
  const [code, setCode] = useState('');
  const [voucherData, setVoucherData] = useState<VoucherData | null>(null);
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [notes, setNotes] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([
    { beneficiary_name: 'Siti Nurjanah', created_at: '2026-04-09T14:30:00Z', amount: 250000 },
    { beneficiary_name: 'Ahmad Wijaya', created_at: '2026-04-09T13:15:00Z', amount: 175000 },
    { beneficiary_name: 'Nur Azizah', created_at: '2026-04-09T11:45:00Z', amount: 320000 },
  ]);

  const handleValidate = async () => {
    if (!code.trim()) {
      toast.error('Masukkan kode voucher');
      return;
    }

    setValidating(true);
    setErrorMessage('');

    await new Promise((resolve) => setTimeout(resolve, 700));

    try {
      setVoucherData({
        code,
        beneficiary_name: 'Siti Nurjanah',
        amount: 250000,
        description: 'Voucher Bantuan Pangan',
      });
      setStep('review');
      toast.success('Voucher valid');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memvalidasi voucher');
      setStep('failed');
    } finally {
      setValidating(false);
    }
  };

  const handleScanMock = async () => {
    if (validating) return;
    setValidating(true);
    setErrorMessage('');

    await new Promise((resolve) => setTimeout(resolve, 700));

    const mockCode = 'VOC-2026-ABC123';
    setCode(mockCode);
    setVoucherData({
      code: mockCode,
      beneficiary_name: 'Siti Nurjanah',
      amount: 250000,
      description: 'Voucher Bantuan Pangan',
    });
    setStep('review');
    toast.success('QR code berhasil dipindai');
    setValidating(false);
  };

  const handleSubmit = async () => {
    if (!voucherData) {
      setErrorMessage('Data voucher tidak ditemukan');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    await new Promise((resolve) => setTimeout(resolve, 1200));

    try {
      const redemptionId = `RED-${Date.now()}`;
      setTransactionId(redemptionId);
      setStep('success');
      toast.success('Penukaran voucher berhasil disimpan!');
      setTransactions((prev) => [
        {
          beneficiary_name: voucherData.beneficiary_name,
          created_at: new Date().toISOString(),
          amount: voucherData.amount,
        },
        ...prev,
      ]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan penukaran');
      setStep('failed');
      toast.error('Penukaran gagal');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep('scan');
    setCode('');
    setNotes('');
    setErrorMessage('');
    setVoucherData(null);
    setTransactionId('');
  };

  const refreshTransactions = () => {
    toast.success('Riwayat penukaran diperbarui');
  };

  const totalRedeemed = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <DashboardLayout title="Penukaran Voucher" subtitle="Kelola penukaran voucher penerima manfaat.">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {step === 'scan' && (
              <Card className="overflow-hidden">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary/10">
                    <QrCode className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle>Mulai Pemindaian Voucher</CardTitle>
                  <CardDescription>Scan QR voucher atau masukkan kode secara manual.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-[2rem] border border-primary/20 bg-primary/5 p-6 text-center">
                    <p className="text-sm text-muted-foreground">Titik pemindaian</p>
                    <div className="mx-auto mt-4 flex h-40 w-40 items-center justify-center rounded-[2rem] border-2 border-dashed border-primary/50 bg-white/80">
                      <QrCode className="h-14 w-14 text-primary/70" />
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">Klik tombol Scan untuk memindai voucher.</p>
                    <Button className="mt-4 w-full" onClick={handleValidate} disabled={validating}>
                      {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Scan QR'}
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <Label>Kode Voucher</Label>
                      <Input
                        placeholder="VOC-2026-ABC123"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="text-center text-lg tracking-wider font-mono"
                        onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                        autoFocus
                      />
                    </div>
                    <Button className="w-full gap-2" onClick={handleValidate} disabled={validating}>
                      {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      {validating ? 'Memvalidasi...' : 'Validasi Voucher'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 'review' && voucherData && (
              <Card className="border-primary/30 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <QrCode className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Konfirmasi Penukaran Voucher</CardTitle>
                  <CardDescription>Periksa detail voucher sebelum menyimpan penukaran.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20">
                    <div className="grid gap-4 md:grid-cols-2 mb-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Kode Voucher</p>
                        <p className="mt-2 font-mono font-bold text-lg">{voucherData.code}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Penerima Manfaat</p>
                        <p className="mt-2 font-semibold text-base">{voucherData.beneficiary_name}</p>
                      </div>
                    </div>
                    <div className="border-t border-primary/20 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Deskripsi Voucher</span>
                        <span className="font-medium">{voucherData.description}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-lg font-semibold">Nilai Voucher</span>
                        <span className="text-2xl font-bold text-primary">{formatIDR(voucherData.amount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Catatan Penukaran (Opsional)</Label>
                    <Input
                      placeholder="Tambahkan catatan untuk referensi (contoh: Penukaran untuk bahan pokok)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 pt-2">
                    <Button className="w-full h-12 text-base font-semibold" onClick={handleSubmit} disabled={submitting}>
                      {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle className="h-5 w-5 mr-2" />}
                      {submitting ? 'Memproses...' : 'Konfirmasi Penukaran'}
                    </Button>
                    <Button variant="outline" className="w-full h-12 text-base" onClick={reset}>
                      <RefreshCw className="h-5 w-5 mr-2" />
                      Scan Ulang
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 'success' && voucherData && (
              <Card className="text-center">
                <CardContent className="pt-8 pb-8 space-y-5">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Penukaran Berhasil!</h2>
                  <div id="receipt" className="mx-auto max-w-sm rounded-lg border-2 border-dashed border-primary/30 bg-white p-6 text-left text-sm shadow-lg print:max-w-none print:border-solid print:shadow-none">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-primary">SeribuAsa</h3>
                      <p className="text-xs text-muted-foreground">Bukti Penukaran Voucher</p>
                      <hr className="mt-2 border-dashed border-primary/30" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Kode Voucher:</span>
                        <span className="font-mono font-semibold">{voucherData.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Penerima:</span>
                        <span className="font-semibold">{voucherData.beneficiary_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Deskripsi:</span>
                        <span className="font-semibold">{voucherData.description}</span>
                      </div>
                      <div className="flex justify-between border-t border-dashed border-primary/30 pt-2">
                        <span className="text-muted-foreground">Nominal:</span>
                        <span className="font-bold text-primary text-lg">{formatIDR(voucherData.amount)}</span>
                      </div>
                    </div>
                    <hr className="my-4 border-dashed border-primary/30" />
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>ID Transaksi:</span>
                        <span className="font-mono">{transactionId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Waktu:</span>
                        <span>{new Date().toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vendor:</span>
                        <span>{user?.name || 'Vendor'}</span>
                      </div>
                    </div>
                    <div className="text-center mt-4 text-xs text-muted-foreground">
                      Terima kasih atas partisipasi Anda dalam program SeribuAsa
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Button className="w-full" onClick={() => window.print()} variant="outline">
                      <Printer className="h-4 w-4 mr-2" />
                      Cetak Bukti
                    </Button>
                    <Button className="w-full" onClick={reset}>
                      Penukaran Berikutnya
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => navigate('/dashboard')}>
                      Kembali ke Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 'failed' && (
              <Card className="text-center border-destructive/30">
                <CardContent className="pt-8 pb-8 space-y-4">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                    <XCircle className="h-10 w-10 text-destructive" />
                  </div>
                  <h2 className="text-2xl font-bold text-destructive">Validasi Gagal</h2>
                  <p className="text-sm text-muted-foreground">{errorMessage || 'Voucher tidak dapat ditemukan atau sudah digunakan.'}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button className="w-full" onClick={reset}>
                      Coba Lagi
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => navigate('/dashboard')}>
                      Kembali ke Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Riwayat Penukaran</CardTitle>
                  <button onClick={refreshTransactions} className="text-muted-foreground hover:text-foreground transition">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[28rem] overflow-y-auto">
                  {transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Belum ada penukaran</p>
                  ) : (
                    transactions.slice(0, 8).map((t, i) => (
                      <div key={i} className="rounded-3xl border border-border/60 bg-muted/50 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold">{t.beneficiary_name}</p>
                            <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString('id-ID')}</p>
                          </div>
                          <p className="text-sm font-semibold text-primary">{formatIDR(t.amount)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-primary">Scanner Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Fitur scan QR yang ditampilkan di UI ini adalah simulasi.</p>
                <p>
                  Untuk scan nyata, butuh integrasi kamera/browser dan library QR seperti <span className="font-semibold">html5-qrcode</span>.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PenukaranVoucherVendor;
