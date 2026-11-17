import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/admin-auth";
import { getCustomerByEmail, updateCustomerProfile, normalizeEmail } from "@/lib/store-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: "Wymagane logowanie." }, { status: 401 });
    }

    const emailNorm = normalizeEmail(session.email);
    const customer = await getCustomerByEmail(emailNorm);

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
      defaultStreet: customer.defaultStreet || "",
      defaultCity: customer.defaultCity || "",
      defaultPostalCode: customer.defaultPostalCode || "",
      lastParcelLocker: customer.lastParcelLocker || "",
      lastParcelLockerAddress: customer.lastParcelLockerAddress || "",
      invoiceType: customer.invoiceType || null,
      invoiceCompanyName: customer.invoiceCompanyName || "",
      invoiceNip: customer.invoiceNip || "",
      invoiceStreet: customer.invoiceStreet || "",
      invoiceCity: customer.invoiceCity || "",
      invoicePostalCode: customer.invoicePostalCode || "",
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

    const body = await req.json();
    const emailNorm = normalizeEmail(session.email);

    const updated = await updateCustomerProfile(emailNorm, {
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      defaultStreet: body.defaultStreet,
      defaultCity: body.defaultCity,
      defaultPostalCode: body.defaultPostalCode,
      lastParcelLocker: body.lastParcelLocker,
      lastParcelLockerAddress: body.lastParcelLockerAddress,
      invoiceType: body.invoiceType,
      invoiceCompanyName: body.invoiceCompanyName,
      invoiceNip: body.invoiceNip,
      invoiceStreet: body.invoiceStreet,
      invoiceCity: body.invoiceCity,
      invoicePostalCode: body.invoicePostalCode,
    });

    return NextResponse.json({
      success: true,
      message: "Dane zostały zaktualizowane.",
      customer: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
