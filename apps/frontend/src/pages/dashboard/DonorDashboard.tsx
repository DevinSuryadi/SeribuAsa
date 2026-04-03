import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Users, TrendingUp, ArrowUpRight, RefreshCw, AlertCircle, Plus } from "lucide-react"
import { getDonations } from "@/services/donations"
import { toast } from "sonner"

export default function DonorDashboard() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [donations, setDonations] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
            <p className="text-xs text-muted-foreground">Dari {donations.filter((d) => d.status === "success").length} donasi berhasil</p>
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

      {/* Quick Action */}
      <div className="mt-6 flex justify-end">
        <Button onClick={() => navigate("/donation/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Donasi Baru
        </Button>
      </div>

      <Separator className="my-8" />

      {/* Recent Donations */}
      <Card>
        <CardHeader>
          <CardTitle>Donasi Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {donations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Belum ada donasi</p>
              <Button variant="link" onClick={() => navigate("/donation/create")} className="mt-2">
                Buat donasi pertama Anda
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {donations.map((donation: any) => (
                <div key={donation.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">
                      Rp {parseFloat(donation.amount || 0).toLocaleString("id-ID")}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(donation.created_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <Badge variant={donation.status === "success" ? "default" : "secondary"}>
                    {donation.status === "success" ? "Berhasil" : donation.status === "pending" ? "Pending" : donation.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
