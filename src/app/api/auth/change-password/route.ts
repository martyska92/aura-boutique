import { NextRequest, NextResponse } from "next/server";
import {
  getUserSession,
  createAdminSessionPayload,
  createUserSessionPayload,
  ADMIN_COOKIE_NAME,
} from "@/lib/admin-auth";
import { updateAdminPassword, resetUserPassword } from "@/lib/store-data";

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session || !session.email) {
      return NextResponse.json(
        { error: "Brak aktywnej sesji. Zaloguj się na swoje konto, aby zmienić hasło." },
        { status: 401 }
      );
    }

    const { newPassword, confirmPassword } = await req.json();

    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json(
        { error: "Wprowadź nowe hasło." },
        { status: 400 }
      );
    }

    // Walidacja minimum 8 znaków (bez przycinania i modyfikacji wpisanego hasła)
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Nowe hasło musi zawierać co najmniej 8 znaków dla zapewnienia bezpieczeństwa konta." },
        { status: 400 }
      );
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Nowe hasło i jego powtórzenie nie są identyczne." },
        { status: 400 }
      );
    }

    // Zapisujemy nowe hasło w bazie PostgreSQL / Neon
    if (session.isAdmin) {
      await updateAdminPassword(newPassword);
    } else {
      await resetUserPassword(session.email, newPassword);
    }

    // Odświeżamy ciasteczko sesji
    const displayName = (session as any).customerName || (session as any).fullName || "Klientka AURA";
    const sessionPayload = session.isAdmin
      ? createAdminSessionPayload(session.email, false)
      : createUserSessionPayload(session.email, displayName);

    const response = NextResponse.json({
      success: true,
      message: "Twoje nowe hasło zostało pomyślnie zapisane!",
      redirect: session.isAdmin ? "/admin" : "/konto",
    });

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
    console.error("Błąd api/auth/change-password");
    return NextResponse.json(
      { error: "Wystąpił błąd podczas zmiany hasła." },
      { status: 500 }
    );
  }
}

