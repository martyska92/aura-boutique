"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  X,
  UserCheck,
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
    { label: "Sukienki", href: "/katalog?kategoria=sukienki" },
    { label: "Komplety", href: "/katalog?kategoria=komplety" },
    { label: "Swetry", href: "/katalog?kategoria=swetry" },
    { label: "Okrycia", href: "/katalog?kategoria=okrycia" },
    { label: "Dodatki", href: "/katalog?kategoria=dodatki" },
    { label: "Wyprzedaż", href: "/katalog?filter=promocje", highlight: true },
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-20 sm:h-24 flex items-center justify-between gap-4">
            {/* Lewa strona: Hamburger na mobile + Wyszukiwarka */}
            <div className="flex items-center gap-4 flex-1">
              <button
                type="button"
                className="lg:hidden p-2 text-[#241D1B] hover:text-[#542823] transition-colors"
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

            {/* Środek: Złoty Brand Logo stapiający się z tłem cashmere */}
            <div className="flex-shrink-0">
              <BrandLogo size="md" variant="cashmere" />
            </div>

            {/* Prawa strona: Akcje użytkownika */}
            <div className="flex items-center justify-end gap-2.5 sm:gap-4 flex-1">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="lg:hidden p-2 text-[#241D1B] hover:text-[#542823] transition-colors"
                aria-label="Wyszukiwarka"
              >
                <Search className="w-5 h-5 text-[#241D1B]" />
              </button>

              <Link
                href="/katalog?filter=bestsellery"
                className="p-2 text-[#241D1B] hover:text-[#542823] transition-colors"
                title="Ulubione i Bestsellery"
              >
                <Heart className="w-5 h-5" />
              </Link>

              <Link
                href="/admin"
                className="hidden md:flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#241D1B] hover:text-[#542823] border border-[#968372] bg-[#DDD0C4]/60 hover:bg-[#DDD0C4]/90 px-2.5 py-1 rounded transition-colors font-medium shadow-xs"
                title="Panel właścicielki butiku"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#9E8359]" />
                <span>Panel</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-[#241D1B] hover:text-[#542823] transition-colors"
                aria-label="Koszyk"
              >
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-[#241D1B]" />
                {itemCount > 0 && (
                  <span className="absolute top-1 right-0 sm:right-1 bg-[#9E8359] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm">
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
            className="lg:hidden fixed inset-0 top-[110px] z-50 flex flex-col overflow-y-auto border-t border-[#968372]"
            style={{
              backgroundColor: "#BCAB9B",
              backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
              backgroundRepeat: "repeat",
            }}
          >
            <div className="p-6 divide-y divide-[#968372]/60">
              <div className="flex justify-center pb-4">
                <BrandLogo size="md" variant="cashmere" />
              </div>
              <div className="py-3 space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-[#4A3B30] font-bold">
                  Kategorie
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs uppercase tracking-wider">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`p-2.5 rounded bg-[#DDD0C4]/70 border border-[#968372] flex items-center justify-between font-medium ${
                        link.highlight ? "text-[#6E2222] bg-[#F2DDD9] font-bold" : "text-[#2E221E]"
                      }`}
                    >
                      <span>{link.label}</span>
                      {link.highlight && <Sparkles className="w-3.5 h-3.5 text-[#6E2222]" />}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="py-4 space-y-2 text-xs uppercase tracking-widest text-[#2E221E] font-medium">
                <Link
                  href="/o-butiku"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 hover:text-[#5E4738]"
                >
                  O butiku AURA
                </Link>
                <Link
                  href="/kontakt"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 hover:text-[#5E4738]"
                >
                  Kontakt & Butik w Żmigrodzie
                </Link>
                <Link
                  href="/dostawa-i-platnosci"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 hover:text-[#5E4738]"
                >
                  Dostawa i płatności
                </Link>
                <Link
                  href="/zwroty-i-reklamacje"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 hover:text-[#5E4738]"
                >
                  Zwroty i reklamacje
                </Link>
              </div>

              <div className="pt-4">
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 bg-[#9E8359] hover:bg-[#8B7147] text-white text-xs uppercase tracking-widest flex items-center justify-center gap-2 rounded shadow-md font-semibold"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Panel właścicielki (/admin)</span>
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
