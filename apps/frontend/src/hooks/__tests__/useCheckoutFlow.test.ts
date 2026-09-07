import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCheckoutFlow } from "../useCheckoutFlow";
import * as cartService from "@/services/cart";

// Mock dependencies
vi.mock("@/services/cart", () => ({
  getCart: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
  clearCart: vi.fn(),
}));

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } })
    }
  },
}));

// Mock AuthContext hook entirely
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "ben_123", role: "beneficiary" },
    session: { access_token: "token123" }
  }),
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe("useCheckoutFlow Hook", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should initialize with loading states", async () => {
    const { result } = renderHook(() => useCheckoutFlow());

    // Initially not loading because we haven't called loadCartItems yet
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });

  it("should fetch cart data and validate stock on load", async () => {
    const mockCart = { items: [{ product_id: "p1", quantity: 1, is_eligible: true, subtotal: 50000 }] };

    vi.mocked(cartService.getCart).mockResolvedValueOnce(mockCart as any);

    const { result } = renderHook(() => useCheckoutFlow());

    // Trigger loadCartItems manually (the component handles the useEffect)
    await act(async () => {
      await result.current.loadCartItems();
    });

    expect(cartService.getCart).toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.cartItems.length).toBe(1);
  });
});
