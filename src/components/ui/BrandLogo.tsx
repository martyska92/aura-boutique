import Link from "next/link";
import Image from "next/image";
import React from "react";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  isLink?: boolean;
  withAura?: boolean;
  variant?: "default" | "cashmere" | string;
}

export function BrandLogo({
  className = "",
  size = "md",
  isLink = true,
  withAura = true,
  variant = "default",
}: BrandLogoProps) {
  const heightClasses = {
    sm: "h-9 sm:h-10",
    md: "h-14 sm:h-18 lg:h-20",
    lg: "h-20 sm:h-24",
    xl: "h-24 sm:h-32 lg:h-40",
  };

  const auraSizes = {
    sm: "w-36 h-14",
    md: "w-64 sm:w-80 h-22 sm:h-26",
    lg: "w-80 sm:w-96 h-30 sm:h-36",
    xl: "w-96 sm:w-[460px] h-38 sm:h-46",
  };

  const content = (
    <div className={`relative ${heightClasses[size]} aspect-[983/374] shrink-0 flex items-center justify-center`}>
      {/* 🌟 Promieniująca Złota Aura z Logo (Ciepłe, nastrojowe złociste światło) 🌟 */}
      {withAura && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-0">
          <div
            className={`absolute ${auraSizes[size]} rounded-[100%] bg-[radial-gradient(ellipse_at_center,_rgba(235,190,120,0.32)_0%,_rgba(180,135,70,0.16)_48%,_transparent_75%)] blur-md sm:blur-lg animate-aura-pulse transition-opacity duration-500 group-hover:opacity-100 opacity-75`}
          />
          <div
            className={`absolute ${auraSizes[size]} scale-75 rounded-[100%] bg-[radial-gradient(ellipse_at_center,_rgba(255,225,160,0.4)_0%,_rgba(215,165,90,0.2)_45%,_transparent_70%)] blur-sm sm:blur-md animate-aura-shimmer transition-transform duration-500 group-hover:scale-90`}
          />
        </div>
      )}

      {/* Nowy Złoty logotyp AURA BOUTIQUE z wyrazistym, ostrym konturem i głębią */}
      <Image
        src="/images/brand/aura-logo-v4.png"
        alt="AURA Boutique"
        fill
        priority
        sizes="(max-width: 640px) 240px, (max-width: 1024px) 340px, 420px"
        className="relative z-10 object-contain object-center transition-all duration-300 drop-shadow-[0_2px_8px_rgba(25,18,14,0.32)] group-hover:drop-shadow-[0_4px_16px_rgba(215,165,85,0.4)]"
      />
    </div>
  );

  if (!isLink) {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href="/"
      className={`inline-flex items-center justify-center group cursor-pointer select-none transition-transform hover:scale-[1.03] duration-300 ${className}`}
      title="AURA Boutique K.B."
    >
      {content}
    </Link>
  );
}
