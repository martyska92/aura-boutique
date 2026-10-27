import { NextRequest, NextResponse } from "next/server";
import { checkAdminPassword, createAdminSessionPayload, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || !checkAdminPassword(password)) {
      return NextResponse.json(
        { error: "Nieprawidłowe hasło dostępowe do panelu." },
        { status: 401 }
      );
    }

    const sessionPayload = createAdminSessionPayload();
    const res = NextResponse.json({ success: true });

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
    return NextResponse.json(
      { error: "Wystąpił błąd serwera." },
      { status: 500 }
    );
  }
}
