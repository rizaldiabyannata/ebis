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

async function getOrders() {
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
  const orders = await getOrders();

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