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
        cooldownSeconds: 60,
      });
    }

    // Generujemy losowy 6-cyfrowy kod weryfikacyjny (np. 842109)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Zapisujemy kod ważny przez 15 minut z ochroną przed floodem (rate limit 60s)
    // Kod zapisywany jest wyłącznie w postaci bezpiecznego skrótu kryptograficznego
    const saveRes = await savePasswordResetCode(normalizedEmail, resetCode, 15 * 60 * 1000);
    if (!saveRes.success && saveRes.rateLimited) {
      return NextResponse.json(
        {
          error: `Kod został niedawno wysłany. Odczekaj ${saveRes.retryAfterSeconds || 60} sekund przed ponowną próbą.`,
          rateLimited: true,
          retryAfterSeconds: saveRes.retryAfterSeconds || 60,
        },
        { status: 429 }
      );
    }

    // Wysłanie kodu resetującego przez wspólny moduł dispatchEmail (używający getResolvedEmailConfig)
    let sendResult: any = { success: false };
    try {
      const { dispatchEmail, wrapBoutiqueEmailTemplate } = await import("@/lib/email-service");
      const content = `
        <h2 style="font-family: Georgia, serif; font-size: 20px; font-weight: normal; margin-top: 0; color: #241D1B;">Zresetuj hasło do konta AURA</h2>
        <p style="font-size: 14px; color: #554D47;">Otrzymaliśmy prośbę o zmianę hasła do Twojego konta w butiku AURA. Twój jednorazowy kod weryfikacyjny to:</p>
        <div style="background-color: #FAF6F1; border: 1px solid #DFCA9B; border-radius: 4px; padding: 18px; text-align: center; margin: 24px 0;">
          <span style="font-size: 30px; font-family: monospace; letter-spacing: 6px; font-weight: bold; color: #8F6B38;">${resetCode}</span>
        </div>
        <p style="font-size: 12px; color: #7A6458;">Kod jest ważny przez 15 minut i może być użyty tylko raz. Jeśli to nie Ty prosiłaś o zmianę hasła, zignoruj tę wiadomość – Twoje dotychczasowe hasło pozostaje bezpieczne.</p>
      `;
      const html = wrapBoutiqueEmailTemplate("Twój kod do resetowania hasła | AURA Boutique", content);
      sendResult = await dispatchEmail({
        to: normalizedEmail,
        subject: "Twój kod do resetowania hasła | AURA Boutique",
        html,
        type: "PASSWORD_RESET",
      });

      if (!sendResult.success) {
        console.error(
          `[PASSWORD_RESET_SEND_FAILED] Attempt: ${sendResult.attemptId} | Version: ${sendResult.configVersion} | To: ${normalizedEmail} | Error: ${sendResult.error}`
        );
      } else {
        console.log(
          `[PASSWORD_RESET_SEND_SUCCESS] Attempt: ${sendResult.attemptId} | Version: ${sendResult.configVersion} | To: ${normalizedEmail} | SMTP: ${sendResult.smtpResponse}`
        );
      }
    } catch (mailErr) {
      console.error("Błąd wysyłki e-mail resetu hasła:", mailErr);
    }

    // BEZPIECZEŃSTWO: Zwracamy neutralny komunikat publiczny, nie ujawniając istnienia konta ani sekretów
    return NextResponse.json({
      success: true,
      message: "Jeśli konto z podanym adresem istnieje, otrzymasz wiadomość z instrukcją resetowania hasła.",
      cooldownSeconds: 60,
      attemptId: sendResult?.attemptId,
    });
  } catch (err: any) {
    console.error("Błąd procedury resetu hasła:", err);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas generowania kodu resetu." },
      { status: 500 }
    );
  }
}
