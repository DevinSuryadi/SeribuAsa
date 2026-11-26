import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FamilyDetail from "../facility/FamilyDetail";
import { getFamily } from "@/services/facility-families";
import {
  getFamilyAssessment,
  getFamilyRecommendation,
  type FamilyAiRecommendation,
} from "@/services/facility-assessments";

vi.mock("@/components/dashboard/DashboardLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("../facility/FamilyForm", () => ({ default: () => null }));
vi.mock("@/services/facility-families", () => ({ getFamily: vi.fn() }));
vi.mock("@/services/facility-assessments", () => ({
  getFamilyAssessment: vi.fn(),
  getFamilyRecommendation: vi.fn(),
}));

const kek = "Risiko KEK (LiLA ibu < 23,5 cm)";
const balancedDiet = "Kebutuhan gizi seimbang harian (Isi Piringku)";

const recommendation: FamilyAiRecommendation = {
  priority: "high",
  model_version: "family-reco-v1-synthetic",
  weekly_budget: 200000,
  actions: [
    {
      key: "pmt_ibu_hamil", label: "Makanan tambahan (PMT) ibu hamil KEK",
      description: "Makanan tambahan tinggi energi dan protein untuk ibu hamil dengan LiLA di bawah 23,5 cm.",
      members: ["Bayi Ny. Siti"], member_reasons: [{ member: "Bayi Ny. Siti", reasons: [kek] }], sources: ["model"],
    },
    {
      key: "tinjau_akses_pangan", label: "Tinjau akses pangan keluarga", description: "Hasil FIES menunjukkan kerawanan pangan.",
      members: ["Keluarga"], member_reasons: [{ member: "Keluarga", reasons: ["Keluarga rawan pangan berat (FIES >= 6)"] }],
      sources: ["aturan_fies"],
    },
  ],
  food_groups: [
    {
      key: "protein_hewani", label: "Protein hewani", examples: "telur, ikan, ayam, daging", catalog_categories: ["protein"],
      level: 2, level_label: "prioritas", score: 4, share: 0.48, budget: 96000,
      members: [
        { member: "Bayi Ny. Siti", level: "prioritas", reasons: [kek] },
        { member: "Budi", level: "prioritas", reasons: ["Usia 6-11 bulan (awal MP-ASI)"] },
      ],
    },
    {
      key: "sayuran", label: "Sayuran", examples: "sayuran hijau dan berwarna", catalog_categories: ["sayuran"],
      level: 1, level_label: "dianjurkan", score: 2, share: 0.08, budget: 16000,
      members: [{ member: "Budi", level: "dianjurkan", reasons: [balancedDiet] }],
    },
    {
      key: "susu", label: "Susu dan olahannya", examples: "susu, yogurt", catalog_categories: ["susu"],
      level: 0, level_label: "tidak", score: 0, share: 0, budget: null, members: [],
    },
  ],
  data_checks: [{ key: "measurement_stale", label: "Ukur ulang pertumbuhan", member: "Budi" }],
  excluded_members: [{ member: "Kakak", reason: "Anak berusia 24 bulan ke atas tidak termasuk sasaran 1000 HPK." }],
  not_recommended: [{ category: "gula", reason: "Gula tambahan tidak dianjurkan untuk anak di bawah 2 tahun." }],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/dashboard/health-facility/families/family-1"]}>
      <Routes>
        <Route path="/dashboard/health-facility/families/:familyId" element={<FamilyDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Family detail AI recommendation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getFamily).mockResolvedValue({
      id: "family-1", health_facility_id: "facility-1", kk_number: "1234567890123456",
      head_name: "Keluarga A", created_at: "2026-11-01T00:00:00Z",
    });
    vi.mocked(getFamilyAssessment).mockResolvedValue({
      family_id: "family-1", fies: null, children: [], summary_text: "", suggested_priority: "unknown",
      has_assessment: false, recommendations: [],
    });
    vi.mocked(getFamilyRecommendation).mockResolvedValue(recommendation);
  });

  it("shows model actions with the reason for each family member", async () => {
    renderPage();

    const action = (await screen.findByRole("heading", { name: "Makanan tambahan (PMT) ibu hamil KEK" })).closest("li")!;
    expect(within(action).getByText("Model AI")).toBeInTheDocument();
    expect(within(action).getByText("Bayi Ny. Siti")).toBeInTheDocument();
    expect(within(action).getByText(`· ${kek}`, { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Hasil FIES")).toBeInTheDocument();
    // FIES thresholds are shown with proper comparison symbols.
    expect(screen.getByText("· Keluarga rawan pangan berat (FIES ≥ 6)", { exact: false })).toBeInTheDocument();
    // Missing data is listed as the first action.
    const dataCheck = screen.getByRole("heading", { name: "Ukur ulang pertumbuhan" }).closest("li")!;
    expect(within(dataCheck).getByText("Data")).toBeInTheDocument();
    expect(within(dataCheck).getByText("Data Budi belum lengkap, saran bisa kurang tepat.")).toBeInTheDocument();
    // The rule-based priority is not shown on this page.
    expect(screen.queryByText("Prioritas tinggi")).not.toBeInTheDocument();
  });

  it("lists only the food groups to buy with their share of the weekly quota", async () => {
    renderPage();

    const protein = (await screen.findByRole("heading", { name: /^Protein hewani/ })).closest("li")!;
    expect(within(protein).getByText("Prioritas")).toBeInTheDocument();
    // formatIDR puts a non-breaking space after "Rp"; the text matcher normalises it to a space.
    expect(within(protein).getByText(/^Rp\s96\.000$/)).toBeInTheDocument();
    expect(within(protein).getByText("48%")).toBeInTheDocument();
    expect(within(protein).getByText("Telur, ikan, ayam, daging")).toBeInTheDocument();
    expect(within(protein).getByText("Budi")).toBeInTheDocument();
    const vegetables = screen.getByRole("heading", { name: "Sayuran" }).closest("li")!;
    expect(within(vegetables).queryByText("Prioritas")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Susu dan olahannya/ })).not.toBeInTheDocument();
    expect(screen.getByText(/^Rp\s200\.000$/)).toBeInTheDocument();
    expect(screen.getByText(/Tidak dihitung: Kakak/)).toBeInTheDocument();
    expect(screen.getByText(/Hindari: Gula/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lihat katalog keluarga" })).toHaveAttribute(
      "href", "/dashboard/health-facility/families/family-1/catalog",
    );
  });
});
