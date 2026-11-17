import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/admin-auth";
import { getCustomerByEmail } from "@/lib/store-data";

export async function GET() {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({
        isLoggedIn: false,
        email: null,
        isAdmin: false,
        mustChangePassword: false,
      });
    }

    let customer = null;
    if (session.email) {
      customer = await getCustomerByEmail(session.email);
    }

    return NextResponse.json({
      isLoggedIn: true,
      email: session.email,
      role: session.role,
      isAdmin: session.isAdmin,
      mustChangePassword: !!session.mustChangePassword,
      customerName: session.customerName,
      emailVerified: customer?.emailVerified ?? true,
      welcomeDiscountCode: customer?.welcomeDiscountCode,
      welcomeDiscountUsed: customer?.welcomeDiscountUsed || Boolean(customer?.welcomeDiscountUsedAt),
      welcomeDiscountUsedAt: customer?.welcomeDiscountUsedAt,
    });
  } catch (err: any) {
    return NextResponse.json(
      { isLoggedIn: false, error: err.message },
      { status: 500 }
    );
  }
}

