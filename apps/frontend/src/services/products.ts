import { apiFetch } from "./api";

export async function getCategories() {
  return apiFetch("/products/categories");
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
}) {
  const qs = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
  }
  const query = qs.toString();
  return apiFetch(`/products/${query ? `?${query}` : ""}`);
}

export async function getProduct(id: string) {
  return apiFetch(`/products/${id}`);
}

export async function createProduct(data: {
  name: string;
  description?: string;
  category_id?: string;
  price: number;
  voucher_price: number;
  stock_quantity?: number;
  unit?: string;
}) {
  return apiFetch("/products/", {
    method: "POST",
    body: JSON.stringify(data),
  });
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
  }
) {
  return apiFetch(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(id: string) {
  return apiFetch(`/products/${id}`, {
    method: "DELETE",
  });
}
