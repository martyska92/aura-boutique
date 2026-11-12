import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategorySidebar } from "@/components/layout/CategorySidebar";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
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
    notFound();
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
            UKŁAD SKLEPU: PIONOWY PANEL KATEGORII NA DESKTOPIE
            + PEŁNA SZEROKOŚĆ (MARGINESY 12-16PX) NA TELEFONIE
           ======================================================== */}
        <CategorySidebar />

        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 flex flex-col lg:flex-row gap-4 lg:gap-8 items-start">
          {/* Prawa kolumna (na mobile pełna szerokość): Karta produktu */}
          <div className="w-full flex-1 min-w-0 py-2 sm:py-4">
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
