import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "../api";
import {
  getWalletBalance,
  getWithdrawalHistory,
  redeemQrWithdrawal,
  requestQrWithdrawal,
  requestWithdrawal,
} from "../vendor-wallet";

vi.mock("../api", () => ({
  apiFetch: vi.fn(),
  API_BASE_URL: "http://localhost:8000/api/v1",
}));

describe("vendor-wallet service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests wallet balance", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      balance: 250000,
      pending_withdrawals: 100000,
    });

    const result = await getWalletBalance();

    expect(apiFetch).toHaveBeenCalledWith("/vendor-wallet/balance");
    expect(result.balance).toBe(250000);
    expect(result.pending_withdrawals).toBe(100000);
  });

  it("creates bank withdrawal request", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      id: "wd_1",
      amount: 50000,
      status: "completed",
      withdrawal_method: "bank",
    });

    const result = await requestWithdrawal(50000);

    expect(apiFetch).toHaveBeenCalledWith("/vendor-wallet/withdraw?amount=50000", {
      method: "POST",
    });
    expect(result.withdrawal_method).toBe("bank");
  });

  it("creates QR withdrawal request", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      id: "wd_2",
      amount: 100000,
      status: "pending",
      withdrawal_method: "qr",
      qr_payload: "VENDOR-WITHDRAWAL:QRW-20260504-ABC123",
    });

    const result = await requestQrWithdrawal(100000);

    expect(apiFetch).toHaveBeenCalledWith("/vendor-wallet/withdraw/qr", {
      method: "POST",
      body: JSON.stringify({ amount: 100000 }),
    });
    expect(result.withdrawal_method).toBe("qr");
    expect(result.qr_payload).toContain("VENDOR-WITHDRAWAL");
  });

  it("redeems QR withdrawal request", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      id: "wd_2",
      amount: 100000,
      status: "completed",
      withdrawal_method: "qr",
    });

    const result = await redeemQrWithdrawal("VENDOR-WITHDRAWAL:QRW-20260504-ABC123");

    expect(apiFetch).toHaveBeenCalledWith("/vendor-wallet/withdraw/qr/redeem", {
      method: "POST",
      body: JSON.stringify({ qr_payload: "VENDOR-WITHDRAWAL:QRW-20260504-ABC123" }),
    });
    expect(result.status).toBe("completed");
  });

  it("loads withdrawal history", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      items: [
        {
          id: "wd_3",
          amount: 120000,
          status: "pending",
          withdrawal_method: "qr",
          created_at: "2026-05-04T10:00:00Z",
        },
      ],
      total: 1,
      page: 1,
      page_size: 20,
      total_pages: 1,
    });

    const result = await getWithdrawalHistory();

    expect(apiFetch).toHaveBeenCalledWith("/vendor-wallet/withdrawals?page=1&page_size=20");
    expect(result.items).toHaveLength(1);
    expect(result.items[0].withdrawal_method).toBe("qr");
  });
});
