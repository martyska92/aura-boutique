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
        { error: "Podaj 6-cyfrowy kod weryfikacyjny." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 4) {
      return NextResponse.json(
        { error: "Nowe hasło musi zawierać co najmniej 4 znaki." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const isValidCode = await verifyPasswordResetCode(normalizedEmail, code.trim());

    if (!isValidCode) {
      return NextResponse.json(
        { error: "Podany kod jest nieprawidłowy lub wygasł. Wygeneruj nowy kod." },
        { status: 400 }
      );
    }

    // Resetujemy hasło użytkownika
    const result = await resetUserPassword(normalizedEmail, newPassword.trim());

    return NextResponse.json({
      success: true,
      role: result.role,
      message: result.role === "ADMIN"
        ? "Hasło właścicielki butiku zostało pomyślnie zmienione! Możesz się teraz zalogować."
        : "Hasło do Twojego konta zostało pomyślnie zmienione! Możesz się teraz zalogować.",
    });
  } catch (err: any) {
    console.error("Błąd resetowania hasła:", err);
    return NextResponse.json(
      { error: err.message || "Wystąpił błąd podczas resetowania hasła." },
      { status: 500 }
    );
  }
}
