"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ShoppingCart } from "lucide-react";
import { Product, ProductVariant, ProductImage } from "@prisma/client";
import { Skeleton } from "@/components/ui/skeleton";

// Tipe data untuk produk yang diambil dari API, termasuk relasi
type ProductWithRelations = Product & {
  variants: ProductVariant[];
  images: ProductImage[];
};

export default function EcommercePage() {
    const [products, setProducts] = useState<ProductWithRelations[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [productIndex, setProductIndex] = useState(0);
    const [variantIndex, setVariantIndex] = useState(0);

    // Fetch data from API
    useEffect(() => {
        async function fetchProducts() {
            try {
                const response = await fetch('/api/products');
                if (!response.ok) throw new Error("Gagal mengambil data produk");
                const data: ProductWithRelations[] = await response.json();
                
                // Filter produk yang memiliki varian dan gambar
                const validProducts = data.filter(p => p.variants.length > 0 && p.images.length > 0);
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
        // Prioritaskan gambar varian jika ada, jika tidak pakai gambar utama produk
        const variantImage = currentProduct.images.find(img => img.id === currentProduct.variants[variantIndex]?.id); // asumsi relasi id
        const mainImage = currentProduct.images.find(img => img.isMain) || currentProduct.images[0];
        
        return {
            ...currentProduct.variants[variantIndex],
            imageUrl: variantImage?.imageUrl || mainImage?.imageUrl,
        };
    }, [currentProduct, variantIndex]);


    const prevProduct = () => {
        setProductIndex((prev) => (prev - 1 + products.length) % products.length);
        setVariantIndex(0);
    };
    const nextProduct = () => {
        setProductIndex((prev) => (prev + 1) % products.length);
        setVariantIndex(0);
    };
    const prevVariant = () => {
        if (!currentProduct) return;
        setVariantIndex((prev) => (prev - 1 + currentProduct.variants.length) % currentProduct.variants.length);
    };
    const nextVariant = () => {
        if (!currentProduct) return;
        setVariantIndex((prev) => (prev + 1) % currentProduct.variants.length);
    };

    if (isLoading) {
        return <LoadingSkeleton />;
    }
    
    if (!currentProduct || !currentVariant) {
         return (
            <div className="flex h-screen flex-col items-center justify-center bg-gray-50 text-center">
                <h2 className="text-2xl font-semibold">Gagal Memuat Produk</h2>
                <p className="text-muted-foreground mt-2">
                    Tidak ada produk yang tersedia saat ini atau terjadi kesalahan.
                </p>
                 <Button asChild className="mt-4">
                    <Link href="/">Kembali ke Home</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-neutral-950 text-foreground overflow-hidden">
            {/* Navbar */}
            <header className="sticky top-0 z-50 border-b bg-white/70 dark:bg-black/50 backdrop-blur-xl">
                 <div className="container mx-auto flex items-center justify-between p-4">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/logo.png" alt="HepiBite" width={32} height={32} className="rounded-md" />
                        <span className="text-xl font-bold tracking-tighter">
                            <span className="text-[#F4A825]">Hepi</span><span className="text-[#7A4B2E]">Bite</span>
                        </span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                         <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
                         <Link href="/e-commerce" className="font-semibold text-primary">E-commerce</Link>
                    </nav>
                     <Button variant="ghost" asChild>
                        <Link href="/login">Login</Link>
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow flex items-center justify-center">
                <div className="container relative mx-auto flex items-center justify-center px-4 py-10">
                    
                    {/* Main Product Display */}
                    <div className="relative grid grid-cols-1 md:grid-cols-2 items-center gap-8 md:gap-16 max-w-5xl w-full">
                        
                        {/* Left Side: Image Viewer */}
                        <div className="relative flex items-center justify-center h-[400px] sm:h-[500px]">
                           <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentVariant.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <div className="relative aspect-square w-full max-w-[400px] rounded-full bg-gradient-to-br from-amber-100 to-yellow-200 p-2 shadow-2xl shadow-amber-900/10">
                                        <Image
                                            src={currentVariant.imageUrl || "/logo.png"}
                                            alt={`${currentProduct.name} - ${currentVariant.name}`}
                                            fill
                                            sizes="(max-width: 768px) 90vw, 400px"
                                            className="object-contain rounded-full bg-white"
                                            priority
                                        />
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Variant Controls */}
                             <ArrowButton direction="up" onClick={nextVariant} className="absolute top-0" />
                             <ArrowButton direction="down" onClick={prevVariant} className="absolute bottom-0" />
                        </div>

                        {/* Right Side: Product Details */}
                        <div className="relative flex flex-col items-center md:items-start text-center md:text-left">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentProduct.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.4, ease: "circOut" }}
                                    className="w-full"
                                >
                                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-stone-800 dark:text-stone-100">{currentProduct.name}</h1>
                                    <p className="mt-2 text-lg text-amber-600 dark:text-amber-400 font-semibold">{currentVariant.name}</p>
                                    <p className="mt-4 text-base text-muted-foreground max-w-sm">
                                        {currentProduct.description}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                            
                            <Button size="lg" className="mt-8 rounded-full px-8 py-6 text-base font-bold bg-[#7A4B2E] hover:bg-[#5f3a22] text-white shadow-lg shadow-amber-900/20" asChild>
                                <Link href="/e-commerce/pemesanan">
                                    <ShoppingCart className="mr-2 h-5 w-5"/>
                                    Pesan Sekarang
                                </Link>
                            </Button>
                        </div>
                    </div>
                    
                    {/* Product Controls */}
                    <ArrowButton direction="left" onClick={prevProduct} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2" />
                    <ArrowButton direction="right" onClick={nextProduct} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2" />
                </div>
            </main>
        </div>
    );
}

// Arrow Button Component
function ArrowButton({ direction, onClick, className = "" }: { direction: "left" | "right" | "up" | "down"; onClick?: () => void; className?: string; }) {
    const icons = {
        left: <ChevronLeft className="h-6 w-6" />,
        right: <ChevronRight className="h-6 w-6" />,
        up: <ChevronUp className="h-6 w-6" />,
        down: <ChevronDown className="h-6 w-6" />,
    };

    return (
        <button
            onClick={onClick}
            aria-label={`Arrow ${direction}`}
            className={`z-10 flex items-center justify-center size-12 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-md border border-black/10 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:bg-white/80 dark:hover:bg-black/80 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-500 ${className}`}
        >
            {icons[direction]}
        </button>
    );
}

// Loading Skeleton Component
function LoadingSkeleton() {
    return (
        <div className="min-h-screen flex flex-col bg-stone-50">
            <header className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur-xl">
                 <div className="container mx-auto flex items-center justify-between p-4">
                     <Skeleton className="h-8 w-32" />
                     <Skeleton className="h-8 w-24" />
                </div>
            </header>
             <main className="flex-grow flex items-center justify-center">
                <div className="container relative mx-auto flex items-center justify-center px-4 py-10">
                    <div className="relative grid grid-cols-1 md:grid-cols-2 items-center gap-16 max-w-5xl w-full">
                        <div className="relative flex items-center justify-center h-[500px]">
                           <Skeleton className="aspect-square w-full max-w-[400px] rounded-full" />
                        </div>
                        <div className="flex flex-col items-center md:items-start">
                            <Skeleton className="h-12 w-64" />
                            <Skeleton className="h-6 w-32 mt-4" />
                            <Skeleton className="h-4 w-full mt-6" />
                            <Skeleton className="h-4 w-4/5 mt-2" />
                            <Skeleton className="h-14 w-48 mt-8 rounded-full" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}