import nodemailer from "nodemailer";
import { formatDateTimeWarsaw } from "./date-utils";
import { loadLocalStore, saveLocalStore } from "./store-data";
import { StoreSettings } from "./types";

export interface OutboxEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  type: "REFERRAL_JOINED" | "REFERRAL_REWARD" | "REVIEW_REWARD" | "INDIVIDUAL_DISCOUNT" | "ORDER_CONFIRMATION" | "PASSWORD_RESET" | "TEST_EMAIL";
  status: "SENT" | "FAILED" | "NOT_CONFIGURED";
  errorMessage?: string;
  createdAt: string;
  sentAt?: string;
}

/**
 * Szablon e-mail w luksusowej stylistyce butiku AURA
 */
function wrapBoutiqueEmailTemplate(title: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF6F1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #241D1B;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF6F1; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #EADFD5; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 16px rgba(197, 160, 105, 0.1);">
          
          <!-- Nagłówek kaszmirowy ze złotym akcentem -->
          <tr>
            <td align="center" style="background-color: #BCAB9B; padding: 32px 20px; border-bottom: 2px solid #C5A069;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; letter-spacing: 0.15em; color: #241D1B; text-transform: uppercase; font-weight: normal;">
                AURA Boutique K.B.
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; letter-spacing: 0.2em; color: #4A3F3B; text-transform: uppercase;">
                Kobiecość • Klasa • Ponadczasowa Jakość
              </p>
            </td>
          </tr>

          <!-- Treść główna wiadomości -->
          <tr>
            <td style="padding: 36px 30px; font-size: 14px; line-height: 1.6; color: #3E3835;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Stopka wiadomości -->
          <tr>
            <td align="center" style="background-color: #FAF6F1; padding: 24px 20px; border-top: 1px solid #EADFD5; font-size: 11px; color: #857670;">
              <p style="margin: 0 0 6px 0; font-weight: bold; color: #241D1B;">AURA Boutique K.B.</p>
              <p style="margin: 0 0 6px 0;">Żmigród, ul. Poprzeczna 3/1A • Butik stacjonarny & Sklep online</p>
              <p style="margin: 0;">W razie pytań napisz do nas: <a href="mailto:aurazmigrod@wp.pl" style="color: #C5A069; text-decoration: none;">aurazmigrod@wp.pl</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Pobiera aktualną konfigurację wysyłki poczty (z ustawień sklepu w panelu lub zmiennych środowiskowych)
 */
export function getEmailConfig() {
  const store = loadLocalStore();
  const settings: Partial<StoreSettings> = store.settings || {};

  const resendApiKey = (settings.resendApiKey || process.env.RESEND_API_KEY || "").trim();
  const smtpHost = (settings.smtpHost || process.env.SMTP_HOST || "").trim();
  const smtpUser = (settings.smtpUser || process.env.SMTP_USER || "").trim();
  const smtpPassword = (settings.smtpPassword || process.env.SMTP_PASS || process.env.SMTP_PASSWORD || "").trim();
  const smtpPort = Number(settings.smtpPort || process.env.SMTP_PORT || (settings.smtpSecure ? 465 : 587));
  const smtpSecure = settings.smtpSecure !== undefined ? Boolean(settings.smtpSecure) : (smtpPort === 465);

  const senderName = settings.emailSenderName || "AURA Boutique K.B.";
  const senderAddress = settings.emailSenderAddress || smtpUser || process.env.EMAIL_FROM || "aurazmigrod@wp.pl";
  const from = `"${senderName}" <${senderAddress}>`;

  const isConfigured = Boolean(resendApiKey || (smtpHost && smtpUser && smtpPassword));

  return {
    isConfigured,
    resendApiKey,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPassword,
    smtpSecure,
    senderName,
    senderAddress,
    from,
  };
}

/**
 * Sprawdza, czy konfiguracja SMTP lub Resend jest obecna
 */
export function isEmailConfigured(): boolean {
  return getEmailConfig().isConfigured;
}

/**
 * Uniwersalny wysyłacz e-maili (obsługuje SMTP WP.pl / Gmail / dowolne oraz Resend API)
 */
export async function dispatchEmail(options: {
  to: string;
  subject: string;
  html: string;
  type: OutboxEmail["type"];
}): Promise<{ success: boolean; notConfigured?: boolean; error?: string }> {
  const store = loadLocalStore();
  const outboxId = `eml-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const config = getEmailConfig();

  if (!config.isConfigured) {
    const queuedEmail: OutboxEmail = {
      id: outboxId,
      to: options.to,
      subject: options.subject,
      html: options.html,
      type: options.type,
      status: "NOT_CONFIGURED",
      errorMessage: "Brak skonfigurowanej poczty. Podaj dane SMTP (np. poczty WP) lub klucz Resend API w panelu /admin/ustawienia.",
      createdAt: new Date().toISOString(),
    };

    if (!(store as any).emailOutbox) (store as any).emailOutbox = [];
    (store as any).emailOutbox.unshift(queuedEmail);
    saveLocalStore(store);

    return {
      success: false,
      notConfigured: true,
      error: "Poczta e-mail nie jest jeszcze skonfigurowana. Wpisz hasło do poczty w Ustawieniach Butiku.",
    };
  }

  // 1. Jeśli Resend jest skonfigurowany
  if (config.resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.resendApiKey}`,
        },
        body: JSON.stringify({
          from: config.from,
          to: [options.to],
          subject: options.subject,
          html: options.html,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Błąd Resend API (${res.status})`);
      }

      const successEmail: OutboxEmail = {
        id: outboxId,
        to: options.to,
        subject: options.subject,
        html: options.html,
        type: options.type,
        status: "SENT",
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
      };
      if (!(store as any).emailOutbox) (store as any).emailOutbox = [];
      (store as any).emailOutbox.unshift(successEmail);
      saveLocalStore(store);

      return { success: true };
    } catch (err: any) {
      console.error("Błąd wysyłki e-mail przez Resend:", err);
      const failedEmail: OutboxEmail = {
        id: outboxId,
        to: options.to,
        subject: options.subject,
        html: options.html,
        type: options.type,
        status: "FAILED",
        errorMessage: err.message,
        createdAt: new Date().toISOString(),
      };
      if (!(store as any).emailOutbox) (store as any).emailOutbox = [];
      (store as any).emailOutbox.unshift(failedEmail);
      saveLocalStore(store);

      return { success: false, error: err.message };
    }
  }

  // 2. Jeśli SMTP jest skonfigurowany (np. poczta WP.pl lub dowolna skrzynka)
  if (config.smtpHost && config.smtpUser && config.smtpPassword) {
    try {
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPassword,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      await transporter.sendMail({
        from: config.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      const successEmail: OutboxEmail = {
        id: outboxId,
        to: options.to,
        subject: options.subject,
        html: options.html,
        type: options.type,
        status: "SENT",
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
      };
      if (!(store as any).emailOutbox) (store as any).emailOutbox = [];
      (store as any).emailOutbox.unshift(successEmail);
      saveLocalStore(store);

      return { success: true };
    } catch (err: any) {
      console.error("Błąd wysyłki e-mail przez SMTP:", err);
      const failedEmail: OutboxEmail = {
        id: outboxId,
        to: options.to,
        subject: options.subject,
        html: options.html,
        type: options.type,
        status: "FAILED",
        errorMessage: err.message,
        createdAt: new Date().toISOString(),
      };
      if (!(store as any).emailOutbox) (store as any).emailOutbox = [];
      (store as any).emailOutbox.unshift(failedEmail);
      saveLocalStore(store);

      return { success: false, error: err.message };
    }
  }

  return { success: false, notConfigured: true, error: "Brak aktywnego dostawcy poczty." };
}

// ==========================================
// SZABLONY WIADOMOŚCI E-MAIL
// ==========================================

/**
 * 1. Dołączenie do programu poleceń
 */
export async function sendReferralJoinedEmail(params: {
  customerEmail: string;
  customerName: string;
  referralCode: string;
  referralLink: string;
}) {
  const content = `
    <h2 style="font-family: Georgia, serif; font-size: 20px; color: #241D1B; margin-top: 0;">
      Witaj w Programie Poleceń AURA Boutique!
    </h2>
    <p>Dziękujemy, że jesteś z nami, ${params.customerName}. Od teraz możesz dzielić się stylem ze swoimi przyjaciółkami i wspólnie odbierać rabaty.</p>

    <div style="background-color: #FAF6F1; border: 1px solid #DFCA9B; border-radius: 4px; padding: 20px; text-align: center; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #857670;">Twój unikalny kod polecający:</p>
      <div style="font-size: 22px; font-weight: bold; font-family: monospace; letter-spacing: 0.15em; color: #241D1B; background: #ffffff; padding: 10px 16px; border: 1px dashed #C5A069; display: inline-block;">
        ${params.referralCode}
      </div>
      <p style="margin: 12px 0 4px 0; font-size: 12px; color: #5A4E47;">Twój bezpośredni link do udostępnienia:</p>
      <p style="margin: 0; font-size: 11px; word-break: break-all; color: #C5A069;">
        <a href="${params.referralLink}" style="color: #C5A069; text-decoration: underline;">${params.referralLink}</a>
      </p>
    </div>

    <h3 style="font-family: Georgia, serif; font-size: 16px; color: #241D1B; margin-bottom: 8px;">Jak to działa?</h3>
    <ul style="padding-left: 20px; margin: 0 0 20px 0; font-size: 13px;">
      <li style="margin-bottom: 6px;">Podaj swój kod lub link koleżance.</li>
      <li style="margin-bottom: 6px;">Twoja koleżanka otrzyma <strong>–15% rabatu na swoje pierwsze zakupy</strong>.</li>
      <li>Gdy zamówienie koleżanki zostanie doręczone i zrealizowane, Ty automatycznie otrzymasz <strong>–15% rabatu na kolejne zakupy</strong>, ważny przez 30 dni!</li>
    </ul>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://auraboutique.pl"}/konto" style="display: inline-block; background-color: #C5A069; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 2px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: bold;">
        Moje Konto i Polecenia
      </a>
    </div>
  `;

  const html = wrapBoutiqueEmailTemplate("Witaj w Programie Poleceń AURA Boutique!", content);
  return dispatchEmail({
    to: params.customerEmail,
    subject: "Twój kod polecający AURA Boutique – odbierajcie po 15% z przyjaciółkami",
    html,
    type: "REFERRAL_JOINED",
  });
}

/**
 * 2. Przyznanie nagrody za polecenie (15% na 30 dni)
 */
export async function sendReferralRewardEmail(params: {
  customerEmail: string;
  rewardCode: string;
  validUntilIso: string;
}) {
  const formattedDate = formatDateTimeWarsaw(params.validUntilIso);

  const content = `
    <h2 style="font-family: Georgia, serif; font-size: 20px; color: #241D1B; margin-top: 0;">
      Gratulacje! Twoja koleżanka odebrała zamówienie ✨
    </h2>
    <p>Zamówienie złożone z Twojego polecenia zostało pomyślnie zrealizowane. Zgodnie z zasadami programu poleceń, z radością przekazujemy Twój jednorazowy rabat <strong>–15% na kolejne zakupy</strong>!</p>

    <div style="background-color: #FAF6F1; border: 2px solid #C5A069; border-radius: 4px; padding: 24px; text-align: center; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #857670;">Twój kod rabatowy –15%:</p>
      <div style="font-size: 24px; font-weight: bold; font-family: monospace; letter-spacing: 0.2em; color: #241D1B; background: #ffffff; padding: 12px 20px; border: 1px dashed #C5A069; display: inline-block;">
        ${params.rewardCode}
      </div>
      <p style="margin: 14px 0 0 0; font-size: 12px; font-weight: bold; color: #A84B4B;">
        Kod jest ważny do: ${formattedDate} (30 dni)
      </p>
    </div>

    <div style="text-align: center; margin-top: 28px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://auraboutique.pl"}/katalog" style="display: inline-block; background-color: #C5A069; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 2px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: bold;">
        Przejdź do sklepu i wykorzystaj rabat
      </a>
    </div>
  `;

  const html = wrapBoutiqueEmailTemplate("Twój kod nagrody 15% za polecenie!", content);
  return dispatchEmail({
    to: params.customerEmail,
    subject: "Mamy dla Ciebie rabat –15% za udane polecenie w AURA Boutique!",
    html,
    type: "REFERRAL_REWARD",
  });
}

/**
 * 3. Przyznanie rabatu za opinię (2% lub 5% na 30 dni)
 */
export async function sendReviewRewardEmail(params: {
  customerEmail: string;
  displayName: string;
  rewardCode: string;
  discountPercent: number;
  validUntilIso: string;
}) {
  const formattedDate = formatDateTimeWarsaw(params.validUntilIso);

  const content = `
    <h2 style="font-family: Georgia, serif; font-size: 20px; color: #241D1B; margin-top: 0;">
      Dziękujemy za Twoją opinię! 🌸
    </h2>
    <p>Droga ${params.displayName}, Twoja szczera opinia jest dla nas niezwykle cenna i pomaga innym kobietom w wyborze idealnego fasonu.</p>

    <div style="background-color: #FAF6F1; border: 1px solid #DFCA9B; border-radius: 4px; padding: 22px; text-align: center; margin: 24px 0;">
      <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #857670;">Twój kod rabatowy –${params.discountPercent}%:</p>
      <div style="font-size: 22px; font-weight: bold; font-family: monospace; letter-spacing: 0.18em; color: #241D1B; background: #ffffff; padding: 10px 18px; border: 1px dashed #C5A069; display: inline-block;">
        ${params.rewardCode}
      </div>
      <p style="margin: 12px 0 0 0; font-size: 12px; color: #5A4E47;">
        Ważność kodu: dokładnie 30 dni (do ${formattedDate}).
      </p>
    </div>

    <div style="text-align: center; margin-top: 26px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://auraboutique.pl"}/katalog" style="display: inline-block; background-color: #C5A069; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 2px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: bold;">
        Odkryj nowości z rabatem
      </a>
    </div>
  `;

  const html = wrapBoutiqueEmailTemplate("Podziękowanie za opinię i kod rabatowy", content);
  return dispatchEmail({
    to: params.customerEmail,
    subject: `Dziękujemy za opinię! Odbierz swój rabat –${params.discountPercent}% w AURA Boutique`,
    html,
    type: "REVIEW_REWARD",
  });
}

/**
 * 4. Powiadomienie o przyznaniu indywidualnego rabatu przez właścicielkę
 */
export async function sendIndividualDiscountNoticeEmail(params: {
  customerEmail: string;
  discountPercent: number;
  note?: string;
}) {
  const content = `
    <h2 style="font-family: Georgia, serif; font-size: 20px; color: #241D1B; margin-top: 0;">
      Mamy dla Ciebie wyjątkowy prezent! ✨
    </h2>
    <p>Właścicielka butiku AURA Boutique przyznała Twojemu adresowi e-mail stały rabat VIP w wysokości <strong>${params.discountPercent}%</strong>.</p>

    ${params.note ? `<p style="font-style: italic; color: #6E6259; border-left: 2px solid #C5A069; padding-left: 12px;">„${params.note}”</p>` : ""}

    <div style="background-color: #FAF6F1; border: 1px solid #DFCA9B; border-radius: 4px; padding: 18px; text-align: center; margin: 24px 0;">
      <p style="margin: 0; font-size: 13px; color: #241D1B;">
        Rabat nalicza się <strong>automatycznie w Twoim koszyku</strong> po podaniu adresu <strong>${params.customerEmail}</strong>. Nie musisz wpisywać żadnego kodu!
      </p>
    </div>

    <div style="text-align: center; margin-top: 26px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://auraboutique.pl"}/katalog" style="display: inline-block; background-color: #C5A069; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 2px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: bold;">
        Przejdź do butiku
      </a>
    </div>
  `;

  const html = wrapBoutiqueEmailTemplate("Twój stały rabat w AURA Boutique", content);
  return dispatchEmail({
    to: params.customerEmail,
    subject: `Twój indywidualny rabat VIP –${params.discountPercent}% w AURA Boutique K.B.`,
    html,
    type: "INDIVIDUAL_DISCOUNT",
  });
}

/**
 * 5. Test wysyłki poczty e-mail
 */
export async function sendTestEmail(targetEmail: string) {
  const content = `
    <h2 style="font-family: Georgia, serif; font-size: 20px; color: #241D1B; margin-top: 0;">
      Test konfiguracji poczty e-mail w AURA Boutique ✨
    </h2>
    <p>To jest testowa wiadomość potwierdzająca, że wysyłka e-maili (kody rabatowe, powiadomienia o poleceniach i opiniach) działa w 100% poprawnie.</p>
    <div style="background-color: #FAF6F1; border: 1px solid #DFCA9B; border-radius: 4px; padding: 18px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #241D1B;">
        Wszystkie generowane kody rabatowe będą automatycznie trafiać na skrzynki Twoich klientek.
      </p>
    </div>
  `;
  const html = wrapBoutiqueEmailTemplate("Test poczty AURA Boutique", content);
  return dispatchEmail({
    to: targetEmail,
    subject: "Test konfiguracji poczty e-mail | AURA Boutique K.B.",
    html,
    type: "TEST_EMAIL",
  });
}

