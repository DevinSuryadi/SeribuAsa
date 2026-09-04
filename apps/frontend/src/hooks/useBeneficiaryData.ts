import useSWR from "swr";
import { useAuth } from "@/contexts/AuthContext";
import { getLatestFIESStatus, getLatestNutritionMeasurement } from "@/services/nutrition";
import { getMyChildrenRisk } from "@/services/stunting-risk";

export function useLatestFIESStatus() {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    user?.id ? ["fies-status", user.id] : null,
    async () => {
      try {
        return await getLatestFIESStatus(user!.id);
      } catch {
        return null;
      }
    }
  );

  return {
    data,
    isLoading,
    error,
    mutate,
  };
}

export function useLatestNutrition() {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    user?.id ? ["nutrition", user.id] : null,
    async () => {
      try {
        return await getLatestNutritionMeasurement(user!.id);
      } catch {
        return null;
      }
    }
  );

  return {
    data,
    isLoading,
    error,
    mutate,
  };
}

export function useStuntingRisk() {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    user?.id ? ["stunting-risk", user.id] : null,
    async () => {
      return await getMyChildrenRisk();
    }
  );

  return {
    data: data || [],
    isLoading,
    error: error ? (error instanceof Error ? error.message : "Gagal memuat prediksi") : null,
    mutate,
  };
}
