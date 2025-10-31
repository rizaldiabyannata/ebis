"use client";

import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="order-2 md:order-1">
        <CardHeader>
          <CardTitle>Ringkasan Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cartItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keranjang kosong</p>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.variant.id}
                  className="flex items-start justify-between gap-4 border-b pb-3"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.variant.name} • Jumlah: {item.quantity}
                    </p>
                  </div>
                  <div className="text-sm font-semibold">
                    Rp
                    {(
                      Number(item.variant.price) * Number(item.quantity)
                    ).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3">
          <div className="w-full flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>Rp{subtotal.toLocaleString()}</span>
          </div>
          <div className="w-full flex justify-between text-sm text-muted-foreground">
            <span>
              Biaya Pengiriman akan di Infokan oleh Admin Jika alamat pengiriman
              lebih dari 5KM dari Teknik Unram
            </span>
          </div>
          <div className="w-full flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>
              Rp{(subtotal + (subtotal > 0 ? 10000 : 0)).toLocaleString()}
            </span>
          </div>
        </CardFooter>
      </Card>

      <Card className="order-1 md:order-2">
        <CardHeader>
          <CardTitle>Form Pemesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <option value="DANA_TRANSFER">Transfer Dana</option>
              </select>
              {form.formState.errors.paymentMethod && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.paymentMethod.message as string}
                </p>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <div className="w-full flex justify-end">
            <Button
              onClick={() => form.handleSubmit(onSubmit)()}
              disabled={cartItems.length === 0}
            >
              Kirim Pesanan
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
