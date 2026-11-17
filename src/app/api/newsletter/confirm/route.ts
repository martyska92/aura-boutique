import { NextRequest, NextResponse } from "next/server";
import { confirmNewsletterSubscription } from "@/lib/newsletter-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    const res = await confirmNewsletterSubscription(token);
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, email: res.email });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Brak tokenu." }, { status: 400 });
  }
  const res = await confirmNewsletterSubscription(token);
  if (!res.success) {
    return NextResponse.json({ error: res.error }, { status: 400 });
  }
  return NextResponse.json({ success: true, email: res.email });
}
