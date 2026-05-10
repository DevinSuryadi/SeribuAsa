import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShoppingCart,
  Loader2,
  ArrowRight,
  ShoppingBag,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Package,
  Sparkles,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { CartItem } from "@/components/cart/CartItem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getCart,
  getCartSummary,
  updateCartItem,
  removeCartItem,
  clearCart,
  getWalletBalance,
} from "@/services/cart";
import { ApiError } from "@/services/api";
import type { CartItemData } from "@/types/checkout";
import { formatIDR } from "@/lib/format";
import { toast } from "sonner";

interface CartSummaryData {
  eligible_amount: number;
  ineligible_amount: number;
  total_amount: number;
  voucher_balance: number;
  max_voucher_applicable: number;
}

interface WalletBalance {
  wallet_balance: number;
  wallet_held: number;
  wallet_available: number;
  expiring_soon: number;
  earliest_expiry?: string;
}

export function CartManagement() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [summary, setSummary] = useState<CartSummaryData | null>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);

  useEffect(() => {
    loadCartData();
  }, []);

  const loadCartData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [cartData, summaryData, walletData] = await Promise.all([
        getCart(),
        getCartSummary(),
        getWalletBalance(),
      ]);
      setCartItems(cartData.items || []);
      setSummary(summaryData);
      setWalletBalance(walletData);
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : "Gagal memuat keranjang";
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        msg = "Akses keranjang hanya untuk akun beneficiary. Silakan login ulang.";
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    setIsUpdating(true);
    try {
      // Find the item and calculate new subtotal
      const itemIndex = cartItems.findIndex((item) => item.id === itemId);
      if (itemIndex === -1) return;

      const item = cartItems[itemIndex];
      const oldSubtotal = Number(item.subtotal);
      const newSubtotal = quantity * Number(item.price);
      const subtotalDifference = newSubtotal - oldSubtotal;

      // Optimistic update: update local state immediately
      const updatedItems = [...cartItems];
      updatedItems[itemIndex] = {
        ...item,
        quantity,
        subtotal: newSubtotal,
      };
      setCartItems(updatedItems);

      // Optimistically update summary
      const newTotal = totalAmount + subtotalDifference;
      setSummary((prev) => (prev ? { ...prev, total_amount: newTotal } : null));

      // Make API call in background
      await updateCartItem(itemId, { quantity });

      // Fetch fresh summary AND wallet balance to ensure accuracy
      const [summaryData, walletData] = await Promise.all([getCartSummary(), getWalletBalance()]);
      setSummary(summaryData);
      setWalletBalance(walletData);

      toast.success("Jumlah item diperbarui");
    } catch (err: unknown) {
      // Revert on error
      await loadCartData();
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui jumlah");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setItemToRemove(itemId);
  };

  const confirmRemoveItem = async () => {
    if (!itemToRemove) return;

    setIsUpdating(true);
    try {
      // Optimistic update: remove from local state
      const itemIndex = cartItems.findIndex((item) => item.id === itemToRemove);
      if (itemIndex !== -1) {
        const removedItem = cartItems[itemIndex];
        const removedSubtotal = Number(removedItem.subtotal);

        // Update local state
        setCartItems(cartItems.filter((_, i) => i !== itemIndex));

        // Update summary
        const newTotal = Math.max(0, totalAmount - removedSubtotal);
        setSummary((prev) => (prev ? { ...prev, total_amount: newTotal } : null));
      }

      // Make API call in background
      await removeCartItem(itemToRemove);
      const [cartData, summaryData, walletData] = await Promise.all([
        getCart(),
        getCartSummary(),
        getWalletBalance(),
      ]);
      setCartItems(cartData.items || []);
      setSummary(summaryData);
      setWalletBalance(walletData);

      toast.success("Item dihapus");
      setItemToRemove(null);
    } catch (err: unknown) {
      // Revert on error
      await loadCartData();
      toast.error(err instanceof Error ? err.message : "Gagal menghapus item");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearCart = () => {
    setShowClearConfirm(true);
  };

  const confirmClearCart = async () => {
    setIsUpdating(true);
    try {
      // Optimistic update
      setCartItems([]);
      setSummary((prev) => (prev ? { ...prev, total_amount: 0 } : null));

      // Make API call in background
      await clearCart();

      toast.success("Keranjang dikosongkan");
      setShowClearConfirm(false);
    } catch (err: unknown) {
      // Revert on error
      await loadCartData();
      toast.error(err instanceof Error ? err.message : "Gagal mengosongkan keranjang");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGoToCheckout = () => {
    if (cartItems.length === 0) {
      toast.error("Keranjang Anda kosong");
      return;
    }
    // Use real wallet_available instead of summary voucher_balance
    const availableBalance = walletBalance?.wallet_available ?? 0;
    const totalAmount = summary?.total_amount ?? 0;
    if (availableBalance < totalAmount) {
      const shortfall = totalAmount - availableBalance;
      toast.error(`Saldo tidak mencukupi. Kekurangan ${formatIDR(shortfall)}`);
      return;
    }
    navigate("/checkout");
  };

  const totalAmount = summary?.total_amount ?? 0;
  const availableBalance = walletBalance?.wallet_available ?? 0;
  const heldBalance = walletBalance?.wallet_held ?? 0;
  const canAfford = availableBalance >= totalAmount;
  const remainder = Math.max(0, availableBalance - totalAmount);
  const shortfall = Math.max(0, totalAmount - availableBalance);

  // ── Loading ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <DashboardLayout title="Keranjang Belanja" subtitle="Tinjau dan lanjutkan pembayaran">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card"
                >
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-xl" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              ))}
            </div>
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────
  if (cartItems.length === 0 && !error) {
    return (
      <DashboardLayout title="Keranjang Belanja" subtitle="Tinjau dan lanjutkan pembayaran">
        <div className="max-w-md mx-auto text-center py-20 space-y-5">
          <div className="relative mx-auto w-24 h-24">
            <div className="h-24 w-24 rounded-3xl bg-secondary flex items-center justify-center">
              <ShoppingCart className="h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <Package className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Keranjang Kosong</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Temukan produk pangan bergizi di katalog dan tambahkan ke keranjang Anda.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Link to="/dashboard/katalog">
                <ShoppingBag className="h-4 w-4" aria-hidden="true" /> Jelajahi Katalog
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard/dompet-nutrisi">Lihat Dompet</Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Main ───────────────────────────────────────────────────────
  return (
    <DashboardLayout
      title="Keranjang Belanja"
      subtitle="Tinjau pesanan dan lanjutkan ke pembayaran"
    >
      <div className="space-y-6">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-destructive/5 border border-destructive/30">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" aria-hidden="true" />
            <p className="text-sm text-destructive flex-1">{error}</p>
            <Button size="sm" variant="outline" onClick={loadCartData} className="shrink-0 gap-1.5">
              <RefreshCw className="h-3 w-3" /> Coba Lagi
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ── Left: Cart Items ── */}
          <div className="lg:col-span-2 space-y-3">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm font-semibold text-foreground">
                  {cartItems.length} item di keranjang
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearCart}
                disabled={isUpdating}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
                Kosongkan
              </button>
            </div>

            {/* Items */}
            <div className="space-y-2">
              {cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  id={item.id}
                  productName={item.product_name}
                  quantity={item.quantity}
                  price={Number(item.price)}
                  subtotal={Number(item.subtotal)}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemoveItem}
                  isLoading={isUpdating}
                  images={item.product_images}
                  categoryName={item.category_name}
                />
              ))}
            </div>

            {/* Add more */}
            <Link
              to="/dashboard/katalog"
              className="flex items-center gap-2 p-3 rounded-2xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all duration-200 group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary group-hover:bg-emerald-100 transition-colors">
                <Sparkles
                  className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-600 transition-colors"
                  aria-hidden="true"
                />
              </div>
              <span>Tambah produk lain dari katalog</span>
            </Link>
          </div>

          {/* ── Right: Payment Summary ── */}
          <div className="lg:sticky lg:top-24 h-fit space-y-4">
            {/* Wallet card */}
            <div
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #0f766e 0%, #059669 60%, #047857 100%)",
              }}
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="h-4 w-4 text-white/80" aria-hidden="true" />
                  <span className="text-xs text-white/80 font-medium">Saldo Dompet Nutrisi</span>
                </div>
                <p className="text-2xl font-black text-white mb-1">{formatIDR(availableBalance)}</p>
                <p className="text-xs text-white/60">Tersedia untuk digunakan</p>
                {heldBalance > 0 && (
                  <p className="text-[11px] text-white/50 mt-2">
                    ({formatIDR(walletBalance?.wallet_balance || 0)} total, {formatIDR(heldBalance)}{" "}
                    di-hold)
                  </p>
                )}
              </div>
            </div>

            {/* Order summary */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
              <h3 className="font-bold text-foreground text-sm">Ringkasan</h3>

              {/* Line items */}
              <div className="space-y-2.5 text-sm">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span className="text-muted-foreground truncate mr-2 max-w-[130px]">
                      {item.product_name} ×{item.quantity}
                    </span>
                    <span className="font-medium text-foreground flex-shrink-0">
                      {formatIDR(Number(item.subtotal))}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-black text-foreground text-base">
                    {formatIDR(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Affordability */}
              <div
                className={`rounded-xl p-3 text-xs space-y-1 ${
                  canAfford
                    ? "bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                    : "bg-destructive/5 border border-destructive/30"
                }`}
              >
                {canAfford ? (
                  <>
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Saldo mencukupi
                    </div>
                    <p className="text-muted-foreground">
                      Sisa saldo:{" "}
                      <span className="font-semibold text-foreground">{formatIDR(remainder)}</span>
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 text-destructive font-semibold">
                      <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      Saldo tidak mencukupi
                    </div>
                    <p className="text-muted-foreground">
                      Kekurangan:{" "}
                      <span className="font-semibold text-destructive">{formatIDR(shortfall)}</span>
                    </p>
                  </>
                )}
              </div>

              {/* Checkout CTA */}
              <Button
                onClick={handleGoToCheckout}
                disabled={isUpdating || !canAfford || cartItems.length === 0}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 h-11 font-semibold shadow-sm shadow-emerald-900/20 transition-all"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Lanjutkan ke Konfirmasi
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </Button>

              {!canAfford && (
                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                  Kurangi jumlah item atau hapus produk untuk melanjutkan
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Dialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kosongkan Keranjang?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus semua {cartItems.length} item dari keranjang Anda. Ini
              tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearCart}
              disabled={isUpdating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Kosongkan Semua"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Item Confirmation Dialog */}
      <AlertDialog open={!!itemToRemove} onOpenChange={() => setItemToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus item ini dari keranjang?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveItem}
              disabled={isUpdating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus Item"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

export default CartManagement;
