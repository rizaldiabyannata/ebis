"use client";

import Image from "next/image";
import Link from "next/link";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const products = [
	{
		key: "brownies",
		name: "Brownies",
		variants: [
			{ key: "brownies-1", name: "Klasik" },
			{ key: "brownies-2", name: "Matcha" },
		],
	},
	{
		key: "cookies",
		name: "Cookies",
		variants: [
			{ key: "cookies-1", name: "Choco Chip" },
			{ key: "cookies-2", name: "Candy" },
		],
	},
];

const ItemSchema = z.object({
	productKey: z.string().min(1, "Pilih produk"),
	variantKey: z.string().min(1, "Pilih varian"),
	quantity: z.number().int().min(1, "Minimal 1"),
});

const OrderSchema = z.object({
	name: z.string().min(2, "Nama minimal 2 huruf"),
	phone: z.string().min(6, "Nomor tidak valid"),
	address: z.string().min(5, "Alamat diperlukan"),
	items: z.array(ItemSchema).min(1, "Minimal 1 item"),
});

type OrderForm = z.infer<typeof OrderSchema>;

export default function PemesananPage() {
	const form = useForm<OrderForm>({
		resolver: zodResolver(OrderSchema),
		defaultValues: {
			name: "",
			phone: "",
			address: "",
			items: [
				{ productKey: "brownies", variantKey: "brownies-1", quantity: 1 },
			],
		},
	});
	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "items",
	});

	// Helper to get variants for selected product per row
	const getVariants = (productKey: string) =>
		products.find((p) => p.key === productKey)?.variants ?? [];

	return (
		<div className="min-h-screen flex flex-col bg-background text-foreground">
			{/* Navbar (same as home) */}
			<header className="sticky top-0 z-50 border-b bg-white md:bg-white/80 dark:bg-background md:dark:bg-background/60 md:backdrop-blur md:supports-[backdrop-filter]:bg-white/60">
				<div className="container relative mx-auto flex items-center justify-between py-4 px-4">
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
							href="/e-commerce"
							className="text-muted-foreground hover:text-foreground"
						>
							E-commerce
						</Link>
					</nav>
					<div className="flex items-center gap-2">
						<Button variant="ghost" className="hidden sm:inline-flex" asChild>
							<Link href="/login">Login</Link>
						</Button>
						<Button className="hidden sm:inline-flex" asChild>
							<Link href="/register">Sign Up</Link>
						</Button>
						{/* Mobile hamburger */}
						<button
							className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border bg-white text-foreground shadow"
							aria-label="Open menu"
							aria-expanded={false}
							onClick={(e) => {
								e.stopPropagation();
								const el = document.getElementById("mobile-menu-order");
								if (el) {
									el.classList.toggle("hidden");
								}
							}}
						>
							<svg
								width="22"
								height="22"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<line x1="3" y1="6" x2="21" y2="6"></line>
								<line x1="3" y1="12" x2="21" y2="12"></line>
								<line x1="3" y1="18" x2="21" y2="18"></line>
							</svg>
						</button>
					</div>

					{/* Mobile dropdown menu */}
					<div
						id="mobile-menu-order"
						className="hidden md:hidden absolute right-4 top-full mt-2 w-56 rounded-lg border bg-white p-2 shadow-lg z-50"
					>
						<Link
							href="/"
							className="block rounded px-3 py-2 text-sm hover:bg-muted"
							onClick={() => {
								document
									.getElementById("mobile-menu-order")
									?.classList.add("hidden");
							}}
						>
							Home
						</Link>
						<Link
							href="/e-commerce"
							className="block rounded px-3 py-2 text-sm hover:bg-muted"
							onClick={() => {
								document
									.getElementById("mobile-menu-order")
									?.classList.add("hidden");
							}}
						>
							E-commerce
						</Link>
						<div className="my-1 h-px bg-border" />
						<Link
							href="/login"
							className="block rounded px-3 py-2 text-sm hover:bg-muted"
							onClick={() => {
								document
									.getElementById("mobile-menu-order")
									?.classList.add("hidden");
							}}
						>
							Login
						</Link>
						<Link
							href="/register"
							className="block rounded px-3 py-2 text-sm hover:bg-muted"
							onClick={() => {
								document
									.getElementById("mobile-menu-order")
									?.classList.add("hidden");
							}}
						>
							Sign Up
						</Link>
					</div>
				</div>
			</header>

			<main className="container mx-auto px-4 py-10 max-w-4xl">
				<h1 className="text-2xl md:text-3xl font-bold">Form Pemesanan</h1>
				<p className="text-muted-foreground mt-1 mb-6">
					Isi data diri dan detail pesanan Anda. Anda dapat menambah beberapa
					item dengan varian berbeda.
				</p>

				<form
					onSubmit={form.handleSubmit((values) => {
						console.log("ORDER:", values);
						alert("Terima kasih! Pesanan Anda telah direkam di console.");
					})}
					className="space-y-8"
				>
					{/* Identitas */}
					<section className="grid md:grid-cols-2 gap-4">
						<div>
							<Label>Nama Lengkap</Label>
							<Input placeholder="Nama Anda" {...form.register("name")} />
							{form.formState.errors.name && (
								<p className="text-sm text-destructive mt-1">
									{form.formState.errors.name.message as string}
								</p>
							)}
						</div>
						<div>
							<Label>No. Telepon/WA</Label>
							<Input placeholder="08xxxxxxxxxx" {...form.register("phone")} />
							{form.formState.errors.phone && (
								<p className="text-sm text-destructive mt-1">
									{form.formState.errors.phone.message as string}
								</p>
							)}
						</div>
						<div className="md:col-span-2">
							<Label>Alamat</Label>
							<Input
								placeholder="Alamat lengkap pengiriman"
								{...form.register("address")}
							/>
							{form.formState.errors.address && (
								<p className="text-sm text-destructive mt-1">
									{form.formState.errors.address.message as string}
								</p>
							)}
						</div>
					</section>

					<Separator />

					{/* Items */}
					<section>
						<div className="flex items-center justify-between mb-3">
							<h2 className="text-lg font-semibold">Item Pesanan</h2>
							<Button
								type="button"
								variant="secondary"
								onClick={() =>
									append({
										productKey: "brownies",
										variantKey: "brownies-1",
										quantity: 1,
									})
								}
							>
								Tambah Item
							</Button>
						</div>

						<div className="space-y-4">
							{fields.map((field, index) => {
								const productKey = form.watch(`items.${index}.productKey`);
								const variants = getVariants(productKey);
								return (
									<div
										key={field.id}
										className="grid md:grid-cols-[1fr_1fr_120px_40px] gap-3 items-end"
									>
										<div>
											<Label>Produk</Label>
											<select
												className="h-10 w-full rounded-md border px-3 bg-background"
												{...form.register(`items.${index}.productKey` as const)}
											>
												{products.map((p) => (
													<option key={p.key} value={p.key}>
														{p.name}
													</option>
												))}
											</select>
										</div>
										<div>
											<Label>Varian</Label>
											<select
												className="h-10 w-full rounded-md border px-3 bg-background"
												{...form.register(`items.${index}.variantKey` as const)}
											>
												{variants.map((v) => (
													<option key={v.key} value={v.key}>
														{v.name}
													</option>
												))}
											</select>
										</div>
										<div>
											<Label>Qty</Label>
											<Input
												type="number"
												min={1}
												{...form.register(`items.${index}.quantity` as const, {
													valueAsNumber: true,
												})}
											/>
										</div>
										<div className="flex justify-end">
											<Button
												type="button"
												variant="destructive"
												onClick={() => remove(index)}
											>
												Hapus
											</Button>
										</div>
									</div>
								);
							})}
						</div>
					</section>

					<div className="pt-2 flex items-center gap-3">
						<Button type="submit">Kirim Pesanan</Button>
						<Button type="button" variant="outline" asChild>
							<Link href="/e-commerce">Kembali</Link>
						</Button>
					</div>
				</form>
			</main>
		</div>
	);
}
