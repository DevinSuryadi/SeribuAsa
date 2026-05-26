import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProducts,   getProduct, getCategories } from "../products";
import { apiFetch } from "../api";

// Mock apiFetch
vi.mock("../api", () => ({
  apiFetch: vi.fn(),
}));

describe("Product Service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getProducts", () => {
    it("should fetch all products with correct query params", async () => {
      const mockProducts = {
        items: [{ id: "prod_1", name: "Beras" }],
        total: 1,
        page: 1,
        page_size: 20,
        total_pages: 1
      };
      vi.mocked(apiFetch).mockResolvedValueOnce(mockProducts);

      const params = {
        category_id: "cat_1",
        search: "beras",
        in_stock_only: true,
      };

      const result = await getProducts(params);

      expect(apiFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/products\/\?category_id=cat_1&search=beras&in_stock_only=true/)
      );
      expect(result).toEqual(mockProducts);
    });

    it("should fetch products without params", async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce([]);

      await getProducts();
      expect(apiFetch).toHaveBeenCalledWith("/products/");
    });
  });

  describe("getProduct", () => {
    it("should fetch a specific product", async () => {
      const mockProduct = { id: "prod_1", name: "Beras", price: 15000 };
      vi.mocked(apiFetch).mockResolvedValueOnce(mockProduct);

      const result = await getProduct("prod_1");

      expect(apiFetch).toHaveBeenCalledWith("/products/prod_1");
      expect(result).toEqual(mockProduct);
    });
  });

  describe("getCategories", () => {
    it("should fetch all categories", async () => {
      const mockCategories = [
        { id: "cat_1", name: "Makanan Pokok" },
        { id: "cat_2", name: "Susu" },
      ];
      vi.mocked(apiFetch).mockResolvedValueOnce(mockCategories);

      const result = await getCategories();

      expect(apiFetch).toHaveBeenCalledWith("/products/categories");
      expect(result).toEqual(mockCategories);
    });
  });
});
