"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Sparkles, Layers, ChevronRight } from "lucide-react";

interface NavCategory {
  label: string;
  href: string;
  key: string;
  categorySlug?: string;
  filterSlug?: string;
  highlight?: boolean;
}

const BASE_NAV_CATEGORIES: NavCategory[] = [
  { label: "Wszystkie", href: "/katalog", key: "all" },
  { label: "Nowości", href: "/katalog?filter=nowosci", key: "nowosci", filterSlug: "nowosci" },
  { label: "Bestsellery", href: "/katalog?filter=bestsellery", key: "bestsellery", filterSlug: "bestsellery" },
  { label: "Bluzy", href: "/katalog?kategoria=bluzy", key: "bluzy", categorySlug: "bluzy" },
  { label: "Koszule", href: "/katalog?kategoria=koszule", key: "koszule", categorySlug: "koszule" },
  { label: "Topy", href: "/katalog?kategoria=topy", key: "topy", categorySlug: "topy" },
  { label: "T-shirty", href: "/katalog?kategoria=t-shirty", key: "t-shirty", categorySlug: "t-shirty" },
  { label: "Marynarki", href: "/katalog?kategoria=marynarki", key: "marynarki", categorySlug: "marynarki" },
  { label: "Promocje", href: "/katalog?filter=promocje", key: "promocje", filterSlug: "promocje", highlight: true },
];

function CategorySidebarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<NavCategory[]>(BASE_NAV_CATEGORIES);

  // Pobieranie dynamicznych kategorii z bazy/sklepu
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.categories && Array.isArray(data.categories)) {
          const dynamicCats: NavCategory[] = data.categories.map((c: any) => ({
            label: c.name,
            href: `/katalog?kategoria=${c.slug}`,
            key: c.slug,
            categorySlug: c.slug,
          }));

          setCategories([
            { label: "Wszystkie", href: "/katalog", key: "all" },
            { label: "Nowości", href: "/katalog?filter=nowosci", key: "nowosci", filterSlug: "nowosci" },
            { label: "Bestsellery", href: "/katalog?filter=bestsellery", key: "bestsellery", filterSlug: "bestsellery" },
            ...dynamicCats,
            { label: "Promocje", href: "/katalog?filter=promocje", key: "promocje", filterSlug: "promocje", highlight: true },
          ]);
        }
      })
      .catch(() => {});
  }, []);

  const currentCategoryParam = searchParams.get("kategoria");
  const currentFilterParam = searchParams.get("filter");

  const isItemActive = (item: NavCategory) => {
    if (pathname !== "/katalog") {
      return false;
    }
    if (item.categorySlug) {
      return currentCategoryParam === item.categorySlug;
    }
    if (item.filterSlug) {
      return currentFilterParam === item.filterSlug;
    }
    if (item.key === "all") {
      return !currentCategoryParam && !currentFilterParam;
    }
    return false;
  };

  return (
    <aside
      aria-label="Kategorie sklepu"
      className="shrink-0 w-[105px] min-[400px]:w-[115px] lg:w-[210px] sticky top-14 sm:top-16 lg:top-20 self-start z-30 max-h-[calc(100dvh-3.75rem)] sm:max-h-[calc(100dvh-4.25rem)] lg:max-h-[calc(100dvh-5.25rem)] overflow-y-auto no-scrollbar py-2 sm:py-4"
    >
      <div className="bg-[#FAF6F1] border border-[#EADFD5] rounded-lg p-1.5 sm:p-3 shadow-xs space-y-1 sm:space-y-1.5">
        {/* Nagłówek panelu na desktopie */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-2 border-b border-[#EADFD5] text-[11px] font-bold uppercase tracking-[0.2em] text-[#C5A069]">
          <Layers className="w-3.5 h-3.5" />
          <span>Kategorie</span>
        </div>

        {/* Etykieta na telefonie */}
        <div className="lg:hidden px-1.5 py-1 text-center border-b border-[#EADFD5] text-[9px] font-bold uppercase tracking-widest text-[#C5A069]">
          Kategorie
        </div>

        {/* Lista kategorii */}
        <nav className="flex flex-col gap-1 pt-1">
          {categories.map((item) => {
            const active = isItemActive(item);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`group flex items-center justify-between px-2 sm:px-3 py-2 sm:py-2.5 rounded-md text-[11px] sm:text-xs font-medium transition-all min-h-[40px] sm:min-h-[42px] leading-tight ${
                  active
                    ? "bg-[#241D1B] text-[#F3E7D3] border-l-4 border-l-[#C5A069] font-bold shadow-xs pl-2"
                    : item.highlight
                    ? "bg-[#F2DDD9]/80 text-[#6E2222] hover:bg-[#F2DDD9] font-semibold"
                    : "text-[#241D1B] hover:bg-[#EADDCF]/60 hover:text-[#542823]"
                }`}
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {item.highlight && (
                    <Sparkles className="w-3 h-3 text-[#6E2222] shrink-0" />
                  )}
                  <span className="truncate lg:whitespace-normal line-clamp-2">
                    {item.label}
                  </span>
                </div>
                {/* Wskaźnik chevron na laptopie */}
                <ChevronRight
                  className={`hidden lg:block w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                    active ? "text-[#C5A069]" : "opacity-40"
                  }`}
                />
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export function CategorySidebar() {
  return (
    <Suspense
      fallback={
        <aside className="shrink-0 w-[105px] min-[400px]:w-[115px] lg:w-[210px] sticky top-14 sm:top-16 lg:top-20 self-start p-2" />
      }
    >
      <CategorySidebarInner />
    </Suspense>
  );
}
