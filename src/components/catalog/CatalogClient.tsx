"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, Search, Sparkles, Check, ChevronDown } from "lucide-react";
import { Product, Category } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";

interface CatalogClientProps {
  initialProducts: Product[];
  categories: Category[];
  initialCategorySlug?: string;
  initialFilter?: string;
  initialSearch?: string;
}

export function CatalogClient({
  initialProducts,
  categories,
  initialCategorySlug,
  initialFilter,
  initialSearch = "",
}: CatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filtry stanu
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategorySlug || "all"
  );
  const [activeFilterTab, setActiveFilterTab] = useState<string>(
    initialFilter || "all"
  );
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedSize, setSelectedSize] = useState<string>("all");
  const [selectedColor, setSelectedColor] = useState<string>("all");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [priceMax, setPriceMax] = useState<number>(1000);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Dostępne rozmiary i kolory w całym katalogu
  const allSizes = ["XS", "S", "M", "L", "XL", "UNI"];
  const allColors = [
    { label: "Wszystkie", value: "all" },
    { label: "Kość Słoniowa", value: "ivory", hex: "#FAF4EC" },
    { label: "Piaskowy Beż", value: "sand", hex: "#D8C7B5" },
    { label: "Pudrowy Róż", value: "róż", hex: "#E5BEB8" },
    { label: "Camel", value: "camel", hex: "#B8874E" },
    { label: "Czerń", value: "czerń", hex: "#141414" },
  ];

  // Filtrowanie produktów
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      // 1. Kategoria
      if (selectedCategory !== "all") {
        const cat = categories.find((c) => c.slug === selectedCategory);
        if (cat && product.categoryId !== cat.id) return false;
      }

      // 2. Specjalne filtry
      if (activeFilterTab === "nowosci" && !product.isNew) return false;
      if (activeFilterTab === "bestsellery" && !product.isBestseller) return false;
      if (activeFilterTab === "promocje" && (!product.isPromoted || !product.promotionalPrice)) return false;

      // 3. Wyszukiwanie tekstowe
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesDesc = product.description.toLowerCase().includes(q);
        const matchesComp = product.composition?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesComp) return false;
      }

      // 4. Rozmiar
      if (selectedSize !== "all") {
        const hasSize = product.variants.some(
          (v) => v.size.toLowerCase().includes(selectedSize.toLowerCase()) && v.stockQuantity > 0
        );
        if (!hasSize) return false;
      }

      // 5. Kolor
      if (selectedColor !== "all") {
        const hasColor = product.variants.some((v) =>
          v.color.toLowerCase().includes(selectedColor.toLowerCase())
        );
        if (!hasColor) return false;
      }

      // 6. Tylko dostępne w magazynie
      if (inStockOnly) {
        const inStock = product.variants.some((v) => v.stockQuantity > 0);
        if (!inStock) return false;
      }

      // 7. Maksymalna cena
      const currentPrice = product.promotionalPrice ?? product.basePrice;
      if (currentPrice > priceMax) return false;

      return true;
    }).sort((a, b) => {
      const priceA = a.promotionalPrice ?? a.basePrice;
      const priceB = b.promotionalPrice ?? b.basePrice;

      if (sortBy === "price_asc") return priceA - priceB;
      if (sortBy === "price_desc") return priceB - priceA;
      // newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [
    initialProducts,
    selectedCategory,
    activeFilterTab,
    searchQuery,
    selectedSize,
    selectedColor,
    inStockOnly,
    priceMax,
    sortBy,
    categories,
  ]);

  const resetAllFilters = () => {
    setSelectedCategory("all");
    setActiveFilterTab("all");
    setSearchQuery("");
    setSelectedSize("all");
    setSelectedColor("all");
    setInStockOnly(false);
    setPriceMax(1000);
    setSortBy("newest");
  };

  const hasActiveFilters =
    selectedCategory !== "all" ||
    activeFilterTab !== "all" ||
    searchQuery !== "" ||
    selectedSize !== "all" ||
    selectedColor !== "all" ||
    inStockOnly ||
    priceMax < 1000;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Baner Kolekcji z mottem butiku */}
      <h1 className="sr-only">Katalog AURA Boutique K.B. - Ekskluzywna Kolekcja Damska</h1>
      <div className="mb-8 rounded-sm overflow-hidden border border-[#D8BE8E]/70 shadow-[0_6px_24px_rgba(197,160,105,0.14)] bg-[#FAF6F1]">
        <div className="relative aspect-[1024/394] w-full overflow-hidden">
          <Image
            src="/images/hero/aura-hero-motto.png"
            alt="AURA Boutique K.B. - Styl, który zachwyca, ceny, które kuszą — jakość, którą poczujesz"
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover object-center"
          />
        </div>
      </div>

      {/* Pasek kategorii horyzontalny - Stylistyka Wizualizacji nr 2 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar text-xs uppercase tracking-wider justify-start sm:justify-center border-b border-[#EADFD5]">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
            selectedCategory === "all"
              ? "bg-[#C5A069] text-white font-medium shadow-xs"
              : "bg-white text-[#5E4F49] border border-[#EADFD5] hover:border-[#C5A069] hover:bg-[#FAF6F1]"
          }`}
        >
          Wszystkie
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.slug)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              selectedCategory === cat.slug
                ? "bg-[#C5A069] text-white font-medium shadow-xs"
                : "bg-white text-[#5E4F49] border border-[#EADFD5] hover:border-[#C5A069] hover:bg-[#FAF6F1]"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Pasek kontrolny: Wyszukiwarka, Filtry mobilne, Sortowanie */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8 bg-white p-4 border border-[#EADFD5] rounded-xs shadow-xs">
        {/* Szukaj */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#857670] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Szukaj w kolekcji..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF6F1] border border-[#D8BE8E] pl-9 pr-8 py-2 text-xs text-[#241D1B] placeholder-[#857670] focus:outline-none focus:border-[#C5A069] rounded-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#857670] hover:text-[#241D1B]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Przyciski filtrów i sortowania */}
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden px-4 py-2 border border-[#D8BE8E] bg-[#F2DCD7] text-[#542823] text-xs uppercase tracking-wider flex items-center gap-2 hover:border-[#C5A069] rounded-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#C5A069]" />
            <span>Filtry {hasActiveFilters && "•"}</span>
          </button>

          {/* Sortowanie */}
          <div className="flex items-center gap-2 text-xs text-[#857670]">
            <span className="hidden sm:inline">Sortuj:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#FAF6F1] border border-[#D8BE8E] px-3 py-2 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] cursor-pointer rounded-xs"
            >
              <option value="newest">Najnowsze</option>
              <option value="price_asc">Cena: rosnąco</option>
              <option value="price_desc">Cena: malejąco</option>
            </select>
          </div>
        </div>
      </div>

      {/* Główna sekcja z bocznymi filtrami na Desktopie */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Kolumna filtrów - Desktop */}
        <aside className="hidden lg:block space-y-6 bg-white p-6 border border-[#EADFD5] rounded-xs shadow-xs h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-[#EADFD5]">
            <h3 className="font-serif text-sm uppercase tracking-wider text-[#241D1B]">
              Filtruj Ofertę
            </h3>
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="text-[11px] text-[#A84B4B] hover:underline"
              >
                Wyczyść wszystko
              </button>
            )}
          </div>

          {/* Szybkie kolekcje */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider text-[#857670] block font-medium">
              Wyróżnione
            </label>
            <div className="flex flex-col gap-1.5 text-xs">
              <button
                onClick={() => setActiveFilterTab(activeFilterTab === "nowosci" ? "all" : "nowosci")}
                className={`text-left px-2.5 py-1.5 rounded-sm transition-colors flex items-center justify-between ${
                  activeFilterTab === "nowosci"
                    ? "bg-[#ECCDC7] text-[#542823] font-semibold border border-[#DEBEB7]"
                    : "text-[#4A3F3B] hover:bg-[#FAF6F1]"
                }`}
              >
                <span>Nowości</span>
                {activeFilterTab === "nowosci" && <Check className="w-3.5 h-3.5 text-[#542823]" />}
              </button>

              <button
                onClick={() => setActiveFilterTab(activeFilterTab === "bestsellery" ? "all" : "bestsellery")}
                className={`text-left px-2.5 py-1.5 rounded-sm transition-colors flex items-center justify-between ${
                  activeFilterTab === "bestsellery"
                    ? "bg-[#C5A069] text-white font-medium shadow-xs"
                    : "text-[#4A3F3B] hover:bg-[#FAF6F1]"
                }`}
              >
                <span>Bestsellery</span>
                {activeFilterTab === "bestsellery" && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setActiveFilterTab(activeFilterTab === "promocje" ? "all" : "promocje")}
                className={`text-left px-2.5 py-1.5 rounded-sm transition-colors flex items-center justify-between ${
                  activeFilterTab === "promocje"
                    ? "bg-[#A84B4B] text-white font-medium"
                    : "text-[#A84B4B] hover:bg-[#F9EFEF]"
                }`}
              >
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Tylko Promocje</span>
                </span>
                {activeFilterTab === "promocje" && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Rozmiar */}
          <div className="space-y-2 pt-4 border-t border-[#EADFD5]">
            <label className="text-[11px] uppercase tracking-wider text-[#857670] block font-medium">
              Rozmiar
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                onClick={() => setSelectedSize("all")}
                className={`py-1.5 border text-center rounded-xs transition-colors ${
                  selectedSize === "all"
                    ? "border-[#C5A069] bg-[#C5A069] text-white font-medium"
                    : "border-[#EADFD5] bg-[#FAF6F1] text-[#241D1B] hover:border-[#C5A069]"
                }`}
              >
                Wszystkie
              </button>
              {allSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(selectedSize === size ? "all" : size)}
                  className={`py-1.5 border text-center rounded-xs transition-colors ${
                    selectedSize === size
                      ? "border-[#C5A069] bg-[#C5A069] text-white font-medium"
                      : "border-[#EADFD5] bg-[#FAF6F1] text-[#241D1B] hover:border-[#C5A069]"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Kolor */}
          <div className="space-y-2 pt-4 border-t border-[#EADFD5]">
            <label className="text-[11px] uppercase tracking-wider text-[#857670] block font-medium">
              Kolor
            </label>
            <div className="space-y-1.5 text-xs">
              {allColors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setSelectedColor(c.value)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm transition-colors ${
                    selectedColor === c.value
                      ? "bg-[#F2DCD7] font-semibold text-[#542823] border border-[#DEBEB7]"
                      : "text-[#4A3F3B] hover:bg-[#FAF6F1]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {c.hex && (
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20"
                        style={{ backgroundColor: c.hex }}
                      />
                    )}
                    <span>{c.label}</span>
                  </div>
                  {selectedColor === c.value && <Check className="w-3.5 h-3.5 text-[#542823]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Maksymalna cena */}
          <div className="space-y-2 pt-4 border-t border-[#EADFD5]">
            <div className="flex justify-between text-[11px] uppercase tracking-wider text-[#857670] font-medium">
              <span>Maks. cena</span>
              <span className="text-[#241D1B] font-semibold">{priceMax} PLN</span>
            </div>
            <input
              type="range"
              min="100"
              max="1000"
              step="20"
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full accent-[#C5A069] cursor-pointer"
            />
          </div>

          {/* Dostępność */}
          <div className="pt-4 border-t border-[#EADFD5]">
            <label className="flex items-center gap-2 text-xs text-[#241D1B] cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 accent-[#C5A069] rounded"
              />
              <span>Tylko dostępne w magazynie</span>
            </label>
          </div>
        </aside>

        {/* Siatka produktów */}
        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between text-xs text-[#857670]">
            <span>
              Znaleziono: <strong className="text-[#241D1B]">{filteredProducts.length}</strong> produktów
            </span>
            {hasActiveFilters && (
              <span className="text-[11px] text-[#C5A069] font-medium">Filtry aktywne</span>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-[#EADFD5] p-12 text-center space-y-4 rounded-xs">
              <p className="font-serif text-lg text-[#241D1B]">
                Nie znaleziono produktów spełniających podane kryteria
              </p>
              <p className="text-xs text-[#857670] max-w-sm mx-auto">
                Spróbuj zmienić filtry, usunąć wyszukiwaną frazę lub zresetować parametry wyboru.
              </p>
              <button
                onClick={resetAllFilters}
                className="px-6 py-2.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-widest transition-colors rounded-xs shadow-xs"
              >
                Resetuj wszystkie filtry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal / Drawer filtrów mobilnych */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-[#FAF6F1] h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#EADFD5]">
                <h3 className="font-serif text-base uppercase text-[#241D1B]">Filtry</h3>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1 text-[#857670] hover:text-[#241D1B]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Zawartość filtrów na mobile */}
              <div className="py-4 space-y-6">
                <div>
                  <p className="text-xs font-semibold text-[#241D1B] uppercase mb-2">Rozmiar</p>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    {allSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(selectedSize === size ? "all" : size)}
                        className={`py-1.5 border text-center rounded-xs transition-colors ${
                          selectedSize === size
                            ? "bg-[#C5A069] text-white border-[#C5A069]"
                            : "bg-white text-[#241D1B] border-[#EADFD5]"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#241D1B] uppercase mb-2">Kolor</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {allColors.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setSelectedColor(c.value)}
                        className={`p-2 border text-left flex items-center gap-1.5 rounded-xs ${
                          selectedColor === c.value
                            ? "bg-[#F2DCD7] text-[#542823] border-[#DFBEB8] font-medium"
                            : "bg-white text-[#4A3F3B] border-[#EADFD5]"
                        }`}
                      >
                        {c.hex && <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: c.hex }} />}
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#241D1B] uppercase mb-2">Cena do: {priceMax} PLN</p>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="20"
                    value={priceMax}
                    onChange={(e) => setPriceMax(Number(e.target.value))}
                    className="w-full accent-[#C5A069]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#EADFD5] flex gap-2">
              <button
                onClick={resetAllFilters}
                className="flex-1 py-3 border border-[#EADFD5] bg-white text-xs uppercase text-[#4A3F3B] rounded-xs"
              >
                Resetuj
              </button>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 py-3 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase font-medium rounded-xs shadow-xs"
              >
                Zastosuj ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
