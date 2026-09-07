/**
 * useCheckoutFlow Hook
 * 2-step checkout: Step 1 = Cart Review, Step 2 = Order Confirmation
 */

import { useState, useCallback } from "react";
import type { CheckoutStep, CartItemData, CheckoutState, OrderSummary } from "@/types/checkout";
import { getCart, updateCartItem, removeCartItem, clearCart } from "@/services/cart";
import { getWalletBalance } from "@/services/wallet";
import { checkoutMultiVendor } from "@/services/orders";
import { useAuth } from "@/contexts/AuthContext";

export function useCheckoutFlow() {
  const { user } = useAuth();
  const [state, setState] = useState<CheckoutState>({
    currentStep: 1,
    cartItems: [],
    orderSummary: null,
    walletBalance: 0,
    isLoading: false,
    isSubmitting: false,
    error: null,
    orderIds: [],
  });

  // ── Helpers ────────────────────────────────────────────────────
  const extractVendorId = useCallback(
    (item: CartItemData): string => item.vendor_id || "",
    []
  );

  const setCurrentStep = useCallback((step: CheckoutStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  // ── Cart Operations ────────────────────────────────────────────
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
    } catch (err: unknown) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Gagal memuat keranjang",
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
      } catch (err: unknown) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : "Gagal update jumlah",
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
      } catch (err: unknown) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : "Gagal hapus item",
          isLoading: false,
        }));
      }
    },
    [loadCartItems]
  );

  const clearAllItems = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await clearCart();
      await loadCartItems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengosongkan keranjang";
      setState((prev) => ({ ...prev, error: msg, isLoading: false }));
      throw err;
    }
  }, [loadCartItems]);

  // ── Wallet ─────────────────────────────────────────────────────
  const loadWalletBalance = useCallback(async () => {
    if (!user) return;
    try {
      const balanceData = await getWalletBalance();
      setState((prev) => ({
        ...prev,
        walletBalance: Number(balanceData.wallet_available || 0),
      }));
    } catch {
      // Balance loading failure shouldn't block checkout
    }
  }, [user]);

  // ── Order Summary ──────────────────────────────────────────────
  const getOrderSummary = useCallback((): OrderSummary => {
    const cartTotal = state.cartItems.reduce((sum, item) => sum + Number(item.subtotal), 0);

    const groupedByVendor: { [key: string]: CartItemData[] } = {};
    state.cartItems.forEach((item) => {
      const vendorId = extractVendorId(item);
      if (!vendorId) return;
      if (!groupedByVendor[vendorId]) groupedByVendor[vendorId] = [];
      groupedByVendor[vendorId].push(item);
    });

    return { cart_total: cartTotal, items: state.cartItems, grouped_by_vendor: groupedByVendor };
  }, [state.cartItems, extractVendorId]);

  // ── Validation ─────────────────────────────────────────────────
  const canProceedToNextStep = useCallback((): boolean => {
    switch (state.currentStep) {
      case 1: // Cart Review — must have items and enough balance
        return (
          state.cartItems.length > 0 &&
          state.walletBalance >=
            state.cartItems.reduce((sum, item) => sum + Number(item.subtotal), 0)
        );
      case 2: // Order Confirmation
        return state.cartItems.length > 0;
      default:
        return false;
    }
  }, [state.currentStep, state.cartItems, state.walletBalance]);

  const validateCurrentStep = useCallback((): boolean => {
    return state.cartItems.length > 0;
  }, [state.cartItems]);

  // ── Order Submission ───────────────────────────────────────────
  /**
   * Creates one order per vendor group. Returns ALL created order IDs.
   * Cart is cleared after all orders are successfully created.
   */
  const submitOrder = useCallback(async (): Promise<string[]> => {
    if (!user) throw new Error("Anda harus login untuk melanjutkan");
    if (state.cartItems.length === 0) throw new Error("Keranjang kosong");

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const cartItemIds = state.cartItems.map((item) => item.id);
      const voucherAmount = state.cartItems.reduce((sum, item) => sum + Number(item.subtotal), 0);

      // Simple hash to keep key length reasonable while guaranteeing uniqueness per checkout state
      const rawKey = cartItemIds.sort().join("|");
      const shortHash = Array.from(rawKey).reduce((hash, char) => 0 | (31 * hash + char.charCodeAt(0)), 0).toString(36);
      const idempotencyKey = `checkout-multi-${shortHash}-${cartItemIds.length}-${Date.now()}`;

      const result = await checkoutMultiVendor(
        {
          cart_item_ids: cartItemIds,
          voucher_amount: voucherAmount,
        },
        { idempotencyKey }
      );

      const createdIds = result.orders.map((order) => order.id);

      // Clear local cart state manually since backend cleared it
      setState((prev) => ({
        ...prev,
        cartItems: [],
        orderIds: createdIds,
        isSubmitting: false,
      }));

      return createdIds;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Gagal membuat pesanan";
      setState((prev) => ({ ...prev, error: errorMsg, isSubmitting: false }));
      throw err;
    }
  }, [user, state.cartItems]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    extractVendorId,
    setCurrentStep,
    loadCartItems,
    updateQty,
    removeItem,
    clearAllItems,
    loadWalletBalance,
    getOrderSummary,
    submitOrder,
    canProceedToNextStep,
    validateCurrentStep,
    clearError,
  };
}
