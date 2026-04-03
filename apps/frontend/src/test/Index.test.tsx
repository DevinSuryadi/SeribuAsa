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

// Import after mocking
import Index from "../pages/Index";

describe("Index Page", () => {
  it("renders the page", () => {
    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );
    // Use getAllByText since "SeribuAsa" appears multiple times on the page
    expect(screen.getAllByText(/SeribuAsa/).length).toBeGreaterThan(0);
  });
});
