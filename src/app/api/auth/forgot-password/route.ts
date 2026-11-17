import { NextRequest, NextResponse } from "next/server";
import {
  getAdminAccount,
  getCustomerByEmail,
  savePasswordResetCode,
} from "@/lib/store-data";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.trim() || !email.includes("@")) {
      return NextResponse.json(
        { error: "Podaj prawidłowy adres e-mail." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const adminAccount = await getAdminAccount();
    const adminEmailNormalized = (adminAccount.email || "aurazmigrod@wp.pl").trim().toLowerCase();

    const isOwner = normalizedEmail === adminEmailNormalized;
    const customer = await getCustomerByEmail(normalizedEmail);

    // Bezpieczeństwo: Jeśli konto nie istnieje, zwracamy ten sam neutralny komunikat
    // Zapobiega to enumeracji adresów e-mail zarejestrowanych klientek
    if (!isOwner && !customer) {
      return NextResponse.json({
        success: true,
        message: "Jeśli konto z podanym adresem istnieje, otrzymasz wiadomość z instrukcją resetowania hasła.",
      });
    }

    // Generujemy losowy 6-cyfrowy kod weryfikacyjny (np. 842109)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Zapisujemy kod ważny przez 15 minut z ochroną przed floodem (rate limit 60s)
    const saveRes = await savePasswordResetCode(normalizedEmail, resetCode, 15 * 60 * 1000);
    if (!saveRes.success && saveRes.rateLimited) {
      return NextResponse.json(
        { error: "Kod został niedawno wysłany. Odczekaj chwilę przed ponowną próbą." },
        { status: 429 }
      );
    }

    // Wysłanie kodu resetującego wyłącznie na adres e-mail przypisany do konta
    try {
      const { dispatchEmail } = await import("@/lib/email-service");
      await dispatchEmail({
        to: normalizedEmail,
        subject: "Twój kod do resetowania hasła w AURA Boutique",
        html: `
          <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 24px; color: #241D1B; line-height: 1.6;">
            <h2 style="font-size: 20px; font-weight: normal; margin-top: 0; color: #241D1B;">Zresetuj hasło do konta AURA</h2>
            <p style="font-size: 14px; color: #554D47;">Otrzymaliśmy prośbę o zmianę hasła do Twojego konta w butiku AURA. Twój jednorazowy kod weryfikacyjny to:</p>
            <div style="background-color: #FAF6F1; border: 1px solid #EADFD5; border-radius: 4px; padding: 16px; text-align: center; margin: 24px 0;">
              <span style="font-size: 28px; font-family: monospace; letter-spacing: 6px; font-weight: bold; color: #8F6B38;">${resetCode}</span>
            </div>
            <p style="font-size: 12px; color: #7A6458;">Kod jest ważny przez 15 minut i może być użyty tylko raz. Jeśli to nie Ty prosiłaś o zmianę hasła, zignoruj tę wiadomość – Twoje dotychczasowe hasło pozostaje bezpieczne.</p>
          </div>
        `,
        type: "PASSWORD_RESET" as any,
      });
    } catch (mailErr) {
      console.error("Błąd wysyłki e-mail resetu hasła:", mailErr);
    }

    // BEZPIECZEŃSTWO: Nigdy nie zwracamy kodu w odpowiedzi API, logach ani stanie!
    return NextResponse.json({
      success: true,
      message: "Jeśli konto z podanym adresem istnieje, otrzymasz wiadomość z instrukcją resetowania hasła.",
    });
  } catch (err: any) {
    console.error("Błąd procedury resetu hasła:", err);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas generowania kodu resetu." },
      { status: 500 }
    );
  }
}
