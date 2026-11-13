import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategorySidebar } from "@/components/layout/CategorySidebar";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { ProductViewFallback } from "@/components/product/ProductViewFallback";
import { getProductBySlug, getProducts } from "@/lib/store-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Produkt nie znaleziony | AURA Boutique K.B.",
    };
  }

  return {
    title: `${product.name} | AURA Boutique K.B.`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: product.images[0]?.url ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return <ProductViewFallback slug={slug} />;
  }

  // Pobierz podobne produkty z tej samej kategorii lub inne
  const allProducts = await getProducts();
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#FAF6F1]">
        {/* ========================================================
            UKŁAD SKLEPU: 
            – Mobile: pełna szerokość karty produktu (kategorie w nagłówku)
            – Desktop: lewa kolumna (kategorie 220px) + prawa kolumna (produkt)
           ======================================================== */}
        <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-6 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-4 lg:gap-6 items-start">
          {/* Lewa kolumna: Panel kategorii widoczny na desktopie */}
          <CategorySidebar />

          {/* Prawa kolumna: Karta produktu */}
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
