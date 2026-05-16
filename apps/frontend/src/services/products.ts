import { apiFetch } from "./api";
import type { VendorProduct } from "@/types/vendor";

export interface ProductsResponse {
  items: VendorProduct[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Category {
  id: string;
  name: string;
}

export async function getCategories(): Promise<Category[]> {
  const res = await apiFetch("/products/categories");
  return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
}

export async function getProducts(params?: {
  page?: number;
  page_size?: number;
  category_id?: string;
  search?: string;
  vendor_id?: string;
  min_price?: string;
  max_price?: string;
  in_stock_only?: boolean;
}): Promise<ProductsResponse> {
  const qs = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
  }
  const query = qs.toString();
  const res = await apiFetch(`/products/${query ? `?${query}` : ""}`);
  // Normalize if different shape
  if (res && res.items) return res;
  return {
    items: Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []),
    total: res?.total || 0,
    page: res?.page || params?.page || 1,
    page_size: res?.page_size || params?.page_size || 20,
    total_pages: res?.total_pages || 1,
  };
}

export async function getProduct(id: string): Promise<VendorProduct> {
  const res = await apiFetch(`/products/${id}`);
  return res?.data || res;
}

export async function createProduct(data: {
  name: string;
  description?: string;
  category_id?: string;
  price: number;
  voucher_price: number;
  stock_quantity?: number;
  unit?: string;
  images?: string[];
}): Promise<VendorProduct> {
  const res = await apiFetch("/products/", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

export async function updateProduct(
  id: string,
  data: {
    name?: string;
    description?: string;
    category_id?: string;
    price?: number;
    voucher_price?: number;
    stock_quantity?: number;
    unit?: string;
    images?: string[];
  }
): Promise<VendorProduct> {
  const res = await apiFetch(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

export async function deleteProduct(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/products/${id}`, {
    method: "DELETE",
  });
}
