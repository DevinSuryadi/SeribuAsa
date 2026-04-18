import { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ValidatedVoucher {
  id: string;
  code: string;
  balance: number;
  expiry_date: string;
  days_until_expiry: number;
}

interface VoucherValidatorProps {
  onValidate: (code: string, amount: number) => Promise<ValidatedVoucher>;
  onApply: (voucherId: string) => void;
  amount: number;
  disabled?: boolean;
}

/**
 * VoucherValidator component for validating and applying voucher codes
 */
export function VoucherValidator({
  onValidate,
  onApply,
  amount,
  disabled = false,
}: VoucherValidatorProps) {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validated, setValidated] = useState<ValidatedVoucher | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Masukkan kode voucher");
      return;
    }

    setIsValidating(true);
    setError(null);
    setSuccess(false);
    setValidated(null);

    try {
      const result = await onValidate(code, amount);
      setValidated(result);

      if (result.balance > 0) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kode voucher tidak valid");
      setValidated(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleApply = () => {
    if (validated) {
      onApply(validated.id);
      setCode("");
      setValidated(null);
      setSuccess(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Gunakan Voucher</h3>

      <form onSubmit={handleValidate} className="space-y-4">
        {/* Voucher Code Input */}
        <div>
          <label htmlFor="voucher-code" className="block text-sm font-medium text-gray-700 mb-2">
            Kode Voucher
          </label>
          <input
            id="voucher-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Contoh: VCH-2026-ABC123"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            disabled={isValidating || disabled}
            maxLength={50}
          />
        </div>

        {/* Validation Messages */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Validation Result */}
        {validated && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} className="text-green-600" />
              <p className="font-medium text-green-900">Voucher Valid!</p>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Kode:</span>
                <span className="font-medium">{validated.code}</span>
              </div>
              <div className="flex justify-between">
                <span>Saldo:</span>
                <span className="font-medium">Rp {validated.balance.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span>Berlaku sampai:</span>
                <span className="font-medium">
                  {new Date(validated.expiry_date).toLocaleDateString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Hari tersisa:</span>
                <span
                  className={`font-medium ${validated.days_until_expiry <= 7 ? "text-orange-600" : "text-green-600"}`}
                >
                  {validated.days_until_expiry} hari
                </span>
              </div>
            </div>

            {validated.balance > amount && (
              <p className="text-xs text-green-700 bg-white px-2 py-1 rounded">
                Saldo mencukupi untuk transaksi ini
              </p>
            )}
            {validated.balance < amount && (
              <p className="text-xs text-orange-700 bg-white px-2 py-1 rounded">
                Saldo tidak mencukupi. Kekurangan: Rp{" "}
                {(amount - validated.balance).toLocaleString("id-ID")}
              </p>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isValidating || disabled || !code.trim()}
            className="flex-1"
          >
            {isValidating ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Validasi...
              </>
            ) : (
              "Validasi"
            )}
          </Button>

          {validated && (
            <Button
              type="button"
              onClick={handleApply}
              variant="outline"
              disabled={disabled || !success}
              className="flex-1"
            >
              Terapkan
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
