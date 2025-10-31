"use client";

import { useState, useEffect } from 'react';
import { Order, Delivery } from '@prisma/client';

export type OrderWithRelations = Order & {
  delivery: Delivery | null;
};

export function useOrders() {
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) {
          throw new Error('Gagal mengambil data pesanan');
        }
        const data: OrderWithRelations[] = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err as Error);
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, []);

  return { orders, isLoading, error };
}
