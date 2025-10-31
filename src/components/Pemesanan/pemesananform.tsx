"use client";

import Link from "next/link";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { type Product as PrismaProduct, type ProductVariant as PrismaProductVariant } from "@prisma/client";

// Create a local type for ProductVariant where 'price' is a number, not Decimal
type ProductVariantForClient = Omit<PrismaProductVariant, "price"> & {
	price: number;
};

// Create a local type for Product that uses the modified variant type
type ProductWithVariants = Omit<PrismaProduct, "variants"> & {
	variants: ProductVariantForClient[];
};

interface PemesananFormProps {
  products: ProductWithVariants[];
  selectedVariantId?: string;
}

const ItemSchema = z.object({
	// We now track productId to manage the dependent dropdown
	productId: z.string().min(1, "Pilih produk"),
	variantId: z.string().min(1, "Pilih varian"),
	quantity: z.number().int().min(1, "Minimal 1"),
});

const OrderSchema = z.object({
	name: z.string().min(2, "Nama minimal 2 huruf"),
	phone: z.string().min(6, "Nomor tidak valid"),
	address: z.string().min(5, "Alamat diperlukan"),
	paymentMethod: z.string().min(1, "Pilih metode pembayaran"),
	items: z.array(ItemSchema).min(1, "Minimal 1 item"),
});

type OrderForm = z.infer<typeof OrderSchema>;

export default function PemesananForm({
  products,
  selectedVariantId,
}: PemesananFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find the initial product and variant based on selectedVariantId
  const initialProduct =
    products.find((p) =>
      p.variants.some((v) => v.id === selectedVariantId)
    ) || products[0];
  const initialVariant =
    initialProduct?.variants.find((v) => v.id === selectedVariantId) ||
    initialProduct?.variants[0];

  const form = useForm<OrderForm>({
    resolver: zodResolver(OrderSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      paymentMethod: "COD",
      items: [
        {
          productId: initialProduct?.id ?? "",
          variantId: initialVariant?.id ?? "",
          quantity: 1,
        },
      ],
    },
  });
	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "items",
	});

	// When a product is selected, reset the variant to the first one available for that product
	const handleProductChange = (productId: string, index: number) => {
		const selectedProduct = products.find((p) => p.id === productId);
		form.setValue(
			`items.${index}.variantId`,
			selectedProduct?.variants[0]?.id ?? ""
		);
		// Trigger validation to re-render the dependent field
		form.trigger(`items.${index}.variantId`);
	};

	async function onSubmit(values: OrderForm) {
		setIsSubmitting(true);
		try {
			const payload = {
				delivery: {
					recipientName: values.name,
					recipientPhone: values.phone,
					address: values.address,
				},
				payment: {
					paymentMethod: values.paymentMethod,
				},
				orderDetails: values.items.map((item) => ({
					variantId: item.variantId,
					quantity: item.quantity,
				})),
			};

			const response = await fetch("/api/orders", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || "Gagal membuat pesanan. Silakan coba lagi."
				);
			}

			const result = await response.json();
			console.log("Order created:", result);
			toast.success("Pesanan berhasil dibuat!", {
				description: `Nomor Pesanan Anda: ${result.orderNumber}`,
			});
			form.reset(); // Reset form fields after successful submission
		} catch (error) {
			console.error(error);
			toast.error("Gagal Membuat Pesanan", {
				description:
					(error as Error).message ||
					"Terjadi kesalahan. Silakan coba lagi.",
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
        <>
            <h1 className="text-2xl md:text-3xl font-bold">Form Pemesanan</h1>
            <p className="text-muted-foreground mt-1 mb-6">
                Isi data diri dan detail pesanan Anda. Anda dapat menambah beberapa
                item dengan varian berbeda.
            </p>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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

				{/* Payment Method */}
				<section>
					<Label htmlFor="paymentMethod">Metode Pembayaran</Label>
					<select
						id="paymentMethod"
						className="h-10 w-full rounded-md border px-3 bg-background mt-2"
						{...form.register("paymentMethod")}
					>
						<option value="COD">Cash on Delivery (COD)</option>
						<option value="BANK_TRANSFER">Transfer Bank</option>
					</select>
					{form.formState.errors.paymentMethod && (
						<p className="text-sm text-destructive mt-1">
							{form.formState.errors.paymentMethod.message as string}
						</p>
					)}
				</section>

                {/* Items */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold">Item Pesanan</h2>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() =>
                                append({
									productId: products[0]?.id ?? "",
									variantId: products[0]?.variants[0]?.id ?? "",
                                    quantity: 1,
                                })
                            }
                        >
                            Tambah Item
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field, index) => {
							const selectedProductId = form.watch(
								`items.${index}.productId`
							);
							const availableVariants =
								products.find((p) => p.id === selectedProductId)?.variants ??
								[];
                            return (
                                <div
                                    key={field.id}
									className="grid md:grid-cols-[1fr_1fr_120px_auto] gap-3 items-end p-4 border rounded-lg"
                                >
                                    <div>
										<Label htmlFor={`items.${index}.productId`}>Produk</Label>
                                        <select
											id={`items.${index}.productId`}
                                            className="h-10 w-full rounded-md border px-3 bg-background"
											{...form.register(`items.${index}.productId`)}
											onChange={(e) => {
												form.register(`items.${index}.productId`).onChange(e); // Call original onChange
												handleProductChange(e.target.value, index);
											}}
                                        >
                                            {products.map((p) => (
												<option key={p.id} value={p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
										<Label htmlFor={`items.${index}.variantId`}>Varian</Label>
                                        <select
											id={`items.${index}.variantId`}
                                            className="h-10 w-full rounded-md border px-3 bg-background"
											{...form.register(`items.${index}.variantId`)}
											disabled={availableVariants.length === 0}
                                        >
											{availableVariants.map((v) => (
												<option key={v.id} value={v.id}>
													{v.name} ({v.sku})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
										<Label htmlFor={`items.${index}.quantity`}>Qty</Label>
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
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? "Mengirim..." : "Kirim Pesanan"}
					</Button>
					<Button
						type="button"
						variant="outline"
						asChild
						disabled={isSubmitting}
					>
                        <Link href="/shop">Kembali</Link>
                    </Button>
                </div>
            </form>
        </>
	);
}