import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Heart, CreditCard, Users, BarChart3, ArrowRight, TrendingUp, RefreshCw, AlertCircle, Plus } from "lucide-react"
import { getDonations } from "@/services/donations"
import { formatIDR, formatDate } from "@/lib/format"
import { useStaggerChildren } from "@/hooks/useStaggerChildren"
import { toast } from "sonner"

function KPICard({ icon: Icon, label, value, sub, accent }: { icon: React.ElementType; label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <Card className={accent ? 'border-primary/30 bg-primary/5' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent ? 'bg-primary/10' : 'bg-secondary'}`}>
            <Icon className={`h-5 w-5 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
        </div>
        <div className={`text-xl sm:text-2xl font-bold tracking-tight truncate ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</div>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function DonorDashboard() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [donations, setDonations] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const gridRef = useStaggerChildren({ stagger: 0.1 })

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/masuk")
    }
  }, [user, authLoading, navigate])

  const fetchDonations = async () => {
    try {
      setDataLoading(true)
      setError(null)
      const data = await getDonations()
      setDonations(data.items || [])
    } catch (err: any) {
      setError(err.message || "Gagal memuat data donasi")
      toast.error("Gagal memuat data donasi")
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchDonations()
    }
  }, [user])

  const totalDonated = donations
    .filter((d) => d.status === "success")
    .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0)

  const childrenHelped = donations.filter((d) => d.recipient_id).length
  const redemptionRate = donations.length > 0 ? Math.round((donations.filter((d) => d.status === "success").length / donations.length) * 100) : 0

  const statusColor: Record<string, string> = {
    success: 'bg-primary/10 text-primary border-primary/20',
    pending: 'bg-accent/10 text-accent-foreground border-accent/20',
    failed: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  if (authLoading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <DashboardLayout title="Ringkasan" subtitle="Selamat datang kembali, Donatur!">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Gagal memuat data</AlertTitle>
          <AlertDescription className="flex items-center gap-2 mt-2">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchDonations}>
              <RefreshCw className="mr-1 h-3 w-3" />
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Dashboard Donatur" subtitle="Ringkasan donasi dan dampak Anda bulan ini.">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div ref={gridRef} className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <KPICard icon={Heart} label="Total Donasi" value={formatIDR(totalDonated)} sub="Bulan ini" accent />
          <KPICard icon={CreditCard} label="Langganan Aktif" value="1 Paket" sub="Adopsi Nutrisi Balita" />
          <KPICard icon={Users} label="Penerima Didukung" value={`${childrenHelped} Anak`} sub="Menerima bantuan" />
          <KPICard icon={BarChart3} label="Tingkat Penukaran" value={`${redemptionRate}%`} sub="Voucher digunakan" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Transactions */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Riwayat Donasi Terbaru</CardTitle>
                <CardDescription>Transaksi donasi terakhir Anda</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate("/dashboard/riwayat")}>
                Semua <ArrowRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1">
              {donations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Belum ada donasi</p>
                  <Button variant="link" onClick={() => navigate("/donation/create")} className="mt-2">
                    Buat donasi pertama Anda
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {donations.slice(0, 4).map((t: any) => (
                    <div key={t.id} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Heart className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {t.type === "subscription" ? "Donasi Langganan" : "Donasi Satu Kali"}
                        </div>
                        <div className="text-xs text-muted-foreground">{formatDate(t.created_at)}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-semibold text-foreground">{formatIDR(t.amount)}</div>
                        <Badge variant="outline" className={`text-[10px] ${statusColor[t.status] || ''}`}>
                          {t.status === "success" ? "Sukses" : t.status === "pending" ? "Pending" : t.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Impact Summary */}
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Dampak Bulan Ini</CardTitle>
                  <CardDescription>Statistik dampak donasi Anda</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4">
                {[
                  { label: 'Voucher ditukarkan', value: `${donations.filter((d) => d.status === "success").length} voucher`, icon: CreditCard },
                  { label: 'Anak mendapat nutrisi', value: `${childrenHelped} anak`, icon: Users },
                  { label: 'Peningkatan skor pangan', value: '+12%', icon: TrendingUp },
                  { label: 'Kategori terbanyak', value: 'Telur & Susu', icon: BarChart3 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-secondary">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="flex-1 text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Action */}
        <div className="flex justify-end">
          <Button onClick={() => navigate("/donation/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Donasi Baru
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
