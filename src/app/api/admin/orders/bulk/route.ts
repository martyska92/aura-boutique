import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import {
  bulkUpdateOrders,
  awardReferralRewardOnDelivered,
  revokeReferralRewardOnRefund,
} from "@/lib/store-data";
import { sendReferralRewardEmail } from "@/lib/email-service";

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

    // Przetwarzanie nagród polecających
    if (fulfillmentStatus === "DELIVERED") {
      for (const order of updated) {
        const reward = await awardReferralRewardOnDelivered(order);
        if (reward) {
          await sendReferralRewardEmail({
            customerEmail: reward.referrerEmail,
            rewardCode: reward.code,
            validUntilIso: reward.validUntil,
          });
        }
      }
    }

    if (fulfillmentStatus === "CANCELLED" || paymentStatus === "REFUNDED") {
      for (const order of updated) {
        await revokeReferralRewardOnRefund(order.id);
      }
    }

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

