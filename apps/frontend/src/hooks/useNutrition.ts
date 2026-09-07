/**
 * Nutrition Hooks
 * Custom React hooks for nutrition monitoring and child growth tracking
 */

import { useState, useCallback, useEffect, useRef } from "react";
import * as nutritionService from "@/services/nutrition";
import { toast } from "@/hooks/use-toast";

export interface Child {
  id: string;
  name: string;
  birth_date: string;
  gender: string;
  beneficiary_id: string;
  created_at?: string;
}

export interface Measurement {
  id: string;
  child_id: string;
  measurement_date: string;
  weight: number;
  height: number;
  muac?: number;
  z_score_weight?: number;
  z_score_height?: number;
  status?: string;
  notes?: string;
  created_at?: string;
}

export interface NutritionStatus {
  child_id: string;
  child_name: string;
  age_months: number;
  latest_weight: number;
  latest_height: number;
  weight_status: string;
  height_status: string;
  muac?: number;
  last_measurement_date?: string;
}

export interface ZScoreResult {
  weight_for_age: number;
  height_for_age: number;
  weight_for_height: number;
  classification: string;
}

export interface NutritionFilter {
  beneficiary_id?: string;
}

export function useNutrition() {
  const [children, setChildren] = useState<Child[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [nutritionStatus, setNutritionStatus] = useState<NutritionStatus | null>(null);
  const [zScoreResult, setZScoreResult] = useState<ZScoreResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track mounted state to prevent state updates on unmounted components
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchChildren = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await nutritionService.getChildren();
      if (isMountedRef.current) {
        setChildren(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : "Failed to fetch children";
        setError(message);
        toast.error(message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const addMeasurement = useCallback(
    async (data: {
      child_id: string;
      measurement_date: string;
      weight: number;
      height: number;
      muac?: number;
      notes?: string;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await nutritionService.addMeasurement(data);
        toast.success("Measurement added successfully");
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to add measurement";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const fetchMeasurementHistory = useCallback(async (childId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await nutritionService.getMeasurementHistory(childId);
      setMeasurements(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch measurement history";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateZScore = useCallback(
    async (data: { age_months: number; gender: string; weight: number; height: number }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await nutritionService.calculateZScore(data);
        setZScoreResult(result as ZScoreResult);
        return result as ZScoreResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to calculate Z-score";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getLatestStatus = useCallback(async (beneficiaryId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await nutritionService.getLatestNutritionMeasurement(beneficiaryId);
      setNutritionStatus(result as NutritionStatus);
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch latest nutrition status";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchLatestFIESStatus = useCallback(async (beneficiaryId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await nutritionService.getLatestFIESStatus(beneficiaryId);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch FIES status";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    children,
    measurements,
    nutritionStatus,
    zScoreResult,
    isLoading,
    error,
    fetchChildren,
    addMeasurement,
    fetchMeasurementHistory,
    calculateZScore,
    getLatestStatus,
    fetchLatestFIESStatus,
    clearError,
  };
}
