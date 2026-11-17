"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  VisualBannerConfig,
  BannerTextElement,
  BannerButtonElement,
  DeviceViewport,
} from "@/lib/types";

export interface BannerRendererProps {
  config: VisualBannerConfig;
  viewport?: DeviceViewport; // Jeśli podany (np. w edytorze), wymusza konkretne właściwości RWD
  interactive?: boolean; // Tryb edytora: zaznaczanie i przeciąganie elementów
  selectedId?: string | null;
  onSelectId?: (id: string | null) => void;
  onPointerDownElement?: (
    id: string,
    e: React.PointerEvent<HTMLDivElement>
  ) => void;
  onResizeHandlePointerDown?: (
    id: string,
    handle: "left" | "right",
    e: React.PointerEvent<HTMLDivElement>
  ) => void;
  containerClassName?: string;
  isDragging?: boolean;
}

export function getFontFamilyCss(family: string): string {
  switch (family) {
    case "playfair":
      return "'Playfair Display', Georgia, serif";
    case "cormorant":
      return "'Cormorant Garamond', Georgia, serif";
    case "montserrat":
      return "'Montserrat', -apple-system, sans-serif";
    case "inter":
      return "'Inter', -apple-system, sans-serif";
    case "script":
      return "'Great Vibes', 'Brush Script MT', cursive";
    case "sans":
      return "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    case "serif":
    default:
      return "Georgia, Cambria, 'Times New Roman', serif";
  }
}

export function BannerRenderer({
  config,
  viewport,
  interactive = false,
  selectedId,
  onSelectId,
  onPointerDownElement,
  onResizeHandlePointerDown,
  containerClassName = "",
}: BannerRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Ustalamy proporcje i styl nakładki w zależności od viewportu
  // Jeśli viewport nie jest wymuszony (strona publiczna), stosujemy responsywne klasy CSS
  const aspectClass = viewport
    ? viewport === "mobile"
      ? "aspect-[375/460]"
      : viewport === "tablet"
      ? "aspect-[768/400]"
      : "aspect-[1024/390]"
    : "aspect-[375/460] sm:aspect-[768/400] lg:aspect-[1024/390]";

  const overlayBg = config.overlay?.enabled
    ? config.overlay.gradientType === "to-bottom"
      ? `linear-gradient(to bottom, transparent 20%, ${config.overlay.color} 100%)`
      : config.overlay.gradientType === "to-top"
      ? `linear-gradient(to top, transparent 20%, ${config.overlay.color} 100%)`
      : config.overlay.gradientType === "to-right"
      ? `linear-gradient(to right, ${config.overlay.color} 0%, transparent 80%)`
      : config.overlay.gradientType === "radial"
      ? `radial-gradient(circle at 50% 50%, transparent 30%, ${config.overlay.color} 100%)`
      : config.overlay.color
    : undefined;

  // Wykrywanie aktualnego ekranu dla strony publicznej (gdy viewport nie jest wymuszony przez edytor)
  const [clientViewport, setClientViewport] = useState<DeviceViewport | null>(null);

  useEffect(() => {
    if (viewport) return;

    const updateClientViewport = () => {
      const w = window.innerWidth;
      if (w < 640) {
        setClientViewport("mobile");
      } else if (w < 1024) {
        setClientViewport("tablet");
      } else {
        setClientViewport("desktop");
      }
    };

    updateClientViewport();
    window.addEventListener("resize", updateClientViewport);
    return () => window.removeEventListener("resize", updateClientViewport);
  }, [viewport]);

  const activeViewport = viewport || clientViewport || "desktop";

  // Funkcja pobierająca responsywne właściwości elementu
  const getProps = (el: BannerTextElement | BannerButtonElement) => {
    if (activeViewport === "mobile" && el.mobile) return el.mobile;
    if (activeViewport === "tablet" && el.tablet) return el.tablet;
    return el.desktop;
  };

  // Klasy pomocnicze ukrywające element w CSS (zabezpieczenie SSR i dostępności)
  const getResponsiveHiddenClass = (el: BannerTextElement | BannerButtonElement) => {
    if (viewport) return ""; // W edytorze renderujemy bezpośrednio według aktywnego viewportu
    const dVis = el.desktop?.visible !== false;
    const tVis = el.tablet ? el.tablet.visible !== false : dVis;
    const mVis = el.mobile ? el.mobile.visible !== false : dVis;

    const classes: string[] = [];
    if (!mVis) classes.push("max-sm:!hidden");
    if (!tVis) classes.push("sm:max-lg:!hidden");
    if (!dVis) classes.push("lg:!hidden");
    return classes.join(" ");
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${aspectClass} overflow-hidden select-none bg-[#FAF6F1] ${containerClassName}`}
      onClick={(e) => {
        if (interactive && e.target === e.currentTarget && onSelectId) {
          onSelectId(null);
        }
      }}
    >
      {/* 1. Zdjęcie w tle */}
      <Image
        src={config.imageUrl || "/images/hero/aura-hero-boutique-clean.jpg"}
        alt="AURA Boutique Kolekcja"
        fill
        priority
        unoptimized={Boolean(config.imageUrl?.startsWith("data:") || config.imageUrl?.includes("?"))}
        sizes="(max-width: 768px) 100vw, 1920px"
        className="object-cover transition-all duration-300 pointer-events-none"
        style={{
          objectPosition: `${config.focalPointX ?? 50}% ${config.focalPointY ?? 50}%`,
        }}
      />

      {/* 2. Nakładka przyciemniająca / gradient */}
      {config.overlay?.enabled && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: overlayBg,
            opacity: config.overlay.opacity ?? 0.2,
          }}
        />
      )}

      {/* 3. Elementy tekstowe */}
      {config.textElements.map((textEl) => {
        const props = getProps(textEl);
        if (props.visible === false) return null;

        const isSelected = interactive && selectedId === textEl.id;

        // Cień
        const shadowCss = textEl.hasShadow
          ? `${textEl.shadowX || 0}px ${textEl.shadowY || 2}px ${
              textEl.shadowBlur || 4
            }px ${textEl.shadowColor || "rgba(0,0,0,0.5)"}`
          : "none";

        // Obrys tekstu (text-stroke)
        const strokeCss = textEl.hasStroke
          ? `${textEl.strokeWidth || 1}px ${textEl.strokeColor || "#000000"}`
          : undefined;

        // Tło
        const bgStyle = textEl.hasBackground
          ? {
              backgroundColor: textEl.backgroundColor || "#FFFFFF",
              opacity: textEl.backgroundOpacity ?? 0.85,
              padding: `${textEl.backgroundPadding || 8}px`,
              borderRadius: `${textEl.borderRadius || 8}px`,
            }
          : undefined;

        return (
          <div
            key={textEl.id}
            id={textEl.id}
            onPointerDown={(e) => {
              if (interactive && onPointerDownElement) {
                e.stopPropagation();
                onPointerDownElement(textEl.id, e);
              }
            }}
            style={{
              position: "absolute",
              left: `${props.x}%`,
              top: `${props.y}%`,
              transform: "translate(-50%, -50%)",
              width: props.width ? `${props.width}%` : "auto",
              maxWidth: "96%",
              zIndex: isSelected ? 99 : textEl.zIndex || 10,
              cursor: interactive ? "grab" : "default",
              touchAction: interactive ? "none" : "auto",
            }}
            className={`transition-shadow ${getResponsiveHiddenClass(textEl)} ${
              isSelected ? "ring-2 ring-[#C5A069] ring-offset-1 rounded-sm shadow-lg" : ""
            }`}
          >
            {/* Tło pod tekstem jeśli włączone */}
            {textEl.hasBackground && (
              <div
                className="absolute inset-0 -z-10 backdrop-blur-xs pointer-events-none"
                style={bgStyle}
              />
            )}

            <div
              style={{
                fontFamily: getFontFamilyCss(textEl.fontFamily),
                fontSize: `${props.fontSize || 24}px`,
                fontWeight: textEl.fontWeight || 500,
                fontStyle: textEl.italic ? "italic" : "normal",
                color: textEl.color || "#241D1B",
                textAlign: props.textAlign || "center",
                letterSpacing: `${textEl.letterSpacing || 0}px`,
                lineHeight: textEl.lineHeight || 1.25,
                opacity: textEl.opacity ?? 1,
                textShadow: shadowCss,
                WebkitTextStroke: strokeCss,
                wordBreak: "break-word",
                whiteSpace: "pre-line",
              }}
              className="p-1"
            >
              {textEl.text}
            </div>

            {/* Uchwyty zmiany szerokości (widoczne w trybie edycji po zaznaczeniu) */}
            {isSelected && (
              <>
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (onResizeHandlePointerDown) {
                      onResizeHandlePointerDown(textEl.id, "left", e);
                    }
                  }}
                  className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-[#C5A069] rounded-full shadow cursor-ew-resize z-50 hover:scale-125 transition-transform"
                  title="Zmień szerokość pola"
                />
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (onResizeHandlePointerDown) {
                      onResizeHandlePointerDown(textEl.id, "right", e);
                    }
                  }}
                  className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-[#C5A069] rounded-full shadow cursor-ew-resize z-50 hover:scale-125 transition-transform"
                  title="Zmień szerokość pola"
                />
              </>
            )}
          </div>
        );
      })}

      {/* 4. Element przycisku */}
      {config.buttonElement && (
        (() => {
          const btn = config.buttonElement;
          const props = getProps(btn);
          const isBtnVisible = props.visible !== undefined ? props.visible : btn.visible !== false;
          if (!isBtnVisible) return null;

          const isSelected = interactive && selectedId === btn.id;

          const btnContent = (
            <div
              style={{
                backgroundColor: btn.backgroundColor || "#9E8359",
                color: btn.textColor || "#FFFFFF",
                borderColor: btn.borderColor || btn.backgroundColor,
                borderWidth: `${btn.borderWidth || 0}px`,
                borderStyle: btn.borderWidth ? "solid" : "none",
                borderRadius: `${btn.borderRadius ?? 8}px`,
                paddingTop: `${btn.paddingY || 10}px`,
                paddingBottom: `${btn.paddingY || 10}px`,
                paddingLeft: `${btn.paddingX || 20}px`,
                paddingRight: `${btn.paddingX || 20}px`,
                fontSize: `${props.fontSize || btn.fontSize || 12}px`,
                fontWeight: btn.fontWeight || 600,
                letterSpacing: `${btn.letterSpacing || 1}px`,
                boxShadow: btn.hasShadow ? "0 4px 12px rgba(0,0,0,0.18)" : "none",
              }}
              className="inline-flex items-center gap-2 uppercase font-sans tracking-widest whitespace-nowrap active:scale-95 transition-transform cursor-pointer"
            >
              <span>{btn.text || "Odkryj kolekcję"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          );

          return (
            <div
              key={btn.id}
              id={btn.id}
              onPointerDown={(e) => {
                if (interactive && onPointerDownElement) {
                  e.stopPropagation();
                  onPointerDownElement(btn.id, e);
                }
              }}
              style={{
                position: "absolute",
                left: `${props.x}%`,
                top: `${props.y}%`,
                transform: "translate(-50%, -50%)",
                zIndex: isSelected ? 99 : btn.zIndex || 15,
                cursor: interactive ? "grab" : "pointer",
                touchAction: interactive ? "none" : "auto",
              }}
              className={`${getResponsiveHiddenClass(btn)} ${
                isSelected ? "ring-2 ring-[#C5A069] ring-offset-2 rounded-lg shadow-lg" : ""
              }`}
            >
              {interactive ? (
                <div>{btnContent}</div>
              ) : (
                <Link href={btn.link || "/katalog"}>
                  {btnContent}
                </Link>
              )}
            </div>
          );
        })()
      )}
    </div>
  );
}
