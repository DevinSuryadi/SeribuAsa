/**
 * Order Management Types
 * TypeScript interfaces for orders page and order data
 */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  category_name?: string;
  product_images?: string[];
}

export interface Order {
  id: string;
  user_id: string;
  vendor_id: string;
  status: OrderStatus;
  items: OrderItem[];
  cart_total: number;
  voucher_discount: number;
  cash_amount: number;
  created_at: string;
  updated_at: string;
  vendor_store_name?: string;
  notes?: string;
  applied_voucher?: {
    code: string;
    applied_amount: number;
  };
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface OrderFilters {
  status?: OrderStatus;
  page: number;
  page_size: number;
  date_from?: string;
  date_to?: string;
}
