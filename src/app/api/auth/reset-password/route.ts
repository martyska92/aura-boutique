import { NextRequest, NextResponse } from "next/server";
import {
  verifyPasswordResetCode,
  resetUserPassword,
} from "@/lib/store-data";

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Podaj prawidłowy adres e-mail." },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { error: "Podaj 6-cyfrowy kod weryfikacyjny z otrzymanej wiadomości e-mail." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 6) {
      return NextResponse.json(
        { error: "Nowe hasło musi zawierać co najmniej 6 znaków." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const verification = await verifyPasswordResetCode(normalizedEmail, code.trim());

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || "Podany kod jest nieprawidłowy lub wygasł. Poproś o nowy kod." },
        { status: 400 }
      );
    }

    // Resetujemy hasło użytkownika
    const result = await resetUserPassword(normalizedEmail, newPassword.trim());

    // Wysłanie powiadomienia o zmianie hasła
    try {
      const { dispatchEmail } = await import("@/lib/email-service");
      await dispatchEmail({
        to: normalizedEmail,
        subject: "Twoje hasło w AURA Boutique zostało zmienione",
        html: `
          <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 24px; color: #241D1B; line-height: 1.6;">
            <h2 style="font-size: 20px; font-weight: normal; margin-top: 0; color: #241D1B;">Hasło zostało zmienione</h2>
            <p style="font-size: 14px; color: #554D47;">Informujemy, że hasło do Twojego konta w butiku AURA zostało pomyślnie zmienione w dniu ${new Date().toLocaleString("pl-PL")}.</p>
            <p style="font-size: 12px; color: #7A6458;">Jeśli to nie Ty dokonałaś tej zmiany, skontaktuj się niezwłocznie z obsługą butiku.</p>
          </div>
        `,
        type: "PASSWORD_CHANGED" as any,
      });
    } catch (notifyErr) {
      console.warn("Błąd wysyłki powiadomienia o zmianie hasła:", notifyErr);
    }

    return NextResponse.json({
      success: true,
      role: result.role,
      message: "Hasło do Twojego konta zostało pomyślnie zmienione! Możesz się teraz zalogować.",
    });
  } catch (err: any) {
    console.error("Błąd resetowania hasła:", err);
    return NextResponse.json(
      { error: err.message || "Wystąpił błąd podczas resetowania hasła." },
      { status: 500 }
    );
  }
}
