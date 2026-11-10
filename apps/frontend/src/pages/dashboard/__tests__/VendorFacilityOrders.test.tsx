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
vi.mock("@/hooks/useSmartPolling", () => ({ useSmartPolling: vi.fn() }));
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

// The page renders a mobile list and a desktop table, so each status label appears twice.
const statusShown = (label: string) => expect(screen.getAllByText(label).length).toBeGreaterThan(0);

describe("Vendor facility order workflow", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(listVendorFacilityOrders).mockResolvedValue([pendingOrder]);
  });

  it("accepts an order before it can be sent to the facility", async () => {
    const user = userEvent.setup();
    vi.mocked(confirmVendorFacilityOrder).mockResolvedValue({ ...pendingOrder, status: "processing" });
    vi.mocked(dispatchFacilityOrder).mockResolvedValue({ ...pendingOrder, status: "shipped" });
    render(<VendorFacilityOrders />);

    await screen.findByRole("button", { name: "Terima pesanan" });
    expect(screen.queryByRole("button", { name: "Kirim ke faskes" })).not.toBeInTheDocument();

    vi.mocked(listVendorFacilityOrders).mockResolvedValue([{ ...pendingOrder, status: "processing" }]);
    await user.click(screen.getByRole("button", { name: "Terima pesanan" }));
    await screen.findByRole("button", { name: "Kirim ke faskes" });
    statusShown("Siap dikirim");
    expect(confirmVendorFacilityOrder).toHaveBeenCalledWith("order-1");
    expect(dispatchFacilityOrder).not.toHaveBeenCalled();

    vi.mocked(listVendorFacilityOrders).mockResolvedValue([{ ...pendingOrder, status: "shipped" }]);
    await user.click(screen.getByRole("button", { name: "Kirim ke faskes" }));
    await waitFor(() => statusShown("Dalam pengiriman"));
    expect(dispatchFacilityOrder).toHaveBeenCalledWith("order-1");
    expect(screen.queryByRole("button", { name: "Kirim ke faskes" })).not.toBeInTheDocument();
  });

  it("requires a rejection reason and shows it on the rejected order", async () => {
    const user = userEvent.setup();
    const reason = "Kapasitas pengiriman penuh";
    const rejected = { ...pendingOrder, status: "rejected" as const, vendor_rejection_reason: reason };
    vi.mocked(rejectVendorFacilityOrder).mockResolvedValue(rejected);
    render(<VendorFacilityOrders />);

    await user.click((await screen.findAllByText("Puskesmas A"))[0]);
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Tolak" }));
    const submit = within(dialog).getByRole("button", { name: "Tolak pesanan" });
    const reasonInput = within(dialog).getByLabelText("Alasan penolakan");
    await user.click(reasonInput);
    await user.paste("abc");
    expect(submit).toBeDisabled();
    await user.clear(reasonInput);
    await user.paste(reason);

    vi.mocked(listVendorFacilityOrders).mockResolvedValue([rejected]);
    await user.click(submit);

    await waitFor(() => expect(rejectVendorFacilityOrder).toHaveBeenCalledWith("order-1", reason));
    expect(await within(dialog).findByText(`Alasan penolakan: ${reason}`)).toBeInTheDocument();
    statusShown("Ditolak");
    expect(screen.queryByRole("button", { name: "Terima pesanan" })).not.toBeInTheDocument();
  });

  it("keeps the order pending when accepting it fails", async () => {
    const user = userEvent.setup();
    vi.mocked(confirmVendorFacilityOrder).mockRejectedValue(new Error("Pesanan telah dibatalkan"));
    render(<VendorFacilityOrders />);

    await user.click(await screen.findByRole("button", { name: "Terima pesanan" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Terima pesanan" })).toBeEnabled());
    expect(screen.queryByRole("button", { name: "Kirim ke faskes" })).not.toBeInTheDocument();
  });
});
