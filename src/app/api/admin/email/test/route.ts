import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { sendTestEmail, sendWelcomeCustomerEmail, getEmailConfig } from "@/lib/email-service";
import { loadLocalStore, saveLocalStore } from "@/lib/store-data";

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
    const customSettings = body.settings;

    // Jeśli przekazano ustawienia bezpośrednio z formularza testowego, zapiszmy je do magazynu,
    // aby użytkowniczka nie musiała ręcznie klikać "Zapisz" przed wykonaniem testu
    if (customSettings && (customSettings.smtpPassword || customSettings.resendApiKey || customSettings.smtpHost)) {
      const store = loadLocalStore();
      store.settings = {
        ...(store.settings || {}),
        ...customSettings,
      };
      saveLocalStore(store);
    }

    const config = getEmailConfig(customSettings);
    if (!config.isConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: config.emailProvider === "smtp"
            ? "Poczta SMTP nie jest jeszcze w pełni skonfigurowana. Upewnij się, że wpisano hasło do skrzynki pocztowej."
            : "Brak klucza Resend API. Wprowadź klucz Resend API w panelu.",
        },
        { status: 400 }
      );
    }

    let result;
    if (body.type === "WELCOME_CUSTOMER") {
      result = await sendWelcomeCustomerEmail(
        {
          customerEmail: targetEmail,
          firstName: body.firstName || "Martyna",
        },
        customSettings
      );
    } else {
      result = await sendTestEmail(targetEmail, customSettings);
    }

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
      message: `Wiadomość została pomyślnie wysłana na adres ${targetEmail}!`,
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
