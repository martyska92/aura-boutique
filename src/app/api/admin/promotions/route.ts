import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import {
  getAllPromotions,
  savePromotion,
  deletePromotion,
  getAllIndividualDiscounts,
  getAllReferralParticipants,
  getAllReferralRewardCodes,
  getAllProductReviews,
  getPromotionAuditLogs,
  getStoreSettings,
  getCategories,
  getProducts,
} from "@/lib/store-data";

export async function GET() {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  try {
    const [
      promotions,
      individualDiscounts,
      referralParticipants,
      referralRewardCodes,
      productReviews,
      auditLogs,
      settings,
      categories,
      products,
    ] = await Promise.all([
      getAllPromotions(),
      getAllIndividualDiscounts(),
      getAllReferralParticipants(),
      getAllReferralRewardCodes(),
      getAllProductReviews(),
      getPromotionAuditLogs(),
      getStoreSettings(),
      getCategories(),
      getProducts({ includeArchived: true }),
    ]);

    return NextResponse.json({
      promotions,
      individualDiscounts,
      referralParticipants,
      referralRewardCodes,
      productReviews,
      auditLogs,
      settings,
      categories,
      products,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  try {
    const promoData = await req.json();
    const saved = await savePromotion(promoData);
    return NextResponse.json({ success: true, promotion: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Wymagane ID promocji." }, { status: 400 });
    }

    const success = await deletePromotion(id);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
