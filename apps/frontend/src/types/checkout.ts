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

export interface ValidatedVoucher {
  id: string;
  code: string;
  balance: number;
  expiry_date: string;
  days_until_expiry: number;
}

export interface AppliedVoucher {
  voucher_id: string;
  code: string;
  applied_amount: number;
  remaining_balance: number;
}

export interface EligibilityData {
  eligible_amount: number;
  ineligible_amount: number;
  total_amount: number;
  eligible_products: string[];
  ineligible_products: string[];
  voucher_can_cover: number;
}

export interface OrderSummary {
  cart_total: number;
  voucher_discount: number;
  cash_amount: number;
  items: CartItemData[];
  grouped_by_vendor: {
    [vendor_id: string]: CartItemData[];
  };
  applied_voucher: AppliedVoucher | null;
}

export interface CheckoutState {
  currentStep: CheckoutStep;
  cartItems: CartItemData[];
  appliedVoucher: AppliedVoucher | null;
  validatedVoucher: ValidatedVoucher | null;
  eligibilityData: EligibilityData | null;
  orderSummary: OrderSummary | null;
  voucherBalance: number; // Real balance from API
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
  validateVoucher: (code: string, amount: number) => Promise<void>;
  applyVoucher: (voucherId: string, appliedAmount: number) => void;
  removeAppliedVoucher: () => void;
  checkEligibility: () => Promise<void>;
  getOrderSummary: () => OrderSummary;
  submitOrder: () => Promise<string>;
  canProceedToNextStep: () => boolean;
  validateCurrentStep: () => boolean;
  clearError: () => void;
}
