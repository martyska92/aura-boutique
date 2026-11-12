import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Heart, Shield, Clock, MapPin } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategorySidebar } from "@/components/layout/CategorySidebar";
import { ProductCard } from "@/components/product/ProductCard";
import { getProducts } from "@/lib/store-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  // Pobieramy opublikowane produkty w magazynie
  const allProducts = await getProducts({ inStockOnly: true });

  // 1. Nowości — pierwszeństwo na stronie głównej (max 8)
  const markedNew = allProducts.filter((p) => p.isNew);
  const newProducts = (markedNew.length > 0 ? markedNew : allProducts).slice(0, 8);
  const newProductIds = new Set(newProducts.map((p) => p.id));

  // 2. Bestsellery — wykluczamy produkty, które już są w Nowościach (max 8)
  const bestsellers = allProducts
    .filter((p) => p.isBestseller && !newProductIds.has(p.id))
    .slice(0, 8);

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#FAF6F1]">
        {/* ========================================================
            UKŁAD SKLEPU: 2 KOLUMNY OBOK SIEBIE (CSS GRID)
            – Lewa kolumna: kategorie (100–110px mobile, 220px desktop)
            – Prawa kolumna: baner, sekcje i produkty
           ======================================================== */}
        <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-6 grid grid-cols-[105px_minmax(0,1fr)] min-[400px]:grid-cols-[110px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)] gap-2.5 sm:gap-4 lg:gap-6 items-start">
          {/* Lewa kolumna: Panel kategorii stale widoczny pod nagłówkiem */}
          <CategorySidebar />

          {/* Prawa kolumna: Baner, Nowości, Bestsellery i O butiku */}
          <div className="min-w-0 space-y-5 sm:space-y-8">
            {/* 1. GŁÓWNY BANER BUTIKU */}
            <section className="relative w-full aspect-[1024/394] rounded-md overflow-hidden shadow-xs border border-[#EADFD5]">
              <Image
                src="/images/hero/aura-hero-motto.png"
                alt="AURA Boutique K.B. - Styl, który zachwyca, ceny, które kuszą, jakość, którą poczujesz"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1200px"
                className="object-cover object-center"
              />
            </section>

            {/* 2. NOWOŚCI (Maksymalnie 8 produktów) */}
            {newProducts.length > 0 && (
              <section className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 sm:gap-4 border-b border-[#EADFD5] pb-2 sm:pb-3">
                  <div>
                    <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.25em] text-[#C5A069] font-semibold mb-0.5">
                      Świeża Dostawa
                    </p>
                    <h2 className="font-serif text-base sm:text-xl lg:text-2xl text-[#241D1B]">
                      Nowości w Butiku
                    </h2>
                  </div>
                  <Link
                    href="/katalog?filter=nowosci"
                    className="text-[11px] sm:text-xs uppercase tracking-widest text-[#241D1B] hover:text-[#C5A069] transition-colors inline-flex items-center gap-1 font-medium"
                  >
                    <span>Zobacz wszystkie ({markedNew.length > 0 ? markedNew.length : allProducts.length})</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C5A069]" />
                  </Link>
                </div>

                {/* Na telefonie produkty w 1 kolumnie obok kategorii 100-110px */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
                  {newProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {/* 3. BESTSELLERY (Tylko jeśli istnieją i nie powtarzają Nowości) */}
            {bestsellers.length > 0 && (
              <section className="space-y-3 sm:space-y-4 pt-2 border-t border-[#EADFD5]">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 sm:gap-4 border-b border-[#EADFD5] pb-2 sm:pb-3">
                  <div>
                    <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.25em] text-[#C5A069] font-semibold mb-0.5">
                      Najczęściej Wybierane
                    </p>
                    <h2 className="font-serif text-base sm:text-xl lg:text-2xl text-[#241D1B]">
                      Bestsellery
                    </h2>
                  </div>
                  <Link
                    href="/katalog?filter=bestsellery"
                    className="text-[11px] sm:text-xs uppercase tracking-widest text-[#241D1B] hover:text-[#C5A069] transition-colors inline-flex items-center gap-1 font-medium"
                  >
                    <span>Wszystkie bestsellery</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C5A069]" />
                  </Link>
                </div>

                {/* Na telefonie produkty w 1 kolumnie obok kategorii 100-110px */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
                  {bestsellers.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {/* 4. KRÓTKA SEKCJA O BUTIKU I ZALETACH ZAKUPÓW */}
            <section className="pt-4 sm:pt-8 border-t border-[#EADFD5]">
              <div className="text-center max-w-xl mx-auto mb-5">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#C5A069] font-semibold">
                  O Butiku AURA
                </span>
                <h3 className="font-serif text-lg sm:text-2xl text-[#241D1B] mt-1">
                  Kobiecość, Klasa i Wygoda
                </h3>
                <p className="text-xs text-[#857670] mt-1 leading-relaxed">
                  AURA Boutique K.B. w Żmigrodzie to wyjątkowa przestrzeń modowa stworzona z miłości do pięknych, szlachetnych krojów i ubrań, które podkreślają naturalny urok każdej kobiety.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                <div className="flex items-start gap-2.5 bg-white p-3 rounded-lg border border-[#EADFD5] shadow-2xs">
                  <div className="w-8 h-8 rounded-full bg-[#F2DCD7] border border-[#DFBEB8] flex items-center justify-center text-[#916738] shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-xs font-semibold text-[#241D1B]">Staranna Selekcja</h4>
                    <p className="text-[11px] text-[#857670] mt-0.5">Wiskoza, bawełna, wełna i kaszmir.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-white p-3 rounded-lg border border-[#EADFD5] shadow-2xs">
                  <div className="w-8 h-8 rounded-full bg-[#F2DCD7] border border-[#DFBEB8] flex items-center justify-center text-[#916738] shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-xs font-semibold text-[#241D1B]">Wysyłka w 24h</h4>
                    <p className="text-[11px] text-[#857670] mt-0.5">Błyskawicznie do Paczkomatu i kurierem.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-white p-3 rounded-lg border border-[#EADFD5] shadow-2xs">
                  <div className="w-8 h-8 rounded-full bg-[#F2DCD7] border border-[#DFBEB8] flex items-center justify-center text-[#916738] shrink-0">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-xs font-semibold text-[#241D1B]">14 Dni na Zwrot</h4>
                    <p className="text-[11px] text-[#857670] mt-0.5">Spokojna przymiarka w domu.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-white p-3 rounded-lg border border-[#EADFD5] shadow-2xs">
                  <div className="w-8 h-8 rounded-full bg-[#F2DCD7] border border-[#DFBEB8] flex items-center justify-center text-[#916738] shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-xs font-semibold text-[#241D1B]">Żmigród</h4>
                    <p className="text-[11px] text-[#857670] mt-0.5">Odbiór: ul. Poprzeczna 3/1A.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
