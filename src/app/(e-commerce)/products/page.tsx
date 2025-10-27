"use client";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Local types for products fetched from the public API (keeps client bundle free of Prisma runtime)
type ProductVariantForClient = {
  id: string;
  name?: string | null;
  sku?: string | null;
  price?: number | null;
  stock?: number | null;
};

type ProductImageForClient = {
  id: string;
  imageUrl?: string | null;
  isMain?: boolean | null;
};

type ProductWithRelations = {
  id: string;
  name: string;
  description?: string | null;
  variants: ProductVariantForClient[];
  images: ProductImageForClient[];
};

// Tipe data untuk produk yang diambil dari API, termasuk relasi (client-safe types declared above)

export default function EcommercePage() {
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productIndex, setProductIndex] = useState(0);
  const [variantIndex, setVariantIndex] = useState(0);
  const [direction, setDirection] = useState(0); // 0 = no move, 1 = next, -1 = prev

  // Fetch data from API
  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) throw new Error("Gagal mengambil data produk");
        const data: ProductWithRelations[] = await response.json();

        const validProducts = data.filter(
          (p) => p.variants.length > 0 && p.images.length > 0
        );
        setProducts(validProducts);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const currentProduct = useMemo(() => {
    if (!products || products.length === 0) return null;
    return products[productIndex];
  }, [products, productIndex]);

  const currentVariant = useMemo(() => {
    if (!currentProduct) return null;
    const variantImage = currentProduct.images.find(
      (img: ProductImageForClient) =>
        img.id === currentProduct.variants[variantIndex]?.id
    );
    const mainImage =
      currentProduct.images.find(
        (img: ProductImageForClient) => !!img.isMain
      ) || currentProduct.images[0];

    return {
      ...currentProduct.variants[variantIndex],
      imageUrl: variantImage?.imageUrl || mainImage?.imageUrl,
    };
  }, [currentProduct, variantIndex]);

  const navigateProduct = (newDirection: number) => {
    setDirection(newDirection);
    const newIndex =
      (productIndex + newDirection + products.length) % products.length;
    setProductIndex(newIndex);
    setVariantIndex(0);
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!currentProduct || !currentVariant) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 text-center dark:bg-neutral-900">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
          Gagal Memuat Produk
        </h2>
        <p className="text-muted-foreground mt-2">
          Tidak ada produk yang tersedia atau terjadi kesalahan.
        </p>
        <Button
          asChild
          className="mt-6 bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Link href="/">Kembali ke Beranda</Link>
        </Button>
      </div>
    );
  }

  const productVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div className="relative min-h-screen w-full bg-stone-100 dark:bg-neutral-950 text-stone-800 dark:text-stone-200 overflow-hidden flex flex-col">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vh] bg-amber-400/30 dark:bg-amber-500/20 rounded-full blur-3xl opacity-40 animate-pulse" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-black/5 dark:border-white/5 bg-white/30 dark:bg-black/30 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="HepiBite"
              width={32}
              height={32}
              className="rounded-md"
            />
            <span className="text-xl font-bold tracking-tighter">
              <span className="text-amber-500">Hepi</span>
              <span className="text-stone-700 dark:text-stone-300">Bite</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600 dark:text-stone-400">
            <Link
              href="/"
              className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              Home
            </Link>
            <Link href="/e-commerce" className="font-semibold text-amber-500">
              E-commerce
            </Link>
          </nav>
          <Button
            variant="ghost"
            className="text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-neutral-800"
            asChild
          >
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="relative w-full max-w-6xl h-full flex items-center justify-center">
          {/* Product Card */}
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={productIndex}
              custom={direction}
              variants={productVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="w-full max-w-md lg:max-w-4xl"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Image Viewer */}
                <div className="relative w-full aspect-square flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentVariant.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3, ease: "backOut" }}
                      className="w-full h-full"
                    >
                      <Image
                        src={currentVariant.imageUrl || "/logo.png"}
                        alt={`${currentProduct.name} - ${currentVariant.name}`}
                        fill
                        sizes="(max-width: 1024px) 80vw, 40vw"
                        className="object-cover drop-shadow-2xl rounded-2xl"
                        priority
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Product Details */}
                <div className="flex flex-col text-center lg:text-left items-center lg:items-start">
                  <motion.h1
                    key={`title-${productIndex}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="text-4xl md:text-5xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-stone-800 to-stone-600 dark:from-stone-100 dark:to-stone-300"
                  >
                    {currentProduct.name}
                  </motion.h1>

                  <div className="mt-6 w-full">
                    <p className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-3">
                      Pilih Varian:
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {currentProduct.variants.map(
                        (variant: ProductVariantForClient, index: number) => (
                          <motion.button
                            key={variant.id}
                            onClick={() => setVariantIndex(index)}
                            className={`px-4 py-2 text-sm font-semibold rounded-full border transition-all duration-200 shadow-sm ${
                              variantIndex === index
                                ? "bg-amber-500 border-amber-600 text-white shadow-lg shadow-amber-500/30"
                                : "bg-white/50 dark:bg-black/50 border-stone-300 dark:border-neutral-700 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400"
                            }`}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {variant.name}
                          </motion.button>
                        )
                      )}
                    </div>
                  </div>

                  <motion.div
                    key={`desc-${productIndex}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="prose prose-sm dark:prose-invert mt-4 text-stone-600 dark:text-stone-400 max-w-sm"
                    dangerouslySetInnerHTML={{
                      __html: currentProduct.description || "",
                    }}
                  />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                  >
                    <Button
                      size="lg"
                      className="mt-8 rounded-full px-8 py-6 text-base font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-transform hover:scale-105"
                      asChild
                    >
                      <Link href="/e-commerce/pemesanan">
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Pesan Sekarang
                      </Link>
                    </Button>
                  </motion.div>

                  {/* Product Navigation */}
                  <div className="mt-8 flex items-center justify-center lg:justify-start gap-4">
                    <ArrowButton
                      direction="left"
                      onClick={() => navigateProduct(-1)}
                    />
                    <ArrowButton
                      direction="right"
                      onClick={() => navigateProduct(1)}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// Arrow Button Component
function ArrowButton({
  direction,
  onClick,
  className = "",
}: {
  direction: "left" | "right";
  onClick?: () => void;
  className?: string;
}) {
  const icons = {
    left: <ChevronLeft className="h-7 w-7" />,
    right: <ChevronRight className="h-7 w-7" />,
  };
  return (
    <button
      onClick={onClick}
      aria-label={`Arrow ${direction}`}
      className={`flex items-center justify-center size-14 rounded-full bg-white/60 dark:bg-black/50 backdrop-blur-md border border-black/10 dark:border-white/10 text-stone-700 dark:text-stone-300 hover:bg-white/90 dark:hover:bg-black/70 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-500 ${className}`}
    >
      {icons[direction]}
    </button>
  );
}

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-100 dark:bg-neutral-950">
      <header className="sticky top-0 z-50 border-b border-black/5 dark:border-white/5 bg-white/30 dark:bg-black/30 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Skeleton className="h-8 w-32 rounded-md" />
          <div className="hidden md:flex items-center gap-6">
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-6 w-24 rounded-md" />
          </div>
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </header>
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-4xl w-full">
          <Skeleton className="w-full aspect-square rounded-2xl" />
          <div className="flex flex-col items-center lg:items-start gap-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-5 w-full mt-2" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-14 w-48 mt-6 rounded-full" />
          </div>
        </div>
      </main>
    </div>
  );
}
