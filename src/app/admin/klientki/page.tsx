import React from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { loadLocalStore, getCustomers } from "@/lib/store-data";
import { CustomerListClient, CustomerRow } from "@/components/admin/CustomerListClient";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCustomersPage() {
  await requireAdmin();

  const store = loadLocalStore();
  const customers = await getCustomers();
  const orders = store.orders || [];
  const individualDiscounts = store.individualDiscounts || [];

  const customerRows: CustomerRow[] = customers.map((c) => {
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

    const customerReturns = customerOrders.flatMap((o) => o.returns || []);

    return {
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      fullName: `${c.firstName} ${c.lastName}`.trim(),
      email: c.email,
      phone: c.phone || "—",
      createdAt: c.createdAt,
      isActive: true,
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-[#141414] flex items-center gap-2.5">
          <Users className="w-7 h-7 text-[#C5A069]" />
          <span>Zarejestrowane Klientki Butiku</span>
        </h1>
        <p className="text-xs text-[#7E7771] mt-1">
          Przeglądaj zarejestrowane konta klientek, historię ich zamówień i zwrotów oraz zarządzaj indywidualnymi rabatami.
        </p>
      </div>

      <CustomerListClient initialCustomers={customerRows} />
    </div>
  );
}
