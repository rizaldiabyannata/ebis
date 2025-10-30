"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormField,
} from "@/components/ui/form";
import {
  createProductSchema,
  CreateProductRequest,
  ProductVariantInput,
} from "@/lib/validation";
import { toast } from "sonner";
import Image from "next/image";

// --- Currency & numeric helpers ---
const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

function parseRupiahInput(raw: string): number {
  // Remove anything except digits
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return 0;
  // Convert to number (no decimal for IDR)
  return Number(digits);
}

type Category = { id: string; name: string };
type Partner = { id: string; name: string };

export function CreateProductForm({
  onSuccess,
  onCancel,
  initialValues,
  productId,
}: {
  onSuccess?: (createdId: string) => void;
  onCancel?: () => void;
  /** If provided, the form will act in edit mode and submit to PUT /api/products/{productId} */
  initialValues?: Partial<CreateProductRequest>;
  productId?: string;
}) {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [partners, setPartners] = React.useState<Partner[]>([]);
  const [loadingCats, setLoadingCats] = React.useState(true);
  const [loadingPartners, setLoadingPartners] = React.useState(true);

  // Prepare form with Zod validation
  const form = useForm<CreateProductRequest>({
    resolver: zodResolver(createProductSchema),
    defaultValues: initialValues
      ? {
          name: initialValues.name ?? "",
          description: initialValues.description ?? "",
          categoryId: initialValues.categoryId ?? "",
          partnerId: initialValues.partnerId ?? undefined,
          variants:
            initialValues.variants && initialValues.variants.length > 0
              ? (initialValues.variants as ProductVariantInput[])
              : [{ name: "", sku: "", price: 0, stock: 0 }],
        }
      : {
          name: "",
          description: "",
          categoryId: "",
          variants: [
            { name: "", sku: "", price: 0, stock: 0 },
          ] as ProductVariantInput[],
        },
    mode: "onChange",
  });

  // Keep local preview/filename so the image 'stays' visible even if the file input re-renders
  const [imageMeta, setImageMeta] = React.useState<
    Record<
      string,
      {
        fileName?: string;
        preview?: string; // object URL
        uploadedUrl?: string; // server URL
        uploading?: boolean;
      }
    >
  >({});

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({ control: form.control, name: "variants" });

  // Fetch categories for selection
  React.useEffect(() => {
    (async () => {
      setLoadingCats(true);
      try {
        const res = await fetch("/api/categories", { cache: "no-store" });
        if (!res.ok)
          throw new Error(`Failed to load categories (${res.status})`);
        const data: Category[] = await res.json();
        setCategories(data);
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load categories");
      } finally {
        setLoadingCats(false);
      }
    })();
  }, []);

  React.useEffect(() => {
    (async () => {
      setLoadingPartners(true);
      try {
        const res = await fetch("/api/partners", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load partners (${res.status})`);
        const data: Partner[] = await res.json();
        setPartners(data);
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load partners");
      } finally {
        setLoadingPartners(false);
      }
    })();
  }, []);

  // Product-level images removed: variants own their images.

  const onSubmit = async (values: CreateProductRequest) => {
    try {
      const url = productId ? `/api/products/${productId}` : "/api/products";
      const method = productId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.error ||
            `Failed to ${productId ? "update" : "create"} product (${
              res.status
            })`
        );
      }
      const created = await res.json();
      toast.success(
        productId
          ? "Product updated successfully"
          : "Product created successfully"
      );
      onSuccess?.(created.id ?? productId ?? "");
      if (!productId) form.reset();
    } catch (e: any) {
      toast.error(
        e?.message ?? `Failed to ${productId ? "update" : "create"} product`
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Basic Info</CardTitle>
            <CardDescription>
              Set category, name, and description.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      disabled={loadingCats}
                      {...field}
                    >
                      <option value="" disabled>
                        {loadingCats
                          ? "Loading categories..."
                          : "Select a category"}
                      </option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="partnerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partner</FormLabel>
                  <FormControl>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      disabled={loadingPartners}
                      {...field}
                    >
                      <option value="" disabled>
                        {loadingPartners
                          ? "Loading partners..."
                          : "Select a partner"}
                      </option>
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Classic Leather Jacket"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <SimpleEditor
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Variants */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>Variants</CardTitle>
                <CardDescription>
                  Add one or more purchasable options.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendVariant({ name: "", sku: "", price: 0, stock: 0 })
                }
              >
                Add Variant
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {variantFields.map((fieldItem, index) => (
              <div
                key={fieldItem.id}
                className="grid gap-x-3 gap-y-4 md:grid-cols-5 rounded-lg border p-3"
              >
                {/* Variant Details */}
                <FormField
                  control={form.control}
                  name={`variants.${index}.name` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Red, Large" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`variants.${index}.sku` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="SKU-RED-LG" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`variants.${index}.price` as const}
                  render={({ field }) => {
                    const display = formatRupiah(field.value || 0);
                    return (
                      <FormItem>
                        <FormLabel>Price (Rp)</FormLabel>
                        <FormControl>
                          <Input
                            inputMode="numeric"
                            value={display}
                            onChange={(e) => {
                              const num = parseRupiahInput(e.target.value);
                              field.onChange(num);
                            }}
                            onBlur={(e) => {
                              // Ensure value is normalized (e.g., empty -> 0)
                              if (!field.value) field.onChange(0);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name={`variants.${index}.stock` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          value={field.value ?? 0}
                          onChange={(e) => {
                            // Remove non-digits
                            let raw = e.target.value.replace(/[^0-9]/g, "");
                            // Strip leading zeros (but allow single 0)
                            raw = raw.replace(/^0+(\d)/, "$1");
                            if (raw === "") raw = "0";
                            const num = Number(raw);
                            field.onChange(num);
                          }}
                          onBlur={() => {
                            if (field.value == null || isNaN(field.value))
                              field.onChange(0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeVariant(index)}
                  >
                    Remove
                  </Button>
                </div>
                {/* Variant Image Upload */}
                <div className="md:col-span-5">
                  <FormItem>
                    <FormLabel>Variant Image (Optional)</FormLabel>
                    <FormControl>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          const id = `variant-${fieldItem.id}`;
                          const preview = URL.createObjectURL(file);
                          setImageMeta((prev) => ({
                            ...prev,
                            [id]: {
                              ...prev[id],
                              fileName: file.name,
                              preview,
                              uploading: true,
                            },
                          }));

                          const data = new FormData();
                          data.append("file", file);

                          try {
                            const res = await fetch("/api/upload", {
                              method: "POST",
                              body: data,
                            });
                            if (!res.ok) throw new Error("Upload failed");

                            const json = await res.json();
                            form.setValue(
                              `variants.${index}.imageUrl`,
                              json.url,
                              { shouldDirty: true, shouldValidate: true }
                            );
                            setImageMeta((prev) => ({
                              ...prev,
                              [id]: {
                                ...prev[id],
                                uploading: false,
                                uploadedUrl: json.url,
                              },
                            }));
                            toast.success(`Variant image uploaded`);
                          } catch (err) {
                            setImageMeta((prev) => ({
                              ...prev,
                              [id]: { ...prev[id], uploading: false },
                            }));
                            toast.error(`Upload failed: ${err}`);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    {imageMeta[`variant-${fieldItem.id}`]?.preview ||
                    form.watch(`variants.${index}.imageUrl`) ? (
                      <div className="flex items-center gap-3 mt-2">
                        {(() => {
                          const src =
                            imageMeta[`variant-${fieldItem.id}`]?.preview ||
                            form.watch(`variants.${index}.imageUrl`);
                          if (!src) return null;
                          // next/image doesn't support blob/data urls, use native <img> for those
                          if (
                            typeof src === "string" &&
                            (src.startsWith("blob:") || src.startsWith("data:"))
                          ) {
                            return (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={src}
                                  alt="Variant preview"
                                  className="h-12 w-12 rounded object-cover border"
                                />
                              </>
                            );
                          }
                          return (
                            <Image
                              src={String(src)}
                              alt="Variant preview"
                              width={48}
                              height={48}
                              className="rounded object-cover border"
                            />
                          );
                        })()}
                        <div className="text-xs text-muted-foreground">
                          {imageMeta[`variant-${fieldItem.id}`]?.fileName ||
                            "Uploaded"}
                        </div>
                        {imageMeta[`variant-${fieldItem.id}`]?.uploading && (
                          <div className="text-xs">Uploading...</div>
                        )}
                      </div>
                    ) : null}
                  </FormItem>
                </div>
              </div>
            ))}
            {variantFields.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No variants yet. Add at least one variant.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product-level images removed: images are owned by variants (variant.imageUrl) */}

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit">
            {productId ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
