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
  ProductImageInput,
  ProductVariantInput,
} from "@/lib/validation";
import { toast } from "sonner";

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
}: {
  onSuccess?: (createdId: string) => void;
  onCancel?: () => void;
}) {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [partners, setPartners] = React.useState<Partner[]>([]);
  const [loadingCats, setLoadingCats] = React.useState(true);
  const [loadingPartners, setLoadingPartners] = React.useState(true);

  // Prepare form with Zod validation
  const form = useForm<CreateProductRequest>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      images: [{ imageUrl: "", isMain: true }] as ProductImageInput[],
      variants: [
        { name: "", sku: "", price: 0, stock: 0 },
      ] as ProductVariantInput[],
    },
    mode: "onChange",
  });

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
    update: updateImage,
  } = useFieldArray({ control: form.control, name: "images" });

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
        if (!res.ok)
          throw new Error(`Failed to load partners (${res.status})`);
        const data: Partner[] = await res.json();
        setPartners(data);
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load partners");
      } finally {
        setLoadingPartners(false);
      }
    })();
  }, []);

  // Ensure exactly one main image
  const setMainImage = (index: number) => {
    imageFields.forEach((_, i) => {
      const current = form.getValues(`images.${i}`);
      updateImage(i, { ...current, isMain: i === index });
    });
  };

  const onSubmit = async (values: CreateProductRequest) => {
    try {
      // If no image is set as main, set the first one.
      const mainCount = values.images.filter(
        (img: ProductImageInput) => img.isMain
      ).length;
      if (mainCount === 0 && values.images.length > 0) {
        values.images = values.images.map(
          (img: ProductImageInput, idx: number) => ({
            ...img,
            isMain: idx === 0,
          })
        );
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.error || `Failed to create product (${res.status})`
        );
      }
      const created = await res.json();
      toast.success("Product created successfully");
      onSuccess?.(created.id);
      form.reset();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create product");
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
                                uploadedUrl: json.url
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
                     {imageMeta[`variant-${fieldItem.id}`]?.preview || form.watch(`variants.${index}.imageUrl`) ? (
                      <div className="flex items-center gap-3 mt-2">
                        <img
                          src={
                            imageMeta[`variant-${fieldItem.id}`]?.preview ||
                            form.watch(`variants.${index}.imageUrl`)
                          }
                          alt="Variant preview"
                          className="h-12 w-12 rounded object-cover border"
                        />
                         <div className="text-xs text-muted-foreground">
                          {imageMeta[`variant-${fieldItem.id}`]?.fileName || 'Uploaded'}
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

        {/* Images */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>Images</CardTitle>
                <CardDescription>
                  Add images and choose one as the main image.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendImage({
                    imageUrl: "",
                    isMain: imageFields.length === 0,
                  })
                }
              >
                Add Image
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {imageFields.map((fieldItem, index) => (
              <div
                key={fieldItem.id}
                className="grid items-end gap-3 md:grid-cols-5"
              >
                <FormItem className="md:col-span-3 space-y-2">
                  <FormLabel>Upload Image</FormLabel>
                  <FormControl>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const id = fieldItem.id;
                        // Prepare local preview so it "stays" visible
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
                          if (!res.ok) {
                            const err = await res.json().catch(() => ({}));
                            throw new Error(
                              err?.error || `Upload failed (${res.status})`
                            );
                          }
                          const json = await res.json();
                          // Update only the imageUrl field to avoid remounting row
                          form.setValue(`images.${index}.imageUrl`, json.url, {
                            shouldDirty: true,
                          });
                          setImageMeta((prev) => ({
                            ...prev,
                            [id]: {
                              ...prev[id],
                              uploadedUrl: json.url,
                              uploading: false,
                            },
                          }));
                          toast.success("Image uploaded");
                        } catch (err: any) {
                          setImageMeta((prev) => ({
                            ...prev,
                            [id]: { ...prev[id], uploading: false },
                          }));
                          toast.error(err?.message ?? "Upload failed");
                        }
                      }}
                    />
                  </FormControl>
                  {/* Show a small preview and filename so the image "stays" visible */}
                  {imageMeta[fieldItem.id]?.preview ||
                  form.watch(`images.${index}.imageUrl`) ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          imageMeta[fieldItem.id]?.preview ||
                          form.watch(`images.${index}.imageUrl`)
                        }
                        alt="preview"
                        className="h-12 w-12 rounded object-cover border"
                      />
                      <div className="text-xs text-muted-foreground">
                        {imageMeta[fieldItem.id]?.fileName || "Uploaded"}
                      </div>
                      {imageMeta[fieldItem.id]?.uploading && (
                        <div className="text-xs">Uploading...</div>
                      )}
                    </div>
                  ) : null}
                </FormItem>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="main-image"
                      className="h-4 w-4 accent-primary"
                      checked={form.watch(`images.${index}.isMain`) || false}
                      onChange={() => setMainImage(index)}
                    />
                    Main
                  </label>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const id = fieldItem.id;
                      const meta = imageMeta[id];
                      if (meta?.preview) URL.revokeObjectURL(meta.preview);
                      setImageMeta((prev) => {
                        const next = { ...prev };
                        delete next[id];
                        return next;
                      });
                      removeImage(index);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            {imageFields.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No images added yet. Add at least one image.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit">Create Product</Button>
        </div>
      </form>
    </Form>
  );
}
