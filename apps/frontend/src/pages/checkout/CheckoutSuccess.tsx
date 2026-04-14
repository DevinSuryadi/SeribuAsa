import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { CheckCircle2, Home, ShoppingCart, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { getOrder } from "@/services/orders";

/**
 * CheckoutSuccess - Order confirmation page
 */
export function CheckoutSuccess() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      if (orderId) {
        const orderData = await getOrder(orderId);
        setOrder(orderData);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat detail pesanan");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Konfirmasi Pesanan" subtitle="">
        <div className="text-center py-12">
          <Loader2 size={32} className="animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Memproses pesanan Anda...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Pesanan Berhasil" subtitle="">
      <div className="max-w-2xl mx-auto">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
            <CheckCircle2 size={48} className="text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pesanan Dikonfirmasi!</h1>
          <p className="text-gray-600 mb-6">
            Terima kasih telah berbelanja. Pesanan Anda telah berhasil dibuat.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6 mb-8">
          {/* Order ID */}
          <div className="border-b border-gray-200 pb-4">
            <p className="text-sm text-gray-600 mb-1">Nomor Pesanan</p>
            <p className="text-2xl font-bold text-gray-900">ORD-{orderId?.slice(0, 8)}</p>
          </div>

          {/* Order Summary */}
          {order && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Ringkasan Pesanan</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Barang:</span>
                    <span className="font-medium">{order.items?.length || 0} produk</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Harga:</span>
                    <span className="font-medium">
                      Rp {(order.total_amount || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                  {order.voucher_used > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Diskon Voucher:</span>
                      <span className="font-medium text-green-600">
                        -Rp {(order.voucher_used || 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-bold text-gray-900">Total Bayar:</span>
                    <span className="font-bold text-blue-600">
                      Rp {(order.cash_paid || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {order.items && order.items.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Produk</h4>
                  <div className="space-y-2">
                    {order.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.product_name} × {item.quantity}
                        </span>
                        <span className="text-gray-900">
                          Rp {Number(item.subtotal).toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <span className="font-bold">Status:</span> {order.status || "Pending"}
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Vendor akan mengonfirmasi pesanan Anda dalam 24 jam
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h3 className="font-bold text-gray-900 mb-4">Langkah Selanjutnya</h3>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </span>
              <span>Tunggu vendor mengonfirmasi pesanan Anda (24 jam)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </span>
              <span>Ambil produk di lokasi vendor sesuai jadwal yang disepakati</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </span>
              <span>Voucher akan ditukar saat checkout di vendor</span>
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/beneficiary")}
            className="flex items-center gap-2"
          >
            <Home size={18} />
            Kembali ke Dashboard
          </Button>
          <Button
            onClick={() => navigate("/dashboard/katalog")}
            className="flex items-center gap-2"
          >
            <ShoppingCart size={18} />
            Lanjutkan Belanja
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
