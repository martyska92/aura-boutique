import { NextRequest, NextResponse } from "next/server";
import { createReturnRequest, getOrderById } from "@/lib/store-data";
import { verifyAdminSession, getUserSession } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, items, returnMethod, customerNote, accessKey } = body;

    if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Wybierz przynajmniej jeden produkt do zwrotu." },
        { status: 400 }
      );
    }

    if (!returnMethod) {
      return NextResponse.json(
        { error: "Wybierz sposób zwrotu." },
        { status: 400 }
      );
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: "Nie znaleziono wskazanego zamówienia." },
        { status: 404 }
      );
    }

    // Weryfikacja uprawnień klienta do złożenia zwrotu
    let isAuthorized = false;
    const providedKey = accessKey || req.headers.get("x-order-access-key") || req.nextUrl.searchParams.get("key");
    if (providedKey && order.accessKey && providedKey === order.accessKey) {
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
        { error: "Brak uprawnień do zgłoszenia zwrotu dla tego zamówienia." },
        { status: 403 }
      );
    }

    const returnRequest = await createReturnRequest(orderId, {
      items,
      returnMethod,
      customerNote,
    });

    return NextResponse.json({
      success: true,
      returnRequest,
      message: "Zgłoszenie zwrotu zostało przyjęte!",
    });
  } catch (error: any) {
    console.error("Błąd tworzenia zgłoszenia zwrotu:", error);
    return NextResponse.json(
      { error: error?.message || "Nie udało się zgłosić zwrotu." },
      { status: 400 }
    );
  }
}
