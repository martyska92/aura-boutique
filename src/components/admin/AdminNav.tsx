"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ExternalLink,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { resolveKasiaGreeting, clearGreetingSession } from "@/lib/admin-greetings";

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [greeting, setGreeting] = useState<string | null>(null);
  const [isOwnerAdmin, setIsOwnerAdmin] = useState<boolean>(true);

  // Ukryj menu na stronie logowania administratora
  if (pathname === "/admin/login") {
    return null;
  }

  // Wczytanie i zachowanie powitania dla Kasi w ramach aktywnej sesji
  useEffect(() => {
    let isMounted = true;
    const checkIdentityAndGreeting = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (!isMounted) return;
          if (data.isLoggedIn && data.isAdmin) {
            const emailLower = (data.email || "").toLowerCase();
            const nameLower = (data.customerName || "").toLowerCase();

            // Powitania dla Kasi kierujemy do właścicielki (konto butiku aurazmigrod@wp.pl / Kasia / Karolina)
            const isKasia =
              emailLower === "aurazmigrod@wp.pl" ||
              emailLower.includes("kasia") ||
              emailLower.includes("aura") ||
              nameLower.includes("kasia") ||
              nameLower.includes("właścicielka") ||
              nameLower.includes("karolina");

            setIsOwnerAdmin(isKasia);

            if (isKasia) {
              setGreeting(resolveKasiaGreeting());
            } else {
              // Inny administrator - nie nazywamy go Kasią, lecz witamy neutralnie / imieniem
              const displayName = data.customerName || data.email?.split("@")[0] || "Administrator";
              setGreeting(`Witaj, ${displayName}! Dobrego dnia ✨`);
            }
          }
        }
      } catch {
        if (isMounted) {
          setGreeting(resolveKasiaGreeting());
        }
      }
    };

    checkIdentityAndGreeting();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      clearGreetingSession();
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Pozycje menu panelu z widoczną zakładką "Koszty i zysk"
  const navItems = [
    { label: "Pulpit", href: "/admin", exact: true },
    { label: "Produkty", href: "/admin/produkty", exact: false },
    { label: "Kategorie", href: "/admin/kategorie", exact: false },
    { label: "Zamówienia", href: "/admin/zamowienia", exact: false },
    { label: "Koszty i zysk", href: "/admin/koszty-i-marze", exact: false },
    { label: "Klientki", href: "/admin/klientki", exact: false },
    { label: "Promocje i rabaty", href: "/admin/promocje", exact: false },
    { label: "Notatki i kalendarz", href: "/admin/kalendarz", exact: false },
    { label: "Edytor banera", href: "/admin/baner", exact: false },
    { label: "Ustawienia", href: "/admin/ustawienia", exact: false },
  ];

  const isItemActive = (item: (typeof navItems)[number]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  return (
    <header
      className="sticky top-0 z-40 text-[#241D1B] shadow-[0_4px_16px_rgba(36,29,27,0.16)] transition-all"
      style={{
        backgroundColor: "#BCAB9B",
        backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
        backgroundRepeat: "repeat",
      }}
    >
      {/* 1. Górny pasek ogłoszeń identyczny jak w sklepie */}
      <AnnouncementBar />

      {/* 2. Główny pas nagłówka z dużym centralnym logo (układ 3-kolumnowy 1fr - auto - 1fr) */}
      <div className="border-t border-[#968372]/30 border-b border-[#968372]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 lg:h-20 grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-3">
          {/* ─── LEWA KOLUMNA (1fr, justify-self-start): Menu mobilne + Plakietka + Powitanie ─── */}
          <div className="flex items-center gap-2 sm:gap-3 justify-self-start min-w-0 max-w-full">
            {/* Przycisk menu rozwijanego na mniejszych ekranach */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center text-[#241D1B] hover:text-[#542823] active:scale-95 transition-transform rounded-md hover:bg-white/30 focus:outline-none"
              aria-label={mobileMenuOpen ? "Zamknij menu panelu" : "Otwórz menu panelu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6 text-[#241D1B]" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-[#241D1B]" />}
            </button>

            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2">
                {/* Subtelna plakietka "Panel właścicielki" */}
                <div className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs text-[#241D1B] font-medium bg-[#DDD0C4]/80 border border-[#968372] rounded-md shadow-2xs shrink-0">
                  <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8C7248] shrink-0" />
                  <span className="font-serif tracking-normal text-[10px] sm:text-[11px] font-semibold whitespace-nowrap">
                    {isOwnerAdmin ? "Panel właścicielki" : "Panel administratora"}
                  </span>
                </div>
              </div>

              {/* Krótkie, ciepłe i eleganckie powitanie dla Kasi */}
              {greeting && (
                <div
                  className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-[#2A1E19] font-medium tracking-tight line-clamp-2 max-w-[200px] sm:max-w-[340px] md:max-w-[420px] leading-snug"
                  title={greeting}
                >
                  <span className="text-[#8F6F32] font-semibold mr-1">✦</span>
                  <span className="text-[#2A1E19] font-medium">{greeting}</span>
                </div>
              )}
            </div>
          </div>

          {/* ─── ŚRODKOWA KOLUMNA (auto, justify-self-center): Duże logo AURA idealnie na środku ─── */}
          <div className="justify-self-center flex items-center justify-center px-1">
            <Link href="/admin" className="flex items-center justify-center" title="Pulpit panelu AURA Boutique">
              <BrandLogo size="md" variant="cashmere" />
            </Link>
          </div>

          {/* ─── PRAWA KOLUMNA (1fr, justify-self-end): Zobacz sklep i Wyloguj ─── */}
          <div className="flex items-center gap-1.5 sm:gap-2 justify-self-end text-xs font-medium">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all border border-[#968372] bg-white/70 hover:bg-white text-[#241D1B] shadow-2xs hover:shadow-xs whitespace-nowrap"
              title="Otwórz sklep w nowej karcie"
            >
              <span className="hidden sm:inline">Zobacz sklep</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#8C7248]" />
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all border border-[#D5B5AF] bg-[#F2DDD9]/80 hover:bg-[#F2DDD9] text-[#6E2222] shadow-2xs hover:shadow-xs cursor-pointer whitespace-nowrap"
              title="Wyloguj się z panelu"
            >
              <LogOut className="w-3.5 h-3.5 text-[#6E2222]" />
              <span className="hidden sm:inline">Wyloguj</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Pasek menu administracyjnego pod głównym pasem (na tle odpowiadającym paskowi kategorii sklepu) */}
      <nav
        aria-label="Menu nawigacyjne panelu"
        className="w-full bg-[#B29F8E]/95 backdrop-blur-xs border-b border-[#968372] overflow-x-auto no-scrollbar shadow-inner hidden lg:flex justify-center"
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 h-9 sm:h-10 flex items-center justify-center gap-1 xl:gap-2 whitespace-nowrap text-xs">
          {navItems.map((item) => {
            const active = isItemActive(item);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2.5 xl:px-3 py-1 rounded text-[11px] xl:text-xs transition-colors flex items-center gap-1.5 shrink-0 ${
                  active
                    ? "bg-[#241D1B] text-[#F3E7D3] font-semibold shadow-xs"
                    : "text-[#241D1B] hover:text-[#542823] hover:bg-[#A89686]/40 font-medium"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 4. Menu rozwijane na mniejszych ekranach (telefon / tablet) z dużymi obszarami dotykowymi */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden border-t border-[#968372] p-4 space-y-2.5 shadow-inner animate-in slide-in-from-top-2 duration-150 max-h-[calc(100dvh-80px)] overflow-y-auto"
          style={{
            backgroundColor: "#FAF6F1",
          }}
        >
          <div className="pb-2 border-b border-[#968372]/30 mb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8C7248] uppercase tracking-wider">
              Nawigacja Panelu Właścicielki
            </span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 text-[#6E6259] hover:text-[#241D1B]"
              aria-label="Zamknij menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {navItems.map((item) => {
              const active = isItemActive(item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 min-h-[44px] rounded-md text-xs transition-colors ${
                    active
                      ? "bg-[#241D1B] text-[#F3E7D3] font-bold border-l-4 border-[#C5A069] shadow-xs"
                      : "text-[#241D1B] bg-white border border-[#DFCA9B] hover:bg-white/90 font-medium shadow-2xs"
                  }`}
                >
                  <span className="break-words font-medium">{item.label}</span>
                  {active && (
                    <span className="text-[10px] text-[#C5A069] font-bold uppercase tracking-wider shrink-0 ml-2">
                      Aktywna
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#968372]/30 flex gap-2">
            <Link
              href="/"
              target="_blank"
              className="flex-1 min-h-[44px] py-2 text-center border border-[#968372] bg-white hover:bg-[#FAF6F1] text-xs font-semibold text-[#241D1B] rounded-md inline-flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <span>Zobacz sklep</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#8C7248]" />
            </Link>

            <button
              onClick={handleLogout}
              className="px-4 min-h-[44px] py-2 border border-[#D5B5AF] bg-[#F2DDD9] hover:bg-[#F2DDD9]/80 text-xs font-semibold text-[#6E2222] rounded-md inline-flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5 text-[#6E2222]" />
              <span>Wyloguj</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
