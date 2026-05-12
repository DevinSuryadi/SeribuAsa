import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, ShoppingBag, AlertTriangle, ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
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
import { OrderConfirmationStep } from "@/components/checkout/OrderConfirmationStep";
import { useCheckoutFlow } from "@/hooks/useCheckoutFlow";
import { useAuth } from "@/contexts/AuthContext";
import { validateStockForCheckout } from "@/services/cart";
import { toast } from "sonner";

/**
 * CheckoutPage — Order confirmation page.
 * Cart review happens in CartManagement (/dashboard/cart).
 * This page is purely for final confirmation + submission.
 */
function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const flow = useCheckoutFlow();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);

  useEffect(() => {
    flow.loadCartItems();
    flow.loadWalletBalance();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Validate stock availability ─────────────────────────────────
  useEffect(() => {
    const validateStock = async () => {
      if (flow.cartItems.length === 0) {
        setStockError(null);
        return;
      }

      try {
        const productIds = flow.cartItems.map((item) => item.product_id);
        const validation = await validateStockForCheckout(productIds);

        if (!validation.all_available) {
          const unavailableProducts = validation.unavailable_items || [];
          if (unavailableProducts.length > 0) {
            const productNames = unavailableProducts
              .map(
                (item: any) =>
                  `${item.product_name} (kebutuhan: ${item.required}, tersedia: ${item.available})`
              )
              .join(", ");

            const errorMsg = `Stok produk tidak tersedia: ${productNames}. Silakan kembali ke keranjang untuk menyesuaikan jumlah.`;
            setStockError(errorMsg);
            toast.error("Stok Produk Tidak Tersedia", {
              description: errorMsg,
            });
          }
        } else {
          setStockError(null);
        }
      } catch (err: unknown) {
        console.error("Stock validation error:", err);
        // Don't show error to user if validation endpoint fails
        // (it's not critical - backend will check anyway)
      }
    };

    validateStock();
  }, [flow.cartItems]);

  // ── Empty cart → redirect back ────────────────────────────────
  if (!flow.isLoading && flow.cartItems.length === 0) {
    return (
      <DashboardLayout title="Konfirmasi Pesanan" subtitle="">
        <div className="max-w-md mx-auto text-center py-16 space-y-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary mx-auto">
            <ShoppingBag className="h-9 w-9 text-muted-foreground" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">Keranjang Kosong</h2>
            <p className="text-sm text-muted-foreground">
              Tambahkan produk sebelum melanjutkan ke konfirmasi.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/dashboard/cart">
              <ArrowLeft className="h-4 w-4" /> Kembali ke Keranjang
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // ── Submit ─────────────────────────────────────────────────────
  const handleConfirmOrder = async () => {
    if (!user) {
      toast.error("Anda harus login untuk melanjutkan");
      return;
    }
    try {
      const orderIds = await flow.submitOrder();
      toast.success("✓ Pesanan berhasil dibuat!");
      navigate(`/checkout/success/${orderIds[0]}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuat pesanan";
      if (msg.toLowerCase().includes("balance") || msg.toLowerCase().includes("saldo")) {
        toast.error(`Saldo tidak cukup. ${msg}`);
      } else if (msg.toLowerCase().includes("stock") || msg.toLowerCase().includes("stok")) {
        toast.error(`Stok tidak tersedia. ${msg}`);
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <DashboardLayout
      title="Konfirmasi Pesanan"
      subtitle="Tinjau ringkasan dan konfirmasi pembayaran"
    >
      {/* Cancel dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
              Kembali ke Keranjang?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Item di keranjang Anda tidak akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tetap di Sini</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/dashboard/cart")}>
              Kembali ke Keranjang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
        {/* Stock Error Alert */}
        {stockError && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-destructive/5 border border-destructive/30 animate-in slide-in-from-top-2 duration-300">
            <AlertTriangle
              className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Stok Tidak Tersedia</p>
              <p className="text-xs text-destructive/80 mt-1">{stockError}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/dashboard/cart")}
              className="flex-shrink-0"
            >
              Kembali
            </Button>
          </div>
        )}

        {/* Loading */}
        {flow.isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Memuat..." />
            <p className="text-sm text-muted-foreground">Memuat data pesanan...</p>
          </div>
        )}

        {/* Confirmation */}
        {!flow.isLoading && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <OrderConfirmationStep
              orderSummary={flow.getOrderSummary()}
              walletBalance={flow.walletBalance}
              error={flow.error}
            />
          </div>
        )}

        {/* Actions */}
        {!flow.isLoading && (
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelDialog(true)}
              className="gap-1.5 w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Keranjang
            </Button>

            <Button
              onClick={handleConfirmOrder}
              disabled={flow.isSubmitting || flow.cartItems.length === 0 || !!stockError}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 w-full sm:min-w-[180px] h-11 font-semibold shadow-sm shadow-emerald-900/20"
            >
              {flow.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "✓ Konfirmasi & Bayar"
              )}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default CheckoutPage;
