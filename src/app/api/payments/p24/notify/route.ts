import { NextRequest, NextResponse } from "next/server";
import { verifyAndProcessP24Notification } from "@/lib/payment-service";
import { sendOrderPaymentConfirmedCustomerEmail } from "@/lib/email-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Brak treści żądania." }, { status: 400 });
    }

    const result = await verifyAndProcessP24Notification(body);

    if (!result.success) {
      console.error("Błąd weryfikacji powiadomienia P24:", result.error);
      return NextResponse.json(
        { status: "ERROR", error: result.error },
        { status: 400 }
      );
    }

    const order = result.order;

    // Jeśli płatność została zweryfikowana po raz pierwszy, wyślij potwierdzenie e-mail
    if (order && !result.alreadyPaid) {
      try {
        await sendOrderPaymentConfirmedCustomerEmail(order);
      } catch (mailErr) {
        // Awaria SMTP nie może blokować płatności ani unieważniać zaksięgowania!
        console.error(
          "Płatność P24 zaksięgowana pomyślnie, lecz wystąpił błąd wysyłki e-mail:",
          mailErr
        );
      }
    }

    // Przelewy24 wymaga odpowiedzi HTTP 200 { status: "OK" }
    return NextResponse.json({ status: "OK" });
  } catch (err: any) {
    console.error("Błąd serwera podczas obsługi webhooka P24:", err);
    return NextResponse.json(
      { status: "ERROR", error: err.message || "Błąd wewnętrzny serwera." },
      { status: 500 }
    );
  }
}
