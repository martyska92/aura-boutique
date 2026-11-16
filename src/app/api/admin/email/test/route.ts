import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { sendTestEmail, sendWelcomeCustomerEmail, getEmailConfig } from "@/lib/email-service";
import { loadLocalStore, saveLocalStore } from "@/lib/store-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  const store = loadLocalStore();
  const customers = store.customers || [];
  const pendingWelcome = customers.filter((c) => c.welcomeEmailStatus !== "SENT");
  const failedWelcome = customers.filter((c) => c.welcomeEmailStatus === "FAILED");
  const emailOutbox = ((store as any).emailOutbox || []).slice(0, 50);

  return NextResponse.json({
    totalCustomers: customers.length,
    pendingWelcomeCount: pendingWelcome.length,
    failedWelcomeCount: failedWelcome.length,
    pendingEmails: pendingWelcome.map((c) => ({
      email: c.email,
      name: `${c.firstName} ${c.lastName}`.trim(),
      status: c.welcomeEmailStatus || "PENDING",
      error: c.welcomeEmailError,
      createdAt: c.createdAt,
    })),
    emailOutbox: emailOutbox.map((e: any) => ({
      id: e.id,
      to: e.to,
      subject: e.subject,
      type: e.type,
      status: e.status,
      errorMessage: e.errorMessage,
      smtpResponse: e.smtpResponse,
      createdAt: e.createdAt,
      sentAt: e.sentAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const targetEmail = body.targetEmail?.trim() || "aurazmigrod@wp.pl";
    const customSettings = body.settings;

    // Jeśli przekazano ustawienia bezpośrednio z formularza testowego, zapiszmy je do magazynu,
    // aby użytkowniczka nie musiała ręcznie klikać "Zapisz" przed wykonaniem testu
    if (customSettings && (customSettings.smtpPassword || customSettings.resendApiKey || customSettings.smtpHost)) {
      const store = loadLocalStore();
      store.settings = {
        ...(store.settings || {}),
        ...customSettings,
      };
      saveLocalStore(store);
    }

    const config = getEmailConfig(customSettings);
    if (!config.isConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: config.emailProvider === "smtp"
            ? "Poczta SMTP nie jest jeszcze w pełni skonfigurowana. Upewnij się, że wpisano hasło do skrzynki pocztowej."
            : "Brak klucza Resend API. Wprowadź klucz Resend API w panelu.",
        },
        { status: 400 }
      );
    }

    // 0. Ponowienie pojedynczej wiadomości z historii Outbox
    if (body.action === "RETRY_OUTBOX_EMAIL" && body.outboxId) {
      const store = loadLocalStore();
      const item = ((store as any).emailOutbox || []).find((e: any) => e.id === body.outboxId);
      if (!item) {
        return NextResponse.json({ error: "Nie znaleziono wiadomości w historii." }, { status: 404 });
      }
      const { dispatchEmail } = await import("@/lib/email-service");
      const res = await dispatchEmail(
        {
          to: item.to,
          subject: item.subject,
          html: item.html,
          type: item.type,
        },
        customSettings
      );
      if (res.success) {
        item.status = "SENT";
        item.sentAt = new Date().toISOString();
        item.smtpResponse = res.smtpResponse;
        item.errorMessage = undefined;
        saveLocalStore(store);
        return NextResponse.json({ success: true, message: `Pomyślnie wysłano wiadomość do: ${item.to}` });
      } else {
        item.status = "FAILED";
        item.errorMessage = res.error;
        saveLocalStore(store);
        return NextResponse.json({ success: false, error: res.error || "Błąd ponowienia wysyłki." }, { status: 400 });
      }
    }
    if (body.action === "RETRY_FAILED_WELCOME") {
      const store = loadLocalStore();
      const customers = store.customers || [];
      const pendingOrFailed = customers.filter(
        (c) => c.welcomeEmailStatus !== "SENT"
      );

      if (pendingOrFailed.length === 0) {
        return NextResponse.json({
          success: true,
          message: "Wszystkie zarejestrowane klientki otrzymały już mail powitalny! Brak oczekujących wiadomości.",
          count: 0,
        });
      }

      let succeeded = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const customer of pendingOrFailed) {
        const res = await sendWelcomeCustomerEmail(
          {
            customerEmail: customer.email,
            firstName: customer.firstName,
            force: true,
          },
          customSettings
        );

        if (res.success) {
          succeeded++;
          customer.welcomeEmailStatus = "SENT";
          customer.welcomeEmailSentAt = new Date().toISOString();
          customer.welcomeEmailError = undefined;
        } else {
          failed++;
          customer.welcomeEmailStatus = "FAILED";
          customer.welcomeEmailError = res.error;
          if (res.error && !errors.includes(res.error)) {
            errors.push(res.error);
          }
        }
      }

      saveLocalStore(store);

      if (failed > 0 && succeeded === 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Nie udało się wysłać wiadomości powitalnych (${failed} niepowodzeń):\n\n${errors.join("\n\n")}`,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Pomyślnie wysłano wiadomości powitalne do ${succeeded} klientek!${failed > 0 ? ` (${failed} nie powiodło się)` : ""}`,
        succeeded,
        failed,
      });
    }

    // 2. Test wiadomości powitalnej lub standardowej
    let result;
    if (body.type === "WELCOME_CUSTOMER") {
      result = await sendWelcomeCustomerEmail(
        {
          customerEmail: targetEmail,
          firstName: body.firstName || "Martyna",
          force: true,
        },
        customSettings
      );
    } else {
      result = await sendTestEmail(targetEmail, customSettings);
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Nie udało się wysłać testowej wiadomości.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Wiadomość została pomyślnie wysłana na adres ${targetEmail}!`,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Błąd wysyłki e-mail.",
      },
      { status: 500 }
    );
  }
}
