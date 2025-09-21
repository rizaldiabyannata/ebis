"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [stats, setStats] = React.useState<{
    products: number;
    categories: number;
    vouchers: number;
    orders: number;
    deliveries: number;
    admins: number;
  } | null>(null);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load stats (${res.status})`);
      setStats(await res.json());
    } catch (e) {
      // ignore toast here to keep dashboard clean
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const items = [
    { key: "products", label: "Products", href: "/admin/products" },
    { key: "categories", label: "Categories", href: "/admin/categories" },
    { key: "vouchers", label: "Vouchers", href: "/admin/vouchers" },
    { key: "orders", label: "Orders", href: "/admin/orders" },
    { key: "deliveries", label: "Deliveries", href: "/admin/deliveries" },
    { key: "admins", label: "Admins", href: "/admin/users" },
  ] as const;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Card>
        <div className="p-4">
          <PageHeader
            title="Dashboard"
            description="Overview of your store at a glance."
            actions={
              <Button
                type="button"
                variant="outline"
                onClick={load}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
            }
          />
        </div>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <Link
                key={it.key}
                href={it.href}
                className="rounded-lg border p-4 hover:bg-muted/40 transition-colors"
              >
                <div className="text-sm text-muted-foreground">{it.label}</div>
                <div className="mt-1 text-2xl font-semibold">
                  {stats ? (stats as any)[it.key] : "–"}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
