export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { ArrowRight, ShoppingBag } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
// Interfaces for product data fetched from prisma
interface ProductImage {
  id: string;
  imageUrl?: string | null;
  isMain?: boolean;
}

interface ProductWithImages {
  id: string;
  name: string;
  description?: string | null;
  images: ProductImage[];
}
// The page is a server component, allowing for direct data fetching.
export default async function Home() {
  // Fetch featured products from the database.
  const products = await prisma.product.findMany({
    take: 4,
    include: {
      images: {
        where: { isMain: true },
        take: 1,
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const partners = await prisma.partner.findMany({
    take: 4,
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-neutral-950 text-stone-800 dark:text-stone-200">
      <SiteHeader />

      <main>
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 lg:px-12 border-b bg-[#f0ce95] dark:bg-[#a95633] dark:border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-100/50 to-stone-50 dark:from-amber-900/10 dark:to-neutral-950 -z-10"></div>
          <div className="container mx-auto grid md:grid-cols-2 gap-12 px-4 items-center">
            <div className="space-y-5 text-center md:text-left">
              <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-stone-800 to-stone-600 dark:from-stone-100 dark:to-stone-300">
                Temukan Snack Favorit dan Unik Hanya di HepiBite
              </h1>
              <p className="text-lg text-stone-600 dark:text-black max-w-prose mx-auto md:mx-0">
                Jelajahi ribuan pilihan snack dari pedagang lokal terbaik.
                Kualitas terjamin, rasa tak terlupakan.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
                <Button
                  size="lg"
                  className="rounded-full px-8 py-6 text-base font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-transform hover:scale-105"
                  asChild
                >
                  <Link href="/shop">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Mulai Belanja
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 py-6 text-base font-bold border-stone-300 dark:border-neutral-700 hover:bg-stone-200/50 dark:hover:bg-neutral-800/50 dark:bg-black dark:text-white"
                  asChild
                >
                  <Link href="#about">
                    Tentang Kami
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative aspect-square w-full max-w-md mx-auto">
              <Image
                src="/Snack.png"
                alt="Snack illustration"
                fill
                className="object-cover rounded-[30px]"
                priority
              />
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section
          id="products"
          className="container mx-auto px-4 py-16 md:py-24"
        >
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Produk Unggulan Kami
            </h2>
            <p className="mt-3 text-lg text-stone-600 dark:text-stone-400">
              Pilihan snack terbaik yang paling disukai pelanggan kami.
            </p>
          </div>
          {(() => {
            const single = products.length === 1;
            const containerCls = single
              ? "flex justify-center"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8";
            return (
              <div className={containerCls}>
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`group relative border bg-white dark:bg-neutral-900 rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col ${
                      single ? "w-full max-w-md" : ""
                    }`}
                  >
                    <Link
                      href={`/shop?productId=${product.id}`}
                      className="absolute inset-0 z-10"
                      aria-label={product.name}
                    ></Link>
                    <div className="relative aspect-square w-full">
                      <Image
                        src={
                          (
                            product as unknown as {
                              variants?: { imageUrl?: string | null }[];
                            }
                          ).variants?.[0]?.imageUrl ||
                          product.images?.[0]?.imageUrl ||
                          "/logo.png"
                        }
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="font-semibold text-lg text-stone-800 dark:text-stone-100">
                        {product.name}
                      </h3>
                      <div
                        className="text-sm text-stone-500 dark:text-stone-400 mt-1 flex-grow line-clamp-3"
                        dangerouslySetInnerHTML={{
                          __html: product.description,
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 w-full border-stone-300 dark:border-neutral-700 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-colors"
                      >
                        Lihat Produk
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
          <div className="text-center mt-12">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 border-stone-300 dark:border-neutral-700 hover:bg-stone-100 dark:hover:bg-neutral-800"
              asChild
            >
              <Link href="/shop">
                Lihat Semua Produk
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* About Section */}
        <section
          id="about"
          className="bg-stone-100 dark:bg-neutral-900/80 border-y border-black/5 dark:border-white/5"
        >
          <div className="container mx-auto px-4 py-16 md:py-24 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Tentang HepiBite
            </h2>
            <p className="text-lg text-stone-600 dark:text-stone-400 max-w-3xl mx-auto">
              HepiBite adalah platform e-commerce yang menghubungkan para
              pecinta snack dengan pedagang makanan ringan terbaik. Kami percaya
              bahwa setiap gigitan harus membawa kebahagiaan.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-black/5 dark:border-white/5">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-stone-500 dark:text-stone-400">
          <p>
            &copy; {new Date().getFullYear()} HepiBite. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-amber-500 transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-amber-500 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
