import nodemailer from "nodemailer";
import { formatDateTimeWarsaw } from "./date-utils";
import { loadLocalStore, saveLocalStore } from "./store-data";
import { StoreSettings, Order } from "./types";

export interface OutboxEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  type:
    | "REFERRAL_JOINED"
    | "REFERRAL_REWARD"
    | "REVIEW_REWARD"
    | "INDIVIDUAL_DISCOUNT"
    | "ORDER_CONFIRMATION"
    | "ORDER_PLACED"
    | "ORDER_PAID"
    | "ORDER_SHIPPED"
    | "ORDER_CANCELLED"
    | "ORDER_PAYMENT_FAILED"
    | "RETURN_REQUESTED"
    | "RETURN_STATUS_UPDATED"
    | "PASSWORD_RESET"
    | "PASSWORD_CHANGED"
    | "TEST_EMAIL"
    | "WELCOME_CUSTOMER";
  status: "SENT" | "FAILED" | "NOT_CONFIGURED";
  errorMessage?: string;
  createdAt: string;
  sentAt?: string;
  smtpResponse?: string;
  messageId?: string;
}

/**
 * Szablon e-mail w luksusowej stylistyce butiku AURA
 */
function wrapBoutiqueEmailTemplate(title: string, contentHtml: string): string {
  const storeUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aura-boutique-w38e.vercel.app";
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
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #EADFD5; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 16px rgba(197, 160, 105, 0.08);">
          
          <!-- Nagłówek beżowo-kaszmirowy z czystym logo AURA (bez złotej poświaty) -->
          <tr>
            <td align="center" style="background-color: #FAF6F1; padding: 28px 20px 22px; border-bottom: 2px solid #C5A069;">
              <a href="${storeUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="${storeUrl}/images/brand/aura-logo.png" alt="AURA Boutique K.B." width="200" style="display: block; max-width: 200px; width: 100%; height: auto; border: 0; margin: 0 auto;" />
              </a>
              <p style="margin: 8px 0 0 0; font-size: 11px; letter-spacing: 0.22em; color: #857670; text-transform: uppercase;">
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
 * Formatowanie błędów serwera SMTP do czytelnej, pomocnej instrukcji
 * Bezpieczeństwo: nigdy nie ujawnia ani nie zapisuje haseł w treści błędu ani w logach.
 */
export function formatSmtpError(err: any, config: { smtpHost: string; smtpUser: string }): string {
  const msg = String(err?.message || err || "");
  const response = String(err?.response || "");
  const code = String(err?.code || "");
  const responseCode = err?.responseCode;

  const is535 =
    msg.includes("535") ||
    response.includes("535") ||
    responseCode === 535 ||
    code === "EAUTH" ||
    msg.toLowerCase().includes("invalid login") ||
    msg.toLowerCase().includes("smtp access disabled") ||
    msg.toLowerCase().includes("authentication failed");

  if (is535 && config.smtpHost.toLowerCase().includes("wp.pl")) {
    return (
      `Błąd serwera poczty WP.pl (kod 535: Invalid login / SMTP access disabled).\n\n` +
      `Serwer pocztowy WP odrzucił połączenie. Aby aktywować wysyłkę e-mail ze skrzynki WP:\n` +
      `1. Zaloguj się przez przeglądarkę na https://poczta.wp.pl\n` +
      `2. Kliknij ikonę koła zębatego (Ustawienia) w prawym górnym rogu → wybierz „Wszystkie opcje”.\n` +
      `3. Przejdź do zakładki: „Dostęp przez POP3/IMAP/SMTP” (Programy pocztowe).\n` +
      `4. WŁĄCZ opcję: „Zezwalaj na dostęp do poczty za pomocą protokołów POP3/IMAP/SMTP”. W WP jest ona domyślnie wyłączona ze względów bezpieczeństwa.\n` +
      `5. Sprawdź, czy wpisane hasło do skrzynki jest prawidłowe (jeśli w profilu WP masz włączoną weryfikację dwuetapową 2FA / kodem SMS, musisz w panelu WP wygenerować „Hasło do aplikacji”).\n` +
      `6. Loginem musi być pełny adres e-mail: ${config.smtpUser}.`
    );
  }

  if (is535) {
    return (
      `Błąd autoryzacji serwera SMTP (kod 535: Dane logowania niepoprawne lub dostęp SMTP zablokowany).\n` +
      `Sprawdź, czy login (${config.smtpUser}) oraz hasło są poprawne i czy w opcjach skrzynki włączono dostęp SMTP.`
    );
  }

  return `Błąd serwera SMTP (${config.smtpHost}): ${msg}`;
}

/**
 * Pobiera aktualną konfigurację wysyłki poczty (z ustawień sklepu w panelu lub zmiennych środowiskowych)
 */
export function getEmailConfig(customSettings?: Partial<StoreSettings>) {
  const store = loadLocalStore();
  const settings: Partial<StoreSettings> = {
    ...(store.settings || {}),
    ...(customSettings || {}),
  };

  // Określ providera poczty:
  // Domyślnie zawsze SMTP (poczta WP.pl lub własny serwer).
  // Resend jest używany TYLKO wtedy, gdy użytkowniczka jawnie wybierze providera "resend".
  let emailProvider: "smtp" | "resend" = "smtp";
  if (settings.emailProvider === "resend") {
    emailProvider = "resend";
  } else {
    emailProvider = "smtp";
  }

  const resendApiKey = (settings.resendApiKey || process.env.RESEND_API_KEY || "").trim();
  const smtpHost = (settings.smtpHost || process.env.SMTP_HOST || "smtp.wp.pl").trim();

  // 1. Pełny adres skrzynki jako login (np. aurazmigrod@wp.pl dla serwera WP.pl)
  let smtpUser = (settings.smtpUser || process.env.SMTP_USER || "aurazmigrod@wp.pl").trim();
  if (smtpHost.toLowerCase().includes("wp.pl") && smtpUser && !smtpUser.includes("@")) {
    smtpUser = `${smtpUser}@wp.pl`;
  }

  // 2. Wczytywanie hasła ze zmiennych środowiskowych oraz konfiguracji panelu
  const smtpPassword = (
    settings.smtpPassword ||
    process.env.SMTP_PASSWORD ||
    process.env.SMTP_PASS ||
    process.env.WP_MAIL_PASSWORD ||
    process.env.EMAIL_PASSWORD ||
    ""
  ).trim();

  const smtpPort = Number(settings.smtpPort || process.env.SMTP_PORT || (settings.smtpSecure ? 465 : 587));
  const smtpSecure = settings.smtpSecure !== undefined ? Boolean(settings.smtpSecure) : (smtpPort === 465);

  // 3. Zgodność nadawcy z kontem pocztowym (dla WP.pl adres nadawcy musi odpowiadać zalogowanemu użytkownikowi)
  const senderName = settings.emailSenderName || "AURA Boutique K.B.";
  const senderAddress = (smtpHost.toLowerCase().includes("wp.pl") || !settings.emailSenderAddress)
    ? smtpUser
    : (settings.emailSenderAddress || smtpUser).trim();
  const from = `"${senderName}" <${senderAddress}>`;

  const isConfigured = emailProvider === "smtp"
    ? Boolean(smtpHost && smtpUser && smtpPassword)
    : Boolean(resendApiKey);

  return {
    emailProvider,
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
export async function dispatchEmail(
  options: {
    to: string;
    subject: string;
    html: string;
    type: OutboxEmail["type"];
  },
  customSettings?: Partial<StoreSettings>
): Promise<{
  success: boolean;
  notConfigured?: boolean;
  error?: string;
  smtpResponse?: string;
  messageId?: string;
  accepted?: any[];
  alreadySent?: boolean;
}> {
  const store = loadLocalStore();
  const outboxId = `eml-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  let effectiveSettings = customSettings;
  let config = getEmailConfig(effectiveSettings);

  if (!config.isConfigured) {
    try {
      const { getStoreSettings } = await import("./store-data");
      const freshSettings = await getStoreSettings();
      effectiveSettings = {
        ...freshSettings,
        ...(customSettings || {}),
      };
      if (!effectiveSettings.smtpPassword && freshSettings.smtpPassword) {
        effectiveSettings.smtpPassword = freshSettings.smtpPassword;
      }
      if (!effectiveSettings.resendApiKey && freshSettings.resendApiKey) {
        effectiveSettings.resendApiKey = freshSettings.resendApiKey;
      }
      config = getEmailConfig(effectiveSettings);
    } catch (_) {}
  }

  if (!config.isConfigured) {
    const errorMsg = config.emailProvider === "smtp"
      ? "Brak skonfigurowanej poczty SMTP. Wprowadź hasło do skrzynki pocztowej WP (aurazmigrod@wp.pl) w panelu /admin/ustawienia."
      : "Brak klucza Resend API. Wprowadź klucz Resend API w panelu /admin/ustawienia.";

    const queuedEmail: OutboxEmail = {
      id: outboxId,
      to: options.to,
      subject: options.subject,
      html: options.html,
      type: options.type,
      status: "NOT_CONFIGURED",
      errorMessage: errorMsg,
      createdAt: new Date().toISOString(),
    };

    if (!(store as any).emailOutbox) (store as any).emailOutbox = [];
    (store as any).emailOutbox.unshift(queuedEmail);
    saveLocalStore(store);

    return {
      success: false,
      notConfigured: true,
      error: errorMsg,
    };
  }

  // 1. Jeśli wybrano SMTP (np. poczta WP.pl)
  if (config.emailProvider === "smtp") {
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

      const sendInfo = await transporter.sendMail({
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
        smtpResponse: sendInfo.response,
        messageId: sendInfo.messageId,
      };
      if (!(store as any).emailOutbox) (store as any).emailOutbox = [];
      (store as any).emailOutbox.unshift(successEmail);
      saveLocalStore(store);

      return {
        success: true,
        smtpResponse: sendInfo.response,
        messageId: sendInfo.messageId,
      };
    } catch (err: any) {
      // Bezpieczeństwo: logujemy jedynie treść błędu serwera, bez haseł
      const formattedError = formatSmtpError(err, config);
      console.error("Błąd wysyłki e-mail przez SMTP:", err?.message || err);

      const failedEmail: OutboxEmail = {
        id: outboxId,
        to: options.to,
        subject: options.subject,
        html: options.html,
        type: options.type,
        status: "FAILED",
        errorMessage: formattedError,
        createdAt: new Date().toISOString(),
      };
      if (!(store as any).emailOutbox) (store as any).emailOutbox = [];
      (store as any).emailOutbox.unshift(failedEmail);
      saveLocalStore(store);

      return { success: false, error: formattedError };
    }
  }

  // 2. Jeśli wybrano Resend API
  if (config.emailProvider === "resend" && config.resendApiKey) {
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
        let rawMsg = errJson.message || `Błąd Resend API (${res.status})`;
        if (rawMsg.toLowerCase().includes("domain is not verified") || rawMsg.toLowerCase().includes("wp.pl")) {
          rawMsg = `Resend odrzucił adres nadawcy (${config.from}): ${rawMsg}\n\n` +
            `Wyjaśnienie: Usługa Resend wymaga zweryfikowania własnej domeny firmowej w DNS (np. kontakt@twojadomena.pl). Nie pozwala na wysyłkę z publicznych skrzynek takich jak @wp.pl czy @gmail.com.\n` +
            `Rozwiązanie: W panelu w zakładce Ustawienia zmień sposób wysyłki na «Poczta WP.pl / Własny serwer SMTP», wpisz hasło do skrzynki aurazmigrod@wp.pl i kliknij Zapisz.`;
        }
        throw new Error(rawMsg);
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
      console.error("Błąd wysyłki e-mail przez Resend:", err?.message || err);
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

  return {
    success: false,
    error: "Nieznany lub nieobsługiwany dostawca e-mail.",
  };
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
export async function sendTestEmail(
  targetEmail: string,
  customSettings?: Partial<StoreSettings>
) {
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
  return dispatchEmail(
    {
      to: targetEmail,
      subject: "Test konfiguracji poczty e-mail | AURA Boutique K.B.",
      html,
      type: "TEST_EMAIL",
    },
    customSettings
  );
}

/**
 * 6. Automatyczny mail powitalny po założeniu konta przez klientkę
 */
export async function sendWelcomeCustomerEmail(
  params: {
    customerEmail: string;
    firstName?: string;
    welcomeDiscountCode?: string;
    force?: boolean;
  },
  customSettings?: Partial<StoreSettings>
): Promise<{ success: boolean; notConfigured?: boolean; error?: string; alreadySent?: boolean }> {
  const store = loadLocalStore();
  const normalizedEmail = params.customerEmail.trim().toLowerCase();

  // Pobieramy lub generujemy trwały kod rabatowy dla klientki
  let code = params.welcomeDiscountCode;
  const customer = (store.customers || []).find(
    (c) => c.email.trim().toLowerCase() === normalizedEmail
  );

  if (!code && customer?.welcomeDiscountCode) {
    code = customer.welcomeDiscountCode;
  }

  if (!code) {
    code = `WITAJ15-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    if (customer) {
      customer.welcomeDiscountCode = code;
      saveLocalStore(store);
    }
  }

  // Zabezpieczenie przed duplikatem: sprawdź czy mail powitalny nie został już wysłany na ten adres ze statusem SENT
  // Jeśli wysyłka została odrzucona (FAILED) lub nie była skonfigurowana, NIE uznajemy jej za wysłaną i pozwalamy na ponowienie.
  if (!params.force) {
    const alreadySent = ((store as any).emailOutbox || []).some(
      (e: OutboxEmail) =>
        e.to.toLowerCase() === normalizedEmail &&
        e.type === "WELCOME_CUSTOMER" &&
        e.status === "SENT"
    );
    if (alreadySent) {
      return { success: true, alreadySent: true };
    }
  }

  const storeUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aura-boutique-w38e.vercel.app";
  const greeting = params.firstName && params.firstName.trim()
    ? `Cześć, ${params.firstName.trim()}!`
    : "Cześć!";

  const content = `
    <div style="font-size: 15px; color: #241D1B; line-height: 1.7;">
      <p style="font-size: 18px; font-weight: 600; color: #241D1B; margin: 0 0 16px 0;">
        ${greeting}
      </p>

      <p style="margin: 0 0 16px 0;">
        Dziękujemy za dołączenie do AURA BOUTIQUE! 💛 Cieszymy się, że jesteś z nami.
      </p>

      <p style="margin: 0 0 20px 0;">
        Na powitanie mamy dla Ciebie <strong>15% rabatu</strong> na pierwsze zamówienie.
      </p>

      <!-- Karta z unikalnym kodem powitalnym -->
      <div style="background-color: #FAF6F1; border: 2px dashed #C5A069; border-radius: 6px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em; color: #7A6458; display: block; margin-bottom: 6px;">
          Twój unikalny kod rabatowy:
        </span>
        <span style="font-size: 26px; font-family: monospace; font-weight: bold; color: #241D1B; letter-spacing: 2px;">
          ${code}
        </span>
      </div>

      <p style="margin: 0 0 24px 0; text-align: center; color: #3E3835; font-size: 14px;">
        Wpisz go w koszyku i wybierz coś dla siebie!
      </p>

      <!-- Przycisk „Zrób zakupy” -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${storeUrl}/katalog" style="display: inline-block; background-color: #C5A069; color: #ffffff; text-decoration: none; padding: 14px 38px; border-radius: 3px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.16em; font-weight: 600; box-shadow: 0 2px 8px rgba(197, 160, 105, 0.25);">
          Zrób zakupy
        </a>
      </div>

      <!-- Warunki promocji -->
      <div style="background-color: #FAF9F7; border-left: 3px solid #C5A069; padding: 14px 18px; font-size: 11px; color: #6E6259; line-height: 1.6; margin: 24px 0;">
        <strong style="color: #241D1B;">Warunki promocji powitalnej:</strong><br>
        • Kod uprawnia do jednorazowego rabatu 15% na produkty w Twoim pierwszym zamówieniu (nie obejmuje kosztów dostawy).<br>
        • Kod jest przypisany do Twojego adresu e-mail (${normalizedEmail}) i nie łączy się z innymi kodami rabatowymi.<br>
        • Wpisz go w koszyku w polu «Kod rabatowy» przed zatwierdzeniem zamówienia.
      </div>

      <p style="margin: 24px 0 0 0; color: #5A4E47; font-size: 14px; line-height: 1.6;">
        Do zobaczenia w butiku,<br>
        <strong style="color: #241D1B;">Zespół AURA BOUTIQUE</strong>
      </p>
    </div>
  `;

  const html = wrapBoutiqueEmailTemplate("Witaj w AURA BOUTIQUE! Odbierz −15% na pierwsze zamówienie 💛", content);

  const res = await dispatchEmail(
    {
      to: normalizedEmail,
      subject: "Witaj w AURA BOUTIQUE! Odbierz −15% na pierwsze zamówienie 💛",
      html,
      type: "WELCOME_CUSTOMER",
    },
    customSettings
  );

  return res;
}

/**
 * Szablon tabeli rozbicia finansowego zamówienia dla wiadomości e-mail
 */
export function renderOrderFinancialBreakdownHtml(order: Order): string {
  const originalSubtotal =
    order.originalSubtotal !== undefined
      ? order.originalSubtotal
      : order.items.reduce(
          (sum, it) => sum + (it.originalTotalSnapshot || it.totalSnapshot),
          0
        );

  const discountAmount =
    order.discountAmount !== undefined
      ? order.discountAmount
      : Math.max(0, Math.round((originalSubtotal - order.subtotalAmount) * 100) / 100);

  const subtotalAfterDiscount = order.subtotalAmount;
  const shippingCost = order.shippingCost;
  const totalAmount = order.totalAmount;

  let promoRows = "";
  if (discountAmount > 0) {
    if (order.appliedPromotions && order.appliedPromotions.length > 0) {
      promoRows = order.appliedPromotions
        .map(
          (p) => `
        <tr>
          <td style="padding: 6px 0; color: #166534; font-size: 13px;">Rabat (${p.name}${p.code ? ` - kod: ${p.code}` : ""}):</td>
          <td style="padding: 6px 0; color: #166534; font-weight: 600; text-align: right; font-size: 13px;">-${p.discountAmount.toFixed(2)} PLN</td>
        </tr>
      `
        )
        .join("");
    } else {
      promoRows = `
        <tr>
          <td style="padding: 6px 0; color: #166534; font-size: 13px;">Zastosowany rabat:</td>
          <td style="padding: 6px 0; color: #166534; font-weight: 600; text-align: right; font-size: 13px;">-${discountAmount.toFixed(2)} PLN</td>
        </tr>
      `;
    }
  }

  const itemsRows = order.items
    .map((it) => {
      const hasDiscount =
        (it.originalUnitPrice &&
          it.discountedUnitPrice &&
          it.discountedUnitPrice < it.originalUnitPrice) ||
        (it.discountAmount && it.discountAmount > 0);

      const unitPriceDisplay = hasDiscount
        ? `<span style="text-decoration: line-through; color: #857670; margin-right: 6px;">${(
            it.originalUnitPrice || it.unitPriceSnapshot
          ).toFixed(2)} PLN</span><strong style="color: #AF884F;">${(
            it.discountedUnitPrice || it.unitPriceSnapshot
          ).toFixed(2)} PLN</strong>`
        : `<span>${it.unitPriceSnapshot.toFixed(2)} PLN</span>`;

      return `
      <tr style="border-bottom: 1px solid #FAF6F1;">
        <td style="padding: 10px 0; vertical-align: top;">
          <strong style="color: #241D1B; font-size: 13px;">${it.productNameSnapshot}</strong>
          <div style="font-size: 12px; color: #857670;">${it.variantSnapshot}</div>
          ${
            it.appliedPromoName
              ? `<div style="font-size: 11px; color: #166534; margin-top: 2px;">Promocja: ${it.appliedPromoName}</div>`
              : ""
          }
          <div style="font-size: 12px; color: #6E6259; margin-top: 2px;">${it.quantity} szt. × ${unitPriceDisplay}</div>
        </td>
        <td style="padding: 10px 0; text-align: right; vertical-align: top; font-weight: 600; color: #241D1B; font-size: 13px;">
          ${it.totalSnapshot.toFixed(2)} PLN
        </td>
      </tr>
    `;
    })
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 1px solid #EADFD5;">
          <th align="left" style="padding-bottom: 8px; font-size: 11px; text-transform: uppercase; color: #857670; letter-spacing: 0.1em;">Zamówiony artykuł</th>
          <th align="right" style="padding-bottom: 8px; font-size: 11px; text-transform: uppercase; color: #857670; letter-spacing: 0.1em;">Wartość</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px; border-top: 1px solid #EADFD5; padding-top: 12px;">
      <tr>
        <td style="padding: 6px 0; color: #6E6259; font-size: 13px;">Wartość produktów przed rabatem:</td>
        <td style="padding: 6px 0; color: #241D1B; text-align: right; font-size: 13px;">${originalSubtotal.toFixed(2)} PLN</td>
      </tr>
      ${promoRows}
      <tr>
        <td style="padding: 6px 0; color: #6E6259; font-size: 13px;">Wartość produktów po rabacie:</td>
        <td style="padding: 6px 0; color: #241D1B; font-weight: 500; text-align: right; font-size: 13px;">${subtotalAfterDiscount.toFixed(2)} PLN</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #6E6259; font-size: 13px;">Koszt dostawy:</td>
        <td style="padding: 6px 0; color: #241D1B; text-align: right; font-size: 13px;">${shippingCost === 0 ? "0,00 PLN (Darmowa)" : shippingCost.toFixed(2) + " PLN"}</td>
      </tr>
      <tr style="border-top: 2px solid #EADFD5;">
        <td style="padding: 12px 0 6px; font-size: 15px; font-weight: bold; color: #241D1B;">Łączna kwota do zapłaty:</td>
        <td style="padding: 12px 0 6px; font-size: 17px; font-weight: bold; color: #AF884F; text-align: right;">${totalAmount.toFixed(2)} PLN</td>
      </tr>
    </table>
  `;
}

/**
 * 7. E-mail o przyjęciu zamówienia (po złożeniu przez klientkę - oczekuje na płatność)
 * Zgodnie z wytycznymi: nie sugeruje otrzymania zapłaty, podaje instrukcję i rzeczywisty status
 */
export async function sendOrderPlacedCustomerEmail(
  order: Order,
  customSettings?: Partial<StoreSettings>
): Promise<{ success: boolean; notConfigured?: boolean; error?: string }> {
  const storeUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aura-boutique-w38e.vercel.app";
  const orderUrl = `${storeUrl}/zamowienie/${order.id}/potwierdzenie${order.accessKey ? `?key=${order.accessKey}` : ""}`;
  const breakdownHtml = renderOrderFinancialBreakdownHtml(order);

  let paymentInstructions = "";
  if (order.paymentMethod === "TRADITIONAL_TRANSFER") {
    const details = order.bankTransferDetails || {
      recipient: "AURA BOUTIQUE KLAUDIA BIAŁEK",
      accountNumber: "52 1090 2398 0000 0001 5482 9102",
      bankName: "Santander Bank Polska S.A.",
      amount: order.totalAmount,
      title: `Zamówienie ${order.orderNumber}`,
      deadlineHours: 72,
    };
    paymentInstructions = `
      <div style="background-color: #FAF6F1; border: 1px solid #EADFD5; border-radius: 4px; padding: 18px; margin: 24px 0;">
        <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #241D1B; margin: 0 0 12px 0;">
          Dane do wykonania przelewu tradycyjnego (Rezerwacja na ${details.deadlineHours}h):
        </h3>
        <table style="width: 100%; font-size: 13px; color: #3E3835; line-height: 1.6;">
          <tr><td style="width: 140px; color: #857670;">Odbiorca:</td><td><strong>${details.recipient}</strong></td></tr>
          <tr><td style="color: #857670;">Nr rachunku:</td><td><strong style="font-family: monospace; font-size: 14px; letter-spacing: 1px;">${details.accountNumber}</strong></td></tr>
          <tr><td style="color: #857670;">Bank:</td><td>${details.bankName || "Santander Bank Polska S.A."}</td></tr>
          <tr><td style="color: #857670;">Tytuł przelewu:</td><td><strong style="color: #AF884F;">${details.title}</strong></td></tr>
          <tr><td style="color: #857670;">Kwota do zapłaty:</td><td><strong style="font-size: 15px; color: #241D1B;">${details.amount.toFixed(2)} PLN</strong></td></tr>
        </table>
        <p style="margin: 12px 0 0 0; font-size: 11px; color: #857670;">
          * Po zaksięgowaniu wpłaty zamówienie natychmiast trafi do kompletowania i przygotowania do wysyłki.
        </p>
      </div>
    `;
  } else if (order.paymentMethod === "COD") {
    paymentInstructions = `
      <div style="background-color: #FAF6F1; border: 1px solid #EADFD5; border-radius: 4px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; font-size: 13px; color: #3E3835;">
          <strong>Płatność za pobraniem:</strong> Kwotę <strong>${order.totalAmount.toFixed(2)} PLN</strong> uregulujesz u kuriera gotówką lub kartą przy odbiorze przesyłki.
        </p>
      </div>
    `;
  } else {
    // Płatność online BLIK / P24
    paymentInstructions = `
      <div style="background-color: #FAF6F1; border: 1px solid #EADFD5; border-radius: 4px; padding: 18px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #3E3835;">
          Status płatności: <strong style="color: #D97706;">Oczekuje na opłacenie online</strong>
        </p>
        <p style="margin: 0 0 16px 0; font-size: 12px; color: #6E6259;">
          Jeśli płatność w oknie operatora nie została jeszcze ukończona, możesz w każdej chwili bezpiecznie sfinalizować transakcję poniższym przyciskiem:
        </p>
        <a href="${orderUrl}" style="display: inline-block; background-color: #C5A069; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 3px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600;">
          Opłać zamówienie online
        </a>
      </div>
    `;
  }

  const content = `
    <div style="font-size: 14px; color: #241D1B; line-height: 1.6;">
      <p style="font-size: 17px; font-weight: 600; margin: 0 0 12px 0;">
        Dzień dobry, ${order.customerFirstName}! ✨
      </p>
      <p style="margin: 0 0 16px 0;">
        Dziękujemy za złożenie zamówienia w butiku AURA. Zostało ono pomyślnie zarejestrowane pod numerem <strong>${order.orderNumber}</strong>.
      </p>

      ${paymentInstructions}

      <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #241D1B; margin: 24px 0 8px 0; border-bottom: 1px solid #EADFD5; padding-bottom: 6px;">
        Podsumowanie Twojego zamówienia:
      </h3>
      ${breakdownHtml}

      <div style="text-align: center; margin: 30px 0 10px;">
        <a href="${orderUrl}" style="display: inline-block; border: 1px solid #C5A069; color: #8F6B38; text-decoration: none; padding: 10px 24px; border-radius: 3px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600;">
          Zobacz szczegóły zamówienia w sklepie
        </a>
      </div>
    </div>
  `;

  const html = wrapBoutiqueEmailTemplate(`Przyjęto zamówienie ${order.orderNumber}`, content);

  return dispatchEmail(
    {
      to: order.customerEmail.trim().toLowerCase(),
      subject: `Przyjęto zamówienie ${order.orderNumber} | AURA Boutique`,
      html,
      type: "ORDER_PLACED",
    },
    customSettings
  );
}

/**
 * 8. Potwierdzenie otrzymania i zweryfikowania płatności
 * Wysyłane DOPIERO PO rzeczywistym zweryfikowaniu wpłaty przez P24 lub zaksięgowaniu przez butik
 */
export async function sendOrderPaymentConfirmedCustomerEmail(
  order: Order,
  customSettings?: Partial<StoreSettings>
): Promise<{ success: boolean; notConfigured?: boolean; error?: string }> {
  const storeUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aura-boutique-w38e.vercel.app";
  const orderUrl = `${storeUrl}/zamowienie/${order.id}/potwierdzenie${order.accessKey ? `?key=${order.accessKey}` : ""}`;
  const breakdownHtml = renderOrderFinancialBreakdownHtml(order);

  const content = `
    <div style="font-size: 14px; color: #241D1B; line-height: 1.6;">
      <p style="font-size: 17px; font-weight: 600; margin: 0 0 12px 0;">
        Dzień dobry, ${order.customerFirstName}! ✨
      </p>
      <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 4px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; font-size: 14px; color: #065F46; font-weight: 600;">
          ✓ Płatność za zamówienie ${order.orderNumber} została potwierdzona!
        </p>
        <p style="margin: 6px 0 0 0; font-size: 12px; color: #047857;">
          Otrzymaliśmy wpłatę w kwocie <strong>${order.totalAmount.toFixed(2)} PLN</strong>. Twoje zamówienie trafiło do kompletowania i przygotowywania do wysyłki.
        </p>
      </div>

      <p style="margin: 16px 0;">
        Gdy paczka zostanie nadana, otrzymasz od nas wiadomość e-mail oraz SMS z numerem przesyłki i linkiem do śledzenia w InPost.
      </p>

      <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #241D1B; margin: 24px 0 8px 0; border-bottom: 1px solid #EADFD5; padding-bottom: 6px;">
        Podsumowanie opłaconego zamówienia:
      </h3>
      ${breakdownHtml}

      <div style="text-align: center; margin: 30px 0 10px;">
        <a href="${orderUrl}" style="display: inline-block; background-color: #241D1B; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 3px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600;">
          Śledź status przesyłki
        </a>
      </div>
    </div>
  `;

  const html = wrapBoutiqueEmailTemplate(`Płatność potwierdzona: ${order.orderNumber}`, content);

  return dispatchEmail(
    {
      to: order.customerEmail.trim().toLowerCase(),
      subject: `Potwierdzenie płatności za zamówienie ${order.orderNumber} ✨ | AURA Boutique`,
      html,
      type: "ORDER_PAID",
    },
    customSettings
  );
}

/**
 * 9. Powiadomienie o nadaniu przesyłki (InPost Paczkomat / Kurier)
 */
export async function sendOrderShippedCustomerEmail(
  order: Order,
  trackingNumber: string,
  carrier: string = "InPost",
  customSettings?: Partial<StoreSettings>
): Promise<{ success: boolean; notConfigured?: boolean; error?: string }> {
  const storeUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aura-boutique-w38e.vercel.app";
  const orderUrl = `${storeUrl}/zamowienie/${order.id}/potwierdzenie${order.accessKey ? `?key=${order.accessKey}` : ""}`;
  const trackingUrl = `https://inpost.pl/sledzenie-przesylek?number=${encodeURIComponent(trackingNumber)}`;

  const content = `
    <div style="font-size: 14px; color: #241D1B; line-height: 1.6;">
      <p style="font-size: 17px; font-weight: 600; margin: 0 0 12px 0;">
        Dzień dobry, ${order.customerFirstName}! 📦
      </p>

      <div style="background-color: #FAF6F1; border: 1px solid #DFCA9B; border-radius: 4px; padding: 18px; margin: 16px 0;">
        <p style="margin: 0; font-size: 15px; font-weight: bold; color: #241D1B;">
          Twoja paczka została wysłana z butiku!
        </p>
        <p style="margin: 8px 0 0 0; font-size: 13px; color: #5A4E47;">
          Numer zamówienia: <strong>${order.orderNumber}</strong><br>
          Przewoźnik: <strong>${carrier}</strong><br>
          Numer listu przewozowego: <strong style="font-family: monospace; font-size: 14px; color: #8F6B38;">${trackingNumber}</strong>
        </p>
      </div>

      <div style="text-align: center; margin: 26px 0;">
        <a href="${trackingUrl}" target="_blank" rel="noreferrer" style="display: inline-block; background-color: #FFD800; color: #111111; text-decoration: none; padding: 13px 32px; border-radius: 3px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.14em; font-weight: 700; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
          Śledź paczkę w InPost ↗
        </a>
      </div>

      <div style="text-align: center; margin: 0 0 24px 0;">
        <a href="${orderUrl}" style="color: #8F6B38; font-size: 12px; text-decoration: underline;">
          Zobacz szczegóły swojego zamówienia w butiku
        </a>
      </div>

      <p style="margin: 20px 0 0 0; color: #5A4E47; font-size: 13px;">
        Życzymy radości z rozpakowywania paczki i zapraszamy ponownie!<br>
        <strong>Zespół AURA BOUTIQUE</strong>
      </p>
    </div>
  `;

  const html = wrapBoutiqueEmailTemplate(`Wysłano zamówienie: ${order.orderNumber}`, content);

  return dispatchEmail(
    {
      to: order.customerEmail.trim().toLowerCase(),
      subject: `Twoje zamówienie ${order.orderNumber} w AURA BOUTIQUE zostało wysłane! 📦`,
      html,
      type: "ORDER_SHIPPED",
    },
    customSettings
  );
}

/**
 * 10. Powiadomienie o anulowaniu zamówienia
 */
export async function sendOrderCancelledCustomerEmail(
  order: Order,
  reason?: string,
  customSettings?: Partial<StoreSettings>
): Promise<{ success: boolean; notConfigured?: boolean; error?: string }> {
  const storeUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aura-boutique-w38e.vercel.app";

  const content = `
    <div style="font-size: 14px; color: #241D1B; line-height: 1.6;">
      <p style="font-size: 17px; font-weight: 600; margin: 0 0 12px 0;">
        Dzień dobry, ${order.customerFirstName}!
      </p>

      <div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 4px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; font-size: 14px; color: #991B1B; font-weight: 600;">
          Zamówienie ${order.orderNumber} zostało anulowane.
        </p>
        ${
          reason
            ? `<p style="margin: 6px 0 0 0; font-size: 12px; color: #B91C1C;">Powód: ${reason}</p>`
            : ""
        }
      </div>

      <p style="margin: 16px 0; color: #5A4E47;">
        Zarezerwowane produkty zostały przywrócone na stan butiku. Jeżeli użyłaś w tym zamówieniu kodu rabatowego, został on zwolniony i możesz wykorzystać go ponownie przy kolejnych zakupach.
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${storeUrl}/katalog" style="display: inline-block; background-color: #241D1B; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 3px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600;">
          Wróć do butiku
        </a>
      </div>

      <p style="margin: 20px 0 0 0; color: #5A4E47; font-size: 12px;">
        W razie pytań napisz do nas na <a href="mailto:aurazmigrod@wp.pl" style="color: #C5A069;">aurazmigrod@wp.pl</a>.
      </p>
    </div>
  `;

  const html = wrapBoutiqueEmailTemplate(`Anulowanie zamówienia: ${order.orderNumber}`, content);

  return dispatchEmail(
    {
      to: order.customerEmail.trim().toLowerCase(),
      subject: `Potwierdzenie anulowania zamówienia ${order.orderNumber} | AURA BOUTIQUE`,
      html,
      type: "ORDER_CANCELLED",
    },
    customSettings
  );
}

/**
 * 11. Powiadomienie o nieudanej próbie płatności z możliwością ponowienia
 */
export async function sendOrderPaymentFailedCustomerEmail(
  order: Order,
  customSettings?: Partial<StoreSettings>
): Promise<{ success: boolean; notConfigured?: boolean; error?: string }> {
  const storeUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aura-boutique-w38e.vercel.app";
  const retryUrl = `${storeUrl}/zamowienie/${order.id}/potwierdzenie${order.accessKey ? `?key=${order.accessKey}` : ""}`;

  const content = `
    <div style="font-size: 14px; color: #241D1B; line-height: 1.6;">
      <p style="font-size: 17px; font-weight: 600; margin: 0 0 12px 0;">
        Dzień dobry, ${order.customerFirstName}! 💛
      </p>

      <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 4px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; font-size: 14px; color: #92400E; font-weight: 600;">
          Płatność za zamówienie ${order.orderNumber} nie powiodła się lub została przerwana.
        </p>
        <p style="margin: 6px 0 0 0; font-size: 12px; color: #78350F;">
          Nie martw się – Twoje zamówienie jest bezpiecznie zapisane, a wybrane ubrania pozostają dla Ciebie zarezerwowane.
        </p>
      </div>

      <p style="margin: 16px 0; color: #5A4E47;">
        Możesz w każdej chwili bezpiecznie dokończyć opłacenie zamówienia przez BLIK, szybki przelew lub wykonać tradycyjny przelew bankowy.
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${retryUrl}" style="display: inline-block; background-color: #C5A069; color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 3px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.16em; font-weight: 600; box-shadow: 0 2px 8px rgba(197, 160, 105, 0.25);">
          Opłać zamówienie teraz
        </a>
      </div>
    </div>
  `;

  const html = wrapBoutiqueEmailTemplate(`Dokończ płatność: ${order.orderNumber}`, content);

  return dispatchEmail(
    {
      to: order.customerEmail.trim().toLowerCase(),
      subject: `Nieudana płatność za zamówienie ${order.orderNumber} – możesz spróbować ponownie 💛 | AURA BOUTIQUE`,
      html,
      type: "ORDER_PAYMENT_FAILED",
    },
    customSettings
  );
}

/**
 * 12. Powiadomienie o przyjęciu zgłoszenia zwrotu towaru
 */
export async function sendReturnRequestedCustomerEmail(
  returnRequest: { id: string; items: any[]; returnMethod: string; customerNote?: string },
  order: Order,
  customSettings?: Partial<StoreSettings>
): Promise<{ success: boolean; notConfigured?: boolean; error?: string }> {
  const storeUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aura-boutique-w38e.vercel.app";
  const orderUrl = `${storeUrl}/zamowienie/${order.id}/potwierdzenie${order.accessKey ? `?key=${order.accessKey}` : ""}`;

  const itemsHtml = returnRequest.items
    .map(
      (it: any) => `
        <li style="margin-bottom: 6px;">
          <strong>${it.productName || "Produkt"}</strong> – ${it.quantity} szt.<br>
          <span style="font-size: 12px; color: #7A6458;">Powód: ${it.reason || "Brak podanego powodu"}</span>
        </li>
      `
    )
    .join("");

  const content = `
    <div style="font-size: 14px; color: #241D1B; line-height: 1.6;">
      <p style="font-size: 17px; font-weight: 600; margin: 0 0 12px 0;">
        Dzień dobry, ${order.customerFirstName}!
      </p>

      <p style="margin: 0 0 16px 0;">
        Przyjęłyśmy Twoje formularzowe zgłoszenie zwrotu do zamówienia <strong>${order.orderNumber}</strong>.
      </p>

      <div style="background-color: #FAF6F1; border: 1px solid #EADFD5; border-radius: 4px; padding: 18px; margin: 16px 0;">
        <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 13px; text-transform: uppercase; color: #241D1B;">
          Zwracane produkty:
        </p>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
          ${itemsHtml}
        </ul>
      </div>

      <div style="background-color: #FAF9F7; border-left: 3px solid #C5A069; padding: 14px 18px; font-size: 12px; color: #5A4E47; line-height: 1.6; margin: 20px 0;">
        <strong>Adres do odesłania paczki ze zwrotem:</strong><br>
        AURA Boutique K.B.<br>
        ul. Poprzeczna 3/1A<br>
        55-140 Żmigród<br>
        tel. 605 540 681 • e-mail: aurazmigrod@wp.pl
      </div>

      <p style="font-size: 12px; color: #7A6458;">
        Zwrot środków nastąpi w ciągu 14 dni od doręczenia przesyłki ze zwracanymi ubraniami do butiku na ten sam rachunek/metodę, którą opłacono zamówienie.
      </p>

      <div style="text-align: center; margin: 24px 0 10px;">
        <a href="${orderUrl}" style="color: #8F6B38; font-size: 12px; text-decoration: underline;">
          Sprawdź status zamówienia i zgłoszenia zwrotu
        </a>
      </div>
    </div>
  `;

  const html = wrapBoutiqueEmailTemplate(`Zgłoszenie zwrotu: ${order.orderNumber}`, content);

  return dispatchEmail(
    {
      to: order.customerEmail.trim().toLowerCase(),
      subject: `Przyjęłyśmy Twoje zgłoszenie zwrotu do zamówienia ${order.orderNumber} | AURA BOUTIQUE`,
      html,
      type: "RETURN_REQUESTED",
    },
    customSettings
  );
}

/**
 * 13. Powiadomienie o zmianie decyzji/statusu zwrotu
 */
export async function sendReturnStatusUpdatedCustomerEmail(
  order: Order,
  newStatus: string,
  decisionNotes?: string,
  customSettings?: Partial<StoreSettings>
): Promise<{ success: boolean; notConfigured?: boolean; error?: string }> {
  const statusLabels: Record<string, string> = {
    APPROVED: "Zaakceptowany (oczekujemy na paczkę)",
    RECEIVED: "Paczka dotarła do butiku",
    REFUNDED: "Zwrot środków został zrealizowany",
    REJECTED: "Odrzucony",
  };
  const statusLabel = statusLabels[newStatus] || newStatus;

  const content = `
    <div style="font-size: 14px; color: #241D1B; line-height: 1.6;">
      <p style="font-size: 17px; font-weight: 600; margin: 0 0 12px 0;">
        Dzień dobry, ${order.customerFirstName}!
      </p>

      <p style="margin: 0 0 16px 0;">
        Status Twojego zgłoszenia zwrotu do zamówienia <strong>${order.orderNumber}</strong> uległ zmianie:
      </p>

      <div style="background-color: #FAF6F1; border: 1px solid #DFCA9B; border-radius: 4px; padding: 16px; margin: 16px 0;">
        <span style="font-size: 11px; text-transform: uppercase; color: #7A6458; letter-spacing: 0.1em; display: block; margin-bottom: 4px;">
          Aktualny status zwrotu:
        </span>
        <strong style="font-size: 16px; color: #241D1B;">${statusLabel}</strong>
        ${
          decisionNotes
            ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #5A4E47;">Informacja od butiku: ${decisionNotes}</p>`
            : ""
        }
      </div>

      <p style="font-size: 12px; color: #7A6458; margin-top: 20px;">
        Dziękujemy za kontakt z AURA Boutique. W razie pytań służymy pomocą pod adresem <a href="mailto:aurazmigrod@wp.pl" style="color: #C5A069;">aurazmigrod@wp.pl</a>.
      </p>
    </div>
  `;

  const html = wrapBoutiqueEmailTemplate(`Status zwrotu: ${order.orderNumber}`, content);

  return dispatchEmail(
    {
      to: order.customerEmail.trim().toLowerCase(),
      subject: `Status Twojego zwrotu do zamówienia ${order.orderNumber}: ${statusLabel} | AURA BOUTIQUE`,
      html,
      type: "RETURN_STATUS_UPDATED",
    },
    customSettings
  );
}


