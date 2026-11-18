import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import ImpactDashboard from "../ImpactDashboard";
import { useImpactDashboard } from "@/services/impact-dashboard";

vi.mock("@/services/impact-dashboard", () => ({ useImpactDashboard: vi.fn() }));

const report = {
  scope: "personal",
  period: { start_date: null, end_date: "2026-02-01" },
  generated_at: "2026-02-01T12:00:00Z",
  summary: {
    received: "100",
    pooled_received: "100",
    legacy_received: "0",
    reserved: "0",
    spent: "100",
    available: "0",
    distributed: "50",
    donations: 1,
    families: 1,
    facilities: 1,
    distributions: 1,
  },
  trend: [],
  regions: [],
  recent_donations: [],
};

function setup(state: object, props = {}) {
  const mutate = vi.fn();
  vi.mocked(useImpactDashboard).mockReturnValue({
    data: report,
    mutate,
    ...state,
  } as unknown as ReturnType<typeof useImpactDashboard>);
  render(
    <MemoryRouter>
      <ImpactDashboard {...props} />
    </MemoryRouter>
  );
  return mutate;
}

describe("Impact dashboard", () => {
  it("provides loading and retry states", () => {
    setup({ data: undefined, isLoading: true });
    expect(screen.getByRole("status")).toHaveTextContent("Memuat dampak");
  });
  it("retries failed requests without displaying stale figures", () => {
    const mutate = setup({ error: new Error("offline") });
    expect(screen.getByRole("alert")).toHaveTextContent("Gagal memuat");
    expect(screen.queryByText("Keluarga terjangkau")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Coba lagi"));
    expect(mutate).toHaveBeenCalled();
  });
  it("shows empty delivery states and explains shared attribution", () => {
    setup({});
    expect(screen.getByText("Belum ada penyerahan ke keluarga yang tercatat.")).toBeInTheDocument();
    expect(screen.getByText(/keluarga yang dibiayai bersama/i)).toBeInTheDocument();
    expect(screen.queryByText(/45.5/)).not.toBeInTheDocument();
  });
  it("validates dates and applies a valid donation cohort", () => {
    setup({});
    fireEvent.change(screen.getByLabelText("Donasi sejak"), { target: { value: "2026-02-02" } });
    fireEvent.change(screen.getByLabelText("Sampai tanggal"), { target: { value: "2026-02-01" } });
    expect(screen.getByRole("button", { name: "Terapkan" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Sampai tanggal"), { target: { value: "2026-02-03" } });
    fireEvent.click(screen.getByRole("button", { name: "Terapkan" }));
    expect(useImpactDashboard).toHaveBeenLastCalledWith("2026-02-02", "2026-02-03");
  });
  it("links the admin overview to the protected impact page", () => {
    setup({}, { compact: true, admin: true });
    expect(screen.getByRole("link", { name: /Lihat dampak lengkap/ })).toHaveAttribute(
      "href",
      "/dashboard/admin/impact"
    );
    expect(screen.queryByLabelText("Donasi sejak")).not.toBeInTheDocument();
  });
});
