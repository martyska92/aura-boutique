import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import {
  updateOrderAdmin,
  getOrderById,
  awardReferralRewardOnDelivered,
  revokeReferralRewardOnRefund,
} from "@/lib/store-data";
import { sendReferralRewardEmail } from "@/lib/email-service";

export async function PATCH(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  try {
    const { orderId, fulfillmentStatus, paymentStatus, trackingNumber, adminNotes } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Wymagane ID zamówienia." }, { status: 400 });
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const PUT = PATCH;
