"use client";

import * as React from "react";
import { ProductCard } from "@/components/product-card";
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
import { DeleteProductDialog } from "@/components/admin/DeleteProductDialog";
import { PlusIcon, RefreshCcwIcon } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { useAdminProducts } from "@/hooks/useAdminProducts";

export default function ProductsPage() {
  const {
    products,
    loading,
    error,
    loadProducts,
    deleteTarget,
    deleting,
    requestDelete,
    confirmDelete,
    cancelDelete,
  } = useAdminProducts();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingProductId, setEditingProductId] = React.useState<string | null>(
    null
  );
  const [editingInitial, setEditingInitial] = React.useState<any | null>(null);

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
                      key={editingProductId ?? "create"}
                      onSuccess={() => {
                        setCreateOpen(false);
                        setEditingProductId(null);
                        setEditingInitial(null);
                        loadProducts();
                      }}
                      onCancel={() => {
                        setCreateOpen(false);
                        setEditingProductId(null);
                        setEditingInitial(null);
                      }}
                      initialValues={editingInitial ?? undefined}
                      productId={editingProductId ?? undefined}
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
              onEdit={async (id: string) => {
                // load product detail and open sheet in edit mode
                try {
                  const res = await fetch(`/api/products/${id}`, {
                    cache: "no-store",
                  });
                  if (!res.ok) throw new Error("Failed to fetch product");
                  const data = await res.json();
                  // Map API product to CreateProductRequest shape
                  const initial = {
                    name: data.name,
                    description: data.description,
                    categoryId: data.categoryId ?? "",
                    partnerId: data.partnerId ?? undefined,
                    variants: data.variants.map((v: any) => ({
                      name: v.name,
                      sku: v.sku,
                      price: Number(v.price),
                      stock: v.stock,
                      imageUrl: v.imageUrl ?? undefined,
                    })),
                  };
                  setEditingProductId(id);
                  setEditingInitial(initial);
                  setCreateOpen(true);
                } catch (e: any) {
                  console.error(e);
                }
              }}
            />
          ))}
        </div>
      )}

      <DeleteProductDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && cancelDelete()}
        onConfirm={confirmDelete}
        product={deleteTarget}
        isDeleting={deleting}
      />
    </div>
  );
}
