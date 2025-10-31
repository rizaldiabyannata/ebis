"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { Product, ProductVariant, ProductImage } from "@prisma/client";
import { Skeleton } from "@/components/ui/skeleton";
import SiteHeader from "@/components/SiteHeader";
import { useCart } from "@/contexts/CartContext";
import { getPoRuleDescription } from "@/lib/po-logic";

type VariantWithImage = ProductVariant & { imageUrl?: string | null };
type ImageRecord = ProductImage & { imageUrl: string };

type ProductWithRelations = Product & {
  variants: VariantWithImage[];
  images: ImageRecord[];
  // some products may store a JSON-serialized preOrderRule field
  preOrderRule?: unknown | null;
};

function EcommercePageContent() {
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productIndex, setProductIndex] = useState(0);
  const [variantIndex, setVariantIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const searchParams = useSearchParams();
  const { addToCart } = useCart();

  // Fetch data from API
  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) throw new Error("Gagal mengambil data produk");
        const data: ProductWithRelations[] = await response.json();

        // Consider a product valid if it has variants and at least one of:
        // - a variant with an imageUrl
        // - or the product has images (legacy or fallback)
        const validProducts = data.filter(
          (p) =>
            p.variants.length > 0 &&
            (p.variants.some((v) => !!(v as VariantWithImage).imageUrl) ||
              (p.images && p.images.length > 0))
        );
        setProducts(validProducts);

        const productId = searchParams.get("productId");
        if (productId) {
          const foundIndex = validProducts.findIndex((p) => p.id === productId);
          if (foundIndex !== -1) {
            setProductIndex(foundIndex);
          }
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, [searchParams]);

  const currentProduct = useMemo(() => {
    if (!products || products.length === 0) return null;
    return products[productIndex];
  }, [products, productIndex]);

  const currentVariant = useMemo(() => {
    if (!currentProduct) return null;
    const variant = currentProduct.variants[variantIndex];

    // Helper: try to find the best image URL for the given variant.
    const findImageForVariant = (v: VariantWithImage) => {
      // 1) Variant-level imageUrl (preferred)
      if (v.imageUrl) return v.imageUrl;

      // 2) Try to match product images by SKU appearing in the filename/path
      if (currentProduct.images && currentProduct.images.length > 0) {
        const bySku = currentProduct.images.find(
          (img) =>
            typeof img.imageUrl === "string" &&
            v.sku &&
            img.imageUrl.includes(v.sku)
        );
        if (bySku) return bySku.imageUrl;

        // 3) Try to match by variant name (loose match)
        const nameToken = String(v.name || "")
          .toLowerCase()
          .replace(/\s+/g, "-");
        const byName = currentProduct.images.find(
          (img) =>
            typeof img.imageUrl === "string" &&
            nameToken &&
            img.imageUrl.toLowerCase().includes(nameToken)
        );
        if (byName) return byName.imageUrl;

        // 4) Fallback to the first product image
        return currentProduct.images[0].imageUrl;
      }

      return null;
    };

    return {
      ...variant,
      imageUrl: findImageForVariant(variant) ?? null,
    };
  }, [currentProduct, variantIndex]);

  const navigateProduct = (newDirection: number) => {
    setDirection(newDirection);
    const newIndex =
      (productIndex + newDirection + products.length) % products.length;
    setProductIndex(newIndex);
    setVariantIndex(0);
  };

  const handleAddToCart = () => {
    if (currentProduct && currentVariant) {
      addToCart(currentProduct, currentVariant, 1);
    }
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
      <SiteHeader />

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
                  {/* Product Name and Mobile Navigation */}
                  <div className="w-full flex items-center justify-center lg:justify-start gap-4">
                    <ArrowButton
                      direction="left"
                      onClick={() => navigateProduct(-1)}
                      className="lg:hidden size-12"
                    />
                    <motion.h1
                      key={`title-${productIndex}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      className="text-4xl md:text-5xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-stone-800 to-stone-600 dark:from-stone-100 dark:to-stone-300"
                    >
                      {currentProduct.name}
                    </motion.h1>
                    <ArrowButton
                      direction="right"
                      onClick={() => navigateProduct(1)}
                      className="lg:hidden size-12"
                    />
                  </div>

                  <div className="mt-6 w-full">
                    <p className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-3">
                      Pilih Varian:
                    </p>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                      {currentProduct.variants.map((variant, index) => (
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
                      ))}
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

                  {Boolean(currentProduct.preOrderRule) && (
                    <motion.div
                      key={`po-info-${productIndex}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35, duration: 0.4 }}
                      className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200"
                    >
                      <strong>Produk Pre-Order:</strong>{" "}
                      {getPoRuleDescription(currentProduct.preOrderRule)}
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                  >
                    <Button
                      size="lg"
                      className="mt-8 rounded-full px-8 py-6 text-base font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-transform hover:scale-105"
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Add to Cart
                    </Button>
                  </motion.div>

                  {/* Product Navigation (Desktop only) */}
                  <div className="mt-8 hidden lg:flex items-center justify-center lg:justify-start gap-4">
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

export default function EcommercePage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <EcommercePageContent />
    </Suspense>
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
