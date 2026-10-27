"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Share2,
  Truck,
  RotateCcw,
  ShieldCheck,
  MapPin,
  Sparkles,
  Check,
  ChevronRight,
  Ruler,
  AlertCircle,
} from "lucide-react";
import { Product, ProductVariant } from "@/lib/types";
import { useCart } from "@/context/CartContext";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const { addItem } = useCart();

  // Zdjęcia produktu
  const images = product.images.length > 0 ? product.images : [
    { id: "def", productId: product.id, url: "/images/products/sukienka-satynowa-ivory.jpg", orderIndex: 0, isPrimary: true }
  ];
  const [activeImage, setActiveImage] = useState(images[0]?.url || "/images/products/sukienka-satynowa-ivory.jpg");

  // Dostępne unikalne kolory
  const availableColors = useMemo(() => {
    const map = new Map<string, { color: string; hex?: string }>();
    product.variants.forEach((v) => {
      if (!map.has(v.color)) {
        map.set(v.color, { color: v.color, hex: v.colorHex });
      }
    });
    return Array.from(map.values());
  }, [product.variants]);

  // Stan wybranego koloru (domyślnie pierwszy)
  const [selectedColor, setSelectedColor] = useState<string>(
    availableColors[0]?.color || ""
  );

  // Warianty dla wybranego koloru
  const colorVariants = useMemo(() => {
    return product.variants.filter((v) => v.color === selectedColor);
  }, [product.variants, selectedColor]);

  // Stan wybranego rozmiaru (domyślnie pierwszy dostępny w tym kolorze)
  const [selectedSize, setSelectedSize] = useState<string>(() => {
    const firstInStock = colorVariants.find((v) => v.stockQuantity > 0);
    return firstInStock ? firstInStock.size : colorVariants[0]?.size || "";
  });

  // Ilość sztuk
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"desc" | "comp" | "care" | "sizes" | "shipping">("desc");
  const [isCopied, setIsCopied] = useState(false);

  // Aktualnie wybrana kombinacja (Rozmiar + Kolor)
  const activeVariant: ProductVariant | undefined = product.variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );

  const isCurrentVariantInStock = Boolean(
    activeVariant && activeVariant.stockQuantity - activeVariant.reservedQuantity > 0
  );
  const availableStock = activeVariant ? Math.max(0, activeVariant.stockQuantity - activeVariant.reservedQuantity) : 0;

  const hasPromotion =
    product.isPromoted &&
    product.promotionalPrice &&
    product.promotionalPrice < product.basePrice;
  const currentPrice = hasPromotion ? product.promotionalPrice! : product.basePrice;

  // Dodawanie do koszyka
  const handleAddToCart = () => {
    if (!activeVariant || !isCurrentVariantInStock) return;

    addItem({
      productId: product.id,
      variantId: activeVariant.id,
      name: product.name,
      price: currentPrice,
      size: activeVariant.size,
      color: activeVariant.color,
      colorHex: activeVariant.colorHex,
      sku: activeVariant.sku,
      imageUrl: activeImage,
      quantity,
      maxStock: availableStock,
    });
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Okruszki (Breadcrumbs) */}
      <nav className="flex items-center gap-2 text-xs text-[#857670] uppercase tracking-wider mb-8">
        <Link href="/" className="hover:text-[#C5A069]">Strona główna</Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#C5A069]/60" />
        <Link href="/katalog" className="hover:text-[#C5A069]">Katalog</Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#C5A069]/60" />
            <Link href={`/katalog?kategoria=${product.category.slug}`} className="hover:text-[#C5A069]">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-[#C5A069]/60" />
        <span className="text-[#241D1B] truncate max-w-[200px] font-medium">{product.name}</span>
      </nav>

      {/* Główna sekcja produktu */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* Lewa kolumna: Galeria zdjęć */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
          {/* Miniaturki */}
          {images.length > 1 && (
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto shrink-0 no-scrollbar sm:w-20">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.url)}
                  className={`relative w-16 h-20 sm:w-20 sm:h-24 overflow-hidden border rounded-xs transition-all ${
                    activeImage === img.url
                      ? "border-[#C5A069] ring-2 ring-[#C5A069]/60 shadow-xs"
                      : "border-[#EADFD5] hover:border-[#C5A069] opacity-80 hover:opacity-100"
                  }`}
                >
                  <Image src={img.url} alt={product.name} fill className="object-cover object-top" sizes="80px" />
                </button>
              ))}
            </div>
          )}

          {/* Główne duże zdjęcie */}
          <div className="relative flex-1 aspect-[3/4] bg-[#FAF6F1] border border-[#EADFD5] rounded-xs overflow-hidden group shadow-sm">
            <Image
              src={activeImage}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
            />

            {/* Badges z wizualizacji 2 */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.isNew && (
                <span className="px-3 py-1 bg-[#ECCDC7] border border-[#DEBEB7] text-[#542823] text-[10px] uppercase tracking-widest font-semibold rounded-xs shadow-xs">
                  Nowość
                </span>
              )}
              {product.isBestseller && (
                <span className="px-3 py-1 bg-[#C5A069] text-white text-[10px] uppercase tracking-widest font-semibold rounded-xs shadow-xs">
                  Bestseller
                </span>
              )}
              {hasPromotion && (
                <span className="px-3 py-1 bg-[#FCEAE7] text-[#A84B4B] border border-[#EAC4BE] text-[10px] uppercase tracking-widest font-semibold rounded-xs">
                  Cena Promocyjna
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Prawa kolumna: Szczegóły, Wybór wariantu, Zakup */}
        <div className="lg:col-span-5 flex flex-col justify-start space-y-6">
          <div>
            {product.category && (
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#C5A069] font-semibold mb-1.5">
                {product.category.name}
              </p>
            )}
            <h1 className="font-serif text-2xl sm:text-3xl text-[#241D1B] font-normal leading-tight">
              {product.name}
            </h1>

            {/* SKU */}
            {activeVariant && (
              <p className="text-[11px] text-[#857670] mt-1 tracking-wider uppercase">
                SKU: <span className="text-[#4A3F3B] font-mono">{activeVariant.sku}</span>
              </p>
            )}
          </div>

          {/* Cena */}
          <div className="py-3 border-y border-[#EADFD5] flex items-baseline gap-4">
            {hasPromotion ? (
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-semibold text-[#A84B4B]">
                  {product.promotionalPrice!.toFixed(2)} PLN
                </span>
                <span className="text-sm text-[#857670] line-through">
                  {product.basePrice.toFixed(2)} PLN
                </span>
                <span className="text-xs bg-[#FCEAE7] text-[#A84B4B] px-2 py-0.5 border border-[#EAC4BE] font-medium rounded-xs">
                  Promocja
                </span>
              </div>
            ) : (
              <span className="text-2xl sm:text-3xl font-semibold text-[#241D1B]">
                {product.basePrice.toFixed(2)} PLN
              </span>
            )}
            <span className="text-[11px] text-[#857670]">zawiera VAT</span>
          </div>

          {/* Wybór Koloru */}
          {availableColors.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#857670] uppercase tracking-wider">Kolor:</span>
                <span className="font-semibold text-[#241D1B]">{selectedColor}</span>
              </div>
              <div className="flex items-center gap-3">
                {availableColors.map((col) => (
                  <button
                    key={col.color}
                    type="button"
                    onClick={() => {
                      setSelectedColor(col.color);
                      // Ustawienie pierwszego rozmiaru dla nowego koloru
                      const newColorVariants = product.variants.filter((v) => v.color === col.color);
                      const inStockVariant = newColorVariants.find((v) => v.stockQuantity > 0);
                      setSelectedSize(inStockVariant ? inStockVariant.size : newColorVariants[0]?.size || "");
                    }}
                    className={`group relative p-1 rounded-full border transition-all ${
                      selectedColor === col.color
                        ? "border-[#C5A069] ring-2 ring-[#C5A069]/70"
                        : "border-transparent hover:border-[#D8BE8E]"
                    }`}
                    title={col.color}
                  >
                    <span
                      className="w-7 h-7 rounded-full border border-black/20 block shadow-xs"
                      style={{ backgroundColor: col.hex || "#E2D6C5" }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Wybór Rozmiaru */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#857670] uppercase tracking-wider">Rozmiar:</span>
              <button
                type="button"
                onClick={() => setActiveTab("sizes")}
                className="text-[#C5A069] hover:underline flex items-center gap-1 font-medium"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Tabela wymiarów</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {colorVariants.map((v) => {
                const inStock = v.stockQuantity - v.reservedQuantity > 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedSize(v.size)}
                    disabled={!inStock}
                    className={`px-4 py-2 text-xs uppercase tracking-wider border rounded-xs transition-all ${
                      selectedSize === v.size
                        ? "bg-[#C5A069] text-white border-[#C5A069] font-medium shadow-xs"
                        : inStock
                        ? "bg-white text-[#241D1B] border-[#EADFD5] hover:border-[#C5A069]"
                        : "bg-[#F7EAE6]/50 text-[#857670]/50 border-[#EADFD5] line-through cursor-not-allowed"
                    }`}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Magazynowy dla wybranej kombinacji */}
          <div className="p-3 bg-[#FAF6F1] border border-[#EADFD5] rounded-xs text-xs">
            {isCurrentVariantInStock ? (
              <div className="flex items-center justify-between">
                <span className="text-emerald-800 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  Dostępny w magazynie • Wysyłka w 24h
                </span>
                {availableStock <= 3 && (
                  <span className="text-[#A84B4B] font-semibold text-[11px]">
                    Ostatnie {availableStock} sztuki!
                  </span>
                )}
              </div>
            ) : (
              <div className="text-[#A84B4B] flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Ten rozmiar/kolor jest chwilowo wyprzedany.</span>
              </div>
            )}
          </div>

          {/* Ilość i Przycisk Dodaj do Koszyka - Złoty Satynowy Przycisk z Wizualizacji 2 */}
          <div className="flex items-stretch gap-3 pt-2">
            <div className="flex items-center border border-[#EADFD5] bg-white rounded-xs">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-3 text-xs hover:bg-[#FAF6F1] text-[#857670] hover:text-[#241D1B] transition-colors"
              >
                -
              </button>
              <span className="px-4 text-xs font-medium text-[#241D1B]">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                disabled={quantity >= availableStock}
                className="px-3 py-3 text-xs hover:bg-[#FAF6F1] text-[#857670] hover:text-[#241D1B] disabled:opacity-30 transition-colors"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!isCurrentVariantInStock}
              className="flex-1 py-3.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-[0.2em] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-xs shadow-[0_4px_16px_rgba(197,160,105,0.35)]"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>{isCurrentVariantInStock ? "Dodaj do Koszyka" : "Produkt Niedostępny"}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="p-3 border border-[#EADFD5] bg-white text-[#857670] hover:text-[#241D1B] hover:border-[#C5A069] transition-colors rounded-xs"
              title="Kopiuj link do produktu"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {isCopied && (
            <p className="text-[11px] text-emerald-700 text-center">
              ✓ Link do produktu został skopiowany do schowka!
            </p>
          )}

          {/* Gwarancje i korzyści */}
          <div className="pt-4 border-t border-[#EADFD5] space-y-2.5 text-xs text-[#857670]">
            <div className="flex items-center gap-3">
              <Truck className="w-4 h-4 text-[#C5A069] shrink-0" />
              <span>Darmowa dostawa od 300 PLN | Paczkomaty InPost i Kurier</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-[#C5A069] shrink-0" />
              <span>Możliwy bezpłatny odbiór osobisty: <strong>Żmigród, ul. Poprzeczna 3/1A</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <RotateCcw className="w-4 h-4 text-[#C5A069] shrink-0" />
              <span>14 dni na bezproblemowy zwrot lub wymianę</span>
            </div>
          </div>

          {/* Zakładki szczegółowe (Opis, Skład, Pielęgnacja, Tabela wymiarów) */}
          <div className="pt-6 border-t border-[#EADFD5]">
            <div className="flex border-b border-[#EADFD5] overflow-x-auto text-xs uppercase tracking-wider gap-3 no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab("desc")}
                className={`pb-2.5 px-3 whitespace-nowrap transition-colors border-b-2 -mb-[1px] ${
                  activeTab === "desc"
                    ? "border-[#C5A069] text-[#241D1B] font-semibold bg-[#F2DCD7]/40 rounded-t-xs"
                    : "border-transparent text-[#857670] hover:text-[#241D1B]"
                }`}
              >
                Opis
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("comp")}
                className={`pb-2.5 px-3 whitespace-nowrap transition-colors border-b-2 -mb-[1px] ${
                  activeTab === "comp"
                    ? "border-[#C5A069] text-[#241D1B] font-semibold bg-[#F2DCD7]/40 rounded-t-xs"
                    : "border-transparent text-[#857670] hover:text-[#241D1B]"
                }`}
              >
                Skład
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("care")}
                className={`pb-2.5 px-3 whitespace-nowrap transition-colors border-b-2 -mb-[1px] ${
                  activeTab === "care"
                    ? "border-[#C5A069] text-[#241D1B] font-semibold bg-[#F2DCD7]/40 rounded-t-xs"
                    : "border-transparent text-[#857670] hover:text-[#241D1B]"
                }`}
              >
                Pielęgnacja
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("sizes")}
                className={`pb-2.5 px-3 whitespace-nowrap transition-colors border-b-2 -mb-[1px] ${
                  activeTab === "sizes"
                    ? "border-[#C5A069] text-[#241D1B] font-semibold bg-[#F2DCD7]/40 rounded-t-xs"
                    : "border-transparent text-[#857670] hover:text-[#241D1B]"
                }`}
              >
                Wymiary
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("shipping")}
                className={`pb-2.5 px-3 whitespace-nowrap transition-colors border-b-2 -mb-[1px] ${
                  activeTab === "shipping"
                    ? "border-[#C5A069] text-[#241D1B] font-semibold bg-[#F2DCD7]/40 rounded-t-xs"
                    : "border-transparent text-[#857670] hover:text-[#241D1B]"
                }`}
              >
                Dostawa
              </button>
            </div>

            <div className="py-4 text-xs sm:text-sm text-[#4A3F3B] leading-relaxed">
              {activeTab === "desc" && (
                <div className="space-y-3 whitespace-pre-line font-light">
                  {product.description}
                </div>
              )}

              {activeTab === "comp" && (
                <div className="space-y-2">
                  <p className="font-semibold text-[#241D1B]">Skład surowcowy:</p>
                  <p className="text-[#4A3F3B]">{product.composition || "100% wysokogatunkowa wiskoza"}</p>
                </div>
              )}

              {activeTab === "care" && (
                <div className="space-y-2">
                  <p className="font-semibold text-[#241D1B]">Zalecenia dotyczące pielęgnacji:</p>
                  <p className="text-[#4A3F3B] whitespace-pre-line">
                    {product.careGuide || "Pranie ręczne w 30°C. Prasować na lewej stronie chłodnym żelazkiem."}
                  </p>
                </div>
              )}

              {activeTab === "sizes" && (
                <div className="space-y-3">
                  <p className="font-semibold text-[#241D1B]">Tabela wymiarów produktu (mierzone na płasko w cm):</p>
                  <div className="bg-white p-3 border border-[#EADFD5] font-mono text-xs whitespace-pre-line text-[#4A3F3B] rounded-xs">
                    {product.sizeGuide || "XS: Biust 84cm, Talia 64cm, Długość 120cm\nS: Biust 88cm, Talia 68cm, Długość 122cm\nM: Biust 92cm, Talia 72cm, Długość 124cm\nL: Biust 96cm, Talia 76cm, Długość 126cm"}
                  </div>
                  <p className="text-[11px] text-[#857670]">
                    * Wymiary mogą różnić się o +/- 1-2 cm w zależności od partii krawieckiej.
                  </p>
                </div>
              )}

              {activeTab === "shipping" && (
                <div className="space-y-2.5">
                  <p className="font-semibold text-[#241D1B]">Dostępne formy doręczenia:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li>Paczkomaty InPost: <strong>13.00 PLN</strong> (Darmowa od 300 PLN)</li>
                    <li>Kurier InPost / DPD: <strong>15.00 PLN</strong> (Darmowa od 300 PLN)</li>
                    <li>Odbiór osobisty w butiku: <strong>0.00 PLN</strong> (Żmigród, ul. Poprzeczna 3/1A)</li>
                  </ul>
                  <p className="text-[11px] text-[#857670] pt-1">
                    Wysyłka następuje w ciągu 24-48h roboczych od potwierdzenia zamówienia.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Produkty powiązane / Podobne */}
      {relatedProducts.length > 0 && (
        <section className="mt-20 pt-12 border-t border-[#EADFD5]">
          <div className="text-center mb-8">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#C5A069] font-semibold mb-1">
              Dopełnij Swój Styl
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#241D1B]">
              Może Ci Się Spodobać
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <div key={p.id} className="group bg-white border border-[#EADFD5] hover:border-[#C5A069] transition-all rounded-xs shadow-xs overflow-hidden">
                <Link href={`/produkt/${p.slug}`} className="block relative aspect-[3/4] bg-[#FAF6F1] overflow-hidden">
                  <Image
                    src={p.images[0]?.url || "/images/products/sukienka-satynowa-ivory.jpg"}
                    alt={p.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </Link>
                <div className="p-4">
                  <Link href={`/produkt/${p.slug}`}>
                    <h4 className="font-serif text-sm text-[#241D1B] group-hover:text-[#C5A069] line-clamp-1">
                      {p.name}
                    </h4>
                  </Link>
                  <p className="text-xs font-semibold text-[#241D1B] mt-2">
                    {(p.promotionalPrice ?? p.basePrice).toFixed(2)} PLN
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
