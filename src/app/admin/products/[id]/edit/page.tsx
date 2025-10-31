"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { use, useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Product } from "@/components/product-card";
import { toast } from "sonner";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import Image from "next/image";
import { PreOrderRuleEditor } from "@/components/admin/pre-order-rule-editor";

export default function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      preOrderRule: "",
      variants: [] as {
        name: string;
        price: number;
        stock: number;
        sku: string;
        imageUrl?: string | null;
      }[],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const [imageMeta, setImageMeta] = useState<
    Record<
      string,
      {
        fileName?: string;
        preview?: string;
        uploadedUrl?: string;
        uploading?: boolean;
      }
    >
  >({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/products/${id}`, { cache: "no-store" });
        if (res.status === 404) return notFound();
        if (!res.ok) throw new Error("Failed to load product");
        const data = await res.json();
        const mapped = {
          id: data.id,
          name: data.name,
          description: data.description,
          preOrderRule: data.preOrderRule ? JSON.stringify(data.preOrderRule) : "",
          variants: data.variants.map((v: any) => ({
            name: v.name,
            price: Number(v.price),
            stock: v.stock,
            sku: v.sku,
            imageUrl: v.imageUrl ?? null,
          })),
        };
        setProduct(mapped as any);
        form.reset({
          name: mapped.name,
          description: mapped.description,
          preOrderRule: mapped.preOrderRule,
          variants: mapped.variants,
        });

      } catch (e: any) {
        setErr(e?.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (!loading && !product) {
    notFound();
  }

  const handleSubmit = async (values: any) => {
    if (!product) return;
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          preOrderRule: values.preOrderRule ? JSON.parse(values.preOrderRule) : null,
          // Variants now own images; send the variants array directly. The
          // API will replace existing variants when provided.
          variants: values.variants,
        }),
      });
      if (!res.ok) throw new Error("Failed to save product");
      toast.success("Product saved successfully!");
      router.push("/admin/products");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-sm text-muted-foreground">Loading...</div>
          )}
          {err && <div className="text-sm text-red-600">{err}</div>}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="flex-1 space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. Classic Leather Jacket"
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
                      <SimpleEditor />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preOrderRule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pre-order Rule</FormLabel>
                    <FormControl>
                      <PreOrderRuleEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Variants</CardTitle>
                    <Button
                      type="button"
                      onClick={() =>
                        append({
                          name: "",
                          price: 0,
                          stock: 0,
                          sku: "",
                        })
                      }
                    >
                      Add Variant
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-5 gap-3 rounded-md border p-4"
                    >
                      <FormField
                        control={form.control}
                        name={`variants.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. Red, Large" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`variants.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                placeholder="e.g. 149.99"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`variants.${index}.stock`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                placeholder="e.g. 100"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`variants.${index}.sku`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SKU</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g. SKU-RED-LARGE"
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
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {/* Variant image upload */}
                      <div className="md:col-span-5">
                        {/** compute meta id so we can keep previews across renders */}
                        {(() => {
                          const metaId = `variant-${field.id}`;
                          return (
                            <FormField
                              control={form.control}
                              name={`variants.${index}.imageUrl`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Variant Image (Optional)
                                  </FormLabel>
                                  <FormControl>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const preview =
                                          URL.createObjectURL(file);
                                        setImageMeta((prev) => ({
                                          ...prev,
                                          [metaId]: {
                                            ...prev[metaId],
                                            fileName: file.name,
                                            preview,
                                            uploading: true,
                                          },
                                        }));
                                        const data = new FormData();
                                        data.append("file", file);
                                        try {
                                          const res = await fetch(
                                            "/api/upload",
                                            {
                                              method: "POST",
                                              body: data,
                                            }
                                          );
                                          if (!res.ok)
                                            throw new Error("Upload failed");
                                          const json = await res.json();
                                          form.setValue(
                                            `variants.${index}.imageUrl`,
                                            json.url,
                                            {
                                              shouldDirty: true,
                                              shouldValidate: true,
                                            }
                                          );
                                          setImageMeta((prev) => ({
                                            ...prev,
                                            [metaId]: {
                                              ...prev[metaId],
                                              uploadedUrl: json.url,
                                              uploading: false,
                                            },
                                          }));
                                          toast.success(
                                            `Variant image uploaded`
                                          );
                                        } catch (err) {
                                          setImageMeta((prev) => ({
                                            ...prev,
                                            [metaId]: {
                                              ...prev[metaId],
                                              uploading: false,
                                            },
                                          }));
                                          toast.error(
                                            `Upload failed: ${String(err)}`
                                          );
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  {imageMeta[metaId]?.preview ??
                                  form.watch(
                                    `variants.${index}.imageUrl` as const
                                  ) ??
                                  "" ? (
                                    <div className="flex items-center gap-3 mt-2">
                                      {(() => {
                                        const src =
                                          imageMeta[metaId]?.preview ??
                                          form.watch(
                                            `variants.${index}.imageUrl` as const
                                          ) ??
                                          "";
                                        if (!src) return null;
                                        if (
                                          typeof src === "string" &&
                                          (src.startsWith("blob:") ||
                                            src.startsWith("data:"))
                                        ) {
                                          return (
                                            <>
                                              {/* eslint-disable-next-line @next/next/no-img-element */}
                                              <img
                                                src={String(src)}
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
                                        {imageMeta[metaId]?.fileName ||
                                          "Uploaded"}
                                      </div>
                                      {imageMeta[metaId]?.uploading && (
                                        <div className="text-xs">
                                          Uploading...
                                        </div>
                                      )}
                                    </div>
                                  ) : null}
                                </FormItem>
                              )}
                            />
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              {/* Variant images are handled per-variant in the variants list below. Product-level images removed. */}
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
