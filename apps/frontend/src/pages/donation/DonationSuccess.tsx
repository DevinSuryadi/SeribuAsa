import { useNavigate, useLocation } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Heart, Users, Calendar, ArrowRight, Home } from "lucide-react"

export default function DonationSuccess() {
  const navigate = useNavigate()
  const location = useLocation()
  const { donationId, amount, transactionId, impact } = location.state || {}

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700">Pembayaran Berhasil!</CardTitle>
          <p className="text-gray-600 mt-2">
            Terima kasih atas donasi Anda. Kontribusi Anda sangat berarti.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Transaction Details */}
          <div className="rounded-lg bg-gray-50 p-4 space-y-3">
            <h4 className="font-medium">Detail Transaksi</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID Transaksi</span>
                <span className="font-mono text-xs">{transactionId || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Jumlah Donasi</span>
                <span className="font-semibold">Rp {amount?.toLocaleString("id-ID") || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <Badge variant="default" className="bg-green-600">Berhasil</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Impact Section */}
          {impact && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <h4 className="font-medium text-green-800 flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Dampak Donasi Anda
              </h4>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <Users className="mx-auto h-6 w-6 text-green-600" />
                  <p className="mt-1 text-2xl font-bold text-green-700">{impact.children_helped || 1}</p>
                  <p className="text-xs text-green-600">Anak Terbantu</p>
                </div>
                <div className="text-center">
                  <Calendar className="mx-auto h-6 w-6 text-green-600" />
                  <p className="mt-1 text-2xl font-bold text-green-700">{impact.months_of_support || 1}</p>
                  <p className="text-xs text-green-600">Bulan Dukungan</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-center text-green-700 font-medium">
                {impact.message || "Terima kasih atas kontribusi Anda!"}
              </p>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
              onClick={() => navigate("/dashboard")}
            >
              Lihat Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/")}
            >
              <Home className="mr-2 h-4 w-4" />
              Kembali ke Beranda
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
