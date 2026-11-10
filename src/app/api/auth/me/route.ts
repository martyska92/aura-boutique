import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/admin-auth";

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

    return NextResponse.json({
      isLoggedIn: true,
      email: session.email,
      role: session.role,
      isAdmin: session.isAdmin,
      mustChangePassword: !!session.mustChangePassword,
      customerName: session.customerName,
    });
  } catch (err: any) {
    return NextResponse.json(
      { isLoggedIn: false, error: err.message },
      { status: 500 }
    );
  }
}

