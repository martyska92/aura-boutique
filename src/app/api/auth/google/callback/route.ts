import { NextRequest, NextResponse } from "next/server";
import { prisma, isNeonConfigured } from "@/lib/prisma";
import {
  getCustomerByEmail,
  loadLocalStore,
  saveLocalStore,
  generateUniqueReferralCode,
  getCustomers,
} from "@/lib/store-data";
import { createUserSessionPayload, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { sanitizeReturnUrl } from "@/lib/customer-auth-service";
import { CustomerAccount } from "@/lib/types";
import { sendWelcomeCustomerEmail } from "@/lib/email-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  if (error || !code || !state) {
    const errorMsg = error === "access_denied" ? "Logowanie przez Google zostało anulowane." : "Wystąpił błąd podczas logowania przez Google.";
    return NextResponse.redirect(`${origin}/logowanie?error=${encodeURIComponent(errorMsg)}`);
  }

  // Weryfikacja stanu CSRF
  let stateData: { csrf: string; returnUrl: string } | null = null;
  try {
    const jsonStr = Buffer.from(state, "base64url").toString("utf-8");
    stateData = JSON.parse(jsonStr);
  } catch {
    return NextResponse.redirect(`${origin}/logowanie?error=${encodeURIComponent("Nieprawidłowy parametr stanu OAuth.")}`);
  }

  const storedCsrf = req.cookies.get("aura_google_oauth_state")?.value;
  if (!stateData || !storedCsrf || storedCsrf !== stateData.csrf) {
    return NextResponse.redirect(`${origin}/logowanie?error=${encodeURIComponent("Błąd weryfikacji sesji (CSRF). Spróbuj ponownie.")}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${origin}/api/auth/google/callback`;

  // Wymiana kodu na token w Google
  let tokenData: any = null;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId || "",
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || "Błąd wymiany tokenu w Google.");
    }
  } catch (err: any) {
    console.error("Google token error:", err);
    return NextResponse.redirect(`${origin}/logowanie?error=${encodeURIComponent("Nie udało się uzyskać autoryzacji Google.")}`);
  }

  // Pobranie profilu z Google
  let googleUser: any = null;
  try {
    const userinfoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    googleUser = await userinfoRes.json();
    if (!userinfoRes.ok || !googleUser.sub || !googleUser.email) {
      throw new Error("Nie udało się pobrać profilu Google.");
    }
  } catch (err: any) {
    console.error("Google userinfo error:", err);
    return NextResponse.redirect(`${origin}/logowanie?error=${encodeURIComponent("Błąd pobierania danych konta z Google.")}`);
  }

  const googleSub = googleUser.sub;
  const normalizedEmail = googleUser.email.trim().toLowerCase();
  const firstName = googleUser.given_name || "Klientka";
  const lastName = googleUser.family_name || "AURA";
  const emailVerifiedByGoogle = Boolean(googleUser.email_verified);
  const safeReturn = sanitizeReturnUrl(stateData?.returnUrl);

  // 1. Sprawdzenie, czy istnieje klientka powiązana po unikalnym googleSub
  let customer: CustomerAccount | null = null;

  if (isNeonConfigured()) {
    try {
      const dbCust = await prisma.customerAccount.findFirst({
        where: { googleId: googleSub },
      });
      if (dbCust) {
        customer = {
          id: dbCust.id,
          email: dbCust.email,
          firstName: dbCust.firstName,
          lastName: dbCust.lastName,
          phone: dbCust.phone || "",
          googleId: dbCust.googleId || undefined,
          emailVerified: dbCust.emailVerified,
          welcomeDiscountCode: dbCust.welcomeDiscountCode || undefined,
          welcomeDiscountUsed: dbCust.welcomeDiscountUsed,
          referralCode: dbCust.referralCode || "",
          createdAt: dbCust.createdAt.toISOString(),
        };
      }
    } catch (e) {
      console.warn("Błąd wyszukiwania googleId w Neon:", e);
    }
  }

  if (!customer) {
    const store = loadLocalStore();
    customer = (store.customers || []).find((c) => c.googleId === googleSub) || null;
  }

  // 2. Jeśli nie ma powiązania po googleId, sprawdzamy po adresie e-mail
  if (!customer) {
    const existingByEmail = await getCustomerByEmail(normalizedEmail);

    if (existingByEmail) {
      // Jeśli konto ma już hasło, wymagamy bezpiecznego uwierzytelnienia (Reguła 5)
      // Nie łączymy automatycznie tylko na podstawie zbieżności adresu
      if (existingByEmail.passwordHash) {
        return NextResponse.redirect(
          `${origin}/logowanie?tab=login&googleLinkPending=1&email=${encodeURIComponent(normalizedEmail)}&returnUrl=${encodeURIComponent(safeReturn)}`
        );
      }

      // Jeśli konto istniało bez hasła (np. zakup gościnny), powiązujemy z Google
      existingByEmail.googleId = googleSub;
      existingByEmail.emailVerified = emailVerifiedByGoogle;
      if (!existingByEmail.welcomeDiscountCode && emailVerifiedByGoogle) {
        existingByEmail.welcomeDiscountCode = `WITAJ15-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      }
      customer = existingByEmail;

      if (isNeonConfigured()) {
        try {
          await prisma.customerAccount.update({
            where: { id: existingByEmail.id },
            data: {
              googleId: googleSub,
              emailVerified: emailVerifiedByGoogle,
              welcomeDiscountCode: customer.welcomeDiscountCode,
            },
          });
        } catch (_) {}
      }
    }
  }

  // 3. Jeśli klientka nie istnieje w ogóle — tworzymy nowe konto klientki
  // Ważne: ZAWSZE rola klientki — brak uprawnień administratora
  if (!customer) {
    const allCustomers = await getCustomers();
    const existingCodes = new Set<string>();
    for (const c of allCustomers) {
      if (c.referralCode) existingCodes.add(c.referralCode.toUpperCase());
    }
    const permanentReferralCode = generateUniqueReferralCode(existingCodes);

    const welcomeCode = emailVerifiedByGoogle
      ? `WITAJ15-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      : undefined;

    customer = {
      id: `cust-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      email: normalizedEmail,
      firstName,
      lastName,
      phone: "",
      googleId: googleSub,
      referralCode: permanentReferralCode,
      emailVerified: emailVerifiedByGoogle,
      welcomeDiscountCode: welcomeCode,
      createdAt: new Date().toISOString(),
    };

    if (isNeonConfigured()) {
      try {
        await prisma.customerAccount.create({
          data: {
            id: customer.id,
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            googleId: googleSub,
            referralCode: customer.referralCode,
            emailVerified: emailVerifiedByGoogle,
            welcomeDiscountCode: welcomeCode,
          },
        });
      } catch (e) {
        console.warn("Błąd zapisu nowego konta Google w Neon:", e);
      }
    }

    const store = loadLocalStore();
    if (!store.customers) store.customers = [];
    store.customers.push(customer);
    saveLocalStore(store);

    // Wysłanie e-maila powitalnego z rabatem powitalnym, jeśli e-mail zweryfikowany przez Google
    if (welcomeCode) {
      try {
        await sendWelcomeCustomerEmail({
          customerEmail: normalizedEmail,
          firstName,
          welcomeDiscountCode: welcomeCode,
        });
      } catch (_) {}
    }
  }

  // Tworzenie sesji klientki (nigdy administratora)
  const fullName = `${customer.firstName} ${customer.lastName}`.trim();
  const sessionPayload = createUserSessionPayload(customer.email, fullName);

  let redirectTarget = safeReturn;
  if (redirectTarget.includes("/zamowienie") && customer.welcomeDiscountCode && !customer.welcomeDiscountUsed) {
    redirectTarget += `${redirectTarget.includes("?") ? "&" : "?"}appliedWelcomeCode=${customer.welcomeDiscountCode}`;
  }

  const response = NextResponse.redirect(`${origin}${redirectTarget}`);
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: sessionPayload,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 dni
  });

  // Czyścimy ciasteczko oauth state
  response.cookies.delete("aura_google_oauth_state");

  return response;
}
