import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VendorFacilityOrders from "../VendorFacilityOrders";
import {
  confirmVendorFacilityOrder,
  dispatchFacilityOrder,
  listVendorFacilityOrders,
  rejectVendorFacilityOrder,
  type FacilityOrder,
} from "@/services/facility-orders";

vi.mock("@/components/dashboard/DashboardLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/services/facility-orders", () => ({
  confirmVendorFacilityOrder: vi.fn(),
  dispatchFacilityOrder: vi.fn(),
  listVendorFacilityOrders: vi.fn(),
  rejectVendorFacilityOrder: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const pendingOrder: FacilityOrder = {
  id: "order-1",
  family_id: "family-1",
  family_name: null,
  health_facility_name: "Puskesmas A",
  delivery_address: "Jalan Melati",
  vendor_id: "vendor-1",
  vendor_name: "Toko A",
  items: [{ product_id: "product-1", product_name: "Beras", quantity: 2, price: 35000, subtotal: 70000 }],
  total_amount: 70000,
  status: "pending",
  payment_status: "pending",
  funding_status: "reserved",
  funded_amount: 70000,
  spent_amount: 0,
  created_at: "2026-11-04T01:00:00Z",
  received_at: null,
  receipt_notes: null,
  distribution: null,
};

describe("Vendor facility order workflow", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(listVendorFacilityOrders).mockResolvedValue([pendingOrder]);
  });

  it("requires confirmation before showing the dispatch action", async () => {
    const user = userEvent.setup();
    vi.mocked(confirmVendorFacilityOrder).mockResolvedValue({ ...pendingOrder, status: "processing" });
    vi.mocked(dispatchFacilityOrder).mockResolvedValue({ ...pendingOrder, status: "shipped" });
    render(<VendorFacilityOrders />);

    await screen.findByRole("button", { name: "Konfirmasi pesanan" });
    expect(screen.queryByRole("button", { name: "Kirim pesanan" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Konfirmasi pesanan" }));
    expect(await screen.findByText("Diproses vendor")).toBeInTheDocument();
    expect(dispatchFacilityOrder).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Tolak pesanan" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Kirim pesanan" }));
    expect(await screen.findByText("Dalam pengiriman")).toBeInTheDocument();
    expect(confirmVendorFacilityOrder).toHaveBeenCalledWith("order-1");
    expect(dispatchFacilityOrder).toHaveBeenCalledWith("order-1");
    expect(screen.queryByRole("button", { name: "Kirim pesanan" })).not.toBeInTheDocument();
  });

  it("requires a rejection reason and retains the rejected order in the list", async () => {
    const user = userEvent.setup();
    const reason = "Kapasitas pengiriman penuh";
    vi.mocked(rejectVendorFacilityOrder).mockResolvedValue({
      ...pendingOrder, status: "rejected", vendor_rejection_reason: reason, funded_amount: 0,
    });
    render(<VendorFacilityOrders />);

    await user.click(await screen.findByRole("button", { name: "Tolak pesanan" }));
    const dialog = screen.getByRole("dialog");
    const submit = within(dialog).getByRole("button", { name: "Tolak pesanan" });
    expect(submit).toBeDisabled();
    await user.type(within(dialog).getByLabelText("Alasan penolakan"), reason);
    await user.click(submit);

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(rejectVendorFacilityOrder).toHaveBeenCalledWith("order-1", reason);
    expect(screen.getByText("Ditolak")).toBeInTheDocument();
    expect(screen.getByText(`Alasan penolakan: ${reason}`)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Konfirmasi pesanan" })).not.toBeInTheDocument();
  });

  it("keeps the pending actions available when confirmation fails", async () => {
    const user = userEvent.setup();
    vi.mocked(confirmVendorFacilityOrder).mockRejectedValue(new Error("Pesanan telah dibatalkan"));
    render(<VendorFacilityOrders />);

    await user.click(await screen.findByRole("button", { name: "Konfirmasi pesanan" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Konfirmasi pesanan" })).toBeEnabled());
    expect(screen.queryByRole("button", { name: "Kirim pesanan" })).not.toBeInTheDocument();
  });
});
