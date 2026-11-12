"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Sparkles, Layers, X } from "lucide-react";

interface CategoryItem {
  id?: string;
  name: string;
  slug: string;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { slug: "sukienki", name: "Sukienki" },
  { slug: "swetry", name: "Swetry" },
  { slug: "bluzy", name: "Bluzy" },
  { slug: "koszule", name: "Koszule" },
  { slug: "topy", name: "Topy" },
  { slug: "t-shirty", name: "T-shirty" },
  { slug: "marynarki", name: "Marynarki" },
];

function CategorySidebarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Pobieranie kategorii zarządzanych w bazie/sklepie
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.categories && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});
  }, []);

  // Obsługa klawisza Escape i blokady scrolla dla drawera mobilnego
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileDrawerOpen(false);
      }
    };

    if (mobileDrawerOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

  const currentCategory = searchParams.get("kategoria");
  const currentFilter = searchParams.get("filter");

  const isAllActive = pathname === "/katalog" && !currentCategory && !currentFilter;
  const isNewActive = pathname === "/katalog" && currentFilter === "nowosci";
  const isBestsellerActive = pathname === "/katalog" && currentFilter === "bestsellery";
  const isPromoActive = pathname === "/katalog" && currentFilter === "promocje";

  return (
    <>
      {/* ─── PASEK MOBILNY POD NAGŁÓWKIEM (lg:hidden) ─── */}
      <div className="lg:hidden sticky top-[80px] sm:top-[92px] z-30 w-full bg-[#FAF6F1]/95 backdrop-blur-md border-b border-[#EADFD5] py-2 px-3 sm:px-4 shadow-xs">
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#D8BE8E] hover:border-[#C5A069] rounded-md text-xs font-semibold uppercase tracking-wider text-[#241D1B] shadow-xs active:scale-95 transition-transform"
          aria-expanded={mobileDrawerOpen}
          aria-label="Otwórz listę kategorii"
        >
          <Layers className="w-3.5 h-3.5 text-[#C5A069]" />
          <span>☰ Kategorie</span>
        </button>
      </div>

      {/* ─── DRAWER MOBILNY (Wysuwany z lewej, max 85% szerokości) ─── */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Ciemne tło / backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Panel drawera */}
          <div className="relative w-[85vw] max-w-[340px] bg-[#FAF6F1] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Nagłówek drawera z przyciskiem X */}
            <div className="p-4 border-b border-[#EADFD5] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#C5A069]" />
                <span className="font-serif text-base text-[#241D1B] font-semibold">
                  Kategorie AURA
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF6F1] border border-[#EADFD5] flex items-center justify-center text-[#241D1B] hover:text-[#8C2D2D]"
                aria-label="Zamknij kategorie"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Treść kategorii w drawerze */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Sekcja: Kategorie */}
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#857670] px-2 mb-1">
                  Kategorie ubrań
                </p>
                {categories.map((c) => {
                  const active = pathname === "/katalog" && currentCategory === c.slug;
                  return (
                    <Link
                      key={c.slug}
                      href={`/katalog?kategoria=${c.slug}`}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`block px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                        active
                          ? "bg-[#241D1B] text-[#F3E7D3] border-l-4 border-l-[#C5A069] font-bold shadow-xs pl-2.5"
                          : "text-[#241D1B] hover:bg-[#EADDCF]/60"
                      }`}
                    >
                      {c.name}
                    </Link>
                  );
                })}
              </div>

              {/* Sekcja: Wyróżnione */}
              <div className="space-y-1.5 pt-3 border-t border-[#EADFD5]">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#857670] px-2 mb-1">
                  Wyróżnione
                </p>
                <Link
                  href="/katalog"
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`block px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                    isAllActive
                      ? "bg-[#241D1B] text-[#F3E7D3] border-l-4 border-l-[#C5A069] font-bold shadow-xs pl-2.5"
                      : "text-[#241D1B] hover:bg-[#EADDCF]/60"
                  }`}
                >
                  Wszystkie produkty
                </Link>
                <Link
                  href="/katalog?filter=nowosci"
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`block px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                    isNewActive
                      ? "bg-[#241D1B] text-[#F3E7D3] border-l-4 border-l-[#C5A069] font-bold shadow-xs pl-2.5"
                      : "text-[#241D1B] hover:bg-[#EADDCF]/60"
                  }`}
                >
                  Nowości
                </Link>
                <Link
                  href="/katalog?filter=bestsellery"
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`block px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                    isBestsellerActive
                      ? "bg-[#241D1B] text-[#F3E7D3] border-l-4 border-l-[#C5A069] font-bold shadow-xs pl-2.5"
                      : "text-[#241D1B] hover:bg-[#EADDCF]/60"
                  }`}
                >
                  Bestsellery
                </Link>
                <Link
                  href="/katalog?filter=promocje"
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                    isPromoActive
                      ? "bg-[#241D1B] text-[#F3E7D3] border-l-4 border-l-[#C5A069] font-bold shadow-xs pl-2.5"
                      : "text-[#8C2D2D] bg-[#FCEAE7]/60 hover:bg-[#FCEAE7] font-semibold"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#8C2D2D]" />
                    <span>Promocje</span>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── JEDEN STAŁY LEWY PANEL NA DESKTOPIE (hidden lg:block) ─── */}
      <aside
        aria-label="Kategorie sklepu"
        className="hidden lg:block w-[240px] xl:w-[260px] shrink-0 sticky top-[108px] self-start max-h-[calc(100vh-125px)] overflow-y-auto no-scrollbar py-2"
      >
        <div className="bg-white border border-[#EADFD5] rounded-md p-4 shadow-xs space-y-4">
          {/* 1. KATEGORIE Z BAZY */}
          <div>
            <div className="flex items-center gap-2 pb-2.5 border-b border-[#EADFD5] text-[11px] font-bold uppercase tracking-[0.2em] text-[#C5A069]">
              <Layers className="w-3.5 h-3.5" />
              <span>Kategorie</span>
            </div>
            <nav className="flex flex-col gap-1 pt-2 text-xs">
              {categories.map((c) => {
                const active = pathname === "/katalog" && currentCategory === c.slug;
                return (
                  <Link
                    key={c.slug}
                    href={`/katalog?kategoria=${c.slug}`}
                    className={`text-left px-3 py-2 rounded-md font-medium transition-all ${
                      active
                        ? "bg-[#241D1B] text-[#F3E7D3] border-l-4 border-l-[#C5A069] font-bold shadow-xs pl-2.5"
                        : "text-[#241D1B] hover:bg-[#FAF6F1]"
                    }`}
                  >
                    {c.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* 2. WYRÓŻNIONE */}
          <div className="pt-2 border-t border-[#EADFD5]">
            <div className="flex items-center gap-1.5 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#857670]">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A069]" />
              <span>Wyróżnione</span>
            </div>
            <nav className="flex flex-col gap-1 text-xs">
              <Link
                href="/katalog"
                className={`text-left px-3 py-2 rounded-md font-medium transition-all ${
                  isAllActive
                    ? "bg-[#241D1B] text-[#F3E7D3] border-l-4 border-l-[#C5A069] font-bold shadow-xs pl-2.5"
                    : "text-[#241D1B] hover:bg-[#FAF6F1]"
                }`}
              >
                Wszystkie produkty
              </Link>
              <Link
                href="/katalog?filter=nowosci"
                className={`text-left px-3 py-2 rounded-md font-medium transition-all ${
                  isNewActive
                    ? "bg-[#241D1B] text-[#F3E7D3] border-l-4 border-l-[#C5A069] font-bold shadow-xs pl-2.5"
                    : "text-[#241D1B] hover:bg-[#FAF6F1]"
                }`}
              >
                Nowości
              </Link>
              <Link
                href="/katalog?filter=bestsellery"
                className={`text-left px-3 py-2 rounded-md font-medium transition-all ${
                  isBestsellerActive
                    ? "bg-[#241D1B] text-[#F3E7D3] border-l-4 border-l-[#C5A069] font-bold shadow-xs pl-2.5"
                    : "text-[#241D1B] hover:bg-[#FAF6F1]"
                }`}
              >
                Bestsellery
              </Link>
              <Link
                href="/katalog?filter=promocje"
                className={`text-left px-3 py-2 rounded-md font-medium transition-all flex items-center justify-between ${
                  isPromoActive
                    ? "bg-[#241D1B] text-[#F3E7D3] border-l-4 border-l-[#C5A069] font-bold shadow-xs pl-2.5"
                    : "text-[#8C2D2D] bg-[#FCEAE7]/50 hover:bg-[#FCEAE7] font-semibold"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#8C2D2D]" />
                  <span>Promocje</span>
                </span>
              </Link>
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
}

export function CategorySidebar() {
  return (
    <Suspense
      fallback={
        <aside className="hidden lg:block w-[240px] xl:w-[260px] shrink-0 sticky top-[108px] self-start p-4" />
      }
    >
      <CategorySidebarInner />
    </Suspense>
  );
}
