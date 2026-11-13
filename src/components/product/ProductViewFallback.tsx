"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategorySidebar } from "@/components/layout/CategorySidebar";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { Product } from "@/lib/types";
import { ArrowLeft, Sparkles, Loader2, PackageX } from "lucide-react";

interface ProductViewFallbackProps {
  slug: string;
}

export function ProductViewFallback({ slug }: ProductViewFallbackProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadFallback() {
      try {
        // 1. Sprawdź pamięć podręczną przeglądarki (np. produkt dodany przed chwilą w panelu)
        if (typeof window !== "undefined") {
          const raw = localStorage.getItem("aura_custom_products");
          if (raw) {
            try {
              const list: Product[] = JSON.parse(raw);
              const found = list.find(
                (p) => p.slug === slug || p.id === slug || p.id === `prod-${slug}`
              );
              if (found && isMounted) {
                setProduct(found);
                setIsLoading(false);
                return;
              }
            } catch (_) {}
          }
        }

        // 2. Spróbuj pobrać z API /api/products
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          const list: Product[] = data.products || [];
          const found = list.find((p) => p.slug === slug || p.id === slug);
          if (found && isMounted) {
            setProduct(found);
            setRelatedProducts(list.filter((p) => p.id !== found.id).slice(0, 4));
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Błąd pobierania produktu awaryjnego:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadFallback();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-[#FAF6F1] flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-8">
            <Loader2 className="w-8 h-8 text-[#C5A069] animate-spin mx-auto mb-3" />
            <p className="font-serif text-sm uppercase tracking-wider text-[#241D1B]">
              Wyszukiwanie produktu w AURA Boutique...
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-[#FAF6F1]">
          <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-4 lg:gap-6 items-start">
            <CategorySidebar />

            <div className="min-w-0 bg-white border border-[#EADFD5] rounded p-8 sm:p-12 text-center shadow-sm">
              <PackageX className="w-12 h-12 text-[#A89F91] mx-auto mb-4" />
              <h1 className="font-serif text-xl sm:text-2xl text-[#241D1B] mb-2 uppercase tracking-wider">
                Produkt nie został odnaleziony
              </h1>
              <p className="text-xs sm:text-sm text-[#6E6259] max-w-md mx-auto mb-6">
                Szukany artykuł (<code className="bg-[#FAF6F1] px-1.5 py-0.5 rounded text-[#241D1B] font-mono text-xs">{slug}</code>) nie istnieje w bieżącej ofercie butiku lub został wycofany.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/katalog"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C5A069] text-white text-xs uppercase tracking-widest font-semibold rounded hover:bg-[#AF884F] transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Wróć do katalogu</span>
                </Link>
                <Link
                  href="/admin/produkty"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#EADFD5] text-[#241D1B] text-xs uppercase tracking-widest font-semibold rounded hover:border-[#C5A069] transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A069]" />
                  <span>Panel produktów</span>
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#FAF6F1]">
        <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-6 grid grid-cols-[105px_minmax(0,1fr)] min-[400px]:grid-cols-[110px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)] gap-2.5 sm:gap-4 lg:gap-6 items-start">
          <CategorySidebar />
          <div className="min-w-0">
            <ProductDetailClient
              product={product}
              relatedProducts={relatedProducts}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

