import { NextRequest, NextResponse } from "next/server";
import {
  getUserSession,
  createAdminSessionPayload,
  ADMIN_COOKIE_NAME,
} from "@/lib/admin-auth";
import { updateAdminPassword } from "@/lib/store-data";

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: "Brak uprawnień. Zaloguj się najpierw jako właścicielka." },
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

    const trimmedNew = newPassword.trim();

    if (trimmedNew.length < 6) {
      return NextResponse.json(
        { error: "Nowe hasło musi zawierać co najmniej 6 znaków." },
        { status: 400 }
      );
    }

    if (trimmedNew.toLowerCase() === "dupa") {
      return NextResponse.json(
        { error: "Nie możesz pozostawić hasła jednorazowego. Wybierz własne, bezpieczne hasło." },
        { status: 400 }
      );
    }

    if (confirmPassword !== undefined && trimmedNew !== confirmPassword.trim()) {
      return NextResponse.json(
        { error: "Nowe hasło i jego powtórzenie nie są identyczne." },
        { status: 400 }
      );
    }

    // Zapisujemy nowe hasło w bazie
    await updateAdminPassword(trimmedNew);

    // Odświeżamy sesję z mustChangePassword: false
    const sessionPayload = createAdminSessionPayload(session.email, false);

    const response = NextResponse.json({
      success: true,
      message: "Twoje nowe hasło zostało pomyślnie zapisane! Możesz teraz w pełni zarządzać butikiem.",
      redirect: "/admin",
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
  } catch (err: any) {
    console.error("Błąd api/auth/change-password:", err);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas zmiany hasła." },
      { status: 500 }
    );
  }
}

