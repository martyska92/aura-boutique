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

    // Jeśli skonfigurowany jest serwis wysyłki e-maili (Resend)
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "AURA Boutique <kontakt@auraboutique.pl>",
            to: [normalizedEmail],
            subject: "Kod do zresetowania hasła w AURA Boutique",
            text: `Dzień dobry,\n\nTwój jednorazowy kod do zmiany hasła w butiku AURA to:\n\n${resetCode}\n\nKod jest ważny przez 15 minut.\nJeśli to nie Ty prosiłaś o reset hasła, zignoruj tę wiadomość.`,
          }),
        });
      } catch (mailErr) {
        console.error("Błąd wysyłki e-mail resetu:", mailErr);
      }
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

