import { NextRequest, NextResponse } from "next/server";
import {
  createAdminSessionPayload,
  createUserSessionPayload,
  ADMIN_COOKIE_NAME,
  ADMIN_DEFAULT_EMAIL,
} from "@/lib/admin-auth";
import { getAdminAccount, getCustomerByEmail, verifyPassword } from "@/lib/store-data";

// In-memory rate limiting na nieudane próby logowania (IP + e-mail)
interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lockedUntil: number;
}

const loginAttempts = new Map<string, AttemptRecord>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minut
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000; // okno 10 minut

const GENERIC_AUTH_ERROR = "Nieprawidłowy adres e-mail lub hasło. Spróbuj ponownie.";

function getClientIdentifier(req: NextRequest, email: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown-ip";
  return `${ip}::${email}`;
}

function checkRateLimit(key: string): { isLocked: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record) return { isLocked: false, retryAfterSeconds: 0 };

  // Sprawdź czy trwa blokada
  if (record.lockedUntil > now) {
    const remaining = Math.ceil((record.lockedUntil - now) / 1000);
    return { isLocked: true, retryAfterSeconds: remaining };
  }

  // Wyczyść stary wpis jeśli okno minęło
  if (now - record.firstAttempt > ATTEMPT_WINDOW_MS) {
    loginAttempts.delete(key);
    return { isLocked: false, retryAfterSeconds: 0 };
  }

  return { isLocked: false, retryAfterSeconds: 0 };
}

function recordFailedAttempt(key: string): { isNowLocked: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || now - record.firstAttempt > ATTEMPT_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttempt: now, lockedUntil: 0 });
    return { isNowLocked: false, retryAfterSeconds: 0 };
  }

  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    const remaining = Math.ceil(LOCKOUT_MS / 1000);
    return { isNowLocked: true, retryAfterSeconds: remaining };
  }

  return { isNowLocked: false, retryAfterSeconds: 0 };
}

function clearAttempts(key: string) {
  loginAttempts.delete(key);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body || {};

    // 1. Walidacja obecności e-maila
    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Podaj adres e-mail.", field: "email" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Walidacja formatu e-maila
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Wpisz poprawny adres e-mail (np. twoj-email@domena.pl).", field: "email" },
        { status: 400 }
      );
    }

    // 3. Walidacja hasła
    if (!password || typeof password !== "string" || !password.trim()) {
      return NextResponse.json(
        { error: "Podaj hasło dostępowe.", field: "password" },
        { status: 400 }
      );
    }

    const trimmedPassword = password.trim();
    const rateLimitKey = getClientIdentifier(req, normalizedEmail);

    // 4. Sprawdzenie blokady rate-limit
    const rateCheck = checkRateLimit(rateLimitKey);
    if (rateCheck.isLocked) {
      return NextResponse.json(
        {
          error: `Zbyt wiele nieudanych prób logowania. Odczekaj ${rateCheck.retryAfterSeconds} sekund przed kolejną próbą.`,
          retryAfter: rateCheck.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // 5. Sprawdzenie konta właścicielki (Admin)
    const adminAccount = await getAdminAccount();
    const adminEmailNormalized = (adminAccount.email || ADMIN_DEFAULT_EMAIL).trim().toLowerCase();

    if (normalizedEmail === adminEmailNormalized) {
      const isPassCorrect = adminAccount.passwordHash
        ? verifyPassword(trimmedPassword, adminAccount.passwordHash)
        : false;
      if (!isPassCorrect) {
        const lockStatus = recordFailedAttempt(rateLimitKey);
        if (lockStatus.isNowLocked) {
          return NextResponse.json(
            {
              error: `Zbyt wiele nieudanych prób logowania. Odczekaj ${lockStatus.retryAfterSeconds} sekund przed kolejną próbą.`,
              retryAfter: lockStatus.retryAfterSeconds,
            },
            { status: 429 }
          );
        }
        return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
      }

      // Udane logowanie właścicielki
      clearAttempts(rateLimitKey);
      const mustChange = Boolean(adminAccount.mustChangePassword);
      const sessionPayload = createAdminSessionPayload(adminEmailNormalized, mustChange);

      const response = NextResponse.json({
        success: true,
        isAdmin: true,
        mustChangePassword: mustChange,
        redirect: mustChange ? "/zmien-haslo" : "/admin",
        message: "Zalogowano pomyślnie.",
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

    // 6. Sprawdzenie konta klientki
    const existingCustomer = await getCustomerByEmail(normalizedEmail);

    // Nieistniejący klient lub brak hasła na koncie -> ten sam komunikat, NIGDY nie logujemy gościa
    if (!existingCustomer || !existingCustomer.passwordHash) {
      const lockStatus = recordFailedAttempt(rateLimitKey);
      if (lockStatus.isNowLocked) {
        return NextResponse.json(
          {
            error: `Zbyt wiele nieudanych prób logowania. Odczekaj ${lockStatus.retryAfterSeconds} sekund przed kolejną próbą.`,
            retryAfter: lockStatus.retryAfterSeconds,
          },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
    }

    // Weryfikacja hasła klientki
    const isCustomerPassValid = existingCustomer.passwordHash.trim() === trimmedPassword;
    if (!isCustomerPassValid) {
      const lockStatus = recordFailedAttempt(rateLimitKey);
      if (lockStatus.isNowLocked) {
        return NextResponse.json(
          {
            error: `Zbyt wiele nieudanych prób logowania. Odczekaj ${lockStatus.retryAfterSeconds} sekund przed kolejną próbą.`,
            retryAfter: lockStatus.retryAfterSeconds,
          },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
    }

    // Udane logowanie klientki
    clearAttempts(rateLimitKey);
    const customerFullName = `${existingCustomer.firstName} ${existingCustomer.lastName}`.trim();
    const sessionPayload = createUserSessionPayload(normalizedEmail, customerFullName || undefined);

    const response = NextResponse.json({
      success: true,
      isAdmin: false,
      mustChangePassword: false,
      redirect: "/konto",
      message: "Zalogowano pomyślnie.",
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
      { error: "Nie udało się połączyć. Spróbuj ponownie za chwilę." },
      { status: 500 }
    );
  }
}

