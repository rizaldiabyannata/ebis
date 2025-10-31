"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/page-header";

interface OrderDetail {
  id: string;
  quantity: number;
  priceAtOrder: number;
  variant: {
    id: string;
    sku: string;
    name: string;
    product: { id: string; name: string };
  };
}
interface Delivery {
  id: string;
  address: string;
  recipientName: string;
  recipientPhone: string;
  driverName: string | null;
  deliveryFee: number;
  status: string;
}
interface Payment {
  id: string;
  paymentMethod: string;
  amount: number;
  paymentDate: string;
  status: string;
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
  delivery: Delivery | null;
  payments: Payment[];
}

export default function OrdersPage() {
  const [items, setItems] = React.useState<Order[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [editingDeliveryId, setEditingDeliveryId] = React.useState<
    string | null
  >(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data: Order[] = await res.json();
      setItems(data);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter((o) =>
    [
      o.orderNumber,
      o.status,
      o.voucher?.code || "",
      o.delivery?.status || "",
      o.delivery?.driverName || "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const saveDelivery = async (
    deliveryId: string,
    partial: Partial<Delivery>
  ) => {
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.error || `Failed to update delivery (${res.status})`
        );
      }
      const updated = await res.json();
      setItems((prev) =>
        prev.map((o) =>
          o.delivery?.id === deliveryId ? { ...o, delivery: updated } : o
        )
      );
      toast.success("Delivery updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update delivery");
      load();
    } finally {
      setEditingDeliveryId(null);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Card>
        <div className="p-4">
          <PageHeader
            title="Orders"
            description="Review orders, deliveries, and payments."
            count={items.length}
            actions={
              <div className="flex gap-2 w-full md:w-auto">
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="sm:w-64"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={load}
                  disabled={loading}
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            }
          />
        </div>
        <CardContent className="space-y-6">
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="p-2 font-medium">Order</th>
                  <th className="p-2 font-medium">Summary</th>
                  <th className="p-2 font-medium">Delivery</th>
                  <th className="p-2 font-medium">Payments</th>
                  <th className="p-2 font-medium w-[200px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-4 text-center text-muted-foreground"
                    >
                      No orders
                    </td>
                  </tr>
                )}
                {filtered.map((o) => {
                  const d = o.delivery;
                  const isEditing = editingDeliveryId === d?.id;
                  return (
                    <tr key={o.id} className="border-t align-top">
                      <td className="p-2">
                        <div className="font-medium">{o.orderNumber}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(o.orderDate).toLocaleString()}
                        </div>
                        <div className="text-xs">Status: {o.status}</div>
                        {o.voucher && (
                          <div className="text-xs">
                            Voucher: {o.voucher.code}
                          </div>
                        )}
                        <div className="mt-2 space-y-1">
                          {o.orderDetails.map((od) => (
                            <div key={od.id} className="text-xs">
                              {od.variant.product.name} — {od.variant.name} (
                              {od.variant.sku}) × {od.quantity} @ Rp
                              {Number(od.priceAtOrder).toFixed(2)}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="text-xs">
                          Subtotal: Rp{o.subtotal.toFixed(2)}
                        </div>
                        <div className="text-xs">
                          Discount: Rp{o.totalDiscount.toFixed(2)}
                        </div>
                        <div className="text-xs font-medium">
                          Total: Rp{o.totalFinal.toFixed(2)}
                        </div>
                      </td>
                      <td className="p-2">
                        {!d ? (
                          <div className="text-xs text-muted-foreground">
                            No delivery
                          </div>
                        ) : (
                          <div className="space-y-1 text-xs">
                            <div>Address: {d.address}</div>
                            <div>
                              Recipient: {d.recipientName} ({d.recipientPhone})
                            </div>
                            <div>Fee: Rp{Number(d.deliveryFee).toFixed(2)}</div>
                            {isEditing ? (
                              <>
                                <select
                                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                  value={d.status}
                                  onChange={(e) =>
                                    setItems((prev) =>
                                      prev.map((x) =>
                                        x.id === o.id
                                          ? {
                                              ...x,
                                              delivery: {
                                                ...x.delivery!,
                                                status: e.target.value,
                                              },
                                            }
                                          : x
                                      )
                                    )
                                  }
                                >
                                  <option value="PREPARING">PREPARING</option>
                                  <option value="ON_DELIVERY">
                                    ON_DELIVERY
                                  </option>
                                  <option value="DELIVERED">DELIVERED</option>
                                  <option value="CANCELLED">CANCELLED</option>
                                </select>
                                <Input
                                  className="mt-1"
                                  placeholder="Driver name"
                                  value={d.driverName ?? ""}
                                  onChange={(e) =>
                                    setItems((prev) =>
                                      prev.map((x) =>
                                        x.id === o.id
                                          ? {
                                              ...x,
                                              delivery: {
                                                ...x.delivery!,
                                                driverName: e.target.value,
                                              },
                                            }
                                          : x
                                      )
                                    )
                                  }
                                />
                              </>
                            ) : (
                              <>
                                <div>Status: {d.status}</div>
                                <div>Driver: {d.driverName || "-"}</div>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="space-y-1 text-xs">
                          {o.payments.map((p) => (
                            <div key={p.id}>
                              {p.paymentMethod} — Rp
                              {Number(p.amount).toFixed(2)} (
                              {new Date(p.paymentDate).toLocaleString()}) [
                              {p.status}]
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          {d && (
                            <>
                              {isEditing ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingDeliveryId(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      saveDelivery(d.id!, {
                                        status: d.status,
                                        driverName: d.driverName || undefined,
                                      })
                                    }
                                  >
                                    Save
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingDeliveryId(d.id!)}
                                >
                                  Edit Delivery
                                </Button>
                              )}
                            </>
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
    </div>
  );
}
