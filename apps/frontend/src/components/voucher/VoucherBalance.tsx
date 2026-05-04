import { AlertCircle, TrendingUp } from "lucide-react";

interface VoucherBalanceProps {
  totalBalance: number;
  activateVouchersCount: number;
  expiringCount?: number;
  expiringDays?: number;
}

/**
 * VoucherBalance component showing beneficiary's voucher balance and status
 */
export function VoucherBalance({
  totalBalance,
  activateVouchersCount,
  expiringCount = 0,
  expiringDays = 7,
}: VoucherBalanceProps) {
  const hasExpiringVouchers = expiringCount > 0;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
      {/* Main Balance */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-blue-900 mb-1">Saldo Voucher Anda</p>
          <h2 className="text-3xl font-bold text-blue-600">
            Rp {totalBalance.toLocaleString("id-ID")}
          </h2>
        </div>
        <div className="bg-blue-600 rounded-full p-3">
          <TrendingUp className="text-white" size={24} />
        </div>
      </div>

      {/* Status Info */}
      <div className="space-y-2 pt-4 border-t border-blue-200">
        <p className="text-sm text-blue-800">
          <span className="font-medium">{activateVouchersCount}</span> voucher aktif
        </p>

        {/* Expiring Warning */}
        {hasExpiringVouchers && (
          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle size={18} className="text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-orange-900">
                {expiringCount} voucher{expiringCount > 1 ? "s" : ""} akan hangus
              </p>
              <p className="text-orange-700 text-xs mt-0.5">dalam {expiringDays} hari ke depan</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Info */}
      <div className="mt-4 p-3 bg-white rounded-lg text-sm text-blue-900">
        <p className="font-medium mb-1">Tips Penggunaan:</p>
        <ul className="text-xs space-y-1 text-blue-800 list-disc list-inside">
          <li>Gunakan voucher untuk pembelian produk tertentu</li>
          <li>Periksa kategori produk yang mendukung voucher</li>
          <li>Voucher berlaku 30 hari setelah alokasi</li>
        </ul>
      </div>
    </div>
  );
}
