import crypto from "crypto";
import { prisma, isDatabaseConnected } from "@/lib/prisma";
import { loadLocalStore, saveLocalStore, normalizeEmail } from "@/lib/store-data";
import { dispatchEmail, wrapBoutiqueEmailTemplate } from "@/lib/email-service";

export const NEWSLETTER_CONSENT_TEXT =
  "Chcę otrzymywać e-mailem newsletter AURA Boutique z nowościami i promocjami. Zgodę mogę wycofać w każdej chwili.";

export const NEWSLETTER_CONSENT_VERSION = "1.0";

export type NewsletterStatus = "NONE" | "PENDING" | "CONFIRMED" | "UNSUBSCRIBED";

export interface NewsletterSubscriptionRecord {
  id: string;
  email: string;
  status: NewsletterStatus;
  source: string;
  consentText: string;
  consentVersion: string;
  confirmationToken?: string | null;
  unsubscribeToken: string;
  confirmedAt?: string | null;
  unsubscribedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  customerId?: string | null;
}

/**
 * Pobiera subskrypcję newslettera dla danego adresu e-mail
 */
export async function getNewsletterSubscription(email: string): Promise<NewsletterSubscriptionRecord | null> {
  const norm = normalizeEmail(email);
  if (!norm) return null;

  if (await isDatabaseConnected()) {
    try {
      const sub = await (prisma as any).newsletterSubscription.findUnique({
        where: { email: norm },
      });
      if (sub) {
        return {
          id: sub.id,
          email: sub.email,
          status: sub.status as NewsletterStatus,
          source: sub.source,
          consentText: sub.consentText,
          consentVersion: sub.consentVersion,
          confirmationToken: sub.confirmationToken,
          unsubscribeToken: sub.unsubscribeToken,
          confirmedAt: sub.confirmedAt ? sub.confirmedAt.toISOString() : null,
          unsubscribedAt: sub.unsubscribedAt ? sub.unsubscribedAt.toISOString() : null,
          createdAt: sub.createdAt.toISOString(),
          updatedAt: sub.updatedAt.toISOString(),
          customerId: sub.customerId,
        };
      }
    } catch (e) {
      console.warn("Neon getNewsletterSubscription error:", e);
    }
  }

  const store = loadLocalStore();
  const list = (store as any).newsletterSubscriptions || [];
  const found = list.find((s: any) => s.email.toLowerCase() === norm);
  return found || null;
}

/**
 * Zgłoszenie zapisu do newslettera (z rejestracji, koszyka lub profilu)
 * Wymaga potwierdzenia Double Opt-In (wysyłka e-maila weryfikacyjnego)
 */
export async function subscribeToNewsletter(params: {
  email: string;
  source: "REGISTER" | "CHECKOUT" | "ACCOUNT" | "FOOTER";
  customerId?: string;
  sendEmail?: boolean;
}): Promise<{ status: NewsletterStatus; message: string; requiresConfirmation: boolean }> {
  const norm = normalizeEmail(params.email);
  if (!norm || !norm.includes("@")) {
    throw new Error("Podaj prawidłowy adres e-mail.");
  }

  const existing = await getNewsletterSubscription(norm);

  // ZASADA 4: Jeśli klientka ma już potwierdzoną subskrypcję, nie zmieniamy jej statusu
  if (existing && existing.status === "CONFIRMED") {
    return {
      status: "CONFIRMED",
      message: "Twój adres jest już aktywnym subskrybentem newslettera.",
      requiresConfirmation: false,
    };
  }

  const confirmationToken = crypto.randomBytes(24).toString("hex");
  const unsubscribeToken = existing?.unsubscribeToken || crypto.randomBytes(24).toString("hex");
  const now = new Date();

  if (await isDatabaseConnected()) {
    try {
      await (prisma as any).newsletterSubscription.upsert({
        where: { email: norm },
        update: {
          status: "PENDING",
          source: params.source,
          consentText: NEWSLETTER_CONSENT_TEXT,
          consentVersion: NEWSLETTER_CONSENT_VERSION,
          confirmationToken,
          unsubscribeToken,
          customerId: params.customerId || existing?.customerId || null,
          updatedAt: now,
        },
        create: {
          email: norm,
          status: "PENDING",
          source: params.source,
          consentText: NEWSLETTER_CONSENT_TEXT,
          consentVersion: NEWSLETTER_CONSENT_VERSION,
          confirmationToken,
          unsubscribeToken,
          customerId: params.customerId || null,
          createdAt: now,
          updatedAt: now,
        },
      });
    } catch (e) {
      console.warn("Neon subscribeToNewsletter error:", e);
    }
  }

  // Zapis lokalny fallback
  const store = loadLocalStore();
  if (!(store as any).newsletterSubscriptions) {
    (store as any).newsletterSubscriptions = [];
  }
  const subs = (store as any).newsletterSubscriptions;
  const idx = subs.findIndex((s: any) => s.email.toLowerCase() === norm);
  const localRecord: NewsletterSubscriptionRecord = {
    id: existing?.id || `sub_${Date.now()}`,
    email: norm,
    status: "PENDING",
    source: params.source,
    consentText: NEWSLETTER_CONSENT_TEXT,
    consentVersion: NEWSLETTER_CONSENT_VERSION,
    confirmationToken,
    unsubscribeToken,
    confirmedAt: null,
    unsubscribedAt: null,
    createdAt: existing?.createdAt || now.toISOString(),
    updatedAt: now.toISOString(),
    customerId: params.customerId || existing?.customerId || null,
  };
  if (idx !== -1) {
    subs[idx] = localRecord;
  } else {
    subs.push(localRecord);
  }
  saveLocalStore(store);

  // Wysłanie e-maila potwierdzającego (Double Opt-In)
  if (params.sendEmail !== false) {
    await sendNewsletterConfirmationEmail(norm, confirmationToken, unsubscribeToken);
  }

  return {
    status: "PENDING",
    message: "Na Twój adres wysłaliśmy link potwierdzający zapis do newslettera.",
    requiresConfirmation: true,
  };
}

/**
 * Potwierdzenie zapisu do newslettera przez unikalny token z wiadomości e-mail
 */
export async function confirmNewsletterSubscription(token: string): Promise<{ success: boolean; email?: string; error?: string }> {
  if (!token || typeof token !== "string" || !token.trim()) {
    return { success: false, error: "Nieprawidłowy lub brakujący token potwierdzenia." };
  }

  const cleanToken = token.trim();
  const now = new Date();
  let confirmedEmail: string | undefined = undefined;

  if (await isDatabaseConnected()) {
    try {
      const sub = await (prisma as any).newsletterSubscription.findUnique({
        where: { confirmationToken: cleanToken },
      });
      if (sub) {
        await (prisma as any).newsletterSubscription.update({
          where: { id: sub.id },
          data: {
            status: "CONFIRMED",
            confirmationToken: null,
            confirmedAt: now,
            updatedAt: now,
          },
        });
        confirmedEmail = sub.email;
      }
    } catch (e) {
      console.warn("Neon confirmNewsletterSubscription error:", e);
    }
  }

  // Fallback lokalny
  const store = loadLocalStore();
  const subs = (store as any).newsletterSubscriptions || [];
  const idx = subs.findIndex((s: any) => s.confirmationToken === cleanToken);
  if (idx !== -1) {
    subs[idx].status = "CONFIRMED";
    subs[idx].confirmationToken = null;
    subs[idx].confirmedAt = now.toISOString();
    subs[idx].updatedAt = now.toISOString();
    confirmedEmail = subs[idx].email;
    saveLocalStore(store);
  }

  if (!confirmedEmail) {
    return { success: false, error: "Link potwierdzający jest nieprawidłowy lub został już wykorzystany." };
  }

  return { success: true, email: confirmedEmail };
}

/**
 * Natychmiastowe wycofanie zgody na newsletter (bez dodatkowego potwierdzania)
 * Działa przez unsubscribeToken (z linku e-mail) LUB bezpośrednio przez email (z profilu klientki)
 */
export async function unsubscribeFromNewsletter(identifier: {
  token?: string;
  email?: string;
}): Promise<{ success: boolean; email?: string; error?: string }> {
  const now = new Date();
  let unsubscribedEmail: string | undefined = undefined;

  const { token, email } = identifier;
  if (!token && !email) {
    return { success: false, error: "Brak identyfikatora do rezygnacji." };
  }

  const normEmail = email ? normalizeEmail(email) : undefined;

  if (await isDatabaseConnected()) {
    try {
      let sub: any = null;
      if (token) {
        sub = await (prisma as any).newsletterSubscription.findUnique({
          where: { unsubscribeToken: token.trim() },
        });
      } else if (normEmail) {
        sub = await (prisma as any).newsletterSubscription.findUnique({
          where: { email: normEmail },
        });
      }

      if (sub) {
        await (prisma as any).newsletterSubscription.update({
          where: { id: sub.id },
          data: {
            status: "UNSUBSCRIBED",
            confirmationToken: null,
            unsubscribedAt: now,
            updatedAt: now,
          },
        });
        unsubscribedEmail = sub.email;
      }
    } catch (e) {
      console.warn("Neon unsubscribeFromNewsletter error:", e);
    }
  }

  // Fallback lokalny
  const store = loadLocalStore();
  const subs = (store as any).newsletterSubscriptions || [];
  const idx = subs.findIndex((s: any) => {
    if (token && s.unsubscribeToken === token.trim()) return true;
    if (normEmail && s.email.toLowerCase() === normEmail) return true;
    return false;
  });

  if (idx !== -1) {
    subs[idx].status = "UNSUBSCRIBED";
    subs[idx].confirmationToken = null;
    subs[idx].unsubscribedAt = now.toISOString();
    subs[idx].updatedAt = now.toISOString();
    unsubscribedEmail = subs[idx].email;
    saveLocalStore(store);
  }

  if (!unsubscribedEmail && normEmail) {
    // Nawet jeśli rekord nie istniał, odnotowujemy wycofanie zgody
    const record: NewsletterSubscriptionRecord = {
      id: `sub_${Date.now()}`,
      email: normEmail,
      status: "UNSUBSCRIBED",
      source: "ACCOUNT",
      consentText: NEWSLETTER_CONSENT_TEXT,
      consentVersion: NEWSLETTER_CONSENT_VERSION,
      unsubscribeToken: crypto.randomBytes(24).toString("hex"),
      unsubscribedAt: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    subs.push(record);
    (store as any).newsletterSubscriptions = subs;
    saveLocalStore(store);
    unsubscribedEmail = normEmail;
  }

  if (!unsubscribedEmail) {
    return { success: false, error: "Nie znaleziono subskrypcji dla podanego linku." };
  }

  return { success: true, email: unsubscribedEmail };
}

/**
 * Wysyła bezpieczną wiadomość z linkiem potwierdzającym Double Opt-In
 */
export async function sendNewsletterConfirmationEmail(
  email: string,
  confirmationToken: string,
  unsubscribeToken: string
): Promise<any> {
  const storeUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aura-boutique-w38e.vercel.app";
  const confirmUrl = `${storeUrl}/newsletter/potwierdz?token=${encodeURIComponent(confirmationToken)}`;
  const cancelUrl = `${storeUrl}/newsletter/rezygnacja?token=${encodeURIComponent(unsubscribeToken)}`;

  const content = `
    <h2 style="font-family: Georgia, serif; font-size: 20px; font-weight: normal; margin-top: 0; color: #241D1B; text-align: center;">Potwierdź swój zapis do newslettera</h2>
    <p style="font-size: 14px; color: #554D47; text-align: center; margin-bottom: 24px;">Dziękujemy za zainteresowanie nowościami i inspiracjami AURA Boutique. Aby dokończyć zapis, kliknij poniższy przycisk:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${confirmUrl}" style="background-color: #C5A069; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; display: inline-block;">
        Potwierdzam zapis do newslettera
      </a>
    </div>

    <div style="background-color: #FAF6F1; border: 1px solid #DFCA9B; border-radius: 4px; padding: 16px; margin: 24px 0; font-size: 12px; color: #6E5D53; line-height: 1.5;">
      <strong>Treść zgody:</strong><br />
      „${NEWSLETTER_CONSENT_TEXT}” (wersja ${NEWSLETTER_CONSENT_VERSION})
    </div>

    <p style="font-size: 12px; color: #7A6458; line-height: 1.5;">Jeśli to nie Ty podałaś ten adres e-mail, zignoruj tę wiadomość – bez potwierdzenia Twój adres nie zostanie dodany do bazy subskrybentów. Możesz również natychmiast anulować zgłoszenie: <a href="${cancelUrl}" style="color: #9E8359; text-decoration: underline;">anuluj to zgłoszenie</a>.</p>
  `;

  const html = wrapBoutiqueEmailTemplate("Potwierdź zapis do newslettera | AURA Boutique", content);

  return dispatchEmail({
    to: email,
    subject: "Potwierdź zapis do newslettera | AURA Boutique",
    html,
    type: "NEWSLETTER_CONFIRMATION" as any,
  });
}
