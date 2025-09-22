"use client";

import { useForm } from "react-hook-form";
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
      price: 0,
      imageUrls: [] as string[],
    },
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/products/${id}`, { cache: "no-store" });
        if (res.status === 404) return notFound();
        if (!res.ok) throw new Error("Failed to load product");
        const data = await res.json();
        const mapped: Product = {
          id: data.id,
          name: data.name,
          description: data.description,
          price: data.variants[0] ? Number(data.variants[0].price) : 0,
          imageUrls: data.images?.map((img: any) => img.imageUrl) ?? [],
        };
        setProduct(mapped);
        form.reset({
          name: mapped.name,
          description: mapped.description,
          price: mapped.price,
          imageUrls: mapped.imageUrls,
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
    // NOTE: Saat ini imageUrls berisi Object URL (blob:...) hasil dari Input File.
    // Untuk produksi: lakukan upload ke storage/CDN lalu ganti array ini dengan URL permanen.
    if (!product) return;
    const updatedProduct: Product = {
      id: product.id,
      name: values.name,
      description: values.description,
      price: values.price,
      imageUrls: values.imageUrls.filter((url: string) => url.trim() !== ""),
    };
    try {
      const res = await fetch(`/api/products/${product!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updatedProduct.name,
          description: updatedProduct.description,
          // price and images are modelled across variants/images in backend;
          // for a full edit, you'd also send variants/images payloads and update those endpoints.
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
                name="price"
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
                name="imageUrls"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Images</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = e.target.files
                              ? Array.from(e.target.files)
                              : [];
                            const objectUrls = files.map((f) =>
                              URL.createObjectURL(f)
                            );
                            const merged = [...field.value, ...objectUrls];
                            field.onChange(merged);
                          }}
                        />
                        {field.value?.length > 0 && (
                          <div className="grid grid-cols-3 gap-3">
                            {field.value.map((url: string, index: number) => (
                              <div
                                key={index}
                                className="group relative rounded-md overflow-hidden border"
                              >
                                <img
                                  src={url}
                                  alt={`Image ${index + 1}`}
                                  className="h-28 w-full object-cover"
                                />
                                <button
                                  type="button"
                                  className="absolute top-1 right-1 inline-flex items-center justify-center rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 text-[11px]"
                                  onClick={() => {
                                    const filtered = field.value.filter(
                                      (_: string, i: number) => i !== index
                                    );
                                    field.onChange(filtered);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
