import type { ReactNode } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FacilityCatalog from "../facility/FacilityCatalog";
import { getFamilyAidQuota, getMyFacility, listFamilies, type Facility, type FamilyAidQuota } from "@/services/facility-families";
import { createFacilityOrder, listEligibleVendors, type FacilityOrder } from "@/services/facility-orders";
import { getCategories, getProducts } from "@/services/products";
import { getProvinces, getRegencies } from "@/services/regions";
import type { VendorProduct } from "@/types/vendor";

vi.mock("@/components/dashboard/DashboardLayout", () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/product/ProductImageTile", () => ({ ProductImageTile: () => null }));
vi.mock("@/services/facility-families", () => ({ getFamilyAidQuota: vi.fn(), getMyFacility: vi.fn(), listFamilies: vi.fn() }));
vi.mock("@/services/facility-orders", () => ({ createFacilityOrder: vi.fn(), listEligibleVendors: vi.fn() }));
vi.mock("@/services/products", () => ({ getCategories: vi.fn(), getProducts: vi.fn() }));
vi.mock("@/services/regions", () => ({ getProvinces: vi.fn(), getRegencies: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const facility: Facility = { id: "facility-1", name: "Faskes A", facility_type: null, approval_status: "approved", address: "Jl. Kenanga 12", province_code: "15", regency_code: "15.71" };
const product: VendorProduct = {
  id: "product-1", vendor_id: "vendor-1", name: "Beras lokal", price: 10000,
  voucher_price: 10000, stock: 5, unit: "kg", category: "category-1",
  approval_status: "approved", created_at: "2026-11-04T01:00:00Z",
  service_province_code: "15", service_regency_code: "15.71",
};

const quota: FamilyAidQuota = {
  eligible: true, blocked_reason: null, period_start: "2026-11-09", period_end: "2026-11-15",
  fies_classification: "severe", amount_per_beneficiary: 100000, children_under_two: 1, unborn_children: 1,
  beneficiaries: 2, weekly_limit: 200000, used_amount: 0, remaining_amount: 200000,
};

function renderCatalog() {
  return render(<MemoryRouter><FacilityCatalog /></MemoryRouter>);
}

describe("Facility catalog profile region", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getMyFacility).mockResolvedValue(facility);
    vi.mocked(listFamilies).mockResolvedValue([{ id: "family-1", health_facility_id: "facility-1", kk_number: "1234567890123456", head_name: "Keluarga A", created_at: "2026-11-04T01:00:00Z" }]);
    vi.mocked(getCategories).mockResolvedValue([]);
    vi.mocked(getProvinces).mockResolvedValue([{ code: "15", name: "Jambi" }]);
    vi.mocked(getRegencies).mockResolvedValue([
      { code: "15.71", province_code: "15", name: "Kota Jambi" },
      { code: "15.72", province_code: "15", name: "Kota Sungai Penuh" },
    ]);
    vi.mocked(listEligibleVendors).mockResolvedValue([{ id: "vendor-1", store_name: "Vendor A", product_count: 1 }]);
    vi.mocked(getProducts).mockResolvedValue({ items: [product], total: 1, page: 1, page_size: 12, total_pages: 1 });
    vi.mocked(getFamilyAidQuota).mockResolvedValue(quota);
  });

  it("shows local products before a specific vendor is selected", async () => {
    renderCatalog();
    expect(await screen.findByText("Beras lokal")).toBeInTheDocument();
    expect(screen.getByLabelText("Provinsi")).toHaveValue("15");
    expect(screen.getByLabelText("Kota/kabupaten")).toHaveValue("15.71");
    expect(screen.getByLabelText("Vendor")).toHaveValue("");
    expect(getProducts).toHaveBeenCalledWith(expect.objectContaining({ vendor_id: undefined, service_regency_code: "15.71", vendor_regency_code: "15.71" }));
  });

  it("checks out using the product vendor while viewing all local vendors", async () => {
    const user = userEvent.setup();
    vi.mocked(createFacilityOrder).mockResolvedValue({ id: "order-1" } as FacilityOrder);
    renderCatalog();
    // Profile, region, vendor, and product requests resolve in sequence before the card appears.
    await user.click(await screen.findByRole("button", { name: "Tambah Beras lokal" }, { timeout: 3000 }));
    await user.selectOptions(screen.getByLabelText("Keluarga penerima"), "family-1");
    await user.click(screen.getByRole("button", { name: "Pesan untuk Keluarga A" }));
    await waitFor(() => expect(createFacilityOrder).toHaveBeenCalledWith(expect.objectContaining({ vendor_id: "vendor-1", service_province_code: "15", service_regency_code: "15.71", items: [{ product_id: "product-1", quantity: 1 }] })));
  });

  it("allows another region and clears items selected from the previous region", async () => {
    const user = userEvent.setup();
    renderCatalog();
    await user.click(await screen.findByRole("button", { name: "Tambah Beras lokal" }));
    await user.selectOptions(screen.getByLabelText("Kota/kabupaten"), "15.72");
    await waitFor(() => expect(getProducts).toHaveBeenLastCalledWith(expect.objectContaining({ service_regency_code: "15.72", vendor_regency_code: "15.72" })));
    expect(screen.getByRole("button", { name: "Pesan untuk keluarga" })).toBeDisabled();
    expect(screen.getByText("Pilih pangan untuk mulai memesan. Katalog dapat dilihat tanpa memilih keluarga.")).toBeInTheDocument();
  });

  it("preserves a manual region selection when the profile response arrives later", async () => {
    const user = userEvent.setup();
    let resolveProfile!: (value: Facility) => void;
    vi.mocked(getMyFacility).mockReturnValue(new Promise((resolve) => { resolveProfile = resolve; }));
    renderCatalog();
    await screen.findByRole("option", { name: "Jambi" });
    await user.selectOptions(screen.getByLabelText("Provinsi"), "15");
    await screen.findByRole("option", { name: "Kota Sungai Penuh" });
    await user.selectOptions(screen.getByLabelText("Kota/kabupaten"), "15.72");
    await act(async () => { resolveProfile(facility); });
    expect(screen.getByLabelText("Kota/kabupaten")).toHaveValue("15.72");
  });

  it("allows existing facilities without a profile region to choose one manually", async () => {
    vi.mocked(getMyFacility).mockResolvedValue({ ...facility, province_code: null, regency_code: null });
    renderCatalog();
    await screen.findByRole("option", { name: "Jambi" });
    expect(getProducts).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Provinsi")).toHaveValue("");
  });
});

describe("Facility catalog weekly aid quota", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getMyFacility).mockResolvedValue(facility);
    vi.mocked(listFamilies).mockResolvedValue([{ id: "family-1", health_facility_id: "facility-1", kk_number: "1234567890123456", head_name: "Keluarga A", created_at: "2026-11-04T01:00:00Z" }]);
    vi.mocked(getCategories).mockResolvedValue([]);
    vi.mocked(getProvinces).mockResolvedValue([{ code: "15", name: "Jambi" }]);
    vi.mocked(getRegencies).mockResolvedValue([{ code: "15.71", province_code: "15", name: "Kota Jambi" }]);
    vi.mocked(listEligibleVendors).mockResolvedValue([{ id: "vendor-1", store_name: "Vendor A", product_count: 1 }]);
    vi.mocked(getProducts).mockResolvedValue({ items: [product], total: 1, page: 1, page_size: 12, total_pages: 1 });
  });

  it("shows the remaining weekly quota and blocks orders above it", async () => {
    const user = userEvent.setup();
    vi.mocked(getFamilyAidQuota).mockResolvedValue({ ...quota, used_amount: 195000, remaining_amount: 5000 });
    renderCatalog();
    await user.selectOptions(await screen.findByLabelText("Keluarga penerima"), "family-1");
    const summary = await screen.findByLabelText("Kuota bantuan mingguan");
    expect(summary).toHaveTextContent("1 anak di bawah 2 tahun dan 1 anak dalam kandungan");

    await user.click(await screen.findByRole("button", { name: "Tambah Beras lokal" }, { timeout: 3000 }));

    expect(screen.getByText("Total pesanan melebihi sisa kuota mingguan keluarga. Kurangi jumlah pangan sebelum memesan.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pesan untuk Keluarga A" })).toBeDisabled();
  });

  it("explains why a family without a FIES survey cannot receive aid", async () => {
    const user = userEvent.setup();
    const reason = "Keluarga belum memiliki hasil survei FIES. Lakukan survei FIES terlebih dahulu sebelum memesan bantuan pangan.";
    vi.mocked(getFamilyAidQuota).mockResolvedValue({ ...quota, eligible: false, blocked_reason: reason, weekly_limit: 0, remaining_amount: 0 });
    renderCatalog();
    await user.selectOptions(await screen.findByLabelText("Keluarga penerima"), "family-1");
    await user.click(await screen.findByRole("button", { name: "Tambah Beras lokal" }, { timeout: 3000 }));

    expect(await screen.findByText(reason)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pesan untuk Keluarga A" })).toBeDisabled();
  });
});
