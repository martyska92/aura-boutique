"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Gift, Tag, Truck, ArrowRight, Clock, HeartHandshake } from "lucide-react";

export function PromotionsShowcase() {
  const [isWeekend, setIsWeekend] = useState(false);

  useEffect(() => {
    // Sprawdzamy czy w strefie polskiej trwa weekend (od piątku 18:00 do niedzieli 23:59)
    const checkWeekend = () => {
      const now = new Date();
      const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Warsaw",
        hour: "numeric",
        weekday: "short",
        hour12: false,
      });
      const parts = dtf.formatToParts(now);
      const hourPart = parts.find((p) => p.type === "hour")?.value;
      const hour = hourPart ? parseInt(hourPart, 10) : now.getHours();
      const weekday = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Warsaw",
        weekday: "short",
      }).format(now);

      const dayMap: Record<string, number> = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
      };
      const day = dayMap[weekday] ?? now.getDay();
      const active = (day === 5 && hour >= 18) || day === 6 || day === 0;
      setIsWeekend(active);
    };

    checkWeekend();
    const interval = setInterval(checkWeekend, 60000);
    return () => clearInterval(interval);
  }, []);

  // Zapamiętanie kodu polecającego z linku (?ref= lub ?polecenie=)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get("ref") || urlParams.get("polecenie");
      if (refCode) {
        sessionStorage.setItem("aura_referral_code", refCode.trim().toUpperCase());
      }
    } catch (e) {}
  }, []);

  return (
    <section id="promocje" className="scroll-mt-24 sm:scroll-mt-32 py-6 sm:py-12 bg-gradient-to-b from-[#FAF6F1] to-[#F5ECE1] border-b border-[#EADFD5]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Nagłówek sekcji banerów */}
        <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#D8BE8E] rounded-full text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#8C6B38] font-semibold mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A069]" />
            <span>Aktualne Promocje Butiku</span>
          </div>
          <h2 className="font-serif text-xl sm:text-3xl text-[#241D1B] leading-tight">
            Wyjątkowe Okazje & Rabaty
          </h2>
          <p className="text-xs sm:text-sm text-[#857670] mt-1 font-light">
            Skorzystaj z promocji przygotowanych specjalnie dla Ciebie w AURA Boutique
          </p>
        </div>

        {/* Siatka banerów reklamowych: 16px odstępu między kartami */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* BANER 1: Promocja Weekendowa (od piątku 18:00) */}
          <div
            className={`relative p-4 sm:p-5 rounded-xs border transition-all duration-300 flex flex-col justify-between shadow-xs ${
              isWeekend
                ? "bg-gradient-to-br from-[#FFF9F2] via-white to-[#F9EFE6] border-[#C5A069] ring-2 ring-[#C5A069]/30"
                : "bg-white border-[#EADFD5] hover:border-[#C5A069]"
            }`}
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    isWeekend
                      ? "bg-emerald-100 text-emerald-800 animate-pulse"
                      : "bg-[#F3EBE1] text-[#7A6458]"
                  }`}
                >
                  {isWeekend ? "● PROMOCJA TRWA" : "Od piątku 18:00"}
                </span>
                <span className="text-xs font-serif font-bold text-[#8C6B38] bg-[#FAF6F1] px-2 py-0.5 rounded border border-[#EADFD5]">
                  –15%
                </span>
              </div>

              <div className="flex items-center gap-2 mb-1.5 text-[#C5A069]">
                <Clock className="w-4 h-4 shrink-0" />
                <h3 className="font-serif text-[20px] sm:text-[22px] text-[#241D1B] font-semibold leading-snug">
                  Weekendowa Promocja
                </h3>
              </div>

              <p className="text-[15px] sm:text-sm text-[#5A483D] leading-[1.5]">
                W każdy weekend od <strong>piątku 18:00</strong> do <strong>niedzieli 23:59</strong> kupisz wszystkie Marynarki aż <strong>15% taniej</strong>! Rabat nalicza się sam w koszyku.
              </p>
            </div>

            <div className="pt-2.5 mt-2.5 border-t border-[#FAF6F1]">
              <Link
                href="/katalog?kategoria=marynarki"
                className="inline-flex items-center justify-between w-full min-h-[44px] text-xs font-semibold uppercase tracking-wider text-[#C5A069] hover:text-[#AF884F] group"
              >
                <span>Zobacz Marynarki</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* BANER 2: Prezent na Otwarcie — Skarpetki gratis powyżej 100 zł */}
          <div className="relative p-4 sm:p-5 rounded-xs bg-white border border-[#EADFD5] hover:border-[#C5A069] transition-all duration-300 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                  PREZENT GRATIS
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  0,00 zł
                </span>
              </div>

              <div className="flex items-center gap-2 mb-1.5 text-[#C5A069]">
                <Gift className="w-4 h-4 shrink-0" />
                <h3 className="font-serif text-[20px] sm:text-[22px] text-[#241D1B] font-semibold leading-snug">
                  Prezent na Otwarcie
                </h3>
              </div>

              <p className="text-[15px] sm:text-sm text-[#5A483D] leading-[1.5]">
                Do każdego zamówienia o wartości <strong>powyżej 100 zł</strong> dołączamy urocze bawełniane skarpetki w losowym kolorze całkowicie bezpłatnie!
              </p>
            </div>

            <div className="pt-2.5 mt-2.5 border-t border-[#FAF6F1]">
              <Link
                href="/katalog?filter=nowosci"
                className="inline-flex items-center justify-between w-full min-h-[44px] text-xs font-semibold uppercase tracking-wider text-[#C5A069] hover:text-[#AF884F] group"
              >
                <span>Wybierz ubrania powyżej 100 zł</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* BANER 3: Powitalne –15% & Poleć Przyjaciółce */}
          <div className="relative p-4 sm:p-5 rounded-xs bg-white border border-[#EADFD5] hover:border-[#C5A069] transition-all duration-300 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-800">
                  DLA NOWYCH
                </span>
                <span className="text-xs font-serif font-bold text-[#8C6B38] bg-[#FAF6F1] px-2 py-0.5 rounded border border-[#EADFD5]">
                  –15%
                </span>
              </div>

              <div className="flex items-center gap-2 mb-1.5 text-[#C5A069]">
                <HeartHandshake className="w-4 h-4 shrink-0" />
                <h3 className="font-serif text-[20px] sm:text-[22px] text-[#241D1B] font-semibold leading-snug">
                  Powitalny Rabat & Polecenia
                </h3>
              </div>

              <p className="text-[15px] sm:text-sm text-[#5A483D] leading-[1.5]">
                Zarejestruj konto i odbierz <strong>–15%</strong> na start. Podziel się swoim kodem z przyjaciółką – obie zyskacie po 15% zniżki na kolejne zakupy!
              </p>
            </div>

            <div className="pt-2.5 mt-2.5 border-t border-[#FAF6F1]">
              <Link
                href="/logowanie"
                className="inline-flex items-center justify-between w-full min-h-[44px] text-xs font-semibold uppercase tracking-wider text-[#C5A069] hover:text-[#AF884F] group"
              >
                <span>Załóż Konto i Odbierz</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* BANER 4: Darmowa Dostawa */}
          <div className="relative p-4 sm:p-5 rounded-xs bg-white border border-[#EADFD5] hover:border-[#C5A069] transition-all duration-300 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-800">
                  INPOST & KURIER
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  0,00 zł
                </span>
              </div>

              <div className="flex items-center gap-2 mb-1.5 text-[#C5A069]">
                <Truck className="w-4 h-4 shrink-0" />
                <h3 className="font-serif text-[20px] sm:text-[22px] text-[#241D1B] font-semibold leading-snug">
                  Darmowa Dostawa
                </h3>
              </div>

              <p className="text-[15px] sm:text-sm text-[#5A483D] leading-[1.5]">
                Dla wszystkich zamówień <strong>od 300 zł</strong> dostawa do Paczkomatu InPost oraz Kurierem prosto pod drzwi jest w 100% bezpłatna.
              </p>
            </div>

            <div className="pt-2.5 mt-2.5 border-t border-[#FAF6F1]">
              <Link
                href="/katalog"
                className="inline-flex items-center justify-between w-full min-h-[44px] text-xs font-semibold uppercase tracking-wider text-[#C5A069] hover:text-[#AF884F] group"
              >
                <span>Przejdź do Katalogu</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

