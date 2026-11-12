"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Sparkles, Gift, Tag, Clock } from "lucide-react";

export function AnnouncementBar() {
  const [isWeekend, setIsWeekend] = useState(false);

  useEffect(() => {
    const checkWeekend = () => {
      const now = new Date();
      const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Warsaw",
        hour: "numeric",
        weekday: "short",
        hour12: false,
      });
      const parts = dtf.formatToParts(now);
      const hourPart = parts.find((p) => p.type === "hour")?.value;
      const hour = hourPart ? parseInt(hourPart, 10) : now.getHours();
      const weekday = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Warsaw",
        weekday: "short",
      }).format(now);

      const dayMap: Record<string, number> = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
      };
      const day = dayMap[weekday] ?? now.getDay();
      setIsWeekend((day === 5 && hour >= 18) || day === 6 || day === 0);
    };

    checkWeekend();
    const interval = setInterval(checkWeekend, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="text-[#FAF6F1] text-[10px] sm:text-xs h-6 sm:h-7 px-2.5 sm:px-4 flex items-center justify-center transition-colors border-b border-[#968372] shadow-xs overflow-hidden select-none"
      style={{
        backgroundColor: "#A18D7C",
        backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
        backgroundRepeat: "repeat",
      }}
    >
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between tracking-wider uppercase font-medium leading-none">
        <div className="hidden md:flex items-center gap-1.5 text-[#FFF9F2] text-[10px]">
          <Sparkles className="w-3 h-3 text-[#F2DFBD] shrink-0" />
          <span>AURA Boutique • Nowa Kolekcja</span>
        </div>

        <div className="w-full md:w-auto text-center flex items-center justify-center gap-1.5 text-[#FFF9F2] text-[9.5px] sm:text-xs truncate">
          {isWeekend ? (
            <Link
              href="/katalog?kategoria=marynarki"
              className="hover:underline flex items-center gap-1 text-[#FFF9E6] font-bold"
            >
              <Clock className="w-3 h-3 text-[#FFE5A3] animate-pulse shrink-0" />
              <span>Weekend w AURA: –15% na Marynarki • Sprawdź →</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1 truncate">
              <Sparkles className="w-3 h-3 text-[#F2DFBD] shrink-0 hidden sm:inline" />
              <span>Darmowa dostawa od 300 zł • 14 dni na zwrot</span>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3 text-[#F0E6DC] text-[10px]">
          <span>Wysyłka w 24h</span>
          <span>•</span>
          <span>Płatność BLIK</span>
        </div>
      </div>
    </div>
  );
}
