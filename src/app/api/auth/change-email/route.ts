import { NextRequest, NextResponse } from "next/server";
import { changeUnverifiedCustomerEmail } from "@/lib/customer-auth-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { oldEmail, newEmail, returnUrl } = body;

    if (!oldEmail || !newEmail) {
      return NextResponse.json(
        { error: "Podaj dotychczasowy oraz nowy adres e-mail." },
        { status: 400 }
      );
    }

    const result = await changeUnverifiedCustomerEmail(oldEmail, newEmail, returnUrl);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Adres e-mail został zaktualizowany. Wysłaliśmy nowy link potwierdzający.",
      email: newEmail.trim().toLowerCase(),
    });
  } catch (err: any) {
    console.error("Błąd zmiany niepotwierdzonego adresu e-mail:", err);
    return NextResponse.json(
      { error: err.message || "Błąd serwera." },
      { status: 500 }
    );
  }
}
