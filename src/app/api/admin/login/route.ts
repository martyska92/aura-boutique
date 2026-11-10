import { NextRequest, NextResponse } from "next/server";
import {
  checkAdminPassword,
  checkAdminCredentials,
  createAdminSessionPayload,
  ADMIN_COOKIE_NAME,
  ADMIN_DEFAULT_EMAIL,
} from "@/lib/admin-auth";
import { getAdminAccount } from "@/lib/store-data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const account = await getAdminAccount();

    let isValid = false;
    let mustChange = account.mustChangePassword;

    if (email) {
      const resAuth = await checkAdminCredentials(email, password);
      isValid = resAuth.valid;
      mustChange = resAuth.mustChangePassword;
    } else if (password) {
      isValid = await checkAdminPassword(password);
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Nieprawidłowy e-mail lub hasło dostępowe." },
        { status: 401 }
      );
    }

    const sessionPayload = createAdminSessionPayload(
      account.email || ADMIN_DEFAULT_EMAIL,
      mustChange
    );

    const res = NextResponse.json({
      success: true,
      isAdmin: true,
      mustChangePassword: mustChange,
      redirect: mustChange ? "/zmien-haslo" : "/admin",
    });

    res.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: sessionPayload,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 dni
    });

    return res;
  } catch (err: any) {
    console.error("Błąd logowania admin:", err);
    return NextResponse.json(
      { error: "Wystąpił błąd serwera." },
      { status: 500 }
    );
  }
}
