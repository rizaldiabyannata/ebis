"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface OrderDetail {
  id: string;
  quantity: number;
  priceAtOrder: number;
  variant: {
    id: string;
    sku: string;
    name: string;
    product: {
      id: string;
      name: string;
    };
  };
}

interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  subtotal: number;
  totalDiscount: number;
  totalFinal: number;
  voucher: { code: string } | null;
  orderDetails: OrderDetail[];
  payments: Array<{
    id: string;
    paymentMethod: string;
    amount: number;
    paymentDate: string;
    status: string;
  }>;
}

interface Delivery {
  id: string;
  address: string;
  recipientName: string;
  recipientPhone: string;
  driverName: string | null;
  deliveryFee: number;
  status: string;
  order: Order;
}

const statusColors = {
  PREPARING: "bg-yellow-100 text-yellow-800",
  ON_DELIVERY: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
} as const;

const statusOptions = [
  { value: "PREPARING", label: "Preparing" },
  { value: "ON_DELIVERY", label: "On Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = React.useState<Delivery[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [selectedDelivery, setSelectedDelivery] =
    React.useState<Delivery | null>(null);
  const [showDetails, setShowDetails] = React.useState(false);

  const loadDeliveries = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/deliveries", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.error || `Failed to load deliveries (${res.status})`
        );
      }
      const data: Delivery[] = await res.json();
      setDeliveries(data);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  const filtered = deliveries.filter((d) =>
    [
      d.order.orderNumber,
      d.recipientName,
      d.recipientPhone,
      d.address,
      d.status,
      d.driverName || "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const saveEditLocal = (id: string, partial: Partial<Delivery>) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...partial } : d))
    );
  };

  const persistEdit = async (id: string) => {
    const delivery = deliveries.find((d) => d.id === id);
    if (!delivery) return setEditingId(null);

    try {
      const { status, driverName } = delivery;
      const res = await fetch(`/api/deliveries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          ...(driverName && { driverName }),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.error || `Failed to update delivery (${res.status})`
        );
      }

      const updated: Delivery = await res.json();
      setDeliveries((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...updated } : d))
      );
      toast.success("Delivery updated successfully");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update delivery");
      // Reload to revert local edits if failed
      loadDeliveries();
    } finally {
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    // Reload to revert any local changes
    loadDeliveries();
  };

  const getStatusBadge = (status: string) => {
    const colorClass =
      statusColors[status as keyof typeof statusColors] ||
      "bg-gray-100 text-gray-800";
    return (
      <Badge variant="secondary" className={colorClass}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const showOrderDetails = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setShowDetails(true);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Card>
        <div className="p-4">
          <PageHeader
            title="Deliveries"
            description="Track and update deliveries and drivers."
            count={deliveries.length}
            actions={
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Input
                  placeholder="Search deliveries..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="sm:w-64"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadDeliveries}
                  disabled={loading}
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            }
          />
        </div>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="p-3 font-medium">Order Info</th>
                  <th className="p-3 font-medium">Delivery Details</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Driver</th>
                  <th className="p-3 font-medium w-[200px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-4 text-center text-muted-foreground"
                    >
                      {loading
                        ? "Loading deliveries..."
                        : "No deliveries found"}
                    </td>
                  </tr>
                )}
                {filtered.map((delivery) => {
                  const isEditing = editingId === delivery.id;
                  const order = delivery.order;

                  return (
                    <tr
                      key={delivery.id}
                      className="border-t hover:bg-muted/30"
                    >
                      <td className="p-3 align-top">
                        <div className="space-y-1">
                          <div className="font-medium">{order.orderNumber}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs">
                            Total: Rp{Number(order.totalFinal).toFixed(2)}
                          </div>
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={() => showOrderDetails(delivery)}
                          >
                            View Details
                          </Button>
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <div className="space-y-1 text-xs">
                          <div className="font-medium">
                            {delivery.recipientName}
                          </div>
                          <div>{delivery.recipientPhone}</div>
                          <div className="text-muted-foreground max-w-xs">
                            {delivery.address}
                          </div>
                          <div>
                            Fee: Rp{Number(delivery.deliveryFee).toFixed(2)}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        {isEditing ? (
                          <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            value={delivery.status}
                            onChange={(e) =>
                              saveEditLocal(delivery.id, {
                                status: e.target.value,
                              })
                            }
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          getStatusBadge(delivery.status)
                        )}
                      </td>
                      <td className="p-3 align-top">
                        {isEditing ? (
                          <Input
                            placeholder="Driver name"
                            value={delivery.driverName || ""}
                            onChange={(e) =>
                              saveEditLocal(delivery.id, {
                                driverName: e.target.value,
                              })
                            }
                          />
                        ) : (
                          <span className="text-sm">
                            {delivery.driverName || (
                              <span className="text-muted-foreground">
                                Not assigned
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={cancelEdit}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => persistEdit(delivery.id)}
                              >
                                Save
                              </Button>
                            </>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingId(delivery.id)}
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <AlertDialog open={showDetails} onOpenChange={setShowDetails}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Order Details - {selectedDelivery?.order.orderNumber}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {selectedDelivery && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Order Summary</h4>
                        <div className="space-y-1 text-sm">
                          <div>
                            Date:{" "}
                            {new Date(
                              selectedDelivery.order.orderDate
                            ).toLocaleString()}
                          </div>
                          <div>Status: {selectedDelivery.order.status}</div>
                          <div>
                            Subtotal: Rp
                            {Number(selectedDelivery.order.subtotal).toFixed(2)}
                          </div>
                          <div>
                            Discount: Rp
                            {Number(
                              selectedDelivery.order.totalDiscount
                            ).toFixed(2)}
                          </div>
                          <div className="font-medium">
                            Total: Rp
                            {Number(selectedDelivery.order.totalFinal).toFixed(
                              2
                            )}
                          </div>
                          {selectedDelivery.order.voucher && (
                            <div>
                              Voucher: {selectedDelivery.order.voucher.code}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Payment Info</h4>
                        <div className="space-y-1 text-sm">
                          {selectedDelivery.order.payments.map((payment) => (
                            <div key={payment.id}>
                              {payment.paymentMethod} - Rp
                              {Number(payment.amount).toFixed(2)} (
                              {payment.status})
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Order Items</h4>
                      <div className="space-y-2">
                        {selectedDelivery.order.orderDetails.map((detail) => (
                          <div
                            key={detail.id}
                            className="flex justify-between items-center text-sm border rounded p-2"
                          >
                            <div>
                              <div className="font-medium">
                                {detail.variant.product.name}
                              </div>
                              <div className="text-muted-foreground">
                                {detail.variant.name} ({detail.variant.sku}) ×{" "}
                                {detail.quantity}
                              </div>
                            </div>
                            <div className="font-medium">
                              Rp{Number(detail.priceAtOrder).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Delivery Information</h4>
                      <div className="space-y-1 text-sm">
                        <div>Recipient: {selectedDelivery.recipientName}</div>
                        <div>Phone: {selectedDelivery.recipientPhone}</div>
                        <div>Address: {selectedDelivery.address}</div>
                        <div>
                          Status: {getStatusBadge(selectedDelivery.status)}
                        </div>
                        <div>
                          Driver:{" "}
                          {selectedDelivery.driverName || "Not assigned"}
                        </div>
                        <div>
                          Delivery Fee: Rp
                          {Number(selectedDelivery.deliveryFee).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDetails(false)}>
              Close
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
