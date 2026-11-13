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
  ArrowRight,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { AnnouncementBar } from "./AnnouncementBar";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useCart } from "@/context/CartContext";

const DEFAULT_HEADER_CATEGORIES = [
  { slug: "sukienki", name: "Sukienki" },
  { slug: "swetry", name: "Swetry" },
  { slug: "bluzy", name: "Bluzy" },
  { slug: "koszule", name: "Koszule" },
  { slug: "topy", name: "Topy" },
  { slug: "t-shirty", name: "T-shirty" },
  { slug: "marynarki", name: "Marynarki" },
];

function HeaderInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { itemCount, setIsCartOpen } = useCart();

  const [categories, setCategories] = useState(DEFAULT_HEADER_CATEGORIES);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [auth, setAuth] = useState<{ isLoggedIn: boolean; isAdmin: boolean; email?: string }>({
    isLoggedIn: false,
    isAdmin: false,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Pobieranie aktywnych kategorii sklepu
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

  // Zamykanie menu mobilnego klawiszem Escape oraz blokowanie scrolla tła
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setSearchOpen(false);
      }
    };

    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

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
      {/* 🌟 GŁÓWNY PRZYKLEJONY NAGŁÓWEK (FIXED TOP-0 LEFT-0 W-FULL Z-50) 🌟
          Stale widoczny u góry ekranu na laptopie i telefonie podczas każdego przewijania */}
      <header
        className="fixed top-0 left-0 w-full z-50 text-[#241D1B] shadow-[0_4px_16px_rgba(36,29,27,0.16)]"
        style={{
          backgroundColor: "#BCAB9B",
          backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
          backgroundRepeat: "repeat",
        }}
      >
        {/* Pasek ogłoszeń i promocji - jedna krótka linia na telefonie */}
        <AnnouncementBar />

        {/* Główny pasek nawigacji: układ 3-kolumnowy (1fr - auto - 1fr),
            co gwarantuje, że LOGO JEST ZAWSZE W 100% NA DOKŁADNYM ŚRODKU EKRANU */}
        <div className="border-t border-[#968372]/30 border-b border-[#968372]">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 lg:h-20 grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-3">
            {/* ─── LEWA KOLUMNA (1fr, justify-self-start) ─── */}
            <div className="flex items-center gap-1 justify-self-start min-w-0">
              {/* Na telefonie: przycisk menu po lewej */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden w-10 h-10 flex items-center justify-center text-[#241D1B] hover:text-[#542823] active:scale-95 transition-transform rounded-md focus:outline-none"
                aria-label={mobileMenuOpen ? "Zamknij menu" : "Otwórz menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-[#241D1B]" />
                ) : (
                  <Menu className="w-6 h-6 text-[#241D1B]" />
                )}
              </button>

              {/* Na komputerze: pole wyszukiwarki po lewej */}
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

            {/* ─── ŚRODEK: LOGO (auto, justify-self-center) DOKŁADNIE CENTRALNIE ─── */}
            <div className="justify-self-center flex items-center justify-center px-1">
              <BrandLogo size="md" variant="cashmere" />
            </div>

            {/* ─── PRAWA KOLUMNA (1fr, justify-self-end) ─── */}
            <div className="flex items-center gap-1 sm:gap-2 justify-self-end text-xs font-medium">
              {/* Na telefonie: ikona wyszukiwarki (lupa) */}
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="lg:hidden w-10 h-10 flex items-center justify-center text-[#241D1B] active:scale-95 transition-transform rounded-md"
                aria-label="Wyszukiwarka"
              >
                <Search className="w-5 h-5 text-[#241D1B]" />
              </button>

              {/* Na komputerze: Ulubione */}
              <Link
                href="/katalog?filter=bestsellery"
                className="hidden lg:flex w-10 h-10 sm:w-auto sm:px-2.5 sm:py-2 items-center justify-center gap-1.5 rounded-md hover:bg-[#A89686]/40 text-[#241D1B] transition-colors"
                title="Ulubione i Bestsellery"
              >
                <Heart className="w-4 h-4 text-[#C5A069]" />
                <span className="hidden xl:inline">Ulubione</span>
              </Link>

              {/* Na komputerze: Konto klientki */}
              <Link
                href={auth.isLoggedIn ? "/konto" : "/logowanie"}
                className="hidden lg:flex w-10 h-10 sm:w-auto sm:px-2.5 sm:py-2 items-center justify-center gap-1.5 rounded-md hover:bg-[#A89686]/40 text-[#241D1B] transition-colors"
                title={auth.isLoggedIn ? "Moje konto" : "Zaloguj się"}
              >
                <User className="w-4 h-4 text-[#C5A069]" />
                <span className="hidden xl:inline">
                  {auth.isLoggedIn ? "Konto" : "Logowanie"}
                </span>
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

              {/* Koszyk:
                  Na telefonie: zgrabna ikona bez dużego prostokątnego tła przycisku
                  Na komputerze: elegancki przycisk z napisem "Koszyk" */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center justify-center w-10 h-10 lg:w-auto lg:h-auto lg:px-3 lg:py-2 lg:bg-[#9E8359] lg:hover:bg-[#8B7147] text-[#241D1B] lg:text-white text-xs font-semibold rounded-md lg:shadow-xs transition-all active:scale-95"
                aria-label={`Koszyk, ${itemCount} pozycji`}
              >
                <ShoppingBag className="w-5 h-5 lg:w-4 lg:h-4 text-[#241D1B] lg:text-white" />
                <span className="hidden lg:inline ml-1.5">Koszyk</span>
                {itemCount > 0 && (
                  <span className="absolute top-1 right-1 lg:-top-1.5 lg:-right-1.5 bg-[#8C2D2D] lg:bg-[#241D1B] text-white lg:text-[#F3E7D3] lg:border lg:border-[#C5A069] text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-bold shadow-xs">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Rozwijany pasek wyszukiwarki mobilnej pod nagłówkiem */}
          {searchOpen && (
            <div className="lg:hidden p-3 bg-[#DDD0C4] border-t border-[#968372] animate-in slide-in-from-top-2 duration-150">
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
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ─── POZIOMY PASEK KATEGORII POD GŁÓWNYM PASKIEM Z LOGO ─── */}
        <nav
          aria-label="Kategorie"
          className="w-full bg-[#B29F8E]/95 backdrop-blur-xs border-b border-[#968372] overflow-x-auto no-scrollbar shadow-inner"
        >
          <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-9 sm:h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap min-w-max text-xs">
            <Link
              href="/katalog"
              className={`px-2.5 py-1 rounded text-[11px] sm:text-xs transition-colors ${
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
                  className={`px-2.5 py-1 rounded text-[11px] sm:text-xs transition-colors ${
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
              className={`px-2.5 py-1 rounded text-[11px] sm:text-xs font-semibold transition-colors flex items-center gap-1.5 ${
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

        {/* 🌟 MENU MOBILNE OTWIERANE POD NAGŁÓWKIEM 🌟
            Nigdy nie zasłania nagłówka z logo i przyciskiem zamknięcia (X) */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-x-0 bottom-0 top-[116px] sm:top-[128px] z-50 flex flex-col overflow-y-auto border-t border-[#968372] pb-12 shadow-2xl animate-in fade-in duration-200"
            style={{
              backgroundColor: "#FAF6F1",
            }}
          >
            <div className="p-4 sm:p-5 space-y-4 max-w-lg mx-auto w-full">
              {/* 1. Wyraźne przejście do zakupów (Wszystkie produkty) */}
              <Link
                href="/katalog"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full min-h-[46px] px-4 py-3 rounded-md bg-[#241D1B] hover:bg-[#3D322F] text-[#F3E7D3] border-2 border-[#C5A069] flex items-center justify-between font-semibold text-xs uppercase tracking-wider shadow-sm active:scale-[0.98] transition-all"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#C5A069]" />
                  <span>Wszystkie produkty</span>
                </span>
                <ArrowRight className="w-4 h-4 text-[#C5A069]" />
              </Link>

              {/* 2. Szybkie akcje: Moje konto i Ulubione */}
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href={auth.isLoggedIn ? "/konto" : "/logowanie"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] px-3 py-2.5 rounded bg-white border border-[#DFCA9B] flex items-center justify-center gap-2 text-xs font-semibold text-[#241D1B] shadow-xs active:scale-[0.98] transition-transform"
                >
                  <User className="w-4 h-4 text-[#8C7248]" />
                  <span>{auth.isLoggedIn ? "Moje konto" : "Zaloguj się"}</span>
                </Link>

                <Link
                  href="/katalog?filter=bestsellery"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] px-3 py-2.5 rounded bg-white border border-[#DFCA9B] flex items-center justify-center gap-2 text-xs font-semibold text-[#241D1B] shadow-xs active:scale-[0.98] transition-transform"
                >
                  <Heart className="w-4 h-4 text-[#8C7248]" />
                  <span>Ulubione</span>
                </Link>
              </div>

              {/* Panel Właścicielki jeśli zalogowana */}
              {auth.isAdmin && (
                <div className="pt-1">
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

              {/* 3. Kompaktowa sekcja: Informacje i pomoc */}
              <div className="pt-3 border-t border-[#EADFD5] space-y-1 text-xs uppercase tracking-widest text-[#2E221E] font-medium">
                <p className="text-[10px] text-[#8C7248] font-bold mb-2">Informacje i pomoc</p>
                <Link
                  href="/o-butiku"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[40px] px-2 rounded hover:bg-[#EADDCF]/40 transition-colors"
                >
                  O butiku AURA
                </Link>
                <Link
                  href="/kontakt"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[40px] px-2 rounded hover:bg-[#EADDCF]/40 transition-colors"
                >
                  Kontakt & Butik w Żmigrodzie
                </Link>
                <Link
                  href="/dostawa-i-platnosci"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[40px] px-2 rounded hover:bg-[#EADDCF]/40 transition-colors"
                >
                  Dostawa i płatności
                </Link>
                <Link
                  href="/zwroty-i-reklamacje"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[40px] px-2 rounded hover:bg-[#EADDCF]/40 transition-colors"
                >
                  Zwroty i reklamacje
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 🌟 ODSTĘP POD STAŁY NAGŁÓWEK (SPACER) 🌟
          Gwarantuje, że produkty, banery i formularze nigdy nie są zasłaniane */}
      <div
        aria-hidden="true"
        className="w-full shrink-0 pointer-events-none h-[116px] sm:h-[128px] lg:h-[144px]"
      />

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
          className="fixed top-0 left-0 w-full z-50 text-[#241D1B] h-[116px] sm:h-[128px] lg:h-[144px]"
          style={{ backgroundColor: "#BCAB9B" }}
        />
      }
    >
      <HeaderInner />
    </Suspense>
  );
}
