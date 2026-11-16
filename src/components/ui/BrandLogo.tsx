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
}: BrandLogoProps) {
  const heightClasses = {
    sm: "h-8 sm:h-9",
    md: "h-11 sm:h-14 lg:h-16",
    lg: "h-16 sm:h-20",
    xl: "h-22 sm:h-28 lg:h-36",
  };

  const content = (
    <div className={`relative ${heightClasses[size]} aspect-[493/177] shrink-0 flex items-center justify-center`}>
      {/* Wektorowy logotyp AURA Boutique (AURA_BOUTIQUE_02.svg) – czysty, ostry, bez złotej poświaty */}
      <Image
        src="/images/brand/aura-logo.svg"
        alt="AURA Boutique K.B."
        fill
        priority
        unoptimized
        sizes="(max-width: 640px) 240px, (max-width: 1024px) 340px, 493px"
        className="relative z-10 object-contain object-center select-none"
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
      className={`inline-flex items-center justify-center group cursor-pointer select-none transition-transform hover:scale-[1.02] duration-200 ${className}`}
      title="AURA Boutique K.B."
    >
      {content}
    </Link>
  );
}
