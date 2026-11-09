import { NextRequest, NextResponse } from "next/server";
import { createReturnRequest } from "@/lib/store-data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, items, returnMethod, customerNote } = body;

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
