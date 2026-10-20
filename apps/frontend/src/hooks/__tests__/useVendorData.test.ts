import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/contexts/AuthContext";
import { getOrders } from "@/services/orders";
import { getProducts } from "@/services/products";
import { getWalletBalance } from "@/services/vendor-wallet";
import { useVendorData } from "../useVendorData";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("@/services/orders", () => ({ getOrders: vi.fn() }));
vi.mock("@/services/products", () => ({ getProducts: vi.fn() }));
vi.mock("@/services/vendor-wallet", () => ({ getWalletBalance: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

describe("vendor dashboard data", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getOrders).mockResolvedValue({ orders: [], total: 0, page: 1, page_size: 50, total_pages: 0 });
    vi.mocked(getProducts).mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 });
    vi.mocked(getWalletBalance).mockResolvedValue({ balance: 0 });
  });

  it("loads only the authenticated vendor's products", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: "vendor-01" } } as ReturnType<typeof useAuth>);
    const { result } = renderHook(() => useVendorData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getProducts).toHaveBeenCalledWith({ vendor_id: "vendor-01" });
    expect(result.current.error).toBeNull();
  });

  it("waits for the vendor identity before fetching dashboard data", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as ReturnType<typeof useAuth>);
    const { result, rerender } = renderHook(() => useVendorData());

    expect(getProducts).not.toHaveBeenCalled();
    expect(getOrders).not.toHaveBeenCalled();
    expect(getWalletBalance).not.toHaveBeenCalled();

    vi.mocked(useAuth).mockReturnValue({ user: { id: "vendor-01" } } as ReturnType<typeof useAuth>);
    rerender();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getProducts).toHaveBeenCalledWith({ vendor_id: "vendor-01" });
  });
});
