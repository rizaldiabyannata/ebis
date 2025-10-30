"use client";

import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const CheckoutSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 huruf"),
  phone: z.string().min(6, "Nomor tidak valid"),
  address: z.string().min(5, "Alamat diperlukan"),
  paymentMethod: z.string().min(1, "Pilih metode pembayaran"),
});

type CheckoutForm = z.infer<typeof CheckoutSchema>;

export default function CheckoutForm() {
  const { cartItems, clearCart } = useCart();
  const router = useRouter();
  const form = useForm<CheckoutForm>({
    resolver: zodResolver(CheckoutSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      paymentMethod: "COD",
    },
  });

  const subtotal: number = cartItems.reduce<number>(
    (acc, item) => acc + Number(item.variant.price) * Number(item.quantity),
    0
  );

  async function onSubmit(values: CheckoutForm) {
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
        orderDetails: cartItems.map((item) => ({
          variantId: item.variant.id,
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
      toast.success("Pesanan berhasil dibuat!", {
        description: `Nomor Pesanan Anda: ${result.orderNumber}`,
      });
      clearCart();
      router.push("/shop/thank-you");
    } catch (error) {
      toast.error("Gagal Membuat Pesanan", {
        description:
          (error as Error).message || "Terjadi kesalahan. Silakan coba lagi.",
      });
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Ringkasan Pesanan</h2>
        <div className="space-y-4">
          {cartItems.map((item) => (
            <div key={item.variant.id} className="flex justify-between">
              <div>
                <p className="font-semibold">
                  {item.product.name} ({item.variant.name})
                </p>
                <p className="text-sm text-gray-500">Jumlah: {item.quantity}</p>
              </div>
              <p>
                Rp
                {(
                  Number(item.variant.price) * Number(item.quantity)
                ).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-bold mt-4">
          <p>Subtotal</p>
          <p>Rp{subtotal.toLocaleString()}</p>
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-4">Form Pemesanan</h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          <div>
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
          <div>
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
          </div>
          <Button type="submit">Kirim Pesanan</Button>
        </form>
      </div>
    </div>
  );
}
