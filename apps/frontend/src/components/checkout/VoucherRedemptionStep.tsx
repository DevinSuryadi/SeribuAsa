import { useState } from "react";
import { AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { VoucherValidator } from "@/components/voucher/VoucherValidator";
import type { AppliedVoucher, EligibilityData } from "@/types/checkout";
import { Button } from "@/components/ui/button";

interface VoucherRedemptionStepProps {
  cartTotal: number;
  voucherBalance: number;
  eligibilityData: EligibilityData | null;
  appliedVoucher: AppliedVoucher | null;
  isLoading: boolean;
  onValidate: (code: string, amount: number) => Promise<any>;
  onApply: (voucherId: string) => void;
  onRemove: () => void;
}

/**
 * VoucherRedemptionStep - Step 2 of checkout
 * Validate and apply voucher for order
 */
export function VoucherRedemptionStep({
  cartTotal,
  voucherBalance,
  eligibilityData,
  appliedVoucher,
  isLoading,
  onValidate,
  onApply,
  onRemove,
}: VoucherRedemptionStepProps) {
  const [showValidator, setShowValidator] = useState(!appliedVoucher);

  const eligibleAmount = eligibilityData?.eligible_amount || cartTotal;
  const ineligibleAmount = eligibilityData?.ineligible_amount || 0;

  const handleApplyVoucher = async (voucherId: string) => {
    onApply(voucherId);
    setShowValidator(false);
  };

  const handleRemoveVoucher = () => {
    onRemove();
    setShowValidator(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Terapkan Voucher</h2>
        <p className="text-gray-600">
          Gunakan saldo voucher Anda untuk mengurangi total pembayaran
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Voucher Status - 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          {/* Current Balance */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Saldo Voucher Tersedia</p>
                <h3 className="text-3xl font-bold text-blue-600">
                  Rp {voucherBalance.toLocaleString("id-ID")}
                </h3>
              </div>
              <div className="bg-blue-600 rounded-full p-3">
                <TrendingUp className="text-white" size={24} />
              </div>
            </div>
          </div>

          {/* Eligibility Info */}
          {eligibilityData && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Dapat Digunakan:</p>
              <div className="space-y-2">
                {eligibleAmount > 0 && (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-green-600" />
                      <span className="text-sm text-gray-900">Produk Eligible:</span>
                    </div>
                    <span className="font-bold text-green-600">
                      Rp {eligibleAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                {ineligibleAmount > 0 && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={18} className="text-orange-600" />
                      <span className="text-sm text-gray-900">Tidak Eligible (Tunai):</span>
                    </div>
                    <span className="font-bold text-orange-600">
                      Rp {ineligibleAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Applied Voucher Display */}
          {appliedVoucher && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-green-900">✓ Voucher Diterapkan</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRemoveVoucher}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Hapus
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Kode:</span>
                  <span className="font-medium">{appliedVoucher.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Digunakan:</span>
                  <span className="font-bold text-green-600">
                    -Rp {appliedVoucher.applied_amount.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-green-200">
                  <span className="text-gray-700">Sisa Saldo:</span>
                  <span className="font-medium">
                    Rp {appliedVoucher.remaining_balance.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Validator - Show when no voucher applied */}
          {showValidator && (
            <VoucherValidator
              amount={eligibleAmount}
              onValidate={onValidate}
              onApply={handleApplyVoucher}
              disabled={isLoading || eligibleAmount === 0}
            />
          )}
        </div>

        {/* Summary - 1/3 width */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 h-fit space-y-4">
          <h3 className="font-bold text-gray-900">Ringkasan</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Barang:</span>
              <span className="font-medium">Rp {cartTotal.toLocaleString("id-ID")}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Diskon Voucher:</span>
              <span className="font-bold text-green-600">
                -Rp {(appliedVoucher?.applied_amount || 0).toLocaleString("id-ID")}
              </span>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="font-bold text-gray-900">Total Bayar:</span>
                <span className="text-lg font-bold text-gray-900">
                  Rp {(cartTotal - (appliedVoucher?.applied_amount || 0)).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          {eligibleAmount === 0 && !appliedVoucher && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
              Produk dalam keranjang tidak mendukung pembayaran voucher
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
