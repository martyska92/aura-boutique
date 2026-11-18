import crypto from "crypto";
import { Order, PaymentMethod, PaymentStatus, StoreSettings } from "./types";
import { loadLocalStore, saveLocalStore } from "./store-data";

export interface P24Config {
  merchantId: number;
  posId: number;
  crcKey: string;
  apiKey: string;
  isSandbox: boolean;
  baseUrl: string;
}

/**
 * Pobiera i waliduje konfigurację operatora Przelewy24
 */
export function getP24Config(customSettings?: Partial<StoreSettings>): P24Config | null {
  const store = loadLocalStore();
  const settings = {
    ...(store.settings || {}),
    ...(customSettings || {}),
  };

  const merchantIdStr = (
    settings.p24MerchantId ||
    process.env.P24_MERCHANT_ID ||
    ""
  ).trim();

  const posIdStr = (
    settings.p24PosId ||
    merchantIdStr ||
    process.env.P24_POS_ID ||
    ""
  ).trim();

  const crcKey = (
    settings.p24CrcKey ||
    process.env.P24_CRC_KEY ||
    ""
  ).trim();

  const apiKey = (
    settings.p24ApiKey ||
    process.env.P24_API_KEY ||
    ""
  ).trim();

  const isSandbox =
    settings.p24Sandbox !== undefined
      ? Boolean(settings.p24Sandbox)
      : process.env.P24_SANDBOX !== "false";

  if (!merchantIdStr || !crcKey || !apiKey) {
    return null;
  }

  const merchantId = Number(merchantIdStr);
  const posId = Number(posIdStr);

  if (isNaN(merchantId) || isNaN(posId)) {
    return null;
  }

  const baseUrl = isSandbox
    ? "https://sandbox.przelewy24.pl"
    : "https://secure.przelewy24.pl";

  return {
    merchantId,
    posId,
    crcKey,
    apiKey,
    isSandbox,
    baseUrl,
  };
}

/**
 * Sprawdza, czy operator płatności online jest poprawnie skonfigurowany
 */
export function isP24Configured(customSettings?: Partial<StoreSettings>): boolean {
  return getP24Config(customSettings) !== null;
}

/**
 * Zwraca listę rzeczywiście dostępnych metod płatności
 */
export function getAvailablePaymentMethods(customSettings?: Partial<StoreSettings>): {
  method: PaymentMethod;
  name: string;
  description: string;
  isAvailable: boolean;
  unavailableReason?: string;
}[] {
  const store = loadLocalStore();
  const settings = {
    ...(store.settings || {}),
    ...(customSettings || {}),
  };

  const p24Ready = isP24Configured(settings);
  const codEnabled = Boolean(settings.codEnabled);

  return [
    {
      method: "BLIK",
      name: "BLIK (Szybka płatność telefonem)",
      description: "Błyskawiczna i bezpieczna płatność 6-cyfrowym kodem BLIK z aplikacji bankowej.",
      isAvailable: p24Ready,
      unavailableReason: p24Ready
        ? undefined
        : "Bramka płatności online nie jest jeszcze aktywna w panelu administratora.",
    },
    {
      method: "PRZELEWY24",
      name: "Szybki przelew online / Przelewy24",
      description: "Wygodna płatność z Twojego banku (mBank, Santander, PKO BP, ING, Pekao i inne).",
      isAvailable: p24Ready,
      unavailableReason: p24Ready
        ? undefined
        : "Bramka płatności online nie jest jeszcze aktywna w panelu administratora.",
    },
    {
      method: "TRADITIONAL_TRANSFER",
      name: "Tradycyjny przelew bankowy",
      description: "Samodzielna wpłata na oficjalny rachunek bankowy butiku (rezerwacja na 72h).",
      isAvailable: true,
    },
    {
      method: "COD",
      name: "Płatność przy odbiorze (Pobranie)",
      description: "Opłać zamówienie kurierowi gotówką lub kartą przy doręczeniu paczki.",
      isAvailable: codEnabled,
      unavailableReason: codEnabled
        ? undefined
        : "Płatność za pobraniem jest obecnie wyłączona przez administratora sklepu.",
    },
  ];
}

/**
 * Oblicza sumę kontrolną SHA-384 dla żądania rejestracji transakcji P24
 */
export function calculateP24RegisterSign(params: {
  sessionId: string;
  merchantId: number;
  amount: number; // w groszach
  currency: string;
  crcKey: string;
}): string {
  const json = JSON.stringify({
    sessionId: params.sessionId,
    merchantId: params.merchantId,
    amount: params.amount,
    currency: params.currency,
    crc: params.crcKey,
  });
  return crypto.createHash("sha384").update(json).digest("hex");
}

/**
 * Oblicza oczekiwaną sumę kontrolną powiadomienia (webhook) z P24
 */
export function calculateP24NotificationSign(params: {
  merchantId: number;
  posId: number;
  sessionId: string;
  amount: number;
  originAmount: number;
  currency: string;
  orderId: number;
  methodId: number;
  statement: string;
  crcKey: string;
}): string {
  const json = JSON.stringify({
    merchantId: params.merchantId,
    posId: params.posId,
    sessionId: params.sessionId,
    amount: params.amount,
    originAmount: params.originAmount,
    currency: params.currency,
    orderId: params.orderId,
    methodId: params.methodId,
    statement: params.statement,
    crc: params.crcKey,
  });
  return crypto.createHash("sha384").update(json).digest("hex");
}

/**
 * Rejestruje transakcję w Przelewy24 i zwraca adres do przekierowania klientki
 */
export async function registerP24Transaction(params: {
  order: Order;
  returnUrl: string;
  statusUrl: string;
  channel?: number; // np. 64 dla BLIK, lub pominięte
}): Promise<{
  success: boolean;
  paymentUrl?: string;
  token?: string;
  sessionId?: string;
  error?: string;
}> {
  const config = getP24Config();
  if (!config) {
    return {
      success: false,
      error:
        "Bramka płatności Przelewy24 nie jest w pełni skonfigurowana. Uzupełnij ID Sprzedawcy (Merchant ID), Klucz CRC i Klucz Raportów w panelu /admin/ustawienia.",
    };
  }

  // Kwota w groszach (zaokrąglona matematycznie)
  const amountGrosze = Math.round(params.order.totalAmount * 100);
  if (amountGrosze <= 0) {
    return {
      success: false,
      error: "Kwota zamówienia do zapłaty musi być większa niż zero.",
    };
  }

  // Unikalny identyfikator sesji transakcji
  const sessionId = `AURA-${params.order.id}-${Date.now()}`;
  const sign = calculateP24RegisterSign({
    sessionId,
    merchantId: config.merchantId,
    amount: amountGrosze,
    currency: "PLN",
    crcKey: config.crcKey,
  });

  const payload: any = {
    merchantId: config.merchantId,
    posId: config.posId,
    sessionId,
    amount: amountGrosze,
    currency: "PLN",
    description: `Zamówienie ${params.order.orderNumber} - AURA Boutique K.B.`,
    email: params.order.customerEmail,
    client: `${params.order.customerFirstName} ${params.order.customerLastName}`.trim(),
    phone: params.order.customerPhone || undefined,
    country: "PL",
    language: "pl",
    urlReturn: params.returnUrl,
    urlStatus: params.statusUrl,
    sign,
    waitForResult: true,
  };

  // Jeśli wybrano BLIK jako preferowany kanał
  if (params.order.paymentMethod === "BLIK") {
    payload.channel = 64; // P24 BLIK channel
  }

  const authHeader = `Basic ${Buffer.from(`${config.merchantId}:${config.apiKey}`).toString("base64")}`;

  try {
    const res = await fetch(`${config.baseUrl}/api/v1/transaction/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const resJson = await res.json().catch(() => ({}));

    if (!res.ok || !resJson?.data?.token) {
      const p24Err = resJson?.error || resJson?.message || `Błąd P24 (${res.status})`;
      console.error("Błąd rejestracji w P24:", p24Err, resJson);
      return {
        success: false,
        error: `Operator płatności odrzucił żądanie: ${p24Err}`,
      };
    }

    const token = resJson.data.token;
    const paymentUrl = `${config.baseUrl}/trnRequest/${token}`;

    // Zapisujemy sessionId w zamówieniu
    const store = loadLocalStore();
    const orderIndex = store.orders.findIndex((o) => o.id === params.order.id);
    if (orderIndex !== -1) {
      store.orders[orderIndex].p24SessionId = sessionId;
      store.orders[orderIndex].paymentOperator = "PRZELEWY24";
      saveLocalStore(store);
    }

    return {
      success: true,
      paymentUrl,
      token,
      sessionId,
    };
  } catch (err: any) {
    console.error("Błąd sieci podczas rejestracji P24:", err);
    return {
      success: false,
      error: `Błąd połączenia z operatorem płatności: ${err.message}`,
    };
  }
}

/**
 * Weryfikuje powiadomienie (webhook) od operatora Przelewy24 i potwierdza transakcję w P24 API
 */
export async function verifyAndProcessP24Notification(notificationBody: any): Promise<{
  success: boolean;
  order?: Order;
  alreadyPaid?: boolean;
  error?: string;
}> {
  const config = getP24Config();
  if (!config) {
    return { success: false, error: "Brak konfiguracji P24 na serwerze." };
  }

  const {
    merchantId,
    posId,
    sessionId,
    amount,
    originAmount,
    currency,
    orderId,
    methodId,
    statement,
    sign,
  } = notificationBody || {};

  if (!sessionId || !amount || !sign) {
    return { success: false, error: "Brak wymaganych pól w powiadomieniu P24." };
  }

  // 1. Sprawdzenie sumy kontrolnej powiadomienia
  const calculatedSign = calculateP24NotificationSign({
    merchantId: Number(merchantId),
    posId: Number(posId),
    sessionId,
    amount: Number(amount),
    originAmount: Number(originAmount || amount),
    currency: currency || "PLN",
    orderId: Number(orderId),
    methodId: Number(methodId),
    statement: statement || "",
    crcKey: config.crcKey,
  });

  if (calculatedSign.toLowerCase() !== String(sign).toLowerCase()) {
    console.error("Błąd podpisu powiadomienia P24! Oczekiwano:", calculatedSign, "Otrzymano:", sign);
    return { success: false, error: "Nieprawidłowy podpis powiadomienia (SHA-384)." };
  }

  // 2. Znalezienie zamówienia po sessionId lub id zawartym w sessionId
  const store = loadLocalStore();
  let targetOrder = store.orders.find((o) => o.p24SessionId === sessionId);

  if (!targetOrder) {
    // SessionId ma format "AURA-{orderId}-{timestamp}"
    const parts = sessionId.split("-");
    if (parts.length >= 2) {
      const extractedId = parts.slice(1, -1).join("-") || parts[1];
      targetOrder = store.orders.find((o) => o.id === extractedId || o.orderNumber === extractedId);
    }
  }

  if (!targetOrder) {
    return {
      success: false,
      error: `Nie znaleziono zamówienia powiązanego z sesją P24: ${sessionId}`,
    };
  }

  // 3. Sprawdzenie zgodności kwoty i waluty
  const orderGrosze = Math.round(targetOrder.totalAmount * 100);
  if (orderGrosze !== Number(amount)) {
    console.error(
      `Rozbieżność kwoty w P24! Zamówienie: ${orderGrosze} gr, Płatność: ${amount} gr`
    );
    return {
      success: false,
      error: `Niezgodność kwoty: zamówienie opiewa na ${orderGrosze} gr, a wpłynęło ${amount} gr.`,
    };
  }

  if (currency && currency !== "PLN") {
    return { success: false, error: `Nieobsługiwana waluta płatności: ${currency}` };
  }

  // 4. Idempotentność: jeśli zamówienie zostało już wcześniej opłacone, nie wysyłaj ponownie maili
  if (targetOrder.paymentStatus === "PAID") {
    return {
      success: true,
      order: targetOrder,
      alreadyPaid: true,
    };
  }

  // 5. Ostateczna weryfikacja transakcji w API P24 (PUT /api/v1/transaction/verify)
  const verifySign = calculateP24RegisterSign({
    sessionId,
    merchantId: config.merchantId,
    amount: Number(amount),
    currency: "PLN",
    crcKey: config.crcKey,
  });

  const authHeader = `Basic ${Buffer.from(`${config.merchantId}:${config.apiKey}`).toString("base64")}`;

  try {
    const verifyRes = await fetch(`${config.baseUrl}/api/v1/transaction/verify`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        merchantId: config.merchantId,
        posId: config.posId,
        sessionId,
        amount: Number(amount),
        currency: "PLN",
        orderId: Number(orderId),
        sign: verifySign,
      }),
    });

    const verifyJson = await verifyRes.json().catch(() => ({}));

    if (!verifyRes.ok || verifyJson?.data?.status !== "success") {
      const errDetail = verifyJson?.error || `Błąd weryfikacji P24 (${verifyRes.status})`;
      console.error("Błąd weryfikacji transakcji w API P24:", errDetail, verifyJson);
      return {
        success: false,
        error: `Weryfikacja u operatora nie powiodła się: ${errDetail}`,
      };
    }
  } catch (err: any) {
    console.error("Błąd sieci podczas weryfikacji P24:", err);
    return {
      success: false,
      error: `Błąd sieci podczas potwierdzania transakcji w P24: ${err.message}`,
    };
  }

  // 6. Bezpieczna aktualizacja statusu zamówienia w bazie
  const now = new Date().toISOString();
  targetOrder.paymentStatus = "PAID";
  targetOrder.paidAt = now;
  targetOrder.p24OrderId = Number(orderId);
  targetOrder.p24SessionId = sessionId;
  targetOrder.paymentOperator = "PRZELEWY24";
  targetOrder.updatedAt = now;

  // Ważne: NIE zmieniamy fulfillmentStatus automatycznie na READY_FOR_SHIPMENT.
  // Zamówienie pozostaje w statusie realizacji "NEW" lub "PROCESSING", gotowe do spakowania przez właścicielkę.
  if (targetOrder.fulfillmentStatus === "CANCELLED") {
    targetOrder.fulfillmentStatus = "NEW";
  }

  saveLocalStore(store);

  return {
    success: true,
    order: targetOrder,
    alreadyPaid: false,
  };
}

/**
 * Generuje dane do tradycyjnego przelewu bankowego
 */
export function getTraditionalTransferDetails(
  order: Order,
  customSettings?: Partial<StoreSettings>
): {
  recipient: string;
  accountNumber: string;
  bankName: string;
  amount: number;
  title: string;
  deadlineHours: number;
  formattedAmount: string;
} {
  const store = loadLocalStore();
  const settings = {
    ...(store.settings || {}),
    ...(customSettings || {}),
  };

  const recipient = (
    settings.bankAccountRecipient ||
    settings.companyName ||
    "AURA BOUTIQUE KLAUDIA BIAŁEK"
  ).trim();

  const accountNumber = (
    settings.bankAccountNumber ||
    "52 1090 2398 0000 0001 5482 9102"
  ).trim();

  const bankName = (settings.bankName || "Santander Bank Polska S.A.").trim();
  const title = `Zamówienie ${order.orderNumber}`;

  return {
    recipient,
    accountNumber,
    bankName,
    amount: order.totalAmount,
    title,
    deadlineHours: 72,
    formattedAmount: `${order.totalAmount.toFixed(2)} PLN`,
  };
}

/**
 * Generuje bezpieczny klucz dostępu (token) do zamówienia bez konta
 */
export function generateOrderAccessKey(): string {
  return `acc_${crypto.randomBytes(16).toString("hex")}`;
}

// ==========================================
// INTEGRACJA OPERATORA PŁATNOŚCI PAYU
// ==========================================

export interface PayUConfig {
  posId: string;
  secondKey: string;
  clientId: string;
  clientSecret: string;
  isSandbox: boolean;
  baseUrl: string;
}

export function getPayUConfig(customSettings?: Partial<StoreSettings>, forceSandbox?: boolean): PayUConfig | null {
  const store = loadLocalStore();
  const settings = {
    ...(store.settings || {}),
    ...(customSettings || {}),
  };

  const isSandbox = forceSandbox !== undefined ? forceSandbox : settings.payuSandbox !== false;

  // Domyślne oficjalne dane publicznego środowiska PayU Sandbox (do bezpiecznego testowania bez kosztów)
  const officialSandboxPosId = "300746";
  const officialSandboxClientId = "300746";
  const officialSandboxSecret = "2ee86a66e5d97e3fadc400c9f19b065d";
  const officialSandboxSecondKey = "b6ca15b0d1020e8094d9b5f8d163db54";

  let posId = "";
  let secondKey = "";
  let clientId = "";
  let clientSecret = "";

  if (isSandbox) {
    posId = (
      settings.payuPosIdSandbox ||
      process.env.PAYU_POS_ID_SANDBOX ||
      officialSandboxPosId
    ).trim();

    secondKey = (
      settings.payuSecondKeySandbox ||
      process.env.PAYU_SECOND_KEY_SANDBOX ||
      officialSandboxSecondKey
    ).trim();

    clientId = (
      settings.payuClientIdSandbox ||
      process.env.PAYU_CLIENT_ID_SANDBOX ||
      posId ||
      officialSandboxClientId
    ).trim();

    clientSecret = (
      settings.payuClientSecretSandbox ||
      process.env.PAYU_CLIENT_SECRET_SANDBOX ||
      officialSandboxSecret
    ).trim();
  } else {
    // Środowisko PRODUKCYJNE — klucze wyłącznie z konfiguracji produkcyjnej lub zmiennych serwera
    posId = (settings.payuPosId || process.env.PAYU_POS_ID || "").trim();
    secondKey = (settings.payuSecondKey || process.env.PAYU_SECOND_KEY || "").trim();
    clientId = (settings.payuClientId || posId || process.env.PAYU_CLIENT_ID || "").trim();
    clientSecret = (settings.payuClientSecret || process.env.PAYU_CLIENT_SECRET || "").trim();
  }

  if (!posId || !secondKey) {
    return null;
  }

  const baseUrl = isSandbox
    ? "https://secure.snd.payu.com"
    : "https://secure.payu.com";

  return {
    posId,
    secondKey,
    clientId: clientId || posId,
    clientSecret: clientSecret || secondKey,
    isSandbox,
    baseUrl,
  };
}

export function isPayUConfigured(customSettings?: Partial<StoreSettings>): boolean {
  const store = loadLocalStore();
  const settings = {
    ...(store.settings || {}),
    ...(customSettings || {}),
  };
  if (settings.payuEnabled === false) return false;
  return getPayUConfig(settings) !== null;
}

/**
 * Uzyskuje token autoryzacyjny OAuth2 w PayU
 */
export async function getPayUAccessToken(
  config: PayUConfig
): Promise<{ success: boolean; accessToken?: string; error?: string }> {
  try {
    const tokenUrl = `${config.baseUrl}/pl/standard/user/oauth/authorize`;
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", config.clientId);
    params.append("client_secret", config.clientSecret);

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.access_token) {
      return {
        success: false,
        error: data.error_description || data.error || `Błąd uwierzytelnienia PayU (${res.status})`,
      };
    }

    return { success: true, accessToken: data.access_token };
  } catch (err: any) {
    return { success: false, error: err.message || "Błąd połączenia z serwerem OAuth PayU" };
  }
}

/**
 * Rejestruje transakcję płatności w bramce PayU (REST v2.1)
 */
export async function registerPayUTransaction({
  order,
  returnUrl,
  notifyUrl,
  customerIp = "127.0.0.1",
  customSettings,
  isSurcharge,
  surchargeAmount,
}: {
  order: Order;
  returnUrl: string;
  notifyUrl: string;
  customerIp?: string;
  customSettings?: Partial<StoreSettings>;
  isSurcharge?: boolean;
  surchargeAmount?: number;
}): Promise<{
  success: boolean;
  paymentUrl?: string;
  payuOrderId?: string;
  error?: string;
}> {
  const config = getPayUConfig(customSettings, order.isTest);
  if (!config) {
    return { success: false, error: "Brak skonfigurowanych danych dostępowych PayU." };
  }

  const tokenRes = await getPayUAccessToken(config);
  if (!tokenRes.success || !tokenRes.accessToken) {
    return { success: false, error: tokenRes.error || "Nie udało się uzyskać tokenu autoryzacji PayU." };
  }

  try {
    const isSurchargeTx =
      Boolean(isSurcharge) ||
      (order.paymentStatus === "PARTIALLY_PAID" && Boolean(order.remainingAmount && order.remainingAmount > 0));

    const chargeAmountPln = isSurchargeTx
      ? surchargeAmount || order.remainingAmount || order.totalAmount
      : order.totalAmount;

    const totalAmountGrosze = Math.round(chargeAmountPln * 100);

    const buyer = {
      email: order.customerEmail || "klientka@auraboutique.pl",
      phone: order.customerPhone || "",
      firstName: order.customerFirstName || "Klientka",
      lastName: order.customerLastName || "Boutique",
      language: "pl",
    };

    let products: { name: string; unitPrice: number; quantity: number }[] = [];

    if (isSurchargeTx) {
      products = [
        {
          name: `Dopłata do zamówienia ${order.orderNumber}`,
          unitPrice: totalAmountGrosze,
          quantity: 1,
        },
      ];
    } else {
      products = (order.items || []).map((item) => ({
        name: item.productNameSnapshot || "Produkt AURA",
        unitPrice: Math.round(item.unitPriceSnapshot * 100),
        quantity: item.quantity,
      }));

      if (order.shippingCost && order.shippingCost > 0) {
        products.push({
          name: `Dostawa: ${order.shippingMethod}`,
          unitPrice: Math.round(order.shippingCost * 100),
          quantity: 1,
        });
      }
    }

    const txExtOrderId = isSurchargeTx
      ? `${order.orderNumber}_DOP_${Date.now()}`
      : order.orderNumber;

    const txDescription = isSurchargeTx
      ? `[DOPŁATA] Zamówienie ${order.orderNumber} - AURA Boutique`
      : order.isTest
      ? `[TEST SANDBOX] Zamówienie ${order.orderNumber} - AURA Boutique`
      : `Zamówienie ${order.orderNumber} w AURA Boutique`;

    const orderPayload = {
      notifyUrl,
      continueUrl: returnUrl,
      customerIp: customerIp.includes(":") ? "127.0.0.1" : customerIp,
      merchantPosId: config.posId,
      description: txDescription,
      currencyCode: "PLN",
      totalAmount: totalAmountGrosze.toString(),
      extOrderId: txExtOrderId,
      buyer,
      products,
    };

    const res = await fetch(`${config.baseUrl}/api/v2_1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenRes.accessToken}`,
      },
      body: JSON.stringify(orderPayload),
      redirect: "manual", // PayU może zwrócić 302 z RedirectUri w nagłówku Location
    });

    // PayU zwraca status 302 lub 200/201 z JSONem zawierającym redirectUri
    if (res.status === 302) {
      const location = res.headers.get("location");
      if (location) {
        return { success: true, paymentUrl: location };
      }
    }

    const data = await res.json().catch(() => ({}));

    if (data.redirectUri) {
      return {
        success: true,
        paymentUrl: data.redirectUri,
        payuOrderId: data.orderId,
      };
    }

    if (data.status && data.status.statusCode !== "SUCCESS") {
      return {
        success: false,
        error: data.status.statusDesc || "PayU odrzuciło utworzenie zamówienia.",
      };
    }

    return {
      success: false,
      error: "Nie otrzymano adresu przekierowania płatności z PayU.",
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Błąd sieci podczas łączenia z PayU." };
  }
}

/**
 * Weryfikuje podpis sygnatury powiadomienia webhooka PayU (OpenPayU-Signature)
 */
export function verifyPayUNotificationSignature(
  rawBody: string,
  signatureHeader: string | null,
  customSettings?: Partial<StoreSettings>,
  isSandboxOrder?: boolean
): boolean {
  if (!signatureHeader || !rawBody) return false;

  // Nagłówek ma format: sender=...;signature=...;algorithm=SHA-256;...
  const parts = signatureHeader.split(";").reduce((acc: Record<string, string>, part) => {
    const [k, v] = part.split("=");
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});

  const expectedSignature = parts.signature;
  const algorithm = (parts.algorithm || "SHA-256").toUpperCase();

  if (!expectedSignature) return false;

  const config = getPayUConfig(customSettings, isSandboxOrder);
  const candidateKeys: string[] = [];

  if (config?.secondKey) {
    candidateKeys.push(config.secondKey);
  }

  // Zawsze dołączamy oficjalny klucz sandbox jako zapasowy dla powiadomień testowych
  const officialSandboxKey = "b6ca15b0d1020e8094d9b5f8d163db54";
  if (!candidateKeys.includes(officialSandboxKey)) {
    candidateKeys.push(officialSandboxKey);
  }

  for (const secondKey of candidateKeys) {
    const dataToHash = rawBody + secondKey;
    let computedSignature = "";

    if (algorithm === "MD5") {
      computedSignature = crypto.createHash("md5").update(dataToHash, "utf-8").digest("hex");
    } else {
      computedSignature = crypto.createHash("sha256").update(dataToHash, "utf-8").digest("hex");
    }

    if (computedSignature.toLowerCase() === expectedSignature.toLowerCase()) {
      return true;
    }
  }

  return false;
}

/**
 * Testuje połączenie z operatorem PayU (weryfikacja kluczy POS)
 */
export async function testPayUConnection(
  customSettings?: Partial<StoreSettings>
): Promise<{ success: boolean; message: string; isSandbox: boolean }> {
  const config = getPayUConfig(customSettings);
  if (!config) {
    return {
      success: false,
      message: "Brak wpisanego POS ID lub Drugiego Klucza (MD5) w ustawieniach PayU.",
      isSandbox: true,
    };
  }

  const tokenRes = await getPayUAccessToken(config);
  if (!tokenRes.success) {
    return {
      success: false,
      message: `Błąd połączenia z PayU (${config.isSandbox ? "Sandbox" : "Produkcja"}): ${tokenRes.error}`,
      isSandbox: config.isSandbox,
    };
  }

  return {
    success: true,
    message: `Pomyślnie nawiązano połączenie z bramką PayU (${config.isSandbox ? "Środowisko Testowe Sandbox" : "Środowisko Produkcyjne"}). Token autoryzacyjny został wygenerowany poprawnie.`,
    isSandbox: config.isSandbox,
  };
}
