import { NextRequest, NextResponse } from "next/server";
import { subscribeToNewsletter } from "@/lib/newsletter-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, source, customerId } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Podaj prawidłowy adres e-mail." }, { status: 400 });
    }

    const res = await subscribeToNewsletter({
      email,
      source: source || "ACCOUNT",
      customerId,
      sendEmail: true,
    });

    return NextResponse.json({ success: true, ...res });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Błąd zapisu do newslettera." }, { status: 500 });
  }
}
