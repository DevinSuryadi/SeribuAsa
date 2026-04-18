import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ArrowLeft, CalendarDays, Package, Store } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrder } from "@/services/orders";
import { toast } from "sonner";

function formatCurrency(value: number) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function OrderDetailPage() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        navigate("/dashboard/orders");
        return;
      }

      setIsLoading(true);
      try {
        const response = await getOrder(orderId);
        setOrder(response || null);
      } catch (err: any) {
        toast.error(err?.message || "Gagal memuat detail pesanan");
        navigate("/dashboard/orders");
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrder();
  }, [orderId, navigate]);

  if (isLoading) {
    return (
      <DashboardLayout title="Detail Pesanan" subtitle="Memuat data pesanan...">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout title="Detail Pesanan" subtitle="Pesanan tidak ditemukan">
        <div className="max-w-4xl mx-auto">
          <Button variant="outline" onClick={() => navigate("/dashboard/orders")}>
            Kembali ke Riwayat
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const totalAmount = Number(order.cart_total ?? order.total_amount ?? order.cash_amount ?? 0);
  const voucherDiscount = Number(order.voucher_discount ?? order.voucher_used ?? 0);
  const cashAmount = Number(
    order.cash_amount ?? order.cash_paid ?? Math.max(0, totalAmount - voucherDiscount)
  );
  const createdAt = order.created_at ? new Date(order.created_at) : null;

  return (
    <DashboardLayout title="Detail Pesanan" subtitle={`Order ID: ${order.id}`}>
      <div className="max-w-4xl mx-auto space-y-4">
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard/orders")}
          className="min-h-11"
        >
          <ArrowLeft size={16} className="mr-2" />
          Kembali ke Riwayat
        </Button>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-sm text-gray-600">Status</p>
            <p className="font-semibold text-gray-900 capitalize">{String(order.status || "-")}</p>
          </div>
          {createdAt && !Number.isNaN(createdAt.getTime()) && (
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <CalendarDays size={14} className="text-gray-400" />
              {format(createdAt, "dd MMM yyyy", { locale: idLocale })}
            </div>
          )}
          {order.vendor_store_name && (
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <Store size={14} className="text-gray-400" />
              {order.vendor_store_name}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Daftar Item</h3>
          <div className="space-y-3">
            {items.map((item: any) => (
              <div
                key={item.id || item.product_id}
                className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-900">
                    <Package size={14} className="text-gray-400" />
                    <span className="truncate">{item.product_name || item.product_id}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Qty: {Number(item.quantity || 0)}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(
                    Number(item.subtotal ?? Number(item.price || 0) * Number(item.quantity || 0))
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Belanja</span>
            <span className="font-semibold text-gray-900">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-700">Voucher</span>
            <span className="font-semibold text-green-700">-{formatCurrency(voucherDiscount)}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-gray-700 font-medium">Pembayaran Tunai</span>
            <span className="text-lg font-bold text-gray-900">{formatCurrency(cashAmount)}</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default OrderDetailPage;
