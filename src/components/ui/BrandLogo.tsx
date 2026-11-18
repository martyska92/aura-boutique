import Link from "next/link";
import Image from "next/image";
import React from "react";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "header";
  isLink?: boolean;
  withAura?: boolean;
  variant?: "default" | "cashmere" | string;
}

export function BrandLogo({
  className = "",
  size = "md",
  isLink = true,
}: BrandLogoProps) {
  // Rozmiary logo:
  // Na komputerze około 220px szerokości, na telefonie około 150px szerokości przy zachowaniu proporcji (493/177)
  const sizeClasses = {
    sm: "w-[115px] sm:w-[135px]",
    header: "w-[115px] sm:w-[140px] lg:w-[220px]",
    md: "w-[140px] lg:w-[220px]",
    lg: "w-[180px] sm:w-[240px]",
    xl: "w-[220px] sm:w-[300px]",
  };

  const content = (
    <div
      className={`relative ${sizeClasses[size] || sizeClasses.md} aspect-[493/177] shrink-0 flex items-center justify-center`}
      style={{ filter: "none", opacity: 1 }}
    >
      {/* Subtelne przyciemnienie taupe z łagodnym radialnym przejściem bez widocznych krawędzi prostokąta dla idealnego kontrastu na beżowym tle */}
      <div
        className="absolute -inset-x-6 -inset-y-3 pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(64, 48, 38, 0.20) 0%, rgba(64, 48, 38, 0.08) 45%, rgba(64, 48, 38, 0) 75%)",
        }}
        aria-hidden="true"
      />
      <Image
        src="/images/brand/aura-logo.svg"
        alt="AURA Boutique"
        width={493}
        height={177}
        priority
        unoptimized
        className="w-full h-auto object-contain object-center select-none relative z-10"
        style={{ filter: "none", opacity: 1 }}
      />
    </div>
  );

  if (!isLink) {
    return (
      <div
        className={`inline-flex items-center justify-center select-none ${className}`}
        style={{ filter: "none", opacity: 1 }}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href="/"
      className={`inline-flex items-center justify-center group cursor-pointer select-none transition-transform hover:scale-[1.02] duration-200 ${className}`}
      title="AURA Boutique"
      style={{ filter: "none", opacity: 1 }}
    >
      {content}
    </Link>
  );
}
