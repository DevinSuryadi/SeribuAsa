import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import FacilityOrdersTable from "../facility/FacilityOrdersTable";
import { listFacilityOrders, type FacilityOrder } from "@/services/facility-orders";

vi.mock("@/components/dashboard/DashboardLayout", () => ({
  default: ({ children, actions }: { children: ReactNode; actions: ReactNode }) => (
    <main>{actions}{children}</main>
  ),
}));
vi.mock("@/components/order/FacilityReceiptDialog", () => ({ default: () => null }));
vi.mock("@/services/facility-orders", () => ({
  listFacilityOrders: vi.fn(),
  cancelFacilityOrder: vi.fn(),
}));

const order: FacilityOrder = {
  id: "order-1", family_id: "family-1", family_name: "Keluarga A",
  health_facility_name: "Puskesmas A", delivery_address: "Jalan Melati",
  vendor_id: "vendor-1", vendor_name: "Toko A", items: [], total_amount: 70000,
  status: "pending", payment_status: "pending", funding_status: "reserved",
  funded_amount: 70000, spent_amount: 0, created_at: "2026-11-04T01:00:00Z",
  received_at: null, receipt_notes: null, distribution: null,
};

describe("Facility order progress", () => {
  beforeEach(() => vi.resetAllMocks());

  it.each([
    { status: "processing", tab: "Menunggu 1", canReceive: false },
    { status: "shipped", tab: "Dikirim 1", canReceive: true },
  ] as const)("groups $status under its tab and gates receipt confirmation", async ({ status, tab, canReceive }) => {
    const user = userEvent.setup();
    vi.mocked(listFacilityOrders).mockResolvedValue([{ ...order, status }]);
    render(<MemoryRouter><FacilityOrdersTable /></MemoryRouter>);

    await user.click(await screen.findByRole("button", { name: tab }));
    await user.click(screen.getByRole("button", { name: /#order/ }));
    expect(Boolean(screen.queryByRole("button", { name: "Konfirmasi barang tiba" }))).toBe(canReceive);
  });

  it("shows the vendor rejection reason without receipt or cancellation actions", async () => {
    const user = userEvent.setup();
    vi.mocked(listFacilityOrders).mockResolvedValue([{
      ...order, status: "rejected", vendor_rejected_at: "2026-11-04T01:30:00Z",
      vendor_rejection_reason: "Kapasitas pengiriman penuh",
    }]);
    render(<MemoryRouter><FacilityOrdersTable /></MemoryRouter>);

    await user.click(await screen.findByRole("button", { name: "Dibatalkan 1" }));
    await user.click(screen.getByRole("button", { name: /#order/ }));
    expect(screen.getByText("Ditolak Vendor: Kapasitas pengiriman penuh")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Konfirmasi barang tiba" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Batalkan pesanan" })).not.toBeInTheDocument();
  });
});
