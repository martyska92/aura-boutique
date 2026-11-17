import { NextRequest, NextResponse } from "next/server";
import { resendAccountVerificationEmail } from "@/lib/customer-auth-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, returnUrl } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Podaj adres e-mail do ponowienia wysyłki." },
        { status: 400 }
      );
    }

    const result = await resendAccountVerificationEmail(email.trim(), returnUrl);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          cooldownSeconds: result.cooldownSeconds,
          attemptsLeft: result.attemptsLeft,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Wiadomość z linkiem potwierdzającym została ponownie wysłana.",
      cooldownSeconds: result.cooldownSeconds,
      attemptsLeft: result.attemptsLeft,
    });
  } catch (err: any) {
    console.error("Błąd ponowienia wysyłki weryfikacji:", err);
    return NextResponse.json(
      { error: err.message || "Błąd serwera." },
      { status: 500 }
    );
  }
}
