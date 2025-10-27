export const dynamic = "force-dynamic";

import SiteHeader from "@/components/SiteHeader";
import prisma from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type {
  Order as PrismaOrder,
  Delivery as PrismaDelivery,
} from "@prisma/client";

// Local shapes used to avoid direct Prisma type coupling in the UI layer
type DeliveryForClient = {
  recipientName?: string | null;
  recipientPhone?: string | null;
  status?: string | null;
};

type OrderForClient = {
  id: string;
  orderNumber: string;
  orderDate: string; // ISO string for safe rendering
  status: string;
  delivery?: DeliveryForClient | null;
};

async function getOrders(): Promise<
  (PrismaOrder & { delivery: PrismaDelivery | null })[]
> {
  const orders = await prisma.order.findMany({
    include: {
      delivery: true,
    },
    orderBy: {
      orderDate: "desc",
    },
  });
  return orders;
}

export default async function OrdersPage() {
  const ordersData = await getOrders();

  // Normalize data for the client: convert Date -> ISO string
  const orders: OrderForClient[] = ordersData.map(
    (o: PrismaOrder & { delivery: PrismaDelivery | null }) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      orderDate: new Date(o.orderDate).toISOString(),
      status: o.status,
      delivery: o.delivery
        ? {
            recipientName: o.delivery.recipientName,
            recipientPhone: o.delivery.recipientPhone,
            status: o.delivery.status,
          }
        : null,
    })
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Daftar Pesanan</h1>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Pesanan</TableHead>
                <TableHead>Waktu Pemesanan</TableHead>
                <TableHead>Status Pesanan</TableHead>
                <TableHead>Status Pengiriman</TableHead>
                <TableHead>Nama Penerima</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell>
                    {new Date(order.orderDate).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {order.delivery ? (
                      <Badge variant="secondary">{order.delivery.status}</Badge>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>
                    {order.delivery ? order.delivery.recipientName : "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
