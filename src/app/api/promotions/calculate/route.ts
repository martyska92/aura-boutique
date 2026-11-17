import { NextRequest, NextResponse } from "next/server";
import { calculateOrderPromotions } from "@/lib/promotion-engine";
import { getUserSession } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cartItems, customerEmail, couponCode, shippingMethod } = body;

    if (!cartItems || !Array.isArray(cartItems)) {
      return NextResponse.json(
        { error: "Nieprawidłowe pozycje koszyka." },
        { status: 400 }
      );
    }

    const session = await getUserSession();
    const sessionEmail = session?.email ? session.email.toLowerCase() : undefined;

    const result = await calculateOrderPromotions({
      cartItems,
      customerEmail,
      couponCode,
      shippingMethod,
      sessionEmail,
      isLoggedIn: Boolean(sessionEmail),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Błąd kalkulacji promocji:", error);
    return NextResponse.json(
      { error: error?.message || "Wystąpił błąd podczas obliczania rabatów." },
      { status: 500 }
    );
  }
}
