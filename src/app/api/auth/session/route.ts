import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/admin-auth";
import { getCustomerByEmail } from "@/lib/store-data";
import { getDiscountsForCustomer } from "@/lib/individual-discount-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session || !session.email) {
      return NextResponse.json({ isLoggedIn: false });
    }

    const customer = await getCustomerByEmail(session.email);
    const discounts = customer ? await getDiscountsForCustomer(customer.email) : [];

    return NextResponse.json({
      isLoggedIn: true,
      email: session.email,
      fullName: session.customerName || `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim(),
      firstName: customer?.firstName || session.customerName?.split(" ")[0] || "",
      lastName: customer?.lastName || "",
      emailVerified: customer?.emailVerified ?? true, // Jeśli brak pola, domyślnie true dla starych kont
      welcomeDiscountCode: customer?.welcomeDiscountCode || null,
      welcomeDiscountUsed: customer?.welcomeDiscountUsed || Boolean(customer?.welcomeDiscountUsedAt),
      discounts: discounts.filter((d) => !d.isRevoked && (!d.isUsed || d.isPermanent)),
    });
  } catch (err: any) {
    return NextResponse.json({ isLoggedIn: false });
  }
}
