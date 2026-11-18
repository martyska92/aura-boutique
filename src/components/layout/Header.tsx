"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
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
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { AnnouncementBar } from "./AnnouncementBar";
import { CustomerGreetingBar } from "./CustomerGreetingBar";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

const DEFAULT_HEADER_CATEGORIES = [
  { slug: "sukienki", name: "Sukienki" },
  { slug: "swetry", name: "Swetry" },
  { slug: "bluzy", name: "Bluzy" },
  { slug: "koszule", name: "Koszule" },
  { slug: "topy", name: "Topy" },
  { slug: "t-shirty", name: "T-shirty" },
  { slug: "marynarki", name: "Marynarki" },
  { slug: "legginsy", name: "Legginsy" },
];

function HeaderInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { itemCount, setIsCartOpen } = useCart();
  const { wishlistCount } = useWishlist();

  const [categories, setCategories] = useState(DEFAULT_HEADER_CATEGORIES);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [auth, setAuth] = useState<{ isLoggedIn: boolean; isAdmin: boolean; email?: string }>({
    isLoggedIn: false,
    isAdmin: false,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const drawerSearchInputRef = useRef<HTMLInputElement>(null);
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  // Pobieranie aktywnych kategorii sklepu z bazy danych
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.categories && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(
            data.categories.map((c: any) => ({
              slug: c.slug,
              name: c.name,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  // Rozpoznanie aktywnej kategorii / filtra z parametrów URL do etykiety na przycisku mobilnym
  const activeCategorySlug = pathname === "/katalog" ? searchParams.get("kategoria") : null;
  const activeFilter = pathname === "/katalog" ? searchParams.get("filter") : null;

  const activeCategoryLabel = useMemo(() => {
    if (activeFilter === "promocje") return "Promocje";
    if (activeFilter === "nowosci") return "Nowości";
    if (activeFilter === "bestsellery") return "Bestsellery";
    if (activeCategorySlug) {
      const found = categories.find((c) => c.slug === activeCategorySlug);
      return found ? found.name : activeCategorySlug;
    }
    if (pathname === "/katalog") return "Wszystkie";
    return null;
  }, [activeCategorySlug, activeFilter, categories, pathname]);

  // Obsługa panelu mobilnego:
  // 1. Zapis elementu wywołującego i powrót fokusu po zamknięciu
  // 2. Fokus na przycisk zamykający po otwarciu
  // 3. Obsługa klawisza Escape
  // 4. Focus trap (zapętlenie Tab / Shift+Tab)
  // 5. Blokowanie scrolla tła (document.body.style.overflow)
  useEffect(() => {
    if (mobileMenuOpen) {
      lastActiveElementRef.current = document.activeElement as HTMLElement | null;
      document.body.style.overflow = "hidden";

      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          setMobileMenuOpen(false);
          return;
        }

        if (e.key === "Tab" && drawerRef.current) {
          const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length === 0) return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
      if (lastActiveElementRef.current) {
        lastActiveElementRef.current.focus();
        lastActiveElementRef.current = null;
      }
    }
  }, [mobileMenuOpen]);

  // Pobranie stanu logowania z bezpiecznym no-store i nasłuchem na zmiany
  useEffect(() => {
    let isMounted = true;

    const checkAuth = () => {
      fetch("/api/auth/me", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted) {
            if (data && data.isLoggedIn) {
              setAuth({
                isLoggedIn: true,
                isAdmin: Boolean(data.isAdmin),
                email: data.email,
              });
            } else {
              setAuth({
                isLoggedIn: false,
                isAdmin: false,
                email: undefined,
              });
            }
          }
        })
        .catch(() => {
          if (isMounted) {
            setAuth({ isLoggedIn: false, isAdmin: false, email: undefined });
          }
        });
    };

    checkAuth();
    window.addEventListener("auth-change", checkAuth);

    return () => {
      isMounted = false;
      window.removeEventListener("auth-change", checkAuth);
    };
  }, [pathname]);

  // Focus na pole wyszukiwania po otwarciu paska wyszukiwarki mobilnej
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
      setMobileMenuOpen(false);
    }
  };

  const openDrawerFromHamburger = () => {
    lastActiveElementRef.current = hamburgerButtonRef.current;
    setMobileMenuOpen(true);
  };

  const openDrawerFromCategory = () => {
    lastActiveElementRef.current = categoryButtonRef.current;
    setMobileMenuOpen(true);
  };

  return (
    <div className="w-full relative">
      {/* 🌟 1. PASEK OGŁOSZEŃ I PROMOCJI 🌟
          Przewija się naturalnie ze stroną, oszczędzając przestrzeń pionową na telefonie */}
      <AnnouncementBar />

      {/* 🌟 2. PRZYKLEJONY NAGŁÓWEK (STICKY TOP-0 Z-40) 🌟
          Pozostaje widoczny u góry podczas przewijania, nie zasłaniając nadmiernie treści */}
      <header
        className="sticky top-0 z-40 w-full text-[#241D1B] shadow-[0_4px_16px_rgba(36,29,27,0.12)]"
        style={{
          backgroundColor: "#BCAB9B",
          backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
          backgroundRepeat: "repeat",
        }}
      >
        {/* Główny pasek nawigacji: 3-kolumnowy grid (1fr - auto - 1fr) dla perfekcyjnego wyśrodkowania logo */}
        <div className="border-t border-[#968372]/30 border-b border-[#968372]">
          <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-14 sm:h-16 lg:h-20 grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-3">
            {/* ─── LEWA STRONA (justify-self-start) ─── */}
            <div className="flex items-center gap-1 justify-self-start min-w-0">
              {/* Na telefonie: Hamburger o dużym obszarze dotykowym 44x44px */}
              <button
                ref={hamburgerButtonRef}
                type="button"
                onClick={openDrawerFromHamburger}
                className="lg:hidden w-11 h-11 flex items-center justify-center text-[#241D1B] hover:text-[#542823] active:scale-95 transition-transform rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9E8359]"
                aria-label="Otwórz menu i kategorie"
                aria-expanded={mobileMenuOpen}
              >
                <Menu className="w-6 h-6 text-[#241D1B]" />
              </button>

              {/* Na komputerze: pole wyszukiwarki */}
              <div className="hidden lg:flex items-center w-full max-w-[260px] xl:max-w-[320px]">
                <form
                  onSubmit={handleSearchSubmit}
                  className="relative w-full flex items-center border border-[#968372] bg-[#DDD0C4]/70 rounded-md overflow-hidden hover:border-[#735F50] focus-within:bg-white/90 transition-colors shadow-inner"
                >
                  <input
                    type="text"
                    placeholder="Szukaj w butiku..."
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
            </div>

            {/* ─── ŚRODEK: LOGO BUTIKU WYŚRODKOWANE W 100% ─── */}
            <div className="justify-self-center flex items-center justify-center px-1">
              <BrandLogo
                size="header"
                variant="cashmere"
                className="max-w-[120px] sm:max-w-[140px] lg:max-w-[220px]"
              />
            </div>

            {/* ─── PRAWA STRONA: WYSZUKIWANIE, KONTO, KOSZYK ─── */}
            <div className="flex items-center gap-0.5 sm:gap-1.5 justify-self-end text-xs font-medium">
              {/* Na telefonie: ikona lupy */}
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="lg:hidden w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-[#241D1B] active:scale-95 transition-transform rounded-md hover:bg-white/30"
                aria-label="Wyszukiwarka"
                aria-expanded={searchOpen}
              >
                <Search className="w-5 h-5 text-[#241D1B]" />
              </button>

              {/* Na telefonie: ikona Konta / Logowania */}
              <Link
                href={auth.isLoggedIn ? "/konto" : "/logowanie"}
                className="lg:hidden w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-[#241D1B] hover:text-[#542823] active:scale-95 transition-transform rounded-md hover:bg-white/30"
                title={auth.isLoggedIn ? "Moje konto" : "Zaloguj się"}
                aria-label={auth.isLoggedIn ? "Moje konto" : "Zaloguj się"}
              >
                <User className="w-5 h-5 text-[#241D1B]" />
              </Link>

              {/* Na komputerze: Ulubione z licznikiem */}
              <Link
                href="/ulubione"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-2 rounded-md hover:bg-white/40 text-[#241D1B] transition-colors relative"
                title="Twoje ulubione produkty"
              >
                <div className="relative">
                  <Heart className="w-4 h-4 text-[#241D1B]" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-[#8C2D2D] text-white text-[9px] min-w-3.5 h-3.5 px-0.5 rounded-full flex items-center justify-center font-bold">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span className="hidden xl:inline">Ulubione</span>
              </Link>

              {/* Na komputerze: Przycisk Logowanie / Konto */}
              <Link
                href={auth.isLoggedIn ? "/konto" : "/logowanie"}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all border border-[#968372] bg-white/70 hover:bg-white text-[#241D1B] shadow-2xs hover:shadow-xs"
                title={auth.isLoggedIn ? "Moje konto" : "Zaloguj się"}
              >
                <User className="w-4 h-4 text-[#8C7248]" />
                <span>{auth.isLoggedIn ? "Konto" : "Logowanie"}</span>
              </Link>

              {/* Na komputerze: Panel Właścicielki jeśli zalogowana */}
              {auth.isAdmin && (
                <Link
                  href="/admin"
                  className="hidden md:inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-white bg-[#9E8359] hover:bg-[#8B7147] border border-[#7D643E] px-2.5 py-1.5 rounded font-semibold shadow-xs transition-colors"
                  title="Panel zarządzania butikiem"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  <span className="hidden xl:inline">Panel</span>
                </Link>
              )}

              {/* Koszyk */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 lg:w-auto lg:h-auto lg:px-3.5 lg:py-2 bg-[#9E8359] hover:bg-[#8B7147] text-white text-xs font-semibold rounded-md shadow-xs transition-all active:scale-95"
                aria-label={`Koszyk, ${itemCount} pozycji`}
              >
                <ShoppingBag className="w-5 h-5 lg:w-4 lg:h-4 text-white" />
                <span className="hidden sm:inline ml-1.5">Koszyk</span>
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#8C2D2D] text-white border border-white text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-bold shadow-xs">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Rozwijany pasek wyszukiwarki mobilnej pod nagłówkiem */}
          {searchOpen && (
            <div className="lg:hidden p-2.5 sm:p-3 bg-[#DDD0C4] border-t border-[#968372] animate-in slide-in-from-top-2 duration-150">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="w-4 h-4 text-[#857670] absolute left-3" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Szukaj w kolekcji..."
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
                    aria-label="Zamknij wyszukiwarkę"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* 🌟 3. NA TELEFONACH: POJEDYNCZY CZYTELNY PRZYCISK „KATEGORIE” (lg:hidden) 🌟
            Zastępuje poziomy, ucinający nazwy pasek kategorii. Pokazuje nazwę wybranej kategorii i możliwość zmiany. */}
        <div className="lg:hidden bg-[#B29F8E]/95 backdrop-blur-xs border-b border-[#968372] px-2.5 sm:px-4 py-1.5">
          <div className="max-w-md mx-auto">
            <button
              ref={categoryButtonRef}
              type="button"
              onClick={openDrawerFromCategory}
              className="w-full min-h-[44px] px-3.5 py-2 bg-[#FAF6F1]/95 hover:bg-white active:bg-[#F5EDE3] text-[#241D1B] border border-[#968372] hover:border-[#735F50] rounded-md shadow-2xs flex items-center justify-between text-xs transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9E8359]"
              aria-label={
                activeCategoryLabel
                  ? `Kategoria: ${activeCategoryLabel}. Kliknij, aby zmienić kategorię`
                  : "Otwórz listę kategorii"
              }
              aria-expanded={mobileMenuOpen}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Menu className="w-4 h-4 text-[#8C7248] shrink-0" />
                <span className="font-semibold text-[#8C7248] uppercase tracking-wider text-[11px] shrink-0">
                  Kategorie
                </span>
                {activeCategoryLabel ? (
                  <>
                    <span className="text-[#968372] shrink-0">•</span>
                    <span className="font-bold text-[#241D1B] truncate text-xs">
                      {activeCategoryLabel}
                    </span>
                  </>
                ) : null}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-[#735F50] font-medium shrink-0 pl-2">
                <span>{activeCategoryLabel ? "Zmień" : "Wybierz"}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8C7248] transition-transform group-hover:translate-y-0.5" />
              </div>
            </button>
          </div>
        </div>

        {/* 🌟 4. NA KOMPUTERACH: POZIOMY PASEK KATEGORII (hidden lg:flex) 🌟
            Zachowuje dotychczasowy układ desktopowy bez zmian */}
        <nav
          aria-label="Kategorie"
          className="hidden lg:flex w-full bg-[#B29F8E]/95 backdrop-blur-xs border-b border-[#968372] overflow-x-auto no-scrollbar shadow-inner justify-center"
        >
          <div className="max-w-7xl mx-auto px-4 lg:px-8 h-10 flex items-center justify-center gap-2 whitespace-nowrap text-xs">
            <Link
              href="/katalog"
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                pathname === "/katalog" && !searchParams.get("kategoria") && !searchParams.get("filter")
                  ? "bg-[#241D1B] text-[#F3E7D3] font-semibold shadow-xs"
                  : "text-[#241D1B] hover:text-[#542823] hover:bg-[#A89686]/40 font-medium"
              }`}
            >
              Wszystkie
            </Link>

            {categories.map((cat) => {
              const active = pathname === "/katalog" && searchParams.get("kategoria") === cat.slug;
              return (
                <Link
                  key={cat.slug}
                  href={`/katalog?kategoria=${cat.slug}`}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    active
                      ? "bg-[#241D1B] text-[#F3E7D3] font-semibold shadow-xs"
                      : "text-[#241D1B] hover:text-[#542823] hover:bg-[#A89686]/40 font-medium"
                  }`}
                >
                  {cat.name}
                </Link>
              );
            })}

            <Link
              href="/katalog?filter=promocje"
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                pathname === "/katalog" && searchParams.get("filter") === "promocje"
                  ? "bg-[#8C2D2D] text-white shadow-xs"
                  : "text-[#731D1D] hover:text-[#8C2D2D] hover:bg-rose-100/40"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#8C2D2D] inline-block animate-pulse" />
              Promocje
            </Link>
          </div>
        </nav>

        {/* 🌟 5. POWITANIE DLA ZALOGOWANEJ KLIENTKI 🌟 */}
        <CustomerGreetingBar />
      </header>

      {/* 🌟 6. WSPÓLNY PANEL MOBILNY (DRAWER) DLA HAMBURGERA I PRZYCISKU KATEGORIE 🌟
          Otwierany zarówno z hamburgera, jak i z przycisku „Kategorie”.
          Zawiera pełną listę kategorii z konfiguracji sklepu z „Wszystkie” na początku,
          pełnymi nieuciętymi nazwami, wyróżnieniem aktywnej, „Promocjami” z akcentem
          oraz dużymi obszarami dotykowymi (min. 44px). */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu i kategorie butiku"
          className="fixed inset-0 z-50 lg:hidden flex"
        >
          {/* Tło przyciemniające (Backdrop) */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Panel boczny */}
          <div
            ref={drawerRef}
            className="relative w-full max-w-[340px] sm:max-w-sm h-full max-h-screen bg-[#FAF6F1] shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200"
          >
            {/* Nagłówek panelu z przyciskiem zamknięcia (X, min. 44x44px) */}
            <div className="h-14 px-4 bg-[#BCAB9B] text-[#241D1B] border-b border-[#968372] flex items-center justify-between shrink-0">
              <span className="font-serif font-bold text-base tracking-wide text-[#241D1B]">
                Menu & Kategorie
              </span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-11 h-11 flex items-center justify-center text-[#241D1B] hover:text-[#542823] active:scale-95 rounded-full hover:bg-white/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#241D1B]"
                aria-label="Zamknij menu"
              >
                <X className="w-6 h-6 text-[#241D1B]" />
              </button>
            </div>

            {/* Treść panelu przewijana w pionie (dostępna również na niskich ekranach) */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-6 custom-scrollbar pb-8">
              {/* Szybka wyszukiwarka wewnątrz panelu */}
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <input
                  ref={drawerSearchInputRef}
                  type="text"
                  placeholder="Szukaj w butiku..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 bg-white border border-[#D8BE8E] rounded-md pl-3.5 pr-10 text-xs text-[#241D1B] placeholder-[#857670] focus:outline-none focus:border-[#C5A069]"
                />
                <button
                  type="submit"
                  className="absolute right-1 w-9 h-9 flex items-center justify-center text-[#8C7248] hover:text-[#241D1B]"
                  aria-label="Szukaj"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>

              {/* ─── SEKCJA 1: KATEGORIE ODZIEŻY ─── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.15em] text-[#8C7248] pb-1.5 border-b border-[#EADFD5]">
                  <span>Kategorie odzieży</span>
                  <span className="text-[10px] font-normal text-[#857670] lowercase">
                    {categories.length + 2} pozycji
                  </span>
                </div>

                <nav className="flex flex-col gap-1.5" aria-label="Kategorie ubrań">
                  {/* „Wszystkie” na początku */}
                  <Link
                    href="/katalog"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`min-h-[44px] px-3.5 py-2.5 rounded-md flex items-center justify-between text-sm transition-all ${
                      pathname === "/katalog" && !searchParams.get("kategoria") && !searchParams.get("filter")
                        ? "bg-[#241D1B] text-[#FAF6F1] font-bold border-l-4 border-[#C5A069] shadow-xs"
                        : "text-[#241D1B] hover:bg-[#EADDCF]/50 font-medium"
                    }`}
                  >
                    <span className="break-words">Wszystkie produkty</span>
                    <ArrowRight className="w-4 h-4 text-[#C5A069] shrink-0 ml-2" />
                  </Link>

                  {/* Kategorie pobrane z bazy/konfiguracji sklepu */}
                  {categories.map((cat) => {
                    const isActive = pathname === "/katalog" && searchParams.get("kategoria") === cat.slug;
                    return (
                      <Link
                        key={cat.slug}
                        href={`/katalog?kategoria=${cat.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`min-h-[44px] px-3.5 py-2.5 rounded-md flex items-center justify-between text-sm transition-all ${
                          isActive
                            ? "bg-[#241D1B] text-[#FAF6F1] font-bold border-l-4 border-[#C5A069] shadow-xs"
                            : "text-[#241D1B] hover:bg-[#EADDCF]/50 font-medium"
                        }`}
                      >
                        <span className="break-words whitespace-normal leading-snug">
                          {cat.name}
                        </span>
                        {isActive && (
                          <span className="text-[11px] text-[#C5A069] font-bold uppercase tracking-wider shrink-0 ml-2">
                            Aktywna
                          </span>
                        )}
                      </Link>
                    );
                  })}

                  {/* „Promocje” z subtelnym akcentem kolorystycznym */}
                  <Link
                    href="/katalog?filter=promocje"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`min-h-[44px] px-3.5 py-2.5 rounded-md flex items-center justify-between text-sm font-semibold transition-all ${
                      pathname === "/katalog" && searchParams.get("filter") === "promocje"
                        ? "bg-[#8C2D2D] text-white shadow-xs"
                        : "bg-rose-50/90 text-[#8C2D2D] hover:bg-rose-100/80 border border-rose-200/80"
                    }`}
                  >
                    <span className="flex items-center gap-2 break-words">
                      <span className="w-2 h-2 rounded-full bg-[#8C2D2D] inline-block animate-pulse shrink-0" />
                      <span>Promocje & Okazje</span>
                    </span>
                    <span className="text-xs bg-[#8C2D2D]/10 text-[#8C2D2D] px-2 py-0.5 rounded font-bold shrink-0 ml-2">
                      Okazje
                    </span>
                  </Link>
                </nav>
              </div>

              {/* ─── SEKCJA 2: KONTO I SZYBKIE AKCJE ─── */}
              <div className="space-y-2 pt-2 border-t border-[#EADFD5]">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8C7248]">
                  Twoje konto & zakupy
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={auth.isLoggedIn ? "/konto" : "/logowanie"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[44px] px-3 py-2.5 rounded-md bg-white border border-[#DFCA9B] flex items-center justify-center gap-2 text-xs font-semibold text-[#241D1B] shadow-2xs active:scale-[0.98] transition-transform"
                  >
                    <User className="w-4 h-4 text-[#8C7248] shrink-0" />
                    <span className="truncate">{auth.isLoggedIn ? "Moje konto" : "Zaloguj się"}</span>
                  </Link>

                  <Link
                    href="/ulubione"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[44px] px-3 py-2.5 rounded-md bg-white border border-[#DFCA9B] flex items-center justify-center gap-2 text-xs font-semibold text-[#241D1B] shadow-2xs active:scale-[0.98] transition-transform"
                  >
                    <Heart className="w-4 h-4 text-[#8C7248] shrink-0" />
                    <span className="truncate">Ulubione {wishlistCount > 0 ? `(${wishlistCount})` : ""}</span>
                  </Link>
                </div>

                {/* Przejście do koszyka */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsCartOpen(true);
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-md bg-white border border-[#DFCA9B] flex items-center justify-between text-xs font-semibold text-[#241D1B] shadow-2xs active:scale-[0.98] transition-transform"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#8C7248]" />
                    <span>Koszyk zakupowy</span>
                  </span>
                  <span className="bg-[#9E8359] text-white text-[11px] px-2 py-0.5 rounded-full font-bold">
                    {itemCount}
                  </span>
                </button>

                {/* Panel Właścicielki jeśli zalogowana jako admin */}
                {auth.isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-md bg-[#9E8359] hover:bg-[#8B7147] text-white text-xs uppercase tracking-wider flex items-center justify-center gap-2 font-semibold shadow-xs"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Panel właścicielki (/admin)</span>
                  </Link>
                )}
              </div>

              {/* ─── SEKCJA 3: INFORMACJE I POMOC ─── */}
              <div className="space-y-1.5 pt-2 border-t border-[#EADFD5]">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8C7248] mb-1">
                  Informacje i kontakt
                </p>
                <Link
                  href="/o-butiku"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-3 rounded-md hover:bg-[#EADDCF]/40 text-xs text-[#2E221E] font-medium transition-colors"
                >
                  O butiku AURA
                </Link>
                <Link
                  href="/kontakt"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-3 rounded-md hover:bg-[#EADDCF]/40 text-xs text-[#2E221E] font-medium transition-colors"
                >
                  Kontakt & Butik w Żmigrodzie
                </Link>
                <Link
                  href="/dostawa-i-platnosci"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-3 rounded-md hover:bg-[#EADDCF]/40 text-xs text-[#2E221E] font-medium transition-colors"
                >
                  Dostawa i płatności
                </Link>
                <Link
                  href="/zwroty-i-reklamacje"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-3 rounded-md hover:bg-[#EADDCF]/40 text-xs text-[#2E221E] font-medium transition-colors"
                >
                  Zwroty i reklamacje
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Koszyk boczny */}
      <CartDrawer />
    </div>
  );
}

export function Header() {
  return (
    <Suspense
      fallback={
        <div
          className="w-full h-24 bg-[#BCAB9B]"
          style={{ backgroundColor: "#BCAB9B" }}
        />
      }
    >
      <HeaderInner />
    </Suspense>
  );
}
