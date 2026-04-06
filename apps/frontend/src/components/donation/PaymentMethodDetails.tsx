import { QrCode, Landmark, Wallet, CreditCard } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PaymentMethodDetailsProps {
  methodId: string
  className?: string
}

const paymentMethodDetails: Record<string, {
  label: string
  icon: LucideIcon
  description: string
  instructions: string[]
  processingTime: string
}> = {
  qris: {
    label: 'QRIS',
    icon: QrCode,
    description: 'Scan QR Code dengan aplikasi mobile banking Anda',
    instructions: [
      'Buka aplikasi mobile banking atau dompet digital',
      'Pilih menu scan QRIS atau pembayaran',
      'Arahkan kamera ke kode QR',
      'Konfirmasi nominal pembayaran',
    ],
    processingTime: 'Instan',
  },
  va_bca: {
    label: 'VA BCA',
    icon: Landmark,
    description: 'Transfer via Virtual Account Bank BCA',
    instructions: [
      'Login ke aplikasi atau website BCA',
      'Pilih menu Transfer atau Pembayaran',
      'Masukkan nomor Virtual Account',
      'Konfirmasi dan lanjutkan proses pembayaran',
    ],
    processingTime: '1-5 menit',
  },
  va_mandiri: {
    label: 'VA Mandiri',
    icon: Landmark,
    description: 'Transfer via Virtual Account Bank Mandiri',
    instructions: [
      'Login ke aplikasi atau website Mandiri',
      'Pilih menu Transfer',
      'Masukkan nomor Virtual Account',
      'Konfirmasi transfer',
    ],
    processingTime: '1-5 menit',
  },
  gopay: {
    label: 'GoPay',
    icon: Wallet,
    description: 'Pembayaran melalui dompet digital GoPay',
    instructions: [
      'Buka aplikasi Gojek',
      'Pilih menu GoPay',
      'Masukkan nominal pembayaran',
      'Konfirmasi transaksi',
    ],
    processingTime: 'Instan',
  },
  cc: {
    label: 'Kartu Kredit',
    icon: CreditCard,
    description: 'Pembayaran menggunakan kartu kredit',
    instructions: [
      'Masukkan nomor kartu kredit',
      'Isikan nama pemegang kartu',
      'Masukkan tanggal kadaluarsa',
      'Masukkan kode CVV untuk keamanan',
    ],
    processingTime: 'Instan',
  },
}

/**
 * PaymentMethodDetails component displays information about selected payment method
 * including instructions and processing time
 */
export function PaymentMethodDetails({ methodId, className = '' }: PaymentMethodDetailsProps) {
  const details = paymentMethodDetails[methodId]

  if (!details) {
    return null
  }

  const Icon = details.icon

  return (
    <div className={`rounded-lg bg-blue-50 border border-blue-200 p-4 ${className}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-blue-900">{details.label}</h4>
          <p className="text-xs text-blue-700">{details.description}</p>
        </div>
      </div>

      <div className="mb-3 space-y-2">
        <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Langkah Pembayaran</p>
        <ol className="space-y-1">
          {details.instructions.map((instruction, idx) => (
            <li key={idx} className="flex gap-2 text-xs text-blue-700">
              <span className="font-semibold flex-shrink-0">{idx + 1}.</span>
              <span>{instruction}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-blue-200">
        <span className="text-xs text-blue-700">Waktu Pemrosesan</span>
        <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
          {details.processingTime}
        </Badge>
      </div>
    </div>
  )
}
