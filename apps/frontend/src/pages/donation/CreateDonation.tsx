import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Heart, ArrowRight, Loader2, ArrowLeft, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { createDonation } from "@/services/donations"
import { formatIDR } from "@/lib/format"

const paymentLabels: Record<string, string> = {
  qris: "QRIS",
  bank_transfer: "Transfer Bank",
  e_wallet: "E-Wallet",
}

export default function CreateDonation() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)

  const [planName, setPlanName] = useState("")
  const [amount, setAmount] = useState("")
  const [donationType, setDonationType] = useState<"one_time" | "subscription">("one_time")
  const [paymentMethod, setPaymentMethod] = useState("qris")
  const [donorName, setDonorName] = useState("")
  const [donorEmail, setDonorEmail] = useState("")

  useEffect(() => {
    // Restore from checkout data
    const checkoutData = sessionStorage.getItem("donation_checkout_data")
    if (checkoutData) {
      try {
        const data = JSON.parse(checkoutData)
        if (data.plan) {
          const planNames: Record<string, string> = {
            balita: "Adopsi Nutrisi 1 Balita",
            "1000hpk": "Paket 1000 HPK",
            corporate: "Corporate Impact Plan",
          }
          setPlanName(planNames[data.plan] || "Donasi Custom")
        }
        if (data.amount) {
          setAmount(data.amount.toString())
        }
        if (data.type === "monthly") setDonationType("subscription")
        else if (data.type === "once") setDonationType("one_time")
        if (data.payment) {
          const methodMap: Record<string, string> = {
            qris: "qris",
            va_bca: "bank_transfer",
            va_mandiri: "bank_transfer",
            gopay: "e_wallet",
            cc: "bank_transfer",
          }
          setPaymentMethod(methodMap[data.payment] || "qris")
        }
        if (data.name) setDonorName(data.name)
        if (data.email) setDonorEmail(data.email)
        sessionStorage.removeItem("donation_checkout_data")
      } catch {
        // ignore
      }
    }

    // Also accept URL params as fallback
    const planAmount = searchParams.get("amount")
    const planType = searchParams.get("type")
    const planPayment = searchParams.get("payment")
    const planId = searchParams.get("plan")

    if (planAmount && !amount) setAmount(planAmount)
    if (planType === "monthly" && donationType !== "subscription") setDonationType("subscription")
    if (planType === "once" && donationType !== "one_time") setDonationType("one_time")
    if (planPayment) {
      const methodMap: Record<string, string> = {
        qris: "qris",
        va_bca: "bank_transfer",
        va_mandiri: "bank_transfer",
        gopay: "e_wallet",
        cc: "bank_transfer",
      }
      setPaymentMethod(methodMap[planPayment] || "qris")
    }
    if (planId && !planName) {
      const planNames: Record<string, string> = {
        balita: "Adopsi Nutrisi 1 Balita",
        "1000hpk": "Paket 1000 HPK",
        corporate: "Corporate Impact Plan",
      }
      setPlanName(planNames[planId] || "Donasi Custom")
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseInt(amount) < 10000) {
      toast.error("Jumlah minimal Rp 10.000")
      return
    }
    setLoading(true)
    try {
      const donation = await createDonation({
        amount: parseInt(amount),
        type: donationType,
        payment_method: paymentMethod,
      })
      toast.success("Donasi berhasil dibuat!")
      navigate(`/donation/payment/${donation.id}`, {
        state: { amount: parseInt(amount), paymentMethod },
      })
    } catch (err: any) {
      toast.error("Gagal membuat donasi", { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="Konfirmasi Donasi" subtitle="Periksa kembali detail donasi Anda sebelum melanjutkan ke pembayaran.">
      <div className="mx-auto max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-4 gap-1" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Ringkasan Donasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Plan Info */}
              {planName && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">{planName}</span>
                  </div>
                </div>
              )}

              {/* Donor Info */}
              {(donorName || donorEmail) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Donatur</h4>
                    <div className="space-y-1 text-sm">
                      {donorName && <div className="flex justify-between"><span className="text-gray-600">Nama</span><span className="font-medium">{donorName}</span></div>}
                      {donorEmail && <div className="flex justify-between"><span className="text-gray-600">Email</span><span className="font-medium">{donorEmail}</span></div>}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Donation Details */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Detail Donasi</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jenis</span>
                    <span className="font-medium">{donationType === "one_time" ? "Sekali Donasi" : "Donasi Rutin (Bulanan)"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jumlah</span>
                    <span className="font-semibold text-lg">{formatIDR(parseInt(amount) || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Metode Pembayaran</span>
                    <span className="font-medium">{paymentLabels[paymentMethod] || paymentMethod}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Submit */}
              <Button type="submit" disabled={loading || !amount} className="w-full" size="lg">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Bayar {amount ? formatIDR(parseInt(amount)) : "Sekarang"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-gray-400">
                Setelah klik tombol, Anda akan diarahkan ke halaman pembayaran.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
