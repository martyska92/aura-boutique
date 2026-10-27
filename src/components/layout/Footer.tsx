"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock, ShieldCheck, Heart } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function Footer() {
  return (
    <footer
      className="border-t border-[#968372] text-[#241D1B] mt-auto"
      style={{
        backgroundColor: "#BCAB9B",
        backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
        backgroundRepeat: "repeat",
      }}
    >
      {/* Sekcja główna stopki */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Kolumna 1: Brand & Misja */}
          <div className="space-y-4">
            <div className="flex items-start">
              <BrandLogo size="md" />
            </div>
            <p className="text-xs text-[#2E221E] leading-relaxed font-light">
              Kobiecy butik stworzony z miłości do ponadczasowej elegancji, szlachetnych tkanin i kobiecego wdzięku. Odwiedź nas w Żmigrodzie lub zamów wygodnie online z dostawą do Paczkomatu i kurierem.
            </p>
            <div className="pt-2 text-[11px] text-[#241D1B] flex items-center gap-1.5 font-semibold">
              <Heart className="w-3.5 h-3.5 text-[#8A3A35]" />
              <span>Szyte i selekcjonowane z dbałością o każdy detal</span>
            </div>
          </div>

          {/* Kolumna 2: Kolekcje */}
          <div className="space-y-4">
            <h4 className="font-serif text-sm uppercase tracking-[0.2em] text-[#241D1B] border-b border-[#968372] pb-2 font-semibold">
              Kolekcje
            </h4>
            <ul className="space-y-2.5 text-xs text-[#2E221E] font-medium">
              <li>
                <Link href="/katalog?filter=nowosci" className="hover:text-[#5E4738] transition-colors">
                  Nowości
                </Link>
              </li>
              <li>
                <Link href="/katalog?kategoria=sukienki" className="hover:text-[#5E4738] transition-colors">
                  Sukienki
                </Link>
              </li>
              <li>
                <Link href="/katalog?kategoria=komplety" className="hover:text-[#5E4738] transition-colors">
                  Komplety i Garnitury
                </Link>
              </li>
              <li>
                <Link href="/katalog?kategoria=swetry" className="hover:text-[#5E4738] transition-colors">
                  Swetry i Dzianiny
                </Link>
              </li>
              <li>
                <Link href="/katalog?kategoria=okrycia" className="hover:text-[#5E4738] transition-colors">
                  Płaszcze i Okrycia
                </Link>
              </li>
              <li>
                <Link href="/katalog?filter=promocje" className="text-[#6E2222] font-bold hover:text-[#241D1B] transition-colors">
                  Wyprzedaż & Promocje
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolumna 3: Obsługa i Informacje */}
          <div className="space-y-4">
            <h4 className="font-serif text-sm uppercase tracking-[0.2em] text-[#241D1B] border-b border-[#968372] pb-2 font-semibold">
              Dla Klientek
            </h4>
            <ul className="space-y-2.5 text-xs text-[#2E221E] font-medium">
              <li>
                <Link href="/o-butiku" className="hover:text-[#5E4738] transition-colors">
                  O butiku AURA
                </Link>
              </li>
              <li>
                <Link href="/dostawa-i-platnosci" className="hover:text-[#5E4738] transition-colors">
                  Dostawa i płatności
                </Link>
              </li>
              <li>
                <Link href="/zwroty-i-reklamacje" className="hover:text-[#5E4738] transition-colors">
                  Zwroty i reklamacje (14 dni)
                </Link>
              </li>
              <li>
                <Link href="/kontakt" className="hover:text-[#5E4738] transition-colors">
                  Kontakt i dojazd
                </Link>
              </li>
              <li>
                <Link href="/regulamin" className="hover:text-[#5E4738] transition-colors">
                  Regulamin sklepu
                </Link>
              </li>
              <li>
                <Link href="/polityka-prywatnosci" className="hover:text-[#5E4738] transition-colors">
                  Polityka prywatności & RODO
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolumna 4: Butik Stacjonarny & Kontakt */}
          <div className="space-y-4">
            <h4 className="font-serif text-sm uppercase tracking-[0.2em] text-[#241D1B] border-b border-[#968372] pb-2 font-semibold">
              Butik w Żmigrodzie
            </h4>
            <div className="space-y-3 text-xs text-[#2E221E]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#8C7248] shrink-0 mt-0.5" />
                <span>
                  Żmigród, ul. Poprzeczna 3/1A
                  <span className="block text-[11px] text-[#5A483D]">woj. dolnośląskie</span>
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#8C7248] shrink-0" />
                <span>Pon - Pt: 10:00 - 18:00 | Sob: 10:00 - 14:00</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#8C7248] shrink-0" />
                <span>+48 789 123 456</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#8C7248] shrink-0" />
                <span>kontakt@auraboutique.pl</span>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-[10px] uppercase tracking-widest text-[#241D1B] mb-1.5 font-bold">
                Płatności i Dostawa
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] text-[#2E221E]">
                <span className="px-2 py-1 bg-[#DDD0C4]/80 rounded border border-[#968372] font-semibold">BLIK</span>
                <span className="px-2 py-1 bg-[#DDD0C4]/80 rounded border border-[#968372]">Przelewy24</span>
                <span className="px-2 py-1 bg-[#DDD0C4]/80 rounded border border-[#968372]">InPost Paczkomaty</span>
                <span className="px-2 py-1 bg-[#DDD0C4]/80 rounded border border-[#968372]">Kurier</span>
                <span className="px-2 py-1 bg-[#DDD0C4]/80 rounded border border-[#968372]">Odbiór osobisty</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dolny pasek praw autorskich & link do panelu */}
      <div
        className="border-t border-[#968372] py-5 px-4 sm:px-6 lg:px-8 text-[11px] text-[#3D2E24]"
        style={{
          backgroundColor: "#A39080",
          backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
          backgroundRepeat: "repeat",
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 font-medium">
          <p>© 2026 AURA Boutique. Wszelkie prawa zastrzeżone.</p>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-[#2E221E] hover:text-[#5E4738] transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#8C7248]" />
              <span>Panel właścicielki (/admin)</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
