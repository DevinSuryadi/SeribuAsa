import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { History, AlertTriangle, Users, RefreshCw, AlertCircle } from "lucide-react"
import { getVoucherBalance, getVoucherHistory } from "@/services/vouchers"
import { toast } from "sonner"

export default function BeneficiaryDashboard() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [balance, setBalance] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/masuk")
    }
  }, [user, authLoading, navigate])

  const fetchData = async () => {
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
  }

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const totalBalance = balance?.total_balance || 0
  const activeVouchers = balance?.active_vouchers?.length || 0
  const expiringSoon = balance?.expiring_soon?.count || 0

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
    <DashboardLayout title="Ringkasan" subtitle="Selamat datang kembali!">
      {/* Balance Card */}
      <Card className="mb-8 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">Saldo Voucher Anda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-700">
            Rp {parseFloat(totalBalance || 0).toLocaleString("id-ID")}
          </div>
          <div className="mt-4 flex gap-6">
            <div>
              <p className="text-sm text-green-600">Voucher Aktif</p>
              <p className="text-xl font-semibold text-green-800">{activeVouchers}</p>
            </div>
            <div>
              <p className="text-sm text-green-600">Segera Kadaluarsa</p>
              <p className="text-xl font-semibold text-amber-600">{expiringSoon}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Keluarga</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4 Orang</div>
            <p className="text-xs text-muted-foreground">Anggota keluarga terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status FIES</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Moderate</div>
            <p className="text-xs text-muted-foreground">Skor FIES: 5/8</p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Riwayat Transaksi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Belum ada transaksi</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{tx.source || tx.description}</p>
                    <p className="text-sm text-gray-500">
                      {tx.date ? new Date(tx.date).toLocaleDateString("id-ID") : "-"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${(tx.amount || 0) > 0 ? "text-green-600" : "text-red-600"}`}>
                      {(tx.amount || 0) > 0 ? "+" : ""}Rp {Math.abs(tx.amount || 0).toLocaleString("id-ID")}
                    </p>
                    <Badge variant={tx.type === "allocation" ? "default" : "secondary"} className="mt-1">
                      {tx.type === "allocation" ? "Alokasi" : "Penukaran"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
