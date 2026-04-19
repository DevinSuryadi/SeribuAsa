import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Store,
  Wallet,
  Package,
  BarChart3,
  QrCode,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ArrowDownToLine,
} from "lucide-react";
import { formatIDR, formatDate } from "@/lib/format";
import { getOrders, updateOrderStatus } from "@/services/orders";
import { getProducts } from "@/services/products";
import type { SalesReport } from "@/services/reports";
import { getSalesReport } from "@/services/reports";
import {
  getWalletBalance,
  requestWithdrawal,
  getWithdrawalHistory,
} from "@/services/vendor-wallet";
import { useStaggerChildren } from "@/hooks/useStaggerChildren";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const MIN_WITHDRAWAL = 50000;

export default function VendorDashboard() {
  const { user } = useAuth();
  const gridRef = useStaggerChildren({ stagger: 0.1 });
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wallet state
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const [ordersData, productsData, reportData, walletData] = await Promise.all([
        getOrders(),
        getProducts({ vendor_id: user?.id || "" }),
        getSalesReport(startDate, endDate),
        getWalletBalance(),
      ]);
      setOrders(ordersData.items || []);
      setProducts(productsData.items || []);
      setReport(reportData);
      setWalletBalance(walletData.balance || 0);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data");
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const totalOrders = orders.length;
  const totalRevenue = useMemo(() => {
    if (report?.summary?.total_sales) {
      return report.summary.total_sales;
    }
    return orders
      .filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  }, [report, orders]);
  const activeProducts = useMemo(
    () => products.filter((p) => p.approval_status === "approved").length,
    [products]
  );
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => o.status === "pending").length;
  }, [orders]);

  const statusColor: Record<string, string> = {
    completed: "bg-primary/10 text-primary border-primary/20",
    pending: "bg-orange-100 text-orange-700 border-orange-200",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const statusLabel: Record<string, string> = {
    completed: "Selesai",
    pending: "Pending",
    cancelled: "Dibatalkan",
  };

  const handleStatusUpdate = useCallback(
    async (orderId: string, status: "completed" | "cancelled") => {
      try {
        await updateOrderStatus(orderId, status);
        toast.success(`Pesanan ${status === "completed" ? "diselesaikan" : "dibatalkan"}`);
        fetchData();
      } catch (err: any) {
        toast.error(err.message || "Gagal memperbarui status");
      }
    },
    [fetchData]
  );

  const handleWithdraw = useCallback(async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < MIN_WITHDRAWAL) {
      toast.error(`Minimum penarikan Rp ${MIN_WITHDRAWAL.toLocaleString("id-ID")}`);
      return;
    }
    if (amount > walletBalance) {
      toast.error("Saldo tidak mencukupi");
      return;
    }

    try {
      setWithdrawLoading(true);
      await requestWithdrawal(amount);
      toast.success(`Penarikan Rp ${amount.toLocaleString("id-ID")} berhasil diproses`);
      setWithdrawModalOpen(false);
      setWithdrawAmount("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Gagal memproses penarikan");
    } finally {
      setWithdrawLoading(false);
    }
  }, [withdrawAmount, walletBalance, fetchData]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Dashboard Vendor" subtitle="Kelola produk dan penukaran voucher.">
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

  return (
    <DashboardLayout title="Dashboard Vendor" subtitle="Kelola produk dan penukaran voucher.">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button className="gap-2 self-start" asChild>
            <Link to="/dashboard/penukaran">
              <QrCode className="h-4 w-4" /> Tukar Voucher
            </Link>
          </Button>
        </div>

        <div ref={gridRef} className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary mb-3">
                <Store className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground tracking-tight">{totalOrders}</div>
              <p className="text-sm text-muted-foreground mt-1">Pesanan Voucher</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">{pendingOrders} pending</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-primary tracking-tight truncate">
                {formatIDR(walletBalance)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Saldo E-Wallet</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 h-7 text-xs gap-1"
                onClick={() => setWithdrawModalOpen(true)}
                disabled={walletBalance < MIN_WITHDRAWAL}
              >
                <ArrowDownToLine className="h-3 w-3" /> Tarik Dana
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary mb-3">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground tracking-tight">
                {activeProducts}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Produk Aktif</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                Dari {products.length} produk
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary tracking-tight">
                {orders.length > 0 ? "Aktif" : "-"}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Settlement</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Periode berjalan</p>
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
                <Link to="/dashboard/penukaran">
                  Semua <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="flex-1">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Store className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Belum ada pesanan</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 8).map((o) => (
                    <div key={o.id} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-secondary">
                        <Store className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          Order #{o.id.slice(0, 8)}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {formatDate(o.created_at)}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {formatIDR(o.total_amount)}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${statusColor[o.status] || ""}`}
                        >
                          {statusLabel[o.status] || o.status}
                        </Badge>
                      </div>
                      {o.status === "pending" && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-primary"
                            onClick={() => handleStatusUpdate(o.id, "completed")}
                            aria-label="Selesaikan pesanan"
                            title="Selesaikan"
                          >
                            ✓
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive"
                            onClick={() => handleStatusUpdate(o.id, "cancelled")}
                            aria-label="Batalkan pesanan"
                            title="Batalkan"
                          >
                            ✕
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
                  {
                    label: "Tukar Voucher",
                    desc: "Scan & verifikasi voucher",
                    icon: QrCode,
                    href: "/dashboard/penukaran",
                    accent: true,
                  },
                  {
                    label: "Kelola Produk",
                    desc: "Tambah & edit produk",
                    icon: Package,
                    href: "/dashboard/kelola-produk",
                    accent: false,
                  },
                  {
                    label: "Settlement",
                    desc: "Riwayat pencairan dana",
                    icon: BarChart3,
                    href: "/dashboard/settlement",
                    accent: false,
                  },
                ].map((action) => (
                  <Link
                    key={action.label}
                    to={action.href}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-primary/5 ${
                      action.accent ? "border-primary/30 bg-primary/5" : "border-border"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${action.accent ? "bg-primary/10" : "bg-secondary"}`}
                    >
                      <action.icon
                        className={`h-4 w-4 ${action.accent ? "text-primary" : "text-muted-foreground"}`}
                      />
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

      {/* Withdrawal Modal */}
      <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tarik Dana ke Rekening</DialogTitle>
            <DialogDescription>
              Minimum penarikan Rp {MIN_WITHDRAWAL.toLocaleString("id-ID")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary/50 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo Tersedia:</span>
                <span className="font-medium">{formatIDR(walletBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rekening:</span>
                <span className="font-medium">***4821</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Jumlah Penarikan</label>
              <Input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Rp 50.000"
                className="mt-1"
              />
            </div>
            <Button className="w-full" onClick={handleWithdraw} disabled={withdrawLoading}>
              {withdrawLoading ? "Memproses..." : "Tarik Dana"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
