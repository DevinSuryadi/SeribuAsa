import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, MapPin, TrendingUp, Users, Heart, CreditCard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { formatIDR } from '@/lib/format';
import { mockImpactMetrics } from '@/data/mockData';

const COLORS = ['hsl(152, 55%, 33%)', 'hsl(210, 65%, 45%)', 'hsl(30, 95%, 55%)', 'hsl(220, 10%, 46%)'];

const allocationData = [
  { region: 'Jawa Barat', penerima: 3, voucher: 9 },
  { region: 'NTT', penerima: 2, voucher: 6 },
  { region: 'Jawa Timur', penerima: 3, voucher: 9 },
];

const DonorDampak = () => {
  const { totalDonated, childrenHelped, familiesSupported, vouchersAllocated, vouchersRedeemed, redemptionRate, monthlyTrend, topCategories } = mockImpactMetrics;

  return (
    <DashboardLayout title="Dampak Donasi Anda" subtitle="Lihat bagaimana donasi Anda membuat perubahan nyata.">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Donasi', value: formatIDR(totalDonated), icon: Heart, accent: true },
            { label: 'Anak Terbantu', value: `${childrenHelped} anak`, icon: Users, accent: false },
            { label: 'Keluarga Didukung', value: `${familiesSupported} keluarga`, icon: Users, accent: false },
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
            { label: 'Voucher Dialokasikan', value: `${vouchersAllocated} voucher`, icon: CreditCard },
            { label: 'Voucher Ditukarkan', value: `${vouchersRedeemed} voucher`, icon: BarChart3 },
            { label: 'Tingkat Penukaran', value: `${redemptionRate}%`, icon: TrendingUp },
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
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(220, 10%, 46%)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(220, 10%, 46%)', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: any) => formatIDR(value)} contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 15%, 90%)', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="amount" stroke="hsl(152, 55%, 33%)" strokeWidth={2} dot={{ fill: 'hsl(152, 55%, 33%)' }} name="Donasi" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader><CardTitle>Penggunaan Voucher per Kategori</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={topCategories} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }: { name: string; value: any }) => `${name}: ${value}%`}>
                    {topCategories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 15%, 90%)', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Regional Allocation */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Alokasi per Wilayah</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={allocationData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="region" tick={{ fill: 'hsl(220, 10%, 46%)' }} />
                <YAxis tick={{ fill: 'hsl(220, 10%, 46%)' }} />
                <Tooltip contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 15%, 90%)', borderRadius: '8px' }} />
                <Bar dataKey="penerima" fill="hsl(152, 55%, 33%)" name="Penerima" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DonorDampak;
