import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/admin-auth";
import { normalizeEmail } from "@/lib/store-data";
import {
  getNewsletterSubscription,
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
} from "@/lib/newsletter-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getUserSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: "Wymagane logowanie." }, { status: 401 });
    }

    const emailNorm = normalizeEmail(session.email);
    const sub = await getNewsletterSubscription(emailNorm);

    return NextResponse.json({
      email: emailNorm,
      status: sub ? sub.status : "NONE",
      confirmedAt: sub?.confirmedAt || null,
      source: sub?.source || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: "Wymagane logowanie." }, { status: 401 });
    }

    const { action } = await req.json();
    const emailNorm = normalizeEmail(session.email);

    if (action === "subscribe") {
      const res = await subscribeToNewsletter({
        email: emailNorm,
        source: "ACCOUNT",
        sendEmail: true,
      });

      return NextResponse.json({
        success: true,
        status: res.status,
        message:
          res.status === "CONFIRMED"
            ? "Twój adres jest już aktywnym subskrybentem newslettera."
            : "Wysłaliśmy wiadomość z linkiem potwierdzającym na Twój adres e-mail.",
        requiresConfirmation: res.requiresConfirmation,
      });
    }

    if (action === "unsubscribe") {
      const res = await unsubscribeFromNewsletter({
        email: emailNorm,
      });

      if (!res.success) {
        return NextResponse.json({ error: res.error || "Błąd podczas rezygnacji." }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        status: "UNSUBSCRIBED",
        message: "Pomyślnie zrezygnowano z otrzymywania newslettera.",
      });
    }

    return NextResponse.json({ error: "Nieprawidłowa akcja." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
