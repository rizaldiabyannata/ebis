"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
	return (
		<div className="min-h-screen flex flex-col bg-background text-foreground">
			{/* Navbar */}
			<header className="border-b bg-white/80 dark:bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-40">
				<div className="container mx-auto flex items-center justify-between py-4 px-4">
					<div className="flex items-center gap-2">
						<Image src="/logo.png" alt="HepiBite" width={28} height={28} />
						<span className="text-xl font-extrabold tracking-tight">
							<span className="text-[#F4A825]">Hepi</span>
							<span className="ml-[2px] text-[#7A4B2E]">Bite</span>
						</span>
					</div>
					<nav className="hidden md:flex items-center gap-6 text-sm">
						<Link href="#" className="font-medium text-primary">
							Home
						</Link>
						<Link
							href="#vendors"
							className="text-muted-foreground hover:text-foreground"
						>
							Vendors
						</Link>
						<Link
							href="#partners"
							className="text-muted-foreground hover:text-foreground"
						>
							Partners
						</Link>
						<Link
							href="#about"
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
						<Button size="icon" className="md:hidden" aria-label="Open menu">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<line x1="3" x2="21" y1="6" y2="6" />
								<line x1="3" x2="21" y1="12" y2="12" />
								<line x1="3" x2="21" y1="18" y2="18" />
							</svg>
						</Button>
					</div>
				</div>
			</header>

			{/* Hero */}
			<section className="relative isolate">
				<div className="bg-[#f0ce95] dark:bg-[#F6C784]">
					<div className="container mx-auto grid md:grid-cols-2 gap-8 px-4 py-12 md:py-16 items-center">
						<div className="space-y-4">
							<h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
								Platform E-commerce untuk Temukan Snack Favoritmu
							</h1>
							<p className="text-muted-foreground max-w-prose">
								Kami menghubungkan Anda dengan pedagang snack pilihan.
							</p>
							<div className="flex flex-wrap gap-3 pt-2">
								<Button asChild>
									<Link href="/e-commerce">Mulai Belanja</Link>
								</Button>
								<Button variant="outline" asChild>
									<Link href="#about">Pelajari Lebih Lanjut</Link>
								</Button>
							</div>
						</div>
						<div className="relative aspect-[4/3] w-full">
							<Image
								src="/Snack.png"
								alt="Snack illustration"
								fill
								className="object-contain"
								priority
							/>
						</div>
					</div>
				</div>
			</section>

			{/* About */}
			<section id="about" className="container mx-auto px-4 py-12 md:py-16">
				<h2 className="text-2xl md:text-3xl font-semibold mb-4">
					Tentang Kami
				</h2>
				<p className="text-muted-foreground max-w-3xl">
					Kelompok kami membangun platform e‑commerce "HepiBite" yang menjual
					produk berupa makanan (snack). HepiBite tidak sekadar platform,
					melainkan wadah yang menghadirkan variasi patrais pedagang makanan
					ringan yang telah menjadi mitra kami.
				</p>
			</section>

			{/* Partners */}
			<section id="partners" className="container mx-auto px-4 pb-10">
				<h3 className="text-xl md:text-2xl font-semibold mb-6">Mitra Kami</h3>
				<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
					{Array.from({ length: 10 }).map((_, i) => (
						<div
							key={i}
							className="aspect-square rounded-full border bg-white/70 dark:bg-card flex items-center justify-center text-sm font-medium shadow-sm"
						>
							Logo {i + 1}
						</div>
					))}
				</div>
			</section>

			{/* Contact */}
			<footer className="mt-auto border-t">
				<div className="container mx-auto px-4 py-8 grid md:grid-cols-2 gap-6 text-sm">
					<div>
						<h4 className="font-semibold mb-2">Hubungi Kami</h4>
						<ul className="space-y-1 text-muted-foreground">
							<li>@hepiHepi</li>
							<li>hepi@bisnisten/retail.Hepi.com</li>
						</ul>
					</div>
					<div className="md:text-right">
						<h4 className="font-semibold mb-2">Hubungi Kami</h4>
						<ul className="space-y-1 text-muted-foreground">
							<li>+62 003 718 478 878</li>
						</ul>
					</div>
				</div>
			</footer>
		</div>
	);
}
