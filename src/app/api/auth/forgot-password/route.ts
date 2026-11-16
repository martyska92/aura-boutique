import { NextRequest, NextResponse } from "next/server";
import {
  getAdminAccount,
  getCustomerByEmail,
  savePasswordResetCode,
  loadLocalStore,
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

    if (!isOwner && !customer) {
      return NextResponse.json(
        { error: "Nie znaleziono konta powiązanego z tym adresem e-mail. Sprawdź poprawność lub zarejestruj nowe konto." },
        { status: 404 }
      );
    }

    // Generujemy 6-cyfrowy kod weryfikacyjny (np. 842109)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Zapisujemy kod ważny przez 15 minut
    await savePasswordResetCode(normalizedEmail, resetCode, 15 * 60 * 1000);

    // Wysłanie kodu resetującego przez skonfigurowaną usługę e-mail (SMTP / Resend)
    try {
      const { dispatchEmail } = await import("@/lib/email-service");
      await dispatchEmail({
        to: normalizedEmail,
        subject: "Kod do zresetowania hasła w AURA Boutique",
        html: `
          <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 24px; color: #241D1B; line-height: 1.6;">
            <h2 style="font-size: 20px; font-weight: normal; margin-top: 0; color: #241D1B;">Zresetuj hasło do konta AURA</h2>
            <p style="font-size: 14px; color: #554D47;">Otrzymaliśmy prośbę o zmianę hasła do Twojego konta w butiku AURA. Twój jednorazowy kod weryfikacyjny to:</p>
            <div style="background-color: #FAF6F1; border: 1px solid #EADFD5; border-radius: 4px; padding: 16px; text-align: center; margin: 24px 0;">
              <span style="font-size: 28px; font-family: monospace; letter-spacing: 6px; font-weight: bold; color: #8F6B38;">${resetCode}</span>
            </div>
            <p style="font-size: 12px; color: #7A6458;">Kod jest ważny przez 15 minut. Jeśli to nie Ty prosiłaś o zmianę hasła, zignoruj tę wiadomość – Twoje dotychczasowe hasło pozostaje bezpieczne.</p>
          </div>
        `,
        type: "PASSWORD_RESET" as any,
      });
    } catch (mailErr) {
      console.error("Błąd wysyłki e-mail resetu:", mailErr);
    }

    const recipientName = isOwner
      ? "Właścicielka butiku"
      : `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim() || "Klientka";

    return NextResponse.json({
      success: true,
      message: `Kod weryfikacyjny został wygenerowany dla: ${normalizedEmail}.`,
      email: normalizedEmail,
      isOwner,
      recipientName,
      // Kod zwracany do formularza dla natychmiastowego ułatwienia (wygoda przy braku zewnętrznego SMTP)
      code: resetCode,
    });
  } catch (err: any) {
    console.error("Błąd generowania kodu resetu hasła:", err);
    return NextResponse.json(
      { error: err.message || "Wystąpił błąd podczas generowania kodu resetu." },
      { status: 500 }
    );
  }
}

