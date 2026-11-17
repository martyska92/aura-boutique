"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface WishlistContextType {
  wishlistIds: string[];
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = "aura_wishlist_items";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Wczytanie listy ulubionych z localStorage oraz próba synchronizacji z kontem klientki
  useEffect(() => {
    let localIds: string[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        localIds = JSON.parse(raw);
        if (Array.isArray(localIds)) {
          setWishlistIds(localIds);
        }
      }
    } catch (_) {}

    // Sprawdzamy czy klientka jest zalogowana i synchronizujemy z serwerem
    fetch("/api/customer/wishlist")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.wishlist && Array.isArray(data.wishlist)) {
          // Połączenie listy gościa z listą konta bez duplikatów
          const combined = Array.from(new Set([...data.wishlist, ...localIds]));
          setWishlistIds(combined);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
          } catch (_) {}

          // Jeśli gość miał elementy, zapisujemy połączoną listę na serwerze
          if (localIds.length > 0) {
            fetch("/api/customer/wishlist", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ wishlist: combined }),
            }).catch(() => {});
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  const saveIds = (newIds: string[]) => {
    setWishlistIds(newIds);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));
    } catch (_) {}

    // Zapis na serwerze jeśli klientka jest zalogowana
    fetch("/api/customer/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wishlist: newIds }),
    }).catch(() => {});
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlistIds.includes(productId);
  };

  const toggleWishlist = (productId: string) => {
    if (isInWishlist(productId)) {
      saveIds(wishlistIds.filter((id) => id !== productId));
    } else {
      saveIds([...wishlistIds, productId]);
    }
  };

  const removeFromWishlist = (productId: string) => {
    saveIds(wishlistIds.filter((id) => id !== productId));
  };

  const clearWishlist = () => {
    saveIds([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistCount: wishlistIds.length,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
