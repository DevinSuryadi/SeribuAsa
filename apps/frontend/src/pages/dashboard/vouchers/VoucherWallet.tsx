import { useEffect, useState } from "react";
import { Copy, Loader2, QrCode } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { VoucherBalance } from "@/components/voucher/VoucherBalance";
import { VoucherValidator } from "@/components/voucher/VoucherValidator";
import { VoucherTransactionList } from "@/components/voucher/VoucherTransactionList";
import { Button } from "@/components/ui/button";
import {
  getVoucherBalance,
  validateVoucher,
  getTransactionHistory,
  getAllowedVoucherCategories,
} from "@/services/vouchers";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface VoucherBalanceData {
  total_balance: number;
  active_vouchers: any[];
  expiring_soon: {
    count: number;
    total_amount: number;
  };
}

interface Transaction {
  id: string;
  voucher_id: string;
  order_id: string | null;
  transaction_type: string;
  amount: number;
  created_at: string;
}

interface ValidatedVoucher {
  id: string;
  code: string;
  balance: number;
  expiry_date: string;
  days_until_expiry: number;
}

/**
 * VoucherWallet - Voucher management dashboard page
 * Shows balance, validates codes, and displays transaction history
 */
export function VoucherWallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<VoucherBalanceData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [validatedVoucher, setValidatedVoucher] = useState<ValidatedVoucher | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionMeta, setTransactionMeta] = useState({
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getVoucherQrPayload = (code: string) => `VOUCHER:${code}`;
  const getVoucherQrSrc = (code: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(getVoucherQrPayload(code))}`;

  useEffect(() => {
    loadVoucherData();
  }, []);

  useEffect(() => {
    loadTransactionHistory();
  }, [filterType, currentPage]);

  const loadVoucherData = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const balanceData = await getVoucherBalance(user.id);
      setBalance(balanceData);

      // Load categories (optional, for future use)
      await getAllowedVoucherCategories();
    } catch (err: any) {
      const errorMsg = err.message || "Gagal memuat saldo voucher";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactionHistory = async () => {
    if (!user) return;
    try {
      const historyData = await getTransactionHistory({
        beneficiary_id: user.id,
        transaction_type: filterType || undefined,
        page: currentPage,
        page_size: 10,
      });
      setTransactions(historyData.items || []);
      setTransactionMeta({
        total: historyData.total || 0,
        page: historyData.page || currentPage,
        page_size: historyData.page_size || 10,
        total_pages: historyData.total_pages || 1,
      });
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat riwayat transaksi");
    }
  };

  const handleValidateVoucher = async (code: string, amount: number) => {
    setIsValidating(true);
    try {
      const result = await validateVoucher({ code, amount });
      setValidatedVoucher(result);
      return result;
    } catch (err: any) {
      toast.error(err.message || "Kode voucher tidak valid");
      setValidatedVoucher(null);
      throw err;
    } finally {
      setIsValidating(false);
    }
  };

  const handleApplyVoucher = async (_voucherId: string) => {
    if (!validatedVoucher) return;

    // In real implementation, this would be called during checkout
    toast.success(`Voucher ${validatedVoucher.code} siap digunakan saat checkout`);

    // Clear validator
    setValidatedVoucher(null);

    // Refresh balance
    await loadVoucherData();
  };

  const calculateExpiringCount = () => {
    return Number(balance?.expiring_soon?.count || 0);
  };

  const calculateExpiringDays = () => {
    // Default to 7 days or could extract from balance.expiring_soon
    return 7;
  };

  const copyVoucherCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Kode voucher disalin");
    } catch {
      toast.error("Gagal menyalin kode voucher");
    }
  };

  return (
    <DashboardLayout
      title="Dompet Nutrisi"
      subtitle="Kelola saldo voucher dan riwayat transaksi Anda"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
            <Button size="sm" variant="outline" onClick={loadVoucherData} className="mt-2">
              Coba Lagi
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 size={32} className="animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">Memuat dompet voucher...</p>
          </div>
        ) : (
          <>
            {/* Balance Display */}
            {balance && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Voucher Balance - 2/3 width */}
                <div className="lg:col-span-2">
                  <VoucherBalance
                    totalBalance={balance.total_balance}
                    activateVouchersCount={balance.active_vouchers.length}
                    expiringCount={calculateExpiringCount()}
                    expiringDays={calculateExpiringDays()}
                  />
                </div>

                {/* Quick Stats - 1/3 width */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                  <h3 className="font-bold text-gray-900">Statistik</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600">Voucher Aktif</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {balance.active_vouchers.length}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-gray-600">Akan Hangus</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {calculateExpiringCount()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Validator Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <VoucherValidator
                  amount={balance?.total_balance || 0}
                  onValidate={handleValidateVoucher}
                  onApply={handleApplyVoucher}
                  disabled={isValidating || isLoading}
                />
              </div>

              {/* Validator Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-3">Cara Menggunakan</h3>
                <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                  <li>Validasi kode voucher di sini</li>
                  <li>Atau langsung gunakan saat checkout</li>
                  <li>Voucher berlaku untuk kategori produk tertentu</li>
                  <li>Berlaku 30 hari sejak alokasi</li>
                </ol>
              </div>
            </div>

            {/* QR Voucher Cards */}
            {balance && balance.active_vouchers.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">QR Voucher Aktif</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {balance.active_vouchers.map((voucher: any) => (
                    <div
                      key={voucher.id}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <QrCode size={16} className="text-primary" />
                          Voucher
                        </div>
                        <button
                          type="button"
                          onClick={() => copyVoucherCode(voucher.code)}
                          className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
                          aria-label={`Salin kode voucher ${voucher.code}`}
                        >
                          <Copy size={13} />
                          Salin
                        </button>
                      </div>

                      <img
                        src={getVoucherQrSrc(voucher.code)}
                        alt={`QR voucher ${voucher.code}`}
                        className="w-full max-w-[220px] mx-auto rounded-md border border-gray-100"
                        loading="lazy"
                      />

                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-gray-500">Kode</p>
                        <p className="text-sm font-mono font-medium text-gray-900 break-all">
                          {voucher.code}
                        </p>
                        <p className="text-xs text-gray-500">
                          Saldo:{" "}
                          <span className="font-semibold text-gray-800">
                            Rp {Number(voucher.balance || 0).toLocaleString("id-ID")}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction History */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Riwayat Transaksi</h2>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={filterType === null ? "default" : "outline"}
                    onClick={() => {
                      setFilterType(null);
                      setCurrentPage(1);
                    }}
                  >
                    Semua
                  </Button>
                  <Button
                    size="sm"
                    variant={filterType === "allocation" ? "default" : "outline"}
                    onClick={() => {
                      setFilterType("allocation");
                      setCurrentPage(1);
                    }}
                  >
                    Alokasi
                  </Button>
                  <Button
                    size="sm"
                    variant={filterType === "redeemed" ? "default" : "outline"}
                    onClick={() => {
                      setFilterType("redeemed");
                      setCurrentPage(1);
                    }}
                  >
                    Ditukar
                  </Button>
                  <Button
                    size="sm"
                    variant={filterType === "expired" ? "default" : "outline"}
                    onClick={() => {
                      setFilterType("expired");
                      setCurrentPage(1);
                    }}
                  >
                    Hangus
                  </Button>
                </div>
              </div>

              <VoucherTransactionList
                transactions={transactions}
                isLoading={isLoading}
                page={transactionMeta.page}
                pageSize={transactionMeta.page_size}
                total={transactionMeta.total}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default VoucherWallet;
