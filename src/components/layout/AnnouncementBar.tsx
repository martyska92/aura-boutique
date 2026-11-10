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
      className="text-[#FAF6F1] text-[11px] sm:text-xs py-2 px-4 transition-colors border-b border-[#968372] shadow-xs"
      style={{
        backgroundColor: "#A18D7C",
        backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
        backgroundRepeat: "repeat",
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-4 tracking-wider uppercase font-medium">
        <div className="flex items-center gap-1.5 text-[#FFF9F2]">
          <MapPin className="w-3.5 h-3.5 text-[#F2DFBD]" />
          <span>Żmigród | ul. Poprzeczna 3/1A</span>
        </div>

        <div className="flex items-center gap-2 text-center text-[#FFF9F2]">
          {isWeekend ? (
            <Link
              href="/katalog?kategoria=marynarki"
              className="hover:underline flex items-center gap-1.5 text-[#FFF9E6] font-bold"
            >
              <Clock className="w-3.5 h-3.5 text-[#FFE5A3] animate-pulse" />
              <span>Weekend w AURA: –15% na Marynarki (do ndz 23:59) • Sprawdź →</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F2DFBD]" />
              <span>Darmowa dostawa od 300 PLN • Skarpetki gratis od 100 PLN</span>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-4 text-[#F0E6DC] text-[10px]">
          <span>Wysyłka w 24h</span>
          <span>•</span>
          <span>14 dni na zwrot</span>
        </div>
      </div>
    </div>
  );
}
