import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrderAdmin, loadLocalStore, saveLocalStore } from "@/lib/store-data";
import { verifyPayUNotificationSignature } from "@/lib/payment-service";
import { sendOrderPaymentConfirmedCustomerEmail } from "@/lib/email-service";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader =
      req.headers.get("OpenPayU-Signature") || req.headers.get("openpayu-signature");

    if (!rawBody) {
      return NextResponse.json({ error: "Pusty payload powiadomienia." }, { status: 400 });
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Nieprawidłowy format JSON." }, { status: 400 });
    }

    const payuOrder = payload.order;
    if (!payuOrder) {
      return NextResponse.json({ status: "OK" });
    }

    const extOrderId = payuOrder.extOrderId; // Numer zamówienia w butiku (np. AURA-20261116-5467)
    const payuStatus = payuOrder.status; // COMPLETED, CANCELED, PENDING, WAITING_FOR_CONFIRMATION
    const payuOrderId = payuOrder.orderId;
    const payuCurrency = payuOrder.currencyCode || "PLN";
    const payuTotalAmount = Number(payuOrder.totalAmount);

    const store = loadLocalStore();
    const settings = store.settings;

    // Pobieramy zamówienie z bazy Neon / pamięci
    const order = await getOrderById(extOrderId);

    if (!order) {
      console.warn(`[PayU Webhook] Powiadomienie dla nieistniejącego zamówienia: ${extOrderId}`);
      // Zwracamy 200, aby operator nie ponawiał w nieskończoność żądań dla usuniętych testów
      return NextResponse.json({ status: "OK", warning: "Nie odnaleziono zamówienia." });
    }

    // 1. Weryfikacja kryptograficznego podpisu sygnatury (OpenPayU-Signature)
    const isSignatureValid = verifyPayUNotificationSignature(
      rawBody,
      signatureHeader,
      settings,
      order.isTest
    );
    if (!isSignatureValid) {
      console.warn(
        `[PayU Webhook] Odrzucono powiadomienie PayU: nieprawidłowa sygnatura dla zamówienia ${extOrderId}`
      );
      return NextResponse.json(
        { error: "Nieprawidłowy podpis powiadomienia (OpenPayU-Signature)." },
        { status: 400 }
      );
    }

    // 2. Weryfikacja waluty (musi być ściśle PLN)
    if (payuCurrency !== "PLN") {
      console.warn(
        `[PayU Webhook] Odrzucono powiadomienie: nieobsługiwana waluta ${payuCurrency} dla zamówienia ${extOrderId}`
      );
      return NextResponse.json(
        { error: `Nieobsługiwana waluta płatności: ${payuCurrency}. Oczekiwano PLN.` },
        { status: 400 }
      );
    }

    // 3. Weryfikacja kwoty (w groszach) — kwota z bramki musi odpowiadać kwocie zamówienia po rabacie i dostawie
    const orderGrosze = Math.round(order.totalAmount * 100);
    if (payuTotalAmount !== orderGrosze) {
      console.warn(
        `[PayU Webhook] Rozbieżność kwoty! Zamówienie: ${orderGrosze} gr, Powiadomienie PayU: ${payuTotalAmount} gr`
      );
      return NextResponse.json(
        {
          error: `Rozbieżność kwoty: zamówienie opiewa na ${orderGrosze} gr, a wpłynęło ${payuTotalAmount} gr.`,
        },
        { status: 400 }
      );
    }

    // 4. Idempotentność (ochrona przed opóźnionymi i wielokrotnymi powiadomieniami od operatora)
    if (order.paymentStatus === "PAID") {
      // Zamówienie zostało już opłacone — nie wysyłamy drugiego maila, nie zmieniamy magazynu, nie naliczamy wpłaty powtórnie
      return NextResponse.json({
        status: "OK",
        message: "Zamówienie zostało już wcześniej pomyślnie opłacone i zaksięgowane.",
      });
    }

    // 5. Obsługa statusu COMPLETED (sukces płatności)
    if (payuStatus === "COMPLETED") {
      const now = new Date().toISOString();

      await updateOrderAdmin(order.id, {
        paymentStatus: "PAID",
        adminNotes: `${order.adminNotes ? order.adminNotes + " | " : ""}Opłacono przez PayU (${order.isTest ? "SANDBOX TEST" : "PRODUKCJA"}, ID transakcji: ${payuOrderId})`,
      });

      // Zapisujemy dodatkowe metadane transakcji w pamięci
      const updatedStore = loadLocalStore();
      const ordIdx = updatedStore.orders.findIndex(
        (o) => o.id === order.id || o.orderNumber === order.orderNumber
      );
      if (ordIdx !== -1) {
        updatedStore.orders[ordIdx].paidAt = now;
        (updatedStore.orders[ordIdx] as any).payuOrderId = payuOrderId;
        (updatedStore.orders[ordIdx] as any).paymentOperator = "PAYU";
        (updatedStore.orders[ordIdx] as any).paymentMethodDetails =
          payuOrder.payMethod?.type || "PayU";
        saveLocalStore(updatedStore);
      }

      // Wysłanie e-maila z potwierdzeniem wpłaty klientce (tylko raz, przy pierwszym zaksięgowaniu)
      try {
        await sendOrderPaymentConfirmedCustomerEmail(order, settings);
      } catch (mailErr) {
        console.error("[PayU Webhook] Błąd wysyłki e-mail potwierdzenia zapłaty PayU:", mailErr);
      }
    } else if (payuStatus === "CANCELED") {
      // 6. Obsługa statusu CANCELED (płatność odrzucona / anulowana)
      // Nie kasujemy zamówienia, aby klientka mogła ponowić płatność
      await updateOrderAdmin(order.id, {
        paymentStatus: "FAILED",
        adminNotes: `${order.adminNotes ? order.adminNotes + " | " : ""}Próba płatności PayU została odrzucona/anulowana przez operatora.`,
      });
    }

    return NextResponse.json({ status: "OK" });
  } catch (err: any) {
    console.error("[PayU Webhook] Błąd przetwarzania webhooka PayU:", err);
    return NextResponse.json({ error: err.message || "Błąd serwera" }, { status: 500 });
  }
}
