import { NextRequest, NextResponse } from "next/server";
import { unsubscribeFromNewsletter } from "@/lib/newsletter-service";
import { getUserSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const session = await getUserSession();
    const token = body.token;
    const email = body.email || session?.email;

    if (!token && !email) {
      return NextResponse.json({ error: "Wymagany token rezygnacji lub adres e-mail." }, { status: 400 });
    }

    const res = await unsubscribeFromNewsletter({ token, email });
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, email: res.email, message: "Pomyślnie zrezygnowano z subskrypcji newslettera." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Brak tokenu." }, { status: 400 });
  }
  const res = await unsubscribeFromNewsletter({ token });
  if (!res.success) {
    return NextResponse.json({ error: res.error }, { status: 400 });
  }
  return NextResponse.json({ success: true, email: res.email, message: "Pomyślnie zrezygnowano z subskrypcji newslettera." });
}
