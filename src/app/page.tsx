import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Heart, Shield, Clock, MapPin } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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
            1. GŁÓWNY BANER BUTIKU
           ======================================================== */}
        <section className="relative bg-[#FAF6F1] border-b border-[#EADFD5]">
          <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-2.5 sm:pb-4">
            <h1 className="sr-only">
              AURA Boutique K.B. — Styl, który zachwyca, ceny, które kuszą, jakość, którą poczujesz
            </h1>

            <div className="relative w-full aspect-[1024/394] rounded-xs sm:rounded-md overflow-hidden shadow-[0_4px_16px_rgba(197,160,105,0.15)] border border-[#EADFD5]">
              <Image
                src="/images/hero/aura-hero-motto.png"
                alt="AURA Boutique K.B. - Styl, który zachwyca, ceny, które kuszą, jakość, którą poczujesz"
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover object-center"
              />
            </div>
          </div>
        </section>

        {/* ========================================================
            2. NOWOŚCI (Maksymalnie 8 produktów)
           ======================================================== */}
        {newProducts.length > 0 && (
          <section className="py-6 sm:py-10 max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 sm:mb-6 gap-2 sm:gap-4">
              <div>
                <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#C5A069] font-semibold mb-0.5">
                  Świeża Dostawa
                </p>
                <h2 className="font-serif text-xl sm:text-2xl text-[#241D1B]">
                  Nowości w Butiku
                </h2>
              </div>
              <Link
                href="/katalog?filter=nowosci"
                className="text-xs uppercase tracking-widest text-[#241D1B] hover:text-[#C5A069] transition-colors inline-flex items-center gap-1 font-medium min-h-[44px]"
              >
                <span>Zobacz wszystkie nowości</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C5A069]" />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
              {newProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="text-center mt-6 sm:mt-8">
              <Link
                href="/katalog?filter=nowosci"
                className="inline-flex items-center gap-2 px-6 py-2.5 sm:px-8 sm:py-3 bg-white border border-[#D8BE8E] hover:border-[#C5A069] text-xs uppercase tracking-widest text-[#241D1B] hover:text-[#C5A069] transition-all rounded-xs shadow-xs min-h-[44px]"
              >
                <span>Zobacz wszystkie nowości ({markedNew.length > 0 ? markedNew.length : allProducts.length})</span>
                <ArrowRight className="w-4 h-4 text-[#C5A069]" />
              </Link>
            </div>
          </section>
        )}

        {/* ========================================================
            3. BESTSELLERY (Tylko jeśli istnieją i nie powtarzają Nowości)
           ======================================================== */}
        {bestsellers.length > 0 && (
          <section className="py-6 sm:py-10 bg-gradient-to-b from-[#FAF6F1] to-[#F5ECE3] border-t border-[#EADFD5]">
            <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 sm:mb-6 gap-2 sm:gap-4">
                <div>
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#C5A069] font-semibold mb-0.5">
                    Najczęściej Wybierane
                  </p>
                  <h2 className="font-serif text-xl sm:text-2xl text-[#241D1B]">
                    Bestsellery
                  </h2>
                </div>
                <Link
                  href="/katalog?filter=bestsellery"
                  className="text-xs uppercase tracking-widest text-[#241D1B] hover:text-[#C5A069] transition-colors inline-flex items-center gap-1 font-medium min-h-[44px]"
                >
                  <span>Zobacz wszystkie bestsellery</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C5A069]" />
                </Link>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
                {bestsellers.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="text-center mt-6 sm:mt-8">
                <Link
                  href="/katalog?filter=bestsellery"
                  className="inline-flex items-center gap-2 px-6 py-2.5 sm:px-8 sm:py-3 bg-white border border-[#D8BE8E] hover:border-[#C5A069] text-xs uppercase tracking-widest text-[#241D1B] hover:text-[#C5A069] transition-all rounded-xs shadow-xs min-h-[44px]"
                >
                  <span>Zobacz wszystkie bestsellery</span>
                  <ArrowRight className="w-4 h-4 text-[#C5A069]" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================
            4. KRÓTKA SEKCJA O BUTIKU I ZALETACH ZAKUPÓW
           ======================================================== */}
        <section className="py-10 sm:py-14 bg-[#FAF6F1] border-t border-[#EADFD5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-8 sm:mb-10">
              <span className="text-[11px] uppercase tracking-[0.25em] text-[#C5A069] font-semibold">
                O Butiku AURA
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-[#241D1B] mt-1">
                Kobiecość, Klasa i Wygoda
              </h3>
              <p className="text-xs sm:text-sm text-[#857670] mt-2 leading-relaxed">
                AURA Boutique K.B. w Żmigrodzie to wyjątkowa przestrzeń modowa stworzona z miłości do pięknych, szlachetnych krojów i ubrań, które podkreślają naturalny urok każdej kobiety.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 bg-white p-4 sm:p-5 rounded-lg border border-[#EADFD5] shadow-2xs">
                <div className="w-11 h-11 rounded-full bg-[#F2DCD7] border border-[#DFBEB8] flex items-center justify-center text-[#916738] shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm text-[#241D1B] font-semibold">Staranna Selekcja</h4>
                  <p className="text-xs text-[#857670] mt-0.5">Wiskoza, bawełna, wełna i miękki kaszmir.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 bg-white p-4 sm:p-5 rounded-lg border border-[#EADFD5] shadow-2xs">
                <div className="w-11 h-11 rounded-full bg-[#F2DCD7] border border-[#DFBEB8] flex items-center justify-center text-[#916738] shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm text-[#241D1B] font-semibold">Wysyłka w 24h</h4>
                  <p className="text-xs text-[#857670] mt-0.5">Błyskawicznie do Paczkomatu InPost i kurierem.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 bg-white p-4 sm:p-5 rounded-lg border border-[#EADFD5] shadow-2xs">
                <div className="w-11 h-11 rounded-full bg-[#F2DCD7] border border-[#DFBEB8] flex items-center justify-center text-[#916738] shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm text-[#241D1B] font-semibold">14 Dni na Zwrot</h4>
                  <p className="text-xs text-[#857670] mt-0.5">Spokojna przymiarka w domowym zaciszu.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 bg-white p-4 sm:p-5 rounded-lg border border-[#EADFD5] shadow-2xs">
                <div className="w-11 h-11 rounded-full bg-[#F2DCD7] border border-[#DFBEB8] flex items-center justify-center text-[#916738] shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm text-[#241D1B] font-semibold">Odbiór w Żmigrodzie</h4>
                  <p className="text-xs text-[#857670] mt-0.5">Bezpłatnie w butiku przy ul. Poprzecznej 3/1A.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
