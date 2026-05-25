import type { SWRConfiguration } from "swr";
import { apiFetch } from "@/services/api";

/**
 * Default SWR configuration
 */
export const defaultSWRConfig: SWRConfiguration = {
  fetcher: (url: string) => apiFetch(url),
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  dedupingInterval: 5000,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  shouldRetryOnError: true,
};

/**
 * SWR Configuration untuk Admin Dashboard
 * Sesuaikan dengan backend cache TTL (2 menit)
 */
export const adminSWRConfig: SWRConfiguration = {
  ...defaultSWRConfig,
  refreshInterval: 120000, // 2 minutes - match backend cache TTL
  dedupingInterval: 10000, // 10 seconds
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
};

/**
 * SWR Configuration untuk real-time data (donations, orders)
 * Refresh lebih sering untuk data yang sering berubah
 */
export const realtimeSWRConfig: SWRConfiguration = {
  ...defaultSWRConfig,
  refreshInterval: 30000, // 30 seconds
  dedupingInterval: 5000,
};

/**
 * SWR Configuration untuk static data (users, products list)
 * Refresh jarang karena data jarang berubah
 */
export const staticSWRConfig: SWRConfiguration = {
  ...defaultSWRConfig,
  refreshInterval: 300000, // 5 minutes
  dedupingInterval: 30000, // 30 seconds
  revalidateOnFocus: false,
};
