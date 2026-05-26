import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { useCheckoutFlow } from "../useCheckoutFlow";
import * as cartService from "@/services/cart";
import * as ordersService from "@/services/orders";
import * as apiService from "@/services/api";
import { AuthContext } from "@/contexts/AuthContext";

// Mock dependencies
vi.mock("@/services/cart", () => ({
  getCart: vi.fn(),
  getCartSummary: vi.fn(),
  validateStockForCheckout: vi.fn(),
  clearCart: vi.fn(),
}));

// Mock AuthContext hook entirely
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "ben_123", role: "beneficiary" },
    session: { access_token: "token123" }
  }),
}));

// Mock dependencies
vi.mock("@/services/cart", () => ({
  getCart: vi.fn(),
  getCartSummary: vi.fn(),
  validateStockForCheckout: vi.fn(),
  clearCart: vi.fn(),
}));

vi.mock("@/services/orders", () => ({
  createOrder: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  apiFetch: vi.fn(),
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

describe("useCheckoutFlow Hook", () => {
  const mockBeneficiaryId = "ben_123";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should initialize with loading states", async () => {
    // Return empty cart
    vi.mocked(cartService.getCart).mockResolvedValueOnce([]);
    vi.mocked(cartService.getCartSummary).mockResolvedValueOnce({
      total_items: 0,
      items: [],
      total_amount: 0,
      eligible_amount: 0,
      ineligible_amount: 0,
    });

    const { result } = renderHook(() => useCheckoutFlow(mockBeneficiaryId));

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isCheckingOut).toBe(false);
  });

  it("should fetch cart data and validate stock on load", async () => {
    const mockCart = [{ product_id: "p1", quantity: 1 }];
    const mockSummary = {
      total_items: 1,
      items: mockCart,
      total_amount: 50000,
      eligible_amount: 50000,
      ineligible_amount: 0,
    };

    vi.mocked(cartService.getCart).mockResolvedValueOnce(mockCart as any);
    vi.mocked(cartService.getCartSummary).mockResolvedValueOnce(mockSummary as any);
    vi.mocked(cartService.validateStockForCheckout).mockResolvedValueOnce({
      all_in_stock: true,
      unavailable_products: [],
      low_stock_products: [],
    });

    // We also fetch wallet balance internally via apiFetch
    vi.mocked(apiService.apiFetch).mockResolvedValueOnce({
      wallet_available: 100000,
      wallet_balance: 100000,
      wallet_held: 0,
    });

    const { result } = renderHook(() => useCheckoutFlow(mockBeneficiaryId));

    // Wait for internal async operations
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(cartService.getCartSummary).toHaveBeenCalledWith(mockBeneficiaryId);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.cartSummary).toEqual(mockSummary);
  });
});
