// Dashboard Status Colors and Styling Constants
export const STATUS_BADGE_COLORS = {
  // Donation statuses
  success: 'bg-green-100 text-green-700 border-green-200',
  pending: 'bg-orange-100 text-orange-700 border-orange-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  
  // Subscription statuses
  active: 'bg-green-100 text-green-700 border-green-200',
  inactive: 'bg-gray-100 text-gray-700 border-gray-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  expired: 'bg-orange-100 text-orange-700 border-orange-200',
  
  // Settlement statuses
  settled: 'bg-green-100 text-green-700 border-green-200',
  hold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  reviewing: 'bg-blue-100 text-blue-700 border-blue-200',
  
  // Approval statuses
  approved: 'bg-green-100 text-green-700 border-green-200',
  pending_approval: 'bg-orange-100 text-orange-700 border-orange-200',
  rejected_approval: 'bg-red-100 text-red-700 border-red-200',
} as const;

export const STATUS_LABELS: Record<string, string> = {
  // Donation
  success: 'Berhasil',
  pending: 'Tertunda',
  failed: 'Gagal',
  processing: 'Diproses',
  
  // Subscription
  active: 'Aktif',
  inactive: 'Tidak Aktif',
  cancelled: 'Dibatalkan',
  expired: 'Kadaluarsa',
  
  // Settlement
  settled: 'Selesai',
  hold: 'Tahan',
  rejected: 'Ditolak',
  reviewing: 'Ditinjau',
  
  // Approval
  approved: 'Disetujui',
  pending_approval: 'Menunggu',
  rejected_approval: 'Ditolak',
} as const;

// Loading skeleton variants
export const LOADING_SKELETON_VARIANTS = {
  card: 'space-y-3',
  text: 'bg-secondary rounded animate-pulse',
  textSmall: 'bg-secondary rounded h-4 animate-pulse',
  textMedium: 'bg-secondary rounded h-5 animate-pulse',
  image: 'bg-secondary rounded aspect-video animate-pulse',
} as const;

// Empty state icons and messages
export const EMPTY_STATES = {
  noDonations: {
    message: 'Belum ada donasi',
    suggestion: 'Mulai melakukan donasi untuk melihat riwayat di sini',
  },
  noData: {
    message: 'Belum ada data',
    suggestion: 'Data akan ditampilkan setelah tersedia',
  },
  noMeasurements: {
    message: 'Belum ada data pengukuran',
    suggestion: 'Input data berat dan tinggi badan anak untuk memulai pemantauan',
  },
  noProducts: {
    message: 'Belum ada produk',
    suggestion: 'Tambahkan produk untuk memulai',
  },
  noVouchers: {
    message: 'Belum ada voucher',
    suggestion: 'Tunggu alokasi voucher dari admin',
  },
} as const;

// Chart colors
export const CHART_COLORS = {
  primary: 'hsl(152, 55%, 33%)',    // Green
  secondary: 'hsl(210, 65%, 45%)',   // Blue
  accent: 'hsl(46, 94%, 55%)',       // Yellow
  danger: 'hsl(0, 84%, 60%)',        // Red
  warning: 'hsl(38, 92%, 50%)',      // Orange
} as const;

export const CHART_PALETTE = [
  'hsl(152, 55%, 33%)',   // Green
  'hsl(210, 65%, 45%)',   // Blue
  'hsl(46, 94%, 55%)',    // Yellow
  'hsl(0, 84%, 60%)',     // Red
  'hsl(38, 92%, 50%)',    // Orange
  'hsl(281, 81%, 46%)',   // Purple
  'hsl(4, 90%, 64%)',     // Pink
  'hsl(161, 81%, 36%)',   // Teal
] as const;
