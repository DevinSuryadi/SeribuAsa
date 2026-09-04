import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createDonation,
  getDonations,
  getDonation,
  getImpactMetrics,
  getDashboardMetrics,
} from "../donations";
import { apiFetch } from "../api";


// Mock apiFetch
vi.mock("../api", () => ({
  apiFetch: vi.fn(),
}));

describe("Donation Service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("createDonation", () => {
    it("should successfully create a donation", async () => {
      const mockResponse = { id: "don_1", amount: 100000, status: "pending" };
      vi.mocked(apiFetch).mockResolvedValueOnce(mockResponse);

      const payload = {
        amount: 100000,
        type: "one_time",
        payment_method: "qris",
      };

      const result = await createDonation(payload);

      expect(apiFetch).toHaveBeenCalledWith("/donations/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      expect(result).toEqual(mockResponse);
    });

    it("should handle error when creating donation", async () => {
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error("API Error"));

      const payload = { amount: 100000, type: "one_time", payment_method: "qris" };
      await expect(createDonation(payload)).rejects.toThrow("API Error");
    });
  });

  describe("getDonations", () => {
    it("should fetch all donations", async () => {
      const mockDonations = {
        data: [
          { id: "don_1", amount: 100000 },
          { id: "don_2", amount: 200000 },
        ]
      };
      vi.mocked(apiFetch).mockResolvedValueOnce(mockDonations);

      const result = await getDonations();

      expect(apiFetch).toHaveBeenCalledWith("/donations/");
      expect(result).toEqual(mockDonations.data);
    });

    it("should fetch donations without params", async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce([]);
      
      await getDonations();
      expect(apiFetch).toHaveBeenCalledWith("/donations/");
    });
  });

  describe("getDonation", () => {
    it("should fetch a specific donation", async () => {
      const mockDonation = { id: "don_1", amount: 100000 };
      vi.mocked(apiFetch).mockResolvedValueOnce(mockDonation);

      const result = await getDonation("don_1");

      expect(apiFetch).toHaveBeenCalledWith("/donations/don_1");
      expect(result).toEqual(mockDonation);
    });
  });

  describe("updateDonationStatus", () => {
    it.todo("skip since it's not exported");
  });

  describe("Metrics", () => {
    it("should fetch impact metrics", async () => {
      const mockMetrics = { total_donated: 5000000 };
      vi.mocked(apiFetch).mockResolvedValueOnce(mockMetrics);

      const result = await getImpactMetrics("donor_1");

      expect(apiFetch).toHaveBeenCalledWith("/donations/impact/donor_1");
      expect(result).toEqual(mockMetrics);
    });

    it("should fetch dashboard metrics", async () => {
      const mockMetrics = { total_donated: 5000000 };
      vi.mocked(apiFetch).mockResolvedValueOnce(mockMetrics);

      const result = await getDashboardMetrics("donor_1");

      expect(apiFetch).toHaveBeenCalledWith("/donations/dashboard-metrics/donor_1");
      expect(result).toEqual(mockMetrics);
    });
  });
});
