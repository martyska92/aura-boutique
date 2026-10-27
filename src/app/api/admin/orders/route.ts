import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { updateOrderAdmin, getOrderById } from "@/lib/store-data";

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

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
