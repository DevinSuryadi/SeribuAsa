import { Users, Calendar, Heart } from 'lucide-react'

interface ImpactData {
  childrenHelped: number
  daysOfSupport: number
  message: string
}

interface ImpactPreviewProps {
  amount: number
  className?: string
}

/**
 * ImpactPreview component calculates and displays the impact of a donation
 * Formula: Every Rp 500,000 = 1 child helped + 1,000 days (1000 HPK - Hari Pertama Kehidupan) of nutrition support
 * 
 * Examples:
 * - Rp 300,000 → 0 children, 0 days (below 500k threshold)
 * - Rp 500,000 → 1 child, 1000 days ✓
 * - Rp 1,000,000 → 2 children, 2000 days ✓
 * - Rp 1,500,000 → 3 children, 3000 days ✓
 */
export function ImpactPreview({ amount, className = '' }: ImpactPreviewProps) {
  const calculateImpact = (donationAmount: number): ImpactData => {
    // Every Rp 500k = 1 unit (1 child + 1000 days HPK support)
    const units = Math.floor(donationAmount / 500000)
    const childrenHelped = units
    const daysOfSupport = units * 1000

    // Generate contextual message
    let message = 'Terima kasih atas kontribusi Anda!'
    if (childrenHelped > 0) {
      const dayText = daysOfSupport === 1000 ? `1000 hari pertama kehidupan` : `${daysOfSupport} hari pertama kehidupan`
      message = `Donasi Anda akan membantu ${childrenHelped} anak dan mendukung nutrisi ${dayText} (1000 HPK).`
    }

    return {
      childrenHelped,
      daysOfSupport,
      message,
    }
  }

  // Only show impact if amount reaches minimum (500k)
  const impact = calculateImpact(amount)
  
  if (impact.childrenHelped === 0) {
    return null
  }

  return (
    <div className={`rounded-lg bg-green-50 border border-green-200 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Heart className="h-4 w-4 text-green-600" />
        <h4 className="text-sm font-semibold text-green-800">Dampak Donasi Anda</h4>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="text-center">
          <Users className="mx-auto h-5 w-5 text-green-600 mb-1" />
          <p className="text-lg font-bold text-green-700">{impact.childrenHelped}</p>
          <p className="text-xs text-green-600">Anak Terbantu</p>
        </div>

        <div className="text-center">
          <Calendar className="mx-auto h-5 w-5 text-green-600 mb-1" />
          <p className="text-lg font-bold text-green-700">{impact.daysOfSupport}</p>
          <p className="text-xs text-green-600">Hari Dukungan</p>
        </div>
      </div>

      <p className="text-xs text-center text-green-700 font-medium leading-relaxed">
        {impact.message}
      </p>
    </div>
  )
}
