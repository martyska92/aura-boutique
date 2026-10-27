import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { getProductBySlug, getProducts } from "@/lib/store-data";

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
      <main className="flex-1 bg-[#FAF8F5]">
        <ProductDetailClient
          product={product}
          relatedProducts={relatedProducts}
        />
      </main>
      <Footer />
    </>
  );
}
