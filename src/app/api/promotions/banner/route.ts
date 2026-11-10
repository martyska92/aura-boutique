import { NextResponse } from "next/server";
import { getAllPromotions, getStoreSettings } from "@/lib/store-data";
import { isWeekendWarsaw, isDateWithinRange } from "@/lib/date-utils";

export async function GET() {
  try {
    const promotions = await getAllPromotions();
    const settings = await getStoreSettings();
    const isWeekend = isWeekendWarsaw();

    const activeBanners = promotions
      .filter((p) => {
        if (!p.isActive || !p.bannerEnabled || !p.bannerText) return false;
        if (!isDateWithinRange(new Date(), p.startDate, p.endDate, p.noEndDate)) return false;
        if (p.type === "CATEGORY_WEEKEND" && !isWeekend) return false;
        return true;
      })
      .map((p) => ({
        id: p.id,
        type: p.type,
        text: p.bannerText,
        buttonText: p.bannerButtonText,
        buttonUrl: p.bannerButtonUrl,
      }));

    return NextResponse.json({
      banners: activeBanners,
      announcementBarText: settings.announcementBarText,
      freeShippingFrom: settings.freeShippingFrom,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

