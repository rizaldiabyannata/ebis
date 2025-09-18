"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  createProductSchema,
  CreateProductRequest,
  ProductImageInput,
  ProductVariantInput,
} from "@/lib/validation";
import { toast } from "sonner";

type Category = { id: string; name: string };

export function CreateProductForm({
  onSuccess,
  onCancel,
}: {
  onSuccess?: (createdId: string) => void;
  onCancel?: () => void;
}) {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = React.useState(true);

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
                    <Textarea
                      rows={4}
                      placeholder="Short description..."
                      {...field}
                    />
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
              <div key={fieldItem.id} className="grid gap-3 md:grid-cols-5">
                <FormField
                  control={form.control}
                  name={`variants.${index}.name` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Variant name" {...field} />
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
                        <Input placeholder="SKU" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`variants.${index}.price` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`variants.${index}.stock` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
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
                <FormField
                  control={form.control}
                  name={`images.${index}.imageUrl` as const}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                    onClick={() => removeImage(index)}
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
