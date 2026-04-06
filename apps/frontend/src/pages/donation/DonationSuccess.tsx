import { useNavigate, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"


import { CheckCircle2, ArrowRight, Home, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { DonationHero } from "@/components/donation/DonationHero"

import { DonationSuccessSkeleton } from "@/components/donation/DonationSuccessSkeleton"
import { getDonation } from "@/services/donations"
import { formatIDR } from "@/lib/format"

interface ImpactData {
  children_helped: number
  days_of_support: number
  message: string
}

export default function DonationSuccess() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [donationData, setDonationData] = useState<Record<string, any> | null>(null)
  const [impact, setImpact] = useState<ImpactData | null>(null)

  const { amount: stateAmount, transactionId: stateTransactionId, impact: stateImpact } = location.state || {}

  // Extract donationId from URL or state
  const searchParams = new URLSearchParams(location.search)
  const donationIdFromUrl = searchParams.get('id')
  const donationIdFromState = location.state?.donationId

  useEffect(() => {
    const loadDonationData = async () => {
      try {
        setLoading(true)
        setError(null)

        const donationId = donationIdFromUrl || donationIdFromState
        
        if (!donationId && !stateAmount) {
          setError('Donation ID tidak ditemukan. Silakan coba lagi.')
          setLoading(false)
          return
        }

        // Try to fetch from API if we have a donation ID
        if (donationId) {
          try {
            const data = await getDonation(donationId)
            setDonationData(data)
            
            // Calculate impact based on amount
            const calculatedImpact = calculateImpact(data.amount)
            setImpact(calculatedImpact)
          } catch (apiError) {
            console.error('Failed to fetch donation data from API:', apiError)
            // Fallback to state data
            if (stateAmount && stateImpact) {
              setDonationData({
                id: donationId,
                amount: stateAmount,
                transaction_id: stateTransactionId,
              })
              setImpact(stateImpact)
            } else {
              throw apiError
            }
          }
        } else if (stateAmount) {
          // Use state data if no API call possible
          const calculatedImpact = calculateImpact(stateAmount)
          setDonationData({
            amount: stateAmount,
             transaction_id: stateTransactionId,
           })
           setImpact(stateImpact || calculatedImpact)
         }
       } catch (err) {
         const errorMessage = err instanceof Error ? err.message : 'Unknown error'
         console.error('Error loading donation data:', err)
         setError('Gagal memuat data donasi. Silakan coba lagi.')
         toast.error('Gagal memuat data donasi', { description: errorMessage })
       } finally {
         setLoading(false)
      }
    }

    loadDonationData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donationIdFromUrl, donationIdFromState])

  // Calculate impact based on amount: Every Rp 500k = 1 child + 1000 days HPK
  const calculateImpact = (amount: number): ImpactData => {
    // Every Rp 500,000 = 1 unit (1 child + 1000 days HPK support)
    const units = Math.floor(amount / 500000)
    const childrenHelped = units
    const daysOfSupport = units * 1000
    
    let message = 'Terima kasih atas kontribusi Anda!'
    if (childrenHelped > 0) {
      const dayText = daysOfSupport === 1000 ? `1000 hari pertama kehidupan` : `${daysOfSupport} hari pertama kehidupan`
      message = `Donasi Anda akan membantu ${childrenHelped} anak dan mendukung nutrisi ${dayText} (1000 HPK).`
    }

    return {
      children_helped: childrenHelped,
      days_of_support: daysOfSupport,
      message,
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <DonationSuccessSkeleton />
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="pt-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Terjadi Kesalahan</h2>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <div className="mt-6 flex flex-col gap-3">
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
                onClick={() => navigate("/donation/checkout")}
              >
                Coba Lagi
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/")}
              >
                Kembali ke Beranda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const displayAmount = donationData?.amount || stateAmount || 0
  const displayTransactionId = donationData?.transaction_id || stateTransactionId || 'N/A'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-6">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <DonationHero
            icon={CheckCircle2}
            title="Pembayaran Berhasil!"
            subtitle="Terima kasih atas donasi Anda."
            color="green"
            iconSize="small"
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Transaction Summary - Compact */}
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Total Donasi</p>
            <p className="text-2xl font-bold text-green-700">{formatIDR(displayAmount)}</p>
            <p className="text-xs text-gray-600 mt-2">ID: {displayTransactionId}</p>
          </div>

          {/* Impact Section - Compact & Clear */}
          {impact && impact.children_helped > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-xs font-semibold text-blue-800 mb-2">Dampak Donasi Anda</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-white p-2 rounded border border-blue-100 text-center">
                  <p className="text-sm font-bold text-blue-700">{impact.children_helped}</p>
                  <p className="text-xs text-blue-600">Anak Terbantu</p>
                </div>
                <div className="bg-white p-2 rounded border border-blue-100 text-center">
                  <p className="text-sm font-bold text-blue-700">{impact.days_of_support}</p>
                  <p className="text-xs text-blue-600">Hari Dukungan</p>
                </div>
              </div>
              <p className="text-xs text-blue-700 text-center font-medium">
                {impact.message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              className="w-full h-10 text-sm bg-green-600 hover:bg-green-700"
              onClick={() => navigate("/dashboard")}
            >
              Lihat Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full h-10 text-sm"
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
