export const DONATION_PLANS = [
  { id: 'balita', name: 'Adopsi Nutrisi 1 Balita', price: 300000 },
  { id: '1000hpk', name: 'Paket 1000 HPK', price: 500000 },
  { id: 'corporate', name: 'Corporate Impact Plan', price: 0 },
] as const

export const PLAN_NAMES: Record<string, string> = {
  balita: 'Adopsi Nutrisi 1 Balita',
  '1000hpk': 'Paket 1000 HPK',
  corporate: 'Corporate Impact Plan',
}

export const PAYMENT_METHODS = [
  { id: 'qris', label: 'QRIS', value: 'qris' },
  { id: 'va_bca', label: 'VA BCA', value: 'bank_transfer' },
  { id: 'va_mandiri', label: 'VA Mandiri', value: 'bank_transfer' },
  { id: 'gopay', label: 'GoPay', value: 'e_wallet' },
  { id: 'cc', label: 'Kartu Kredit', value: 'credit_card' },
] as const

export const PAYMENT_LABELS: Record<string, string> = {
  qris: 'QRIS',
  bank_transfer: 'Transfer Bank',
  e_wallet: 'E-Wallet',
  credit_card: 'Kartu Kredit',
}

export const PAYMENT_METHOD_MAP: Record<string, string> = {
  qris: 'qris',
  va_bca: 'bank_transfer',
  va_mandiri: 'bank_transfer',
  gopay: 'e_wallet',
  cc: 'credit_card',
}

export const DONATION_CHECKOUT_STORAGE_KEY = 'donation_checkout_data'
