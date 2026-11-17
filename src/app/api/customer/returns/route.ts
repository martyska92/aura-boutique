import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/admin-auth";
import { loadLocalStore } from "@/lib/store-data";

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

    const userOrders = (store.orders || []).filter((o) => {
      const matchesEmail = o.customerEmail && o.customerEmail.trim().toLowerCase() === emailNorm;
      const matchesId = customer && o.customerId && o.customerId === customer.id;
      return matchesEmail || matchesId;
    });

    const allReturns: any[] = [];
    userOrders.forEach((o) => {
      if (o.returns && Array.isArray(o.returns)) {
        o.returns.forEach((r) => {
          allReturns.push({
            ...r,
            orderId: o.id,
            orderNumber: o.orderNumber,
          });
        });
      }
    });

    const sorted = allReturns.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      returns: sorted,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
