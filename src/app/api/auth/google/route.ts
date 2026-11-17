import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sanitizeReturnUrl } from "@/lib/customer-auth-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Logowanie przez Google nie zostało jeszcze skonfigurowane." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const returnUrl = sanitizeReturnUrl(searchParams.get("returnUrl"));

  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;
  const redirectUri = `${origin}/api/auth/google/callback`;

  // Bezpieczny stan (state) z tokenem CSRF i adresem powrotnym
  const csrfToken = crypto.randomBytes(24).toString("hex");
  const statePayload = Buffer.from(
    JSON.stringify({ csrf: csrfToken, returnUrl })
  ).toString("base64url");

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("state", statePayload);
  googleAuthUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(googleAuthUrl.toString());
  response.cookies.set({
    name: "aura_google_oauth_state",
    value: csrfToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: 10 * 60, // 10 minut
  });

  return response;
}
