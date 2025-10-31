"use client";

import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import Link from "next/link";

interface CartProps {
  isOpen: boolean;
}

export default function Cart({ isOpen }: CartProps) {
  const { cartItems, updateQuantity, removeFromCart, cartCount } = useCart();

  const subtotal = cartItems.reduce(
    (acc, item) => acc + Number(item.variant.price) * item.quantity,
    0
  );

  return (
    <div className="relative">
      <Button variant="ghost" size="icon">
        <ShoppingCart className="h-6 w-6" />
        {cartCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
            {cartCount}
          </span>
        )}
      </Button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg">
          {cartItems.length === 0 ? (
            <p className="p-4 text-center text-gray-500 dark:text-gray-400">
              Your cart is empty.
            </p>
          ) : (
            <>
              <div className="p-4 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div
                    key={item.variant.id}
                    className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-neutral-700"
                  >
                    <div>
                      <p className="font-semibold">{item.product.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.variant.name}
                      </p>
                      <p className="text-sm">
                        Rp{Number(item.variant.price).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          updateQuantity(item.variant.id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span>{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          updateQuantity(item.variant.id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.variant.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-neutral-700">
                <div className="flex justify-between font-semibold">
                  <span>Subtotal</span>
                  <span>Rp{subtotal.toLocaleString()}</span>
                </div>
                <Button
                  asChild
                  className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white"
                  disabled={cartItems.length === 0}
                >
                  <Link href="/shop/checkout">Checkout</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
