"use client";

import React from "react";
import { StoreSettings, VisualBannerConfig } from "@/lib/types";
import { BannerRenderer } from "./BannerRenderer";
import { getDefaultBannerConfig } from "@/lib/banner-defaults";

interface HeroBannerProps {
  settings: StoreSettings;
}

export function HeroBanner({ settings }: HeroBannerProps) {
  // Jeśli w ustawieniach sklepu jest opublikowana konfiguracja wizualnego banera,
  // używamy jej bezpośrednio; w przeciwnym razie używamy domyślnej konfiguracji
  const bannerConfig: VisualBannerConfig =
    settings.visualBannerPublished || getDefaultBannerConfig();

  return (
    <section className="relative w-full rounded-sm overflow-hidden shadow-xs border border-[#EADFD5] group bg-[#FAF6F1]">
      <BannerRenderer config={bannerConfig} interactive={false} />
    </section>
  );
}
