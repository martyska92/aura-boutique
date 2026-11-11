import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Heart, Shield, Clock, ShoppingBag } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { getProducts, getCategories, getStoreSettings } from "@/lib/store-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const settings = await getStoreSettings();
  const categories = await getCategories();
  
  // Pobieramy produkty
  const newProducts = await getProducts({ isNewOnly: true });
  const bestsellers = await getProducts({ isBestsellerOnly: true });
  const promotedProducts = await getProducts({ isPromotedOnly: true });

  // Główne kategorie do okrągłych kafelków w złotych ramkach (dynamiczne z bazy/panelu)
  const displayCategories = categories
    .filter((c) => c.isActive)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#FAF6F1]">
        {/* ========================================================
            HERO SECTION - Panoramiczny baner ze zdjęciem z butiku i motto
           ======================================================== */}
        <section className="relative bg-[#FAF6F1] border-b border-[#EADFD5]">
          <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-2 sm:pt-5 pb-2.5 sm:pb-5">
            <h1 className="sr-only">
              AURA Boutique K.B. — Styl, który zachwyca, ceny, które kuszą, jakość, którą poczujesz
            </h1>

            {/* Główny baner ze zdjęciem z butiku i motto */}
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
            OKRĄGŁY SHOWCASE KATEGORII W ZŁOTYCH RAMKACH
           ======================================================== */}
        <section className="py-3.5 sm:py-8 bg-[#FAF6F1] border-b border-[#EADFD5]">
          <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 min-[360px]:grid-cols-3 sm:grid-cols-5 gap-2.5 sm:gap-6 justify-items-center">
              {displayCategories.map((item) => (
                <Link
                  key={item.id}
                  href={`/katalog?kategoria=${item.slug}`}
                  className="group flex flex-col items-center text-center w-full max-w-[110px] sm:max-w-none"
                >
                  {/* Okrągły medalion ze złotą obramówką */}
                  <div className="relative w-16 h-16 min-[380px]:w-18 min-[380px]:h-18 sm:w-24 sm:h-24 rounded-full p-[3px] bg-gradient-to-br from-[#DFCA9B] via-[#C5A069] to-[#9E743A] shadow-[0_3px_10px_rgba(197,160,105,0.2)] transition-transform duration-300 group-hover:scale-105">
                    <div className="relative w-full h-full rounded-full overflow-hidden border border-white bg-[#F7EFE8]">
                      <Image
                        src={item.imageUrl || "/images/brand/aura-logo.png"}
                        alt={item.name}
                        fill
                        unoptimized={Boolean(item.imageUrl && item.imageUrl.startsWith("data:"))}
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 72px, 96px"
                      />
                    </div>
                  </div>

                  {/* Etykieta w ramce */}
                  <span className="mt-1.5 px-2 py-0.5 sm:px-3 sm:py-1 bg-white border border-[#D8BE8E] group-hover:border-[#C5A069] group-hover:bg-[#F2DCD7] rounded-full font-serif text-[9.5px] sm:text-xs tracking-[0.1em] sm:tracking-[0.15em] text-[#241D1B] font-medium transition-all shadow-xs truncate max-w-full">
                    {item.name.toUpperCase()}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================
            POLECANE PRODUKTY / BESTSELLERY
           ======================================================== */}
        <section className="py-6 sm:py-14 max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2.5 sm:gap-4 mb-4 sm:mb-8">
            <span className="h-[1px] w-8 sm:w-20 bg-[#C5A069]/60" />
            <h2 className="font-serif text-lg sm:text-2xl text-[#241D1B] uppercase tracking-[0.12em] sm:tracking-[0.2em] text-center font-normal">
              Polecane Produkty
            </h2>
            <span className="h-[1px] w-8 sm:w-20 bg-[#C5A069]/60" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {bestsellers.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center mt-6 sm:mt-10">
            <Link
              href="/katalog?filter=bestsellery"
              className="inline-flex items-center gap-2 px-6 py-2.5 sm:px-8 sm:py-3 bg-white border border-[#D8BE8E] hover:border-[#C5A069] text-xs uppercase tracking-widest text-[#241D1B] hover:text-[#C5A069] transition-all rounded-xs shadow-xs min-h-[44px]"
            >
              <span>Zobacz wszystkie polecane</span>
              <ArrowRight className="w-4 h-4 text-[#C5A069]" />
            </Link>
          </div>
        </section>

        {/* ========================================================
            ŚWIEŻO W BUTIKU / NOWOŚCI
           ======================================================== */}
        <section className="py-6 sm:py-14 bg-gradient-to-b from-[#FAF6F1] to-[#F5ECE3] border-y border-[#EADFD5]">
          <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 sm:mb-8 gap-2 sm:gap-4">
              <div>
                <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#C5A069] font-semibold mb-0.5">
                  Świeża Dostawa
                </p>
                <h2 className="font-serif text-xl sm:text-2xl text-[#241D1B]">
                  Nowości w AURA Boutique
                </h2>
              </div>
              <Link
                href="/katalog?filter=nowosci"
                className="text-xs uppercase tracking-widest text-[#241D1B] hover:text-[#C5A069] transition-colors inline-flex items-center gap-1 font-medium min-h-[44px]"
              >
                <span>Wszystkie Nowości</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C5A069]" />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
              {newProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================
            WYBRANE PROMOCJE (Osobna sekcja na produkty promowane)
           ======================================================== */}
        {promotedProducts.length > 0 && (
          <section className="py-6 sm:py-14 bg-[#F9EFEA] border-b border-[#EADFD5]">
            <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 sm:mb-8 gap-2 sm:gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#A84B4B] font-semibold mb-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Specjalna Oferta</span>
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl text-[#241D1B]">
                    Wybrane Modele w Promocji
                  </h2>
                </div>
                <Link
                  href="/katalog?filter=promocje"
                  className="text-xs uppercase tracking-widest text-[#A84B4B] hover:text-[#241D1B] transition-colors inline-flex items-center gap-1 font-medium min-h-[44px]"
                >
                  <span>Zobacz Promocje</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
                {promotedProducts.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================
            KORZYŚCI ZAKUPÓW
           ======================================================== */}
        <section className="py-12 bg-[#FAF6F1] border-t border-[#EADFD5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#F2DCD7] border border-[#DFBEB8] flex items-center justify-center text-[#916738] shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm text-[#241D1B] font-semibold">Staranna Selekcja</h4>
                  <p className="text-xs text-[#857670] mt-1">Szlachetne tkaniny: wiskoza, len, wełna merino i kaszmir.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#F2DCD7] border border-[#DFBEB8] flex items-center justify-center text-[#916738] shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm text-[#241D1B] font-semibold">Wysyłka w 24h</h4>
                  <p className="text-xs text-[#857670] mt-1">Błyskawiczna wysyłka do Paczkomatu InPost i kurierem.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#F2DCD7] border border-[#DFBEB8] flex items-center justify-center text-[#916738] shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm text-[#241D1B] font-semibold">14 Dni na Zwrot</h4>
                  <p className="text-xs text-[#857670] mt-1">Spokojna przymiarka w domowym zaciszu.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#F2DCD7] border border-[#DFBEB8] flex items-center justify-center text-[#916738] shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm text-[#241D1B] font-semibold">Odbiór w Żmigrodzie</h4>
                  <p className="text-xs text-[#857670] mt-1">Bezpłatny odbiór osobisty w butiku przy ul. Poprzecznej 3/1A.</p>
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
