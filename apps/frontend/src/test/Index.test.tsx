import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

// Mock gsap BEFORE any imports that use it
vi.mock("gsap", () => ({
  __esModule: true,
  default: {
    to: vi.fn(),
    from: vi.fn(),
    fromTo: vi.fn(),
    set: vi.fn(),
    timeline: vi.fn(() => ({ to: vi.fn(), from: vi.fn(), fromTo: vi.fn() })),
    registerPlugin: vi.fn(),
    context: vi.fn(() => ({ revert: vi.fn() })),
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  __esModule: true,
  ScrollTrigger: {
    create: vi.fn(),
    refresh: vi.fn(),
  },
}));

// Mock auth context to avoid AuthProvider requirement in tests
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    userRole: null,
    loading: false,
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    signUp: vi.fn(),
    signInAsDemo: vi.fn(),
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Import after mocking
import Index from "../pages/Index";

describe("Index Page", () => {
  it("renders the page", () => {
    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );
    expect(screen.getAllByText(/SeribuAsa/).length).toBeGreaterThan(0);
  });
});
