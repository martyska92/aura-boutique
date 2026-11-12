"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Sparkles, Layers } from "lucide-react";

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

  const currentCategory = searchParams.get("kategoria");
  const currentFilter = searchParams.get("filter");

  const isAllActive = pathname === "/katalog" && !currentCategory && !currentFilter;
  const isNewActive = pathname === "/katalog" && currentFilter === "nowosci";
  const isBestsellerActive = pathname === "/katalog" && currentFilter === "bestsellery";
  const isPromoActive = pathname === "/katalog" && currentFilter === "promocje";

  return (
    <aside
      aria-label="Kategorie sklepu"
      className="sticky top-[86px] sm:top-[98px] lg:top-[114px] self-start w-full max-h-[calc(100dvh-5.75rem)] sm:max-h-[calc(100dvh-6.75rem)] lg:max-h-[calc(100dvh-7.75rem)] overflow-y-auto no-scrollbar z-20"
    >
      <div className="bg-white border border-[#EADFD5] rounded-md p-1.5 sm:p-2.5 lg:p-3.5 shadow-xs space-y-2.5 sm:space-y-4">
        {/* 1. SEKCJA: KATEGORIE Z BAZY DANYCH */}
        <div>
          <div className="flex items-center justify-center lg:justify-start gap-1 pb-1.5 sm:pb-2 border-b border-[#EADFD5] text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] sm:tracking-[0.2em] text-[#C5A069]">
            <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="truncate">Kategorie</span>
          </div>

          <nav className="flex flex-col gap-0.5 sm:gap-1 pt-1.5 text-xs">
            {categories.map((c) => {
              const active = pathname === "/katalog" && currentCategory === c.slug;
              return (
                <Link
                  key={c.slug}
                  href={`/katalog?kategoria=${c.slug}`}
                  className={`block w-full text-left px-1.5 sm:px-2.5 lg:px-3 py-1.5 sm:py-2 rounded-md font-medium text-[10.5px] min-[400px]:text-[11px] lg:text-xs leading-snug break-words transition-all min-h-[34px] sm:min-h-[38px] flex items-center ${
                    active
                      ? "bg-[#241D1B] text-[#F3E7D3] border-l-2 sm:border-l-3 lg:border-l-4 border-l-[#C5A069] font-bold shadow-xs pl-1 sm:pl-2"
                      : "text-[#241D1B] hover:bg-[#FAF6F1] hover:text-[#542823]"
                  }`}
                >
                  <span className="w-full break-words">{c.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 2. SEKCJA: WYRÓŻNIONE */}
        <div className="pt-2 border-t border-[#EADFD5]">
          <div className="flex items-center justify-center lg:justify-start gap-1 pb-1.5 sm:pb-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] sm:tracking-[0.2em] text-[#857670]">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A069] shrink-0" />
            <span className="truncate">Wyróżnione</span>
          </div>

          <nav className="flex flex-col gap-0.5 sm:gap-1 pt-1 text-xs">
            <Link
              href="/katalog"
              className={`block w-full text-left px-1.5 sm:px-2.5 lg:px-3 py-1.5 sm:py-2 rounded-md font-medium text-[10.5px] min-[400px]:text-[11px] lg:text-xs leading-snug break-words transition-all min-h-[34px] sm:min-h-[38px] flex items-center ${
                isAllActive
                  ? "bg-[#241D1B] text-[#F3E7D3] border-l-2 sm:border-l-3 lg:border-l-4 border-l-[#C5A069] font-bold shadow-xs pl-1 sm:pl-2"
                  : "text-[#241D1B] hover:bg-[#FAF6F1] hover:text-[#542823]"
              }`}
            >
              <span className="w-full break-words">Wszystkie</span>
            </Link>

            <Link
              href="/katalog?filter=nowosci"
              className={`block w-full text-left px-1.5 sm:px-2.5 lg:px-3 py-1.5 sm:py-2 rounded-md font-medium text-[10.5px] min-[400px]:text-[11px] lg:text-xs leading-snug break-words transition-all min-h-[34px] sm:min-h-[38px] flex items-center ${
                isNewActive
                  ? "bg-[#241D1B] text-[#F3E7D3] border-l-2 sm:border-l-3 lg:border-l-4 border-l-[#C5A069] font-bold shadow-xs pl-1 sm:pl-2"
                  : "text-[#241D1B] hover:bg-[#FAF6F1] hover:text-[#542823]"
              }`}
            >
              <span className="w-full break-words">Nowości</span>
            </Link>

            <Link
              href="/katalog?filter=bestsellery"
              className={`block w-full text-left px-1.5 sm:px-2.5 lg:px-3 py-1.5 sm:py-2 rounded-md font-medium text-[10.5px] min-[400px]:text-[11px] lg:text-xs leading-snug break-words transition-all min-h-[34px] sm:min-h-[38px] flex items-center ${
                isBestsellerActive
                  ? "bg-[#241D1B] text-[#F3E7D3] border-l-2 sm:border-l-3 lg:border-l-4 border-l-[#C5A069] font-bold shadow-xs pl-1 sm:pl-2"
                  : "text-[#241D1B] hover:bg-[#FAF6F1] hover:text-[#542823]"
              }`}
            >
              <span className="w-full break-words">Bestsellery</span>
            </Link>

            <Link
              href="/katalog?filter=promocje"
              className={`block w-full text-left px-1.5 sm:px-2.5 lg:px-3 py-1.5 sm:py-2 rounded-md font-medium text-[10.5px] min-[400px]:text-[11px] lg:text-xs leading-snug break-words transition-all min-h-[34px] sm:min-h-[38px] flex items-center ${
                isPromoActive
                  ? "bg-[#241D1B] text-[#F3E7D3] border-l-2 sm:border-l-3 lg:border-l-4 border-l-[#C5A069] font-bold shadow-xs pl-1 sm:pl-2"
                  : "text-[#8C2D2D] bg-[#FCEAE7]/50 hover:bg-[#FCEAE7] font-semibold"
              }`}
            >
              <span className="w-full break-words flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#8C2D2D] shrink-0" />
                <span>Promocje</span>
              </span>
            </Link>
          </nav>
        </div>
      </div>
    </aside>
  );
}

export function CategorySidebar() {
  return (
    <Suspense
      fallback={
        <aside className="sticky top-[86px] sm:top-[98px] lg:top-[114px] self-start w-full p-2" />
      }
    >
      <CategorySidebarInner />
    </Suspense>
  );
}
