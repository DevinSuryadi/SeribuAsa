import { useEffect, useState, useMemo, useCallback } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Wallet, ClipboardList, Activity, ShoppingBasket, ArrowRight, AlertTriangle, RefreshCw, AlertCircle } from "lucide-react"
import { getVoucherBalance, getVoucherHistory } from "@/services/vouchers"
import { formatIDR, formatDate } from "@/lib/format"
import { useStaggerChildren } from "@/hooks/useStaggerChildren"
import { toast } from "sonner"

export default function BeneficiaryDashboard() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [balance, setBalance] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const gridRef = useStaggerChildren({ stagger: 0.1 })

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login")
    }
  }, [user, authLoading, navigate])

  const fetchData = useCallback(async () => {
    if (!user?.id) return
    
    try {
      setDataLoading(true)
      setError(null)
      
      const [balanceData, historyData] = await Promise.all([
        getVoucherBalance(user.id),
        getVoucherHistory(user.id),
      ])
      
      setBalance(balanceData)
      setTransactions(historyData.items || [])
    } catch (err: any) {
      setError(err.message || "Gagal memuat data voucher")
      toast.error("Gagal memuat data voucher")
    } finally {
      setDataLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, fetchData])

  const totalBalance = useMemo(() => balance?.total_balance || 0, [balance])
  const activeVouchers = useMemo(() => balance?.active_vouchers?.length || 0, [balance])
  const expiringSoon = useMemo(() => balance?.expiring_soon?.count || 0, [balance])

  if (authLoading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <DashboardLayout title="Ringkasan" subtitle="Selamat datang kembali!">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Gagal memuat data</AlertTitle>
          <AlertDescription className="flex items-center gap-2 mt-2">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="mr-1 h-3 w-3" />
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Beranda Penerima Manfaat" subtitle="Kelola voucher nutrisi dan pantau kesehatan keluarga Anda.">
      <div className="space-y-6">
        {/* FIES Reminder Banner */}
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10">
            <AlertTriangle className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground text-sm">Survei FIES Bulan Ini Belum Diisi</div>
            <p className="text-xs text-muted-foreground mt-0.5">Isi survei untuk mempertahankan kelayakan voucher.</p>
          </div>
          <Button size="sm" className="flex-shrink-0" asChild>
            <Link to="/dashboard/survei-fies">Isi Survei</Link>
          </Button>
        </div>

        {/* KPI Cards */}
        <div ref={gridRef} className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <Card className="border-primary/30 bg-primary/5 col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">1000 HPK</Badge>
              </div>
              <div className="text-3xl font-extrabold text-primary tracking-tight">{formatIDR(totalBalance)}</div>
              <p className="text-sm text-muted-foreground mt-1">Saldo E-Voucher</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                {activeVouchers} voucher aktif
                {expiringSoon > 0 && ` · ${expiringSoon} segera kadaluarsa`}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <ClipboardList className="h-5 w-5 text-accent" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">Belum</div>
              <p className="text-sm text-muted-foreground mt-1">Survei FIES</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Wajib bulan ini</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-bold text-primary">Normal</div>
              <p className="text-sm text-muted-foreground mt-1">Status Gizi Anak</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Z-score: -0.8</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Recent Transactions - takes 3 cols */}
          <Card className="flex flex-col lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Transaksi Terakhir</CardTitle>
                <CardDescription>Aktivitas voucher terbaru</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
                <Link to="/dashboard/dompet">Semua <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="flex-1">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Belum ada transaksi</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.slice(0, 4).map((t: any) => {
                    const isCredit = (t.amount || 0) > 0;
                    return (
                      <div key={t.id} className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${isCredit ? 'bg-primary/10' : 'bg-secondary'}`}>
                          <Wallet className={`h-4 w-4 ${isCredit ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{t.description || t.source}</div>
                          <div className="text-xs text-muted-foreground">{t.date ? formatDate(t.date) : '-'}</div>
                        </div>
                        <div className={`text-sm font-semibold flex-shrink-0 ${isCredit ? 'text-primary' : 'text-foreground'}`}>
                          {isCredit ? '+' : '-'}{formatIDR(Math.abs(t.amount || 0))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions - takes 2 cols */}
          <Card className="flex flex-col lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Aksi Cepat</CardTitle>
              <CardDescription>Fitur yang sering digunakan</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-2">
                {[
                  { label: 'Belanja Pangan', desc: 'Beli bahan makanan bergizi', icon: ShoppingBasket, href: '/dashboard/katalog', accent: true },
                  { label: 'Penukaran Voucher', desc: 'Tukar voucher di vendor', icon: Wallet, href: '/dashboard/penukaran', accent: false },
                  { label: 'Isi Survei FIES', desc: 'Survei ketahanan pangan', icon: ClipboardList, href: '/dashboard/survei-fies', accent: false },
                  { label: 'Cek Gizi Anak', desc: 'Input data tumbuh kembang', icon: Activity, href: '/dashboard/pemantauan-gizi', accent: false },
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
  )
}
