import { NextResponse } from "next/server";
import { getStoreSettings } from "@/lib/store-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getStoreSettings();
    return NextResponse.json({
      success: true,
      announcementBarText: settings.announcementBarText || "Darmowa dostawa od 300 zł • 14 dni na zwrot",
      announcementBarLeft: settings.announcementBarLeft || "AURA Boutique • Nowa Kolekcja",
      announcementBarRight: settings.announcementBarRight || "Wysyłka w 24h • Płatność BLIK",
      heroHeadline: settings.heroHeadline || "Styl, który zachwyca",
      heroSubheadline: settings.heroSubheadline || "Ceny, które kuszą • Jakość, którą poczujesz",
      heroImageUrl: settings.heroImageUrl || "/images/hero/aura-hero-motto.png",
      heroButtonText: settings.heroButtonText || "Odkryj kolekcję",
      heroButtonLink: settings.heroButtonLink || "/katalog",
      freeShippingFrom: settings.freeShippingFrom || 300,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
