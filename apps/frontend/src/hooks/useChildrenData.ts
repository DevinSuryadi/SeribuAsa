import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getChildren, getLatestNutritionMeasurement } from "@/services/nutrition";
import { toast } from "sonner";
import type { Child, NutritionData, AsyncState } from "@/types";

interface UseChildrenDataReturn extends AsyncState<Child[]> {
  latestNutrition: NutritionData | null;
  selectedChild: Child | null;
  setSelectedChild: (child: Child | null) => void;
  refetch: () => Promise<void>;
}

export function useChildrenData(): UseChildrenDataReturn {
  const { user } = useAuth();
  const [data, setData] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [latestNutrition, setLatestNutrition] = useState<NutritionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [childrenData, nutritionData] = await Promise.all([
        getChildren(),
        getLatestNutritionMeasurement(user.id).catch(() => null),
      ]);

      const children = Array.isArray(childrenData) ? childrenData : [];
      setData(children);

      if (children.length > 0 && !selectedChild) {
        setSelectedChild(children[0]);
      }

      setLatestNutrition(nutritionData);
    } catch (err: any) {
      const errorMessage = err.message || "Gagal memuat data anak";
      setError(errorMessage);
      toast.error("Gagal memuat data anak", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedChild]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    latestNutrition,
    selectedChild,
    setSelectedChild,
    loading,
    error,
    refetch: fetchData,
  };
}
