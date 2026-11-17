"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import { Product } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";
import { useWishlist } from "@/context/WishlistContext";

interface WishlistClientProps {
  allProducts: Product[];
}

export function WishlistClient({ allProducts }: WishlistClientProps) {
  const { wishlistIds, clearWishlist } = useWishlist();

  const favoriteProducts = useMemo(() => {
    const idSet = new Set(wishlistIds);
    return allProducts.filter((p) => idSet.has(p.id) && p.isPublished && !p.isArchived);
  }, [allProducts, wishlistIds]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Nagłówek strony */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#EADFD5] pb-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#857670] mb-1">
            <Link href="/" className="hover:text-[#241D1B]">Strona główna</Link>
            <span>/</span>
            <span className="text-[#241D1B] font-semibold">Ulubione</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#241D1B] flex items-center gap-2">
            <span>Twoje Ulubione</span>
            <span className="text-base sm:text-lg font-sans font-normal text-[#857670]">
              ({favoriteProducts.length})
            </span>
          </h1>
        </div>

        {favoriteProducts.length > 0 && (
          <button
            type="button"
            onClick={clearWishlist}
            className="text-xs text-[#857670] hover:text-[#8C2D2D] font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Wyczyść listę</span>
          </button>
        )}
      </div>

      {/* Stan pusty */}
      {favoriteProducts.length === 0 ? (
        <div className="py-16 sm:py-24 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FAF4ED] border border-[#EADFD5] flex items-center justify-center mx-auto text-[#C5A069] shadow-xs">
            <Heart className="w-8 h-8 text-[#C5A069]" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-xl sm:text-2xl text-[#241D1B]">
            Twoja lista ulubionych jest pusta
          </h2>
          <p className="text-xs sm:text-sm text-[#7D6E66] leading-relaxed">
            Dodawaj ubrania do ulubionych klikając ikonę serduszka na zdjęciu produktu.
            Będziesz mieć do nich natychmiastowy dostęp przy kolejnych odwiedzinach.
          </p>
          <div className="pt-3">
            <Link
              href="/katalog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#9E8359] hover:bg-[#8B7147] text-white text-xs uppercase tracking-widest font-semibold rounded-lg shadow-sm transition-all active:scale-95"
            >
              <span>Przeglądaj kolekcję</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* Siatka ulubionych produktów */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {favoriteProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
