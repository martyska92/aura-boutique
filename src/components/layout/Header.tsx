"use client";

import React, { useState, useEffect } from "react";
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
  Sparkles,
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

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setAuth({
            isLoggedIn: !!data.isLoggedIn,
            isAdmin: !!data.isAdmin,
            email: data.email,
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/katalog?szukaj=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const navLinks = [
    { label: "Nowości", href: "/katalog?filter=nowosci", badge: "Nowość" },
    { label: "Bestsellery", href: "/katalog?filter=bestsellery" },
    { label: "Bluzy", href: "/katalog?kategoria=bluzy" },
    { label: "Koszule", href: "/katalog?kategoria=koszule" },
    { label: "Topy", href: "/katalog?kategoria=topy" },
    { label: "T-shirty", href: "/katalog?kategoria=t-shirty" },
    { label: "Marynarki", href: "/katalog?kategoria=marynarki" },
    { label: "Promocje", href: "/katalog?filter=promocje", highlight: true },
  ];

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b border-[#968372] shadow-[0_4px_20px_rgba(36,29,27,0.18)] transition-all text-[#241D1B]"
        style={{
          backgroundColor: "#BCAB9B",
          backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
          backgroundRepeat: "repeat",
        }}
      >
        <AnnouncementBar />

        {/* Główny pasek nawigacyjny */}
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="h-14 sm:h-20 lg:h-24 flex items-center justify-between gap-1 sm:gap-4">
            {/* Lewa strona: Hamburger na mobile + Wyszukiwarka desktop */}
            <div className="flex items-center gap-1 sm:gap-4 flex-1">
              <button
                type="button"
                className="lg:hidden w-11 h-11 flex items-center justify-center text-[#241D1B] hover:text-[#542823] transition-colors rounded-sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu nawigacyjne"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Szukajka na tle cashmere */}
              <div className="hidden lg:flex items-center">
                <form
                  onSubmit={handleSearchSubmit}
                  className="relative flex items-center border border-[#968372] bg-[#DDD0C4]/70 rounded-md overflow-hidden hover:border-[#735F50] focus-within:bg-white/80 transition-colors shadow-inner"
                >
                  <input
                    type="text"
                    placeholder="Szukaj w butiku..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-44 xl:w-56 bg-transparent py-1.5 pl-3 pr-8 text-xs text-[#241D1B] placeholder-[#6E5D53] focus:outline-none font-medium"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-[#9E8359] text-white hover:bg-[#8B7147] transition-colors"
                    title="Szukaj w butiku"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Środek: Złoty Brand Logo */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <BrandLogo size="md" variant="cashmere" />
            </div>

            {/* Prawa strona: Akcje użytkownika */}
            <div className="flex items-center justify-end gap-0.5 sm:gap-2 flex-1">
              {/* Szukajka mobilna - min 44x44px touch target */}
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="w-11 h-11 flex items-center justify-center text-[#241D1B] hover:text-[#542823] transition-colors rounded-sm"
                aria-label="Wyszukiwarka"
              >
                <Search className="w-5 h-5 text-[#241D1B]" />
              </button>

              {/* Ulubione i Bestsellery - na desktopie w nagłówku, na mobile w menu */}
              <Link
                href="/katalog?filter=bestsellery"
                className="hidden lg:flex w-11 h-11 items-center justify-center text-[#241D1B] hover:text-[#542823] transition-colors rounded-sm"
                title="Ulubione i Bestsellery"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Przycisk Panelu Właścicielki */}
              {auth.isAdmin && (
                <Link
                  href="/admin"
                  className="hidden md:flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-white bg-[#9E8359] hover:bg-[#8B7147] border border-[#7D643E] px-3 py-1.5 rounded transition-colors font-semibold shadow-sm"
                  title="Panel zarządzania butikiem"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  <span>Panel</span>
                </Link>
              )}

              {/* Konto klientki - na desktopie w nagłówku, na mobile w menu */}
              <Link
                href={auth.isLoggedIn ? "/konto" : "/logowanie"}
                className="hidden lg:flex items-center gap-1.5 text-xs text-[#241D1B] hover:text-[#542823] px-2.5 py-1.5 rounded transition-colors"
                title={auth.isLoggedIn ? "Moje konto" : "Zaloguj się"}
              >
                <User className="w-5 h-5" />
                <span className="hidden xl:inline text-[11px] font-medium">
                  {auth.isLoggedIn ? (auth.isAdmin ? "Właścicielka" : "Konto") : "Logowanie"}
                </span>
              </Link>

              {/* Koszyk - min 44x44px touch target */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative w-11 h-11 flex items-center justify-center text-[#241D1B] hover:text-[#542823] transition-colors rounded-sm"
                aria-label="Koszyk"
              >
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-[#241D1B]" />
                {itemCount > 0 && (
                  <span className="absolute top-1.5 right-1 bg-[#9E8359] text-white text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-bold shadow-sm">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Dolny pasek kategorii na Desktopie */}
          <nav className="hidden lg:flex items-center justify-center gap-2 xl:gap-3 py-2.5 border-t border-[#968372]/60 text-[11px] uppercase tracking-[0.2em] font-medium">
            {navLinks.map((link) => (
              <div key={link.href} className="relative group">
                <Link
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-full transition-all inline-flex items-center gap-1.5 ${
                    link.highlight
                      ? "text-[#6E2222] bg-[#F2DDD9] hover:bg-[#EACFC9] font-bold shadow-xs border border-[#D5B5AF]"
                      : "text-[#2E221E] font-medium hover:bg-[#A89686]/40 hover:text-[#18110D]"
                  }`}
                >
                  {link.highlight && <Sparkles className="w-3 h-3 text-[#6E2222]" />}
                  <span>{link.label}</span>
                </Link>
                {link.badge && (
                  <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-[#F2DDD9] text-[#7A3631] text-[8px] font-bold tracking-widest rounded-full uppercase border border-[#D5B5AF] pointer-events-none">
                    {link.badge}
                  </span>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Modal wyszukiwarki mobilnej */}
        {searchOpen && (
          <div className="absolute inset-x-0 top-full bg-[#FAF6F1] border-b border-[#EADFD5] p-4 sm:p-6 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="w-5 h-5 text-[#C5A069] absolute left-4" />
                <input
                  type="text"
                  placeholder="Czego szukasz? (np. sukienka satynowa, sweter kaszmirowy, garnitur...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-white border border-[#D8BE8E] py-3.5 pl-12 pr-24 text-sm text-[#241D1B] placeholder-[#857670] focus:outline-none focus:border-[#C5A069]"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#C5A069] text-white text-xs uppercase tracking-wider hover:bg-[#AF884F] transition-colors rounded"
                  >
                    Szukaj
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="p-1.5 text-[#857670] hover:text-[#241D1B]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Menu mobilne drawer */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-x-0 bottom-0 top-[78px] sm:top-[106px] z-50 flex flex-col overflow-y-auto border-t border-[#968372] pb-10"
            style={{
              backgroundColor: "#BCAB9B",
              backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
              backgroundRepeat: "repeat",
            }}
          >
            <div className="p-4 sm:p-6 divide-y divide-[#968372]/60 space-y-4">
              {/* Szybkie akcje: Konto i Ulubione na mobile */}
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

              {/* Kategorie sklepu */}
              <div className="pt-4 space-y-2.5">
                <p className="text-[10px] uppercase tracking-widest text-[#4A3B30] font-bold">
                  Kolekcje & Kategorie
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs uppercase tracking-wider">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`min-h-[44px] p-2.5 rounded bg-[#DDD0C4]/70 border border-[#968372] flex items-center justify-between font-medium active:scale-[0.98] transition-transform ${
                        link.highlight ? "text-[#6E2222] bg-[#F2DDD9] font-bold border-[#6E2222]/30" : "text-[#2E221E]"
                      }`}
                    >
                      <span>{link.label}</span>
                      {link.highlight && <Sparkles className="w-3.5 h-3.5 text-[#6E2222]" />}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Informacje o butiku */}
              <div className="pt-4 space-y-1.5 text-xs uppercase tracking-widest text-[#2E221E] font-medium">
                <Link
                  href="/o-butiku"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-2 hover:text-[#5E4738]"
                >
                  O butiku AURA
                </Link>
                <Link
                  href="/kontakt"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-2 hover:text-[#5E4738]"
                >
                  Kontakt & Butik w Żmigrodzie
                </Link>
                <Link
                  href="/dostawa-i-platnosci"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-2 hover:text-[#5E4738]"
                >
                  Dostawa i płatności
                </Link>
                <Link
                  href="/zwroty-i-reklamacje"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-2 hover:text-[#5E4738]"
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
