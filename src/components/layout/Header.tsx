"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  X,
  User,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { AnnouncementBar } from "./AnnouncementBar";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useCart } from "@/context/CartContext";

interface NavCategory {
  label: string;
  href: string;
  key: string;
  categorySlug?: string;
  filterSlug?: string;
  badge?: string;
  highlight?: boolean;
}

const DEFAULT_NAV_ITEMS: NavCategory[] = [
  { label: "Wszystkie", href: "/katalog", key: "all" },
  { label: "Nowości", href: "/katalog?filter=nowosci", key: "nowosci", filterSlug: "nowosci", badge: "Nowość" },
  { label: "Bestsellery", href: "/katalog?filter=bestsellery", key: "bestsellery", filterSlug: "bestsellery" },
  { label: "Bluzy", href: "/katalog?kategoria=bluzy", key: "bluzy", categorySlug: "bluzy" },
  { label: "Koszule", href: "/katalog?kategoria=koszule", key: "koszule", categorySlug: "koszule" },
  { label: "Topy", href: "/katalog?kategoria=topy", key: "topy", categorySlug: "topy" },
  { label: "T-shirty", href: "/katalog?kategoria=t-shirty", key: "t-shirty", categorySlug: "t-shirty" },
  { label: "Marynarki", href: "/katalog?kategoria=marynarki", key: "marynarki", categorySlug: "marynarki" },
  { label: "Promocje", href: "/katalog?filter=promocje", key: "promocje", filterSlug: "promocje", highlight: true, badge: "-15%" },
];

function HeaderInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { itemCount, setIsCartOpen } = useCart();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<NavCategory[]>(DEFAULT_NAV_ITEMS);

  const [auth, setAuth] = useState<{ isLoggedIn: boolean; isAdmin: boolean; email?: string }>({
    isLoggedIn: false,
    isAdmin: false,
  });

  const activeMobileTabRef = useRef<HTMLAnchorElement>(null);
  const mobileNavContainerRef = useRef<HTMLDivElement>(null);

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

  // Pobranie dynamicznych kategorii ze sklepu
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.categories && Array.isArray(data.categories)) {
          const dynamicCats: NavCategory[] = data.categories.map((c: any) => ({
            label: c.name,
            href: `/katalog?kategoria=${c.slug}`,
            key: c.slug,
            categorySlug: c.slug,
          }));

          setCategories([
            { label: "Wszystkie", href: "/katalog", key: "all" },
            { label: "Nowości", href: "/katalog?filter=nowosci", key: "nowosci", filterSlug: "nowosci", badge: "Nowość" },
            { label: "Bestsellery", href: "/katalog?filter=bestsellery", key: "bestsellery", filterSlug: "bestsellery" },
            ...dynamicCats,
            { label: "Promocje", href: "/katalog?filter=promocje", key: "promocje", filterSlug: "promocje", highlight: true, badge: "-15%" },
          ]);
        }
      })
      .catch(() => {});
  }, []);

  // Ustalenie aktywnej kategorii na podstawie parametrów URL
  const currentCategoryParam = searchParams.get("kategoria");
  const currentFilterParam = searchParams.get("filter");

  const isItemActive = (item: NavCategory) => {
    if (pathname !== "/katalog") {
      return false;
    }
    if (item.categorySlug) {
      return currentCategoryParam === item.categorySlug;
    }
    if (item.filterSlug) {
      return currentFilterParam === item.filterSlug;
    }
    if (item.key === "all") {
      return !currentCategoryParam && !currentFilterParam;
    }
    return false;
  };

  // Automatyczne przewijanie poziomego paska na telefonie do aktywnej pozycji
  useEffect(() => {
    if (activeMobileTabRef.current) {
      activeMobileTabRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [pathname, currentCategoryParam, currentFilterParam]);

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
        {/* ========================================================
            1. GÓRNY PASEK INFORMACYJNY (Przewija się ze stroną)
           ======================================================== */}
        <div className="w-full">
          <AnnouncementBar />
        </div>

        {/* ========================================================
            2. GŁÓWNY BRAND HEADER NA DESKTOPIE (Przewija się ze stroną)
               Zawiera duże logo, informacje o butiku i linki konta/ulubionych
           ======================================================== */}
        <div
          className="hidden lg:block border-b border-[#968372]/50 text-[#241D1B]"
          style={{
            backgroundColor: "#BCAB9B",
            backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
            backgroundRepeat: "repeat",
          }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3.5 flex items-center justify-between">
            {/* Lewa strona: Adres i status butiku */}
            <div className="text-xs text-[#2E221E] font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3F7D52] animate-pulse" />
              <span>Butik Stacjonarny • Żmigród, ul. Poprzeczna 3/1A</span>
            </div>

            {/* Środek: Okazałe Złote Logo AURA BOUTIQUE */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <BrandLogo size="lg" variant="cashmere" />
            </div>

            {/* Prawa strona: Konto, Ulubione i Panel Właścicielki */}
            <div className="flex items-center gap-3 justify-end text-xs font-medium">
              <Link
                href="/katalog?filter=bestsellery"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-[#A89686]/40 text-[#241D1B] transition-colors"
                title="Bestsellery i Ulubione"
              >
                <Heart className="w-4 h-4 text-[#C5A069]" />
                <span>Ulubione</span>
              </Link>

              <Link
                href={auth.isLoggedIn ? "/konto" : "/logowanie"}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-[#A89686]/40 text-[#241D1B] transition-colors"
              >
                <User className="w-4 h-4 text-[#C5A069]" />
                <span>{auth.isLoggedIn ? (auth.isAdmin ? "Właścicielka" : "Moje konto") : "Zaloguj się"}</span>
              </Link>

              {auth.isAdmin && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-white bg-[#9E8359] hover:bg-[#8B7147] border border-[#7D643E] px-3 py-1.5 rounded font-semibold shadow-xs transition-colors"
                  title="Panel zarządzania butikiem"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  <span>Panel</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================
            3. PRZYKLEJONY PASEK NAWIGACYJNY (STICKY TOP-0 Z-40)
               - Na telefonie: wysokość ~100-110px (kompaktowy nagłówek + pasek kategorii)
               - Na komputerze: wysokość ~56px (logo, kategorie, szukaj, koszyk)
               Widoczny przez cały czas podczas przewijania w dół i w górę!
           ======================================================== */}
        <nav
          className="sticky top-0 z-40 border-b border-[#968372] shadow-[0_4px_18px_rgba(36,29,27,0.16)] transition-all"
          style={{
            backgroundColor: "#BCAB9B",
            backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
            backgroundRepeat: "repeat",
          }}
        >
          {/* ────────────────────────────────────────────────────────
              A. WERSJA MOBILNA: Górny wiersz (wys. ok. 54px)
                 Hamburger | Logo AURA | Szukajka | Koszyk
             ──────────────────────────────────────────────────────── */}
          <div className="lg:hidden flex items-center justify-between px-2.5 h-[52px]">
            {/* Hamburger - min 44x44px */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-11 h-11 flex items-center justify-center text-[#241D1B] active:scale-95 transition-transform rounded-md"
              aria-label="Menu sklepu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Kompaktowe Logo AURA */}
            <Link href="/" className="flex flex-col items-center justify-center px-2">
              <span className="font-serif text-lg tracking-[0.25em] font-bold text-[#241D1B] leading-none">
                AURA
              </span>
              <span className="text-[9px] tracking-[0.3em] uppercase text-[#7D643E] font-medium -mt-0.5">
                Boutique
              </span>
            </Link>

            {/* Prawa strona: Szukajka + Koszyk */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="w-11 h-11 flex items-center justify-center text-[#241D1B] active:scale-95 transition-transform rounded-md"
                aria-label="Wyszukiwarka"
              >
                <Search className="w-5 h-5 text-[#241D1B]" />
              </button>

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative w-11 h-11 flex items-center justify-center text-[#241D1B] active:scale-95 transition-transform rounded-md"
                aria-label="Koszyk"
              >
                <ShoppingBag className="w-5 h-5 text-[#241D1B]" />
                {itemCount > 0 && (
                  <span className="absolute top-1.5 right-1 bg-[#9E8359] text-white text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-bold shadow-xs">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────
              B. WERSJA MOBILNA: Dolny poziomy pasek kategorii (wys. ok. 46px)
                 Stale widoczny pod nagłówkiem, przewijany poziomo palcem
             ──────────────────────────────────────────────────────── */}
          <div
            ref={mobileNavContainerRef}
            className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap border-t border-[#968372]/40"
          >
            {categories.map((item) => {
              const active = isItemActive(item);
              return (
                <Link
                  key={item.key}
                  ref={active ? activeMobileTabRef : null}
                  href={item.href}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all min-h-[34px] flex items-center gap-1 ${
                    active
                      ? "bg-[#241D1B] text-[#F3E7D3] border border-[#C5A069] shadow-sm scale-[1.02]"
                      : item.highlight
                      ? "bg-[#F2DDD9] text-[#6E2222] border border-[#D5B5AF] font-bold"
                      : "bg-[#FAF6F1]/80 text-[#2E221E] border border-[#968372]/50 hover:bg-[#FAF6F1]"
                  }`}
                >
                  {item.highlight && <Sparkles className="w-3 h-3 text-[#6E2222] shrink-0" />}
                  <span>{item.label}</span>
                  {item.badge && !active && (
                    <span
                      className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase ml-0.5 ${
                        item.highlight ? "bg-[#6E2222] text-white" : "bg-[#9E8359] text-white"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            {/* Dodatkowy odstęp po prawej, aby fragment kolejnego elementu wystawał */}
            <div className="w-4 shrink-0 pointer-events-none" />
          </div>

          {/* ────────────────────────────────────────────────────────
              C. WERSJA KOMPUTEROWA: Kompaktowy pasek nawigacji (wys. 56px)
                 AURA (Home) | Kategorie z aktywnym stanem | Szukaj | Koszyk
             ──────────────────────────────────────────────────────── */}
          <div className="hidden lg:flex items-center justify-between max-w-7xl mx-auto px-6 lg:px-8 h-14">
            {/* Lewa strona: Kompaktowy monogram AURA */}
            <Link
              href="/"
              className="flex items-center gap-2 group py-1"
              title="AURA Boutique - Strona Główna"
            >
              <span className="font-serif text-lg tracking-[0.25em] font-bold text-[#241D1B] group-hover:text-[#542823] transition-colors">
                AURA
              </span>
              <span className="text-[10px] tracking-[0.25em] uppercase text-[#7D643E] font-medium border-l border-[#968372] pl-2 hidden xl:inline">
                Boutique
              </span>
            </Link>

            {/* Środek: Wszystkie Kategorie Butiku */}
            <div className="flex items-center gap-1.5 xl:gap-2 text-[11px] uppercase tracking-[0.16em]">
              {categories.map((item) => {
                const active = isItemActive(item);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`relative px-3.5 py-1.5 rounded-full transition-all inline-flex items-center gap-1.5 ${
                      active
                        ? "bg-[#241D1B] text-[#F3E7D3] font-bold shadow-xs border border-[#C5A069]"
                        : item.highlight
                        ? "text-[#6E2222] bg-[#F2DDD9] hover:bg-[#EACFC9] font-bold shadow-2xs border border-[#D5B5AF]"
                        : "text-[#2E221E] font-medium hover:bg-[#A89686]/40 hover:text-[#18110D]"
                    }`}
                  >
                    {item.highlight && <Sparkles className="w-3 h-3 text-[#6E2222]" />}
                    <span>{item.label}</span>
                    {item.badge && !active && (
                      <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase bg-[#FAF6F1] text-[#7D643E] border border-[#D8BE8E]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Prawa strona: Szukajka + Koszyk z licznikiem */}
            <div className="flex items-center gap-3">
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex items-center border border-[#968372] bg-[#DDD0C4]/70 rounded-md overflow-hidden hover:border-[#735F50] focus-within:bg-white/80 transition-colors shadow-inner"
              >
                <input
                  type="text"
                  placeholder="Szukaj ubrań..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-32 xl:w-44 bg-transparent py-1.5 pl-3 pr-7 text-xs text-[#241D1B] placeholder-[#6E5D53] focus:outline-none font-medium"
                />
                <button
                  type="submit"
                  className="p-1.5 bg-[#9E8359] text-white hover:bg-[#8B7147] transition-colors"
                  title="Szukaj w butiku"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </form>

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative min-h-[44px] px-3.5 py-2 bg-[#9E8359] hover:bg-[#8B7147] text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-2 transition-all active:scale-95"
                aria-label="Koszyk"
              >
                <ShoppingBag className="w-4 h-4 text-white" />
                <span className="hidden xl:inline">Koszyk</span>
                {itemCount > 0 ? (
                  <span className="bg-[#241D1B] text-[#F3E7D3] text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {itemCount}
                  </span>
                ) : (
                  <span className="text-[11px] opacity-80">(0)</span>
                )}
              </button>
            </div>
          </div>

          {/* Modal / pasek wyszukiwarki na mobile */}
          {searchOpen && (
            <div className="absolute inset-x-0 top-full bg-[#FAF6F1] border-b border-[#EADFD5] p-3 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                  <Search className="w-4 h-4 text-[#C5A069] absolute left-3.5" />
                  <input
                    type="text"
                    placeholder="Szukaj: sukienka, sweter, marynarka..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full h-11 bg-white border border-[#D8BE8E] pl-10 pr-20 text-sm text-[#241D1B] placeholder-[#857670] focus:outline-none focus:border-[#C5A069] rounded"
                  />
                  <div className="absolute right-1.5 flex items-center gap-1">
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-[#C5A069] text-white text-xs uppercase font-medium hover:bg-[#AF884F] transition-colors rounded"
                    >
                      Szukaj
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchOpen(false)}
                      className="p-1.5 text-[#857670] hover:text-[#241D1B]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </nav>

        {/* ========================================================
            4. MENU BOCZNE DRAWER NA TELEFONIE (Pełne menu sklepu)
           ======================================================== */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-x-0 bottom-0 top-[102px] z-50 flex flex-col overflow-y-auto border-t border-[#968372] pb-12 animate-in fade-in"
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

              {/* Lista wszystkich kategorii */}
              <div className="pt-4 space-y-2.5">
                <p className="text-[10px] uppercase tracking-widest text-[#4A3B30] font-bold">
                  Wszystkie Kolekcje & Kategorie
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs uppercase tracking-wider">
                  {categories.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`min-h-[44px] p-2.5 rounded bg-[#DDD0C4]/70 border border-[#968372] flex items-center justify-between font-medium active:scale-[0.98] transition-transform ${
                        isItemActive(item)
                          ? "bg-[#241D1B] text-[#F3E7D3] border-[#C5A069] font-bold"
                          : item.highlight
                          ? "text-[#6E2222] bg-[#F2DDD9] font-bold border-[#6E2222]/30"
                          : "text-[#2E221E]"
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.highlight ? (
                        <Sparkles className="w-3.5 h-3.5 text-[#6E2222]" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Informacje o butiku */}
              <div className="pt-4 space-y-1 text-xs uppercase tracking-widest text-[#2E221E] font-medium">
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

export function Header() {
  return (
    <Suspense
      fallback={
        <header
          className="sticky top-0 z-40 border-b border-[#968372] shadow-sm text-[#241D1B] h-14"
          style={{ backgroundColor: "#BCAB9B" }}
        />
      }
    >
      <HeaderInner />
    </Suspense>
  );
}
