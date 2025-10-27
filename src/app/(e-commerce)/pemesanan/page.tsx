import SiteHeader from "@/components/SiteHeader";
import prisma from "@/lib/prisma";
import PemesananForm from "@/components/Pemesanan/pemesananform";
import type {
  Product as PrismaProduct,
  ProductVariant as PrismaProductVariant,
} from "@prisma/client";
// Local types for the server -> client data shape (kept minimal to avoid coupling)
type ProductVariantForClient = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  productId: string;
};

type ProductWithVariants = Omit<PrismaProduct, "variants"> & {
  variants: ProductVariantForClient[];
};

async function getProducts(): Promise<
  (PrismaProduct & { variants: PrismaProductVariant[] })[]
> {
  const products = await prisma.product.findMany({
    include: {
      variants: true,
    },
    orderBy: {
      name: "asc",
    },
  });
  return products;
}

export default async function PemesananPage() {
  const productsData = await getProducts();

  // Convert Decimal fields to numbers for client-side serialization
  const products: ProductWithVariants[] = productsData.map((product) => ({
    ...product,
    variants: product.variants.map((variant: PrismaProductVariant) => ({
      ...variant,
      price: Number(variant.price),
    })),
  }));

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <PemesananForm products={products} />
      </main>
    </div>
  );
}
