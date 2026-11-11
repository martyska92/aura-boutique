import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { sendTestEmail, getEmailConfig } from "@/lib/email-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const targetEmail = body.targetEmail?.trim() || "aurazmigrod@wp.pl";

    const config = getEmailConfig();
    if (!config.isConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: "Poczta nie jest skonfigurowana. Wprowadź hasło poczty (lub klucz Resend API) i kliknij Zapisz Ustawienia Butiku.",
        },
        { status: 400 }
      );
    }

    const result = await sendTestEmail(targetEmail);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Nie udało się wysłać testowej wiadomości.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Wiadomość testowa została pomyślnie wysłana na adres ${targetEmail}!`,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Błąd wysyłki e-mail.",
      },
      { status: 500 }
    );
  }
}
