/**
 * Cart Store (Zustand)
 * Centralized state management for shopping cart
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as cartService from "@/services/cart";
import type { CartItemData } from "@/types/checkout";

interface CartStore {
  items: CartItemData[];
  isLoading: boolean;
  error: string | null;

  setItems: (items: CartItemData[]) => void;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCartStore: () => Promise<void>;

  getCartTotal: () => number;
  getItemCount: () => number;
  getGroupedByVendor: () => Record<string, CartItemData[]>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      setItems: (items) => set({ items }),

      fetchCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await cartService.getCart();
          set({ items: data.items || [], isLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to fetch cart";
          set({ error: message, isLoading: false });
        }
      },

      addItem: async (productId: string, quantity: number) => {
        set({ isLoading: true, error: null });
        try {
          await cartService.addToCart({ product_id: productId, quantity });
          await get().fetchCart();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to add item";
          set({ error: message, isLoading: false });
        }
      },

      updateItem: async (itemId: string, quantity: number) => {
        set({ isLoading: true, error: null });
        try {
          await cartService.updateCartItem(itemId, { quantity });
          await get().fetchCart();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to update item";
          set({ error: message, isLoading: false });
        }
      },

      removeItem: async (itemId: string) => {
        set({ isLoading: true, error: null });
        try {
          await cartService.removeCartItem(itemId);
          await get().fetchCart();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to remove item";
          set({ error: message, isLoading: false });
        }
      },

      clearCartStore: async () => {
        set({ isLoading: true, error: null });
        try {
          await cartService.clearCart();
          set({ items: [], isLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to clear cart";
          set({ error: message, isLoading: false });
        }
      },

      getCartTotal: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + Number(item.subtotal), 0);
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getGroupedByVendor: () => {
        const { items } = get();
        const grouped: Record<string, CartItemData[]> = {};
        items.forEach((item) => {
          const vendorId = (item as any).vendor_id || `vendor_${item.product_id}`;
          if (!grouped[vendorId]) grouped[vendorId] = [];
          grouped[vendorId].push(item);
        });
        return grouped;
      },
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
