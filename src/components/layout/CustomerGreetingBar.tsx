"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  resolveCustomerGreeting,
  clearCustomerGreetingSession,
} from "@/lib/customer-greetings";

export function CustomerGreetingBar() {
  const pathname = usePathname();
  const [greetingText, setGreetingText] = useState<string | null>(null);

  // Wymóg 7: W panelu właścicielki (/admin/*) zachowaj wyłącznie dedykowane powitania Kasi
  const isAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdminRoute) {
      setGreetingText(null);
      return;
    }

    let isMounted = true;

    const checkSessionAndGreet = async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (!res.ok) {
          if (isMounted) {
            setGreetingText(null);
            clearCustomerGreetingSession();
          }
          return;
        }

        const data = await res.json();
        if (!isMounted) return;

        if (data && data.isLoggedIn) {
          // Pobieramy imię klientki z profilu (Wymóg 1 & 2)
          const firstName = data.firstName || "";
          const email = data.email || "";

          // Wybieramy i zachowujemy powitanie w ramach aktywnej sesji (Wymóg 4 & 5)
          const text = resolveCustomerGreeting(firstName, email);
          setGreetingText(text);
        } else {
          // Po wylogowaniu natychmiast usuń powitanie i stan (Wymóg 6)
          setGreetingText(null);
          clearCustomerGreetingSession();
        }
      } catch {
        if (isMounted) {
          setGreetingText(null);
        }
      }
    };

    checkSessionAndGreet();

    // Nasłuchuj na zdarzenia logowania / wylogowania w aplikacji
    const handleAuthChange = () => {
      checkSessionAndGreet();
    };

    window.addEventListener("auth-change", handleAuthChange);
    return () => {
      isMounted = false;
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, [pathname, isAdminRoute]);

  // Jeśli brak zalogowanej sesji lub jesteśmy w panelu /admin, nie renderuj nic (Wymóg 7)
  if (!greetingText || isAdminRoute) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-[#FAF6F1]/95 text-[#4A3931] border-b border-[#D8BE8E]/50 px-3 py-1 sm:py-1.5 text-center text-xs sm:text-[13px] font-medium tracking-wide transition-all shadow-2xs backdrop-blur-xs"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-center">
        {/* Na telefonie: maksymalnie 2 wiersze, bez pustych przestrzeni */}
        <p className="line-clamp-2 leading-snug break-words">
          {greetingText}
        </p>
      </div>
    </div>
  );
}
