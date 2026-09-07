import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock window.matchMedia for jsdom environment
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver for jsdom environment
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}
Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Mock gsap for tests
vi.mock("gsap", () => ({
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
  ScrollTrigger: {
    create: vi.fn(),
    refresh: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
});
