import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { History, AlertTriangle, Users } from "lucide-react"

// Dummy data for demo
const dummyTransactions = [
  { id: 1, type: "allocation", amount: 300000, date: "2026-03-28", source: "Donasi dari Donatur A" },
  { id: 2, type: "redemption", amount: -75000, date: "2026-03-25", source: "Penukaran di Warung B" },
  { id: 3, type: "allocation", amount: 200000, date: "2026-03-15", source: "Donasi dari Donatur C" },
]

export default function BeneficiaryDashboard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      navigate("/masuk")
    }
  }, [user, loading, navigate])

  useEffect(() => {
    const timer = setTimeout(() => setDataLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const totalBalance = 300000
  const activeVouchers = 2
  const expiringSoon = 1

  if (loading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
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
            Rp {totalBalance.toLocaleString("id-ID")}
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
          <div className="space-y-4">
            {dummyTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{tx.source}</p>
                  <p className="text-sm text-gray-500">{tx.date}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                    {tx.amount > 0 ? "+" : ""}Rp {Math.abs(tx.amount).toLocaleString("id-ID")}
                  </p>
                  <Badge variant={tx.type === "allocation" ? "default" : "secondary"} className="mt-1">
                    {tx.type === "allocation" ? "Alokasi" : "Penukaran"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
