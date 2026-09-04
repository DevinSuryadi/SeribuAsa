import useSWR from "swr";
import { useAuth } from "@/contexts/AuthContext";
import { getWalletBalance, getWalletTransactions } from "@/services/wallet";

export function useWalletBalance() {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    user?.id ? ["wallet-balance", user.id] : null,
    async () => {
      return await getWalletBalance();
    }
  );

  return {
    data,
    isLoading,
    error,
    mutate,
  };
}

export function useWalletTransactions() {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    user?.id ? ["wallet-transactions", user.id] : null,
    async () => {
      const response = await getWalletTransactions();
      return response.items || [];
    }
  );

  return {
    data: data || [],
    isLoading,
    error,
    mutate,
  };
}
