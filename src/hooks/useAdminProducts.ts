"use client";

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Product as CardProduct } from "@/components/product-card";

type ApiProduct = {
  id: string;
  name: string;
  description: string;
  images: { id: string; imageUrl: string; isMain: boolean }[];
  variants: {
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    imageUrl?: string | null;
  }[];
};

export function useAdminProducts() {
  const [products, setProducts] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CardProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch products (${res.status})`);
      const data: ApiProduct[] = await res.json();
      const mapped: CardProduct[] = data.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        imageUrls:
          p.variants && p.variants.length > 0
            ? (p.variants.map((v) => v.imageUrl).filter(Boolean) as string[])
            : [],
        variants: p.variants.map((v) => ({
          id: v.id,
          name: v.name,
          price: Number(v.price),
          stock: v.stock,
          sku: v.sku,
        })),
      }));
      setProducts(mapped);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const requestDelete = (productId: string) => {
    const target = products.find((p) => p.id === productId) || null;
    setDeleteTarget(target);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete");
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success("Product deleted");
      setDeleteTarget(null);
    } catch (e: unknown) {
      if (e instanceof Error) {
        toast.error(e.message);
      } else {
        toast.error("An unknown error occurred while deleting");
      }
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  return {
    products,
    loading,
    error,
    loadProducts,
    deleteTarget,
    deleting,
    requestDelete,
    confirmDelete,
    cancelDelete,
  };
}
