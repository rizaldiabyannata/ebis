"use client";

import { useForm } from "react-hook-form";
import { use } from "react";
import { mockProducts } from "@/lib/mock-data";
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
  const product = mockProducts.find((p) => p.id === id);
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      price: product?.price ?? 0,
      imageUrls: product?.imageUrls ?? [],
    },
  });

  if (!product) {
    notFound();
  }

  const handleSubmit = (values: any) => {
    // NOTE: Saat ini imageUrls berisi Object URL (blob:...) hasil dari Input File.
    // Untuk produksi: lakukan upload ke storage/CDN lalu ganti array ini dengan URL permanen.
    const updatedProduct: Product = {
      id: product.id,
      name: values.name,
      description: values.description,
      price: values.price,
      imageUrls: values.imageUrls.filter((url: string) => url.trim() !== ""),
    };
    console.log("Saving product:", updatedProduct);

    const productIndex = mockProducts.findIndex((p) => p.id === product.id);
    if (productIndex !== -1) {
      mockProducts[productIndex] = updatedProduct;
    }

    toast.success("Product saved successfully!");
    router.push("/admin/products");
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
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
