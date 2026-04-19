import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Wallet,
  ShoppingCart,
  QrCode,
  Heart,
  Download,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatIDR } from "@/lib/format";
import { apiFetch } from "@/services/api";
import { toast } from "sonner";
import { useStaggerChildren } from "@/hooks/useStaggerChildren";

interface AdminStats {
  users: {
    total: number;
    donors: number;
    beneficiaries: number;
    vendors: number;
  };
  vouchers: {
    active_count: number;
    total_balance: number;
  };
  orders: {
    total: number;
    completed: number;
  };
  redemptions: {
    total_count: number;
    total_amount: number;
  };
  donations: {
    total_amount: number;
  };
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export default function AdminDashboard() {
  const gridRef = useStaggerChildren({ stagger: 0.1 });
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/admin/stats");
      setStats(data);
    } catch (err: any) {
      setError(err.message);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleExport = async (type: string) => {
    try {
      const token = await import("@/integrations/supabase/client").then((m) =>
        m.supabase.auth.getSession()
      );
      const response = await fetch(`${API_BASE}/admin/export/${type}`, {
        headers: {
          Authorization: `Bearer ${token.data.session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Berhasil export ${type}.csv`);
    } catch (err: any) {
      toast.error(err.message || "Gagal export");
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard Admin" subtitle="Kelola sistem dan data SeribuAsa.">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-10 w-10 rounded-lg bg-secondary mb-3" />
                  <div className="h-8 w-24 bg-secondary rounded mb-2" />
                  <div className="h-4 w-16 bg-secondary rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Dashboard Admin" subtitle="Kelola sistem dan data SeribuAsa.">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Gagal memuat data</p>
            <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStats}>
            <RefreshCw className="mr-1 h-3 w-3" /> Coba Lagi
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard Admin" subtitle="Kelola sistem dan data SeribuAsa.">
      <div className="space-y-6">
        {/* Export Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport("users")}>
            <Download className="mr-2 h-4 w-4" /> Export Users
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("orders")}>
            <Download className="mr-2 h-4 w-4" /> Export Orders
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("vouchers")}>
            <Download className="mr-2 h-4 w-4" /> Export Vouchers
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("redemptions")}>
            <Download className="mr-2 h-4 w-4" /> Export Redemptions
          </Button>
        </div>

        {/* User Stats */}
        <div ref={gridRef} className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary mb-3">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground tracking-tight">
                {stats?.users.total || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 mb-3">
                <Heart className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-foreground tracking-tight">
                {stats?.users.donors || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Donors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 mb-3">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-foreground tracking-tight">
                {stats?.users.beneficiaries || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Beneficiaries</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 mb-3">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-foreground tracking-tight">
                {stats?.users.vendors || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Vendors</p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-primary tracking-tight truncate">
                {formatIDR(stats?.vouchers.total_balance || 0)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Total Voucher Balance</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                {stats?.vouchers.active_count || 0} active vouchers
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 mb-3">
                <QrCode className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">
                {formatIDR(stats?.redemptions.total_amount || 0)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Total Redemptions</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                {stats?.redemptions.total_count || 0} transactions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary mb-3">
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground tracking-tight">
                {stats?.orders.completed || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Completed Orders</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                dari {stats?.orders.total || 0} total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 mb-3">
                <Heart className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">
                {formatIDR(stats?.donations.total_amount || 0)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Total Donations</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
