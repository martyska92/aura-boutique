import { prisma, isNeonConfigured } from "@/lib/prisma";
import { loadLocalStore, saveLocalStore, getCustomerByEmail } from "@/lib/store-data";
import { IndividualDiscountRecord } from "@/lib/types";
import { sendIndividualDiscountEmail } from "@/lib/email-service";

/**
 * Generuje czytelny, bezpieczny kod rabatu indywidualnego (np. AURA-7K9P)
 */
function generateDiscountCode(percent: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `AURA-${percent}-${suffix}`;
}

/**
 * 1. Ręczne przyznawanie rabatu klientce przez właścicielkę
 */
export async function grantIndividualDiscount(params: {
  customerId?: string;
  customerEmail: string;
  discountPercent: number;
  isPermanent: boolean;
  validUntil?: string;
  minCartValue?: number;
  canCombine?: boolean;
  adminNote?: string;
  sendEmail?: boolean;
  grantedBy?: string;
}): Promise<{
  success: boolean;
  discount: IndividualDiscountRecord;
  emailSent: boolean;
  emailError?: string;
}> {
  const normalizedEmail = params.customerEmail.trim().toLowerCase();
  const customer = await getCustomerByEmail(normalizedEmail);

  const percent = Number(params.discountPercent);
  if (isNaN(percent) || percent <= 0 || percent > 100) {
    throw new Error("Wysokość rabatu musi wynosić od 1% do 100%.");
  }

  const code = generateDiscountCode(percent);
  const now = new Date();

  const record: IndividualDiscountRecord = {
    id: `ind-disc-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    code,
    customerId: params.customerId || customer?.id,
    customerEmail: normalizedEmail,
    discountPercent: percent,
    isPermanent: params.isPermanent,
    validUntil: params.validUntil ? new Date(params.validUntil).toISOString() : undefined,
    minCartValue: params.minCartValue ? Number(params.minCartValue) : undefined,
    canCombine: params.canCombine || false,
    adminNote: params.adminNote?.trim(),
    grantedBy: params.grantedBy || "Właścicielka",
    isUsed: false,
    isRevoked: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  // 1. Zapis do PostgreSQL Neon
  if (isNeonConfigured()) {
    try {
      await prisma.individualDiscount.create({
        data: {
          id: record.id,
          code: record.code,
          customerId: record.customerId,
          customerEmail: record.customerEmail,
          discountPercent: record.discountPercent,
          isPermanent: record.isPermanent,
          validUntil: record.validUntil ? new Date(record.validUntil) : null,
          minCartValue: record.minCartValue || null,
          canCombine: record.canCombine,
          adminNote: record.adminNote || null,
          grantedBy: record.grantedBy,
          isUsed: false,
          isRevoked: false,
        },
      });
    } catch (e) {
      console.warn("Błąd zapisu IndividualDiscount w Neon:", e);
    }
  }

  // 2. Zapis w store-storage fallback
  const store = loadLocalStore();
  if (!(store as any).individualDiscountsList) {
    (store as any).individualDiscountsList = [];
  }
  (store as any).individualDiscountsList.unshift(record);
  saveLocalStore(store);

  // 3. Opcjonalna wysyłka maila
  let emailSent = false;
  let emailError: string | undefined = undefined;

  if (params.sendEmail) {
    try {
      const mailRes = await sendIndividualDiscountEmail({
        customerEmail: normalizedEmail,
        firstName: customer?.firstName,
        discountCode: record.code,
        discountPercent: record.discountPercent,
        isPermanent: record.isPermanent,
        validUntil: record.validUntil,
        minCartValue: record.minCartValue,
        adminNote: record.adminNote,
      });

      emailSent = mailRes.success;
      emailError = mailRes.error;

      record.emailSentAt = new Date().toISOString();
      record.emailSendStatus = mailRes.success ? "SENT" : "FAILED";
      record.emailSendError = mailRes.error;

      if (isNeonConfigured()) {
        try {
          await prisma.individualDiscount.update({
            where: { id: record.id },
            data: {
              emailSentAt: new Date(),
              emailSendStatus: record.emailSendStatus,
              emailSendError: record.emailSendError,
            },
          });
        } catch (_) {}
      }
    } catch (err: any) {
      emailSent = false;
      emailError = err.message || "Błąd wysyłki e-mail";
    }
  }

  return {
    success: true,
    discount: record,
    emailSent,
    emailError,
  };
}

/**
 * 2. Pobieranie rabatów dla konkretnej klientki (zarówno w panelu admina jak i w Moje Konto)
 */
export async function getDiscountsForCustomer(
  emailOrId: string
): Promise<IndividualDiscountRecord[]> {
  const norm = emailOrId.trim().toLowerCase();

  if (isNeonConfigured()) {
    try {
      const dbList = await prisma.individualDiscount.findMany({
        where: {
          OR: [{ customerEmail: norm }, { customerId: emailOrId }],
        },
        orderBy: { createdAt: "desc" },
      });

      if (dbList && dbList.length > 0) {
        return dbList.map((d) => ({
          id: d.id,
          code: d.code,
          customerId: d.customerId || undefined,
          customerEmail: d.customerEmail,
          discountPercent: Number(d.discountPercent),
          isPermanent: d.isPermanent,
          validUntil: d.validUntil?.toISOString(),
          minCartValue: d.minCartValue ? Number(d.minCartValue) : undefined,
          canCombine: d.canCombine,
          adminNote: d.adminNote || undefined,
          grantedBy: d.grantedBy,
          isUsed: d.isUsed,
          usedAt: d.usedAt?.toISOString(),
          usedInOrderId: d.usedInOrderId || undefined,
          isRevoked: d.isRevoked,
          revokedAt: d.revokedAt?.toISOString(),
          revokedReason: d.revokedReason || undefined,
          emailSentAt: d.emailSentAt?.toISOString(),
          emailSendStatus: (d.emailSendStatus as any) || undefined,
          emailSendError: d.emailSendError || undefined,
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
        }));
      }
    } catch (e) {
      console.warn("Błąd odczytu IndividualDiscount z Neon:", e);
    }
  }

  const store = loadLocalStore();
  const list: IndividualDiscountRecord[] = (store as any).individualDiscountsList || [];
  return list.filter((d) => d.customerEmail.toLowerCase() === norm || d.customerId === emailOrId);
}

/**
 * 3. Ponowne wysłanie TEGO SAMEGO kodu bez tworzenia nowego rekordu ani odnawiania zużytego kodu
 */
export async function resendDiscountEmail(discountId: string): Promise<{
  success: boolean;
  error?: string;
  sentAt?: string;
}> {
  let discount: IndividualDiscountRecord | null = null;

  if (isNeonConfigured()) {
    try {
      const d = await prisma.individualDiscount.findUnique({
        where: { id: discountId },
      });
      if (d) {
        discount = {
          id: d.id,
          code: d.code,
          customerId: d.customerId || undefined,
          customerEmail: d.customerEmail,
          discountPercent: Number(d.discountPercent),
          isPermanent: d.isPermanent,
          validUntil: d.validUntil?.toISOString(),
          minCartValue: d.minCartValue ? Number(d.minCartValue) : undefined,
          canCombine: d.canCombine,
          adminNote: d.adminNote || undefined,
          grantedBy: d.grantedBy,
          isUsed: d.isUsed,
          isRevoked: d.isRevoked,
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
        };
      }
    } catch (_) {}
  }

  if (!discount) {
    const store = loadLocalStore();
    const list: IndividualDiscountRecord[] = (store as any).individualDiscountsList || [];
    discount = list.find((d) => d.id === discountId) || null;
  }

  if (!discount) {
    return { success: false, error: "Nie znaleziono wskazanego rabatu." };
  }

  if (discount.isRevoked) {
    return { success: false, error: "Ten rabat został unieważniony — nie można go wysłać." };
  }

  const customer = await getCustomerByEmail(discount.customerEmail);

  const mailRes = await sendIndividualDiscountEmail({
    customerEmail: discount.customerEmail,
    firstName: customer?.firstName,
    discountCode: discount.code,
    discountPercent: discount.discountPercent,
    isPermanent: discount.isPermanent,
    validUntil: discount.validUntil,
    minCartValue: discount.minCartValue,
    adminNote: discount.adminNote,
  });

  const now = new Date().toISOString();
  if (isNeonConfigured()) {
    try {
      await prisma.individualDiscount.update({
        where: { id: discount.id },
        data: {
          emailSentAt: new Date(),
          emailSendStatus: mailRes.success ? "SENT" : "FAILED",
          emailSendError: mailRes.error || null,
        },
      });
    } catch (_) {}
  }

  return {
    success: mailRes.success,
    error: mailRes.error,
    sentAt: now,
  };
}

/**
 * 4. Unieważnienie niewykorzystanego rabatu
 */
export async function revokeIndividualDiscount(
  discountId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  let discount: IndividualDiscountRecord | null = null;

  if (isNeonConfigured()) {
    try {
      const d = await prisma.individualDiscount.findUnique({
        where: { id: discountId },
      });
      if (d) {
        if (d.isUsed && !d.isPermanent) {
          return { success: false, error: "Nie można unieważnić jednorazowego rabatu, który został już zrealizowany w zamówieniu." };
        }
        await prisma.individualDiscount.update({
          where: { id: discountId },
          data: {
            isRevoked: true,
            revokedAt: new Date(),
            revokedReason: reason?.trim() || "Unieważniony przez właścicielkę",
          },
        });
        return { success: true };
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  const store = loadLocalStore();
  const list: IndividualDiscountRecord[] = (store as any).individualDiscountsList || [];
  const idx = list.findIndex((d) => d.id === discountId);
  if (idx === -1) {
    return { success: false, error: "Nie znaleziono rabatu do unieważnienia." };
  }

  if (list[idx].isUsed && !list[idx].isPermanent) {
    return { success: false, error: "Nie można unieważnić rabatu, który został już wykorzystany." };
  }

  list[idx].isRevoked = true;
  list[idx].revokedAt = new Date().toISOString();
  list[idx].revokedReason = reason?.trim() || "Unieważniony przez właścicielkę";
  saveLocalStore(store);

  return { success: true };
}
