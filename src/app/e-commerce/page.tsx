"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";

type Variant = { name: string; image: string };
type Product = {
	key: "brownies" | "cookies";
	name: string;
	variants: Variant[];
};

const PRODUCTS: Product[] = [
	{
		key: "brownies",
		name: "Brownies",
		variants: [
			{ name: "Klasik", image: "/products/brownies-1.png" },
			{ name: "Matcha", image: "/products/brownies-2.png" },
		],
	},
	{
		key: "cookies",
		name: "Cookies",
		variants: [
			{ name: "Choco Chip", image: "/products/cookies-1.png" },
			{ name: "Candy", image: "/products/cookies-2.png" },
		],
	},
];

export default function EcommercePage() {
	const [productIndex, setProductIndex] = useState(0);
	const [variantIndex, setVariantIndex] = useState(0);

	const current = useMemo(() => PRODUCTS[productIndex], [productIndex]);
	const variant = current.variants[variantIndex];

	const prevProduct = () => {
		setProductIndex((i) => (i - 1 + PRODUCTS.length) % PRODUCTS.length);
		setVariantIndex(0);
	};
	const nextProduct = () => {
		setProductIndex((i) => (i + 1) % PRODUCTS.length);
		setVariantIndex(0);
	};
	const prevVariant = () =>
		setVariantIndex(
			(v) => (v - 1 + current.variants.length) % current.variants.length
		);
	const nextVariant = () =>
		setVariantIndex((v) => (v + 1) % current.variants.length);

	return (
		<div className="min-h-screen flex flex-col bg-background text-foreground">
			{/* Navbar (same as home) */}
			<header className="sticky top-0 z-50 border-b bg-white md:bg-white/80 dark:bg-background md:dark:bg-background/60 md:backdrop-blur md:supports-[backdrop-filter]:bg-white/60">
				<div className="container mx-auto flex items-center justify-between py-4 px-4">
					<div className="flex items-center gap-2">
						<Image src="/logo.png" alt="HepiBite" width={28} height={28} />
						<span className="text-xl font-extrabold tracking-tight">
							<span className="text-[#F4A825]">Hepi</span>
							<span className="ml-[2px] text-[#7A4B2E]">Bite</span>
						</span>
					</div>
					<nav className="hidden md:flex items-center gap-6 text-sm">
						<Link
							href="/"
							className="text-muted-foreground hover:text-foreground"
						>
							Home
						</Link>
						<Link
							href="#"
							className="text-muted-foreground hover:text-foreground"
						>
							Vendors
						</Link>
						<Link
							href="#"
							className="text-muted-foreground hover:text-foreground"
						>
							Partners
						</Link>
						<Link
							href="#"
							className="text-muted-foreground hover:text-foreground"
						>
							About Us
						</Link>
					</nav>
					<div className="flex items-center gap-2">
						<Button variant="ghost" className="hidden sm:inline-flex" asChild>
							<Link href="/login">Login</Link>
						</Button>
						<Button className="hidden sm:inline-flex" asChild>
							<Link href="/register">Sign Up</Link>
						</Button>
					</div>
				</div>
			</header>

			{/* Canvas */}
			<main className="container mx-auto px-4 py-10">
				<div className="relative mx-auto max-w-4xl">
					{/* Center product */}
					<div className="relative mx-auto flex flex-col items-center">
						{/* Up arrow */}
						<ArrowButton
							direction="up"
							onClick={nextVariant}
							className="mb-8"
						/>

						<div className="relative px-12 md:px-0">
							<div className="relative rounded-full p-[6px] bg-white shadow-2xl">
								<div className="absolute inset-0 rounded-full blur-2xl pointer-events-none" />
								<div className="relative size-[269px] sm:size-[360px] md:size-[280px] overflow-hidden rounded-full">
									<Image
										src={variant.image}
										alt={`${current.name} - ${variant.name}`}
										fill
										sizes="(max-width: 768px) 360px, 420px"
										className="object-contain bg-white"
										priority
									/>
								</div>
							</div>
							{/* Mobile side arrows overlayed at product center */}
							<ArrowButton
								direction="left"
								onClick={prevProduct}
								className="md:hidden absolute left-1 top-1/2 -translate-y-1/2"
							/>
							<ArrowButton
								direction="right"
								onClick={nextProduct}
								className="md:hidden absolute right-1 top-1/2 -translate-y-1/2"
							/>
						</div>

						{/* Caption card */}
						<div className="-mt-8 w-[260px] sm:w-[300px] text-center bg-white/80 backdrop-blur border rounded-xl shadow-md p-3">
							<h2 className="text-lg font-semibold">{current.name}</h2>
							<p className="text-xs text-muted-foreground">
								Varian: {variant.name}
							</p>
						</div>

						{/* CTA */}
						<div className="mt-6">
							<Button
								className="rounded-full px-6 py-5 text-base"
								aria-label="Pesan Sekarang"
								asChild
							>
								<Link href="/e-commerce/pemesanan">Pesan Sekarang</Link>
							</Button>
						</div>

						{/* Down arrow */}
						<div className="mt-8">
							<ArrowButton direction="down" onClick={prevVariant} />
						</div>
					</div>

					{/* Left/Right arrows */}
					<ArrowButton
						direction="left"
						onClick={prevProduct}
						className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2"
					/>
					<ArrowButton
						direction="right"
						onClick={nextProduct}
						className="hidden md:flex  absolute right-0 top-1/2 -translate-y-1/2"
					/>
				</div>
			</main>
		</div>
	);
}

function ArrowButton({
	direction,
	onClick,
	className = "",
}: {
	direction: "left" | "right" | "up" | "down";
	onClick?: () => void;
	className?: string;
}) {
	const base = "size-0 border-solid cursor-pointer select-none";
	const color =
		"border-l-transparent border-r-transparent border-t-transparent";
	const map = {
		up: `mx-auto border-b-[40px] border-b-[#5A4C76] border-x-[25px] ${color}`,
		down: `mx-auto rotate-180 border-b-[40px] border-b-[#5A4C76] border-x-[25px] ${color}`,
		left: "border-b-[25px] border-t-[25px] border-r-[40px] border-r-[#5A4C76] border-t-transparent border-b-transparent",
		right:
			"border-b-[25px] border-t-[25px] border-l-[40px] border-l-[#5A4C76] border-t-transparent border-b-transparent",
	} as const;
	return (
		<div
			role="button"
			aria-label={`Arrow ${direction}`}
			tabIndex={0}
			className={`${base} ${map[direction]} ${className}`}
			onClick={onClick}
		/>
	);
}
