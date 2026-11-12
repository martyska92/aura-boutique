"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export const LAST_SHOPPING_URL_KEY = "aura_last_shopping_url";

export function recordLastShoppingUrl(url: string) {
  if (typeof window === "undefined") return;
  try {
    // Rejestrujemy tylko strony przeglądania katalogu, produktów lub stronę główną
    if (
      url.startsWith("/katalog") ||
      url.startsWith("/produkt") ||
      url === "/"
    ) {
      sessionStorage.setItem(LAST_SHOPPING_URL_KEY, url);
    }
  } catch {}
}

export function getLastShoppingUrl(): string {
  if (typeof window === "undefined") return "/katalog";
  try {
    const saved = sessionStorage.getItem(LAST_SHOPPING_URL_KEY);
    if (
      saved &&
      saved.startsWith("/") &&
      !saved.startsWith("/koszyk") &&
      !saved.startsWith("/zamowienie")
    ) {
      return saved;
    }
  } catch {}
  return "/katalog";
}

interface ContinueShoppingButtonProps {
  className?: string;
  label?: string;
}

export function ContinueShoppingButton({
  className = "",
  label = "← Kontynuuj zakupy",
}: ContinueShoppingButtonProps) {
  const router = useRouter();
  const [targetUrl, setTargetUrl] = useState("/katalog");

  useEffect(() => {
    setTargetUrl(getLastShoppingUrl());
  }, []);

  return (
    <button
      type="button"
      onClick={() => router.push(targetUrl)}
      className={`inline-flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-2.5 bg-white hover:bg-[#FAF6F1] active:bg-[#F2DDD9] text-[#241D1B] border-2 border-[#D8BE8E] hover:border-[#C5A069] rounded-md font-medium text-xs sm:text-sm tracking-wider uppercase shadow-xs transition-all active:scale-[0.98] min-h-[44px] cursor-pointer ${className}`}
      title="Wróć do przeglądania ubrań"
      aria-label="Kontynuuj zakupy"
    >
      <ArrowLeft className="w-4 h-4 text-[#C5A069] shrink-0" />
      <span className="font-semibold">{label}</span>
    </button>
  );
}
