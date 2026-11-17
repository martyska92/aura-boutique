import { NextRequest, NextResponse } from "next/server";
import { getNewsletterSubscription, unsubscribeFromNewsletter, subscribeToNewsletter } from "@/lib/newsletter-service";
import { getUserSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession();
    const queryEmail = req.nextUrl.searchParams.get("email");
    const email = session?.email || queryEmail;

    if (!email) {
      return NextResponse.json({ status: "NONE" });
    }

    const sub = await getNewsletterSubscription(email);
    if (!sub) {
      return NextResponse.json({ status: "NONE" });
    }

    return NextResponse.json({
      status: sub.status,
      source: sub.source,
      consentVersion: sub.consentVersion,
      confirmedAt: sub.confirmedAt,
      unsubscribedAt: sub.unsubscribedAt,
      createdAt: sub.createdAt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
