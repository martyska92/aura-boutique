import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/admin-auth";
import { loadLocalStore, saveLocalStore } from "@/lib/store-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: "Wymagane logowanie." }, { status: 401 });
    }

    const emailNorm = session.email.trim().toLowerCase();
    const store = loadLocalStore();
    const customer = (store.customers || []).find((c) => c.email.toLowerCase() === emailNorm);

    if (!customer) {
      return NextResponse.json({
        email: session.email,
        firstName: session.customerName?.split(" ")[0] || "",
        lastName: session.customerName?.split(" ").slice(1).join(" ") || "",
        phone: "",
      });
    }

    return NextResponse.json({
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone || "",
      createdAt: customer.createdAt,
      marketingConsent: Boolean((customer as any).marketingConsent),
      marketingConsentDate: (customer as any).marketingConsentDate || customer.createdAt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: "Wymagane logowanie." }, { status: 401 });
    }

    const { firstName, lastName, phone } = await req.json();

    const emailNorm = session.email.trim().toLowerCase();
    const store = loadLocalStore();
    const customer = (store.customers || []).find((c) => c.email.toLowerCase() === emailNorm);

    if (customer) {
      if (firstName) customer.firstName = firstName.trim();
      if (lastName) customer.lastName = lastName.trim();
      if (phone !== undefined) customer.phone = phone.trim();
      saveLocalStore(store);
    }

    return NextResponse.json({
      success: true,
      message: "Dane zostały zaktualizowane.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
