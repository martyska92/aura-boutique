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
    { label: "Pulpit", href: "/admin", icon: LayoutDashboard },
    { label: "Produkty", href: "/admin/produkty", icon: Package },
    { label: "Dodaj produkt", href: "/admin/produkty/nowy", icon: PlusCircle },
    { label: "Kategorie", href: "/admin/kategorie", icon: Layers },
    { label: "Zamówienia", href: "/admin/zamowienia", icon: ShoppingBag },
    { label: "Ustawienia Butiku", href: "/admin/ustawienia", icon: Settings },
  ];

  return (
    <header
      className="sticky top-0 z-40 border-b border-[#968372] shadow-[0_4px_20px_rgba(36,29,27,0.18)] transition-all text-[#241D1B]"
      style={{
        backgroundColor: "#BCAB9B",
        backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
        backgroundRepeat: "repeat",
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo i oznaczenie Panelu */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#241D1B] hover:text-[#542823] transition-colors rounded"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link href="/admin" className="flex items-center gap-2.5">
              <BrandLogo size="sm" variant="cashmere" />
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] bg-[#9E8359] text-white rounded-full font-semibold border border-[#856D45] shadow-xs">
                <ShieldCheck className="w-3 h-3 text-[#FFE5B4]" />
                <span>Panel Właścicielki</span>
              </span>
            </Link>
          </div>

          {/* Nawigacja Desktop - stylizowane medaliony/pille jak na stronie głównej */}
          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2 text-[11px] uppercase tracking-[0.16em] font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-full transition-all inline-flex items-center gap-1.5 ${
                    isActive
                      ? "text-white bg-[#9E8359] font-bold shadow-xs border border-[#856D45]"
                      : "text-[#2E221E] font-medium hover:bg-[#A89686]/40 hover:text-[#18110D]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#FFE5B4]" : "text-[#5C4D44]"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Akcje prawe: Podgląd sklepu i Wylogowanie */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#241D1B] hover:text-[#542823] border border-[#968372] bg-[#DDD0C4]/60 hover:bg-[#DDD0C4]/90 px-3 py-1.5 rounded-full transition-all font-medium shadow-xs"
              title="Otwórz sklep w nowej karcie"
            >
              <span className="hidden sm:inline">Zobacz sklep</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#9E8359]" />
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#6E2222] bg-[#F2DDD9]/80 hover:bg-[#F2DDD9] border border-[#D5B5AF] px-3 py-1.5 rounded-full transition-all font-semibold shadow-xs"
              title="Wyloguj się"
            >
              <LogOut className="w-3.5 h-3.5 text-[#6E2222]" />
              <span className="hidden sm:inline">Wyloguj</span>
            </button>
          </div>
        </div>
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
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 p-3 rounded-full text-xs uppercase tracking-wider transition-all ${
                  isActive
                    ? "bg-[#9E8359] text-white font-bold border border-[#856D45] shadow-sm"
                    : "text-[#241D1B] bg-[#DDD0C4]/70 hover:bg-[#DDD0C4] border border-[#968372]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#FFE5B4]" : "text-[#735F50]"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-[#968372]/60 flex gap-2">
            <Link
              href="/"
              target="_blank"
              className="flex-1 py-2 text-center border border-[#968372] bg-[#DDD0C4]/80 text-xs uppercase tracking-wider font-semibold text-[#241D1B] rounded-full"
            >
              Przejdź do sklepu ↗
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
