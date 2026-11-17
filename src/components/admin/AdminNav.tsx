"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingBag,
  Settings,
  Layers,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Tag,
  Users,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Ukryj menu na stronie logowania
  if (pathname === "/admin/login") {
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { label: "Pulpit", href: "/admin", icon: LayoutDashboard, exact: true },
    {
      label: "Produkty",
      href: "/admin/produkty",
      icon: Package,
      exact: false,
      excludePrefix: "/admin/produkty/nowy",
    },
    { label: "Dodaj produkt", href: "/admin/produkty/nowy", icon: PlusCircle, exact: true },
    { label: "Kategorie", href: "/admin/kategorie", icon: Layers, exact: false },
    { label: "Zamówienia", href: "/admin/zamowienia", icon: ShoppingBag, exact: false },
    { label: "Klientki", href: "/admin/klientki", icon: Users, exact: false },
    { label: "Promocje & Rabaty", href: "/admin/promocje", icon: Tag, exact: false },
    { label: "Edytor Banera", href: "/admin/baner", icon: Sparkles, exact: false },
    { label: "Ustawienia Butiku", href: "/admin/ustawienia", icon: Settings, exact: false },
  ];

  const isItemActive = (item: (typeof navItems)[number]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    if (item.excludePrefix && pathname.startsWith(item.excludePrefix)) {
      return false;
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  return (
    <header
      className="sticky top-0 z-40 border-b border-[#968372] shadow-[0_4px_20px_rgba(36,29,27,0.18)] transition-all text-[#241D1B]"
      style={{
        backgroundColor: "#BCAB9B",
        backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
        backgroundRepeat: "repeat",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* GÓRNY PASEK: Logo, Badge oraz Akcje (Zobacz sklep, Wyloguj) */}
        <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Lewa strona: Hamburger na telefonie + Logo + Oznaczenie Panelu */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#241D1B] hover:text-[#542823] transition-colors rounded-md hover:bg-black/5"
              aria-label={mobileMenuOpen ? "Zamknij menu nawigacji" : "Otwórz menu nawigacji"}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/admin" className="flex items-center gap-2.5 shrink-0">
              <BrandLogo size="sm" variant="cashmere" />
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] bg-[#9E8359] text-white rounded-full font-semibold border border-[#856D45] shadow-xs">
                <ShieldCheck className="w-3 h-3 text-[#FFE5B4]" />
                <span>Panel Właścicielki</span>
              </span>
            </Link>
          </div>

          {/* Prawa strona: Podgląd sklepu i Wylogowanie - GWARANCJA WIDOCZNOŚCI NA KAŻDEJ ROZDZIELCZOŚCI */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#241D1B] hover:text-[#542823] border border-[#968372] bg-[#DDD0C4]/70 hover:bg-[#DDD0C4] px-3 py-1.5 rounded-full transition-all font-medium shadow-xs"
              title="Otwórz sklep w nowej karcie"
            >
              <span className="hidden sm:inline">Zobacz sklep</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#9E8359]" />
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#6E2222] bg-[#F2DDD9]/90 hover:bg-[#F2DDD9] border border-[#D5B5AF] px-3 py-1.5 rounded-full transition-all font-semibold shadow-xs cursor-pointer"
              title="Wyloguj się z panelu"
            >
              <LogOut className="w-3.5 h-3.5 text-[#6E2222]" />
              <span className="hidden sm:inline">Wyloguj</span>
            </button>
          </div>
        </div>

        {/* DOLNY PASEK NAWIGACJI (DESKTOP & TABLET): Stylizowane medaliony, zgrabnie mieszczące wszystkie 9 zakładek */}
        <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2 py-2 border-t border-[#968372]/30 overflow-x-auto scrollbar-none text-[11px] uppercase tracking-[0.14em]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-full transition-all inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                  active
                    ? "text-white bg-[#9E8359] font-bold shadow-xs border border-[#856D45]"
                    : "text-[#2E221E] font-medium hover:bg-[#A89686]/40 hover:text-[#18110D]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-[#FFE5B4]" : "text-[#5C4D44]"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Menu Mobilne Drawer z tłem cashmere */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden border-t border-[#968372] p-4 space-y-2 shadow-inner"
          style={{
            backgroundColor: "#B4A393",
            backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
            backgroundRepeat: "repeat",
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 p-3 rounded-full text-xs uppercase tracking-wider transition-all ${
                  active
                    ? "bg-[#9E8359] text-white font-bold border border-[#856D45] shadow-sm"
                    : "text-[#241D1B] bg-[#DDD0C4]/70 hover:bg-[#DDD0C4] border border-[#968372]"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-[#FFE5B4]" : "text-[#735F50]"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-[#968372]/60 flex gap-2">
            <Link
              href="/"
              target="_blank"
              className="flex-1 py-2 text-center border border-[#968372] bg-[#DDD0C4]/80 text-xs uppercase tracking-wider font-semibold text-[#241D1B] rounded-full inline-flex items-center justify-center gap-1.5"
            >
              <span>Zobacz sklep</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#9E8359]" />
            </Link>

            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-[#D5B5AF] bg-[#F2DDD9] text-xs uppercase tracking-wider font-semibold text-[#6E2222] rounded-full inline-flex items-center justify-center gap-1.5"
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
