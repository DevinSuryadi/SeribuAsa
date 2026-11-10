import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PemantauanGizi from "../PemantauanGizi";
import { addDays, localIsoDate } from "@/lib/pregnancy";
import {
  addFamilyUnbornChild,
  getFamily,
  getFamilyChildren,
  getFamilyMeasurementHistory,
  getFamilyPrenatalHistory,
  type FamilyChild,
  type PrenatalMeasurement,
} from "@/services/facility-families";

vi.mock("@/components/dashboard/DashboardLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/components/prenatal/PrenatalGrowthCharts", () => ({ default: () => <div>Grafik kehamilan</div> }));
// A stable user object, as the real auth context provides, so data effects run once.
const authState = vi.hoisted(() => ({ user: { id: "facility-user" } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => authState }));
vi.mock("@/hooks/useStaggerChildren", () => ({ useStaggerChildren: () => ({ current: null }) }));
vi.mock("@/services/nutrition", () => ({
  addChild: vi.fn(), addMeasurement: vi.fn(), deleteMeasurement: vi.fn(),
  getChildren: vi.fn(), getMeasurementHistory: vi.fn(),
}));
vi.mock("@/services/facility-families", () => ({
  addFamilyChild: vi.fn(),
  addFamilyMeasurement: vi.fn(),
  addFamilyPrenatalMeasurement: vi.fn(),
  addFamilyUnbornChild: vi.fn(),
  getFamily: vi.fn(),
  getFamilyChildren: vi.fn(),
  getFamilyMeasurementHistory: vi.fn(),
  getFamilyPrenatalHistory: vi.fn(),
  recordFamilyChildBirth: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const today = localIsoDate();
const lastPeriod = addDays(today, -140);

const unbornChild: FamilyChild = {
  id: "child-1", family_id: "family-1", full_name: "Bayi Ny. Siti", status: "unborn",
  date_of_birth: null, gender: null, age_months: null, mother_name: "Siti",
  last_menstrual_period: lastPeriod, expected_birth_date: addDays(lastPeriod, 280),
  gestational_age_weeks: 20, birth_details_pending: true,
};

const kekCheck: PrenatalMeasurement = {
  id: "check-1", child_id: "child-1", measurement_date: today, gestational_age_weeks: 20,
  maternal_weight: 52, maternal_muac: 22, fundal_height: 20, fetal_heart_rate: 140,
  estimated_fetal_weight: null, classification: "kek_risk",
  findings: ["LiLA ibu di bawah 23,5 cm menunjukkan risiko kurang energi kronis (KEK)."],
  created_at: `${today}T02:00:00Z`,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/dashboard/health-facility/families/family-1/nutrition"]}>
      <Routes>
        <Route path="/dashboard/health-facility/families/:familyId/nutrition" element={<PemantauanGizi />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Pregnancy monitoring for facility families", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getFamily).mockResolvedValue({
      id: "family-1", health_facility_id: "facility-1", kk_number: "1234567890123456",
      head_name: "Keluarga A", created_at: "2026-11-01T00:00:00Z",
    });
    vi.mocked(getFamilyMeasurementHistory).mockResolvedValue({ measurements: [] });
    vi.mocked(getFamilyPrenatalHistory).mockResolvedValue({ child: unbornChild, measurements: [kekCheck] });
  });

  it("summarises a child in the womb with the latest antenatal check-up", async () => {
    vi.mocked(getFamilyChildren).mockResolvedValue([unbornChild]);
    renderPage();

    expect(await screen.findByText("Dalam kandungan · 20 minggu")).toBeInTheDocument();
    expect(await screen.findByText("Usia kehamilan 20 minggu")).toBeInTheDocument();
    expect(screen.getByText("Ibu Siti")).toBeInTheDocument();
    expect(screen.getByText(kekCheck.findings[0])).toBeInTheDocument();
    expect(screen.getByText("Riwayat Pemeriksaan Kehamilan")).toBeInTheDocument();
    expect(screen.getAllByText("Risiko KEK").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Input Pemeriksaan" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Catat Kelahiran" })).toBeInTheDocument();
    expect(getFamilyMeasurementHistory).not.toHaveBeenCalled();
  });

  it("registers a child in the womb from the mother's last menstrual period", async () => {
    const user = userEvent.setup();
    vi.mocked(getFamilyChildren).mockResolvedValue([]);
    vi.mocked(addFamilyUnbornChild).mockResolvedValue(unbornChild);
    renderPage();

    await user.click((await screen.findAllByRole("button", { name: "Tambah Anak dalam Kandungan" }))[0]);
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Nama Ibu"), "Siti");
    fireEvent.change(within(dialog).getByLabelText(/HPHT/), { target: { value: lastPeriod } });
    expect(within(dialog).getByText(/Usia kehamilan 20 minggu/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Tambah Anak dalam Kandungan" }));

    await waitFor(() => expect(addFamilyUnbornChild).toHaveBeenCalledWith("family-1", {
      mother_name: "Siti", last_menstrual_period: lastPeriod, full_name: undefined,
    }));
  });

  it("waits for birth details before toddler measurements once the due date has passed", async () => {
    const overdue: FamilyChild = {
      ...unbornChild, status: "born", date_of_birth: unbornChild.expected_birth_date, age_months: 0,
      gestational_age_weeks: null,
    };
    vi.mocked(getFamilyChildren).mockResolvedValue([overdue]);
    renderPage();

    expect(await screen.findByText("Data kelahiran belum lengkap")).toBeInTheDocument();
    for (const button of screen.getAllByRole("button", { name: "Input Pengukuran" })) {
      expect(button).toBeDisabled();
    }
    expect(screen.getByRole("button", { name: "Catat Kelahiran" })).toBeInTheDocument();
    expect(await screen.findByText("Riwayat Pemeriksaan Kehamilan")).toBeInTheDocument();
  });
});
