import { NextRequest, NextResponse } from "next/server";
import {
  checkAdminCredentials,
  createAdminSessionPayload,
  createUserSessionPayload,
  ADMIN_COOKIE_NAME,
  ADMIN_DEFAULT_EMAIL,
} from "@/lib/admin-auth";
import { getAdminAccount, getCustomerByEmail } from "@/lib/store-data";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Podaj prawidłowy adres e-mail." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const adminAccount = await getAdminAccount();
    const adminEmailNormalized = (adminAccount.email || ADMIN_DEFAULT_EMAIL).trim().toLowerCase();

    // 1. Sprawdzenie, czy loguje się właścicielka butiku
    if (normalizedEmail === adminEmailNormalized) {
      if (!password) {
        return NextResponse.json(
          { error: "Wprowadź hasło dostępowe do konta butiku." },
          { status: 400 }
        );
      }

      const isPassCorrect = password.trim() === adminAccount.password.trim();
      if (!isPassCorrect) {
        return NextResponse.json(
          { error: "Nieprawidłowe hasło. Wprowadź poprawne hasło dostępowe." },
          { status: 401 }
        );
      }

      const mustChange = adminAccount.mustChangePassword;
      const sessionPayload = createAdminSessionPayload(adminEmailNormalized, mustChange);

      const response = NextResponse.json({
        success: true,
        isAdmin: true,
        mustChangePassword: mustChange,
        redirect: mustChange ? "/zmien-haslo" : "/admin",
        message: mustChange
          ? "Zalogowano hasłem startowym. Wymagana jest zmiana hasła na własne."
          : "Zalogowano pomyślnie do konta właścicielki.",
      });

      response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: sessionPayload,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 dni
      });

      return response;
    }

    // 2. Logowanie klientki (zarówno zarejestrowanej jak i jednorazowej/gościa)
    const existingCustomer = await getCustomerByEmail(normalizedEmail);
    let customerFullName = "";

    if (existingCustomer) {
      customerFullName = `${existingCustomer.firstName} ${existingCustomer.lastName}`;
      // Jeśli klient ma ustawione hasło i podał hasło, weryfikujemy
      if (existingCustomer.passwordHash && password) {
        if (existingCustomer.passwordHash !== password.trim()) {
          return NextResponse.json(
            { error: "Nieprawidłowe hasło do konta klientki." },
            { status: 401 }
          );
        }
      }
    }

    const sessionPayload = createUserSessionPayload(normalizedEmail, customerFullName || undefined);
    const response = NextResponse.json({
      success: true,
      isAdmin: false,
      mustChangePassword: false,
      redirect: "/konto",
      message: "Zalogowano pomyślnie do konta klientki AURA Boutique.",
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: sessionPayload,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 dni dla klientek
    });

    return response;
  } catch (err: any) {
    console.error("Błąd api/auth/login:", err);
    return NextResponse.json(
      { error: "Wystąpił błąd serwera podczas logowania." },
      { status: 500 }
    );
  }
}

