import { NextRequest, NextResponse } from "next/server";
import { getCustomerByEmail } from "@/lib/store-data";
import { createUserSessionPayload, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { createPendingCustomerRegistration, sanitizeReturnUrl } from "@/lib/customer-auth-service";
import { subscribeToNewsletter } from "@/lib/newsletter-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, password, newsletterConsent, returnUrl } = body;

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

    const safeReturn = sanitizeReturnUrl(returnUrl);

    // 1. Utworzenie niezweryfikowanego konta i wysyłka maila z linkiem weryfikacyjnym
    const regResult = await createPendingCustomerRegistration({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: phone?.trim(),
      password: password.trim(),
      returnUrl: safeReturn,
    });

    // 2. Jeśli zaznaczono dobrowolny checkbox newslettera -> rejestrujemy zapis Double Opt-In
    // Brak zgody NIE wpływa na konto ani rabat powitalny
    if (newsletterConsent === true) {
      try {
        await subscribeToNewsletter({
          email: normalizedEmail,
          source: "REGISTER",
          customerId: regResult.customer.id,
        });
      } catch (newsErr) {
        console.warn("Błąd zapisu newslettera przy rejestracji:", newsErr);
      }
    }

    const fullName = `${regResult.customer.firstName} ${regResult.customer.lastName}`;
    const sessionPayload = createUserSessionPayload(normalizedEmail, fullName);

    const response = NextResponse.json({
      success: true,
      needsVerification: true,
      email: normalizedEmail,
      emailSent: regResult.emailSent,
      emailError: regResult.emailError,
      returnUrl: safeReturn,
      message: "Konto zostało utworzone. Aby odebrać rabat −15%, potwierdź swój adres e-mail.",
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
