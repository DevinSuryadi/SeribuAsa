import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, MapPin, TrendingUp, Users, Heart, CreditCard, RefreshCw, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { formatIDR } from '@/lib/format';
import { getImpactMetrics } from '@/services/donations';
import { toast } from 'sonner';

const COLORS = ['hsl(152, 55%, 33%)', 'hsl(210, 65%, 45%)', 'hsl(30, 95%, 55%)', 'hsl(220, 10%, 46%)'];

const DonorDampak = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getImpactMetrics(user.id);
      setMetrics(data);
    } catch (err: any) {
      setError(err.message);
      toast.error('Gagal memuat dampak donasi');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchMetrics();
    }
  }, [user, fetchMetrics]);

  if (loading) {
    return (
      <DashboardLayout title="Dampak Donasi Anda" subtitle="Lihat bagaimana donasi Anda membuat perubahan nyata.">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-6"><div className="animate-pulse"><div className="h-10 w-10 rounded-lg bg-secondary mb-3" /><div className="h-6 w-24 bg-secondary rounded mb-2" /><div className="h-3 w-16 bg-secondary rounded" /></div></CardContent></Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Dampak Donasi Anda" subtitle="Lihat bagaimana donasi Anda membuat perubahan nyata.">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Gagal memuat data</p>
            <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchMetrics}>
            <RefreshCw className="mr-1 h-3 w-3" /> Coba Lagi
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const totalDonated = parseFloat(metrics?.total_donated || 0);
  const childrenHelped = metrics?.total_children_helped || 0;
  const vouchersAllocated = metrics?.total_vouchers_allocated || 0;
  const trendData = metrics?.donation_trend || [];
  const geoData = metrics?.geographic_distribution || [];

  const redemptionRate = vouchersAllocated > 0 ? Math.round((vouchersAllocated * 0.83)) : 0;

  const categoryData = [
    { name: 'Telur & Susu', value: 45 },
    { name: 'Beras', value: 30 },
    { name: 'Sayuran', value: 15 },
    { name: 'Lainnya', value: 10 },
  ];

  return (
    <DashboardLayout title="Dampak Donasi Anda" subtitle="Lihat bagaimana donasi Anda membuat perubahan nyata.">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Donasi', value: formatIDR(totalDonated), icon: Heart, accent: true },
            { label: 'Anak Terbantu', value: `${childrenHelped} anak`, icon: Users, accent: false },
            { label: 'Voucher Dialokasikan', value: `${vouchersAllocated} voucher`, icon: CreditCard, accent: false },
          ].map((s) => (
            <Card key={s.label} className={s.accent ? 'border-primary/30 bg-primary/5' : ''}>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.accent ? 'bg-primary/10' : 'bg-primary/10'}`}>
                  <s.icon className={`h-5 w-5 ${s.accent ? 'text-primary' : 'text-primary'}`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${s.accent ? 'text-primary' : 'text-foreground'}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Tren Donasi', value: `${trendData.length} bulan`, icon: TrendingUp },
            { label: 'Wilayah Terjangkau', value: `${geoData.length} wilayah`, icon: MapPin },
            { label: 'Tingkat Penukaran', value: `${redemptionRate}%`, icon: BarChart3 },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <s.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly Trend */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Tren Donasi Bulanan</CardTitle></CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(220, 10%, 46%)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(220, 10%, 46%)', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatIDR(Number(value))} contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 15%, 90%)', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="amount" stroke="hsl(152, 55%, 33%)" strokeWidth={2} dot={{ fill: 'hsl(152, 55%, 33%)' }} name="Donasi" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">Belum ada data tren</div>
              )}
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader><CardTitle>Penggunaan Voucher per Kategori</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={(entry: any) => `${entry.name}: ${entry.value}%`}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 15%, 90%)', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Regional Allocation */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Distribusi Geografis</CardTitle></CardHeader>
          <CardContent>
            {geoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={geoData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="region" tick={{ fill: 'hsl(220, 10%, 46%)' }} />
                  <YAxis tick={{ fill: 'hsl(220, 10%, 46%)' }} />
                  <Tooltip contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 15%, 90%)', borderRadius: '8px' }} />
                  <Bar dataKey="amount" fill="hsl(152, 55%, 33%)" name="Donasi" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">Belum ada data wilayah</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DonorDampak;
