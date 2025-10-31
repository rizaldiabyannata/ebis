import SiteHeader from "@/components/SiteHeader";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 max-w-4xl text-center">
        <h1 className="text-4xl font-bold mb-4">Terima Kasih!</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Pesanan Anda telah kami terima dan akan segera kami proses.
        </p>
        <Button asChild>
          <Link href="/shop">Kembali Berbelanja</Link>
        </Button>
      </main>
    </div>
  );
}