"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, ProductVariant } from '@prisma/client';

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, variant: ProductVariant, quantity: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product, variant: ProductVariant, quantity: number) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.variant.id === variant.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.variant.id === variant.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { product, variant, quantity }];
    });
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.variant.id === variantId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (variantId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.variant.id !== variantId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};