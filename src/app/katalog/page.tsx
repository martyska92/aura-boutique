import React, { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CatalogClient } from "@/components/catalog/CatalogClient";
import { getProducts, getCategories } from "@/lib/store-data";

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
      <main className="flex-1 bg-[#FAF8F5]">
        <Suspense fallback={<div className="p-12 text-center text-xs text-[#7E7771]">Ładowanie katalogu...</div>}>
          <CatalogClient
            initialProducts={allProducts}
            categories={categories}
            initialCategorySlug={resolvedParams.kategoria}
            initialFilter={resolvedParams.filter}
            initialSearch={resolvedParams.szukaj}
          />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
