import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import {
  updateOrderAdmin,
  getOrderById,
  getAllOrders,
  awardReferralRewardOnDelivered,
  revokeReferralRewardOnRefund,
} from "@/lib/store-data";
import { sendReferralRewardEmail } from "@/lib/email-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji właścicielki." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || searchParams.get("orderId");

    if (id) {
      const order = await getOrderById(id);
      if (!order) {
        return NextResponse.json({ error: `Nie znaleziono zamówienia o ID: ${id}` }, { status: 404 });
      }
      return NextResponse.json({ success: true, order });
    }

    const orders = await getAllOrders();
    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    console.error("Błąd pobierania zamówień w API:", err);
    return NextResponse.json({ error: err.message || "Błąd serwera." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji właścicielki." }, { status: 401 });
  }

  try {
    const { orderId, fulfillmentStatus, paymentStatus, trackingNumber, adminNotes } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Wymagane ID zamówienia (orderId)." }, { status: 400 });
    }

    const updated = await updateOrderAdmin(orderId, {
      fulfillmentStatus,
      paymentStatus,
      trackingNumber,
      adminNotes,
    });

    // 1. Jeśli zamówienie zostało oznaczone jako DELIVERED (zrealizowane) -> przyznaj nagrodę 15% polecającej
    if (fulfillmentStatus === "DELIVERED") {
      const reward = await awardReferralRewardOnDelivered(updated);
      if (reward) {
        await sendReferralRewardEmail({
          customerEmail: reward.referrerEmail,
          rewardCode: reward.code,
          validUntilIso: reward.validUntil,
        });
      }
    }

    // 2. Jeśli zamówienie zostało anulowane lub zwrócone -> unieważnij nagrodę
    if (fulfillmentStatus === "CANCELLED" || paymentStatus === "REFUNDED") {
      await revokeReferralRewardOnRefund(orderId);
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    console.error("Błąd aktualizacji statusu zamówienia w API:", err);
    return NextResponse.json({ error: err.message || "Błąd zapisu statusu w bazie." }, { status: 500 });
  }
}

export const PUT = PATCH;
