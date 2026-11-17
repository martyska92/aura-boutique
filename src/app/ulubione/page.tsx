import React, { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WishlistClient } from "@/components/wishlist/WishlistClient";
import { getProducts } from "@/lib/store-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Twoje Ulubione Produkty | AURA Boutique",
  description: "Zapisane ubrania, komplety i sukienki w Twojej prywatnej liście ulubionych AURA Boutique.",
};

export default async function WishlistPage() {
  const allProducts = await getProducts({ includeArchived: false });

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#FAF6F1]">
        <Suspense
          fallback={
            <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-[#857670]">
              Wczytywanie Twoich ulubionych...
            </div>
          }
        >
          <WishlistClient allProducts={allProducts} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
