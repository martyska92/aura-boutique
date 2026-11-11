"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  X,
  User,
  ShieldCheck,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { AnnouncementBar } from "./AnnouncementBar";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useCart } from "@/context/CartContext";

export function Header() {
  const router = useRouter();
  const { itemCount, setIsCartOpen } = useCart();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [auth, setAuth] = useState<{ isLoggedIn: boolean; isAdmin: boolean; email?: string }>({
    isLoggedIn: false,
    isAdmin: false,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Pobranie stanu logowania
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setAuth({
            isLoggedIn: Boolean(data.isLoggedIn),
            isAdmin: Boolean(data.isAdmin),
            email: data.email,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Focus na pole wyszukiwania po otwarciu
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [searchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/katalog?szukaj=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <>
      <header className="relative w-full text-[#241D1B]">
        {/* Pasek ogłoszeń i promocji - przewija się naturalnie */}
        <AnnouncementBar />

        {/* 🌟 GŁÓWNY PRZYKLEJONY NAGŁÓWEK (STICKY TOP-0 Z-40) 🌟
            Zawiera logo butiku, wyszukiwarkę, konto, ulubione oraz koszyk z licznikiem */}
        <div
          className="sticky top-0 z-40 border-b border-[#968372] shadow-[0_4px_16px_rgba(36,29,27,0.16)] transition-all"
          style={{
            backgroundColor: "#BCAB9B",
            backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
            backgroundRepeat: "repeat",
          }}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 lg:h-20 flex items-center justify-between gap-2 sm:gap-4">
            {/* Lewa strona / Logo: AURA Boutique */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden w-10 h-10 flex items-center justify-center text-[#241D1B] hover:text-[#542823] active:scale-95 transition-transform rounded-md"
                aria-label="Menu nawigacyjne"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex-shrink-0">
                <BrandLogo size="md" variant="cashmere" />
              </div>
            </div>

            {/* Środek (Desktop): Wyszukiwarka */}
            <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
              <form
                onSubmit={handleSearchSubmit}
                className="relative w-full flex items-center border border-[#968372] bg-[#DDD0C4]/70 rounded-md overflow-hidden hover:border-[#735F50] focus-within:bg-white/90 transition-colors shadow-inner"
              >
                <input
                  type="text"
                  placeholder="Szukaj w butiku (sukienka, sweter, marynarka)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent py-2 pl-3.5 pr-9 text-xs text-[#241D1B] placeholder-[#6E5D53] focus:outline-none font-medium"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-[#9E8359] text-white hover:bg-[#8B7147] transition-colors"
                  title="Szukaj"
                  aria-label="Szukaj"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Prawa strona: Akcje użytkowniczki */}
            <div className="flex items-center gap-1 sm:gap-2 text-xs font-medium">
              {/* Przycisk wyszukiwarki na mobile */}
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="lg:hidden w-10 h-10 flex items-center justify-center text-[#241D1B] active:scale-95 transition-transform rounded-md"
                aria-label="Wyszukiwarka"
                title="Wyszukiwarka"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Ulubione */}
              <Link
                href="/katalog?filter=bestsellery"
                className="w-10 h-10 sm:w-auto sm:px-3 sm:py-2 flex items-center justify-center gap-1.5 rounded-md hover:bg-[#A89686]/40 text-[#241D1B] transition-colors"
                title="Ulubione i Bestsellery"
              >
                <Heart className="w-5 h-5 sm:w-4 sm:h-4 text-[#C5A069]" />
                <span className="hidden xl:inline">Ulubione</span>
              </Link>

              {/* Moje konto / Logowanie */}
              <Link
                href={auth.isLoggedIn ? "/konto" : "/logowanie"}
                className="w-10 h-10 sm:w-auto sm:px-3 sm:py-2 flex items-center justify-center gap-1.5 rounded-md hover:bg-[#A89686]/40 text-[#241D1B] transition-colors"
                title={auth.isLoggedIn ? "Moje konto" : "Zaloguj się"}
              >
                <User className="w-5 h-5 sm:w-4 sm:h-4 text-[#C5A069]" />
                <span className="hidden xl:inline">
                  {auth.isLoggedIn ? (auth.isAdmin ? "Właścicielka" : "Konto") : "Logowanie"}
                </span>
              </Link>

              {/* Panel Właścicielki jeśli zalogowana */}
              {auth.isAdmin && (
                <Link
                  href="/admin"
                  className="hidden md:inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-white bg-[#9E8359] hover:bg-[#8B7147] border border-[#7D643E] px-3 py-1.5 rounded font-semibold shadow-xs transition-colors"
                  title="Panel zarządzania butikiem"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  <span>Panel</span>
                </Link>
              )}

              {/* Koszyk z licznikiem */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative min-h-[40px] px-3 py-2 bg-[#9E8359] hover:bg-[#8B7147] text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-2 transition-all active:scale-95 ml-1"
                aria-label="Koszyk"
              >
                <ShoppingBag className="w-4 h-4 text-white" />
                <span className="hidden sm:inline">Koszyk</span>
                {itemCount > 0 && (
                  <span className="bg-[#241D1B] text-[#F3E7D3] border border-[#C5A069] text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Rozwijany pasek wyszukiwarki mobilnej */}
          {searchOpen && (
            <div className="lg:hidden bg-[#FAF6F1] border-t border-[#EADFD5] p-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="w-4 h-4 text-[#C5A069] absolute left-3" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Szukaj: sukienka, sweter, marynarka..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 bg-white border border-[#D8BE8E] pl-9 pr-20 text-xs text-[#241D1B] placeholder-[#857670] focus:outline-none focus:border-[#C5A069] rounded"
                />
                <div className="absolute right-1 flex items-center gap-1">
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-[#C5A069] text-white text-xs uppercase font-medium hover:bg-[#AF884F] transition-colors rounded"
                  >
                    Szukaj
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="p-1 text-[#857670] hover:text-[#241D1B]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Menu pomocnicze wysuwane na mobile (Dla Konta, Informacji o Butiku itp.) */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-x-0 bottom-0 top-[56px] sm:top-[64px] z-50 flex flex-col overflow-y-auto border-t border-[#968372] pb-12 animate-in fade-in"
            style={{
              backgroundColor: "#BCAB9B",
              backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
              backgroundRepeat: "repeat",
            }}
          >
            <div className="p-4 sm:p-6 divide-y divide-[#968372]/60 space-y-4">
              {/* Szybkie akcje: Konto i Ulubione */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Link
                  href={auth.isLoggedIn ? "/konto" : "/logowanie"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] px-3 py-2.5 rounded bg-[#FAF6F1] border border-[#DFCA9B] flex items-center justify-center gap-2 text-xs font-semibold text-[#241D1B] shadow-xs active:scale-[0.98] transition-transform"
                >
                  <User className="w-4 h-4 text-[#8C7248]" />
                  <span>{auth.isLoggedIn ? "Moje konto" : "Zaloguj się"}</span>
                </Link>

                <Link
                  href="/katalog?filter=bestsellery"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] px-3 py-2.5 rounded bg-[#FAF6F1] border border-[#DFCA9B] flex items-center justify-center gap-2 text-xs font-semibold text-[#241D1B] shadow-xs active:scale-[0.98] transition-transform"
                >
                  <Heart className="w-4 h-4 text-[#8C7248]" />
                  <span>Ulubione</span>
                </Link>
              </div>

              {/* Panel Właścicielki jeśli zalogowana */}
              {auth.isAdmin && (
                <div className="pt-3">
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[44px] w-full py-2.5 bg-[#9E8359] hover:bg-[#8B7147] text-white text-xs uppercase tracking-widest flex items-center justify-center gap-2 rounded shadow-md font-semibold"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Panel właścicielki (/admin)</span>
                  </Link>
                </div>
              )}

              {/* Informacje o butiku */}
              <div className="pt-4 space-y-1 text-xs uppercase tracking-widest text-[#2E221E] font-medium">
                <p className="text-[10px] text-[#4A3B30] font-bold mb-2">Informacje i pomoc</p>
                <Link
                  href="/o-butiku"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[40px] px-2 hover:text-[#5E4738]"
                >
                  O butiku AURA
                </Link>
                <Link
                  href="/kontakt"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[40px] px-2 hover:text-[#5E4738]"
                >
                  Kontakt & Butik w Żmigrodzie
                </Link>
                <Link
                  href="/dostawa-i-platnosci"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[40px] px-2 hover:text-[#5E4738]"
                >
                  Dostawa i płatności
                </Link>
                <Link
                  href="/zwroty-i-reklamacje"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[40px] px-2 hover:text-[#5E4738]"
                >
                  Zwroty i reklamacje
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Koszyk boczny */}
      <CartDrawer />
    </>
  );
}
