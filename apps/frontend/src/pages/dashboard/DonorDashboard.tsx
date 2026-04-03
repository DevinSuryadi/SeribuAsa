import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Heart, Users, TrendingUp, ArrowUpRight } from "lucide-react"

// Dummy data for demo
const dummyDonations = [
  { id: 1, amount: 300000, date: "2026-03-28", status: "success", recipient: "Anak A" },
  { id: 2, amount: 500000, date: "2026-03-15", status: "success", recipient: "Anak B" },
  { id: 3, amount: 150000, date: "2026-03-01", status: "pending", recipient: null },
]

export default function DonorDashboard() {
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

  const totalDonated = dummyDonations
    .filter((d) => d.status === "success")
    .reduce((sum, d) => sum + d.amount, 0)

  const childrenHelped = dummyDonations.filter((d) => d.recipient).length

  if (loading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <DashboardLayout title="Ringkasan" subtitle="Selamat datang kembali, Donatur!">
      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donasi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {totalDonated.toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground">Dari {dummyDonations.filter((d) => d.status === "success").length} donasi berhasil</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anak Terbantu</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{childrenHelped}</div>
            <p className="text-xs text-muted-foreground">Menerima bantuan nutrisi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dampak</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1 Bulan</div>
            <p className="text-xs text-muted-foreground">Rata-rata dukungan per anak</p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Recent Donations */}
      <Card>
        <CardHeader>
          <CardTitle>Donasi Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dummyDonations.map((donation) => (
              <div key={donation.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">
                    Rp {donation.amount.toLocaleString("id-ID")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {donation.date}
                    {donation.recipient && ` • ${donation.recipient}`}
                  </p>
                </div>
                <Badge variant={donation.status === "success" ? "default" : "secondary"}>
                  {donation.status === "success" ? "Berhasil" : "Pending"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
