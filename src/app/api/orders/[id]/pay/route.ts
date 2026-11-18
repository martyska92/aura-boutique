import { NextRequest, NextResponse } from "next/server";
import { getOrderById, getStoreSettings } from "@/lib/store-data";
import { getUserSession } from "@/lib/admin-auth";
import {
  isP24Configured,
  registerP24Transaction,
  isPayUConfigured,
  registerPayUTransaction,
  getTraditionalTransferDetails,
} from "@/lib/payment-service";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const keyFromUrl = req.nextUrl.searchParams.get("key");
    const providedAccessKey = keyFromUrl || body.accessKey;

    // Pobieramy zamówienie z bazy Neon PostgreSQL / Prisma (z fallbackiem do pamięci lokalnej)
    const order = await getOrderById(id);
    const settings = await getStoreSettings();

    if (!order) {
      console.warn(`[Płatność API] Nie odnaleziono zamówienia: "${id}"`);
      return NextResponse.json(
        {
          error: `Nie odnaleziono zamówienia "${id}". Upewnij się, że używasz prawidłowego linku z potwierdzenia zamówienia.`,
        },
        { status: 404 }
      );
    }

    const session = await getUserSession();
    const isOwnerBySession =
      session &&
      session.email &&
      (session.isAdmin ||
        (order.customerEmail &&
          order.customerEmail.trim().toLowerCase() === session.email.trim().toLowerCase()));

    // Bezpieczeństwo zakupów: weryfikacja accessKey lub aktywnej sesji klientki
    if (order.accessKey) {
      if (providedAccessKey) {
        if (order.accessKey !== providedAccessKey) {
          return NextResponse.json(
            { error: "Brak uprawnień do opłacenia tego zamówienia (nieprawidłowy klucz dostępu)." },
            { status: 403 }
          );
        }
      } else if (!isOwnerBySession) {
        return NextResponse.json(
          { error: "Brak uprawnień do opłacenia tego zamówienia. Zaloguj się lub użyj linku z e-maila." },
          { status: 403 }
        );
      }
    }

    // 1. Zabezpieczenie przed ponowną płatnością za już w pełni opłacone zamówienie
    const isSurchargeRequested =
      Boolean(body.isSurcharge) ||
      order.paymentStatus === "PARTIALLY_PAID" ||
      (order.remainingAmount !== undefined && order.remainingAmount > 0);

    const remainingToPay =
      order.remainingAmount !== undefined
        ? order.remainingAmount
        : (order.paidAmount ? Math.max(0, order.totalAmount - order.paidAmount) : order.totalAmount);

    if (order.paymentStatus === "PAID" && !isSurchargeRequested) {
      return NextResponse.json(
        {
          error: "To zamówienie zostało już opłacone. Nie ma konieczności ponawiania płatności.",
          alreadyPaid: true,
        },
        { status: 400 }
      );
    }

    if (isSurchargeRequested && remainingToPay <= 0) {
      return NextResponse.json(
        {
          error: "Zamówienie zostało już w pełni rozliczone (pozostało do zapłaty: 0,00 zł).",
          alreadyPaid: true,
        },
        { status: 400 }
      );
    }

    if (order.fulfillmentStatus === "CANCELLED") {
      return NextResponse.json(
        { error: "To zamówienie zostało anulowane." },
        { status: 400 }
      );
    }

    // 2. Jeśli wybrano przelew tradycyjny
    if (order.paymentMethod === "TRADITIONAL_TRANSFER") {
      const transferDetails = getTraditionalTransferDetails(order, settings);
      return NextResponse.json({
        success: true,
        method: "TRADITIONAL_TRANSFER",
        transferDetails,
      });
    }

    // 3. Jeśli wybrano płatność za pobraniem
    if (order.paymentMethod === "COD") {
      return NextResponse.json({
        success: true,
        method: "COD",
        message: "Płatność zostanie pobrana przez kuriera przy doręczeniu przesyłki.",
      });
    }

    // Określamy domenę dla powrotu i powiadomień webhook
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;

    // 4. Płatność online PayU (jeśli zamówienie testowe, wybrano PayU lub PayU jest domyślnym operatorem)
    const preferPayU =
      order.isTest ||
      order.paymentMethod === "PAYU" ||
      (settings.defaultPaymentGateway === "PAYU" && isPayUConfigured(settings));

    if (preferPayU) {
      const returnUrl = `${origin}/zamowienie/${order.id}/potwierdzenie?key=${order.accessKey || ""}&check=1`;
      const notifyUrl = `${origin}/api/payments/payu/notify`;

      const payuRes = await registerPayUTransaction({
        order,
        returnUrl,
        notifyUrl,
        customSettings: settings,
        isSurcharge: isSurchargeRequested,
        surchargeAmount: remainingToPay,
      });

      if (!payuRes.success || !payuRes.paymentUrl) {
        return NextResponse.json(
          { error: payuRes.error || "Nie udało się rozpocząć płatności w bramce PayU." },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        paymentUrl: payuRes.paymentUrl,
        operator: "PAYU",
        isTest: Boolean(order.isTest),
      });
    }

    // 5. Płatność online Przelewy24
    if (!isP24Configured(settings)) {
      const missing: string[] = [];
      if (!settings.p24MerchantId && !process.env.P24_MERCHANT_ID) missing.push("ID Sprzedawcy (Merchant ID)");
      if (!settings.p24CrcKey && !process.env.P24_CRC_KEY) missing.push("Klucz CRC");
      if (!settings.p24ApiKey && !process.env.P24_API_KEY) missing.push("Klucz Raportów API");

      return NextResponse.json(
        {
          error: `Bramka płatności online nie jest obecnie skonfigurowana u operatora. W celu opłacenia zamówienia prosimy o wykonanie przelewu tradycyjnego na konto butiku lub kontakt z obsługą.`,
          isConfigured: false,
          missingConfig: missing,
        },
        { status: 400 }
      );
    }

    const returnUrl = `${origin}/zamowienie/${order.id}/potwierdzenie?key=${order.accessKey || ""}&check=1`;
    const statusUrl = `${origin}/api/payments/p24/notify`;

    const p24Res = await registerP24Transaction({
      order,
      returnUrl,
      statusUrl,
    });

    if (!p24Res.success || !p24Res.paymentUrl) {
      return NextResponse.json(
        { error: p24Res.error || "Nie udało się rozpocząć płatności u operatora." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentUrl: p24Res.paymentUrl,
    });
  } catch (err: any) {
    console.error("Błąd podczas uruchamiania płatności:", err);
    return NextResponse.json(
      { error: err.message || "Wystąpił nieoczekiwany błąd płatności." },
      { status: 500 }
    );
  }
}
