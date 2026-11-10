import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/services/api";
import { useProfile } from "../useProfile";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("@/services/api", () => ({ apiFetch: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const facility = {
  full_name: "Admin Faskes", phone: "08123456789", address: "Alamat fasilitas",
  province_code: "15", regency_code: "15.71", province_name: "Jambi", regency_name: "Kota Jambi",
};

function wrapper({ children }: { children: ReactNode }) {
  return <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>;
}

function setRole(role: ReturnType<typeof useAuth>["userRole"]) {
  vi.mocked(useAuth).mockReturnValue({
    user: { id: "account-1", fullName: "Admin", role }, userRole: role,
  } as ReturnType<typeof useAuth>);
}

describe("profile API routing", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setRole("health_facility");
    vi.mocked(apiFetch).mockResolvedValue(facility);
  });

  it("loads and saves facilities through their own API and updates the profile cache", async () => {
    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => expect(result.current.data?.role).toBe("health_facility"));
    expect(apiFetch).toHaveBeenCalledExactlyOnceWith("/facilities/me", { cache: "no-store" });
    expect(result.current.data).toMatchObject({ ...facility, date_of_birth: null, gender: null });

    const updated = { ...facility, full_name: "Admin baru", address: "Alamat baru", regency_code: "15.72", regency_name: "Kota Sungai Penuh" };
    vi.mocked(apiFetch).mockResolvedValueOnce(updated);
    await act(async () => {
      expect(await result.current.updateProfile({
        full_name: updated.full_name, address: updated.address,
        province_code: "15", regency_code: "15.72",
        date_of_birth: "2000-01-01", gender: "male", store_name: "Ignored store",
      })).toBe(true);
    });
    expect(apiFetch).toHaveBeenLastCalledWith("/facilities/me", {
      method: "PATCH",
      body: JSON.stringify({ full_name: updated.full_name, address: updated.address, province_code: "15", regency_code: "15.72" }),
    });
    expect(apiFetch).toHaveBeenCalledTimes(2);
    expect(result.current.data).toMatchObject({ ...updated, role: "health_facility" });
    expect(result.current.isSubmitting).toBe(false);
  });

  it("waits for the resolved account role before selecting a profile endpoint", async () => {
    setRole(null);
    const { result, rerender } = renderHook(() => useProfile(), { wrapper });
    expect(apiFetch).not.toHaveBeenCalled();
    setRole("health_facility");
    rerender();
    await waitFor(() => expect(result.current.data?.role).toBe("health_facility"));
    expect(apiFetch).toHaveBeenCalledExactlyOnceWith("/facilities/me", { cache: "no-store" });
  });

  it("keeps vendor profiles on the user API", async () => {
    setRole("vendor");
    vi.mocked(apiFetch).mockResolvedValue({ ...facility, role: "vendor", store_name: "Toko Melati" });
    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => expect(result.current.data?.role).toBe("vendor"));
    expect(apiFetch).toHaveBeenCalledExactlyOnceWith("/users/account-1");
    const payload = { full_name: "Vendor baru", phone: "08987654321" };
    await act(async () => { expect(await result.current.updateProfile(payload)).toBe(true); });
    expect(apiFetch).toHaveBeenLastCalledWith("/users/account-1", { method: "PATCH", body: JSON.stringify(payload) });
  });

  it.each([403, 404, 500])("exposes a facility load error (%s) without creating a user profile", async (status) => {
    vi.mocked(apiFetch).mockRejectedValueOnce(Object.assign(new Error("Gagal memuat fasilitas"), { status }));
    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => expect(result.current.error).toBe("Gagal memuat fasilitas"));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it("keeps the loaded data when saving fails", async () => {
    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => expect(result.current.data?.full_name).toBe(facility.full_name));
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error("Penyimpanan gagal"));
    await act(async () => { expect(await result.current.updateProfile({ full_name: "Unsaved" })).toBe(false); });
    expect(result.current.data?.full_name).toBe(facility.full_name);
    expect(result.current.isSubmitting).toBe(false);
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });
});
