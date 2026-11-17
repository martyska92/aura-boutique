"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SlidersHorizontal,
  X,
  Search,
  Sparkles,
  Check,
  Layers,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { Product, Category } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";
import { recordLastShoppingUrl } from "@/components/ui/ContinueShoppingButton";

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
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
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

  // Synchronizacja produktów z lokalną pamięcią podręczną
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("aura_custom_products");
        if (raw) {
          const customList: Product[] = JSON.parse(raw);
          const existingIds = new Set(initialProducts.map((p) => p.id));
          const toAdd = customList.filter((p) => !existingIds.has(p.id));
          if (toAdd.length > 0) {
            setProductsList([...toAdd, ...initialProducts]);
            return;
          }
        }
      } catch (_) {}
    }
    setProductsList(initialProducts);
  }, [initialProducts]);

  // Panele wysuwane na mobile
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Synchronizacja parametrów URL
  useEffect(() => {
    const k = searchParams.get("kategoria");
    const f = searchParams.get("filter");
    const s = searchParams.get("szukaj");
    setSelectedCategory(k || "all");
    setActiveFilterTab(f || "all");
    if (s !== null) {
      setSearchQuery(s);
    }
  }, [searchParams]);

  // Rejestracja ostatnio przeglądanej ścieżki zakupowej dla przycisku "Kontynuuj zakupy"
  useEffect(() => {
    if (typeof window !== "undefined") {
      const fullUrl = window.location.pathname + window.location.search;
      recordLastShoppingUrl(fullUrl);
    }
  }, [selectedCategory, activeFilterTab, searchQuery]);

  // Zamykanie drawerów klawiszem Escape oraz blokowanie scrolla tła
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileCategoriesOpen(false);
        setMobileFiltersOpen(false);
      }
    };

    if (mobileCategoriesOpen || mobileFiltersOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileCategoriesOpen, mobileFiltersOpen]);

  // Dostępne rozmiary i kolory w katalogu wyliczane dynamicznie z wariantów produktów
  const allSizes = useMemo(() => {
    const rawSizes = new Set<string>();
    productsList.forEach((p) => {
      (p.variants || []).forEach((v) => {
        if (!v.size) return;
        let s = v.size.trim();
        if (/^uni$/i.test(s)) s = "UNI";
        else if (/^s\/m$/i.test(s)) s = "S/M";
        else if (/^l\/xl$/i.test(s)) s = "L/XL";
        else s = s.toUpperCase();
        rawSizes.add(s);
      });
    });

    const standardOrder = ["XS", "S", "S/M", "M", "L", "L/XL", "XL", "UNI"];
    const ordered = standardOrder.filter((s) => rawSizes.has(s));
    rawSizes.forEach((s) => {
      if (!ordered.includes(s)) ordered.push(s);
    });
    return ordered.length > 0 ? ordered : ["XS", "S", "S/M", "M", "L", "L/XL", "XL", "UNI"];
  }, [productsList]);

  const allColors = useMemo(() => {
    const colorMap = new Map<string, { label: string; value: string; hex?: string }>();
    colorMap.set("all", { label: "Wszystkie", value: "all" });

    const knownHexMap: Record<string, string> = {
      "piaskowy beż": "#D8C7B5",
      "beż": "#D8C7B5",
      "czarny": "#141414",
      "czerń": "#141414",
      "cappuccino": "#9E7E6B",
      "ecru / kość słoniowa": "#FAF4EC",
      "kość słoniowa": "#FAF4EC",
      "ecru": "#FAF4EC",
      "stary róż": "#C89D9C",
      "róż": "#E5BEB8",
      "pudrowy róż": "#E5BEB8",
      "czekolada": "#4A2E1B",
      "camel": "#B8874E",
      "biel": "#FFFFFF",
      "szary": "#8A8A8A",
    };

    productsList.forEach((p) => {
      (p.variants || []).forEach((v) => {
        if (!v.color) return;
        const norm = v.color.trim();
        const lower = norm.toLowerCase();
        if (!colorMap.has(lower)) {
          colorMap.set(lower, {
            label: norm,
            value: lower,
            hex: v.colorHex || knownHexMap[lower] || "#D8C7B5",
          });
        }
      });
    });

    return Array.from(colorMap.values());
  }, [productsList]);

  // Wybór kategorii z aktualizacją URL
  const handleSelectCategory = (catSlug: string) => {
    setSelectedCategory(catSlug);
    setActiveFilterTab("all");
    setMobileCategoriesOpen(false);

    const params = new URLSearchParams();
    if (catSlug !== "all") params.set("kategoria", catSlug);
    if (searchQuery) params.set("szukaj", searchQuery);
    const queryString = params.toString();
    router.push(queryString ? `/katalog?${queryString}` : "/katalog", { scroll: false });
  };

  // Wybór wyróżnienia z aktualizacją URL
  const handleSelectFilterTab = (tab: "nowosci" | "bestsellery" | "promocje" | "all") => {
    setActiveFilterTab(tab);
    setSelectedCategory("all");
    setMobileCategoriesOpen(false);

    const params = new URLSearchParams();
    if (tab !== "all") params.set("filter", tab);
    if (searchQuery) params.set("szukaj", searchQuery);
    const queryString = params.toString();
    router.push(queryString ? `/katalog?${queryString}` : "/katalog", { scroll: false });
  };

  // Resetowanie wszystkich filtrów
  const resetAllFilters = () => {
    setSelectedCategory("all");
    setActiveFilterTab("all");
    setSearchQuery("");
    setSelectedSize("all");
    setSelectedColor("all");
    setInStockOnly(false);
    setPriceMax(1000);
    setSortBy("newest");
    setMobileFiltersOpen(false);
    setMobileCategoriesOpen(false);
    router.push("/katalog", { scroll: false });
  };

  // Sprawdzenie czy filtry inne niż kategoria są aktywne
  const hasDetailedFilters =
    selectedSize !== "all" ||
    selectedColor !== "all" ||
    inStockOnly ||
    priceMax < 1000;

  const hasAnyFilters =
    selectedCategory !== "all" ||
    activeFilterTab !== "all" ||
    searchQuery !== "" ||
    hasDetailedFilters;

  // Filtrowanie produktów
  const filteredProducts = useMemo(() => {
    return productsList.filter((product) => {
      // 1. Kategoria
      if (selectedCategory !== "all") {
        const cat = categories.find((c) => c.slug === selectedCategory);
        if (cat && product.categoryId !== cat.id) return false;
      }

      // 2. Wyróżnienia (Nowości, Bestsellery, Promocje)
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

      // 4. Rozmiar (z unifikacją UNI / Uni oraz obsługą S/M i L/XL)
      if (selectedSize !== "all") {
        const normSelected = selectedSize.toLowerCase();
        const hasSize = product.variants.some((v) => {
          if (!v.size) return false;
          const s = v.size.trim().toLowerCase();
          if (normSelected === "uni" && (s === "uni" || s === "uniwersalny")) return v.stockQuantity > 0;
          return (s === normSelected || s === normSelected.replace("/", "")) && v.stockQuantity > 0;
        });
        if (!hasSize) return false;
      }

      // 5. Kolor
      if (selectedColor !== "all") {
        const hasColor = product.variants.some((v) =>
          v.color.toLowerCase().includes(selectedColor.toLowerCase())
        );
        if (!hasColor) return false;
      }

      // 6. Dostępność w magazynie
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
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [
    productsList,
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

  // Nazwa wybranej kategorii do nagłówka
  const currentHeading = useMemo(() => {
    if (activeFilterTab === "nowosci") return "Nowości w Butiku";
    if (activeFilterTab === "bestsellery") return "Bestsellery";
    if (activeFilterTab === "promocje") return "Promocje & Okazje";
    if (selectedCategory !== "all") {
      const cat = categories.find((c) => c.slug === selectedCategory);
      if (cat) return cat.name;
    }
    return "Wszystkie Kolekcje";
  }, [activeFilterTab, selectedCategory, categories]);

  return (
    <div className="w-full">
      {/* ========================================================
          1. KOMPAKTOWY PASEK MOBILNY POD NAGŁÓWKIEM (lg:hidden)
          Przyklejony, z przyciskiem "Kategorie" i "Filtry"
         ======================================================== */}
      <div className="lg:hidden sticky top-[116px] sm:top-[128px] z-30 bg-[#FAF6F1]/95 backdrop-blur-md border-b border-[#EADFD5] py-2.5 px-3 sm:px-4 shadow-xs">
        <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
          {/* Przycisk Kategorie z etykietą wybranej */}
          <button
            type="button"
            onClick={() => setMobileCategoriesOpen(true)}
            className="flex-1 py-2 px-3 bg-white border border-[#D8BE8E] text-[#241D1B] hover:border-[#C5A069] rounded-md text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-transform truncate"
          >
            <Layers className="w-3.5 h-3.5 text-[#C5A069] shrink-0" />
            <span className="truncate">
              Kategorie {selectedCategory !== "all" || activeFilterTab !== "all" ? `• ${currentHeading}` : ""}
            </span>
          </button>

          {/* Przycisk Filtry */}
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className={`py-2 px-3.5 border rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-xs active:scale-95 transition-transform ${
              hasDetailedFilters
                ? "bg-[#C5A069] text-white border-[#C5A069]"
                : "bg-white text-[#241D1B] border-[#D8BE8E] hover:border-[#C5A069]"
            }`}
          >
            <SlidersHorizontal className={`w-3.5 h-3.5 ${hasDetailedFilters ? "text-white" : "text-[#C5A069]"}`} />
            <span>Filtry {hasDetailedFilters && "•"}</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. GŁÓWNY KONTENER KATALOGU (DESKTOP + MOBILE)
         ======================================================== */}
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-6 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-4 lg:gap-6 items-start">
        {/* ─── JEDEN LEWY PANEL NA KOMPUTERZE (220 px) ─── */}
        <aside
          aria-label="Kategorie i filtry"
          className="hidden lg:block w-full sticky top-[148px] self-start z-30"
        >
          <div className="bg-white border border-[#EADFD5] rounded-xl shadow-xs overflow-hidden flex flex-col max-h-[calc(100dvh-158px)]">
            <div className="overflow-y-auto overscroll-contain p-4 space-y-5 pb-8 custom-scrollbar">
              {/* 1. SEKCJA: KATEGORIE ODZIEŻY (Z bazy danych) */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#C5A069] border-b border-[#EADFD5] pb-2">
                <Layers className="w-3.5 h-3.5" />
                <span>Kategorie</span>
              </div>
              <nav className="flex flex-col gap-1">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.slug;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat.slug)}
                      className={`text-left px-3 py-2 rounded-md text-xs font-medium transition-all ${
                        isActive
                          ? "bg-[#241D1B] text-[#F3E7D3] border-l-4 border-l-[#C5A069] font-bold shadow-xs pl-2.5"
                          : "text-[#241D1B] hover:bg-[#FAF6F1] hover:text-[#542823]"
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* 2. SEKCJA: WYRÓŻNIONE (Tylko raz!) */}
            <div className="space-y-2 pt-2 border-t border-[#EADFD5]">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C5A069] pb-1">
                Wyróżnione
              </div>
              <nav className="flex flex-col gap-1 text-xs">
                {/* Wszystkie produkty */}
                <button
                  type="button"
                  onClick={() => handleSelectCategory("all")}
                  className={`text-left px-3 py-2 rounded-md font-medium transition-all ${
                    selectedCategory === "all" && activeFilterTab === "all"
                      ? "bg-[#241D1B] text-[#F3E7D3] border-l-4 border-l-[#C5A069] font-bold shadow-xs pl-2.5"
                      : "text-[#241D1B] hover:bg-[#FAF6F1]"
                  }`}
                >
                  Wszystkie produkty
                </button>

                {/* Nowości */}
                <button
                  type="button"
                  onClick={() => handleSelectFilterTab("nowosci")}
                  className={`text-left px-3 py-2 rounded-md font-medium transition-all ${
                    activeFilterTab === "nowosci"
                      ? "bg-[#241D1B] text-[#F3E7D3] border-l-4 border-l-[#C5A069] font-bold shadow-xs pl-2.5"
                      : "text-[#241D1B] hover:bg-[#FAF6F1]"
                  }`}
                >
                  Nowości
                </button>

                {/* Bestsellery */}
                <button
                  type="button"
                  onClick={() => handleSelectFilterTab("bestsellery")}
                  className={`text-left px-3 py-2 rounded-md font-medium transition-all ${
                    activeFilterTab === "bestsellery"
                      ? "bg-[#241D1B] text-[#F3E7D3] border-l-4 border-l-[#C5A069] font-bold shadow-xs pl-2.5"
                      : "text-[#241D1B] hover:bg-[#FAF6F1]"
                  }`}
                >
                  Bestsellery
                </button>

                {/* Promocje */}
                <button
                  type="button"
                  onClick={() => handleSelectFilterTab("promocje")}
                  className={`text-left px-3 py-2 rounded-md font-medium transition-all flex items-center justify-between ${
                    activeFilterTab === "promocje"
                      ? "bg-[#241D1B] text-[#F3E7D3] border-l-4 border-l-[#C5A069] font-bold shadow-xs pl-2.5"
                      : "text-[#8C2D2D] bg-[#FCEAE7]/50 hover:bg-[#FCEAE7] font-semibold"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#8C2D2D]" />
                    <span>Promocje</span>
                  </span>
                </button>
              </nav>
            </div>

            {/* 3. SEKCJA: ROZMIAR */}
            <div className="space-y-2 pt-2 border-t border-[#EADFD5]">
              <label className="text-[11px] uppercase tracking-wider text-[#857670] block font-semibold">
                Rozmiar
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedSize("all")}
                  className={`py-1.5 border text-center rounded-sm transition-colors ${
                    selectedSize === "all"
                      ? "border-[#C5A069] bg-[#C5A069] text-white font-semibold"
                      : "border-[#EADFD5] bg-[#FAF6F1] text-[#241D1B] hover:border-[#C5A069]"
                  }`}
                >
                  Wsz.
                </button>
                {allSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(selectedSize === size ? "all" : size)}
                    className={`py-1.5 border text-center rounded-sm transition-colors ${
                      selectedSize === size
                        ? "border-[#C5A069] bg-[#C5A069] text-white font-semibold"
                        : "border-[#EADFD5] bg-[#FAF6F1] text-[#241D1B] hover:border-[#C5A069]"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. SEKCJA: KOLOR */}
            <div className="space-y-2 pt-2 border-t border-[#EADFD5]">
              <label className="text-[11px] uppercase tracking-wider text-[#857670] block font-semibold">
                Kolor
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {allColors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setSelectedColor(selectedColor === c.value ? "all" : c.value)}
                    className={`p-1.5 border text-left flex items-center gap-1.5 rounded-sm transition-colors truncate ${
                      selectedColor === c.value
                        ? "border-[#C5A069] bg-[#F2DCD7] text-[#542823] font-semibold"
                        : "border-[#EADFD5] bg-[#FAF6F1] text-[#4A3F3B] hover:border-[#C5A069]"
                    }`}
                  >
                    {c.hex && (
                      <span
                        className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                    )}
                    <span className="truncate text-[11px]">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. SEKCJA: CENA */}
            <div className="space-y-2 pt-2 border-t border-[#EADFD5]">
              <div className="flex justify-between items-center text-[11px] text-[#857670] font-semibold">
                <span>Cena do:</span>
                <span className="text-[#241D1B] font-bold">{priceMax} PLN</span>
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

            {/* 6. SEKCJA: DOSTĘPNOŚĆ */}
            <div className="pt-2 border-t border-[#EADFD5]">
              <label className="flex items-center gap-2 text-xs text-[#241D1B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 accent-[#C5A069] rounded"
                />
                <span className="font-medium">Tylko w magazynie</span>
              </label>
            </div>

            {/* Reset filtrów */}
            {hasAnyFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="w-full py-2 px-3 border border-[#D8BE8E] bg-[#FAF6F1] hover:bg-[#F2DCD7] text-[#542823] text-xs uppercase tracking-wider font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Wyczyść filtry</span>
              </button>
            )}
            </div>
          </div>
        </aside>

        {/* ─── PRAWA STRONA: NAGŁÓWEK, KONTROLA I SIATKA PRODUKTÓW ─── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Tytuł katalogu i liczba modeli (bez banera!) */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-[#EADFD5] pb-2 sm:pb-3">
            <div>
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#C5A069] font-bold">
                Katalog AURA
              </p>
              <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl text-[#241D1B] leading-tight">
                {currentHeading}
              </h1>
            </div>
            <p className="text-xs text-[#857670]">
              Dostępne modele: <strong className="text-[#241D1B] font-semibold">{filteredProducts.length}</strong>
            </p>
          </div>

          {/* Pasek kontrolny: Wyszukiwarka i Sortowanie */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 border border-[#EADFD5] rounded-md shadow-xs">
            {/* Wyszukiwarka w kolekcji */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#857670] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Szukaj w kolekcji..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FAF6F1] border border-[#D8BE8E] pl-9 pr-8 py-2 text-xs text-[#241D1B] placeholder-[#857670] focus:outline-none focus:border-[#C5A069] rounded"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#857670] hover:text-[#241D1B]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sortowanie */}
            <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-[#857670]">
              <span className="hidden sm:inline font-medium">Sortuj:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#FAF6F1] border border-[#D8BE8E] px-3 py-2 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] cursor-pointer rounded font-medium"
              >
                <option value="newest">Najnowsze</option>
                <option value="price_asc">Cena: rosnąco</option>
                <option value="price_desc">Cena: malejąco</option>
              </select>
            </div>
          </div>

          {/* Siatka produktów:
              - Na telefonie (360-430 px): 2 równe kolumny z bocznymi marginesami 12-16 px
              - Na komputerze: 3-4 kolumny produktów (bez drugiej kolumny filtrów!) */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-[#EADFD5] p-10 sm:p-14 text-center space-y-4 rounded-md">
              <p className="font-serif text-lg sm:text-xl text-[#241D1B]">
                Brak produktów spełniających podane kryteria
              </p>
              <p className="text-xs text-[#857670] max-w-sm mx-auto">
                Spróbuj zmienić parametry filtrów, usunąć wyszukiwaną frazę lub wybrać inną kategorię.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-6 py-2.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-widest transition-colors rounded shadow-xs font-medium"
              >
                Resetuj filtry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-5">
              {filteredProducts.map((product) => (
                <div key={product.id} className="w-full">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          3. DRAWER KATEGORII NA MOBILE (Wysuwany z lewej strony)
          Maksymalnie 85% szerokości ekranu, przyciemnienie tła
         ======================================================== */}
      {mobileCategoriesOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Przyciemnienie tła (Backdrop) */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileCategoriesOpen(false)}
          />

          {/* Panel wysuwany */}
          <div className="relative w-full max-w-[85vw] sm:max-w-xs bg-[#FAF6F1] h-full shadow-2xl p-5 overflow-y-auto flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            <div className="space-y-5">
              {/* Nagłówek z przyciskiem zamknięcia X */}
              <div className="flex items-center justify-between pb-3 border-b border-[#EADFD5]">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#C5A069]">
                  <Layers className="w-4 h-4" />
                  <span>Kategorie Butiku</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileCategoriesOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-[#857670] hover:text-[#241D1B] rounded-full hover:bg-black/5 transition-colors"
                  aria-label="Zamknij kategorie"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lista Wyróżnionych */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#857670]">Wyróżnione</p>
                <div className="flex flex-col gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSelectCategory("all")}
                    className={`text-left px-3 py-2.5 rounded-md font-medium transition-all ${
                      selectedCategory === "all" && activeFilterTab === "all"
                        ? "bg-[#241D1B] text-[#F3E7D3] font-bold pl-3 border-l-4 border-l-[#C5A069]"
                        : "text-[#241D1B] bg-white border border-[#EADFD5]"
                    }`}
                  >
                    Wszystkie produkty
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectFilterTab("nowosci")}
                    className={`text-left px-3 py-2.5 rounded-md font-medium transition-all ${
                      activeFilterTab === "nowosci"
                        ? "bg-[#241D1B] text-[#F3E7D3] font-bold pl-3 border-l-4 border-l-[#C5A069]"
                        : "text-[#241D1B] bg-white border border-[#EADFD5]"
                    }`}
                  >
                    Nowości
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectFilterTab("bestsellery")}
                    className={`text-left px-3 py-2.5 rounded-md font-medium transition-all ${
                      activeFilterTab === "bestsellery"
                        ? "bg-[#241D1B] text-[#F3E7D3] font-bold pl-3 border-l-4 border-l-[#C5A069]"
                        : "text-[#241D1B] bg-white border border-[#EADFD5]"
                    }`}
                  >
                    Bestsellery
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectFilterTab("promocje")}
                    className={`text-left px-3 py-2.5 rounded-md font-medium transition-all flex items-center justify-between ${
                      activeFilterTab === "promocje"
                        ? "bg-[#241D1B] text-[#F3E7D3] font-bold pl-3 border-l-4 border-l-[#C5A069]"
                        : "text-[#8C2D2D] bg-[#FCEAE7] border border-[#DEBEB7] font-semibold"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#8C2D2D]" />
                      <span>Promocje</span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Lista Kategorii Odzieży */}
              <div className="space-y-1.5 pt-2 border-t border-[#EADFD5]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#857670]">Kategorie Odzieży</p>
                <div className="flex flex-col gap-1 text-xs">
                  {categories.map((cat) => {
                    const isActive = selectedCategory === cat.slug;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(cat.slug)}
                        className={`text-left px-3 py-2.5 rounded-md font-medium transition-all ${
                          isActive
                            ? "bg-[#241D1B] text-[#F3E7D3] font-bold pl-3 border-l-4 border-l-[#C5A069]"
                            : "text-[#241D1B] bg-white border border-[#EADFD5]"
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stopka panelu kategorii */}
            <div className="pt-4 border-t border-[#EADFD5]">
              <button
                type="button"
                onClick={resetAllFilters}
                className="w-full py-2.5 border border-[#D8BE8E] bg-white text-xs uppercase tracking-wider font-semibold rounded text-[#4A3F3B]"
              >
                Resetuj wybór
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          4. DRAWER FILTRÓW NA MOBILE (Wysuwany z prawej strony)
         ======================================================== */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Przyciemnienie tła */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFiltersOpen(false)}
          />

          {/* Panel filtrów */}
          <div className="relative ml-auto w-full max-w-[85vw] sm:max-w-xs bg-[#FAF6F1] h-full shadow-2xl p-5 overflow-y-auto flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#EADFD5]">
                <h3 className="font-serif text-base uppercase text-[#241D1B] font-bold">Filtry Produktów</h3>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-[#857670] hover:text-[#241D1B] rounded-full hover:bg-black/5"
                  aria-label="Zamknij filtry"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Zawartość filtrów */}
              <div className="py-4 space-y-5 text-xs">
                {/* Rozmiar */}
                <div>
                  <p className="font-semibold text-[#241D1B] uppercase mb-2 text-[11px] tracking-wider">Rozmiar</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedSize("all")}
                      className={`py-2 border text-center rounded-sm transition-colors ${
                        selectedSize === "all"
                          ? "bg-[#C5A069] text-white border-[#C5A069] font-bold"
                          : "bg-white text-[#241D1B] border-[#EADFD5]"
                      }`}
                    >
                      Wszystkie
                    </button>
                    {allSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(selectedSize === size ? "all" : size)}
                        className={`py-2 border text-center rounded-sm transition-colors ${
                          selectedSize === size
                            ? "bg-[#C5A069] text-white border-[#C5A069] font-bold"
                            : "bg-white text-[#241D1B] border-[#EADFD5]"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kolor */}
                <div>
                  <p className="font-semibold text-[#241D1B] uppercase mb-2 text-[11px] tracking-wider">Kolor</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {allColors.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setSelectedColor(selectedColor === c.value ? "all" : c.value)}
                        className={`p-2 border text-left flex items-center gap-1.5 rounded-sm transition-colors ${
                          selectedColor === c.value
                            ? "bg-[#F2DCD7] text-[#542823] border-[#DFBEB8] font-bold"
                            : "bg-white text-[#4A3F3B] border-[#EADFD5]"
                        }`}
                      >
                        {c.hex && (
                          <span
                            className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: c.hex }}
                          />
                        )}
                        <span className="truncate">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cena */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 font-semibold text-[11px]">
                    <span className="text-[#857670] uppercase">Maksymalna cena:</span>
                    <span className="text-[#241D1B] font-bold">{priceMax} PLN</span>
                  </div>
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

                {/* Dostępność */}
                <div className="pt-2 border-t border-[#EADFD5]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="w-4 h-4 accent-[#C5A069] rounded"
                    />
                    <span className="font-medium">Tylko w magazynie</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Przyciski na dole drawera filtrów */}
            <div className="pt-4 border-t border-[#EADFD5] flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedSize("all");
                  setSelectedColor("all");
                  setInStockOnly(false);
                  setPriceMax(1000);
                }}
                className="flex-1 py-2.5 border border-[#EADFD5] bg-white text-xs uppercase text-[#4A3F3B] font-semibold rounded"
              >
                Resetuj
              </button>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 py-2.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase font-semibold rounded shadow-xs"
              >
                Pokaż ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
