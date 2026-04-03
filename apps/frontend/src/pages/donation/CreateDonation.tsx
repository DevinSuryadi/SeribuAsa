import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Heart, CreditCard, Wallet, Smartphone, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

const quickAmounts = [50000, 100000, 250000, 300000, 500000, 1000000]

const paymentMethods = [
  { id: "bank_transfer", label: "Transfer Bank", icon: CreditCard },
  { id: "e_wallet", label: "E-Wallet", icon: Wallet },
  { id: "qris", label: "QRIS", icon: Smartphone },
]

export default function CreateDonation() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [amount, setAmount] = useState("")
  const [customAmount, setCustomAmount] = useState("")
  const [donationType, setDonationType] = useState<"one_time" | "subscription">("one_time")
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer")
  const [loading, setLoading] = useState(false)

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString())
    setCustomAmount("")
  }

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value)
    setAmount(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || parseInt(amount) < 10000) {
      toast.error("Jumlah minimal Rp 10.000")
      return
    }

    setLoading(true)

    try {
      // Step 1: Create donation
      const donationResponse = await fetch("/api/v1/donations/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseInt(amount),
          type: donationType,
          payment_method: paymentMethod,
        }),
      })

      if (!donationResponse.ok) {
        throw new Error("Failed to create donation")
      }

      const donation = await donationResponse.json()

      // Step 2: Navigate to mock payment
      navigate(`/donation/payment/${donation.id}`, {
        state: { amount: parseInt(amount), paymentMethod },
      })
    } catch (error) {
      toast.error("Gagal membuat donasi", { description: "Silakan coba lagi" })
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="Donasi Baru" subtitle="Buat donasi untuk membantu anak-anak">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Form Donasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Donation Type */}
              <div>
                <Label>Jenis Donasi</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setDonationType("one_time")}
                    className={`rounded-lg border p-4 text-center transition ${
                      donationType === "one_time"
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-medium">Sekali Donasi</p>
                    <p className="text-sm text-gray-500">Donasi satu kali</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDonationType("subscription")}
                    className={`rounded-lg border p-4 text-center transition ${
                      donationType === "subscription"
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-medium">Donasi Rutin</p>
                    <p className="text-sm text-gray-500">Setiap bulan</p>
                  </button>
                </div>
              </div>

              <Separator />

              {/* Amount Selection */}
              <div>
                <Label>Jumlah Donasi</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {quickAmounts.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleQuickAmount(value)}
                      className={`rounded-lg border p-3 text-sm font-medium transition ${
                        amount === value.toString()
                          ? "border-green-600 bg-green-50 text-green-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      Rp {(value / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <Label htmlFor="custom-amount">Jumlah Custom</Label>
                  <Input
                    id="custom-amount"
                    type="number"
                    placeholder="Masukkan jumlah donasi"
                    value={customAmount}
                    onChange={(e) => handleCustomAmount(e.target.value)}
                    className="mt-1"
                    min="10000"
                  />
                </div>
              </div>

              <Separator />

              {/* Payment Method */}
              <div>
                <Label>Metode Pembayaran</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition ${
                        paymentMethod === method.id
                          ? "border-green-600 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <method.icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Summary */}
              {amount && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <h4 className="font-medium mb-2">Ringkasan Donasi</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jenis</span>
                      <span>{donationType === "one_time" ? "Sekali Donasi" : "Donasi Rutin"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jumlah</span>
                      <span className="font-semibold">Rp {parseInt(amount).toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Metode</span>
                      <span className="capitalize">{paymentMethod.replace("_", " ")}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !amount}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Lanjut ke Pembayaran
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
