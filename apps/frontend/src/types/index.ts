/**
 * Core Domain Types - Comprehensive type definitions for the entire application
 * This file contains all shared types to eliminate 'any' usage
 */

// ============================================
// USER & AUTH TYPES
// ============================================

export type UserRole =
  | "beneficiary"
  | "donor"
  | "vendor"
  | "admin"
  | "corporate_donor"
  | "government"
  | "unassigned";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface BackendProfile {
  full_name: string;
  role: UserRole | null;
  phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  gender: "male" | "female" | null;
}

// ============================================
// NUTRITION TYPES
// ============================================

export type Gender = "male" | "female";

export type NutritionClassification = "Normal" | "Kurang Gizi" | "Gizi Buruk" | "Obesitas";

export interface Child {
  id: string;
  full_name: string;
  date_of_birth: string;
  age_months: number;
  gender: Gender | null;
}

export interface Measurement {
  id: string;
  child_id: string;
  measurement_date: string;
  weight: number;
  height: number;
  muac: number | null;
  z_score_weight: number | null;
  z_score_height: number | null;
  classification: NutritionClassification;
}

export interface MeasurementHistory {
  measurements: Measurement[];
  child_info?: Child;
}

export interface NutritionData {
  child_id: string;
  child_name: string;
  measurement_date: string;
  weight: number;
  height: number;
  muac: number | null;
  z_score_weight: number | null;
  z_score_height: number | null;
  z_score_weight_height: number | null;
  classification: NutritionClassification;
}

export interface ZScoreCalculation {
  z_score_weight: number;
  z_score_height: number;
  classification: NutritionClassification;
}

// ============================================
// FIES (Food Insecurity Experience Scale) TYPES
// ============================================

export interface FIESResponse {
  [questionId: string]: number;
}

export interface FIESSurvey {
  id: string;
  beneficiary_id: string;
  survey_date: string;
  raw_score: number;
  probability_food_insecure: number;
  classification:
    | "Food Secure"
    | "Mildly Food Insecure"
    | "Moderately Food Insecure"
    | "Severely Food Insecure";
  responses: FIESResponse;
}

export interface FIESStatus {
  survey_date: string;
  classification: string;
  raw_score: number;
}

// ============================================
// ORDER TYPES (Extended from existing)
// ============================================

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
  image_url?: string;
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
  vendor_logo_url?: string;
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

// ============================================
// CART TYPES
// ============================================

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  max_quantity: number;
  image_url?: string;
  vendor_id: string;
  vendor_name: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
  item_count: number;
}

// ============================================
// PRODUCT TYPES
// ============================================

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url?: string;
  vendor_id: string;
  vendor_name: string;
  is_available: boolean;
  nutrients?: {
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
  };
}

// ============================================
// RECOMMENDATION TYPES
// ============================================

export interface NutritionRecommendation {
  id: string;
  title: string;
  description: string;
  category: "diet" | "supplement" | "activity" | "warning";
  priority: "high" | "medium" | "low";
  icon?: string;
}

export interface RecommendationsResponse {
  recommendations: NutritionRecommendation[];
  generated_at: string;
  based_on: {
    child_id?: string;
    latest_measurement_date?: string;
  };
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: "success" | "error";
}

export interface ApiErrorResponse {
  detail: string;
  message?: string;
  errors?: Record<string, string[]>;
}

// ============================================
// UTILITY TYPES
// ============================================

export type LoadingState = "idle" | "loading" | "success" | "error";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  description?: string;
  duration?: number;
}
