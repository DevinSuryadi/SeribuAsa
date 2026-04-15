import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as voucherService from "../vouchers";
import { apiFetch } from "../api";

// Mock the apiFetch function
vi.mock("../api", () => ({
  apiFetch: vi.fn(),
  API_BASE_URL: "http://localhost:8000/api/v1",
}));

describe("Voucher Service Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getVoucherBalance", () => {
    it("should retrieve voucher balance successfully", async () => {
      const mockBalance = {
        beneficiary_id: "ben_1",
        total_balance: 250000,
        active_vouchers: [
          {
            id: "voucher_1",
            code: "VOUCHER001",
            balance: 100000,
            expiry_date: "2024-12-31",
          },
          {
            id: "voucher_2",
            code: "VOUCHER002",
            balance: 150000,
            expiry_date: "2025-06-30",
          },
        ],
        expiring_soon: [],
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockBalance);

      const result = await voucherService.getVoucherBalance("ben_1");

      expect(apiFetch).toHaveBeenCalledWith("/vouchers/balance/ben_1");
      expect(result.total_balance).toBe(250000);
      expect(result.active_vouchers).toHaveLength(2);
    });

    it("should show expiring soon vouchers", async () => {
      const mockBalance = {
        beneficiary_id: "ben_1",
        total_balance: 50000,
        active_vouchers: [
          {
            id: "voucher_1",
            code: "VOUCHER001",
            balance: 50000,
            expiry_date: "2024-01-15",
          },
        ],
        expiring_soon: [
          {
            id: "voucher_1",
            code: "VOUCHER001",
            balance: 50000,
            expiry_date: "2024-01-15",
            days_until_expiry: 3,
          },
        ],
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockBalance);

      const result = await voucherService.getVoucherBalance("ben_1");

      expect(result.expiring_soon).toHaveLength(1);
    });

    it("should handle beneficiary not found", async () => {
      const errorMessage = "Beneficiary not found";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(voucherService.getVoucherBalance("invalid_ben")).rejects.toThrow(errorMessage);
    });

    it("should return zero balance for new beneficiary", async () => {
      const mockBalance = {
        beneficiary_id: "ben_new",
        total_balance: 0,
        active_vouchers: [],
        expiring_soon: [],
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockBalance);

      const result = await voucherService.getVoucherBalance("ben_new");

      expect(result.total_balance).toBe(0);
      expect(result.active_vouchers).toHaveLength(0);
    });
  });

  describe("getVoucherHistory", () => {
    it("should retrieve voucher history successfully", async () => {
      const mockHistory = {
        items: [
          {
            id: "txn_1",
            voucher_id: "voucher_1",
            type: "allocation",
            amount: 100000,
            created_at: "2024-01-01T00:00:00Z",
          },
          {
            id: "txn_2",
            voucher_id: "voucher_1",
            type: "redeemed",
            amount: 50000,
            created_at: "2024-01-05T00:00:00Z",
          },
        ],
        total: 2,
        page: 1,
        page_size: 10,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockHistory);

      const result = await voucherService.getVoucherHistory("ben_1");

      expect(apiFetch).toHaveBeenCalledWith("/vouchers/history?beneficiary_id=ben_1");
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should handle pagination", async () => {
      const mockHistory = {
        items: [],
        total: 0,
        page: 2,
        page_size: 10,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockHistory);

      const result = await voucherService.getVoucherHistory("ben_1");

      expect(result.page).toBe(2);
    });

    it("should handle empty history", async () => {
      const mockHistory = {
        items: [],
        total: 0,
        page: 1,
        page_size: 10,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockHistory);

      const result = await voucherService.getVoucherHistory("ben_1");

      expect(result.items).toHaveLength(0);
    });
  });

  describe("validateVoucher", () => {
    it("should validate voucher successfully", async () => {
      const mockValidation = {
        valid: true,
        voucher_id: "voucher_1",
        code: "VOUCHER001",
        remaining_balance: 75000,
        can_redeem: true,
        reason: null,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockValidation);

      const result = await voucherService.validateVoucher({
        code: "VOUCHER001",
        amount: 25000,
      });

      expect(apiFetch).toHaveBeenCalledWith("/vouchers/validate", {
        method: "POST",
        body: JSON.stringify({ code: "VOUCHER001", amount: 25000 }),
      });

      expect(result.valid).toBe(true);
      expect(result.can_redeem).toBe(true);
    });

    it("should reject invalid voucher code", async () => {
      const mockValidation = {
        valid: false,
        voucher_id: null,
        code: "INVALID001",
        remaining_balance: 0,
        can_redeem: false,
        reason: "Voucher code not found",
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockValidation);

      const result = await voucherService.validateVoucher({
        code: "INVALID001",
        amount: 25000,
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Voucher code not found");
    });

    it("should reject expired voucher", async () => {
      const mockValidation = {
        valid: false,
        voucher_id: "voucher_1",
        code: "VOUCHER001",
        remaining_balance: 0,
        can_redeem: false,
        reason: "Voucher has expired",
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockValidation);

      const result = await voucherService.validateVoucher({
        code: "VOUCHER001",
        amount: 25000,
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toContain("expired");
    });

    it("should reject when amount exceeds balance", async () => {
      const mockValidation = {
        valid: true,
        voucher_id: "voucher_1",
        code: "VOUCHER001",
        remaining_balance: 10000,
        can_redeem: false,
        reason: "Amount exceeds voucher balance",
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockValidation);

      const result = await voucherService.validateVoucher({
        code: "VOUCHER001",
        amount: 50000,
      });

      expect(result.can_redeem).toBe(false);
      expect(result.reason).toContain("exceeds");
    });

    it("should reject when amount is zero", async () => {
      const mockValidation = {
        valid: false,
        voucher_id: null,
        code: "VOUCHER001",
        remaining_balance: 0,
        can_redeem: false,
        reason: "Amount must be greater than 0",
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockValidation);

      const result = await voucherService.validateVoucher({
        code: "VOUCHER001",
        amount: 0,
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("redeemVoucher", () => {
    it("should redeem voucher successfully", async () => {
      const mockRedemption = {
        success: true,
        order_id: "order_1",
        redeemed_amount: 50000,
        new_balance: 100000,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockRedemption);

      const result = await voucherService.redeemVoucher({
        voucher_codes: ["VOUCHER001"],
        amount: 50000,
        order_id: "order_1",
      });

      expect(apiFetch).toHaveBeenCalledWith("/vouchers/redeem", {
        method: "POST",
        body: JSON.stringify({
          voucher_codes: ["VOUCHER001"],
          amount: 50000,
          order_id: "order_1",
        }),
      });

      expect(result.success).toBe(true);
      expect(result.redeemed_amount).toBe(50000);
    });

    it("should redeem multiple vouchers", async () => {
      const mockRedemption = {
        success: true,
        order_id: "order_1",
        redeemed_amount: 150000,
        new_balance: 0,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockRedemption);

      const result = await voucherService.redeemVoucher({
        voucher_codes: ["VOUCHER001", "VOUCHER002"],
        amount: 150000,
        order_id: "order_1",
      });

      expect(result.redeemed_amount).toBe(150000);
    });

    it("should handle insufficient balance", async () => {
      const errorMessage = "Insufficient voucher balance";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(
        voucherService.redeemVoucher({
          voucher_codes: ["VOUCHER001"],
          amount: 500000,
          order_id: "order_1",
        })
      ).rejects.toThrow(errorMessage);
    });

    it("should handle invalid order ID", async () => {
      const errorMessage = "Order not found";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(
        voucherService.redeemVoucher({
          voucher_codes: ["VOUCHER001"],
          amount: 50000,
          order_id: "invalid_order",
        })
      ).rejects.toThrow(errorMessage);
    });
  });

  describe("checkProductEligibility", () => {
    it("should check product eligibility successfully", async () => {
      const mockEligibility = {
        eligible_products: ["prod_1", "prod_2"],
        ineligible_products: ["prod_3"],
        total_eligible_amount: 150000,
        total_ineligible_amount: 50000,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockEligibility);

      const result = await voucherService.checkProductEligibility(["prod_1", "prod_2", "prod_3"]);

      expect(apiFetch).toHaveBeenCalledWith("/vouchers/check-eligibility", {
        method: "POST",
        body: JSON.stringify({ product_ids: ["prod_1", "prod_2", "prod_3"] }),
      });

      expect(result.eligible_products).toContain("prod_1");
      expect(result.ineligible_products).toContain("prod_3");
    });

    it("should handle empty product list", async () => {
      const mockEligibility = {
        eligible_products: [],
        ineligible_products: [],
        total_eligible_amount: 0,
        total_ineligible_amount: 0,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockEligibility);

      const result = await voucherService.checkProductEligibility([]);

      expect(result.eligible_products).toHaveLength(0);
    });

    it("should identify non-voucher-eligible categories", async () => {
      const mockEligibility = {
        eligible_products: ["prod_nutrition"],
        ineligible_products: ["prod_utility"],
        total_eligible_amount: 75000,
        total_ineligible_amount: 25000,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockEligibility);

      const result = await voucherService.checkProductEligibility([
        "prod_nutrition",
        "prod_utility",
      ]);

      expect(result.eligible_products).toHaveLength(1);
      expect(result.ineligible_products).toHaveLength(1);
    });
  });

  describe("getTransactionHistory", () => {
    it("should retrieve transaction history successfully", async () => {
      const mockTransactions = [
        {
          id: "txn_1",
          voucher_id: "voucher_1",
          order_id: "order_1",
          transaction_type: "redeemed",
          amount: 50000,
          created_at: "2024-01-05T00:00:00Z",
        },
      ];

      vi.mocked(apiFetch).mockResolvedValueOnce(mockTransactions);

      const result = await voucherService.getTransactionHistory({
        beneficiary_id: "ben_1",
        transaction_type: "redeemed",
      });

      expect(result).toHaveLength(1);
      expect(result[0].transaction_type).toBe("redeemed");
    });

    it("should filter by transaction type", async () => {
      const mockTransactions = [
        {
          id: "txn_1",
          voucher_id: "voucher_1",
          order_id: null,
          transaction_type: "allocation",
          amount: 100000,
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      vi.mocked(apiFetch).mockResolvedValueOnce(mockTransactions);

      const result = await voucherService.getTransactionHistory({
        beneficiary_id: "ben_1",
        transaction_type: "allocation",
      });

      expect(result[0].transaction_type).toBe("allocation");
    });

    it("should support pagination", async () => {
      const mockTransactions: Array<{
        id: string;
        voucher_id: string;
        order_id?: string;
        transaction_type: string;
        amount: number;
        created_at: string;
      }> = [];

      vi.mocked(apiFetch).mockResolvedValueOnce(mockTransactions);

      const result = await voucherService.getTransactionHistory({
        beneficiary_id: "ben_1",
        page: 2,
        page_size: 5,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle empty transaction history", async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce([]);

      const result = await voucherService.getTransactionHistory({
        beneficiary_id: "ben_1",
      });

      expect(result).toHaveLength(0);
    });
  });

  describe("getAllowedVoucherCategories", () => {
    it("should retrieve allowed categories successfully", async () => {
      const mockCategories = {
        total: 3,
        categories: [
          {
            id: "cat_1",
            category_id: "cat_nutrition",
            category_name: "Nutrition",
            created_at: "2024-01-01T00:00:00Z",
          },
          {
            id: "cat_2",
            category_id: "cat_dairy",
            category_name: "Dairy",
            created_at: "2024-01-01T00:00:00Z",
          },
          {
            id: "cat_3",
            category_id: "cat_vegetables",
            category_name: "Vegetables",
            created_at: "2024-01-01T00:00:00Z",
          },
        ],
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockCategories);

      const result = await voucherService.getAllowedVoucherCategories();

      expect(apiFetch).toHaveBeenCalledWith("/vouchers/allowed-categories");
      expect(result.total).toBe(3);
      expect(result.categories).toHaveLength(3);
    });

    it("should handle empty allowed categories", async () => {
      const mockCategories = {
        total: 0,
        categories: [],
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockCategories);

      const result = await voucherService.getAllowedVoucherCategories();

      expect(result.total).toBe(0);
      expect(result.categories).toHaveLength(0);
    });
  });

  describe("redeemSingleVoucher", () => {
    it("should redeem single voucher with atomic locking", async () => {
      const mockRedemption = {
        success: true,
        voucher_id: "voucher_1",
        code: "VOUCHER001",
        redeemed_amount: 50000,
        new_balance: 50000,
      };

      vi.mocked(apiFetch).mockResolvedValueOnce(mockRedemption);

      const result = await voucherService.redeemSingleVoucher({
        code: "VOUCHER001",
        amount: 50000,
        order_id: "order_1",
      });

      expect(apiFetch).toHaveBeenCalledWith("/vouchers/redeem-single", {
        method: "POST",
        body: JSON.stringify({
          code: "VOUCHER001",
          amount: 50000,
          order_id: "order_1",
        }),
      });

      expect(result.success).toBe(true);
    });

    it("should prevent double redemption with atomic locking", async () => {
      const errorMessage = "Voucher already being processed";
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error(errorMessage));

      await expect(
        voucherService.redeemSingleVoucher({
          code: "VOUCHER001",
          amount: 50000,
          order_id: "order_1",
        })
      ).rejects.toThrow(errorMessage);
    });
  });
});
