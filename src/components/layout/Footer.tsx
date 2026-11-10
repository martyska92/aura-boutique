"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock, HeartHandshake } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

interface PublicSettings {
  boutiqueName?: string;
  address?: string;
  phone?: string;
  email?: string;
  openingHours?: string;
}

export function Footer() {
  const [settings, setSettings] = useState<PublicSettings>({
    address: "Żmigród, ul. Poprzeczna 3/1A",
    phone: "+48 789 123 456",
    email: "kontakt@auraboutique.pl",
    openingHours: "Pon - Pt: 10:00 - 17:00 | Sob: 9:00 - 13:00",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setSettings({
            address: data.address || "Żmigród, ul. Poprzeczna 3/1A",
            phone: data.phone || "+48 789 123 456",
            email: data.email || "kontakt@auraboutique.pl",
            openingHours: data.openingHours || "Pon - Pt: 10:00 - 17:00 | Sob: 9:00 - 13:00",
          });
        }
      })
      .catch(() => {});
  }, []);

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
              Butik z damską kolekcją ubrań i dodatków. Stworzony z miłości do ponadczasowych stylizacji, wysokiej jakości tkanin i kobiecego wdzięku. Odwiedź nas w Żmigrodzie lub zamów online z dostawą do paczkomatu i kurierem.
            </p>
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
                <Link href="/katalog?kategoria=bluzy" className="hover:text-[#5E4738] transition-colors">
                  Bluzy
                </Link>
              </li>
              <li>
                <Link href="/katalog?kategoria=koszule" className="hover:text-[#5E4738] transition-colors">
                  Koszule
                </Link>
              </li>
              <li>
                <Link href="/katalog?kategoria=topy" className="hover:text-[#5E4738] transition-colors">
                  Topy
                </Link>
              </li>
              <li>
                <Link href="/katalog?kategoria=t-shirty" className="hover:text-[#5E4738] transition-colors">
                  T-shirty
                </Link>
              </li>
              <li>
                <Link href="/katalog?kategoria=marynarki" className="hover:text-[#5E4738] transition-colors">
                  Marynarki
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
              <li className="pt-1 border-t border-[#968372]/50">
                <Link href="/konto" className="flex items-center gap-1.5 text-[#5E2B24] font-bold hover:text-[#241D1B] transition-colors">
                  <HeartHandshake className="w-3.5 h-3.5 text-[#8C7248]" />
                  <span>Poleć przyjaciółce (–15%)</span>
                </Link>
              </li>
              <li>
                <Link href="/konto" className="hover:text-[#5E4738] transition-colors">
                  Moje konto / Logowanie
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
                  {settings.address}
                  <span className="block text-[11px] text-[#5A483D]">woj. dolnośląskie</span>
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#8C7248] shrink-0" />
                <span>{settings.openingHours}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#8C7248] shrink-0" />
                <a href={`tel:${settings.phone?.replace(/\s+/g, "")}`} className="hover:underline">
                  {settings.phone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#8C7248] shrink-0" />
                <a href={`mailto:${settings.email}`} className="hover:underline">
                  {settings.email}
                </a>
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

      {/* Dolny pasek praw autorskich (bez widocznego linku do panelu dla klientek) */}
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
          <div className="flex items-center gap-4 text-xs">
            <Link href="/regulamin" className="hover:text-[#18110D] transition-colors">
              Regulamin
            </Link>
            <span>•</span>
            <Link href="/polityka-prywatnosci" className="hover:text-[#18110D] transition-colors">
              Polityka Prywatności & RODO
            </Link>
            <span>•</span>
            <Link href="/kontakt" className="hover:text-[#18110D] transition-colors">
              Kontakt
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
