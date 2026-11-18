import { NextRequest, NextResponse } from "next/server";
import {
  verifyPasswordResetCode,
  resetUserPassword,
} from "@/lib/store-data";

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword, confirmPassword } = await req.json();

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

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Nowe hasło musi zawierać co najmniej 8 znaków dla zapewnienia bezpieczeństwa." },
        { status: 400 }
      );
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Wprowadzone hasła nie są identyczne." },
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

    // Resetujemy hasło użytkownika (bez przycinania)
    const result = await resetUserPassword(normalizedEmail, newPassword);

    // Wysłanie powiadomienia o zmianie hasła
    try {
      const { dispatchEmail, wrapBoutiqueEmailTemplate } = await import("@/lib/email-service");
      const content = `
        <h2 style="font-family: Georgia, serif; font-size: 20px; font-weight: normal; margin-top: 0; color: #241D1B;">Hasło zostało zmienione</h2>
        <p style="font-size: 14px; color: #554D47;">Informujemy, że hasło do Twojego konta w butiku AURA zostało pomyślnie zmienione w dniu ${new Date().toLocaleString("pl-PL")}.</p>
        <p style="font-size: 12px; color: #7A6458;">Jeśli to nie Ty dokonałaś tej zmiany, skontaktuj się niezwłocznie z obsługą butiku.</p>
      `;
      const html = wrapBoutiqueEmailTemplate("Twoje hasło w AURA zostało zmienione", content);
      await dispatchEmail({
        to: normalizedEmail,
        subject: "Twoje hasło w AURA Boutique zostało zmienione",
        html,
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
