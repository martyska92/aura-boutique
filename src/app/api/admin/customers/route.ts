import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { loadLocalStore, saveLocalStore, getCustomers } from "@/lib/store-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  const store = loadLocalStore();
  const customers = await getCustomers();
  const orders = store.orders || [];
  const individualDiscounts = store.individualDiscounts || [];

  const customerRows = customers.map((c) => {
    const customerOrders = orders.filter(
      (o) =>
        (o.customerId && o.customerId === c.id) ||
        (o.customerEmail && o.customerEmail.toLowerCase() === c.email.toLowerCase())
    );

    const paidOrders = customerOrders.filter((o) => o.paymentStatus === "PAID");
    const totalPaidAmount = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const sortedOrders = [...customerOrders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const lastOrderDate = sortedOrders.length > 0 ? sortedOrders[0].createdAt : null;

    const indDiscount = individualDiscounts.find(
      (d) => d.email.toLowerCase() === c.email.toLowerCase() && d.isActive
    );

    // Zgromadź wszystkie zwroty tej klientki
    const customerReturns = customerOrders.flatMap((o) => o.returns || []);

    return {
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      fullName: `${c.firstName} ${c.lastName}`.trim(),
      email: c.email,
      phone: c.phone || "—",
      createdAt: c.createdAt,
      isActive: true, // Zarejestrowane i aktywne konto
      ordersCount: customerOrders.length,
      paidOrdersCount: paidOrders.length,
      totalPaidAmount,
      lastOrderDate,
      referralCode: c.referralCode,
      welcomeDiscountCode: c.welcomeDiscountCode || "—",
      welcomeDiscountUsedAt: c.welcomeDiscountUsedAt || null,
      individualDiscountPercent: indDiscount?.discountPercent || null,
      individualDiscountNote: indDiscount?.adminNote || null,
      marketingConsent: Boolean((c as any).marketingConsent),
      marketingConsentDate: (c as any).marketingConsentDate || c.createdAt,
      orders: sortedOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        totalAmount: o.totalAmount,
        paymentStatus: o.paymentStatus,
        fulfillmentStatus: o.fulfillmentStatus,
        itemsCount: o.items?.length || 0,
      })),
      returns: customerReturns.map((r) => ({
        id: r.id,
        orderNumber: r.orderNumber,
        createdAt: r.createdAt,
        status: r.status,
        itemsCount: r.items?.length || 0,
      })),
    };
  });

  return NextResponse.json({
    success: true,
    customers: customerRows,
  });
}
