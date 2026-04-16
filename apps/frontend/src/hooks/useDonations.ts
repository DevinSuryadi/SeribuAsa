/**
 * Donation Hooks
 * Custom React hooks for donation data management
 */

import { useState, useCallback, useEffect, useRef } from "react";
import * as donationsService from "@/services/donations";
import { toast } from "@/hooks/use-toast";

export interface Donation {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  payment_method: string;
  status: string;
  created_at: string;
}

export interface DonationFilter {
  status?: string;
  page?: number;
  page_size?: number;
}

export interface ImpactMetrics {
  total_donated: number;
  meals_provided: number;
  beneficiaries_reached: number;
}

export interface DashboardMetrics {
  total_donations: number;
  total_amount: number;
  monthly_donations: number;
  monthly_amount: number;
}

export function useDonations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [impactMetrics, setImpactMetrics] = useState<ImpactMetrics | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if component is mounted to prevent state updates on unmounted components
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchDonations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await donationsService.getDonations();
      if (isMountedRef.current) {
        setDonations(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : "Failed to fetch donations";
        setError(message);
        toast.error(message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const fetchImpactMetrics = useCallback(async (donorId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await donationsService.getImpactMetrics(donorId);
      if (isMountedRef.current) {
        setImpactMetrics(data as ImpactMetrics);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : "Failed to fetch impact metrics";
        setError(message);
        toast.error(message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const fetchDashboardMetrics = useCallback(async (donorId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await donationsService.getDashboardMetrics(donorId);
      if (isMountedRef.current) {
        setDashboardMetrics(data as DashboardMetrics);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : "Failed to fetch dashboard metrics";
        setError(message);
        toast.error(message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const getDonation = useCallback(async (donationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await donationsService.getDonation(donationId);
      if (isMountedRef.current) {
        return data as Donation;
      }
      return null;
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : "Failed to fetch donation";
        setError(message);
        toast.error(message);
      }
      return null;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const createDonation = useCallback(
    async (data: { amount: number; type: string; payment_method: string }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await donationsService.createDonation(data);
        if (isMountedRef.current) {
          toast.success("Donation created successfully");
        }
        return result;
      } catch (err) {
        if (isMountedRef.current) {
          const message = err instanceof Error ? err.message : "Failed to create donation";
          setError(message);
          toast.error(message);
        }
        return null;
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  const simulatePayment = useCallback(async (donationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await donationsService.simulatePayment(donationId);
      if (isMountedRef.current) {
        toast.success("Payment simulated successfully");
      }
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : "Failed to simulate payment";
        setError(message);
        toast.error(message);
      }
      return null;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  return {
    donations,
    impactMetrics,
    dashboardMetrics,
    isLoading,
    error,
    fetchDonations,
    fetchImpactMetrics,
    fetchDashboardMetrics,
    getDonation,
    createDonation,
    simulatePayment,
  };
}
