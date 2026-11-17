import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { getCustomerById, getCustomerByEmail } from "@/lib/store-data";
import {
  grantIndividualDiscount,
  getDiscountsForCustomer,
  revokeIndividualDiscount,
  resendDiscountEmail,
} from "@/lib/individual-discount-service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji właścicielki." }, { status: 401 });
  }

  try {
    const { id } = await params;
    let customer = await getCustomerById(id);
    if (!customer) {
      customer = await getCustomerByEmail(id);
    }

    if (!customer) {
      return NextResponse.json({ error: "Nie znaleziono klientki." }, { status: 404 });
    }

    const discounts = await getDiscountsForCustomer(customer.email);

    return NextResponse.json({
      success: true,
      customerEmail: customer.email,
      welcomeDiscountCode: customer.welcomeDiscountCode,
      welcomeDiscountUsed: customer.welcomeDiscountUsed || Boolean(customer.welcomeDiscountUsedAt),
      emailVerified: customer.emailVerified || false,
      discounts,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji właścicielki." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    // Akcja ponowienia wysyłki istniejącego kodu
    if (body.action === "resend") {
      if (!body.discountId) {
        return NextResponse.json({ error: "Wymagane discountId." }, { status: 400 });
      }
      const resendRes = await resendDiscountEmail(body.discountId);
      if (!resendRes.success) {
        return NextResponse.json({ error: resendRes.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: "Wysłano ponownie ten sam kod rabatowy na adres klientki.",
        sentAt: resendRes.sentAt,
      });
    }

    let customer = await getCustomerById(id);
    if (!customer) {
      customer = await getCustomerByEmail(id);
    }

    if (!customer) {
      return NextResponse.json({ error: "Nie znaleziono klientki." }, { status: 404 });
    }

    const {
      discountPercent,
      isPermanent,
      validUntil,
      minCartValue,
      canCombine,
      adminNote,
      sendEmail,
    } = body;

    const result = await grantIndividualDiscount({
      customerId: customer.id,
      customerEmail: customer.email,
      discountPercent: Number(discountPercent),
      isPermanent: Boolean(isPermanent),
      validUntil: validUntil || undefined,
      minCartValue: minCartValue ? Number(minCartValue) : undefined,
      canCombine: Boolean(canCombine),
      adminNote,
      sendEmail: Boolean(sendEmail),
      grantedBy: "Właścicielka",
    });

    return NextResponse.json({
      success: true,
      message: `Przyznano rabat −${result.discount.discountPercent}% dla ${customer.email}.`,
      discount: result.discount,
      emailSent: result.emailSent,
      emailError: result.emailError,
    });
  } catch (err: any) {
    console.error("Błąd przyznawania rabatu indywidualnego:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji właścicielki." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { discountId, reason } = body;

    if (!discountId) {
      return NextResponse.json({ error: "Wymagane discountId do unieważnienia." }, { status: 400 });
    }

    const result = await revokeIndividualDiscount(discountId, reason);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Rabat został pomyślnie unieważniony.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
