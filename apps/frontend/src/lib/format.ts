export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

export function maskNIK(nik: string): string {
  if (nik.length < 6) return nik;
  return nik.slice(0, 4) + '****' + nik.slice(-4);
}
