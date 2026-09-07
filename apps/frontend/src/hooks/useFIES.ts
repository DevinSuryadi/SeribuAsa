/**
 * FIES Survey Hooks
 * Custom React hooks for Food Insecurity Experience Scale survey management
 */

import { useState, useCallback, useEffect, useRef } from "react";
import * as fiesService from "@/services/fies";
import { toast } from "@/hooks/use-toast";

export interface FIESResponse {
  question_id: string;
  value: number;
}

export interface FIESData {
  responses: Record<string, number>;
  survey_date?: string;
}

export interface FIESResult {
  score: number;
  classification: string;
  level: "severe" | "moderate" | "mild" | "none";
}

export interface FIESHistoryEntry {
  id: string;
  beneficiary_id: string;
  score: number;
  classification: string;
  survey_date: string;
  created_at: string;
}

export interface FIESHistoryResponse {
  history: FIESHistoryEntry[];
  total: number;
  page: number;
  page_size: number;
}

export function useFIES() {
  const [fiesData, setFiesData] = useState<FIESResult | null>(null);
  const [fiesHistory, setFiesHistory] = useState<FIESHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track mounted state to prevent state updates on unmounted components
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const submitSurvey = useCallback(async (data: FIESData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fiesService.submitFies(data);
      if (isMountedRef.current) {
        setFiesData(result as FIESResult);
      }
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : "Failed to submit FIES survey";
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

  const calculateScore = useCallback(async (responses: Record<string, number>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fiesService.calculateFies(responses);
      if (isMountedRef.current) {
        setFiesData(result as FIESResult);
        return result as FIESResult;
      }
      return null;
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : "Failed to calculate FIES score";
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

  const getHistory = useCallback(async (beneficiaryId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fiesService.getFiesHistory(beneficiaryId);
      if (isMountedRef.current && Array.isArray(data)) {
        setFiesHistory(data);
      }
      return data;
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : "Failed to fetch FIES history";
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

  const getLatestStatus = useCallback(async (beneficiaryId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fiesService.getFiesHistory(beneficiaryId);
      if (isMountedRef.current && Array.isArray(result) && result.length > 0) {
        const latest = result[0];
        setFiesData({
          score: latest.score,
          classification: latest.classification,
          level: mapClassificationToLevel(latest.classification),
        });
        return latest;
      }
      return null;
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : "Failed to fetch latest FIES status";
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

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    fiesData,
    fiesHistory,
    isLoading,
    error,
    submitSurvey,
    calculateScore,
    getHistory,
    getLatestStatus,
    clearError,
  };
}

function mapClassificationToLevel(classification: string): "severe" | "moderate" | "mild" | "none" {
  const lower = classification.toLowerCase();
  if (lower.includes("severe")) return "severe";
  if (lower.includes("moderate")) return "moderate";
  if (lower.includes("mild")) return "mild";
  return "none";
}
