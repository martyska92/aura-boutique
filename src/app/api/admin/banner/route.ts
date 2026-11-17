import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/admin-auth";
import { getStoreSettings, updateStoreSettings } from "@/lib/store-data";
import { getDefaultBannerConfig } from "@/lib/banner-defaults";
import { VisualBannerConfig, BannerTextElement } from "@/lib/types";

// Bezpieczne oczyszczanie tekstu ze złośliwych znaczników HTML/JS
function sanitizeString(val: any): string {
  if (typeof val !== "string") return "";
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/onload=/gi, "")
    .replace(/onerror=/gi, "")
    .trim();
}

function sanitizeBannerConfig(raw: any): VisualBannerConfig {
  const fallback = getDefaultBannerConfig();
  if (!raw || typeof raw !== "object") return fallback;

  const sanitized: VisualBannerConfig = {
    imageUrl: sanitizeString(raw.imageUrl) || fallback.imageUrl,
    focalPointX: typeof raw.focalPointX === "number" ? Math.max(0, Math.min(100, raw.focalPointX)) : 50,
    focalPointY: typeof raw.focalPointY === "number" ? Math.max(0, Math.min(100, raw.focalPointY)) : 50,
    aspectRatioDesktop: sanitizeString(raw.aspectRatioDesktop) || fallback.aspectRatioDesktop,
    aspectRatioTablet: sanitizeString(raw.aspectRatioTablet) || fallback.aspectRatioTablet,
    aspectRatioMobile: sanitizeString(raw.aspectRatioMobile) || fallback.aspectRatioMobile,
    overlay: {
      enabled: Boolean(raw.overlay?.enabled),
      color: sanitizeString(raw.overlay?.color) || "#000000",
      opacity: typeof raw.overlay?.opacity === "number" ? Math.max(0, Math.min(1, raw.overlay.opacity)) : 0.2,
      gradientType: ["none", "to-bottom", "to-top", "to-right", "radial"].includes(raw.overlay?.gradientType)
        ? raw.overlay.gradientType
        : "none",
    },
    textElements: Array.isArray(raw.textElements)
      ? raw.textElements.map((el: any, idx: number): BannerTextElement => ({
          id: sanitizeString(el.id) || `text-${idx + 1}`,
          type: "text",
          label: sanitizeString(el.label) || `Napis ${idx + 1}`,
          text: sanitizeString(el.text) || "",
          fontFamily: (["serif", "sans", "playfair", "cormorant", "montserrat", "inter", "script"].includes(el.fontFamily)
            ? el.fontFamily
            : "serif") as any,
          fontWeight: typeof el.fontWeight === "number" ? el.fontWeight : 500,
          italic: Boolean(el.italic),
          color: sanitizeString(el.color) || "#241D1B",
          letterSpacing: typeof el.letterSpacing === "number" ? el.letterSpacing : 0,
          lineHeight: typeof el.lineHeight === "number" ? el.lineHeight : 1.25,
          opacity: typeof el.opacity === "number" ? Math.max(0, Math.min(1, el.opacity)) : 1,
          zIndex: typeof el.zIndex === "number" ? el.zIndex : 10 + idx,
          hasShadow: Boolean(el.hasShadow),
          shadowColor: sanitizeString(el.shadowColor) || "rgba(0,0,0,0.4)",
          shadowBlur: typeof el.shadowBlur === "number" ? el.shadowBlur : 4,
          shadowX: typeof el.shadowX === "number" ? el.shadowX : 0,
          shadowY: typeof el.shadowY === "number" ? el.shadowY : 2,
          hasStroke: Boolean(el.hasStroke),
          strokeColor: sanitizeString(el.strokeColor) || "#000000",
          strokeWidth: typeof el.strokeWidth === "number" ? el.strokeWidth : 1,
          hasBackground: Boolean(el.hasBackground),
          backgroundColor: sanitizeString(el.backgroundColor) || "#FFFFFF",
          backgroundOpacity: typeof el.backgroundOpacity === "number" ? el.backgroundOpacity : 0.85,
          backgroundPadding: typeof el.backgroundPadding === "number" ? el.backgroundPadding : 10,
          borderRadius: typeof el.borderRadius === "number" ? el.borderRadius : 8,
          desktop: {
            x: typeof el.desktop?.x === "number" ? Math.max(0, Math.min(100, el.desktop.x)) : 50,
            y: typeof el.desktop?.y === "number" ? Math.max(0, Math.min(100, el.desktop.y)) : 50,
            width: typeof el.desktop?.width === "number" ? Math.max(10, Math.min(100, el.desktop.width)) : 60,
            fontSize: typeof el.desktop?.fontSize === "number" ? el.desktop.fontSize : 24,
            textAlign: ["left", "center", "right"].includes(el.desktop?.textAlign) ? el.desktop.textAlign : "center",
            visible: el.desktop?.visible !== false,
          },
          tablet: {
            x: typeof el.tablet?.x === "number" ? Math.max(0, Math.min(100, el.tablet.x)) : 50,
            y: typeof el.tablet?.y === "number" ? Math.max(0, Math.min(100, el.tablet.y)) : 50,
            width: typeof el.tablet?.width === "number" ? Math.max(10, Math.min(100, el.tablet.width)) : 75,
            fontSize: typeof el.tablet?.fontSize === "number" ? el.tablet.fontSize : 20,
            textAlign: ["left", "center", "right"].includes(el.tablet?.textAlign) ? el.tablet.textAlign : "center",
            visible: el.tablet?.visible !== false,
          },
          mobile: {
            x: typeof el.mobile?.x === "number" ? Math.max(0, Math.min(100, el.mobile.x)) : 50,
            y: typeof el.mobile?.y === "number" ? Math.max(0, Math.min(100, el.mobile.y)) : 50,
            width: typeof el.mobile?.width === "number" ? Math.max(10, Math.min(100, el.mobile.width)) : 88,
            fontSize: typeof el.mobile?.fontSize === "number" ? el.mobile.fontSize : 16,
            textAlign: ["left", "center", "right"].includes(el.mobile?.textAlign) ? el.mobile.textAlign : "center",
            visible: el.mobile?.visible !== false,
          },
        }))
      : fallback.textElements,
    buttonElement: raw.buttonElement
      ? {
          id: sanitizeString(raw.buttonElement.id) || "btn-cta",
          type: "button",
          text: sanitizeString(raw.buttonElement.text) || "Odkryj kolekcję",
          link: sanitizeString(raw.buttonElement.link) || "/katalog",
          backgroundColor: sanitizeString(raw.buttonElement.backgroundColor) || "#9E8359",
          textColor: sanitizeString(raw.buttonElement.textColor) || "#FFFFFF",
          borderColor: sanitizeString(raw.buttonElement.borderColor) || "#8B7147",
          borderWidth: typeof raw.buttonElement.borderWidth === "number" ? raw.buttonElement.borderWidth : 1,
          borderRadius: typeof raw.buttonElement.borderRadius === "number" ? raw.buttonElement.borderRadius : 8,
          paddingY: typeof raw.buttonElement.paddingY === "number" ? raw.buttonElement.paddingY : 10,
          paddingX: typeof raw.buttonElement.paddingX === "number" ? raw.buttonElement.paddingX : 20,
          fontSize: typeof raw.buttonElement.fontSize === "number" ? raw.buttonElement.fontSize : 12,
          fontWeight: typeof raw.buttonElement.fontWeight === "number" ? raw.buttonElement.fontWeight : 600,
          letterSpacing: typeof raw.buttonElement.letterSpacing === "number" ? raw.buttonElement.letterSpacing : 1,
          hasShadow: Boolean(raw.buttonElement.hasShadow),
          visible: raw.buttonElement.visible !== false,
          zIndex: typeof raw.buttonElement.zIndex === "number" ? raw.buttonElement.zIndex : 15,
          desktop: {
            x: typeof raw.buttonElement.desktop?.x === "number" ? Math.max(0, Math.min(100, raw.buttonElement.desktop.x)) : 50,
            y: typeof raw.buttonElement.desktop?.y === "number" ? Math.max(0, Math.min(100, raw.buttonElement.desktop.y)) : 75,
            fontSize: typeof raw.buttonElement.desktop?.fontSize === "number" ? raw.buttonElement.desktop.fontSize : 12,
            textAlign: "center",
            visible: raw.buttonElement.desktop?.visible !== false,
          },
          tablet: {
            x: typeof raw.buttonElement.tablet?.x === "number" ? Math.max(0, Math.min(100, raw.buttonElement.tablet.x)) : 50,
            y: typeof raw.buttonElement.tablet?.y === "number" ? Math.max(0, Math.min(100, raw.buttonElement.tablet.y)) : 75,
            fontSize: typeof raw.buttonElement.tablet?.fontSize === "number" ? raw.buttonElement.tablet.fontSize : 12,
            textAlign: "center",
            visible: raw.buttonElement.tablet?.visible !== false,
          },
          mobile: {
            x: typeof raw.buttonElement.mobile?.x === "number" ? Math.max(0, Math.min(100, raw.buttonElement.mobile.x)) : 50,
            y: typeof raw.buttonElement.mobile?.y === "number" ? Math.max(0, Math.min(100, raw.buttonElement.mobile.y)) : 75,
            fontSize: typeof raw.buttonElement.mobile?.fontSize === "number" ? raw.buttonElement.mobile.fontSize : 11,
            textAlign: "center",
            visible: raw.buttonElement.mobile?.visible !== false,
          },
        }
      : fallback.buttonElement,
    updatedAt: new Date().toISOString(),
    publishedAt: raw.publishedAt,
  };

  return sanitized;
}

export async function GET() {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  const settings = await getStoreSettings();
  const draft = settings.visualBannerDraft || settings.visualBannerPublished || getDefaultBannerConfig();
  const published = settings.visualBannerPublished || getDefaultBannerConfig();

  return NextResponse.json({
    draft,
    published,
  });
}

export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const action = body.action as "save-draft" | "publish" | "revert";
    const settings = await getStoreSettings();

    if (action === "revert") {
      const published = settings.visualBannerPublished || getDefaultBannerConfig();
      const updatedSettings = await updateStoreSettings({
        visualBannerDraft: { ...published, updatedAt: new Date().toISOString() },
      });
      return NextResponse.json({
        success: true,
        message: "Przywrócono ostatnio opublikowaną wersję banera.",
        draft: updatedSettings.visualBannerDraft,
        published: updatedSettings.visualBannerPublished || published,
      });
    }

    if (!body.config) {
      return NextResponse.json({ error: "Brak konfiguracji banera." }, { status: 400 });
    }

    const cleanConfig = sanitizeBannerConfig(body.config);

    if (action === "publish") {
      const publishedAt = new Date().toISOString();
      cleanConfig.publishedAt = publishedAt;
      const nextVersion = (settings.bannerVersion || 1) + 1;

      const updatedSettings = await updateStoreSettings({
        visualBannerPublished: cleanConfig,
        visualBannerDraft: cleanConfig,
        bannerVersion: nextVersion,
        bannerPublishedAt: publishedAt,
      });

      // Natychmiastowe unieważnienie pamięci podręcznej strony głównej
      try {
        revalidatePath("/");
        revalidatePath("/admin/baner");
        revalidatePath("/", "layout");
      } catch (cacheErr) {
        console.warn("Ostrzeżenie: Błąd unieważniania cache:", cacheErr);
      }

      return NextResponse.json({
        success: true,
        message: `Baner został pomyślnie opublikowany na stronie głównej (wersja v${nextVersion})!`,
        version: nextVersion,
        publishedAt,
        draft: updatedSettings.visualBannerDraft,
        published: updatedSettings.visualBannerPublished,
      });
    }

    // Domyslna akcja: save-draft
    const updatedSettings = await updateStoreSettings({
      visualBannerDraft: cleanConfig,
    });
    return NextResponse.json({
      success: true,
      message: "Szkic banera został pomyślnie zapisany.",
      draft: updatedSettings.visualBannerDraft,
      published: updatedSettings.visualBannerPublished || getDefaultBannerConfig(),
    });
  } catch (err: any) {
    console.error("Błąd zapisu banera:", err);
    return NextResponse.json({ error: err.message || "Błąd serwera." }, { status: 500 });
  }
}
