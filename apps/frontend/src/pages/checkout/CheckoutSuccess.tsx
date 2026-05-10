import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Home,
  ShoppingCart,
  Loader2,
  QrCode,
  Package,
  Store,
  Sparkles,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOrder } from "@/services/orders";
import { formatIDR } from "@/lib/format";

/**
 * CheckoutSuccess — Shown after a successful order submission.
 * Polished with design tokens, real payment totals, and QR Pickup CTA.
 */
export function CheckoutSuccess() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) loadOrder();
  }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadOrder = async () => {
    try {
      if (orderId) {
        const data = await getOrder(orderId);
        setOrder(data as unknown as Record<string, unknown>);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat detail pesanan");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Memproses Pesanan" subtitle="">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Memuat..." />
          <p className="text-sm text-muted-foreground">Memproses pesanan Anda...</p>
        </div>
      </DashboardLayout>
    );
  }

  const items = Array.isArray(order?.items) ? (order.items as Record<string, unknown>[]) : [];
  const totalAmount = Number(order?.cart_total ?? order?.total_amount ?? 0);
  const voucherUsed = Number(order?.voucher_used ?? order?.voucher_discount ?? 0);
  const cashPaid = Number(order?.cash_paid ?? 0);
  const status = String(order?.status ?? "pending");

  return (
    <DashboardLayout title="Pesanan Berhasil 🎉" subtitle="">
      <div className="space-y-6">
        {/* ── 2-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* LEFT — Hero + Next Steps + CTAs (2/5) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Hero banner */}
            <div
              className="relative overflow-hidden rounded-3xl p-8 text-center shadow-xl shadow-emerald-900/10"
              style={{
                background: "linear-gradient(135deg, #0f766e 0%, #059669 50%, #047857 100%)",
              }}
            >
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-teal-300/10 blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mb-4 mx-auto animate-in zoom-in-50 duration-500">
                  <CheckCircle2 className="h-10 w-10 text-white" aria-hidden="true" />
                </div>
                <h1 className="text-2xl font-extrabold text-white mb-2">Pesanan Dikonfirmasi!</h1>
                <p className="text-white/80 text-sm mb-5">
                  Pesanan berhasil dibuat dan sedang diproses vendor.
                </p>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <Sparkles className="h-4 w-4 text-yellow-300" aria-hidden="true" />
                  <span className="text-white font-mono text-sm font-bold">
                    ORD-{orderId?.slice(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-bold text-foreground mb-4">Langkah Selanjutnya</h3>
              <ol className="space-y-4">
                {[
                  {
                    step: 1,
                    title: "Tunggu Konfirmasi Vendor",
                    desc: "Vendor akan mengonfirmasi pesanan dalam 24 jam.",
                    color: "bg-blue-600",
                  },
                  {
                    step: 2,
                    title: "Ambil QR Pickup",
                    desc: "QR Code tersedia di tab Pesanan Saya setelah dikonfirmasi.",
                    color: "bg-emerald-600",
                  },
                  {
                    step: 3,
                    title: "Tunjukkan ke Vendor",
                    desc: "Kunjungi vendor, scan QR, dan ambil produk Anda.",
                    color: "bg-purple-600",
                  },
                ].map((item) => (
                  <li key={item.step} className="flex items-start gap-4">
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${item.color} text-white text-sm font-black`}
                    >
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2.5">
              <Button
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 h-11"
                onClick={() => navigate("/dashboard/dompet-nutrisi?tab=pesanan")}
              >
                <QrCode className="h-4 w-4" aria-hidden="true" />
                Lihat QR Pickup
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate("/dashboard/katalog")}
                >
                  <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                  Belanja Lagi
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/dashboard/beneficiary" className="gap-1.5">
                    <Home className="h-4 w-4" aria-hidden="true" />
                    Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* RIGHT — Order Detail (3/5) */}
          <div className="lg:col-span-3 space-y-4">
            {/* ── Order Items ── */}
            {order && (
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                {/* Header */}
                <div className="flex items-center gap-2.5 px-5 py-3 bg-secondary/40 border-b border-border">
                  <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-semibold text-foreground">Produk Dipesan</span>
                  {order.vendor_store_name != null && (
                    <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Store className="h-3.5 w-3.5" aria-hidden="true" />
                      {String(order.vendor_store_name)}
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="p-5">
                  {items.length > 0 ? (
                    <div className="space-y-3">
                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 pb-3 border-b border-border/50 last:border-0 last:pb-0"
                        >
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
                            <Package
                              className="h-3.5 w-3.5 text-muted-foreground"
                              aria-hidden="true"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {String(item.product_name ?? "Produk")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              × {Number(item.quantity ?? 1)}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-foreground flex-shrink-0">
                            {formatIDR(Number(item.subtotal ?? 0))}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Detail item tidak tersedia
                    </p>
                  )}
                </div>

                {/* Totals */}
                <div className="border-t border-border bg-secondary/20 p-5 space-y-2">
                  {totalAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Belanja</span>
                      <span className="font-semibold text-foreground">
                        {formatIDR(totalAmount)}
                      </span>
                    </div>
                  )}
                  {voucherUsed > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Diskon Voucher</span>
                      <span className="font-semibold text-emerald-600">
                        -{formatIDR(voucherUsed)}
                      </span>
                    </div>
                  )}
                  {cashPaid > 0 && (
                    <div className="flex justify-between text-sm pt-2 border-t border-border">
                      <span className="font-bold text-foreground">Bayar Tunai</span>
                      <span className="font-bold text-foreground">{formatIDR(cashPaid)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-bold text-foreground">Dibayar via Dompet</span>
                    <span className="text-lg font-black text-emerald-600">
                      {formatIDR(totalAmount - voucherUsed)}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="px-5 pb-5">
                  <div className="flex items-center gap-2 mt-4">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-700 border-amber-200 capitalize"
                    >
                      {status}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
          {/* right col */}
        </div>
        {/* grid */}
      </div>
    </DashboardLayout>
  );
}

export default CheckoutSuccess;
