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
    { label: "Zamówienia", href: "/admin/zamowienia", icon: ShoppingBag },
    { label: "Ustawienia Butiku", href: "/admin/ustawienia", icon: Settings },
  ];

  return (
    <header className="bg-white border-b border-[#EADFD5] sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Logo i oznaczenie Panelu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#241D1B] hover:bg-[#FAF6F1] rounded"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <BrandLogo size="sm" />
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase tracking-widest bg-[#C5A069] text-white rounded font-medium shadow-xs">
              Panel Zarządzania
            </span>
          </div>

          {/* Nawigacja Desktop */}
          <nav className="hidden lg:flex items-center gap-1 text-xs">
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
                  className={`flex items-center gap-1.5 px-3 py-2 rounded transition-colors ${
                    isActive
                      ? "bg-[#C5A069] text-white font-medium shadow-xs"
                      : "text-[#6E6259] hover:text-[#241D1B] hover:bg-[#FAF6F1]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
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
              className="hidden sm:flex items-center gap-1.5 text-xs text-[#6E6259] hover:text-[#241D1B] px-2.5 py-1.5 border border-[#EADFD5] rounded transition-colors hover:border-[#C5A069]"
              title="Otwórz sklep w nowej karcie"
            >
              <span>Zobacz sklep</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-[#A84B4B] hover:bg-red-50 px-2.5 py-1.5 border border-red-200 rounded transition-colors"
              title="Wyloguj się"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Wyloguj</span>
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobilne Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#EADFD5] bg-[#FAF6F1] p-4 space-y-2">
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
                className={`flex items-center gap-2.5 p-3 rounded text-xs uppercase tracking-wider ${
                  isActive
                    ? "bg-[#C5A069] text-white font-medium"
                    : "text-[#3E3B38] bg-white border border-[#EADFD5]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#C5A069]"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-[#EADFD5] flex gap-2">
            <Link
              href="/"
              target="_blank"
              className="flex-1 py-2 text-center border border-[#EADFD5] bg-white text-xs text-[#241D1B] rounded"
            >
              Zobacz sklep
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
