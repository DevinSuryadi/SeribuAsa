import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as cartService from "../cart";
import { apiFetch } from "../api";

// Mock the apiFetch function
vi.mock("../api", () => ({
  apiFetch: vi.fn(),
  API_BASE_URL: "http://localhost:8000/api/v1",
}));

describe("Cart Service Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("addToCart", () => {
    it("should successfully add item to cart", async () => {
      const mockResponse = {
        id: "cart_item_1",
        product_id: "prod_1",
        quantity: 2,
        price: 50000,
        total: 100000,
        created_at: "2024-01-01T00:00:00Z",
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockResponse);

      const result = await cartService.addToCart({
        product_id: "prod_1",
        quantity: 2,
      });

      expect(apiFetch).toHaveBeenCalledWith("/cart/items", {
        method: "POST",
        body: JSON.stringify({
          product_id: "prod_1",
          quantity: 2,
        }),
      });

      expect(result).toEqual(mockResponse);
      expect(result.product_id).toBe("prod_1");
      expect(result.quantity).toBe(2);
    });

    it("should handle error when adding invalid product", async () => {
      const errorMessage = "Product not found";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(
        cartService.addToCart({
          product_id: "invalid_prod",
          quantity: 1,
        })
      ).rejects.toThrow(errorMessage);

      expect(apiFetch).toHaveBeenCalled();
    });

    it("should handle error when quantity is invalid", async () => {
      const errorMessage = "Invalid quantity";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(
        cartService.addToCart({
          product_id: "prod_1",
          quantity: -1,
        })
      ).rejects.toThrow(errorMessage);
    });

    it("should handle stock unavailable error", async () => {
      const errorMessage = "Insufficient stock";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(
        cartService.addToCart({
          product_id: "prod_1",
          quantity: 9999,
        })
      ).rejects.toThrow(errorMessage);
    });
  });

  describe("getCart", () => {
    it("should retrieve cart successfully", async () => {
      const mockCart = {
        beneficiary_id: "ben_1",
        items: [
          {
            id: "cart_item_1",
            product_id: "prod_1",
            quantity: 2,
            price: 50000,
          },
          {
            id: "cart_item_2",
            product_id: "prod_2",
            quantity: 1,
            price: 75000,
          },
        ],
        total_items: 2,
        total_amount: 175000,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockCart);

      const result = await cartService.getCart();

      expect(apiFetch).toHaveBeenCalledWith("/cart");
      expect(result.items).toHaveLength(2);
      expect(result.total_amount).toBe(175000);
    });

    it("should return empty cart when no items", async () => {
      const emptyCart = {
        beneficiary_id: "ben_1",
        items: [],
        total_items: 0,
        total_amount: 0,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(emptyCart);

      const result = await cartService.getCart();

      expect(result.items).toHaveLength(0);
      expect(result.total_amount).toBe(0);
    });

    it("should handle unauthorized error", async () => {
      const errorMessage = "Unauthorized";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(cartService.getCart()).rejects.toThrow(errorMessage);
    });
  });

  describe("getCartSummary", () => {
    it("should retrieve cart summary successfully", async () => {
      const mockSummary = {
        beneficiary_id: "ben_1",
        items: [
          {
            id: "cart_item_1",
            product_id: "prod_1",
            quantity: 2,
            price: 50000,
          },
        ],
        total_items: 1,
        total_amount: 100000,
        eligible_amount: 75000,
        ineligible_amount: 25000,
        voucher_balance: 50000,
        max_voucher_applicable: 50000,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockSummary);

      const result = await cartService.getCartSummary();

      expect(apiFetch).toHaveBeenCalledWith("/cart/summary");
      expect(result.total_amount).toBe(100000);
      expect(result.eligible_amount).toBe(75000);
      expect(result.ineligible_amount).toBe(25000);
    });

    it("should show correct voucher eligibility breakdown", async () => {
      const mockSummary = {
        beneficiary_id: "ben_1",
        items: [],
        total_items: 0,
        total_amount: 0,
        eligible_amount: 0,
        ineligible_amount: 0,
        voucher_balance: 100000,
        max_voucher_applicable: 0,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockSummary);

      const result = await cartService.getCartSummary();

      expect(result.max_voucher_applicable).toBe(
        Math.min(result.eligible_amount, result.voucher_balance)
      );
    });
  });

  describe("updateCartItem", () => {
    it("should update cart item quantity successfully", async () => {
      const mockResponse = {
        id: "cart_item_1",
        product_id: "prod_1",
        quantity: 5,
        price: 50000,
        total: 250000,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockResponse);

      const result = await cartService.updateCartItem("cart_item_1", {
        quantity: 5,
      });

      expect(apiFetch).toHaveBeenCalledWith("/cart/items/cart_item_1", {
        method: "PUT",
        body: JSON.stringify({ quantity: 5 }),
      });

      expect(result.quantity).toBe(5);
    });

    it("should handle invalid item ID", async () => {
      const errorMessage = "Cart item not found";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(cartService.updateCartItem("invalid_id", { quantity: 5 })).rejects.toThrow(
        errorMessage
      );
    });

    it("should handle zero or negative quantity", async () => {
      const errorMessage = "Quantity must be greater than 0";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(cartService.updateCartItem("cart_item_1", { quantity: 0 })).rejects.toThrow(
        errorMessage
      );
    });

    it("should handle quantity exceeding stock", async () => {
      const errorMessage = "Quantity exceeds available stock";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(cartService.updateCartItem("cart_item_1", { quantity: 10000 })).rejects.toThrow(
        errorMessage
      );
    });
  });

  describe("removeCartItem", () => {
    it("should remove cart item successfully", async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce(null);

      await cartService.removeCartItem("cart_item_1");

      expect(apiFetch).toHaveBeenCalledWith("/cart/items/cart_item_1", {
        method: "DELETE",
      });
    });

    it("should handle item not found error", async () => {
      const errorMessage = "Cart item not found";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(cartService.removeCartItem("invalid_id")).rejects.toThrow(errorMessage);
    });

    it("should handle unauthorized removal", async () => {
      const errorMessage = "Not authorized to remove this item";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(cartService.removeCartItem("cart_item_1")).rejects.toThrow(errorMessage);
    });
  });

  describe("clearCart", () => {
    it("should clear entire cart successfully", async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce(null);

      await cartService.clearCart();

      expect(apiFetch).toHaveBeenCalledWith("/cart/clear", {
        method: "DELETE",
      });
    });

    it("should handle clear cart error", async () => {
      const errorMessage = "Failed to clear cart";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(cartService.clearCart()).rejects.toThrow(errorMessage);
    });
  });

  describe("validateStockForCheckout", () => {
    it("should validate stock for multiple products", async () => {
      const mockResponse = {
        all_in_stock: true,
        unavailable_products: [],
        low_stock_products: [],
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockResponse);

      const result = await cartService.validateStockForCheckout(["prod_1", "prod_2"]);

      expect(apiFetch).toHaveBeenCalledWith("/cart/validate-stock", {
        method: "POST",
        body: JSON.stringify({ product_ids: ["prod_1", "prod_2"] }),
      });

      expect(result.all_in_stock).toBe(true);
    });

    it("should identify unavailable products", async () => {
      const mockResponse = {
        all_in_stock: false,
        unavailable_products: ["prod_3"],
        low_stock_products: ["prod_2"],
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockResponse);

      const result = await cartService.validateStockForCheckout(["prod_1", "prod_2", "prod_3"]);

      expect(result.all_in_stock).toBe(false);
      expect(result.unavailable_products).toContain("prod_3");
      expect(result.low_stock_products).toContain("prod_2");
    });

    it("should handle empty product list", async () => {
      const mockResponse = {
        all_in_stock: true,
        unavailable_products: [],
        low_stock_products: [],
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockResponse);

      const result = await cartService.validateStockForCheckout([]);

      expect(result.all_in_stock).toBe(true);
    });
  });
});
