"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export interface Product {
  id: string;
  name: string;
  description: string;
  imageUrls: string[];
  variants: {
    id: string;
    name: string;
    price: number;
    stock: number;
    sku: string;
  }[];
}

interface ProductCardProps {
  product: Product;
  isAdmin?: boolean;
  onDelete?: (productId: string) => void;
  onEdit?: (productId: string) => void;
}

export function ProductCard({
  product,
  isAdmin = false,
  onDelete,
  onEdit,
}: ProductCardProps) {
  if (isAdmin) {
    return (
      <AdminProductCard product={product} onDelete={onDelete} onEdit={onEdit} />
    );
  }

  return <UserProductCard product={product} />;
}

function UserProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`} passHref legacyBehavior>
      <a className="block cursor-pointer">
        <Card className="w-full max-w-sm overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="p-0">
            <div className="relative h-48 w-full">
              <Image
                src={product.imageUrls[0] ?? "/next.svg"}
                alt={product.name}
                layout="fill"
                objectFit="cover"
              />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <CardTitle className="text-lg">{product.name}</CardTitle>
            <CardDescription className="mt-2 h-10 overflow-hidden text-sm text-gray-500">
              {product.description}
            </CardDescription>
            <p className="mt-4 text-xl font-semibold">
              Rp
              {(product.variants && product.variants.length > 0
                ? Math.min(...product.variants.map((v) => v.price))
                : 0
              ).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </a>
    </Link>
  );
}

function AdminProductCard({
  product,
  onDelete,
  onEdit,
}: {
  product: Product;
  onDelete?: (productId: string) => void;
  onEdit?: (productId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleDelete = () => {
    if (onDelete) {
      onDelete(product.id);
    }
  };

  const lowestPrice = Math.min(...product.variants.map((v) => v.price));

  return (
    <Card className="w-full max-w-sm overflow-hidden rounded-lg shadow-lg">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={product.imageUrls[0] ?? "/next.svg"}
            alt={product.name}
            layout="fill"
            objectFit="cover"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg">{product.name}</CardTitle>
        <p className="mt-2 text-sm text-gray-500">
          {product.variants.length} variant(s)
        </p>
        <p className="mt-4 text-xl font-semibold">
          Starts from Rp{lowestPrice.toFixed(2)}
        </p>
      </CardContent>
      <CardFooter className="flex-col items-start p-4 pt-0">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="link"
          className="mb-2 px-0"
        >
          {isExpanded ? "Hide Variants" : "View Variants"}
        </Button>
        {isExpanded && (
          <div className="w-full space-y-2">
            {product.variants.map((variant) => (
              <div key={variant.id} className="rounded-md border p-2 text-sm">
                <p>
                  <strong>{variant.name}</strong>
                </p>
                <p>Price: Rp{variant.price.toFixed(2)}</p>
                <p>Stock: {variant.stock}</p>
                <p>SKU: {variant.sku}</p>
              </div>
            ))}
          </div>
        )}
        <AdminControls
          productId={product.id}
          onDelete={handleDelete}
          onEdit={onEdit}
        />
      </CardFooter>
    </Card>
  );
}

function AdminControls({
  productId,
  onDelete,
  onEdit,
}: {
  productId: string;
  onDelete: () => void;
  onEdit?: (id: string) => void;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-2">
      <Button asChild variant="outline" className="flex-1">
        <Link href={`/products/${productId}`}>Preview</Link>
      </Button>
      <Button
        className="flex-1 dark:text-white"
        onClick={() => onEdit && onEdit(productId)}
      >
        Update
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="flex-1">
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              product from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
