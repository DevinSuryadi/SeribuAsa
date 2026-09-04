import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getChildRisk,
  getHighRiskChildren,
  recomputeChildRisk,
} from "../stunting-risk";
import { apiFetch } from "../api";

vi.mock("../api", () => ({
  apiFetch: vi.fn(),
}));

describe("Stunting Risk Service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getChildRisk", () => {
    it("should fetch risk prediction for a specific child", async () => {
      const mockData = {
        risk_level: "high",
        risk_score: 0.85,
        dominant_factors: [{ name: "z_score_height", contribution: 0.5 }],
      };
      // The API wraps it in { success: true, data: mockData } or something,
      // but let's check what the service returns. If the service returns it directly:
      vi.mocked(apiFetch).mockResolvedValueOnce({ success: true, data: mockData });

      const result = await getChildRisk("child_123");

      expect(apiFetch).toHaveBeenCalledWith("/nutrition/risk/child_123");
      expect(result).toEqual(mockData);
    });

    it("should throw error if API fails", async () => {
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error("API Error"));
      await expect(getChildRisk("child_123")).rejects.toThrow("API Error");
    });
  });

  describe("getHighRiskChildren", () => {
    it("should fetch list of high risk children", async () => {
      const mockList = [
        { child_id: "c1", risk_level: "high" },
        { child_id: "c2", risk_level: "medium" },
      ];
      vi.mocked(apiFetch).mockResolvedValueOnce({ success: true, data: mockList });

      const result = await getHighRiskChildren();

      expect(apiFetch).toHaveBeenCalledWith("/nutrition/risk/high-risk?limit=50");
      expect(result).toEqual(mockList);
    });
  });

  describe("recomputeChildRisk", () => {
    it("should trigger a new prediction computation", async () => {
      const mockData = {
        risk_level: "high",
        risk_score: 0.85,
      };
      vi.mocked(apiFetch).mockResolvedValueOnce({ success: true, data: mockData });

      const result = await recomputeChildRisk("child_123");

      expect(apiFetch).toHaveBeenCalledWith("/nutrition/risk/child_123/recompute", {
        method: "POST",
      });
      expect(result).toEqual(mockData);
    });
  });
});
