"use client";

import { useForm } from "react-hook-form";
import { use } from "react";
import { mockProducts } from "@/lib/mock-data";
import { notFound, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
                      <Textarea
                        {...field}
                        placeholder="e.g. A timeless piece for any wardrobe."
                      />
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
                    <FormLabel>Image URLs</FormLabel>
                    <div className="space-y-2">
                      {field.value.map((url: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            type="url"
                            value={url}
                            onChange={(e) => {
                              const newUrls = [...field.value];
                              newUrls[index] = e.target.value;
                              field.onChange(newUrls);
                            }}
                            placeholder="https://example.com/image.png"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              const newUrls = field.value.filter(
                                (_: string, i: number) => i !== index
                              );
                              field.onChange(newUrls);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => field.onChange([...field.value, ""])}
                      >
                        Add Image URL
                      </Button>
                    </div>
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
