"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, ArrowRight, ShoppingBag } from "lucide-react";
import { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage =
    product.images.find((img) => img.isPrimary)?.url ||
    product.images[0]?.url ||
    "/images/products/sukienka-satynowa-ivory.jpg";

  const hasPromotion =
    product.isPromoted &&
    product.promotionalPrice &&
    product.promotionalPrice < product.basePrice;

  // Unikalne rozmiary i kolory
  const availableSizes = Array.from(
    new Set(
      product.variants
        .filter((v) => v.stockQuantity > 0)
        .map((v) => v.size)
    )
  );

  const availableColors = Array.from(
    new Set(
      product.variants
        .filter((v) => v.colorHex)
        .map((v) => ({ name: v.color, hex: v.colorHex! }))
    )
  );

  const isOutOfStock = product.variants.every((v) => v.stockQuantity <= 0);

  return (
    <div className="group flex flex-col bg-white border border-[#EADFD5] hover:border-[#C5A069] rounded-sm transition-all duration-300 shadow-[0_2px_8px_rgba(234,223,213,0.3)] hover:shadow-[0_6px_20px_rgba(197,160,105,0.2)] overflow-hidden">
      {/* Zdjęcie produktu */}
      <Link
        href={`/produkt/${product.slug}`}
        className="relative aspect-[3/4] w-full overflow-hidden bg-[#F7EFE8] block"
      >
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Badge'e w stylistyce wizualizacji 2 (pudrowy róż i satynowe złoto) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.isNew && (
            <span className="px-2.5 py-1 text-[10px] uppercase tracking-widest font-semibold bg-[#ECCDC7] text-[#542823] border border-[#DEBEB7] rounded-sm shadow-xs">
              Nowość
            </span>
          )}
          {product.isBestseller && (
            <span className="px-2.5 py-1 text-[10px] uppercase tracking-widest font-semibold bg-[#C5A069] text-white rounded-sm shadow-xs">
              Bestseller
            </span>
          )}
          {hasPromotion && (
            <span className="px-2.5 py-1 text-[10px] uppercase tracking-widest font-semibold bg-[#FCEAE7] text-[#A84B4B] border border-[#EAC4BE] rounded-sm">
              Promocja
            </span>
          )}
          {product.isDemo && (
            <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 rounded-sm">
              Wzór
            </span>
          )}
        </div>

        {/* Informacja o braku w magazynie */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-3.5 py-1.5 bg-[#3D2E2A] text-white text-xs uppercase tracking-widest font-medium rounded-sm">
              Wyprzedano
            </span>
          </div>
        )}

        {/* Szybki podgląd rozmiarów na hover */}
        <div className="absolute inset-x-0 bottom-0 bg-[#FAF6F1]/95 backdrop-blur-sm border-t border-[#EADFD5] py-2 px-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-between text-[11px]">
          <span className="text-[#857670]">Rozmiary:</span>
          <div className="flex gap-1.5 font-medium text-[#241D1B]">
            {availableSizes.length > 0 ? (
              availableSizes.map((s) => (
                <span key={s} className="px-1.5 py-0.5 bg-white border border-[#EADFD5] rounded-xs text-[10px]">
                  {s}
                </span>
              ))
            ) : (
              <span className="text-[#857670]">Brak</span>
            )}
          </div>
        </div>
      </Link>

      {/* Szczegóły produktu pod zdjęciem */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3 bg-[#FAF6F1]/40">
        <div>
          {/* Próbki kolorów bezpośrednio pod zdjęciem (zgodnie z wizualizacją nr 2) */}
          <div className="flex items-center gap-1.5 mb-2.5">
            {availableColors.slice(0, 4).map((c, idx) => (
              <span
                key={idx}
                title={c.name}
                className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs transition-transform hover:scale-110"
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {availableColors.length > 4 && (
              <span className="text-[10px] text-[#857670] font-medium">
                +{availableColors.length - 4}
              </span>
            )}
          </div>

          {/* Kategoria */}
          {product.category && (
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#C5A069] font-semibold mb-1">
              {product.category.name}
            </p>
          )}

          {/* Tytuł */}
          <Link href={`/produkt/${product.slug}`} className="block">
            <h3 className="font-serif text-sm sm:text-base font-normal text-[#241D1B] group-hover:text-[#C5A069] transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Cena i Złoty Przycisk Do Koszyka (z wizualizacji nr 2) */}
        <div className="pt-2 border-t border-[#EADFD5]/70 space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#857670]">Cena:</span>
            {hasPromotion ? (
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] text-[#857670] line-through">
                  PLN {product.basePrice.toFixed(2)}
                </span>
                <span className="text-sm sm:text-base font-semibold text-[#A84B4B]">
                  PLN {product.promotionalPrice!.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-sm sm:text-base font-semibold text-[#241D1B]">
                PLN {product.basePrice.toFixed(2)}
              </span>
            )}
          </div>

          <Link
            href={`/produkt/${product.slug}`}
            className="w-full py-2.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-[0.15em] font-medium rounded-sm transition-all duration-300 flex items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(197,160,105,0.3)]"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Do koszyka</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
