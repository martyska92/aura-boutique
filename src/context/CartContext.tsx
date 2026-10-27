"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CartItem } from "@/lib/types";

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Załadowanie z localStorage po stronie klienta
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aura_cart");
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Błąd odczytu koszyka:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Zapis do localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem("aura_cart", JSON.stringify(items));
      } catch (e) {
        console.error("Błąd zapisu koszyka:", e);
      }
    }
  }, [items, isLoaded]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId);
      if (existing) {
        const newQty = Math.min(existing.quantity + item.quantity, item.maxStock);
        return prev.map((i) =>
          i.variantId === item.variantId ? { ...i, quantity: newQty } : i
        );
      }
      return [...prev, item];
    });
    setIsCartOpen(true);
  };

  const removeItem = (variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.variantId === variantId) {
          const validQty = Math.min(quantity, i.maxStock);
          return { ...i, quantity: validQty };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart musi być używane wewnątrz CartProvider");
  }
  return context;
}
