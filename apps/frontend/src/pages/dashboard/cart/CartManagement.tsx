import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CartList } from "@/components/cart/CartList";
import { CartSummary } from "@/components/cart/CartSummary";
import { Button } from "@/components/ui/button";
import {
  getCart,
  getCartSummary,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "@/services/cart";
import { getVoucherBalance } from "@/services/vouchers";
import { CartItemData } from "@/types/checkout";
import { toast } from "sonner";

interface CartSummaryData {
  eligible_amount: number;
  ineligible_amount: number;
  total_amount: number;
  voucher_balance: number;
  max_voucher_applicable: number;
}

/**
 * CartManagement - Shopping cart dashboard page
 * Allows beneficiaries to view and manage cart items
 */
export function CartManagement() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [summary, setSummary] = useState<CartSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCartData();
  }, []);

  const loadCartData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [cartData, summaryData] = await Promise.all([getCart(), getCartSummary()]);
      setCartItems(cartData.items || []);
      setSummary(summaryData);
    } catch (err: any) {
      const errorMsg = err.message || "Gagal memuat keranjang";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    setIsUpdating(true);
    try {
      await updateCartItem(itemId, { quantity });
      await loadCartData();
      toast.success("Jumlah diperbarui");
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui jumlah");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setIsUpdating(true);
    try {
      await removeCartItem(itemId);
      await loadCartData();
      toast.success("Item dihapus dari keranjang");
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus item");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm("Apakah Anda yakin ingin mengosongkan keranjang?")) return;

    setIsUpdating(true);
    try {
      await clearCart();
      await loadCartData();
      toast.success("Keranjang dikosongkan");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengosongkan keranjang");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGoToCheckout = () => {
    if (cartItems.length === 0) {
      toast.error("Keranjang Anda kosong");
      return;
    }
    navigate("/checkout");
  };

  return (
    <DashboardLayout title="Keranjang Belanja" subtitle="Kelola item belanja Anda sebelum checkout">
      <div className="max-w-6xl mx-auto">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
            <Button size="sm" variant="outline" onClick={loadCartData} className="mt-2">
              Coba Lagi
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 size={32} className="animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">Memuat keranjang...</p>
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
              <ShoppingCart size={32} className="text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Keranjang Kosong</h2>
            <p className="text-gray-600 mb-6">
              Tambahkan produk ke keranjang Anda untuk memulai berbelanja
            </p>
            <div className="space-x-3">
              <Button onClick={() => navigate("/dashboard/katalog")}>Lanjutkan Belanja</Button>
              <Button variant="outline" onClick={() => navigate("/dashboard/beneficiary")}>
                Kembali ke Dashboard
              </Button>
            </div>
          </div>
        ) : (
          /* Main Content */
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Cart Items - 2/3 width */}
              <div className="lg:col-span-2">
                <CartList
                  items={cartItems}
                  isLoading={isUpdating}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemoveItem}
                  onClearCart={handleClearCart}
                />
              </div>

              {/* Summary - 1/3 width */}
              <div>
                {summary && (
                  <CartSummary
                    totalAmount={summary.total_amount}
                    eligibleAmount={summary.eligible_amount}
                    ineligibleAmount={summary.ineligible_amount}
                    voucherBalance={summary.voucher_balance}
                    maxVoucherApplicable={summary.max_voucher_applicable}
                  />
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
              <Button variant="outline" onClick={() => navigate("/dashboard/katalog")}>
                Tambah Lebih Banyak
              </Button>
              <Button onClick={handleGoToCheckout} disabled={isUpdating}>
                Lanjutkan ke Checkout →
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
