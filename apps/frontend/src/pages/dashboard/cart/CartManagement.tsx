import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Loader2, ArrowRight, ShoppingBag } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
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
import { ApiError } from "@/services/api";
import type { CartItemData } from "@/types/checkout";
import { toast } from "sonner";

interface CartSummaryData {
  eligible_amount: number;
  ineligible_amount: number;
  total_amount: number;
  voucher_balance: number;
  max_voucher_applicable: number;
}


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
      let errorMsg = err.message || "Gagal memuat keranjang";
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        errorMsg = "Akses keranjang hanya untuk akun beneficiary. Silakan login dengan akun beneficiary.";
      }
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <Button size="sm" variant="outline" onClick={loadCartData} className="border-red-300 text-red-700 ml-4">
              Coba Lagi
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="rounded-2xl border border-border bg-card flex flex-col items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-green-600 mb-4" />
            <p className="text-sm text-muted-foreground">Memuat keranjang...</p>
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl border border-dashed border-border bg-card text-center py-16 px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary mx-auto mb-4">
              <ShoppingCart size={28} className="text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Keranjang Anda Kosong</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Tambahkan produk bergizi dari katalog kami dan bayar menggunakan voucher nutrisi Anda.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={() => navigate("/dashboard/katalog")} className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                Mulai Belanja
              </Button>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Kembali ke Dashboard
              </Button>
            </div>
          </div>
        ) : (
          /* Main Content */
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <div className="space-y-4">
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard/katalog")}
                className="w-full sm:w-auto gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                Tambah Produk Lagi
              </Button>
              <Button
                onClick={handleGoToCheckout}
                disabled={isUpdating}
                className="w-full sm:w-auto gap-2 bg-green-600 hover:bg-green-700"
              >
                Lanjutkan ke Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default CartManagement;
