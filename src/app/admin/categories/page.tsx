"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/page-header";

interface Category {
  id: string;
  name: string;
}

export default function CategoriesPage() {
  const [items, setItems] = React.useState<Category[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categories", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data: Category[] = await res.json();
      setItems(data);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const add = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed to create (${res.status})`);
      }
      const created: Category = await res.json();
      setItems((prev) => [...prev, created]);
      setNewName("");
      toast.success("Category created");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create category");
    }
  };

  const update = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed to update (${res.status})`);
      }
      const updated: Category = await res.json();
      setItems((prev) => prev.map((c) => (c.id === id ? updated : c)));
      toast.success("Category updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update category");
      load();
    } finally {
      setEditingId(null);
    }
  };

  const del = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed to delete (${res.status})`);
      }
      setItems((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete category");
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Card>
        <div className="p-4">
          <PageHeader
            title="Categories"
            description="Organize products by category."
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
          <div className="grid gap-2 sm:grid-cols-3">
            <Input
              placeholder="New category name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Button type="button" onClick={add}>
              Add
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="p-2 font-medium">Name</th>
                  <th className="p-2 font-medium w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="p-4 text-center text-muted-foreground"
                    >
                      No categories
                    </td>
                  </tr>
                )}
                {filtered.map((c) => {
                  const editing = editingId === c.id;
                  return (
                    <tr key={c.id} className="border-t">
                      <td className="p-2">
                        {editing ? (
                          <Input
                            value={c.name}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((x) =>
                                  x.id === c.id
                                    ? { ...x, name: e.target.value }
                                    : x
                                )
                              )
                            }
                          />
                        ) : (
                          c.name
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
                              <Button
                                size="sm"
                                onClick={() => update(c.id, c.name)}
                              >
                                Save
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingId(c.id)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => del(c.id)}
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
