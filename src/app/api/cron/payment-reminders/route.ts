import { NextRequest, NextResponse } from "next/server";
import { loadLocalStore, saveLocalStore } from "@/lib/store-data";
import { sendOrderPaymentReminderCustomerEmail } from "@/lib/email-service";
import { prisma, isNeonConfigured, isDatabaseConnected } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Automatyczne przypomnienia o płatności:
 * Dla zamówień ze statusem PENDING lub PARTIALLY_PAID lub FAILED,
 * złożonych ponad 30 minut temu i nieopłaconych, wysyłane jest najwyżej JEDNO przypomnienie.
 */
export async function GET(req: NextRequest) {
  try {
    const store = loadLocalStore();
    const now = Date.now();
    const THIRTY_MINUTES_MS = 30 * 60 * 1000;

    const candidateOrders = (store.orders || []).filter((o) => {
      // Tylko zamówienia nieopłacone
      const isUnpaid = o.paymentStatus === "PENDING" || o.paymentStatus === "PARTIALLY_PAID" || o.paymentStatus === "FAILED";
      if (!isUnpaid) return false;

      // Bez COD
      if (o.paymentMethod === "COD") return false;

      // Najwyżej jedno przypomnienie
      if (o.paymentReminderSentAt) return false;

      // Minęło co najmniej 30 minut od złożenia
      const createdTime = new Date(o.createdAt).getTime();
      return now - createdTime >= THIRTY_MINUTES_MS;
    });

    const sentOrders: string[] = [];

    for (const ord of candidateOrders) {
      try {
        await sendOrderPaymentReminderCustomerEmail(ord, store.settings);
        ord.paymentReminderSentAt = new Date().toISOString();
        sentOrders.push(ord.orderNumber);

        // Zapis w bazie Neon
        if (isNeonConfigured() && (await isDatabaseConnected())) {
          try {
            await prisma.order.update({
              where: { id: ord.id },
              data: {
                adminNotes: ord.adminNotes
                  ? `${ord.adminNotes}\n[${new Date().toISOString()}] Wysłano automatyczne przypomnienie o płatności (30 min).`
                  : `[${new Date().toISOString()}] Wysłano automatyczne przypomnienie o płatności (30 min).`,
              },
            });
          } catch (_) {}
        }
      } catch (mailErr) {
        console.warn(`Błąd wysyłki przypomnienia dla zamówienia ${ord.orderNumber}:`, mailErr);
      }
    }

    if (sentOrders.length > 0) {
      saveLocalStore(store);
    }

    return NextResponse.json({
      success: true,
      processedCount: candidateOrders.length,
      sentOrders,
      message: `Przetworzono ${candidateOrders.length} zamówień, wysłano ${sentOrders.length} przypomnień.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
