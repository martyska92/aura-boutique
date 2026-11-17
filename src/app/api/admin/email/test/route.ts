import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { sendTestEmail, sendWelcomeCustomerEmail, getEmailConfig } from "@/lib/email-service";
import { loadLocalStore, saveLocalStore, isNeonConfigured } from "@/lib/store-data";
import { prisma } from "@/lib/prisma";

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
  let emailOutbox = ((store as any).emailOutbox || []).slice(0, 50);

  if (isNeonConfigured()) {
    try {
      const dbOutbox = await prisma.emailOutbox.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
      });
      if (dbOutbox && dbOutbox.length > 0) {
        const dbMapped = dbOutbox.map((d) => {
          let meta: any = {};
          try {
            if (d.metadata) meta = JSON.parse(d.metadata);
          } catch (_) {}
          return {
            id: d.id,
            attemptId: meta.attemptId || d.id,
            configVersion: meta.configVersion || "cfg-v1",
            to: d.recipient,
            subject: d.subject,
            type: d.type,
            status: d.status,
            errorMessage: d.error,
            smtpResponse: meta.smtpResponse,
            createdAt: d.createdAt.toISOString(),
            sentAt: d.sentAt ? d.sentAt.toISOString() : undefined,
          };
        });
        const ids = new Set(dbMapped.map((m) => m.id));
        emailOutbox = [...dbMapped, ...emailOutbox.filter((e: any) => !ids.has(e.id))].slice(0, 50);
      }
    } catch (_) {}
  }

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
      attemptId: e.attemptId || e.id,
      configVersion: e.configVersion || "cfg-v1",
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

    const store = loadLocalStore();
    const { getStoreSettings, updateStoreSettings } = await import("@/lib/store-data");
    const freshStoreSettings = await getStoreSettings();

    const serverSmtpPassword =
      freshStoreSettings.smtpPassword ||
      store.settings?.smtpPassword ||
      process.env.SMTP_PASSWORD ||
      process.env.SMTP_PASS ||
      process.env.WP_MAIL_PASSWORD;
    const serverResendKey =
      freshStoreSettings.resendApiKey ||
      store.settings?.resendApiKey ||
      process.env.RESEND_API_KEY;

    // Połącz przekazane ustawienia z trwale zapisanymi na serwerze
    const effectiveSettings = {
      ...(store.settings || {}),
      ...freshStoreSettings,
      ...(customSettings || {}),
    };

    // Jeśli w formularzu testowym nie wpisano hasła na nowo, użyj zapisanego hasła z serwera
    if ((!effectiveSettings.smtpPassword || effectiveSettings.smtpPassword.trim() === "") && serverSmtpPassword) {
      effectiveSettings.smtpPassword = serverSmtpPassword;
    }
    if ((!effectiveSettings.resendApiKey || effectiveSettings.resendApiKey.trim() === "") && serverResendKey) {
      effectiveSettings.resendApiKey = serverResendKey;
    }

    // Jeśli podano nowe hasło bezpośrednio w teście, zaktualizuj magazyn i bazę trwale
    if (customSettings && customSettings.smtpPassword && customSettings.smtpPassword.trim().length > 0) {
      await updateStoreSettings({ smtpPassword: customSettings.smtpPassword.trim() });
      effectiveSettings.smtpPassword = customSettings.smtpPassword.trim();
    }

    const config = getEmailConfig(effectiveSettings);
    if (!config.isConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: config.emailProvider === "smtp"
            ? "Poczta SMTP nie jest jeszcze w pełni skonfigurowana. Wprowadź hasło do skrzynki w panelu i kliknij Zapisz."
            : "Brak klucza Resend API. Wprowadź klucz Resend API w panelu.",
        },
        { status: 400 }
      );
    }

    // 0. Ponowienie wysyłki e-mail dla wskazanego zamówienia (np. AURA-20261116-5467)
    if (body.action === "RETRY_ORDER_EMAIL" && body.orderId) {
      const order = (store.orders || []).find((o) => o.id === body.orderId || o.orderNumber === body.orderId);
      if (!order) {
        return NextResponse.json({ error: "Nie znaleziono wskazanego zamówienia w bazie." }, { status: 404 });
      }

      // Sprawdź czy to zamówienie miało już wysłaną wiadomość
      const existingSent = ((store as any).emailOutbox || []).find(
        (e: any) => (e.orderId === order.id || e.orderNumber === order.orderNumber) && e.status === "SENT"
      );
      if (existingSent && !body.force) {
        return NextResponse.json({
          success: false,
          error: `Potwierdzenie dla zamówienia ${order.orderNumber} zostało już wysłane w dniu ${new Date(existingSent.sentAt || existingSent.createdAt).toLocaleString("pl-PL")}. Użyj opcji wymuszenia, aby wysłać duplikat.`,
        }, { status: 400 });
      }

      const { sendOrderPlacedCustomerEmail } = await import("@/lib/email-service");
      const res = await sendOrderPlacedCustomerEmail(order, effectiveSettings);
      if (res.success) {
        return NextResponse.json({
          success: true,
          message: `Pomyślnie wysłano potwierdzenie zamówienia ${order.orderNumber} na adres: ${order.customerEmail}.`,
        });
      } else {
        return NextResponse.json({
          success: false,
          error: res.error || "Nie udało się wysłać potwierdzenia zamówienia.",
        }, { status: 400 });
      }
    }

    // 0. Ponowienie pojedynczej wiadomości z historii Outbox
    if (body.action === "RETRY_OUTBOX_EMAIL" && body.outboxId) {
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
        effectiveSettings
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
          effectiveSettings
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
        effectiveSettings
      );
    } else {
      result = await sendTestEmail(targetEmail, effectiveSettings);
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Nie udało się wysłać testowej wiadomości.",
          attemptId: result.attemptId,
          configVersion: result.configVersion,
          timestamp: result.timestamp,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Wiadomość została pomyślnie wysłana na adres ${targetEmail}!`,
      attemptId: result.attemptId,
      configVersion: result.configVersion,
      timestamp: result.timestamp,
      smtpResponse: result.smtpResponse,
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
