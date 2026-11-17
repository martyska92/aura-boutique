import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrderAdmin, loadLocalStore, saveLocalStore } from "@/lib/store-data";
import { verifyPayUNotificationSignature } from "@/lib/payment-service";
import { sendOrderPaymentConfirmedCustomerEmail } from "@/lib/email-service";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("OpenPayU-Signature") || req.headers.get("openpayu-signature");

    const store = loadLocalStore();
    const settings = store.settings;

    // Weryfikacja autentyczności powiadomienia na podstawie Drugiego Klucza (MD5/SHA256)
    const isSignatureValid = verifyPayUNotificationSignature(rawBody, signatureHeader, settings);
    if (!isSignatureValid) {
      console.warn("Odrzucono powiadomienie PayU: nieprawidłowa sygnatura");
      return NextResponse.json({ error: "Nieprawidłowy podpis powiadomienia." }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const payuOrder = payload.order;
    if (!payuOrder) {
      return NextResponse.json({ status: "OK" });
    }

    const extOrderId = payuOrder.extOrderId; // Numer zamówienia w sklepie (np. AURA-20261116-5467)
    const payuStatus = payuOrder.status; // COMPLETED, CANCELED, PENDING, WAITING_FOR_CONFIRMATION
    const payuOrderId = payuOrder.orderId;

    const order = store.orders.find(
      (o) => o.orderNumber === extOrderId || o.id === extOrderId
    );

    if (!order) {
      console.warn(`Powiadomienie PayU dla nieistniejącego zamówienia: ${extOrderId}`);
      return NextResponse.json({ status: "OK" });
    }

    // Zabezpieczenie przed wielokrotnym przetwarzaniem tego samego powiadomienia
    if (order.paymentStatus === "PAID" && payuStatus === "COMPLETED") {
      return NextResponse.json({ status: "OK" });
    }

    if (payuStatus === "COMPLETED") {
      order.paymentStatus = "PAID";
      order.updatedAt = new Date().toISOString();
      (order as any).payuOrderId = payuOrderId;
      (order as any).paymentOperator = "PAYU";
      (order as any).paymentMethodDetails = payuOrder.payMethod?.type || "PayU";

      saveLocalStore(store);

      // Wysłanie e-maila z potwierdzeniem wpłaty (błąd SMTP nie cofa statusu opłacenia)
      try {
        await sendOrderPaymentConfirmedCustomerEmail(order, settings);
      } catch (mailErr) {
        console.error("Błąd wysyłki e-mail potwierdzenia zapłaty PayU:", mailErr);
      }
    } else if (payuStatus === "CANCELED") {
      // Rezerwacja może nadal obowiązywać w wyznaczonym oknie czasowym, oznaczamy próbę jako nieudaną
      if (order.paymentStatus !== "PAID") {
        order.paymentStatus = "FAILED";
        order.updatedAt = new Date().toISOString();
        saveLocalStore(store);
      }
    }

    return NextResponse.json({ status: "OK" });
  } catch (err: any) {
    console.error("Błąd przetwarzania webhooka PayU:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
