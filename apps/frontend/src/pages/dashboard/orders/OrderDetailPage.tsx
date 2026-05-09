import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Package,
  Store,
  QrCode,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Wallet,
  Receipt,
  AlertCircle,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrder } from "@/services/orders";
import { addToCart } from "@/services/cart";
import { formatDate, formatIDR } from "@/lib/format";
import OrderQrModal from "@/components/order/OrderQrModal";
import { ProductAvatar } from "@/components/product/ProductAvatar";
import { toast } from "sonner";

// ── Status config ───────────────────────────────────────────────
const statusConfig: Record<
  string,
  { label: string; cls: string; dot: string; icon: React.ElementType; desc: string }
> = {
  pending: {
    label: "Menunggu",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-400",
    icon: Clock,
    desc: "Pesanan menunggu konfirmasi dari vendor",
  },
  confirmed: {
    label: "Dikonfirmasi",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    icon: CheckCircle2,
    desc: "Vendor telah mengkonfirmasi pesanan Anda",
  },
  processing: {
    label: "Diproses",
    cls: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
    icon: Loader2,
    desc: "Pesanan sedang disiapkan oleh vendor",
  },
  delivered: {
    label: "Terkirim",
    cls: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
    icon: CheckCircle2,
    desc: "Pesanan telah terkirim/diambil",
  },
  completed: {
    label: "Selesai",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
    desc: "Pesanan telah selesai",
  },
  cancelled: {
    label: "Dibatalkan",
    cls: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-400",
    icon: XCircle,
    desc: "Pesanan telah dibatalkan",
  },
};

type OrderItem = {
  id?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  price: number;
  subtotal?: number;
  product_images?: string[];
  category_name?: string;
};

function OrderDetailPage() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        navigate("/dashboard/dompet-nutrisi?tab=pesanan");
        return;
      }
      setIsLoading(true);
      try {
        const response = await getOrder(orderId);
        setOrder((response as Record<string, unknown>) || null);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Gagal memuat detail pesanan");
        navigate("/dashboard/dompet-nutrisi?tab=pesanan");
      } finally {
        setIsLoading(false);
      }
    };
    void loadOrder();
  }, [orderId, navigate]);

  const handleReorder = async () => {
    if (!order) return;
    const items = Array.isArray(order.items) ? (order.items as OrderItem[]) : [];
    if (items.length === 0) { toast.error("Tidak ada item untuk dipesan ulang"); return; }
    setReordering(true);
    try {
      await Promise.all(
        items.map((item) =>
          addToCart({ product_id: item.product_id, quantity: Number(item.quantity || 1) })
        )
      );
      toast.success("Item ditambahkan ke keranjang");
      navigate("/dashboard/cart");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal memesan ulang");
    } finally {
      setReordering(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <DashboardLayout title="Detail Pesanan" subtitle="Memuat...">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout title="Detail Pesanan" subtitle="Pesanan tidak ditemukan">
        <div className="text-center py-16">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-semibold mb-4">Pesanan tidak ditemukan</p>
          <Button variant="outline" onClick={() => navigate("/dashboard/dompet-nutrisi?tab=pesanan")}>
            Kembali ke Pesanan
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // ── Data ────────────────────────────────────────────────────────
  const status = String(order.status ?? "pending");
  const sc = statusConfig[status] ?? {
    label: status,
    cls: "bg-secondary text-muted-foreground border-border",
    dot: "bg-muted-foreground",
    icon: Package,
    desc: "",
  };
  const StatusIcon = sc.icon;
  const items = Array.isArray(order.items) ? (order.items as OrderItem[]) : [];
  const totalAmount = Number(order.cart_total ?? order.total_amount ?? 0);
  const voucherDiscount = Number(order.voucher_discount ?? order.voucher_used ?? 0);
  const walletPaid = totalAmount - voucherDiscount;
  const cashPaid = Number(order.cash_paid ?? order.cash_amount ?? 0);
  const createdAt = order.created_at ? new Date(String(order.created_at)) : null;
  const canShowQr = status === "pending" || status === "confirmed";
  const canReorder = items.length > 0 && status !== "pending";

  return (
    <DashboardLayout
      title="Detail Pesanan"
      subtitle={`ORD-${String(order.id ?? "").slice(0, 8).toUpperCase()}`}
    >
      {/* QR Modal */}
      <OrderQrModal
        orderId={orderId ?? null}
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        onCancelled={() => {
          setQrOpen(false);
          navigate("/dashboard/dompet-nutrisi?tab=pesanan");
        }}
      />

      <div className="space-y-5">
        {/* Back button */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard/dompet-nutrisi?tab=pesanan")}
            className="gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Pesanan Saya
          </Button>
        </div>

        {/* ── 2-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── LEFT: Order Items + Payment ── (2/3) */}
          <div className="lg:col-span-2 space-y-4">

            {/* QR Pickup Banner — only for pending/confirmed */}
            {canShowQr && (
              <button
                type="button"
                onClick={() => setQrOpen(true)}
                className="w-full group relative overflow-hidden rounded-2xl p-5 text-left transition-transform hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                style={{ background: "linear-gradient(135deg, #0f766e 0%, #059669 60%, #047857 100%)" }}
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/70 font-medium mb-1">Ambil Pesanan</p>
                    <p className="text-lg font-bold text-white">Tampilkan QR Pickup</p>
                    <p className="text-xs text-white/60 mt-1">
                      Tunjukkan QR ini ke vendor saat pengambilan barang
                    </p>
                  </div>
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <QrCode className="h-7 w-7 text-white" aria-hidden="true" />
                  </div>
                </div>
              </button>
            )}

            {/* Items card */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border bg-secondary/30">
                <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm font-semibold text-foreground">
                  Produk Dipesan ({items.length} item)
                </span>
                {order.vendor_store_name && (
                  <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Store className="h-3.5 w-3.5" aria-hidden="true" />
                    {String(order.vendor_store_name)}
                  </div>
                )}
              </div>

              <div className="divide-y divide-border">
                {items.length > 0 ? (
                  items.map((item, idx) => {
                    const sub = Number(item.subtotal ?? Number(item.price || 0) * Number(item.quantity || 0));
                    return (
                      <div key={item.id ?? idx} className="flex items-center gap-4 px-5 py-4">
                        <ProductAvatar
                          images={item.product_images}
                          categoryName={item.category_name || "Produk"}
                          name={item.product_name || item.product_id}
                          className="h-10 w-10 flex-shrink-0 rounded-xl"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {item.product_name || item.product_id}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatIDR(Number(item.price))} × {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-foreground flex-shrink-0">
                          {formatIDR(sub)}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                    Tidak ada data item
                  </div>
                )}
              </div>
            </div>

            {/* Payment summary */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border bg-secondary/30">
                <Receipt className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm font-semibold text-foreground">Ringkasan Pembayaran</span>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-foreground">{formatIDR(totalAmount)}</span>
                </div>
                {voucherDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-emerald-600">Diskon Voucher</span>
                    <span className="font-semibold text-emerald-600">-{formatIDR(voucherDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                    Dibayar via Dompet
                  </span>
                  <span className="font-black text-lg text-emerald-600">{formatIDR(walletPaid)}</span>
                </div>
                {cashPaid > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bayar Tunai</span>
                    <span className="font-semibold">{formatIDR(cashPaid)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Status + Info ── (1/3) */}
          <div className="space-y-4 lg:sticky lg:top-24">

            {/* Status card */}
            <div className={`rounded-2xl border p-5 ${sc.cls}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`h-3 w-3 rounded-full ${sc.dot} ring-4 ring-current/20`} />
                <span className="font-bold text-base">{sc.label}</span>
                <StatusIcon className="h-4 w-4 ml-auto opacity-70" aria-hidden="true" />
              </div>
              <p className="text-xs opacity-80">{sc.desc}</p>
            </div>

            {/* Order meta */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-bold text-foreground">Info Pesanan</h3>

              <div className="space-y-3 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">Nomor Pesanan</span>
                  <span className="font-mono font-bold text-foreground">
                    {String(order.id ?? "-")}
                  </span>
                </div>

                {createdAt && !Number.isNaN(createdAt.getTime()) && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      Tanggal Pesanan
                    </span>
                    <span className="font-semibold text-foreground">{formatDate(createdAt)}</span>
                  </div>
                )}

                {order.vendor_store_name && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Store className="h-3 w-3" />
                      Vendor
                    </span>
                    <span className="font-semibold text-foreground">
                      {String(order.vendor_store_name)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {canReorder && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleReorder}
                  disabled={reordering}
                >
                  {reordering ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  )}
                  Pesan Lagi
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default OrderDetailPage;
