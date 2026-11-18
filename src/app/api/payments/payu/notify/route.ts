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

    const extOrderId = payuOrder.extOrderId; // Numer zamówienia w butiku (np. AURA-20261116-5467 lub AURA-20261116-5467_DOP_...)
    const payuStatus = payuOrder.status; // COMPLETED, CANCELED, PENDING, WAITING_FOR_CONFIRMATION
    const payuOrderId = payuOrder.orderId;
    const payuCurrency = payuOrder.currencyCode || "PLN";
    const payuTotalAmount = Number(payuOrder.totalAmount);

    const store = loadLocalStore();
    const settings = store.settings;

    // Pobieramy zamówienie z bazy Neon / pamięci (obsługa transakcji dopłaty z sufiksem _DOP)
    const baseOrderId = extOrderId ? extOrderId.split("_DOP")[0].split("_")[0] : "";
    const order = (await getOrderById(extOrderId)) || (baseOrderId ? await getOrderById(baseOrderId) : null);

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

    // 3. Weryfikacja kwoty (w groszach) — kwota z bramki musi odpowiadać kwocie całego zamówienia lub kwocie dopłaty
    const orderGrosze = Math.round(order.totalAmount * 100);
    const remainingGrosze =
      order.remainingAmount !== undefined
        ? Math.round(order.remainingAmount * 100)
        : (order.paidAmount ? Math.round((order.totalAmount - order.paidAmount) * 100) : orderGrosze);

    const isMatchTotal = payuTotalAmount === orderGrosze;
    const isMatchRemaining = payuTotalAmount === remainingGrosze && remainingGrosze > 0;

    if (!isMatchTotal && !isMatchRemaining) {
      console.warn(
        `[PayU Webhook] Rozbieżność kwoty! Zamówienie: ${orderGrosze} gr (pozostało: ${remainingGrosze} gr), Powiadomienie PayU: ${payuTotalAmount} gr`
      );
      return NextResponse.json(
        {
          error: `Rozbieżność kwoty: zamówienie opiewa na ${orderGrosze} gr (pozostało do zapłaty: ${remainingGrosze} gr), a wpłynęło ${payuTotalAmount} gr.`,
        },
        { status: 400 }
      );
    }

    // 4. Idempotentność (ochrona przed opóźnionymi i wielokrotnymi powiadomieniami od operatora)
    if (order.paymentStatus === "PAID" && (!order.remainingAmount || order.remainingAmount <= 0)) {
      // Zamówienie zostało już w pełni opłacone — nie wysyłamy drugiego maila, nie zmieniamy magazynu, nie naliczamy wpłaty powtórnie
      return NextResponse.json({
        status: "OK",
        message: "Zamówienie zostało już wcześniej pomyślnie opłacone i zaksięgowane.",
      });
    }

    // 5. Obsługa statusu COMPLETED (sukces płatności)
    if (payuStatus === "COMPLETED") {
      const now = new Date().toISOString();
      const transactionAmountPln = payuTotalAmount / 100;
      const prevPaidAmount = order.paidAmount || 0;
      const newPaidAmount = prevPaidAmount + transactionAmountPln;
      const newRemaining = Math.max(0, order.totalAmount - newPaidAmount);
      const isFullyPaid = newRemaining <= 0.009;

      let noteText = `Opłacono przez PayU (${order.isTest ? "SANDBOX TEST" : "PRODUKCJA"}, ID transakcji: ${payuOrderId}, kwota: ${transactionAmountPln.toFixed(2)} PLN)`;
      if (order.fulfillmentStatus === "CANCELLED") {
        noteText += ` | [UWAGA: Płatność wpłynęła po anulowaniu/wygaszeniu rezerwacji!]`;
      }

      const updated = await updateOrderAdmin(order.id, {
        paymentStatus: isFullyPaid ? "PAID" : "PARTIALLY_PAID",
        paidAt: order.paidAt || now, // Nie nadpisuje pierwotnej daty pierwszej wpłaty
        paidAmount: newPaidAmount,
        remainingAmount: newRemaining,
        payuOrderId,
        paymentOperator: "PAYU",
        adminNotes: order.adminNotes ? `${order.adminNotes} | ${noteText}` : noteText,
      });

      // Wysłanie e-maila z potwierdzeniem wpłaty klientce (tylko raz, przy pierwszym zaksięgowaniu)
      try {
        await sendOrderPaymentConfirmedCustomerEmail(updated, settings);
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
