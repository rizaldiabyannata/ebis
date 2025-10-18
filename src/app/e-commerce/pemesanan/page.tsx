import SiteHeader from "@/components/SiteHeader";
import prisma from "@/lib/prisma";
import PemesananForm from "../../../components/Pemesanan/pemesananform";

async function getProducts() {
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
  const products = productsData.map((product) => ({
    ...product,
    variants: product.variants.map((variant) => ({
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