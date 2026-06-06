import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { useAuth } from '@/contexts/AuthContext'
import { Check, ArrowRight, Baby, Heart, Building2, User, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatIDR } from '@/lib/format'
import { toast } from 'sonner'
import { DONATION_CHECKOUT_STORAGE_KEY } from '@/lib/donation-constants'
import { ImpactPreview } from '@/components/donation/ImpactPreview'

const plans = [
  { id: 'balita', name: 'Adopsi Nutrisi 1 Balita', price: 300000, icon: Baby, features: ['Voucher pangan bergizi bulanan', 'Laporan dampak per anak', 'Sertifikat donasi digital', 'Pemantauan gizi anak'] },
  { id: '1000hpk', name: 'Paket 1000 HPK', price: 500000, icon: Heart, features: ['Semua fitur Adopsi Nutrisi', 'Dukungan nutrisi ibu hamil', 'Pemantauan pertumbuhan 1000 HPK', 'Rekomendasi nutrisi AI', 'Laporan dampak mendalam'] },
  { id: 'corporate', name: 'Corporate Impact Plan', price: 0, icon: Building2, features: ['Semua fitur Paket 1000 HPK', 'Dashboard CSR khusus', 'Laporan dampak untuk stakeholder', 'Employee matching program'] },
]

export default function DonationCheckout() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const initialPlan = searchParams.get('plan') || 'balita'
  const initialType = searchParams.get('type') || 'monthly'
  const initialAmount = searchParams.get('amount')

  const [selectedPlan, setSelectedPlan] = useState(initialPlan)
  const [donationType, setDonationType] = useState<'monthly' | 'once'>(initialType === 'once' ? 'once' : 'monthly')
  const [customAmount, setCustomAmount] = useState(initialAmount || '')
  const [agree, setAgree] = useState(false)

  const plan = plans.find((p) => p.id === selectedPlan) || plans[0]
  const isCorporate = selectedPlan === 'corporate'
  const amount = customAmount ? parseInt(customAmount) : plan.price

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?from=checkout')
    }
  }, [user, authLoading, navigate])

  const handleProceed = () => {
    if (isCorporate) {
      toast.info('Untuk corporate, silakan hubungi tim kami')
      return
    }
    if (!agree) {
      toast.error('Setujui syarat dan ketentuan')
      return
    }

    // Save checkout data for CreateDonation
    sessionStorage.setItem(
      DONATION_CHECKOUT_STORAGE_KEY,
      JSON.stringify({
        plan: selectedPlan,
        type: donationType,
        amount,
        name: user?.fullName || '',
        email: user?.email || '',
      })
    )

    navigate(`/donation/create?plan=${selectedPlan}&type=${donationType}&amount=${amount}`)
  }

  // Show loading while checking auth
  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
      </div>
    )
  }

  if (isCorporate) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-md px-4 py-32 sm:px-6 md:py-40 lg:px-8">
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-10 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-lg bg-green-100">
                <Building2 className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Corporate Impact Plan</h1>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Program CSR terukur untuk perusahaan Anda. Dapatkan dashboard khusus, laporan dampak untuk stakeholder, dan employee matching program.
              </p>
              <div className="mt-6 flex flex-col gap-3">
               <Button asChild className="w-full gap-2 bg-green-600 hover:bg-green-700 text-sm h-12">
                   <a href="mailto:partnerships@seribuasa.id">
                     Hubungi Tim Kami <ArrowRight size={16} />
                   </a>
                 </Button>
                 <Button
                   variant="outline"
                   onClick={() => navigate('/donasi')}
                   className="w-full text-sm h-12"
                 >
                   Lihat Paket Donasi Lainnya
                 </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-32 sm:px-6 md:py-40 lg:px-8">
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-[1fr_1.2fr]">
           {/* Left: Plan Selection */}
           <div className="h-fit sticky top-20 lg:top-32">
             <h2 className="mb-4 text-sm font-semibold text-gray-900 uppercase tracking-wide">Pilih Paket Donasi</h2>

            <div className="flex flex-col gap-2">
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`flex items-center gap-3 rounded-xl p-3 sm:p-4 text-left transition-all ${
                    selectedPlan === p.id
                      ? 'border-2 border-green-600 bg-green-50'
                      : 'border border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                      selectedPlan === p.id ? 'bg-green-100' : 'bg-gray-100'
                    }`}
                  >
                    <p.icon
                      className={`h-5 w-5 ${
                        selectedPlan === p.id ? 'text-green-600' : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-500">
                      {p.price > 0 ? formatIDR(p.price) + '/bulan' : 'Custom'}
                    </div>
                  </div>
                  {selectedPlan === p.id && (
                    <Check className="h-5 w-5 flex-shrink-0 text-green-600" />
                  )}
                </button>
              ))}
            </div>

            {/* Plan Summary */}
            {plan.price > 0 && (
              <Card className="mt-6 border-gray-200 shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                      <plan.icon className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{plan.name}</div>
                      <div className="text-xs text-gray-500">
                        {donationType === 'monthly' ? 'Donasi Bulanan' : 'Donasi Sekali'}
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-gray-900">{formatIDR(amount)}</span>
                    {donationType === 'monthly' && (
                      <span className="ml-1 text-xs text-gray-400">/bulan</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-start gap-2 text-xs text-gray-600">
                        <Check className="h-3 w-3 flex-shrink-0 text-green-600 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Checkout Form */}
           <Card className="border-gray-200 shadow-sm h-fit">
             <CardContent className="p-8 space-y-6">
               <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Detail Donasi</h2>

              {/* Logged-in User Info */}
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-900 truncate">{user.fullName}</div>
                  <div className="text-xs text-gray-500 truncate">{user.email}</div>
                </div>
              </div>

              {/* Frequency Toggle */}
              {plan.price > 0 && (
                 <div>
                   <label className="mb-3 block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                     Frekuensi Donasi
                   </label>
                  <div className="inline-flex gap-1 rounded-full border border-gray-200 bg-white p-1">
                    {['Bulanan', 'Sekali Donasi'].map((label) => {
                      const active = label === 'Bulanan' ? donationType === 'monthly' : donationType === 'once'
                      return (
                        <button
                          key={label}
                          onClick={() => setDonationType(label === 'Bulanan' ? 'monthly' : 'once')}
                          className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                            active
                              ? 'bg-green-600 text-white'
                              : 'bg-transparent text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

               {/* Custom Amount */}
               {plan.price > 0 && (
                 <div>
                   <label className="mb-3 block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                     Jumlah Custom (opsional)
                   </label>
                   <input
                     type="number"
                     value={customAmount}
                     onChange={(e) => setCustomAmount(e.target.value)}
                     placeholder={`Default: ${formatIDR(plan.price)}`}
                     className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm placeholder-gray-400 outline-none transition-colors focus:border-green-600 focus:ring-1 focus:ring-green-600"
                     min="10000"
                   />
                   {customAmount && parseInt(customAmount) < 10000 && (
                     <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                       <AlertCircle size={14} /> Minimal donasi Rp 10.000
                     </p>
                   )}
                 </div>
               )}

               {/* Impact Preview */}
               <ImpactPreview amount={amount} />

                {/* Validation Alert */}
                {amount < 10000 && amount > 0 && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      Jumlah minimal donasi adalah Rp 10.000
                    </AlertDescription>
                  </Alert>
                )}

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Ketentuan dan Pembayaran
                </h3>

                {/* Agreement */}
                <label className="flex cursor-pointer items-start gap-3 text-xs text-gray-600 leading-relaxed">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 accent-green-600"
                  />
                  <span>
                    Saya menyetujui <span className="text-green-600 underline">Syarat & Ketentuan</span> serta memahami bahwa donasi ini bersifat sukarela.
                  </span>
                </label>

                {/* Total + CTA */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Donasi</span>
                    <span className="text-2xl font-bold text-gray-900">{formatIDR(amount)}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleProceed}
                className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
                size="lg"
              >
                Lanjut ke Pembayaran
                <ArrowRight size={18} className="ml-2" />
              </Button>

              <p className="text-center text-xs text-gray-500">
                Setelah klik tombol, Anda akan diarahkan ke halaman konfirmasi pembayaran.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
