/**
 * Checkout Flow Types
 * TypeScript interfaces for checkout page state and data
 */

export type CheckoutStep = 1 | 2 | 3 | 4;

export interface CartItemData {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  created_at: string;
  vendor_id: string;
}

export interface OrderSummary {
  cart_total: number;
  items: CartItemData[];
  grouped_by_vendor: {
    [vendor_id: string]: CartItemData[];
  };
}

export interface CheckoutState {
  currentStep: CheckoutStep;
  cartItems: CartItemData[];
  orderSummary: OrderSummary | null;
  walletBalance: number; // Available wallet balance from API
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  orderId: string | null;
}

export interface CheckoutContextType extends CheckoutState {
  setCurrentStep: (step: CheckoutStep) => void;
  loadCartItems: () => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeCartItem: (itemId: string) => Promise<void>;
  loadWalletBalance: () => Promise<void>;
  getOrderSummary: () => OrderSummary;
  submitOrder: () => Promise<string>;
  canProceedToNextStep: () => boolean;
  validateCurrentStep: () => boolean;
  clearError: () => void;
}
