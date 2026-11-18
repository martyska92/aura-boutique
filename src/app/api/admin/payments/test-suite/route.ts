import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyAdminSession } from "@/lib/admin-auth";
import {
  createOrder,
  getOrderById,
  updateOrderAdmin,
  loadLocalStore,
  saveLocalStore,
  releaseExpiredOrderReservations,
} from "@/lib/store-data";
import {
  getPayUConfig,
  registerPayUTransaction,
  verifyPayUNotificationSignature,
} from "@/lib/payment-service";
import { calculateOrderPromotions } from "@/lib/promotion-engine";

export interface ScenarioResult {
  id: number;
  name: string;
  description: string;
  passed: boolean;
  durationMs: number;
  details: string;
  assertions: {
    name: string;
    passed: boolean;
    expected: string;
    actual: string;
  }[];
}

export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji administratora." }, { status: 401 });
  }

  const results: ScenarioResult[] = [];
  const sandboxKey = "b6ca15b0d1020e8094d9b5f8d163db54";

  // Pomocnik do podpisywania powiadomień PayU
  const createSignatureHeader = (body: string, key: string = sandboxKey, alg = "SHA-256") => {
    const hash =
      alg === "MD5"
        ? crypto.createHash("md5").update(body + key, "utf-8").digest("hex")
        : crypto.createHash("sha256").update(body + key, "utf-8").digest("hex");
    return `sender=checkout;signature=${hash};algorithm=${alg}`;
  };

  // =========================================================================
  // SCENARIUSZ 1: Płatność zakończona sukcesem (COMPLETED -> PAID)
  // =========================================================================
  {
    const start = Date.now();
    const assertions = [];
    let passed = true;
    let details = "";

    try {
      // 1. Utwórz testowe zamówienie
      const order = await createOrder({
        isTest: true,
        customerFirstName: "Klaudia",
        customerLastName: "Testowa",
        customerEmail: "testerka@auraboutique.pl",
        customerPhone: "500600700",
        shippingMethod: "INPOST_LOCKER",
        parcelLockerCode: "WRO01M",
        paymentMethod: "PAYU",
        paymentStatus: "PENDING",
        fulfillmentStatus: "NEW",
        subtotalAmount: 150.0,
        shippingCost: 13.0,
        totalAmount: 163.0,
        items: [
          {
            id: `item-${Date.now()}-1`,
            orderId: "",
            productNameSnapshot: "Jedwabna Bluzka AURA (Test)",
            variantSnapshot: "S / Kremowy",
            unitPriceSnapshot: 150.0,
            quantity: 1,
            totalSnapshot: 150.0,
          },
        ],
      });

      // 2. Przygotuj powiadomienie COMPLETED z sumą kontrolną SHA-256
      const payuOrderId = `PAYU-TEST-${Date.now()}`;
      const notifyPayload = {
        order: {
          orderId: payuOrderId,
          extOrderId: order.orderNumber,
          orderCreateDate: new Date().toISOString(),
          notifyUrl: "https://aura-boutique.pl/api/payments/payu/notify",
          customerIp: "127.0.0.1",
          merchantPosId: "300746",
          description: `[TEST SANDBOX] Zamówienie ${order.orderNumber}`,
          currencyCode: "PLN",
          totalAmount: "16300",
          status: "COMPLETED",
          payMethod: { type: "CARD_TOKEN" },
        },
      };

      const rawBody = JSON.stringify(notifyPayload);
      const signatureHeader = createSignatureHeader(rawBody, sandboxKey, "SHA-256");

      // Sprawdź autentyczność podpisu po stronie serwera
      const isSigValid = verifyPayUNotificationSignature(rawBody, signatureHeader, undefined, true);
      assertions.push({
        name: "Weryfikacja kryptograficznego podpisu sygnatury SHA-256",
        passed: isSigValid,
        expected: "true",
        actual: String(isSigValid),
      });

      // Wywołaj webhook
      const webhookRes = await fetch(new URL("/api/payments/payu/notify", req.url).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "OpenPayU-Signature": signatureHeader,
        },
        body: rawBody,
      });

      assertions.push({
        name: "Odpowiedź webhooka HTTP 200 OK",
        passed: webhookRes.status === 200,
        expected: "200",
        actual: String(webhookRes.status),
      });

      // Weryfikacja zmiany statusu w bazie
      const updated = await getOrderById(order.id);
      const isPaid = updated?.paymentStatus === "PAID";
      assertions.push({
        name: "Status płatności zaktualizowany na PAID",
        passed: isPaid,
        expected: "PAID",
        actual: updated?.paymentStatus || "null",
      });

      const hasPaidAt = Boolean(updated?.paidAt);
      assertions.push({
        name: "Zapisano znacznik czasu zaksięgowania (paidAt)",
        passed: hasPaidAt,
        expected: "true",
        actual: String(hasPaidAt),
      });

      passed = assertions.every((a) => a.passed);
      details = `Zamówienie ${order.orderNumber} (163.00 PLN) zostało poprawnie zweryfikowane sygnaturą SHA-256 i oznaczone jako opłacone.`;
    } catch (e: any) {
      passed = false;
      details = `Błąd: ${e.message}`;
    }

    results.push({
      id: 1,
      name: "Płatność zakończona sukcesem (COMPLETED -> PAID)",
      description: "Serwer weryfikuje podpis SHA-256, kwotę i walutę, po czym trwale oznacza zamówienie jako PAID.",
      passed,
      durationMs: Date.now() - start,
      details,
      assertions,
    });
  }

  // =========================================================================
  // SCENARIUSZ 2: Płatność odrzucona (CANCELED -> FAILED)
  // =========================================================================
  {
    const start = Date.now();
    const assertions = [];
    let passed = true;
    let details = "";

    try {
      const order = await createOrder({
        isTest: true,
        customerFirstName: "Anna",
        customerLastName: "Odrzucenie",
        customerEmail: "anna.odrzucenie@auraboutique.pl",
        customerPhone: "500111222",
        shippingMethod: "COURIER",
        paymentMethod: "PAYU",
        paymentStatus: "PENDING",
        fulfillmentStatus: "NEW",
        subtotalAmount: 220.0,
        shippingCost: 15.0,
        totalAmount: 235.0,
        items: [],
      });

      const notifyPayload = {
        order: {
          orderId: `PAYU-FAIL-${Date.now()}`,
          extOrderId: order.orderNumber,
          currencyCode: "PLN",
          totalAmount: "23500",
          status: "CANCELED",
        },
      };

      const rawBody = JSON.stringify(notifyPayload);
      const signatureHeader = createSignatureHeader(rawBody, sandboxKey);

      await fetch(new URL("/api/payments/payu/notify", req.url).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "OpenPayU-Signature": signatureHeader,
        },
        body: rawBody,
      });

      const updated = await getOrderById(order.id);
      const isFailed = updated?.paymentStatus === "FAILED";

      assertions.push({
        name: "Status płatności zaktualizowany na FAILED",
        passed: isFailed,
        expected: "FAILED",
        actual: updated?.paymentStatus || "null",
      });

      assertions.push({
        name: "Zamówienie nadal istnieje w bazie (klientka ma prawo ponowić płatność)",
        passed: updated !== null,
        expected: "true",
        actual: String(updated !== null),
      });

      passed = assertions.every((a) => a.passed);
      details = `Płatność ${order.orderNumber} została odrzucona w bramce, status zamówienia to FAILED z zachowaną możliwością ponowienia.`;
    } catch (e: any) {
      passed = false;
      details = `Błąd: ${e.message}`;
    }

    results.push({
      id: 2,
      name: "Płatność odrzucona przez operatora (CANCELED -> FAILED)",
      description: "Obsługa powiadomienia o nieudanej transakcji bez usuwania zamówienia ani duplikowania magazynu.",
      passed,
      durationMs: Date.now() - start,
      details,
      assertions,
    });
  }

  // =========================================================================
  // SCENARIUSZ 3: Przerwanie płatności i powrót do sklepu
  // =========================================================================
  {
    const start = Date.now();
    const assertions = [];
    let passed = true;
    let details = "";

    try {
      const order = await createOrder({
        isTest: true,
        customerFirstName: "Ewa",
        customerLastName: "Powrót",
        customerEmail: "ewa.powrot@auraboutique.pl",
        customerPhone: "500333444",
        shippingMethod: "LOCAL_PICKUP",
        paymentMethod: "PAYU",
        paymentStatus: "PENDING",
        fulfillmentStatus: "NEW",
        subtotalAmount: 180.0,
        shippingCost: 0.0,
        totalAmount: 180.0,
        items: [],
      });

      // Sprawdź status bez webhooka (symulacja powrotu klientki na /zamowienie/[id]/potwierdzenie?check=1)
      const statusRes = await fetch(
        new URL(`/api/orders/${order.id}/status?key=${order.accessKey || ""}`, req.url).toString()
      );
      const statusData = await statusRes.json();

      assertions.push({
        name: "Brak samowolnego oznaczenia jako PAID przy samym powrocie z bramki",
        passed: statusData.paymentStatus === "PENDING",
        expected: "PENDING",
        actual: String(statusData.paymentStatus ?? (statusData.error || "brak")),
      });

      const currentOrder = await getOrderById(order.id);
      assertions.push({
        name: "Zamówienie zachowane w statusie PENDING",
        passed: currentOrder?.paymentStatus === "PENDING",
        expected: "PENDING",
        actual: currentOrder?.paymentStatus || "null",
      });

      passed = assertions.every((a) => a.passed);
      details = `Klientka powracająca do sklepu bez opłacenia widzi rzetelny status PENDING oraz przycisk dokończenia płatności.`;
    } catch (e: any) {
      passed = false;
      details = `Błąd: ${e.message}`;
    }

    results.push({
      id: 3,
      name: "Przerwanie płatności i powrót do sklepu",
      description: "Zapobieganie fałszywym oznaczeniom jako opłacone przy samym powrocie klientki bez webhooka.",
      passed,
      durationMs: Date.now() - start,
      details,
      assertions,
    });
  }

  // =========================================================================
  // SCENARIUSZ 4: Ponowienie płatności za to samo zamówienie
  // =========================================================================
  {
    const start = Date.now();
    const assertions = [];
    let passed = true;
    let details = "";

    try {
      const order = await createOrder({
        isTest: true,
        customerFirstName: "Marta",
        customerLastName: "Ponowienie",
        customerEmail: "marta.ponowienie@auraboutique.pl",
        customerPhone: "500555666",
        shippingMethod: "INPOST_LOCKER",
        parcelLockerCode: "WAW02A",
        paymentMethod: "PAYU",
        paymentStatus: "PENDING",
        fulfillmentStatus: "NEW",
        subtotalAmount: 310.0,
        shippingCost: 13.0,
        totalAmount: 323.0,
        items: [],
      });

      // 1. Pierwsza próba płatności
      const payRes1 = await fetch(
        new URL(`/api/orders/${order.id}/pay?key=${order.accessKey || ""}`, req.url).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessKey: order.accessKey }),
        }
      );
      const data1 = await payRes1.json();

      assertions.push({
        name: "Pierwsza próba: bramka PayU Sandbox zwraca paymentUrl",
        passed: Boolean(data1.paymentUrl),
        expected: "true",
        actual: String(Boolean(data1.paymentUrl)),
      });

      // 2. Druga próba płatności za to samo zamówienie
      const payRes2 = await fetch(
        new URL(`/api/orders/${order.id}/pay?key=${order.accessKey || ""}`, req.url).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessKey: order.accessKey }),
        }
      );
      const data2 = await payRes2.json();

      assertions.push({
        name: "Ponowienie płatności: bramka zwraca nowy/ważny paymentUrl",
        passed: Boolean(data2.paymentUrl),
        expected: "true",
        actual: String(Boolean(data2.paymentUrl)),
      });

      // 3. Weryfikacja braku duplikatów w bazie
      const store = loadLocalStore();
      const duplicateCount = store.orders.filter((o) => o.id === order.id).length;
      assertions.push({
        name: "Brak duplikowania zamówienia w bazie (dokładnie 1 rekord)",
        passed: duplicateCount === 1,
        expected: "1",
        actual: String(duplicateCount),
      });

      passed = assertions.every((a) => a.passed);
      details = `Ponowienie płatności dla zamówienia ${order.orderNumber} wygenerowało nową sesję PayU bez powielania rekordu w bazie.`;
    } catch (e: any) {
      passed = false;
      details = `Błąd: ${e.message}`;
    }

    results.push({
      id: 4,
      name: "Ponowienie płatności za to samo zamówienie",
      description: "Możliwość ponownej rejestracji transakcji w bramce bez tworzenia duplikatów zamówień.",
      passed,
      durationMs: Date.now() - start,
      details,
      assertions,
    });
  }

  // =========================================================================
  // SCENARIUSZ 5: Brak powrotu klientki do sklepu po zapłacie (aktualizacja przez webhook)
  // =========================================================================
  {
    const start = Date.now();
    const assertions = [];
    let passed = true;
    let details = "";

    try {
      const order = await createOrder({
        isTest: true,
        customerFirstName: "Zofia",
        customerLastName: "Webhook",
        customerEmail: "zofia.webhook@auraboutique.pl",
        customerPhone: "500777888",
        shippingMethod: "COURIER",
        paymentMethod: "PAYU",
        paymentStatus: "PENDING",
        fulfillmentStatus: "NEW",
        subtotalAmount: 140.0,
        shippingCost: 15.0,
        totalAmount: 155.0,
        items: [],
      });

      // Klientka zamknęła przeglądarkę na bramce. Przychodzi jedynie powiadomienie IPN w tle
      const notifyPayload = {
        order: {
          orderId: `PAYU-ASYNC-${Date.now()}`,
          extOrderId: order.orderNumber,
          currencyCode: "PLN",
          totalAmount: "15500",
          status: "COMPLETED",
        },
      };

      const rawBody = JSON.stringify(notifyPayload);
      const signatureHeader = createSignatureHeader(rawBody, sandboxKey);

      await fetch(new URL("/api/payments/payu/notify", req.url).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "OpenPayU-Signature": signatureHeader,
        },
        body: rawBody,
      });

      // Sprawdzamy stan zamówienia z punktu widzenia backendu
      const updated = await getOrderById(order.id);
      assertions.push({
        name: "Status zamówienia zaktualizowany na PAID wyłącznie przez powiadomienie IPN",
        passed: updated?.paymentStatus === "PAID",
        expected: "PAID",
        actual: updated?.paymentStatus || "null",
      });

      passed = assertions.every((a) => a.passed);
      details = `Zamówienie ${order.orderNumber} zostało zaktualizowane do PAID wyłącznie przez webhook, niezależnie od przeglądarki klientki.`;
    } catch (e: any) {
      passed = false;
      details = `Błąd: ${e.message}`;
    }

    results.push({
      id: 5,
      name: "Brak powrotu klientki do sklepu (aktualizacja przez webhook)",
      description: "Gwarancja zaksięgowania wpłaty, nawet jeśli klientka zamknie kartę natychmiast po autoryzacji.",
      passed,
      durationMs: Date.now() - start,
      details,
      assertions,
    });
  }

  // =========================================================================
  // SCENARIUSZ 6: Opóźnione i powtórzone powiadomienia (Idempotentność)
  // =========================================================================
  {
    const start = Date.now();
    const assertions = [];
    let passed = true;
    let details = "";

    try {
      const order = await createOrder({
        isTest: true,
        customerFirstName: "Julia",
        customerLastName: "Idempotentna",
        customerEmail: "julia.idempotent@auraboutique.pl",
        customerPhone: "500888999",
        shippingMethod: "INPOST_LOCKER",
        parcelLockerCode: "POZ01B",
        paymentMethod: "PAYU",
        paymentStatus: "PENDING",
        fulfillmentStatus: "NEW",
        subtotalAmount: 199.0,
        shippingCost: 13.0,
        totalAmount: 212.0,
        items: [],
      });

      const notifyPayload = {
        order: {
          orderId: `PAYU-IDEMP-${Date.now()}`,
          extOrderId: order.orderNumber,
          currencyCode: "PLN",
          totalAmount: "21200",
          status: "COMPLETED",
        },
      };

      const rawBody = JSON.stringify(notifyPayload);
      const signatureHeader = createSignatureHeader(rawBody, sandboxKey);

      // Pierwsze powiadomienie
      const res1 = await fetch(new URL("/api/payments/payu/notify", req.url).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "OpenPayU-Signature": signatureHeader,
        },
        body: rawBody,
      });

      assertions.push({
        name: "Pierwsze powiadomienie: przetworzone z sukcesem (HTTP 200)",
        passed: res1.status === 200,
        expected: "200",
        actual: String(res1.status),
      });

      const orderAfterFirst = await getOrderById(order.id);
      const firstPaidAt = orderAfterFirst?.paidAt;

      // Drugie powiadomienie (np. powtórzone przez PayU po 30s)
      const res2 = await fetch(new URL("/api/payments/payu/notify", req.url).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "OpenPayU-Signature": signatureHeader,
        },
        body: rawBody,
      });

      const data2 = await res2.json();
      assertions.push({
        name: "Drugie powiadomienie: obsłużone idempotentnie bez błędu (HTTP 200)",
        passed: res2.status === 200,
        expected: "200",
        actual: String(res2.status),
      });

      assertions.push({
        name: "Wykrycie wcześniejszego opłacenia (ochrona przed wielokrotnym naliczeniem)",
        passed: Boolean(data2.message?.includes("wcześniej")),
        expected: "true",
        actual: String(Boolean(data2.message?.includes("wcześniej"))),
      });

      const orderAfterSecond = await getOrderById(order.id);
      const paidAtUnchanged = orderAfterSecond?.paidAt === firstPaidAt;
      assertions.push({
        name: "Powtórzone powiadomienie nie zmienia pierwotnej daty wpłaty (paidAt)",
        passed: paidAtUnchanged,
        expected: "true",
        actual: String(paidAtUnchanged),
      });

      passed = assertions.every((a) => a.passed);
      details = `Wielokrotne powiadomienia dla ${order.orderNumber} zostały zignorowane bez dublowania wpłat ani wysyłania kolejnych e-maili.`;
    } catch (e: any) {
      passed = false;
      details = `Błąd: ${e.message}`;
    }

    results.push({
      id: 6,
      name: "Opóźnione i powtórzone powiadomienia (Idempotentność)",
      description: "Zabezpieczenie przed podwójnym księgowaniem wpłat i powielaniem powiadomień e-mail.",
      passed,
      durationMs: Date.now() - start,
      details,
      assertions,
    });
  }

  // =========================================================================
  // SCENARIUSZ 7: Poprawność kwoty po rabacie i kosztów dostawy
  // =========================================================================
  {
    const start = Date.now();
    const assertions = [];
    let passed = true;
    let details = "";

    try {
      const store = loadLocalStore();
      const testPromoCode = `TEST15-${Date.now()}`;
      if (!store.promotions) store.promotions = [];
      store.promotions.push({
        id: `promo-test-${Date.now()}`,
        name: "Test 15%",
        code: testPromoCode,
        type: "PERCENTAGE",
        discountValue: 15,
        targetScope: "ALL",
        isActive: true,
        noEndDate: true,
        currentUsageCount: 0,
      } as any);
      saveLocalStore(store);

      const sampleCartItem = {
        productId: "prod-test-1",
        variantId: "var-test-1",
        name: "Sukienka AURA Jedwabna",
        price: 200.0,
        size: "M",
        color: "Kremowy",
        sku: "SUK-TEST-01",
        imageUrl: "",
        quantity: 1,
        maxStock: 10,
      };

      // 1. Koszyk: 200 zł, rabat -15% = -30 zł, InPost 13 zł => 183.00 zł (18300 gr)
      const promo1 = await calculateOrderPromotions({
        cartItems: [sampleCartItem],
        shippingMethod: "INPOST_LOCKER",
        couponCode: testPromoCode,
        customerEmail: "klientka@auraboutique.pl",
        isLoggedIn: true,
      });

      const expectedGroszeInPost = Math.round(promo1.grandTotal * 100);
      assertions.push({
        name: "Kwota po rabacie -15% i dostawie InPost (13 zł) obliczona co do 1 grosza",
        passed: expectedGroszeInPost === 18300,
        expected: "18300 gr (183.00 zł)",
        actual: `${expectedGroszeInPost} gr (${promo1.grandTotal.toFixed(2)} zł)`,
      });

      // 2. Koszyk: 200 zł, rabat -15% = -30 zł, Odbiór osobisty 0 zł => 170.00 zł (17000 gr)
      const promo2 = await calculateOrderPromotions({
        cartItems: [sampleCartItem],
        shippingMethod: "LOCAL_PICKUP",
        couponCode: testPromoCode,
        customerEmail: "klientka@auraboutique.pl",
        isLoggedIn: true,
      });

      const expectedGroszePickup = Math.round(promo2.grandTotal * 100);
      assertions.push({
        name: "Kwota po rabacie -15% i odbiorze osobistym (0 zł) wynosi dokładnie 170.00 zł",
        passed: expectedGroszePickup === 17000,
        expected: "17000 gr (170.00 zł)",
        actual: `${expectedGroszePickup} gr (${promo2.grandTotal.toFixed(2)} zł)`,
      });

      passed = assertions.every((a) => a.passed);
      details = `Kalkulacje promocji i kosztów wysyłki zgadzają się co do 1 grosza z kwotą przekazywaną do bramki PayU.`;
    } catch (e: any) {
      passed = false;
      details = `Błąd: ${e.message}`;
    }

    results.push({
      id: 7,
      name: "Poprawność kwoty po rabacie i kosztów dostawy",
      description: "Weryfikacja matematycznej zgodności kwot w groszach z uwzględnieniem rabatów i form wysyłki.",
      passed,
      durationMs: Date.now() - start,
      details,
      assertions,
    });
  }

  // =========================================================================
  // SCENARIUSZ 8: Zwalnianie rezerwacji produktów i kodu rabatowego po wygaśnięciu
  // =========================================================================
  {
    const start = Date.now();
    const assertions = [];
    let passed = true;
    let details = "";

    try {
      const store = loadLocalStore();
      const testCode = `TEST-WITAJ15-${Date.now()}`;

      // Utwórz konto testowe z kodem rabatowym
      const testCust = {
        id: `cust-exp-${Date.now()}`,
        email: "klientka.rezerwacja@auraboutique.pl",
        firstName: "Karolina",
        lastName: "Rezerwacja",
        welcomeDiscountCode: testCode,
        welcomeDiscountUsed: false,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      if (!store.customers) store.customers = [];
      store.customers.push(testCust as any);
      saveLocalStore(store);

      // Złóż zamówienie z tym kodem
      const order = await createOrder({
        isTest: true,
        customerFirstName: "Karolina",
        customerLastName: "Rezerwacja",
        customerEmail: testCust.email,
        customerPhone: "500999000",
        shippingMethod: "INPOST_LOCKER",
        parcelLockerCode: "KRA01A",
        paymentMethod: "PAYU",
        paymentStatus: "PENDING",
        fulfillmentStatus: "NEW",
        couponCode: testCode,
        subtotalAmount: 170.0,
        shippingCost: 13.0,
        totalAmount: 183.0,
        reservedUntil: new Date(Date.now() - 3600 * 1000).toISOString(), // Już wygasło (1h temu)
        items: [],
      });

      // Sprawdź, czy kod został oznaczony jako zarezerwowany dla tego zamówienia
      const storeAfterOrder = loadLocalStore();
      const custAfterOrder = (storeAfterOrder.customers || []).find((c) => c.id === testCust.id);
      assertions.push({
        name: "Kod rabatowy został pierwotnie zarezerwowany przy składaniu zamówienia",
        passed: custAfterOrder?.welcomeDiscountUsed === true,
        expected: "true",
        actual: String(custAfterOrder?.welcomeDiscountUsed),
      });

      // Wywołaj zwalnianie wygasłych rezerwacji
      const releaseResult = await releaseExpiredOrderReservations(order.id);

      assertions.push({
        name: "Zwolniono wygasłe zamówienie (status CANCELLED)",
        passed: releaseResult.releasedCount === 1,
        expected: "1",
        actual: String(releaseResult.releasedCount),
      });

      // Sprawdź czy kod został odblokowany do ponownego użycia
      const updatedStore = loadLocalStore();
      const custAfterRelease = (updatedStore.customers || []).find((c) => c.id === testCust.id);
      assertions.push({
        name: "Kod rabatowy powitalny został odblokowany (welcomeDiscountUsed = false)",
        passed: custAfterRelease?.welcomeDiscountUsed === false,
        expected: "false",
        actual: String(custAfterRelease?.welcomeDiscountUsed),
      });

      passed = assertions.every((a) => a.passed);
      details = `Wygasłe nieopłacone zamówienie ${order.orderNumber} zostało automatycznie anulowane, a kod rabatowy ${testCode} przywrócony dla klientki.`;
    } catch (e: any) {
      passed = false;
      details = `Błąd: ${e.message}`;
    }

    results.push({
      id: 8,
      name: "Zwalnianie rezerwacji produktów i kodu rabatowego po wygaśnięciu",
      description: "Automatyczne anulowanie nieopłaconego zamówienia z przywróceniem stanów i zwolnieniem kuponu.",
      passed,
      durationMs: Date.now() - start,
      details,
      assertions,
    });
  }

  const allPassed = results.every((r) => r.passed);

  return NextResponse.json({
    success: true,
    allPassed,
    scenariosPassed: results.filter((r) => r.passed).length,
    scenariosTotal: results.length,
    results,
  });
}
