import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { CartReviewStep } from "@/components/checkout/CartReviewStep";
import { VoucherRedemptionStep } from "@/components/checkout/VoucherRedemptionStep";
import { OrderConfirmationStep } from "@/components/checkout/OrderConfirmationStep";
import { useCheckoutFlow } from "@/hooks/useCheckoutFlow";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * CheckoutPage - Main checkout page with multi-step flow
 */
export function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const checkoutFlow = useCheckoutFlow();

  // Load cart on mount
  useEffect(() => {
    checkoutFlow.loadCartItems();
    if (checkoutFlow.cartItems.length > 0) {
      checkoutFlow.checkEligibility();
    }
  }, []);

  // Redirect if cart is empty
  if (!checkoutFlow.isLoading && checkoutFlow.cartItems.length === 0) {
    return (
      <DashboardLayout title="Checkout" subtitle="Keranjang Anda kosong">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Keranjang Kosong</h2>
          <p className="text-gray-600 mb-6">Tambahkan produk sebelum melanjutkan checkout</p>
          <Button onClick={() => navigate("/dashboard/katalog")}>Lanjutkan Belanja</Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleNextStep = () => {
    if (!checkoutFlow.validateCurrentStep()) {
      toast.error("Silakan lengkapi langkah ini terlebih dahulu");
      return;
    }

    if (checkoutFlow.currentStep < 4) {
      checkoutFlow.setCurrentStep((checkoutFlow.currentStep + 1) as any);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevStep = () => {
    if (checkoutFlow.currentStep > 1) {
      checkoutFlow.setCurrentStep((checkoutFlow.currentStep - 1) as any);
      window.scrollTo(0, 0);
    }
  };

  const handleConfirmOrder = async () => {
    if (!user) {
      toast.error("Anda harus login untuk melanjutkan");
      return;
    }

    try {
      const orderId = await checkoutFlow.submitOrder();
      toast.success("Pesanan berhasil dibuat!");
      navigate(`/checkout/success/${orderId}`);
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat pesanan");
    }
  };

  const handleCancel = () => {
    if (window.confirm("Apakah Anda yakin ingin membatalkan checkout?")) {
      navigate("/dashboard/katalog");
    }
  };

  return (
    <DashboardLayout title="Checkout" subtitle="Tinjau pesanan dan konfirmasi pembayaran Anda">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Step Indicator */}
        <CheckoutSteps
          currentStep={checkoutFlow.currentStep}
          onStepClick={(step) => {
            if (step <= checkoutFlow.currentStep) {
              checkoutFlow.setCurrentStep(step);
              window.scrollTo(0, 0);
            }
          }}
        />

        {/* Loading State */}
        {checkoutFlow.isLoading && (
          <div className="text-center py-12">
            <Loader2 size={32} className="animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">Memproses...</p>
          </div>
        )}

        {/* Step Content */}
        {!checkoutFlow.isLoading && (
          <>
            {/* Step 1: Cart Review */}
            {checkoutFlow.currentStep === 1 && (
              <CartReviewStep
                items={checkoutFlow.cartItems}
                isLoading={checkoutFlow.isLoading}
                onUpdateQuantity={checkoutFlow.updateQty}
                onRemoveItem={checkoutFlow.removeItem}
                onClearCart={async () => {
                  await checkoutFlow.removeItem("");
                  checkoutFlow.loadCartItems();
                }}
                voucherBalance={100000} // TODO: Get from API
              />
            )}

            {/* Step 2: Voucher Redemption */}
            {checkoutFlow.currentStep === 2 && (
              <VoucherRedemptionStep
                cartTotal={checkoutFlow.cartItems.reduce(
                  (sum, item) => sum + Number(item.subtotal),
                  0
                )}
                voucherBalance={100000} // TODO: Get from API
                eligibilityData={checkoutFlow.eligibilityData}
                appliedVoucher={checkoutFlow.appliedVoucher}
                isLoading={checkoutFlow.isLoading}
                onValidate={checkoutFlow.validateVoucherCode}
                onApply={checkoutFlow.applyVoucher}
                onRemove={checkoutFlow.removeAppliedVoucher}
              />
            )}

            {/* Step 3: Order Confirmation */}
            {checkoutFlow.currentStep === 3 && (
              <OrderConfirmationStep
                orderSummary={checkoutFlow.getOrderSummary()}
                isLoading={checkoutFlow.isSubmitting}
                error={checkoutFlow.error}
              />
            )}

            {/* Step 4: Success - Handled by redirect */}
          </>
        )}

        {/* Navigation Buttons */}
        {!checkoutFlow.isLoading && checkoutFlow.currentStep < 4 && (
          <div className="flex items-center justify-between pt-8 border-t border-gray-200">
            <div className="space-x-3">
              <Button variant="outline" onClick={handleCancel}>
                Batal
              </Button>
              {checkoutFlow.currentStep > 1 && (
                <Button variant="outline" onClick={handlePrevStep}>
                  ← Kembali
                </Button>
              )}
            </div>

            <Button
              onClick={checkoutFlow.currentStep === 3 ? handleConfirmOrder : handleNextStep}
              disabled={checkoutFlow.isSubmitting || !checkoutFlow.canProceedToNextStep()}
              className="flex items-center gap-2"
            >
              {checkoutFlow.isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Memproses...
                </>
              ) : checkoutFlow.currentStep === 3 ? (
                "Konfirmasi Pesanan"
              ) : (
                "Lanjutkan →"
              )}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
