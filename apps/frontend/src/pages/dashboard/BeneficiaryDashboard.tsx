import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Wallet, History, AlertTriangle, LogOut, Users } from "lucide-react"

// Dummy data for demo
const dummyTransactions = [
  { id: 1, type: "allocation", amount: 300000, date: "2026-03-28", source: "Donasi dari Donatur A" },
  { id: 2, type: "redemption", amount: -75000, date: "2026-03-25", source: "Penukaran di Warung B" },
  { id: 3, type: "allocation", amount: 200000, date: "2026-03-15", source: "Donasi dari Donatur C" },
]

export default function BeneficiaryDashboard() {
  const { user, userRole, signOut } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const totalBalance = 300000
  const activeVouchers = 2
  const expiringSoon = 1

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
              <Wallet className="text-white h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">SeribuAsa</h1>
              <p className="text-sm text-gray-500">Dashboard Penerima</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.email}</p>
              <Badge variant="secondary" className="mt-1">
                Penerima Manfaat
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
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
      </main>
    </div>
  )
}
