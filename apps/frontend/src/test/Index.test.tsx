import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Index from "../pages/Index";

describe("Index Page", () => {
  it("renders the page", () => {
    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );
    expect(screen.getByText("NutriGuard")).toBeDefined();
  });
});
