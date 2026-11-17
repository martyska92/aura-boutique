import { NextRequest, NextResponse } from "next/server";
import { verifyCustomerEmailByToken } from "@/lib/customer-auth-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Brak tokenu weryfikacyjnego." },
        { status: 400 }
      );
    }

    const result = await verifyCustomerEmailByToken(token);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Adres e-mail został pomyślnie potwierdzony! Twój rabat −15% jest już dostępny.",
      welcomeCoupon: result.welcomeCoupon,
      alreadyVerified: result.alreadyVerified || false,
    });
  } catch (err: any) {
    console.error("Błąd weryfikacji adresu e-mail:", err);
    return NextResponse.json(
      { error: err.message || "Wystąpił błąd podczas weryfikacji adresu e-mail." },
      { status: 500 }
    );
  }
}
