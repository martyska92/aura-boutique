import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminAccount } from "./store-data";
import { UserSession } from "./types";

const SESSION_COOKIE_NAME = "aura_admin_session";

export async function getUserSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  if (!session || !session.value) return null;

  try {
    const data = JSON.parse(Buffer.from(session.value, "base64").toString("utf-8")) as UserSession;
    if (data && data.expiresAt > Date.now()) {
      return data;
    }
  } catch (err) {
    return null;
  }
  return null;
}

export async function verifyAdminSession(): Promise<boolean> {
  const session = await getUserSession();
  if (!session) return false;
  // Jeśli użytkownik ma wymóg natychmiastowej zmiany hasła, nie traktujemy go jako w pełni autoryzowanego do panelu
  if (session.isAdmin && !session.mustChangePassword) {
    return true;
  }
  return false;
}

export async function requireAdmin() {
  const session = await getUserSession();
  if (!session || !session.isAdmin) {
    redirect("/logowanie?redirect=/admin");
  }

  if (session.mustChangePassword) {
    redirect("/zmien-haslo");
  }
}

export function createAdminSessionPayload(
  email: string = "aurazmigrod@wp.pl",
  mustChangePassword: boolean = false
): string {
  const payload: UserSession = {
    email: email.trim().toLowerCase(),
    role: "ADMIN",
    isAdmin: true,
    mustChangePassword,
    customerName: "Właścicielka Butiku",
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dni
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function createUserSessionPayload(
  email: string,
  customerName?: string
): string {
  const payload: UserSession = {
    email: email.trim().toLowerCase(),
    role: "CUSTOMER",
    isAdmin: false,
    mustChangePassword: false,
    customerName: customerName || email.split("@")[0],
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 dni
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export async function checkAdminCredentials(
  email: string,
  enteredPassword: string
): Promise<{ valid: boolean; mustChangePassword: boolean; email: string }> {
  const account = await getAdminAccount();
  const normalizedEmail = email.trim().toLowerCase();
  const adminEmail = account.email.trim().toLowerCase();

  if (normalizedEmail !== adminEmail) {
    return { valid: false, mustChangePassword: false, email: "" };
  }

  const isValidPassword = enteredPassword.trim() === account.password.trim();
  return {
    valid: isValidPassword,
    mustChangePassword: account.mustChangePassword,
    email: account.email,
  };
}

export async function checkAdminPassword(enteredPassword: string): Promise<boolean> {
  const account = await getAdminAccount();
  return enteredPassword.trim() === account.password.trim();
}

export const ADMIN_COOKIE_NAME = SESSION_COOKIE_NAME;
export const ADMIN_DEFAULT_EMAIL = "aurazmigrod@wp.pl";
