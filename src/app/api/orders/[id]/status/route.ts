import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/store-data";
import { verifyAdminSession, getUserSession } from "@/lib/admin-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: "Nie znaleziono zamówienia." }, { status: 404 });
    }

    const searchParams = req.nextUrl.searchParams;
    const accessKey = searchParams.get("key") || searchParams.get("accessKey") || req.headers.get("x-order-access-key");

    // Weryfikacja uprawnień:
    // 1. Poprawny klucz dostępu (accessKey wygenerowany przy zamówieniu)
    // 2. Sesja administratora
    // 3. Zalogowana klientka będąca właścicielką adresu e-mail zamówienia
    let isAuthorized = false;
    if (accessKey && order.accessKey && accessKey === order.accessKey) {
      isAuthorized = true;
    } else if (await verifyAdminSession()) {
      isAuthorized = true;
    } else {
      const session = await getUserSession();
      if (
        session &&
        session.email &&
        order.customerEmail &&
        session.email.toLowerCase() === order.customerEmail.toLowerCase()
      ) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Brak uprawnień do odczytu szczegółów tego zamówienia." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      id: order.id,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      isPaid: order.paymentStatus === "PAID",
      canReturn: order.paymentStatus === "PAID",
      totalAmount: order.totalAmount,
      shippingMethod: order.shippingMethod,
      trackingNumber: order.trackingNumber,
      updatedAt: order.updatedAt,
    });
  } catch (err: any) {
    console.error("Błąd odczytu statusu zamówienia:", err);
    return NextResponse.json(
      { error: "Błąd serwera podczas odczytu statusu." },
      { status: 500 }
    );
  }
}
