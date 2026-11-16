import Link from "next/link";
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
  variant = "default",
}: BrandLogoProps) {
  const heightClasses = {
    sm: "h-7 sm:h-9",
    md: "h-10 sm:h-14 lg:h-16",
    lg: "h-14 sm:h-20",
    xl: "h-20 sm:h-28",
  };

  const content = (
    <div
      className={`relative ${heightClasses[size]} max-w-full aspect-[460/150] shrink-0 flex items-center justify-center text-[#241D1B]`}
      aria-label="AURA Boutique K.B."
    >
      {/* 100% płaski, ostry logotyp wektorowy 2D – bez 3D, bez gradientów, bez złotej poświaty */}
      <svg
        viewBox="0 0 460 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain select-none"
      >
        <text
          x="50%"
          y="74"
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
          className="font-serif font-bold tracking-[0.22em] text-[70px]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          AURA
        </text>
        <line
          x1="55"
          y1="124"
          x2="135"
          y2="124"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeOpacity="0.45"
        />
        <text
          x="50%"
          y="124"
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
          className="font-sans font-semibold tracking-[0.46em] text-[14px] uppercase"
          style={{ fillOpacity: 0.85 }}
        >
          BOUTIQUE
        </text>
        <line
          x1="325"
          y1="124"
          x2="405"
          y2="124"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeOpacity="0.45"
        />
      </svg>
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
      className={`inline-flex items-center justify-center group cursor-pointer select-none transition-transform hover:scale-[1.02] duration-300 ${className}`}
      title="AURA Boutique K.B."
    >
      {content}
    </Link>
  );
}
