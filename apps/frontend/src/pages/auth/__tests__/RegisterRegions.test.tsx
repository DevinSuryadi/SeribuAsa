import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Register from "../Register";
import { getProvinces, getRegencies } from "@/services/regions";

const { signUp } = vi.hoisted(() => ({ signUp: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ signUp, signInWithGoogle: vi.fn() }) }));
vi.mock("@/services/regions", () => ({ getProvinces: vi.fn(), getRegencies: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("Registration profile regions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    signUp.mockResolvedValue({ error: null, requiresManualLogin: true });
    vi.mocked(getProvinces).mockResolvedValue([{ code: "15", name: "Jambi" }]);
    vi.mocked(getRegencies).mockResolvedValue([{ code: "15.71", province_code: "15", name: "Kota Jambi" }]);
  });

  it.each(["vendor", "health_facility"])("submits the selected region for %s registration", async (role) => {
    const user = userEvent.setup();
    const { container } = render(<MemoryRouter initialEntries={[`/register?role=${role}`]}><Register /></MemoryRouter>);
    await screen.findByRole("option", { name: "Jambi" });
    await user.selectOptions(screen.getByLabelText("Provinsi"), "15");
    await screen.findByRole("option", { name: "Kota Jambi" });
    await user.selectOptions(screen.getByLabelText("Kota/kabupaten"), "15.71");
    await user.type(role === "vendor" ? screen.getByPlaceholderText("Masukkan nama") : screen.getByLabelText("Nama fasilitas kesehatan"), "Regional Account");
    await user.type(screen.getByPlaceholderText("nama@email.com"), "regional@example.org");
    const passwords = container.querySelectorAll<HTMLInputElement>('input[type="password"]');
    await user.type(passwords[0], "Password1!");
    await user.type(passwords[1], "Password1!");
    await user.click(screen.getByRole("button", { name: "Daftar" }));
    await waitFor(() => expect(signUp).toHaveBeenCalledWith("regional@example.org", "Password1!", "Regional Account", role, expect.objectContaining({ provinceCode: "15", regencyCode: "15.71" })));
  }, 10000);

  it("keeps region fields hidden for donors", async () => {
    render(<MemoryRouter initialEntries={["/register?role=donor"]}><Register /></MemoryRouter>);
    expect(screen.queryByLabelText("Provinsi")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Kota/kabupaten")).not.toBeInTheDocument();
  });
});
