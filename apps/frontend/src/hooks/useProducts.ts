/**
 * Product Hooks
 * Custom React hooks for product catalog management
 */

import { useState, useCallback, useEffect, useRef } from "react";
import * as productsService from "@/services/products";
import { toast } from "@/hooks/use-toast";

export interface Product {
  id: string;
  name: string;
  description?: string;
  category_id: string;
  price: number;
  voucher_price: number;
  stock_quantity: number;
  unit?: string;
  image_url?: string;
  vendor_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
}

export interface ProductFilter {
  page?: number;
  page_size?: number;
  category_id?: string;
  search?: string;
  vendor_id?: string;
  min_price?: string;
  max_price?: string;
  in_stock_only?: boolean;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track mounted state and abort signals for race condition prevention
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchProducts = useCallback(async (filters?: ProductFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productsService.getProducts(filters);
      if (isMountedRef.current) {
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : "Failed to fetch products";
        setError(message);
        toast.error(message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productsService.getCategories();
      if (isMountedRef.current) {
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : "Failed to fetch categories";
        setError(message);
        toast.error(message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const getProduct = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productsService.getProduct(id);
      setSelectedProduct(data as Product);
      return data as Product;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch product";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchProducts = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const data = await productsService.getProducts({ search: query });
      if (isMountedRef.current) {
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (isMountedRef.current && !(err instanceof Error && err.name === "AbortError")) {
        const message = err instanceof Error ? err.message : "Failed to search products";
        setError(message);
        toast.error(message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const createProduct = useCallback(
    async (data: {
      name: string;
      description?: string;
      category_id?: string;
      price: number;
      voucher_price: number;
      stock_quantity?: number;
      unit?: string;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await productsService.createProduct(data);
        toast.success("Product created successfully");
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create product";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateProduct = useCallback(
    async (
      id: string,
      data: Partial<{
        name: string;
        description: string;
        category_id: string;
        price: number;
        voucher_price: number;
        stock_quantity: number;
        unit: string;
      }>
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await productsService.updateProduct(id, data);
        toast.success("Product updated successfully");
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update product";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteProduct = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await productsService.deleteProduct(id);
      toast.success("Product deleted successfully");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete product";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    products,
    categories,
    selectedProduct,
    isLoading,
    error,
    fetchProducts,
    fetchCategories,
    getProduct,
    searchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
