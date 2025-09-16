"use client";

import { ProductCard } from "@/components/product-card";
import { mockProducts } from "@/lib/mock-data";

export default function ProductsPage() {
  const handleDelete = (productId: string) => {
    console.log(`Deleting product with id: ${productId}`);
    alert(`Deleting product with id: ${productId}`);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        {mockProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isAdmin={true}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
