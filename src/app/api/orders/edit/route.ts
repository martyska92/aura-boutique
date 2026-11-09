import { NextRequest, NextResponse } from "next/server";
import { editOrderCustomer } from "@/lib/store-data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, items } = body;

    if (!orderId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane żądania edycji." },
        { status: 400 }
      );
    }

    const updatedOrder = await editOrderCustomer(orderId, items);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: "Twoje zamówienie zostało pomyślnie zaktualizowane!",
    });
  } catch (error: any) {
    console.error("Błąd edycji zamówienia przez klientkę:", error);
    return NextResponse.json(
      { error: error?.message || "Nie udało się zaktualizować zamówienia." },
      { status: 400 }
    );
  }
}
