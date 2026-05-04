/**
 * Voucher Hooks
 * Custom React hooks for voucher management and redemption
 */

import { useState, useCallback } from "react";
import * as vouchersService from "@/services/vouchers";
import { toast } from "@/hooks/use-toast";

export interface Voucher {
  id: string;
  code: string;
  balance: number;
  expiry_date: string;
  beneficiary_id: string;
  created_at?: string;
}

export interface VoucherBalance {
  total_balance: number;
  available_balance: number;
  pending_balance: number;
}

export interface VoucherTransaction {
  id: string;
  voucher_id: string;
  code: string;
  type: "debit" | "credit";
  amount: number;
  order_id?: string;
  transaction_date: string;
  description?: string;
}

export interface VoucherValidation {
  valid: boolean;
  voucher_id?: string;
  code?: string;
  balance?: number;
  expiry_date?: string;
  message?: string;
}

export interface EligibilityData {
  eligible_amount: number;
  ineligible_amount: number;
  total_amount: number;
  eligible_products: string[];
  ineligible_products: string[];
}

export interface TransactionFilter {
  beneficiary_id?: string;
  page?: number;
  page_size?: number;
  transaction_type?: string;
}

export function useVouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [balance, setBalance] = useState<VoucherBalance | null>(null);
  const [transactions, setTransactions] = useState<VoucherTransaction[]>([]);
  const [validation, setValidation] = useState<VoucherValidation | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async (beneficiaryId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await vouchersService.getVoucherBalance(beneficiaryId);
      setBalance(data as VoucherBalance);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch voucher balance";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (filters?: TransactionFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await vouchersService.getTransactionHistory(filters);
      setTransactions(Array.isArray((data as any)?.items) ? (data as any).items : []);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch transaction history";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateVoucher = useCallback(async (code: string, amount: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await vouchersService.validateVoucher({ code, amount });
      setValidation(data as VoucherValidation);
      if (!(data as VoucherValidation).valid) {
        toast.error((data as VoucherValidation).message || "Voucher validation failed");
      }
      return data as VoucherValidation;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to validate voucher";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const redeemVoucher = useCallback(
    async (data: { voucher_codes: string[]; amount: number; order_id: string }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await vouchersService.redeemVoucher(data);
        toast.success("Voucher redeemed successfully");
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to redeem voucher";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const checkEligibility = useCallback(async (productIds: string[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await vouchersService.checkProductEligibility(productIds);
      setEligibility(data as EligibilityData);
      return data as EligibilityData;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to check product eligibility";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const redeemSingleVoucher = useCallback(
    async (data: { code: string; amount: number; order_id: string }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await vouchersService.redeemSingleVoucher(data);
        toast.success("Voucher redeemed successfully");
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to redeem voucher";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const fetchAllowedCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await vouchersService.getAllowedVoucherCategories();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch allowed categories";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearValidation = useCallback(() => {
    setValidation(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchVouchers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await vouchersService.getVoucherHistory("");
      setVouchers(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch vouchers";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    vouchers,
    balance,
    transactions,
    validation,
    eligibility,
    isLoading,
    error,
    fetchVouchers,
    fetchBalance,
    fetchTransactions,
    validateVoucher,
    redeemVoucher,
    checkEligibility,
    redeemSingleVoucher,
    fetchAllowedCategories,
    clearValidation,
    clearError,
  };
}
