import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as orderService from "../orders";
import { apiFetch } from "../api";

// Mock the apiFetch function
vi.mock("../api", () => ({
  apiFetch: vi.fn(),
  API_BASE_URL: "http://localhost:8000/api/v1",
}));

describe("Order Service Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createOrder", () => {
    it("should create order successfully with wallet payment", async () => {
      const mockOrder = {
        id: "order_1",
        vendor_id: "vendor_1",
        beneficiary_id: "ben_1",
        items: [
          {
            product_id: "prod_1",
            quantity: 2,
            price: 50000,
            subtotal: 100000,
          },
        ],
        total_amount: 100000,
        voucher_used: 100000,
        cash_paid: 0,
        status: "pending",
        pickup_qr_code: "ABC123XYZ",
        created_at: "2024-01-01T00:00:00Z",
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockOrder);

      const result = await orderService.createOrder({
        vendor_id: "vendor_1",
        items: [
          {
            product_id: "prod_1",
            quantity: 2,
            price: 50000,
          },
        ],
      });

      expect(apiFetch).toHaveBeenCalledWith(
        "/orders/",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Idempotency-Key": expect.any(String),
          }),
          body: JSON.stringify({
            vendor_id: "vendor_1",
            items: [
              {
                product_id: "prod_1",
                quantity: 2,
                price: 50000,
              },
            ],
          }),
        })
      );

      expect(result.id).toBe("order_1");
      expect(result.status).toBe("pending");
      expect(result.total_amount).toBe(100000);
      expect(result.pickup_qr_code).toBe("ABC123XYZ");
    });

    it("should handle empty items", async () => {
      const errorMessage = "Order must contain at least one item";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(
        orderService.createOrder({
          vendor_id: "vendor_1",
          items: [],
        })
      ).rejects.toThrow(errorMessage);
    });

    it("should handle insufficient wallet balance", async () => {
      const errorMessage = "Insufficient wallet balance";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(
        orderService.createOrder({
          vendor_id: "vendor_1",
          items: [
            {
              product_id: "prod_1",
              quantity: 10,
              price: 50000,
            },
          ],
        })
      ).rejects.toThrow(errorMessage);
    });
  });

  describe("getOrders", () => {
    it("should retrieve order list", async () => {
      const mockResponse = {
        items: [
          {
            id: "order_1",
            vendor_id: "vendor_1",
            total_amount: 100000,
            status: "pending",
            created_at: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        page_size: 10,
        total_pages: 1,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockResponse);

      const result = await orderService.getOrders();

      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].status).toBe("pending");
    });
  });

});
