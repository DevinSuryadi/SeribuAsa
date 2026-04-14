import { AlertCircle, CheckCircle2 } from "lucide-react";

interface CartSummaryProps {
  totalAmount: number;
  eligibleAmount: number;
  ineligibleAmount: number;
  voucherBalance: number;
  maxVoucherApplicable: number;
}

/**
 * CartSummary component showing total amounts and voucher eligibility breakdown
 */
export function CartSummary({
  totalAmount,
  eligibleAmount,
  ineligibleAmount,
  voucherBalance,
  maxVoucherApplicable,
}: CartSummaryProps) {
  const remainingToRedeem = Math.max(0, eligibleAmount - maxVoucherApplicable);
  const canUseFullVoucher = maxVoucherApplicable === voucherBalance;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      {/* Header */}
      <h2 className="text-lg font-bold text-gray-900">Ringkasan Pesanan</h2>

      {/* Amount Breakdown */}
      <div className="space-y-3 pb-4 border-b border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total:</span>
          <span className="font-medium text-gray-900">
            Rp {totalAmount.toLocaleString("id-ID")}
          </span>
        </div>

        {/* Eligible Amount */}
        {eligibleAmount > 0 && (
          <div className="flex items-start justify-between text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-600">Dapat Dibayar dengan Voucher:</span>
            </div>
            <span className="font-medium text-green-600">
              Rp {eligibleAmount.toLocaleString("id-ID")}
            </span>
          </div>
        )}

        {/* Ineligible Amount */}
        {ineligibleAmount > 0 && (
          <div className="flex items-start justify-between text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-orange-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-600">Harus Tunai/Transfer:</span>
            </div>
            <span className="font-medium text-orange-600">
              Rp {ineligibleAmount.toLocaleString("id-ID")}
            </span>
          </div>
        )}
      </div>

      {/* Voucher Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-900">Saldo Voucher:</span>
          <span className="font-bold text-blue-600">
            Rp {voucherBalance.toLocaleString("id-ID")}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-900">Dapat Digunakan:</span>
          <span className="font-bold text-blue-600">
            Rp {maxVoucherApplicable.toLocaleString("id-ID")}
          </span>
        </div>

        {remainingToRedeem > 0 && (
          <p className="text-xs text-blue-600 bg-white px-2 py-1 rounded mt-2">
            Sisa yang perlu dibayar tunai: Rp {remainingToRedeem.toLocaleString("id-ID")}
          </p>
        )}

        {eligibleAmount === 0 && (
          <p className="text-xs text-orange-600 bg-white px-2 py-1 rounded mt-2">
            Produk dalam keranjang tidak mendukung pembayaran voucher
          </p>
        )}
      </div>

      {/* Total After Voucher */}
      <div className="pt-4 border-t border-gray-200 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total (Setelah Voucher):</span>
          <span className="text-lg font-bold text-gray-900">
            Rp {Math.max(0, totalAmount - maxVoucherApplicable).toLocaleString("id-ID")}
          </span>
        </div>
      </div>
    </div>
  );
}
