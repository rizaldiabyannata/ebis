"use client";

import * as React from "react";
import { ProductCard, Product as CardProduct } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { CreateProductForm } from "@/components/admin/create-product-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusIcon, RefreshCcwIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/page-header";

type ApiProduct = {
  id: string;
  name: string;
  description: string;
  images: { id: string; imageUrl: string; isMain: boolean }[];
  variants: {
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
  }[];
};

export default function ProductsPage() {
  const [products, setProducts] = React.useState<CardProduct[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<CardProduct | null>(
    null
  );
  const [deleting, setDeleting] = React.useState(false);

  const loadProducts = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch products (${res.status})`);
      const data: ApiProduct[] = await res.json();
      const mapped: CardProduct[] = data.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        imageUrls:
          p.images.length > 0 ? p.images.map((img) => img.imageUrl) : [],
        variants: p.variants.map((v) => ({
          id: v.id,
          name: v.name,
          price: Number(v.price),
          stock: v.stock,
          sku: v.sku,
        })),
      }));
      setProducts(mapped);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const requestDelete = (productId: string) => {
    const target = products.find((p) => p.id === productId) || null;
    setDeleteTarget(target);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete");
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success("Product deleted");
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div>
        <PageHeader
          title="Products"
          description="Manage your products, variants, and images."
          count={products.length}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={loadProducts}
                aria-label="Refresh products"
              >
                <RefreshCcwIcon className="mr-2 size-4" /> Refresh
              </Button>
              <Sheet open={createOpen} onOpenChange={setCreateOpen}>
                <SheetTrigger asChild>
                  <Button type="button" size="sm">
                    <PlusIcon className="mr-2 size-4" /> Add Product
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-[95vw] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Create Product</SheetTitle>
                    <SheetDescription>
                      Fill the form below to add a new product. You can add
                      variants and images.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="h-full overflow-auto p-4">
                    <CreateProductForm
                      onSuccess={() => {
                        setCreateOpen(false);
                        loadProducts();
                      }}
                      onCancel={() => setCreateOpen(false)}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          }
        />
      </div>
      <Separator />

      {/* Content */}
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Failed to load products: {error}
        </div>
      )}

      {loading ? (
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4">
              <Skeleton className="mb-3 aspect-video w-full rounded-md" />
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border p-8 text-center">
          <div className="mb-2 text-lg font-medium">No products yet</div>
          <p className="mb-4 max-w-sm text-sm text-muted-foreground">
            Get started by creating your first product. You can add variants and
            images later.
          </p>
          <Sheet open={createOpen} onOpenChange={setCreateOpen}>
            <SheetTrigger asChild>
              <Button type="button">
                <PlusIcon className="mr-2 size-4" /> Add Product
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[95vw] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Create Product</SheetTitle>
                <SheetDescription>
                  Fill the form below to add a new product. You can add variants
                  and images.
                </SheetDescription>
              </SheetHeader>
              <div className="h-full overflow-auto p-4">
                <CreateProductForm
                  onSuccess={() => {
                    setCreateOpen(false);
                    loadProducts();
                  }}
                  onCancel={() => setCreateOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isAdmin={true}
              onDelete={requestDelete}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  Are you sure you want to delete "
                  {deleteTarget.name || "this product"}"? This action cannot be
                  undone.
                </>
              ) : (
                <>
                  Are you sure you want to delete this product? This action
                  cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2Icon className="mr-2 size-4" />
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
