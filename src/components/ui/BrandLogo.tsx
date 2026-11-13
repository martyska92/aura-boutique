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
  withAura = false,
  variant = "default",
}: BrandLogoProps) {
  const heightClasses = {
    sm: "h-8 sm:h-10",
    md: "h-11 sm:h-18 lg:h-20",
    lg: "h-18 sm:h-24",
    xl: "h-22 sm:h-32 lg:h-40",
  };

  const content = (
    <div className={`relative ${heightClasses[size]} max-w-full aspect-[983/374] shrink-0 flex items-center justify-center`}>
      {/* Czysty, elegancki logotyp AURA BOUTIQUE bez złotej poświaty */}
      <Image
        src="/images/brand/aura-logo.png"
        alt="AURA Boutique"
        fill
        priority
        sizes="(max-width: 640px) 240px, (max-width: 1024px) 340px, 420px"
        className="relative z-10 object-contain object-center transition-all duration-300"
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
      className={`inline-flex items-center justify-center group cursor-pointer select-none transition-transform hover:scale-[1.02] duration-300 ${className}`}
      title="AURA Boutique K.B."
    >
      {content}
    </Link>
  );
}
