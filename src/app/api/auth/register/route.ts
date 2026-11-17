import { NextRequest, NextResponse } from "next/server";
import { createCustomerAccount, getCustomerByEmail, updateCustomerWelcomeEmailStatus } from "@/lib/store-data";
import { createUserSessionPayload, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { sendWelcomeCustomerEmail } from "@/lib/email-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, password } = body;

    if (!firstName || !firstName.trim()) {
      return NextResponse.json({ error: "Podaj swoje imię." }, { status: 400 });
    }

    if (!lastName || !lastName.trim()) {
      return NextResponse.json({ error: "Podaj swoje nazwisko." }, { status: 400 });
    }

    if (!email || !email.trim() || !email.includes("@")) {
      return NextResponse.json({ error: "Podaj prawidłowy adres e-mail." }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Hasło musi mieć co najmniej 6 znaków." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Sprawdzenie, czy nie próbuje zarejestrować adresu właścicielki
    if (normalizedEmail === "aurazmigrod@wp.pl") {
      return NextResponse.json(
        { error: "Ten adres e-mail jest zastrzeżony dla właścicielki butiku. Użyj formularza logowania." },
        { status: 400 }
      );
    }

    // Sprawdzenie czy zarejestrowane konto z hasłem już istnieje
    const existing = await getCustomerByEmail(normalizedEmail);
    if (existing && existing.passwordHash) {
      return NextResponse.json(
        { error: "Konto z tym adresem e-mail już istnieje. Przejdź do logowania." },
        { status: 400 }
      );
    }

    // 1. Zapis konta klientki w bazie – ODDZIELONY OD WYSYŁKI MAILA
    const newCustomer = await createCustomerAccount({
      email: normalizedEmail,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone?.trim(),
      password: password.trim(),
    });

    // 2. Oddzielna próba wysyłki maila powitalnego
    // Błąd wysyłki NIE może usuwać konta ani blokować pomyślnej rejestracji klientki
    let emailStatus: "SENT" | "FAILED" | "NOT_CONFIGURED" = "NOT_CONFIGURED";
    let emailError: string | undefined = undefined;

    try {
      const emailRes = await sendWelcomeCustomerEmail({
        customerEmail: normalizedEmail,
        firstName: newCustomer.firstName,
        welcomeDiscountCode: newCustomer.welcomeDiscountCode,
      });

      if (emailRes.success) {
        emailStatus = "SENT";
      } else if (emailRes.notConfigured) {
        emailStatus = "NOT_CONFIGURED";
        emailError = emailRes.error;
      } else {
        emailStatus = "FAILED";
        emailError = emailRes.error;
      }
    } catch (mailErr: any) {
      emailStatus = "FAILED";
      emailError = mailErr?.message || "Błąd wysyłki e-mail";
      console.warn("Ostrzeżenie: wysyłka automatycznego maila powitalnego nie powiodła się:", emailError);
    }

    // 3. Aktualizacja rzeczywistego statusu powitalnego e-maila w rekordzie klientki
    try {
      await updateCustomerWelcomeEmailStatus(newCustomer.id, emailStatus, emailError);
    } catch (e) {
      // Ignorujemy błędy aktualizacji statusu
    }

    const fullName = `${newCustomer.firstName} ${newCustomer.lastName}`;
    const sessionPayload = createUserSessionPayload(normalizedEmail, fullName);

    const response = NextResponse.json({
      success: true,
      message: "Konto zostało pomyślnie utworzone! Witamy w AURA Boutique.",
      welcomeCoupon: newCustomer.welcomeDiscountCode,
      welcomeEmail: {
        sent: emailStatus === "SENT",
        status: emailStatus,
        error: emailError,
      },
      redirect: "/konto",
    });

    // Ustawienie ciasteczka sesji
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: sessionPayload,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 dni
    });

    return response;
  } catch (err: any) {
    console.error("Błąd rejestracji klienta:", err);
    return NextResponse.json(
      { error: err.message || "Wystąpił błąd podczas rejestracji." },
      { status: 500 }
    );
  }
}

