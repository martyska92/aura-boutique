import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/admin-auth";
import { loadLocalStore } from "@/lib/store-data";
import { prisma, isNeonConfigured, isDatabaseConnected } from "@/lib/prisma";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: "Wymagane zalogowanie, aby zobaczyć historię zamówień." }, { status: 401 });
    }

    const emailNorm = session.email.trim().toLowerCase();
    const store = loadLocalStore();
    const localCustomer = (store.customers || []).find((c) => c.email.toLowerCase() === emailNorm);

    const ordersMap = new Map<string, Order>();

    // 1. Pobieranie z PostgreSQL / Neon (Prisma)
    if (isNeonConfigured() && (await isDatabaseConnected())) {
      try {
        const dbCust = await prisma.customerAccount.findUnique({
          where: { email: emailNorm },
          select: { id: true },
        });

        const dbOrders = await prisma.order.findMany({
          where: {
            OR: [
              { customerEmail: { equals: emailNorm, mode: "insensitive" } },
              dbCust ? { customerId: dbCust.id } : undefined,
              localCustomer ? { customerId: localCustomer.id } : undefined,
            ].filter(Boolean) as any,
          },
          include: { items: true },
          orderBy: { createdAt: "desc" },
        });

        for (const dbo of dbOrders) {
          const ord: Order = {
            id: dbo.id,
            orderNumber: dbo.orderNumber,
            isTest: Boolean(dbo.isTest),
            customerId: dbo.customerId || undefined,
            customerFirstName: dbo.customerFirstName,
            customerLastName: dbo.customerLastName,
            customerEmail: dbo.customerEmail,
            customerPhone: dbo.customerPhone,
            shippingMethod: dbo.shippingMethod as any,
            parcelLockerCode: dbo.parcelLockerCode || undefined,
            shippingStreet: dbo.shippingStreet || undefined,
            shippingCity: dbo.shippingCity || undefined,
            shippingPostalCode: dbo.shippingPostalCode || undefined,
            paymentMethod: dbo.paymentMethod as any,
            paymentStatus: dbo.paymentStatus as any,
            paidAmount: (dbo as any).paidAmount !== undefined && (dbo as any).paidAmount !== null ? Number((dbo as any).paidAmount) : undefined,
            remainingAmount: (dbo as any).remainingAmount !== undefined && (dbo as any).remainingAmount !== null ? Number((dbo as any).remainingAmount) : undefined,
            payuOrderId: (dbo as any).payuOrderId || undefined,
            accessKey: (dbo as any).accessKey || undefined,
            fulfillmentStatus: dbo.fulfillmentStatus as any,
            trackingNumber: dbo.trackingNumber || undefined,
            subtotalAmount: Number(dbo.subtotalAmount),
            shippingCost: Number(dbo.shippingCost),
            totalAmount: Number(dbo.totalAmount),
            customerNotes: dbo.customerNotes || undefined,
            adminNotes: dbo.adminNotes || undefined,
            reservedUntil: dbo.reservedUntil?.toISOString(),
            wantsInvoice: dbo.wantsInvoice,
            invoiceType: dbo.invoiceType as any,
            invoiceCompanyName: dbo.invoiceCompanyName || undefined,
            invoiceNip: dbo.invoiceNip || undefined,
            items: (dbo.items || []).map((it) => ({
              id: it.id,
              orderId: it.orderId,
              variantId: it.variantId || undefined,
              productNameSnapshot: it.productNameSnapshot,
              variantSnapshot: it.variantSnapshot,
              unitPriceSnapshot: Number(it.unitPriceSnapshot),
              quantity: it.quantity,
              totalSnapshot: Number(it.totalSnapshot),
              productImageUrl: it.productImageUrl || undefined,
            })),
            createdAt: dbo.createdAt.toISOString(),
            updatedAt: dbo.updatedAt.toISOString(),
          };
          ordersMap.set(ord.orderNumber, ord);
        }
      } catch (err) {
        console.warn("[Customer Orders API] Błąd odczytu z Prisma/Neon:", err);
      }
    }

    // 2. Pobieranie z magazynu lokalnego / pamięci (fallback i synchronizacja)
    const localUserOrders = (store.orders || []).filter((o) => {
      const matchesEmail = o.customerEmail && o.customerEmail.trim().toLowerCase() === emailNorm;
      const matchesId = localCustomer && o.customerId && o.customerId === localCustomer.id;
      return matchesEmail || matchesId;
    });

    for (const ord of localUserOrders) {
      if (!ordersMap.has(ord.orderNumber)) {
        ordersMap.set(ord.orderNumber, ord);
      }
    }

    const allOrders = Array.from(ordersMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      orders: allOrders,
      customerEmail: emailNorm,
    });
  } catch (err: any) {
    console.error("[Customer Orders API] Błąd:", err);
    return NextResponse.json({ error: "Błąd podczas pobierania zamówień: " + err.message }, { status: 500 });
  }
}

// Bezpieczne przypisywanie zamówienia gościnnego do konta klientki
export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: "Wymagane logowanie." }, { status: 401 });
    }

    const { orderNumber, accessKey } = await req.json();
    if (!orderNumber || typeof orderNumber !== "string") {
      return NextResponse.json({ error: "Podaj prawidłowy numer zamówienia (np. AURA-...)." }, { status: 400 });
    }

    const cleanNumber = orderNumber.trim().toUpperCase();
    const emailNorm = session.email.trim().toLowerCase();

    const store = loadLocalStore();
    let localCust = (store.customers || []).find((c) => c.email.toLowerCase() === emailNorm);

    let customerId: string | undefined = localCust?.id;
    if (isNeonConfigured() && (await isDatabaseConnected())) {
      try {
        const dbCust = await prisma.customerAccount.findUnique({
          where: { email: emailNorm },
          select: { id: true },
        });
        if (dbCust) customerId = dbCust.id;
      } catch (_) {}
    }

    // Szukamy zamówienia w bazie Neon
    let foundOrder: any = null;
    if (isNeonConfigured() && (await isDatabaseConnected())) {
      try {
        foundOrder = await prisma.order.findUnique({
          where: { orderNumber: cleanNumber },
        });
      } catch (_) {}
    }

    // Szukamy w store lokalnym
    const localOrder = (store.orders || []).find((o) => o.orderNumber.toUpperCase() === cleanNumber);

    if (!foundOrder && !localOrder) {
      return NextResponse.json({ error: `Nie odnaleziono zamówienia o numerze ${cleanNumber}.` }, { status: 404 });
    }

    // Weryfikacja prawa do przypisania zamówienia:
    // 1. Zgodność adresu e-mail z zamówienia z zalogowanym kontem
    // 2. LUB poprawny unikalny token dostępu (accessKey) z e-maila potwierdzającego
    const orderEmail = (foundOrder?.customerEmail || localOrder?.customerEmail || "").trim().toLowerCase();
    const orderAccessKey = foundOrder?.accessKey || localOrder?.accessKey;

    const emailMatches = orderEmail === emailNorm;
    const accessKeyMatches = Boolean(accessKey && orderAccessKey && accessKey.trim() === orderAccessKey.trim());

    if (!emailMatches && !accessKeyMatches) {
      return NextResponse.json(
        {
          error:
            "Adres e-mail zamówienia różni się od Twojego konta. Aby przypisać to zamówienie, podaj klucz dostępu (kod z wiadomości e-mail potwierdzającej zakup).",
          requiresAccessKey: true,
        },
        { status: 403 }
      );
    }

    // Przypisanie zamówienia do konta
    if (foundOrder && isNeonConfigured() && (await isDatabaseConnected())) {
      try {
        await prisma.order.update({
          where: { orderNumber: cleanNumber },
          data: {
            customerId: customerId || undefined,
            customerEmail: emailNorm,
          },
        });
      } catch (err: any) {
        console.warn("Błąd Prisma przy przypisywaniu zamówienia:", err);
      }
    }

    if (localOrder) {
      if (customerId) localOrder.customerId = customerId;
      localOrder.customerEmail = emailNorm;
      const { saveLocalStore } = await import("@/lib/store-data");
      saveLocalStore(store);
    }

    return NextResponse.json({
      success: true,
      message: `Zamówienie ${cleanNumber} zostało pomyślnie przypisane do Twojego konta!`,
    });
  } catch (err: any) {
    console.error("[Customer Orders Claim] Błąd:", err);
    return NextResponse.json({ error: "Błąd podczas przypisywania zamówienia: " + err.message }, { status: 500 });
  }
}
