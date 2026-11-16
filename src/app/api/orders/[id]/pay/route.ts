import { NextRequest, NextResponse } from "next/server";
import { getOrderById, getStoreSettings } from "@/lib/store-data";
import {
  isP24Configured,
  registerP24Transaction,
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

    // Bezpieczeństwo zakupów bez konta: weryfikacja accessKey jeśli zamówienie go posiada
    if (order.accessKey && providedAccessKey && order.accessKey !== providedAccessKey) {
      return NextResponse.json(
        { error: "Brak uprawnień do opłacenia tego zamówienia (nieprawidłowy klucz dostępu)." },
        { status: 403 }
      );
    }

    // 1. Zabezpieczenie przed ponowną płatnością za już opłacone zamówienie
    if (order.paymentStatus === "PAID") {
      return NextResponse.json(
        {
          error: "To zamówienie zostało już opłacone. Nie ma konieczności ponawiania płatności.",
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

    // 4. Płatność online (BLIK / Przelewy24)
    if (!isP24Configured(settings)) {
      const missing: string[] = [];
      if (!settings.p24MerchantId && !process.env.P24_MERCHANT_ID) missing.push("ID Sprzedawcy (Merchant ID)");
      if (!settings.p24CrcKey && !process.env.P24_CRC_KEY) missing.push("Klucz CRC");
      if (!settings.p24ApiKey && !process.env.P24_API_KEY) missing.push("Klucz Raportów API");

      return NextResponse.json(
        {
          error: `Bramka płatności online nie jest obecnie skonfigurowana u operatora (brak: ${missing.join(", ")}). W celu opłacenia zamówienia prosimy o wykonanie przelewu tradycyjnego na konto butiku lub kontakt z obsługą.`,
          isConfigured: false,
          missingConfig: missing,
        },
        { status: 400 }
      );
    }

    // Określamy domenę dla urlReturn i urlStatus
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;

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
