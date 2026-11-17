"use client";

import React, { useState, useEffect } from "react";
import Link from "next/image";
import Image from "next/image";
import NextLink from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { StoreSettings, HeroSlide } from "@/lib/types";

interface HeroBannerProps {
  settings: StoreSettings;
}

export function HeroBanner({ settings }: HeroBannerProps) {
  const activeSlides = (settings.heroSlides || []).filter((s) => s.isActive);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Jeśli brak zdefiniowanych slajdów, stwórz domyślny slajd z ustawień
  const defaultSlide: HeroSlide = {
    id: "default-slide",
    headline: settings.heroHeadline || "Styl, który zachwyca",
    subheadline: settings.heroSubheadline || "Ceny, które kuszą • Jakość, którą poczujesz",
    imageUrl: settings.heroImageUrl || "/images/hero/aura-hero-motto.png",
    buttonText: settings.heroButtonText || "Odkryj kolekcję",
    buttonLink: settings.heroButtonLink || "/katalog",
    isActive: true,
    order: 0,
  };

  const slidesToRender = activeSlides.length > 0 ? activeSlides : [defaultSlide];

  // Automatyczna rotacja slajdów co 6 sekund jeśli jest więcej niż 1 slajd
  useEffect(() => {
    if (slidesToRender.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slidesToRender.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slidesToRender.length]);

  const currentSlide = slidesToRender[currentSlideIndex] || defaultSlide;

  const isDefaultMottoGraphic =
    currentSlide.imageUrl === "/images/hero/aura-hero-motto.png" &&
    (!currentSlide.headline || currentSlide.headline === "Styl, który zachwyca");

  return (
    <section className="relative w-full aspect-[1024/394] rounded-md overflow-hidden shadow-xs border border-[#EADFD5] group bg-[#FAF6F1]">
      <Image
        src={currentSlide.imageUrl || "/images/hero/aura-hero-motto.png"}
        alt={`${currentSlide.headline || "AURA Boutique K.B."} - ${currentSlide.subheadline || "Moda damska"}`}
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 1200px"
        className="object-cover object-center transition-all duration-700"
      />

      {/* Jeśli użytkownik wpisał własny nagłówek / treść, która nie jest tylko grafiką motto, renderujemy elegancką nakładkę */}
      {!isDefaultMottoGraphic && (currentSlide.headline || currentSlide.subheadline) && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent flex flex-col justify-center px-6 sm:px-12 text-white">
          <div className="max-w-md space-y-2 sm:space-y-3">
            {currentSlide.headline && (
              <h1 className="font-serif text-xl sm:text-3xl lg:text-4xl font-light tracking-wide text-[#FFF9F2] drop-shadow-md">
                {currentSlide.headline}
              </h1>
            )}
            {currentSlide.subheadline && (
              <p className="text-xs sm:text-sm text-[#F0E6DC] leading-relaxed font-light drop-shadow">
                {currentSlide.subheadline}
              </p>
            )}
            {currentSlide.buttonText && currentSlide.buttonLink && (
              <div className="pt-2">
                <NextLink
                  href={currentSlide.buttonLink}
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-[11px] sm:text-xs uppercase tracking-widest font-semibold rounded shadow-md transition-all"
                >
                  <span>{currentSlide.buttonText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </NextLink>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nawigacja slajdami (jeśli jest więcej niż 1 slajd) */}
      {slidesToRender.length > 1 && (
        <>
          <button
            type="button"
            onClick={() =>
              setCurrentSlideIndex((prev) => (prev - 1 + slidesToRender.length) % slidesToRender.length)
            }
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 hover:bg-black/60 text-white transition-opacity opacity-0 group-hover:opacity-100"
            aria-label="Poprzedni slajd"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() =>
              setCurrentSlideIndex((prev) => (prev + 1) % slidesToRender.length)
            }
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 hover:bg-black/60 text-white transition-opacity opacity-0 group-hover:opacity-100"
            aria-label="Następny slajd"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Kropki paginacji slajdów */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {slidesToRender.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlideIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentSlideIndex ? "w-6 bg-[#C5A069]" : "w-1.5 bg-white/60 hover:bg-white"
                }`}
                aria-label={`Przejdź do slajdu ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
