"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { OrderWithRelations } from "@/hooks/useOrders";

interface OrdersTableProps {
  orders: OrderWithRelations[];
}

export default function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID Pesanan</TableHead>
            <TableHead>Waktu Pemesanan</TableHead>
            <TableHead>Status Pesanan</TableHead>
            <TableHead>Status Pengiriman</TableHead>
            <TableHead>Pengirim</TableHead>
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
                {order.delivery ? order.delivery.driverName : "N/A"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
