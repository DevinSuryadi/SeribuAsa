import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import DashboardLayout from "../DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));

describe("Dashboard sidebar", () => {
  it.each(["health_facility", "donor", "beneficiary", "vendor", "admin"])(
    "lets the %s role open its profile from the sidebar",
    (role) => {
      vi.mocked(useAuth).mockReturnValue({
        user: { email: "pengguna@example.org", fullName: "Pengguna" },
        userRole: role,
        signOut: vi.fn(),
      } as unknown as ReturnType<typeof useAuth>);

      render(
        <MemoryRouter initialEntries={["/dashboard/profile"]}>
          <DashboardLayout title="Profil" subtitle="Kelola data akun.">Konten</DashboardLayout>
        </MemoryRouter>,
      );

      const profileLinks = screen.getAllByRole("link", { name: "Profil" });
      expect(profileLinks.length).toBeGreaterThan(0);
      profileLinks.forEach((link) => expect(link).toHaveAttribute("href", "/dashboard/profile"));
    },
  );
});
