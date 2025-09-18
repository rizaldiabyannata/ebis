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
  price: number;
  description: string;
  imageUrls: string[];
}

interface ProductCardProps {
  product: Product;
  isAdmin?: boolean;
  onDelete?: (productId: string) => void;
}

export function ProductCard({
  product,
  isAdmin = false,
  onDelete,
}: ProductCardProps) {
  if (isAdmin) {
    return <AdminProductCard product={product} onDelete={onDelete} />;
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
              ${product.price.toFixed(2)}
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
}: {
  product: Product;
  onDelete?: (productId: string) => void;
}) {
  const handleDelete = () => {
    if (onDelete) {
      onDelete(product.id);
    }
  };
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
        <CardDescription className="mt-2 h-10 overflow-hidden text-sm text-gray-500">
          {product.description}
        </CardDescription>
        <p className="mt-4 text-xl font-semibold">
          ${product.price.toFixed(2)}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <AdminControls productId={product.id} onDelete={handleDelete} />
      </CardFooter>
    </Card>
  );
}

function AdminControls({
  productId,
  onDelete,
}: {
  productId: string;
  onDelete: () => void;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-2">
      <Button asChild variant="outline" className="flex-1">
        <Link href={`/products/${productId}`}>Preview</Link>
      </Button>
      <Button asChild className="flex-1 dark:text-white">
        <Link href={`/admin/products/${productId}/edit`}>Update</Link>
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
