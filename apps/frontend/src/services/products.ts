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

type ApiProduct = Partial<VendorProduct> & {
  category_id?: string | null;
  category_name?: string | null;
  stock_quantity?: number | string | null;
  price?: number | string;
  voucher_price?: number | string;
};

function toNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeProduct(product: ApiProduct): VendorProduct {
  const stock = toNumber(product.stock ?? product.stock_quantity);

  return {
    ...(product as VendorProduct),
    id: String(product.id || ""),
    vendor_id: String(product.vendor_id || ""),
    name: String(product.name || ""),
    price: toNumber(product.price),
    voucher_price: toNumber(product.voucher_price),
    stock,
    stock_quantity: stock,
    unit: product.unit || "pcs",
    category: String(product.category ?? product.category_id ?? ""),
    approval_status: product.approval_status || "pending",
    created_at: String(product.created_at || ""),
    images: Array.isArray(product.images) ? product.images : [],
  };
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
  if (res && res.items) {
    return {
      ...res,
      items: res.items.map((item: ApiProduct) => normalizeProduct(item)),
    };
  }

  const items = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
  return {
    items: items.map((item: ApiProduct) => normalizeProduct(item)),
    total: res?.total || 0,
    page: res?.page || params?.page || 1,
    page_size: res?.page_size || params?.page_size || 20,
    total_pages: res?.total_pages || 1,
  };
}

export async function getProduct(id: string): Promise<VendorProduct> {
  const res = await apiFetch(`/products/${id}`);
  return normalizeProduct(res?.data || res);
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
  return normalizeProduct(res?.data || res);
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
  return normalizeProduct(res?.data || res);
}

export async function deleteProduct(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/products/${id}`, {
    method: "DELETE",
  });
}
