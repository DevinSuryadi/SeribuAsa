import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as walletService from "../wallet";
import { apiFetch } from "../api";

// Mock the apiFetch function
vi.mock("../api", () => ({
  apiFetch: vi.fn(),
  API_BASE_URL: "http://localhost:8000/api/v1",
}));

describe("Wallet Service Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getWalletBalance", () => {
    it("should retrieve wallet balance successfully", async () => {
      const mockBalance = {
        wallet_balance: 500000,
        wallet_held: 100000,
        wallet_available: 400000,
        expiring_soon: 50000,
        earliest_expiry: "2024-04-01T00:00:00Z",
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockBalance);

      const result = await walletService.getWalletBalance();

      expect(apiFetch).toHaveBeenCalledWith("/wallet/balance");
      expect(result.wallet_balance).toBe(500000);
      expect(result.wallet_available).toBe(400000);
      expect(result.wallet_held).toBe(100000);
    });

    it("should handle empty wallet", async () => {
      const mockBalance = {
        wallet_balance: 0,
        wallet_held: 0,
        wallet_available: 0,
        expiring_soon: 0,
        earliest_expiry: null,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockBalance);

      const result = await walletService.getWalletBalance();

      expect(result.wallet_available).toBe(0);
    });

    it("should handle API error", async () => {
      const errorMessage = "Failed to fetch wallet balance";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(walletService.getWalletBalance()).rejects.toThrow(errorMessage);
    });
  });

  describe("getWalletTransactions", () => {
    it("should retrieve transaction history", async () => {
      const mockResponse = {
        items: [
          {
            id: "tx_1",
            transaction_type: "credit",
            amount: 200000,
            balance_after: 500000,
            description: "Donation allocation",
            created_at: "2024-01-01T00:00:00Z",
          },
          {
            id: "tx_2",
            transaction_type: "hold",
            amount: 100000,
            balance_after: 400000,
            description: "Order #12345",
            created_at: "2024-01-02T00:00:00Z",
          },
        ],
        total: 2,
        page: 1,
        page_size: 20,
        total_pages: 1,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockResponse);

      const result = await walletService.getWalletTransactions();

      expect(apiFetch).toHaveBeenCalledWith("/wallet/transactions");
      expect(result.items).toHaveLength(2);
      expect(result.items[0].transaction_type).toBe("credit");
    });
  });

  describe("getWalletAllocations", () => {
    it("should retrieve wallet allocations", async () => {
      const mockResponse = {
        items: [
          {
            id: "alloc_1",
            donation_id: "don_1",
            original_amount: 200000,
            remaining_amount: 150000,
            allocated_at: "2024-01-01T00:00:00Z",
            expires_at: "2024-04-01T00:00:00Z",
            status: "active",
            is_expired: false,
            days_until_expiry: 45,
          },
        ],
        total: 1,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockResponse);

      const result = await walletService.getWalletAllocations();

      expect(apiFetch).toHaveBeenCalledWith("/wallet/allocations");
      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe("active");
    });
  });

  describe("cancelOrder", () => {
    it("should cancel order successfully", async () => {
      const mockResponse = { success: true, message: "Order cancelled" };
      vi.mocked(apiFetch).mockResolvedValueOnce(mockResponse);

      const result = await walletService.cancelOrder("order_1");

      expect(apiFetch).toHaveBeenCalledWith(
        "/orders/order_1/cancel",
        expect.objectContaining({
          method: "POST",
        })
      );
      expect((result as any).success).toBe(true);
    });
  });
});
