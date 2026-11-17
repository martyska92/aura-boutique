import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { createOrder, getStoreSettings } from "@/lib/store-data";
import { registerPayUTransaction } from "@/lib/payment-service";

export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji administratora." }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount) || 129.0;
    const shippingMethod = body.shippingMethod || "INPOST_LOCKER";
    const shippingCost = shippingMethod === "LOCAL_PICKUP" ? 0.0 : 13.0;
    const totalAmount = Number((amount + shippingCost).toFixed(2));

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;

    // Tworzymy zamówienie testowe z flagą isTest: true
    const order = await createOrder({
      isTest: true,
      customerFirstName: body.firstName || "Testerka",
      customerLastName: body.lastName || "Sandbox",
      customerEmail: body.email || "testerka@auraboutique.pl",
      customerPhone: "500123456",
      shippingMethod,
      parcelLockerCode: shippingMethod === "INPOST_LOCKER" ? "WRO01M" : undefined,
      paymentMethod: "PAYU",
      paymentStatus: "PENDING",
      fulfillmentStatus: "NEW",
      subtotalAmount: amount,
      shippingCost,
      totalAmount,
      couponCode: body.couponCode || undefined,
      customerNotes: "Płatność testowa PayU Sandbox — bez obciążania rzeczywistych środków.",
      items: [
        {
          id: `item-test-${Date.now()}`,
          orderId: "",
          productNameSnapshot: body.productName || "Jedwabna Bluzka AURA (Próba Sandbox)",
          variantSnapshot: "Rozmiar S / Kolor Beżowy",
          unitPriceSnapshot: amount,
          quantity: 1,
          totalSnapshot: amount,
        },
      ],
    });

    const settings = await getStoreSettings();
    const returnUrl = `${origin}/zamowienie/${order.id}/potwierdzenie?key=${order.accessKey || ""}&check=1`;
    const notifyUrl = `${origin}/api/payments/payu/notify`;

    const payuRes = await registerPayUTransaction({
      order,
      returnUrl,
      notifyUrl,
      customSettings: settings,
    });

    if (!payuRes.success || !payuRes.paymentUrl) {
      return NextResponse.json(
        {
          success: false,
          error: payuRes.error || "Błąd rejestracji testowej transakcji w PayU Sandbox.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentUrl: payuRes.paymentUrl,
      totalAmount,
    });
  } catch (err: any) {
    console.error("Błąd tworzenia zamówienia testowego:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
