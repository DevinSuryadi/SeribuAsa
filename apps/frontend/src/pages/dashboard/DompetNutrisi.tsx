import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowUpRight, ArrowDownRight, QrCode, Info, RefreshCw, AlertCircle } from 'lucide-react';
import { formatIDR, formatDate } from '@/lib/format';
import { getVoucherBalance, getVoucherHistory } from '@/services/vouchers';
import { useStaggerChildren } from '@/hooks/useStaggerChildren';
import { toast } from 'sonner';

const DompetNutrisi = () => {
  const { user } = useAuth();
  const listRef = useStaggerChildren({ stagger: 0.05 });
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      const [balanceData, historyData] = await Promise.all([
        getVoucherBalance(user.id),
        getVoucherHistory(user.id),
      ]);
      setBalance(balanceData);
      setTransactions(historyData.items || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data voucher');
      toast.error('Gagal memuat data voucher');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const totalBalance = balance?.total_balance || 0;
  const activeVouchers = balance?.active_vouchers || [];
  const expiringSoon = balance?.expiring_soon?.count || 0;

  if (loading) {
    return (
      <DashboardLayout title="Dompet Nutrisi" subtitle="Saldo e-voucher dan riwayat transaksi Anda.">
        <div className="space-y-6">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="pt-6">
              <div className="animate-pulse">
                <div className="h-4 w-32 bg-secondary rounded mb-2" />
                <div className="h-10 w-48 bg-secondary rounded mb-3" />
                <div className="h-6 w-40 bg-secondary rounded" />
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Dompet Nutrisi" subtitle="Saldo e-voucher dan riwayat transaksi Anda.">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Gagal memuat data</p>
            <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="mr-1 h-3 w-3" /> Coba Lagi
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const expiryDate = activeVouchers[0]?.expiry_date
    ? new Date(activeVouchers[0].expiry_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-';

  return (
    <DashboardLayout title="Dompet Nutrisi" subtitle="Saldo e-voucher dan riwayat transaksi Anda.">
      <div className="space-y-6">
        {/* Balance Card */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Saldo E-Voucher Anda</p>
                <div className="text-4xl font-extrabold text-primary">{formatIDR(totalBalance)}</div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Berlaku s/d {expiryDate}</Badge>
                  <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/20">{activeVouchers.length} voucher aktif</Badge>
                  {expiringSoon > 0 && (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">{expiringSoon} segera kadaluarsa</Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="h-20 w-20 rounded-xl bg-card border border-border flex items-center justify-center">
                  <QrCode className="h-12 w-12 text-primary" />
                </div>
                <span className="text-[10px] text-muted-foreground">Kode Voucher</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Allowed Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> Kategori yang Diperbolehkan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {['Semua', 'Pokok', 'Protein', 'Susu', 'Sayuran', 'Buah', 'Snack'].map((cat) => (
                <Badge key={cat} variant="outline" className="text-sm py-1 px-3">
                  {cat}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">Voucher hanya dapat digunakan untuk bahan pangan bergizi mentah. Makanan olahan dan junk food tidak diperbolehkan.</p>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={listRef} className="space-y-3">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Belum ada transaksi voucher</p>
                </div>
              ) : (
                transactions.map((t: any) => {
                  const isCredit = t.type === 'allocation';
                  return (
                    <div key={t.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isCredit ? 'bg-primary/10' : 'bg-secondary'}`}>
                          {isCredit ? <ArrowDownRight className="h-4 w-4 text-primary" /> : <ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{t.description}</div>
                          <div className="text-xs text-muted-foreground">{t.date ? formatDate(t.date) : '-'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${isCredit ? 'text-primary' : 'text-foreground'}`}>
                          {isCredit ? '+' : '-'}{formatIDR(Math.abs(t.amount || 0))}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Saldo: {formatIDR(t.balance_after || 0)}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DompetNutrisi;
