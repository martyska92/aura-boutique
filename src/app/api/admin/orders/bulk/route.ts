import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { bulkUpdateOrders } from "@/lib/store-data";

export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  try {
    const { orderIds, fulfillmentStatus, paymentStatus } = await req.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: "Wymagana jest lista identyfikatorów zamówień (orderIds)." },
        { status: 400 }
      );
    }

    const updated = await bulkUpdateOrders(orderIds, {
      fulfillmentStatus,
      paymentStatus,
    });

    return NextResponse.json({
      success: true,
      updatedCount: updated.length,
      orders: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const PATCH = POST;
export const PUT = POST;
