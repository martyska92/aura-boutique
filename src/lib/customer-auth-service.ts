import crypto from "crypto";
import { prisma, isNeonConfigured } from "@/lib/prisma";
import {
  getCustomerByEmail,
  loadLocalStore,
  saveLocalStore,
  hashPassword,
  generateUniqueReferralCode,
  getCustomers,
} from "@/lib/store-data";
import { CustomerAccount } from "@/lib/types";
import { sendAccountVerificationEmail, sendWelcomeCustomerEmail } from "@/lib/email-service";

export function hashVerificationToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function sanitizeReturnUrl(url?: string | null): string {
  if (!url) return "/konto";
  const trimmed = url.trim();
  // Tylko relatywne ścieżki w obrębie sklepu
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.toLowerCase().startsWith("/\\")) {
    return trimmed;
  }
  return "/konto";
}

/**
 * 1. Tworzy niezweryfikowane konto klientki i wysyła e-mail weryfikacyjny z linkiem (24h)
 */
export async function createPendingCustomerRegistration(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  returnUrl?: string;
}): Promise<{
  success: boolean;
  customer: CustomerAccount;
  emailSent: boolean;
  emailError?: string;
}> {
  const normalizedEmail = data.email.trim().toLowerCase();

  // Sprawdzenie czy konto już istnieje
  const existing = await getCustomerByEmail(normalizedEmail);
  if (existing && existing.passwordHash) {
    throw new Error("Konto z tym adresem e-mail już istnieje. Przejdź do logowania.");
  }

  // Generowanie tokenu weryfikacyjnego
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashVerificationToken(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 godziny
  const cooldownUntil = new Date(Date.now() + 60 * 1000); // 60 sekund

  const hashedPassword = data.password ? hashPassword(data.password.trim()) : undefined;

  let customer: CustomerAccount;

  if (existing) {
    // Aktualizujemy istniejący kontakt gościnny
    customer = {
      ...existing,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone?.trim() || existing.phone,
      passwordHash: hashedPassword,
      emailVerified: false,
      emailVerificationToken: tokenHash,
      verificationExpiresAt: expiresAt.toISOString(),
      resendCooldownUntil: cooldownUntil.toISOString(),
      resendAttemptsCount: (existing.resendAttemptsCount || 0) + 1,
    };

    if (isNeonConfigured()) {
      try {
        await prisma.customerAccount.update({
          where: { id: existing.id },
          data: {
            firstName: customer.firstName,
            lastName: customer.lastName,
            phone: customer.phone,
            passwordHash: customer.passwordHash,
            emailVerified: false,
            emailVerificationToken: tokenHash,
            verificationExpiresAt: expiresAt,
            resendCooldownUntil: cooldownUntil,
            resendAttemptsCount: customer.resendAttemptsCount,
          },
        });
      } catch (e) {
        console.warn("Błąd aktualizacji konta w Neon:", e);
      }
    }
  } else {
    // Nowe konto
    const allCustomers = await getCustomers();
    const existingCodes = new Set<string>();
    for (const c of allCustomers) {
      if (c.referralCode) existingCodes.add(c.referralCode.toUpperCase());
    }
    const permanentReferralCode = generateUniqueReferralCode(existingCodes);

    customer = {
      id: `cust-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      email: normalizedEmail,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone?.trim() || "",
      passwordHash: hashedPassword,
      referralCode: permanentReferralCode,
      emailVerified: false,
      emailVerificationToken: tokenHash,
      verificationExpiresAt: expiresAt.toISOString(),
      resendCooldownUntil: cooldownUntil.toISOString(),
      resendAttemptsCount: 1,
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
            phone: customer.phone,
            passwordHash: customer.passwordHash,
            referralCode: customer.referralCode,
            emailVerified: false,
            emailVerificationToken: tokenHash,
            verificationExpiresAt: expiresAt,
            resendCooldownUntil: cooldownUntil,
            resendAttemptsCount: 1,
          },
        });
      } catch (e) {
        console.warn("Błąd zapisu nowego konta w Neon:", e);
      }
    }
  }

  // Zapis w pamięci / fallback lokalny
  const store = loadLocalStore();
  if (!store.customers) store.customers = [];
  const idx = store.customers.findIndex((c) => c.email.toLowerCase() === normalizedEmail);
  if (idx >= 0) {
    store.customers[idx] = customer;
  } else {
    store.customers.push(customer);
  }
  saveLocalStore(store);

  // Przygotowanie linku weryfikacyjnego
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aura-boutique-w38e.vercel.app";
  const safeReturn = sanitizeReturnUrl(data.returnUrl);
  const verificationUrl = `${appUrl}/konto/potwierdz-email?token=${rawToken}&returnUrl=${encodeURIComponent(safeReturn)}`;

  // Wysyłka wiadomości weryfikacyjnej
  let emailSent = false;
  let emailError: string | undefined = undefined;
  try {
    const mailRes = await sendAccountVerificationEmail({
      customerEmail: normalizedEmail,
      firstName: customer.firstName,
      verificationUrl,
    });
    emailSent = mailRes.success;
    emailError = mailRes.error;
  } catch (err: any) {
    emailSent = false;
    emailError = err.message || "Błąd wysyłki e-mail";
  }

  return {
    success: true,
    customer,
    emailSent,
    emailError,
  };
}

/**
 * 2. Weryfikacja adresu e-mail przez token:
 * Oznacza konto jako zweryfikowane, generuje trwały unikalny kod powitalny -15% i wysyła go e-mailem.
 */
export async function verifyCustomerEmailByToken(token: string): Promise<{
  success: boolean;
  error?: string;
  customer?: CustomerAccount;
  welcomeCoupon?: string;
  alreadyVerified?: boolean;
}> {
  if (!token || token.trim().length < 16) {
    return { success: false, error: "Nieprawidłowy lub uszkodzony link weryfikacyjny." };
  }

  const tokenHash = hashVerificationToken(token.trim());

  let foundCustomer: CustomerAccount | null = null;

  if (isNeonConfigured()) {
    try {
      const dbCust = await prisma.customerAccount.findFirst({
        where: { emailVerificationToken: tokenHash },
      });
      if (dbCust) {
        foundCustomer = {
          id: dbCust.id,
          email: dbCust.email,
          firstName: dbCust.firstName,
          lastName: dbCust.lastName,
          phone: dbCust.phone || "",
          passwordHash: dbCust.passwordHash || undefined,
          referralCode: dbCust.referralCode || "",
          emailVerified: dbCust.emailVerified,
          emailVerificationToken: dbCust.emailVerificationToken || undefined,
          verificationExpiresAt: dbCust.verificationExpiresAt?.toISOString(),
          welcomeDiscountCode: dbCust.welcomeDiscountCode || undefined,
          welcomeDiscountUsed: dbCust.welcomeDiscountUsed,
          createdAt: dbCust.createdAt.toISOString(),
        };
      }
    } catch (e) {
      console.warn("Błąd wyszukiwania klienta po tokenie w Neon:", e);
    }
  }

  if (!foundCustomer) {
    const store = loadLocalStore();
    foundCustomer =
      (store.customers || []).find((c) => c.emailVerificationToken === tokenHash) || null;
  }

  if (!foundCustomer) {
    return {
      success: false,
      error: "Link weryfikacyjny wygasł, został już wykorzystany lub jest nieprawidłowy.",
    };
  }

  // Sprawdzenie daty wygaśnięcia (24h)
  if (foundCustomer.verificationExpiresAt) {
    const exp = new Date(foundCustomer.verificationExpiresAt);
    if (exp.getTime() < Date.now()) {
      return {
        success: false,
        error: "Link weryfikacyjny stracił ważność (minęły 24 godziny). Kliknij poniżej, aby otrzymać nowy link.",
      };
    }
  }

  // Jeśli już zweryfikowany, zwracamy bez tworzenia nowego kodu
  if (foundCustomer.emailVerified && foundCustomer.welcomeDiscountCode) {
    return {
      success: true,
      alreadyVerified: true,
      customer: foundCustomer,
      welcomeCoupon: foundCustomer.welcomeDiscountCode,
    };
  }

  // Generowanie unikalnego kodu rabatowego -15%, jeśli klient jeszcze go nie otrzymał
  let welcomeCode = foundCustomer.welcomeDiscountCode;
  if (!welcomeCode) {
    welcomeCode = `WITAJ15-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }

  foundCustomer.emailVerified = true;
  foundCustomer.emailVerificationToken = undefined;
  foundCustomer.verificationExpiresAt = undefined;
  foundCustomer.welcomeDiscountCode = welcomeCode;

  // Trwały zapis w bazie Neon
  if (isNeonConfigured()) {
    try {
      await prisma.customerAccount.update({
        where: { id: foundCustomer.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          verificationExpiresAt: null,
          welcomeDiscountCode: welcomeCode,
        },
      });
    } catch (e) {
      console.warn("Błąd aktualizacji weryfikacji w Neon:", e);
    }
  }

  // Zapis lokalny fallback
  const store = loadLocalStore();
  if (!store.customers) store.customers = [];
  const idx = store.customers.findIndex((c) => c.id === foundCustomer!.id);
  if (idx >= 0) {
    store.customers[idx] = foundCustomer;
  } else {
    store.customers.push(foundCustomer);
  }
  saveLocalStore(store);

  // Oddzielna wysyłka e-maila z kodem powitalnym (błąd poczty nie blokuje weryfikacji)
  try {
    await sendWelcomeCustomerEmail({
      customerEmail: foundCustomer.email,
      firstName: foundCustomer.firstName,
      welcomeDiscountCode: welcomeCode,
      force: true,
    });
  } catch (err) {
    console.warn("Błąd wysyłki e-maila z kodem powitalnym po weryfikacji:", err);
  }

  return {
    success: true,
    customer: foundCustomer,
    welcomeCoupon: welcomeCode,
  };
}

/**
 * 3. Ponowne wysłanie wiadomości weryfikacyjnej z egzekwowaniem cooldownu (60s) i limitu prób
 */
export async function resendAccountVerificationEmail(
  email: string,
  returnUrl?: string
): Promise<{
  success: boolean;
  error?: string;
  cooldownSeconds?: number;
  attemptsLeft?: number;
}> {
  const normalized = email.trim().toLowerCase();
  const customer = await getCustomerByEmail(normalized);

  if (!customer) {
    return { success: false, error: "Nie znaleziono konta z podanym adresem e-mail." };
  }

  if (customer.emailVerified) {
    return { success: false, error: "Twój adres e-mail został już pomyślnie potwierdzony." };
  }

  const now = Date.now();

  // Sprawdzenie cooldownu
  if (customer.resendCooldownUntil) {
    const cd = new Date(customer.resendCooldownUntil).getTime();
    if (cd > now) {
      const waitSec = Math.ceil((cd - now) / 1000);
      return {
        success: false,
        error: `Odczekaj jeszcze ${waitSec} s przed kolejną próbą wysłania.`,
        cooldownSeconds: waitSec,
      };
    }
  }

  // Sprawdzenie limitu prób (max 5 prób)
  const currentAttempts = customer.resendAttemptsCount || 1;
  const maxAttempts = 5;
  if (currentAttempts >= maxAttempts) {
    return {
      success: false,
      error: "Osiągnięto limit prób ponowienia wiadomości. Skontaktuj się z obsługą butiku AURA.",
      attemptsLeft: 0,
    };
  }

  // Nowy token weryfikacyjny
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashVerificationToken(rawToken);
  const expiresAt = new Date(now + 24 * 60 * 60 * 1000);
  const cooldownUntil = new Date(now + 60 * 1000); // 60 sekund

  customer.emailVerificationToken = tokenHash;
  customer.verificationExpiresAt = expiresAt.toISOString();
  customer.resendCooldownUntil = cooldownUntil.toISOString();
  customer.resendAttemptsCount = currentAttempts + 1;

  if (isNeonConfigured()) {
    try {
      await prisma.customerAccount.update({
        where: { id: customer.id },
        data: {
          emailVerificationToken: tokenHash,
          verificationExpiresAt: expiresAt,
          resendCooldownUntil: cooldownUntil,
          resendAttemptsCount: customer.resendAttemptsCount,
        },
      });
    } catch (e) {
      console.warn("Błąd aktualizacji tokenu w Neon:", e);
    }
  }

  const store = loadLocalStore();
  if (!store.customers) store.customers = [];
  const idx = store.customers.findIndex((c) => c.id === customer.id);
  if (idx >= 0) {
    store.customers[idx] = customer;
    saveLocalStore(store);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aura-boutique-w38e.vercel.app";
  const safeReturn = sanitizeReturnUrl(returnUrl);
  const verificationUrl = `${appUrl}/konto/potwierdz-email?token=${rawToken}&returnUrl=${encodeURIComponent(safeReturn)}`;

  const mailRes = await sendAccountVerificationEmail({
    customerEmail: customer.email,
    firstName: customer.firstName,
    verificationUrl,
  });

  if (!mailRes.success) {
    return {
      success: false,
      error: mailRes.error || "Wysyłka e-maila nie powiodła się. Spróbuj ponownie za chwilę.",
      cooldownSeconds: 60,
    };
  }

  return {
    success: true,
    cooldownSeconds: 60,
    attemptsLeft: maxAttempts - customer.resendAttemptsCount,
  };
}

/**
 * 4. Zmiana adresu e-mail przed weryfikacją (gdy klientka zrobiła literówkę)
 */
export async function changeUnverifiedCustomerEmail(
  oldEmail: string,
  newEmail: string,
  returnUrl?: string
): Promise<{
  success: boolean;
  error?: string;
  emailSent?: boolean;
}> {
  const normOld = oldEmail.trim().toLowerCase();
  const normNew = newEmail.trim().toLowerCase();

  if (!normNew || !normNew.includes("@")) {
    return { success: false, error: "Wpisz poprawny nowy adres e-mail." };
  }

  if (normOld === normNew) {
    return { success: false, error: "Nowy adres jest identyczny z obecnym." };
  }

  const existingWithNew = await getCustomerByEmail(normNew);
  if (existingWithNew && existingWithNew.passwordHash) {
    return { success: false, error: "Konto z tym nowym adresem e-mail już istnieje w butiku." };
  }

  const customer = await getCustomerByEmail(normOld);
  if (!customer) {
    return { success: false, error: "Nie znaleziono dotychczasowego konta." };
  }

  if (customer.emailVerified) {
    return { success: false, error: "Zweryfikowany adres e-mail można zmienić wyłącznie w ustawieniach profilu." };
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashVerificationToken(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const cooldownUntil = new Date(Date.now() + 60 * 1000);

  customer.email = normNew;
  customer.emailVerificationToken = tokenHash;
  customer.verificationExpiresAt = expiresAt.toISOString();
  customer.resendCooldownUntil = cooldownUntil.toISOString();
  customer.resendAttemptsCount = 1;

  if (isNeonConfigured()) {
    try {
      await prisma.customerAccount.update({
        where: { id: customer.id },
        data: {
          email: normNew,
          emailVerificationToken: tokenHash,
          verificationExpiresAt: expiresAt,
          resendCooldownUntil: cooldownUntil,
          resendAttemptsCount: 1,
        },
      });
    } catch (e) {
      console.warn("Błąd aktualizacji adresu e-mail w Neon:", e);
    }
  }

  const store = loadLocalStore();
  if (!store.customers) store.customers = [];
  const idx = store.customers.findIndex((c) => c.id === customer.id);
  if (idx >= 0) {
    store.customers[idx] = customer;
    saveLocalStore(store);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aura-boutique-w38e.vercel.app";
  const safeReturn = sanitizeReturnUrl(returnUrl);
  const verificationUrl = `${appUrl}/konto/potwierdz-email?token=${rawToken}&returnUrl=${encodeURIComponent(safeReturn)}`;

  const mailRes = await sendAccountVerificationEmail({
    customerEmail: normNew,
    firstName: customer.firstName,
    verificationUrl,
  });

  return {
    success: true,
    emailSent: mailRes.success,
    error: mailRes.success ? undefined : mailRes.error,
  };
}
