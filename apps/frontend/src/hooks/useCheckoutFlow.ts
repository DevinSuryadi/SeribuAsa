/**
 * useCheckoutFlow Hook
 * Manages checkout flow state, validation, and API orchestration
 */

import { useState, useCallback, useMemo } from "react";
import {
  CheckoutStep,
  CartItemData,
  ValidatedVoucher,
  AppliedVoucher,
  EligibilityData,
  OrderSummary,
  CheckoutState,
} from "@/types/checkout";
import {
  getCart,
  getCartSummary,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "@/services/cart";
import { validateVoucher, checkProductEligibility, redeemSingleVoucher } from "@/services/vouchers";
import { createOrder } from "@/services/orders";
import { useAuth } from "@/contexts/AuthContext";

export function useCheckoutFlow() {
  const { user } = useAuth();
  const [state, setState] = useState<CheckoutState>({
    currentStep: 1,
    cartItems: [],
    appliedVoucher: null,
    validatedVoucher: null,
    eligibilityData: null,
    orderSummary: null,
    isLoading: false,
    isSubmitting: false,
    error: null,
    orderId: null,
  });

  // ============================================
  // Step Navigation
  // ============================================

  const setCurrentStep = useCallback((step: CheckoutStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  // ============================================
  // Cart Management
  // ============================================

  const loadCartItems = useCallback(async () => {
    if (!user) return;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const cartData = await getCart();
      setState((prev) => ({
        ...prev,
        cartItems: cartData.items || [],
        isLoading: false,
      }));
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        error: err.message || "Failed to load cart",
        isLoading: false,
      }));
    }
  }, [user]);

  const updateQty = useCallback(
    async (itemId: string, quantity: number) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        await updateCartItem(itemId, { quantity });
        await loadCartItems();
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          error: err.message || "Failed to update quantity",
          isLoading: false,
        }));
      }
    },
    [loadCartItems]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        await removeCartItem(itemId);
        await loadCartItems();
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          error: err.message || "Failed to remove item",
          isLoading: false,
        }));
      }
    },
    [loadCartItems]
  );

  // ============================================
  // Voucher Management
  // ============================================

  const validateVoucherCode = useCallback(async (code: string, amount: number) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await validateVoucher({ code, amount });
      setState((prev) => ({
        ...prev,
        validatedVoucher: result,
        isLoading: false,
      }));
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        error: err.message || "Invalid voucher code",
        isLoading: false,
      }));
    }
  }, []);

  const applyVoucher = useCallback(
    (voucherId: string, appliedAmount: number, code: string, remainingBalance: number) => {
      setState((prev) => ({
        ...prev,
        appliedVoucher: {
          voucher_id: voucherId,
          code,
          applied_amount: appliedAmount,
          remaining_balance: remainingBalance,
        },
        validatedVoucher: null,
        error: null,
      }));
    },
    []
  );

  const removeAppliedVoucher = useCallback(() => {
    setState((prev) => ({
      ...prev,
      appliedVoucher: null,
      error: null,
    }));
  }, []);

  // ============================================
  // Eligibility Check
  // ============================================

  const checkEligibility = useCallback(async () => {
    if (state.cartItems.length === 0) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const productIds = state.cartItems.map((item) => item.product_id);
      const result = await checkProductEligibility(productIds);
      setState((prev) => ({
        ...prev,
        eligibilityData: result,
        isLoading: false,
      }));
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        error: err.message || "Failed to check eligibility",
        isLoading: false,
      }));
    }
  }, [state.cartItems]);

  // ============================================
  // Order Summary
  // ============================================

  const getOrderSummary = useCallback((): OrderSummary => {
    const cartTotal = state.cartItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
    const voucherDiscount = state.appliedVoucher?.applied_amount || 0;
    const cashAmount = Math.max(0, cartTotal - voucherDiscount);

    // Group by vendor
    const groupedByVendor: { [key: string]: CartItemData[] } = {};
    state.cartItems.forEach((item) => {
      const vendorId = `vendor_${item.product_id}`;
      if (!groupedByVendor[vendorId]) groupedByVendor[vendorId] = [];
      groupedByVendor[vendorId].push(item);
    });

    return {
      cart_total: cartTotal,
      voucher_discount: voucherDiscount,
      cash_amount: cashAmount,
      items: state.cartItems,
      grouped_by_vendor: groupedByVendor,
      applied_voucher: state.appliedVoucher || null,
    };
  }, [state.cartItems, state.appliedVoucher]);

  // ============================================
  // Validation
  // ============================================

  const canProceedToNextStep = useCallback((): boolean => {
    switch (state.currentStep) {
      case 1: // Cart Review
        return state.cartItems.length > 0;
      case 2: // Voucher Redemption
        return state.cartItems.length > 0;
      case 3: // Order Confirmation
        return state.cartItems.length > 0;
      case 4: // Success
        return !!state.orderId;
      default:
        return false;
    }
  }, [state.currentStep, state.cartItems, state.orderId]);

  const validateCurrentStep = useCallback((): boolean => {
    switch (state.currentStep) {
      case 1:
        return state.cartItems.length > 0;
      case 2:
        return state.cartItems.length > 0;
      case 3:
        return state.cartItems.length > 0;
      default:
        return true;
    }
  }, [state.currentStep, state.cartItems]);

  // ============================================
  // Order Submission
  // ============================================

  const submitOrder = useCallback(async (): Promise<string> => {
    if (!user) throw new Error("User not authenticated");
    if (state.cartItems.length === 0) throw new Error("Cart is empty");

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // If voucher applied, redeem it first
      let voucherRedemptionData = null;
      if (state.appliedVoucher && state.appliedVoucher.voucher_id) {
        try {
          const redemptionResult = await redeemSingleVoucher({
            code: state.appliedVoucher.code,
            amount: state.appliedVoucher.applied_amount,
            order_id: `temp-${Date.now()}`, // Temporary, will update after order created
          });
          voucherRedemptionData = redemptionResult;
        } catch (err: any) {
          throw new Error(`Voucher redemption failed: ${err.message}`);
        }
      }

      // Group items by vendor and create orders
      const groupedByVendor: { [key: string]: CartItemData[] } = {};
      state.cartItems.forEach((item) => {
        // Get vendor from backend - for now, we'll use a placeholder
        const vendorId = `vendor_${item.product_id}`;
        if (!groupedByVendor[vendorId]) groupedByVendor[vendorId] = [];
        groupedByVendor[vendorId].push(item);
      });

      // Create orders for each vendor
      const orderIds: string[] = [];
      for (const [vendorId, items] of Object.entries(groupedByVendor)) {
        const orderData = {
          vendor_id: vendorId.replace("vendor_", ""),
          items: items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: Number(item.price),
          })),
          voucher_codes: state.appliedVoucher ? [state.appliedVoucher.code] : [],
          notes: null,
        };

        const orderResult = await createOrder(orderData);
        orderIds.push(orderResult.id);
      }

      // Clear cart after successful order
      await clearCart();

      const firstOrderId = orderIds[0];
      setState((prev) => ({
        ...prev,
        orderId: firstOrderId,
        isSubmitting: false,
      }));

      return firstOrderId;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to submit order";
      setState((prev) => ({
        ...prev,
        error: errorMsg,
        isSubmitting: false,
      }));
      throw err;
    }
  }, [user, state.cartItems, state.appliedVoucher]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    ...state,

    // Step navigation
    setCurrentStep,

    // Cart operations
    loadCartItems,
    updateQty,
    removeItem,

    // Voucher operations
    validateVoucherCode,
    applyVoucher,
    removeAppliedVoucher,

    // Eligibility
    checkEligibility,

    // Order operations
    getOrderSummary,
    submitOrder,

    // Validation
    canProceedToNextStep,
    validateCurrentStep,

    // Error handling
    clearError,
  };
}
