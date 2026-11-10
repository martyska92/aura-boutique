import { NextResponse } from "next/server";
import { getStoreSettings } from "@/lib/store-data";

export async function GET() {
  try {
    const settings = await getStoreSettings();
    // Zwracamy publiczne ustawienia sklepu bez wrażliwych tokenów backendowych
    return NextResponse.json({
      boutiqueName: settings.boutiqueName,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      openingHours: settings.openingHours,
      announcementBarText: settings.announcementBarText,
      heroHeadline: settings.heroHeadline,
      heroSubheadline: settings.heroSubheadline,
      heroImageUrl: settings.heroImageUrl,
      freeShippingFrom: settings.freeShippingFrom,
      courierCost: settings.courierCost,
      inpostLockerCost: settings.inpostLockerCost,
      localPickupCost: settings.localPickupCost,
      companyName: settings.companyName,
      nip: settings.nip,
      regon: settings.regon,
      termsAndConditions: settings.termsAndConditions,
      privacyPolicy: settings.privacyPolicy,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Nie udało się pobrać ustawień sklepu." },
      { status: 500 }
    );
  }
}

