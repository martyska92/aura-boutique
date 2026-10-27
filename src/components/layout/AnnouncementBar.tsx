"use client";

import React from "react";
import { MapPin, Sparkles, Heart } from "lucide-react";

export function AnnouncementBar() {
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
          <Sparkles className="w-3.5 h-3.5 text-[#F2DFBD]" />
          <span>Darmowa dostawa od 300 PLN | Butik z odzieżą damską</span>
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
