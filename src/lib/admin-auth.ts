import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE_NAME = "aura_admin_session";
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || "Aura2026!";

export async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  if (!session || !session.value) return false;

  try {
    const data = JSON.parse(Buffer.from(session.value, "base64").toString("utf-8"));
    if (data.isAdmin && data.expiresAt > Date.now()) {
      return true;
    }
  } catch (err) {
    return false;
  }
  return false;
}

export async function requireAdmin() {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    redirect("/admin/login");
  }
}

export function createAdminSessionPayload(): string {
  const payload = {
    isAdmin: true,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dni
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function checkAdminPassword(enteredPassword: string): boolean {
  return enteredPassword.trim() === DEFAULT_PASSWORD.trim();
}

export const ADMIN_COOKIE_NAME = SESSION_COOKIE_NAME;
export const ADMIN_DEFAULT_PASSWORD = DEFAULT_PASSWORD;
