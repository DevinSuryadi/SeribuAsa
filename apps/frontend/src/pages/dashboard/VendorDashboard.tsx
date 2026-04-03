import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Store, Wallet, Package, BarChart3, QrCode, ArrowRight } from 'lucide-react';
import { formatIDR, formatDate } from '@/lib/format';
import { mockVendorOrders } from '@/data/mockData';
import { useStaggerChildren } from '@/hooks/useStaggerChildren';
import { Link } from 'react-router-dom';

export default function VendorDashboard() {
  const gridRef = useStaggerChildren({ stagger: 0.1 });
  const statusColor: Record<string, string> = {
    selesai: 'bg-primary/10 text-primary border-primary/20',
    diproses: 'bg-accent/10 text-accent-foreground border-accent/20',
    dibatalkan: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  return (
    <DashboardLayout title="Dashboard Vendor" subtitle="Kelola produk dan penukaran voucher.">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard Vendor</h1>
            <p className="text-sm text-muted-foreground">Kelola produk dan penukaran voucher.</p>
          </div>
          <Button className="gap-2 self-start" asChild>
            <Link to="/dashboard/penukaran"><QrCode className="h-4 w-4" /> Tukar Voucher</Link>
          </Button>
        </div>

        <div ref={gridRef} className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary mb-3">
                <Store className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground tracking-tight">24</div>
              <p className="text-sm text-muted-foreground mt-1">Pesanan Voucher</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Bulan ini</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-primary tracking-tight truncate">{formatIDR(3600000)}</div>
              <p className="text-sm text-muted-foreground mt-1">Pendapatan</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Bulan ini</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary mb-3">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground tracking-tight">18</div>
              <p className="text-sm text-muted-foreground mt-1">Produk Aktif</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Dari 20 produk</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary tracking-tight">Lunas</div>
              <p className="text-sm text-muted-foreground mt-1">Settlement</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Periode Maret</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Orders - 3 cols */}
          <Card className="flex flex-col lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Pesanan Terbaru</CardTitle>
                <CardDescription>Penukaran voucher oleh penerima manfaat</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
                <Link to="/dashboard/penukaran">Semua <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4">
                {mockVendorOrders.map((o) => (
                  <div key={o.id} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-secondary">
                      <Store className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{o.beneficiary}</div>
                      <div className="text-xs text-muted-foreground truncate">{formatDate(o.date)} · {o.items.join(', ')}</div>
                    </div>
                    <div className="text-right flex-shrink-0 flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{formatIDR(o.total)}</span>
                      <Badge variant="outline" className={`text-[10px] ${statusColor[o.status]}`}>{o.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Links - 2 cols */}
          <Card className="flex flex-col lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Aksi Cepat</CardTitle>
              <CardDescription>Menu vendor</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-2">
                {[
                  { label: 'Tukar Voucher', desc: 'Scan & verifikasi voucher', icon: QrCode, href: '/dashboard/penukaran', accent: true },
                  { label: 'Kelola Produk', desc: 'Tambah & edit produk', icon: Package, href: '/dashboard/kelola-produk', accent: false },
                  { label: 'Settlement', desc: 'Riwayat pencairan dana', icon: BarChart3, href: '/dashboard/settlement', accent: false },
                ].map((action) => (
                  <Link
                    key={action.label}
                    to={action.href}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-primary/5 ${
                      action.accent ? 'border-primary/30 bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${action.accent ? 'bg-primary/10' : 'bg-secondary'}`}>
                      <action.icon className={`h-4 w-4 ${action.accent ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground">{action.label}</div>
                      <div className="text-xs text-muted-foreground">{action.desc}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
