"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/page-header";

interface Voucher {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | string;
  discountValue: number;
  validUntil: string;
  stock: number;
}

export default function VouchersPage() {
  const [items, setItems] = React.useState<Voucher[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [newVoucher, setNewVoucher] = React.useState({
    code: "",
    discountType: "PERCENTAGE" as Voucher["discountType"],
    discountValue: 0,
    validUntil: "",
    stock: 0,
  });
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vouchers", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data: Voucher[] = await res.json();
      setItems(data);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter((v) =>
    [
      v.code,
      v.discountType,
      String(v.discountValue),
      v.validUntil,
      String(v.stock),
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const add = async () => {
    if (!newVoucher.code.trim() || !newVoucher.validUntil) return;
    try {
      const res = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newVoucher.code.trim(),
          discountType: newVoucher.discountType,
          discountValue: Number(newVoucher.discountValue),
          validUntil: newVoucher.validUntil,
          stock: Number(newVoucher.stock),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed to create (${res.status})`);
      }
      const created: Voucher = await res.json();
      setItems((prev) => [...prev, created]);
      setNewVoucher({
        code: "",
        discountType: "PERCENTAGE",
        discountValue: 0,
        validUntil: "",
        stock: 0,
      });
      toast.success("Voucher created");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create voucher");
    }
  };

  const update = async (v: Voucher) => {
    try {
      const res = await fetch(`/api/vouchers/${v.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: v.code,
          discountType: v.discountType,
          discountValue: Number(v.discountValue),
          validUntil: v.validUntil,
          stock: Number(v.stock),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed to update (${res.status})`);
      }
      const updated: Voucher = await res.json();
      setItems((prev) => prev.map((x) => (x.id === v.id ? updated : x)));
      toast.success("Voucher updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update voucher");
      load();
    } finally {
      setEditingId(null);
    }
  };

  const del = async (id: string) => {
    try {
      const res = await fetch(`/api/vouchers/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed to delete (${res.status})`);
      }
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast.success("Voucher deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete voucher");
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Card>
        <div className="p-4">
          <PageHeader
            title="Vouchers"
            description="Manage discount vouchers and availability."
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
          <div className="grid gap-2 sm:grid-cols-6">
            <Input
              placeholder="Code"
              value={newVoucher.code}
              onChange={(e) =>
                setNewVoucher((nu) => ({ ...nu, code: e.target.value }))
              }
            />
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={newVoucher.discountType}
              onChange={(e) =>
                setNewVoucher((nu) => ({ ...nu, discountType: e.target.value }))
              }
            >
              <option value="PERCENTAGE">PERCENTAGE</option>
              <option value="FIXED_AMOUNT">FIXED_AMOUNT</option>
            </select>
            <Input
              type="number"
              step="0.01"
              placeholder="Discount Value"
              value={newVoucher.discountValue}
              onChange={(e) =>
                setNewVoucher((nu) => ({
                  ...nu,
                  discountValue: Number(e.target.value),
                }))
              }
            />
            <Input
              type="datetime-local"
              placeholder="Valid Until"
              value={newVoucher.validUntil}
              onChange={(e) =>
                setNewVoucher((nu) => ({ ...nu, validUntil: e.target.value }))
              }
            />
            <Input
              type="number"
              placeholder="Stock"
              value={newVoucher.stock}
              onChange={(e) =>
                setNewVoucher((nu) => ({
                  ...nu,
                  stock: Number(e.target.value),
                }))
              }
            />
            <Button type="button" onClick={add}>
              Add
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="p-2 font-medium">Code</th>
                  <th className="p-2 font-medium">Type</th>
                  <th className="p-2 font-medium">Value</th>
                  <th className="p-2 font-medium">Valid Until</th>
                  <th className="p-2 font-medium">Stock</th>
                  <th className="p-2 font-medium w-[180px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-4 text-center text-muted-foreground"
                    >
                      No vouchers
                    </td>
                  </tr>
                )}
                {filtered.map((v) => {
                  const editing = editingId === v.id;
                  return (
                    <tr key={v.id} className="border-t">
                      <td className="p-2">
                        {editing ? (
                          <Input
                            value={v.code}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((x) =>
                                  x.id === v.id
                                    ? { ...x, code: e.target.value }
                                    : x
                                )
                              )
                            }
                          />
                        ) : (
                          v.code
                        )}
                      </td>
                      <td className="p-2">
                        {editing ? (
                          <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            value={v.discountType}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((x) =>
                                  x.id === v.id
                                    ? { ...x, discountType: e.target.value }
                                    : x
                                )
                              )
                            }
                          >
                            <option value="PERCENTAGE">PERCENTAGE</option>
                            <option value="FIXED_AMOUNT">FIXED_AMOUNT</option>
                          </select>
                        ) : (
                          v.discountType
                        )}
                      </td>
                      <td className="p-2">
                        {editing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={v.discountValue}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((x) =>
                                  x.id === v.id
                                    ? {
                                        ...x,
                                        discountValue: Number(e.target.value),
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        ) : (
                          v.discountValue
                        )}
                      </td>
                      <td className="p-2">
                        {editing ? (
                          <Input
                            type="datetime-local"
                            value={v.validUntil}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((x) =>
                                  x.id === v.id
                                    ? { ...x, validUntil: e.target.value }
                                    : x
                                )
                              )
                            }
                          />
                        ) : (
                          new Date(v.validUntil).toLocaleString()
                        )}
                      </td>
                      <td className="p-2">
                        {editing ? (
                          <Input
                            type="number"
                            value={v.stock}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((x) =>
                                  x.id === v.id
                                    ? { ...x, stock: Number(e.target.value) }
                                    : x
                                )
                              )
                            }
                          />
                        ) : (
                          v.stock
                        )}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          {editing ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </Button>
                              <Button size="sm" onClick={() => update(v)}>
                                Save
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingId(v.id)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => del(v.id)}
                              >
                                Delete
                              </Button>
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
