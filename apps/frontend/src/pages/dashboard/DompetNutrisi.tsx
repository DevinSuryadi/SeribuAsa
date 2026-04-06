import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, QrCode, Info } from 'lucide-react';
import { formatIDR, formatDate } from '@/lib/format';
import { mockBeneficiaryTransactions, mockCategories } from '@/data/mockData';
import { useStaggerChildren } from '@/hooks/useStaggerChildren';

const DompetNutrisi = () => {
  const listRef = useStaggerChildren({ stagger: 0.05 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <DashboardLayout title="Dompet Nutrisi" subtitle="Saldo e-voucher dan riwayat transaksi Anda.">
      <div className="space-y-6">
        {/* Balance Card */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Saldo E-Voucher Anda</p>
                <div className="text-4xl font-extrabold text-primary">{formatIDR(450000)}</div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Berlaku s/d 28 Mar 2026</Badge>
                  <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/20">1000 HPK</Badge>
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
              {mockCategories.map((cat) => (
                <Badge key={cat} variant="outline" className="text-sm py-1 px-3">
                  {cat}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">⚠️ Voucher hanya dapat digunakan untuk bahan pangan bergizi mentah. Makanan olahan dan junk food tidak diperbolehkan.</p>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={listRef} className="space-y-3">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-secondary" />
                      <div>
                        <div className="h-4 w-32 bg-secondary rounded" />
                        <div className="h-3 w-24 bg-secondary rounded mt-2" />
                      </div>
                    </div>
                    <div className="h-8 w-20 bg-secondary rounded" />
                  </div>
                ))
              ) : (
                mockBeneficiaryTransactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${t.type === 'credit' ? 'bg-primary/10' : 'bg-secondary'}`}>
                        {t.type === 'credit' ? <ArrowDownRight className="h-4 w-4 text-primary" /> : <ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{t.description}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(t.date)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${t.type === 'credit' ? 'text-primary' : 'text-foreground'}`}>
                        {t.type === 'credit' ? '+' : '-'}{formatIDR(Math.abs(t.amount))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DompetNutrisi;
