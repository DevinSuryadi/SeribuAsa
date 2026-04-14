import { apiFetch } from "./api";

// ============================================
// Cart Item Operations
// ============================================

export async function addToCart(data: { product_id: string; quantity: number }) {
  return apiFetch("/cart/items", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getCart() {
  return apiFetch("/cart");
}

export async function getCartSummary() {
  return apiFetch("/cart/summary");
}

export async function updateCartItem(itemId: string, data: { quantity: number }) {
  return apiFetch(`/cart/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function removeCartItem(itemId: string) {
  return apiFetch(`/cart/items/${itemId}`, {
    method: "DELETE",
  });
}

export async function clearCart() {
  return apiFetch("/cart/clear", {
    method: "DELETE",
  });
}

// ============================================
// Stock Validation
// ============================================

export async function validateStockForCheckout(productIds: string[]) {
  return apiFetch("/cart/validate-stock", {
    method: "POST",
    body: JSON.stringify({ product_ids: productIds }),
  });
}
