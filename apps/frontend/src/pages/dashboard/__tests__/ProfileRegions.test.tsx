import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Profile from "../Profile";
import { useProfile } from "@/hooks/useProfile";
import { getProvinces, getRegencies } from "@/services/regions";
import type { BackendProfile } from "@/types";

vi.mock("@/components/dashboard/DashboardLayout", () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "account-1", fullName: "Account", email: "account@example.org" }, userRole: "health_facility", signOut: vi.fn() }) }));
vi.mock("@/hooks/useProfile", () => ({ useProfile: vi.fn() }));
vi.mock("@/services/regions", () => ({ getProvinces: vi.fn(), getRegencies: vi.fn() }));
vi.mock("@/services/upload", () => ({ uploadImage: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const profile: BackendProfile = {
  full_name: "Account", role: "health_facility", phone: null, address: "Alamat fasilitas",
  date_of_birth: null, gender: null, province_code: "15", regency_code: "15.71",
  province_name: "Jambi", regency_name: "Kota Jambi", store_name: "Toko A", store_address: "Alamat toko",
};
const updateProfile = vi.fn();

describe("Profile region editing", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getProvinces).mockResolvedValue([{ code: "15", name: "Jambi" }]);
    vi.mocked(getRegencies).mockResolvedValue([
      { code: "15.71", province_code: "15", name: "Kota Jambi" },
      { code: "15.72", province_code: "15", name: "Kota Sungai Penuh" },
    ]);
    updateProfile.mockResolvedValue(true);
    vi.mocked(useProfile).mockReturnValue({ data: profile, loading: false, error: null, isSubmitting: false, updateProfile, refetch: vi.fn() });
  });

  it("saves the health facility region through the existing profile dialog", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Profile /></MemoryRouter>);
    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    const dialog = screen.getByRole("dialog");
    await within(dialog).findByRole("option", { name: "Kota Sungai Penuh" });
    await user.selectOptions(within(dialog).getByLabelText("Kota/kabupaten"), "15.72");
    await user.click(within(dialog).getByRole("button", { name: "Simpan" }));
    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith(expect.objectContaining({ province_code: "15", regency_code: "15.72" })));
    expect(updateProfile.mock.calls[0][0]).not.toHaveProperty("date_of_birth");
    expect(updateProfile.mock.calls[0][0]).not.toHaveProperty("gender");
  });

  it("saves the vendor location through the existing store dialog", async () => {
    const user = userEvent.setup();
    vi.mocked(useProfile).mockReturnValue({ data: { ...profile, role: "vendor" }, loading: false, error: null, isSubmitting: false, updateProfile, refetch: vi.fn() });
    render(<MemoryRouter><Profile /></MemoryRouter>);
    await user.click(screen.getByRole("tab", { name: "Informasi Toko" }));
    await user.click(screen.getByRole("button", { name: "Edit Toko" }));
    const dialog = screen.getByRole("dialog");
    await within(dialog).findByRole("option", { name: "Kota Sungai Penuh" });
    await user.selectOptions(within(dialog).getByLabelText("Kota/kabupaten"), "15.72");
    await user.click(within(dialog).getByRole("button", { name: "Simpan Informasi Toko" }));
    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith(expect.objectContaining({ store_name: "Toko A", province_code: "15", regency_code: "15.72" })));
    expect(updateProfile.mock.calls[0][0]).not.toHaveProperty("date_of_birth");
    expect(updateProfile.mock.calls[0][0]).not.toHaveProperty("gender");
  });

  it.each(["health_facility", "vendor"] as const)("omits personal demographics for %s and counts organization fields", async (role) => {
    const user = userEvent.setup();
    vi.mocked(useProfile).mockReturnValue({ data: { ...profile, role, phone: "08123456789" }, loading: false, error: null, isSubmitting: false, updateProfile, refetch: vi.fn() });
    render(<MemoryRouter><Profile /></MemoryRouter>);
    expect(screen.queryByText("Tanggal Lahir")).not.toBeInTheDocument();
    expect(screen.queryByText("Jenis Kelamin")).not.toBeInTheDocument();
    expect(screen.getByText("4/4 Data Terisi")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit Profil" }));
    expect(screen.queryByLabelText("Tanggal Lahir")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Jenis Kelamin")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() => expect(updateProfile).toHaveBeenCalled());
    expect(updateProfile.mock.calls[0][0]).not.toHaveProperty("date_of_birth");
    expect(updateProfile.mock.calls[0][0]).not.toHaveProperty("gender");
  });

  it("retains personal fields for individual profiles", async () => {
    const user = userEvent.setup();
    vi.mocked(useProfile).mockReturnValue({ data: { ...profile, role: "donor" }, loading: false, error: null, isSubmitting: false, updateProfile, refetch: vi.fn() });
    render(<MemoryRouter><Profile /></MemoryRouter>);
    expect(screen.getByText("Tanggal Lahir")).toBeInTheDocument();
    expect(screen.getByText("Jenis Kelamin")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit Profil" }));
    expect(screen.getByLabelText("Tanggal Lahir")).toBeInTheDocument();
    expect(screen.getByLabelText("Jenis Kelamin")).toBeInTheDocument();
  });

  it("shows a retry action instead of an empty editable profile after a load failure", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    vi.mocked(useProfile).mockReturnValue({ data: null, loading: false, error: "Gagal mengakses data", isSubmitting: false, updateProfile, refetch });
    render(<MemoryRouter><Profile /></MemoryRouter>);
    expect(screen.getByText("Gagal mengakses data")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Profil" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(refetch).toHaveBeenCalledOnce();
    expect(updateProfile).not.toHaveBeenCalled();
  });
});
