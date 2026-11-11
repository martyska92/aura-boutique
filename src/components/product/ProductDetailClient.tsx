"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
  ChevronDown,
  ChevronUp,
  Ruler,
  AlertCircle,
  Star,
  ShoppingBag,
  ZoomIn,
  X,
} from "lucide-react";
import { Product, ProductVariant } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { ProductReviewsSection } from "@/components/product/ProductReviewsSection";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const { addItem } = useCart();

  // Zdjęcia produktu
  const images = product.images.length > 0 ? product.images : [
    { id: "def", productId: product.id, url: "/images/products/neutral-placeholder.svg", orderIndex: 0, isPrimary: true }
  ];
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const activeImage = images[activeImageIndex]?.url || images[0]?.url;

  // Zoom modal
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Swipe gesture dla zdjęć na telefonie
  const touchStartXRef = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swipe left -> następne zdjęcie
        setActiveImageIndex((prev) => (prev + 1) % images.length);
      } else {
        // Swipe right -> poprzednie zdjęcie
        setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    }
    touchStartXRef.current = null;
  };

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
  const [isCopied, setIsCopied] = useState(false);

  // Zwijane sekcje (Akordeony)
  const [openAccordion, setOpenAccordion] = useState<string | null>("desc");
  const toggleAccordion = (id: string) => {
    setOpenAccordion((prev) => (prev === id ? null : id));
  };

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

  // Refs do śledzenia widoczności głównego przycisku zakupu dla dolnego paska
  const mainBuyButtonRef = useRef<HTMLButtonElement | null>(null);
  const sizeSectionRef = useRef<HTMLDivElement | null>(null);
  const [showStickyBottomBar, setShowStickyBottomBar] = useState(false);

  useEffect(() => {
    const btn = mainBuyButtonRef.current;
    if (!btn) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Pokaż dolny pasek gdy główny przycisk znika z ekranu powyżej
        setShowStickyBottomBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0.1 }
    );

    observer.observe(btn);
    return () => observer.disconnect();
  }, []);

  // Dodawanie do koszyka
  const handleAddToCart = () => {
    if (!selectedSize || !activeVariant || !isCurrentVariantInStock) {
      sizeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

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
    <div className="w-full py-2 sm:py-4 pb-24 lg:pb-12 space-y-4 sm:space-y-6">
      {/* Okruszki (Breadcrumbs) */}
      <nav className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#857670] uppercase tracking-wider mb-3 sm:mb-6 flex-wrap">
        <Link href="/" className="hover:text-[#C5A069]">Sklep</Link>
        <ChevronRight className="w-3 h-3 text-[#C5A069]/60 shrink-0" />
        <Link href="/katalog" className="hover:text-[#C5A069]">Katalog</Link>
        {product.category && (
          <>
            <ChevronRight className="w-3 h-3 text-[#C5A069]/60 shrink-0" />
            <Link href={`/katalog?kategoria=${product.category.slug}`} className="hover:text-[#C5A069]">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3 text-[#C5A069]/60 shrink-0" />
        <span className="text-[#241D1B] truncate max-w-[180px] sm:max-w-xs font-medium">{product.name}</span>
      </nav>

      {/* Główna sekcja produktu */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-12 items-start">
        {/* Lewa kolumna: Galeria zdjęć dopasowana do widoku telefonu */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-3">
          {/* Miniaturki na desktopie i tabletach */}
          {images.length > 1 && (
            <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto shrink-0 no-scrollbar sm:w-20">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-14 h-18 sm:w-20 sm:h-24 overflow-hidden border rounded-xs transition-all shrink-0 ${
                    activeImageIndex === idx
                      ? "border-[#C5A069] ring-2 ring-[#C5A069]/60 shadow-xs"
                      : "border-[#EADFD5] hover:border-[#C5A069] opacity-75 hover:opacity-100"
                  }`}
                  aria-label={`Zdjęcie ${idx + 1}`}
                >
                  <Image
                    src={img.url}
                    alt={`${product.name} - ${idx + 1}`}
                    fill
                    className="object-cover object-top"
                    sizes="80px"
                    unoptimized={typeof img.url === "string" && img.url.startsWith("data:")}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Główne zdjęcie: 45-55% wysokości ekranu na mobile, object-contain na estetycznym tle */}
          <div
            className="relative flex-1 w-full max-h-[50vh] sm:max-h-[640px] aspect-[3/4] sm:aspect-[3/4] bg-[#F7F3EE] border border-[#EADFD5] rounded-xs overflow-hidden flex items-center justify-center select-none cursor-pointer"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={() => setIsZoomOpen(true)}
            title="Dotknij, aby powiększyć zdjęcie"
          >
            <Image
              src={activeImage}
              alt={product.name}
              fill
              priority
              unoptimized={typeof activeImage === "string" && activeImage.startsWith("data:")}
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-contain object-center transition-transform duration-500 hover:scale-[1.02]"
            />

            {/* Badges zgrabne i dopasowane do szerokości tekstu, niezasłaniające ubrania */}
            <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
              {product.isNew && (
                <span className="px-2 py-0.5 bg-[#ECCDC7] border border-[#DEBEB7] text-[#542823] text-[9.5px] uppercase tracking-wider font-semibold rounded-xs shadow-xs w-fit">
                  Nowość
                </span>
              )}
              {product.isBestseller && (
                <span className="px-2 py-0.5 bg-[#C5A069] text-white text-[9.5px] uppercase tracking-wider font-semibold rounded-xs shadow-xs w-fit">
                  Bestseller
                </span>
              )}
              {hasPromotion && (
                <span className="px-2 py-0.5 bg-[#FCEAE7] text-[#A84B4B] border border-[#EAC4BE] text-[9.5px] uppercase tracking-wider font-semibold rounded-xs w-fit">
                  Cena Promocyjna
                </span>
              )}
            </div>

            {/* Licznik zdjęć i ikonka powiększenia */}
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 z-10">
              <span className="bg-black/55 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-xs font-mono shadow-xs">
                {activeImageIndex + 1}/{images.length}
              </span>
              <span className="bg-white/80 text-[#241D1B] p-1.5 rounded-full backdrop-blur-xs shadow-xs">
                <ZoomIn className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Prawa kolumna: Zwarty panel szczegółów, wyboru i zakupu */}
        <div className="lg:col-span-5 flex flex-col justify-start space-y-4">
          <div>
            {/* Rzeczywista kategoria produktu */}
            {product.category && (
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#C5A069] font-semibold mb-1">
                {product.category.name}
              </p>
            )}
            <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl text-[#241D1B] font-normal leading-snug">
              {product.name}
            </h1>

            {/* Szybki odnośnik do opinii klientek z gwiazdkami */}
            <div className="mt-1.5 flex items-center gap-2">
              <a
                href="#opinie-o-produkcie"
                className="inline-flex items-center gap-1.5 text-xs text-[#8C6B38] hover:text-[#241D1B] transition-colors"
              >
                <div className="flex text-[#C5A069]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-[#C5A069] text-[#C5A069]" />
                  ))}
                </div>
                <span className="underline ml-0.5 text-[11px] sm:text-xs">Opinie klientek</span>
              </a>

              {activeVariant && (
                <span className="text-[10px] text-[#857670] tracking-wider uppercase ml-auto">
                  SKU: <span className="text-[#4A3F3B] font-mono">{activeVariant.sku}</span>
                </span>
              )}
            </div>
          </div>

          {/* Cena po polsku */}
          <div className="py-2.5 border-y border-[#EADFD5] flex items-baseline gap-3">
            {hasPromotion ? (
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold text-[#A84B4B]">
                  {product.promotionalPrice!.toFixed(2).replace(".", ",")} zł
                </span>
                <span className="text-xs sm:text-sm text-[#857670] line-through">
                  {product.basePrice.toFixed(2).replace(".", ",")} zł
                </span>
                <span className="text-[10px] bg-[#FCEAE7] text-[#A84B4B] px-2 py-0.5 border border-[#EAC4BE] font-semibold rounded-xs">
                  Oszczędzasz {(product.basePrice - product.promotionalPrice!).toFixed(2).replace(".", ",")} zł
                </span>
              </div>
            ) : (
              <span className="text-2xl sm:text-3xl font-bold text-[#241D1B]">
                {product.basePrice.toFixed(2).replace(".", ",")} zł
              </span>
            )}
          </div>

          {/* Wybór Koloru */}
          {availableColors.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#857670] uppercase tracking-wider text-[11px]">Kolor:</span>
                <span className="font-semibold text-[#241D1B]">{selectedColor}</span>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                {availableColors.map((col) => (
                  <button
                    key={col.color}
                    type="button"
                    onClick={() => {
                      setSelectedColor(col.color);
                      const newColorVariants = product.variants.filter((v) => v.color === col.color);
                      const inStockVariant = newColorVariants.find((v) => v.stockQuantity > 0);
                      setSelectedSize(inStockVariant ? inStockVariant.size : newColorVariants[0]?.size || "");
                    }}
                    className={`min-h-[44px] px-3 py-1.5 rounded-xs border flex items-center gap-2 text-xs transition-all ${
                      selectedColor === col.color
                        ? "border-[#C5A069] bg-[#FAF2EB] text-[#241D1B] font-semibold ring-1 ring-[#C5A069]"
                        : "border-[#EADFD5] bg-white text-[#4A3F3B] hover:border-[#C5A069]"
                    }`}
                    title={col.color}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-xs"
                      style={{ backgroundColor: col.hex || "#E2D6C5" }}
                    />
                    <span>{col.color}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Wybór Rozmiaru z linkiem do tabeli rozmiarów */}
          <div ref={sizeSectionRef} className="space-y-1.5 scroll-mt-24">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#857670] uppercase tracking-wider text-[11px]">Wybierz rozmiar:</span>
              <button
                type="button"
                onClick={() => setOpenAccordion("sizes")}
                className="text-[#C5A069] hover:underline flex items-center gap-1 font-medium text-[11px] min-h-[36px]"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Tabela rozmiarów</span>
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
                    className={`min-h-[44px] min-w-[48px] px-3.5 py-2 text-xs uppercase tracking-wider border rounded-xs transition-all font-semibold ${
                      selectedSize === v.size
                        ? "bg-[#C5A069] text-white border-[#C5A069] shadow-xs scale-[1.02]"
                        : inStock
                        ? "bg-white text-[#241D1B] border-[#EADFD5] hover:border-[#C5A069]"
                        : "bg-[#F3EBE6]/60 text-[#857670]/40 border-[#EADFD5] line-through cursor-not-allowed"
                    }`}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dostępność w magazynie */}
          <div className="p-2.5 bg-[#FAF6F1] border border-[#EADFD5] rounded-xs text-xs">
            {isCurrentVariantInStock ? (
              <div className="flex items-center justify-between">
                <span className="text-emerald-800 flex items-center gap-1.5 font-medium text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  Dostępny w magazynie • Wysyłka w 24h
                </span>
                {availableStock <= 3 && (
                  <span className="text-[#A84B4B] font-semibold text-[11px]">
                    Ostatnie {availableStock} szt.!
                  </span>
                )}
              </div>
            ) : (
              <div className="text-[#A84B4B] flex items-center gap-1.5 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Wariant wyprzedany. Wybierz inny rozmiar lub kolor.</span>
              </div>
            )}
          </div>

          {/* Przycisk Główny: Dodaj do koszyka (pełna szerokość, min 48px wysokości) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-stretch gap-2.5">
              {/* Wybór ilości */}
              <div className="flex items-center border border-[#EADFD5] bg-white rounded-xs">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 min-h-[48px] flex items-center justify-center text-sm hover:bg-[#FAF6F1] text-[#857670] hover:text-[#241D1B] transition-colors"
                  aria-label="Zmniejsz ilość"
                >
                  -
                </button>
                <span className="px-3 text-xs font-semibold text-[#241D1B]">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                  disabled={quantity >= availableStock}
                  className="w-10 min-h-[48px] flex items-center justify-center text-sm hover:bg-[#FAF6F1] text-[#857670] hover:text-[#241D1B] disabled:opacity-30 transition-colors"
                  aria-label="Zwiększ ilość"
                >
                  +
                </button>
              </div>

              {/* Główny przycisk dodawania do koszyka - minimum 48px */}
              <button
                ref={mainBuyButtonRef}
                type="button"
                onClick={handleAddToCart}
                disabled={!isCurrentVariantInStock}
                className="flex-1 min-h-[48px] py-3.5 px-4 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-[0.16em] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-xs shadow-[0_3px_12px_rgba(197,160,105,0.3)] active:scale-[0.99]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isCurrentVariantInStock ? "Dodaj do Koszyka" : "Produkt Niedostępny"}</span>
              </button>

              {/* Udostępnij */}
              <button
                type="button"
                onClick={handleShare}
                className="w-12 min-h-[48px] border border-[#EADFD5] bg-white text-[#857670] hover:text-[#241D1B] hover:border-[#C5A069] transition-colors rounded-xs flex items-center justify-center shrink-0"
                title="Kopiuj link do produktu"
                aria-label="Kopiuj link do produktu"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {isCopied && (
              <p className="text-[11px] text-emerald-700 text-center animate-fade-in">
                ✓ Link do produktu został skopiowany do schowka!
              </p>
            )}
          </div>

          {/* Dyskretne korzyści */}
          <div className="pt-2 border-t border-[#EADFD5] space-y-2 text-xs text-[#6E6259]">
            <div className="flex items-center gap-2.5">
              <Truck className="w-3.5 h-3.5 text-[#C5A069] shrink-0" />
              <span>Darmowa dostawa od 300 zł • Skarpetki gratis powyżej 100 zł</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="w-3.5 h-3.5 text-[#C5A069] shrink-0" />
              <span>Odbiór stacjonarny w Żmigrodzie (ul. Poprzeczna 3/1A)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <RotateCcw className="w-3.5 h-3.5 text-[#C5A069] shrink-0" />
              <span>14 dni na bezpieczny zwrot lub wymianę</span>
            </div>
          </div>

          {/* Zwijane sekcje (Akordeony) */}
          <div className="pt-3 border-t border-[#EADFD5] divide-y divide-[#EADFD5]">
            {/* 1. Opis */}
            <div>
              <button
                type="button"
                onClick={() => toggleAccordion("desc")}
                className="w-full min-h-[44px] py-3 flex items-center justify-between text-xs uppercase tracking-wider font-semibold text-[#241D1B] hover:text-[#C5A069] transition-colors text-left"
              >
                <span>Opis i fason produktu</span>
                {openAccordion === "desc" ? <ChevronUp className="w-4 h-4 text-[#C5A069]" /> : <ChevronDown className="w-4 h-4 text-[#857670]" />}
              </button>
              {openAccordion === "desc" && (
                <div className="pb-4 text-xs sm:text-sm text-[#4A3F3B] leading-relaxed whitespace-pre-line font-light">
                  {product.description}
                </div>
              )}
            </div>

            {/* 2. Skład & Pielęgnacja */}
            <div>
              <button
                type="button"
                onClick={() => toggleAccordion("comp")}
                className="w-full min-h-[44px] py-3 flex items-center justify-between text-xs uppercase tracking-wider font-semibold text-[#241D1B] hover:text-[#C5A069] transition-colors text-left"
              >
                <span>Skład tkaniny & Pielęgnacja</span>
                {openAccordion === "comp" ? <ChevronUp className="w-4 h-4 text-[#C5A069]" /> : <ChevronDown className="w-4 h-4 text-[#857670]" />}
              </button>
              {openAccordion === "comp" && (
                <div className="pb-4 space-y-2 text-xs sm:text-sm text-[#4A3F3B] leading-relaxed">
                  <p><strong>Skład:</strong> {product.composition || "100% wiskoza wysokogatunkowa"}</p>
                  <p><strong>Pielęgnacja:</strong> {product.careGuide || "Zalecane pranie ręczne w 30°C. Prasować na lewej stronie chłodnym żelazkiem."}</p>
                </div>
              )}
            </div>

            {/* 3. Wymiary & Tabela */}
            <div>
              <button
                type="button"
                onClick={() => toggleAccordion("sizes")}
                className="w-full min-h-[44px] py-3 flex items-center justify-between text-xs uppercase tracking-wider font-semibold text-[#241D1B] hover:text-[#C5A069] transition-colors text-left"
              >
                <span>Tabela wymiarów na płasko</span>
                {openAccordion === "sizes" ? <ChevronUp className="w-4 h-4 text-[#C5A069]" /> : <ChevronDown className="w-4 h-4 text-[#857670]" />}
              </button>
              {openAccordion === "sizes" && (
                <div className="pb-4 space-y-2 text-xs text-[#4A3F3B]">
                  <div className="bg-[#FAF6F1] p-3 border border-[#EADFD5] font-mono whitespace-pre-line rounded-xs">
                    {product.sizeGuide || "XS: Biust 84cm, Talia 64cm, Długość 120cm\nS: Biust 88cm, Talia 68cm, Długość 122cm\nM: Biust 92cm, Talia 72cm, Długość 124cm\nL: Biust 96cm, Talia 76cm, Długość 126cm"}
                  </div>
                  <p className="text-[11px] text-[#857670]">
                    * Wymiary mierzone na płasko, dopuszczalna tolerancja +/- 1-2 cm.
                  </p>
                </div>
              )}
            </div>

            {/* 4. Dostawa & Zwroty */}
            <div>
              <button
                type="button"
                onClick={() => toggleAccordion("shipping")}
                className="w-full min-h-[44px] py-3 flex items-center justify-between text-xs uppercase tracking-wider font-semibold text-[#241D1B] hover:text-[#C5A069] transition-colors text-left"
              >
                <span>Dostawa, płatności i zwroty</span>
                {openAccordion === "shipping" ? <ChevronUp className="w-4 h-4 text-[#C5A069]" /> : <ChevronDown className="w-4 h-4 text-[#857670]" />}
              </button>
              {openAccordion === "shipping" && (
                <div className="pb-4 space-y-2 text-xs text-[#4A3F3B] leading-relaxed">
                  <p><strong>Paczkomat InPost:</strong> 13,00 zł (Darmowa od 300 zł)</p>
                  <p><strong>Kurier:</strong> 15,00 zł (Darmowa od 300 zł)</p>
                  <p><strong>Odbiór stacjonarny w Żmigrodzie:</strong> 0,00 zł</p>
                  <p className="text-[11px] text-[#857670] pt-1">
                    Zwrot bez podania przyczyny w terminie 14 dni od momentu odebrania przesyłki.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dolny przyklejony pasek zakupu na mobile (gdy główny przycisk znika z ekranu) */}
      {showStickyBottomBar && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#DFCA9B] p-2.5 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] pb-[calc(0.65rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
            <div className="flex flex-col min-w-0">
              <span className="text-[9.5px] uppercase tracking-wider text-[#857670]">Do zapłaty:</span>
              <span className="text-base font-bold text-[#241D1B] leading-tight">
                {currentPrice.toFixed(2).replace(".", ",")} zł
              </span>
              <span className="text-[10px] text-[#8C6B38] truncate font-medium">
                {selectedSize ? `Rozmiar ${selectedSize}` : "Wybierz rozmiar"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!selectedSize || !isCurrentVariantInStock) {
                  sizeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                } else {
                  handleAddToCart();
                }
              }}
              className="flex-1 min-h-[44px] py-2.5 px-4 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-[0.14em] font-semibold rounded-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {!selectedSize
                  ? "Wybierz rozmiar"
                  : !isCurrentVariantInStock
                  ? "Brak w magazynie"
                  : "Dodaj do koszyka"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Modal powiększenia zdjęcia */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 animate-in fade-in duration-200"
          onClick={() => setIsZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-4 right-4 text-white p-2.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Zamknij podgląd"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full max-w-2xl max-h-[85vh] aspect-[3/4]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={activeImage}
              alt={product.name}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}

      {/* Sekcja opinii o produkcie (gwiazdki 1-5, komentarz, zdjęcie klientki) */}
      <ProductReviewsSection productId={product.id} productName={product.name} />

      {/* Produkty powiązane / Podobne - 2 kolumny na mobile */}
      {relatedProducts.length > 0 && (
        <section className="mt-14 sm:mt-20 pt-8 sm:pt-12 border-t border-[#EADFD5]">
          <div className="text-center mb-6 sm:mb-8">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#C5A069] font-semibold mb-1">
              Dopełnij Swój Styl
            </p>
            <h2 className="font-serif text-xl sm:text-2xl text-[#241D1B]">
              Może Ci Się Spodobać
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {relatedProducts.map((p) => (
              <div key={p.id} className="group bg-white border border-[#EADFD5] hover:border-[#C5A069] transition-all rounded-xs shadow-xs overflow-hidden flex flex-col justify-between">
                <Link href={`/produkt/${p.slug}`} className="block relative aspect-[3/4] bg-[#FAF6F1] overflow-hidden">
                  <Image
                    src={p.images[0]?.url || "/images/products/neutral-placeholder.svg"}
                    alt={p.name}
                    fill
                    unoptimized={Boolean(p.images[0]?.url && p.images[0]?.url.startsWith("data:"))}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover object-top transition-transform group-hover:scale-105"
                  />
                </Link>
                <div className="p-2.5 sm:p-3 flex flex-col justify-between flex-1">
                  <Link href={`/produkt/${p.slug}`}>
                    <h4 className="font-serif text-xs sm:text-sm text-[#241D1B] group-hover:text-[#C5A069] line-clamp-1 leading-snug">
                      {p.name}
                    </h4>
                  </Link>
                  <p className="text-xs sm:text-sm font-bold text-[#241D1B] mt-1.5">
                    {(p.promotionalPrice ?? p.basePrice).toFixed(2).replace(".", ",")} zł
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
