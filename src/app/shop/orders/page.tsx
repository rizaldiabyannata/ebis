"use client";

import SiteHeader from "@/components/SiteHeader";
import OrdersTable from "@/components/OrdersTable";
import { useOrders } from "@/hooks/useOrders";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersPage() {
  const { orders, isLoading, error } = useOrders();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Daftar Pesanan</h1>
        {isLoading ? (
          <div className="rounded-md border">
            <div className="p-4">
              <Skeleton className="h-8 w-1/2 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ) : error ? (
          <div className="text-red-500">
            Terjadi kesalahan: {error.message}
          </div>
        ) : (
          <OrdersTable orders={orders} />
        )}
      </main>
    </div>
  );
}
