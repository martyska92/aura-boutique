import React, { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategorySidebar } from "@/components/layout/CategorySidebar";
import { CatalogClient } from "@/components/catalog/CatalogClient";
import { getProducts, getCategories } from "@/lib/store-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface CatalogPageProps {
  searchParams: Promise<{
    kategoria?: string;
    filter?: string;
    szukaj?: string;
  }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const resolvedParams = await searchParams;
  const categories = await getCategories();
  const allProducts = await getProducts({ includeArchived: false });

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#FAF6F1]">
        {/* ========================================================
            UKŁAD SKLEPU: PIONOWY PANEL KATEGORII PO LEWEJ STRONIE
            + KATALOG I FILTRY PO PRAWEJ STRONIE
           ======================================================== */}
        <div className="max-w-[1600px] mx-auto px-1.5 sm:px-4 lg:px-6 flex gap-1.5 sm:gap-4 lg:gap-6 items-start">
          {/* Lewy pionowy panel kategorii (stale widoczny na laptopie i telefonie) */}
          <CategorySidebar />

          {/* Prawa kolumna: Katalog produktów */}
          <div className="flex-1 min-w-0 py-2 sm:py-4">
            <Suspense fallback={<div className="p-12 text-center text-xs text-[#7E7771]">Ładowanie katalogu...</div>}>
              <CatalogClient
                initialProducts={allProducts}
                categories={categories}
                initialCategorySlug={resolvedParams.kategoria}
                initialFilter={resolvedParams.filter}
                initialSearch={resolvedParams.szukaj}
              />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
