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
  const initialImg =
    product.images.find((img) => img.isPrimary)?.url ||
    product.images[0]?.url ||
    "/images/products/neutral-placeholder.svg";

  const [imgSrc, setImgSrc] = React.useState(initialImg);

  React.useEffect(() => {
    const nextImg =
      product.images.find((img) => img.isPrimary)?.url ||
      product.images[0]?.url ||
      "/images/products/neutral-placeholder.svg";
    setImgSrc(nextImg);
  }, [product.images]);

  const hasPromotion =
    product.isPromoted &&
    product.promotionalPrice &&
    product.promotionalPrice < product.basePrice;

  // Dyrektywa Omnibus:
  // Procent rabatu obliczany wyłącznie względem najniższej ceny z 30 dni przed obniżką
  const refPrice = product.lowestPrice30Days;
  const isLowerThanRef =
    Boolean(hasPromotion && refPrice && product.promotionalPrice! < refPrice);
  const discountPercent =
    isLowerThanRef && refPrice
      ? Math.round(((refPrice - product.promotionalPrice!) / refPrice) * 100)
      : null;

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
    <div className="group flex flex-col bg-white border border-[#EADFD5] hover:border-[#C5A069] rounded-sm transition-all duration-300 shadow-[0_2px_8px_rgba(234,223,213,0.3)] hover:shadow-[0_6px_20px_rgba(197,160,105,0.2)] overflow-hidden h-full">
      {/* Zdjęcie produktu */}
      <Link
        href={`/produkt/${product.slug}`}
        className="relative aspect-[3/4] w-full overflow-hidden bg-[#F7EFE8] block shrink-0"
      >
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          unoptimized={typeof imgSrc === "string" && imgSrc.startsWith("data:")}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
          onError={() => setImgSrc("/images/products/neutral-placeholder.svg")}
        />

        {/* Badge'e w stylistyce wizualizacji 2 (pudrowy róż i satynowe złoto) */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 z-10">
          {product.isNew && (
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] uppercase tracking-widest font-semibold bg-[#ECCDC7] text-[#542823] border border-[#DEBEB7] rounded-sm shadow-xs">
              Nowość
            </span>
          )}
          {product.isBestseller && (
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] uppercase tracking-widest font-semibold bg-[#C5A069] text-white rounded-sm shadow-xs">
              Bestseller
            </span>
          )}
          {hasPromotion && (
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] uppercase tracking-widest font-semibold bg-[#FCEAE7] text-[#A84B4B] border border-[#EAC4BE] rounded-sm flex items-center gap-1">
              <span>Promocja</span>
              {discountPercent !== null && <span>-{discountPercent}%</span>}
            </span>
          )}
          {product.isDemo && (
            <span className="px-1.5 py-0.5 text-[8.5px] uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 rounded-sm">
              Wzór
            </span>
          )}
        </div>

        {/* Informacja o braku w magazynie */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 bg-[#3D2E2A] text-white text-[10px] sm:text-xs uppercase tracking-widest font-medium rounded-sm">
              Wyprzedano
            </span>
          </div>
        )}

        {/* Szybki podgląd rozmiarów na hover */}
        <div className="hidden sm:flex absolute inset-x-0 bottom-0 bg-[#FAF6F1]/95 backdrop-blur-sm border-t border-[#EADFD5] py-2 px-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 items-center justify-between text-[11px]">
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
      <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between gap-2 sm:gap-3 bg-[#FAF6F1]/40">
        <div>
          {/* Próbki kolorów */}
          {availableColors.length > 0 && (
            <div className="flex items-center gap-1 mb-1.5 min-h-[14px]">
              {availableColors.slice(0, 4).map((c, idx) => (
                <span
                  key={idx}
                  title={c.name}
                  className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full border border-black/20 shadow-xs"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              {availableColors.length > 4 && (
                <span className="text-[9px] text-[#857670] font-medium">
                  +{availableColors.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Kategoria */}
          {product.category && (
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[#C5A069] font-semibold mb-0.5 truncate">
              {product.category.name}
            </p>
          )}

          {/* Tytuł produktu - stałe dwie linie na wysokość dla idealnego wyrównania */}
          <Link href={`/produkt/${product.slug}`} className="block">
            <h3 className="font-serif text-xs sm:text-sm font-normal text-[#241D1B] group-hover:text-[#C5A069] transition-colors line-clamp-2 leading-snug h-8 sm:h-10">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Cena i Złoty Przycisk Do Koszyka - wyrównane do dołu */}
        <div className="pt-1.5 sm:pt-2 border-t border-[#EADFD5]/70 space-y-2 sm:space-y-3 mt-auto">
          <div className="flex items-baseline justify-between flex-wrap gap-1">
            <span className="hidden sm:inline text-[11px] uppercase tracking-wider text-[#857670]">Cena:</span>
            {hasPromotion ? (
              <div className="flex flex-col items-end sm:items-start text-right sm:text-left">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] text-[#857670] line-through">
                    {product.basePrice.toFixed(2).replace(".", ",")} zł
                  </span>
                  <span className="text-xs sm:text-base font-bold text-[#A84B4B]">
                    {product.promotionalPrice!.toFixed(2).replace(".", ",")} zł
                  </span>
                </div>
                {refPrice && (
                  <p className="text-[8.5px] sm:text-[9.5px] text-[#857670] leading-tight mt-0.5">
                    Najniższa cena z 30 dni:{" "}
                    <span className="font-semibold text-[#241D1B]">
                      {refPrice.toFixed(2).replace(".", ",")} zł
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <span className="text-xs sm:text-base font-bold text-[#241D1B]">
                {product.basePrice.toFixed(2).replace(".", ",")} zł
              </span>
            )}
          </div>

          <Link
            href={`/produkt/${product.slug}`}
            className="w-full min-h-[40px] sm:min-h-[44px] py-2 sm:py-2.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-[11px] sm:text-xs uppercase tracking-[0.12em] font-medium rounded-sm transition-all duration-300 flex items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(197,160,105,0.25)] active:scale-[0.98]"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Do koszyka</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
