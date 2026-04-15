import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as orderService from "../orders";
import { apiFetch } from "../api";

// Mock the apiFetch function
vi.mock("../api", () => ({
  apiFetch: vi.fn(),
  API_BASE_URL: "http://localhost:8000/api/v1",
}));

describe("Order Service Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createOrder", () => {
    it("should create order successfully without vouchers", async () => {
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
        discount_amount: 0,
        final_amount: 100000,
        status: "pending",
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

      expect(apiFetch).toHaveBeenCalledWith("/orders/", {
        method: "POST",
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
      });

      expect(result.id).toBe("order_1");
      expect(result.status).toBe("pending");
      expect(result.total_amount).toBe(100000);
    });

    it("should create order with single voucher redemption", async () => {
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
        discount_amount: 50000,
        final_amount: 50000,
        status: "pending",
        voucher_codes: ["VOUCHER001"],
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
        voucher_codes: ["VOUCHER001"],
      });

      expect(result.discount_amount).toBe(50000);
      expect(result.final_amount).toBe(50000);
      expect(result.voucher_codes).toContain("VOUCHER001");
    });

    it("should create order with multiple vouchers", async () => {
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
        discount_amount: 80000,
        final_amount: 20000,
        status: "pending",
        voucher_codes: ["VOUCHER001", "VOUCHER002"],
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
        voucher_codes: ["VOUCHER001", "VOUCHER002"],
      });

      expect(result.voucher_codes).toHaveLength(2);
      expect(result.discount_amount).toBe(80000);
    });

    it("should create order with notes", async () => {
      const mockOrder = {
        id: "order_1",
        vendor_id: "vendor_1",
        beneficiary_id: "ben_1",
        items: [],
        total_amount: 0,
        discount_amount: 0,
        final_amount: 0,
        status: "pending",
        notes: "Please pack carefully",
        created_at: "2024-01-01T00:00:00Z",
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockOrder);

      const result = await orderService.createOrder({
        vendor_id: "vendor_1",
        items: [],
        notes: "Please pack carefully",
      });

      expect(result.notes).toBe("Please pack carefully");
    });

    it("should handle invalid vendor ID", async () => {
      const errorMessage = "Vendor not found";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(
        orderService.createOrder({
          vendor_id: "invalid_vendor",
          items: [
            {
              product_id: "prod_1",
              quantity: 2,
              price: 50000,
            },
          ],
        })
      ).rejects.toThrow(errorMessage);
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

    it("should handle insufficient stock", async () => {
      const errorMessage = "Product out of stock";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(
        orderService.createOrder({
          vendor_id: "vendor_1",
          items: [
            {
              product_id: "prod_1",
              quantity: 9999,
              price: 50000,
            },
          ],
        })
      ).rejects.toThrow(errorMessage);
    });

    it("should handle insufficient voucher balance", async () => {
      const errorMessage = "Insufficient voucher balance";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(
        orderService.createOrder({
          vendor_id: "vendor_1",
          items: [
            {
              product_id: "prod_1",
              quantity: 2,
              price: 50000,
            },
          ],
          voucher_codes: ["VOUCHER001"],
        })
      ).rejects.toThrow(errorMessage);
    });

    it("should handle invalid voucher code", async () => {
      const errorMessage = "Invalid voucher code";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(
        orderService.createOrder({
          vendor_id: "vendor_1",
          items: [
            {
              product_id: "prod_1",
              quantity: 2,
              price: 50000,
            },
          ],
          voucher_codes: ["INVALID_CODE"],
        })
      ).rejects.toThrow(errorMessage);
    });
  });

  describe("getOrders", () => {
    it("should retrieve all orders successfully", async () => {
      const mockResponse = {
        items: [
          {
            id: "order_1",
            status: "pending",
            total_amount: 100000,
            created_at: "2024-01-01T00:00:00Z",
          },
          {
            id: "order_2",
            status: "completed",
            total_amount: 75000,
            created_at: "2024-01-02T00:00:00Z",
          },
        ],
        total: 2,
        page: 1,
        page_size: 20,
        total_pages: 1,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockResponse);

      const result = await orderService.getOrders();

      expect(apiFetch).toHaveBeenCalledWith("/orders/");
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should filter orders by status", async () => {
      const mockResponse = {
        items: [
          {
            id: "order_1",
            status: "pending",
            total_amount: 100000,
            created_at: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        page_size: 20,
        total_pages: 1,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockResponse);

      const result = await orderService.getOrders({
        status: "pending",
      });

      expect(apiFetch).toHaveBeenCalledWith("/orders/?status=pending");
      expect(result.items).toHaveLength(1);
    });

    it("should support pagination", async () => {
      const mockResponse = {
        items: [],
        total: 50,
        page: 2,
        page_size: 20,
        total_pages: 3,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockResponse);

      const result = await orderService.getOrders({
        page: 2,
        page_size: 20,
      });

      expect(result.page).toBe(2);
      expect(result.page_size).toBe(20);
      expect(result.total_pages).toBe(3);
    });

    it("should handle combination of filters and pagination", async () => {
      const mockResponse = {
        items: [
          {
            id: "order_3",
            status: "completed",
            total_amount: 50000,
            created_at: "2024-01-03T00:00:00Z",
          },
        ],
        total: 15,
        page: 1,
        page_size: 10,
        total_pages: 2,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockResponse);

      const result = await orderService.getOrders({
        page: 1,
        page_size: 10,
        status: "completed",
      });

      expect(result.items).toHaveLength(1);
      expect(result.total_pages).toBe(2);
    });

    it("should return empty list when no orders", async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 1,
        page_size: 20,
        total_pages: 0,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockResponse);

      const result = await orderService.getOrders();

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("should handle unauthorized error", async () => {
      const errorMessage = "Unauthorized";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(orderService.getOrders()).rejects.toThrow(errorMessage);
    });
  });

  describe("getOrder", () => {
    it("should retrieve order detail successfully", async () => {
      const mockOrder = {
        id: "order_1",
        vendor_id: "vendor_1",
        beneficiary_id: "ben_1",
        items: [
          {
            id: "item_1",
            product_id: "prod_1",
            quantity: 2,
            price: 50000,
            subtotal: 100000,
            product_name: "Rice 5kg",
          },
        ],
        total_amount: 100000,
        discount_amount: 0,
        final_amount: 100000,
        status: "pending",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockOrder);

      const result = await orderService.getOrder("order_1");

      expect(apiFetch).toHaveBeenCalledWith("/orders/order_1");
      expect(result.id).toBe("order_1");
      expect(result.items).toHaveLength(1);
    });

    it("should show order with voucher discount", async () => {
      const mockOrder = {
        id: "order_1",
        vendor_id: "vendor_1",
        beneficiary_id: "ben_1",
        items: [
          {
            id: "item_1",
            product_id: "prod_1",
            quantity: 2,
            price: 50000,
            subtotal: 100000,
            product_name: "Rice 5kg",
          },
        ],
        total_amount: 100000,
        discount_amount: 50000,
        final_amount: 50000,
        status: "pending",
        voucher_codes: ["VOUCHER001"],
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockOrder);

      const result = await orderService.getOrder("order_1");

      expect(result.discount_amount).toBe(50000);
      expect(result.final_amount).toBe(50000);
      expect(result.voucher_codes).toContain("VOUCHER001");
    });

    it("should handle order not found", async () => {
      const errorMessage = "Order not found";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(orderService.getOrder("invalid_order")).rejects.toThrow(errorMessage);
    });

    it("should handle unauthorized access to order", async () => {
      const errorMessage = "Not authorized to view this order";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(orderService.getOrder("order_1")).rejects.toThrow(errorMessage);
    });
  });

  describe("updateOrderStatus", () => {
    it("should update order status to completed", async () => {
      const mockOrder = {
        id: "order_1",
        vendor_id: "vendor_1",
        beneficiary_id: "ben_1",
        items: [],
        total_amount: 100000,
        status: "completed",
        updated_at: "2024-01-02T00:00:00Z",
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockOrder);

      const result = await orderService.updateOrderStatus("order_1", "completed");

      expect(apiFetch).toHaveBeenCalledWith("/orders/order_1/status", {
        method: "PUT",
        body: JSON.stringify({ status: "completed" }),
      });

      expect(result.status).toBe("completed");
    });

    it("should cancel order", async () => {
      const mockOrder = {
        id: "order_1",
        vendor_id: "vendor_1",
        beneficiary_id: "ben_1",
        items: [],
        total_amount: 100000,
        status: "cancelled",
        updated_at: "2024-01-02T00:00:00Z",
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockOrder);

      const result = await orderService.updateOrderStatus("order_1", "cancelled");

      expect(result.status).toBe("cancelled");
    });

    it("should handle order not found", async () => {
      const errorMessage = "Order not found";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(orderService.updateOrderStatus("invalid_order", "completed")).rejects.toThrow(
        errorMessage
      );
    });

    it("should prevent unauthorized status updates", async () => {
      const errorMessage = "Not authorized to update this order";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(orderService.updateOrderStatus("order_1", "completed")).rejects.toThrow(
        errorMessage
      );
    });

    it("should prevent invalid status transitions", async () => {
      const errorMessage = "Cannot transition from completed to pending";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(orderService.updateOrderStatus("order_1", "completed")).rejects.toThrow(
        errorMessage
      );
    });

    it("should handle already completed order", async () => {
      const errorMessage = "Order is already completed";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(orderService.updateOrderStatus("order_1", "completed")).rejects.toThrow(
        errorMessage
      );
    });
  });

  describe("API Endpoint Coverage", () => {
    it("should make correct API call to POST /orders/", async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce({
        id: "order_1",
        status: "pending",
      });

      await orderService.createOrder({
        vendor_id: "vendor_1",
        items: [
          {
            product_id: "prod_1",
            quantity: 1,
            price: 50000,
          },
        ],
      });

      expect(apiFetch).toHaveBeenCalledWith("/orders/", expect.any(Object));
    });

    it("should make correct API call to GET /orders/", async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce({
        items: [],
        total: 0,
        page: 1,
        page_size: 20,
        total_pages: 0,
      });

      await orderService.getOrders();

      expect(apiFetch).toHaveBeenCalledWith("/orders/");
    });

    it("should make correct API call to GET /orders/{id}", async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce({
        id: "order_1",
        status: "pending",
      });

      await orderService.getOrder("order_1");

      expect(apiFetch).toHaveBeenCalledWith("/orders/order_1");
    });

    it("should make correct API call to PUT /orders/{id}/status", async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce({
        id: "order_1",
        status: "completed",
      });

      await orderService.updateOrderStatus("order_1", "completed");

      expect(apiFetch).toHaveBeenCalledWith("/orders/order_1/status", expect.any(Object));
    });
  });
});
