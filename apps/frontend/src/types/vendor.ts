// Core Vendor Types
export interface Vendor {
  id: string;
  user_id: string;
  store_name: string;
  address?: string;
  phone?: string;
  status: VendorStatus;
  created_at: string;
}

export interface VendorOrder {
  id: string;
  vendor_id: string;
  customer_id: string;
  status: OrderStatus;
  total_amount: number;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product_name?: string;
}

export interface VendorProduct {
  id: string;
  vendor_id: string;
  name: string;
  description?: string;
  price: number;
  voucher_price: number;
  stock: number;
  unit: string;
  category: string;
  approval_status: ProductApprovalStatus;
  created_at: string;
  images?: string[];
}

export interface VendorWallet {
  balance: number;
  total_earnings: number;
  pending_amount: number;
  currency: string;
}

export interface Settlement {
  id: string;
  vendor_id: string;
  amount: number;
  status: SettlementStatus;
  bank_account?: BankAccount;
  processed_at?: string;
  created_at: string;
}

export interface BankAccount {
  bank_name: string;
  account_number: string;
  account_holder: string;
}

// Type Aliases
export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
export type ProductApprovalStatus = "pending" | "approved" | "rejected";
export type SettlementStatus = "pending" | "calculating" | "ready" | "processing" | "completed" | "failed";
export type VendorStatus = "active" | "inactive" | "pending";
