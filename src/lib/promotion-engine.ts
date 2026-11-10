import {
  CartItem,
  Order,
  Promotion,
  ShippingMethod,
  StoreSettings,
  AppliedPromotionSummary,
  IndividualCustomerDiscount,
  ReferralParticipant,
  ReferralRewardCode,
  ProductReview,
} from "./types";
import { loadLocalStore, saveLocalStore } from "./store-data";
import { isWeekendWarsaw, isDateWithinRange } from "./date-utils";

export interface ItemCalculationResult {
  cartItem: CartItem;
  originalUnitPrice: number;
  discountedUnitPrice: number;
  originalTotal: number;
  discountedTotal: number;
  itemDiscountAmount: number;
  appliedPromoName?: string;
  appliedPromoType?: string;
}

export interface PromotionCalculationOutput {
  originalSubtotal: number;
  totalDiscountAmount: number;
  finalSubtotal: number;
  shippingCost: number;
  grandTotal: number;
  items: ItemCalculationResult[];
  appliedPromotions: AppliedPromotionSummary[];
  couponMessage?: {
    type: "success" | "info" | "warning" | "error";
    text: string;
  };
  freeShipping: {
    isFree: boolean;
    remainingToFree: number;
    threshold: number;
    message: string;
  };
  gift: {
    isEligible: boolean;
    remainingToGift: number;
    threshold: number;
    giftItem?: {
      productName: string;
      color: string;
      value: number;
    };
    message: string;
  };
  individualDiscountPercent?: number;
  referralApplied?: {
    code: string;
    referrerEmail: string;
  };
}

/**
 * Normalizacja adresu e-mail (usunięcie spacji, małe litery, bez usuwania kropek czy fragmentów po znaku +)
 */
export function normalizeEmail(email?: string): string {
  if (!email) return "";
  return email.trim().toLowerCase();
}

/**
 * Sprawdza, czy dany adres e-mail składał już opłacone / zrealizowane zamówienie
 */
export function isNewCustomerEmail(email: string, orders: Order[]): boolean {
  const norm = normalizeEmail(email);
  if (!norm) return true; // Dla pustego koszyka zakładamy potencjalnie nowego klienta

  // Sprawdzamy historię zamówień
  const hasPreviousOrder = orders.some((o) => {
    const oEmail = normalizeEmail(o.customerEmail);
    if (oEmail !== norm) return false;
    // Anulowane lub nieudane zamówienia nie wykluczają rabatu na pierwsze zakupy
    if (o.fulfillmentStatus === "CANCELLED" || o.paymentStatus === "FAILED") {
      return false;
    }
    return true;
  });

  return !hasPreviousOrder;
}

/**
 * Główny silnik kalkulacji rabatów i promocji
 */
export async function calculateOrderPromotions(params: {
  cartItems: CartItem[];
  customerEmail?: string;
  couponCode?: string;
  shippingMethod?: ShippingMethod;
  customSettings?: StoreSettings;
  overrideWeekend?: boolean; // do testów
}): Promise<PromotionCalculationOutput> {
  const store = loadLocalStore();
  const settings = params.customSettings || store.settings;
  const normalizedEmail = normalizeEmail(params.customerEmail);
  const normalizedCoupon = params.couponCode ? params.couponCode.trim().toUpperCase() : undefined;
  const shippingMethod = params.shippingMethod || "INPOST_LOCKER";

  // 1. Sprawdzenie statusu nowego klienta
  const isNewCustomer = isNewCustomerEmail(normalizedEmail, store.orders || []);

  // 2. Wyszukanie aktywnego rabatu indywidualnego przypisanego do e-maila
  let individualDiscount: IndividualCustomerDiscount | undefined = undefined;
  if (normalizedEmail) {
    individualDiscount = (store.individualDiscounts || []).find((d) => {
      if (normalizeEmail(d.email) !== normalizedEmail) return false;
      if (!d.isActive) return false;
      if (!d.isEmailVerified) return false;
      return isDateWithinRange(new Date(), d.startDate, d.endDate, d.isIndefinite);
    });
  }

  // 3. Sprawdzenie kodu rabatowego (Kupon, Program poleceń, Nagroda za polecenie, Kod za opinię)
  let matchedPromo: Promotion | undefined = undefined;
  let referralParticipant: ReferralParticipant | undefined = undefined;
  let referralReward: ReferralRewardCode | undefined = undefined;
  let reviewRewardPromo: { discountPercent: number; code: string; reviewId?: string } | undefined = undefined;
  let couponErrorMessage: string | undefined = undefined;

  if (normalizedCoupon) {
    // A) Standardowa promocja z kodem
    const promo = (store.promotions || []).find(
      (p) => p.isActive && p.code && p.code.trim().toUpperCase() === normalizedCoupon
    );

    // B) Program poleceń - stały kod polecający uczestniczki
    const participant = (store.referralParticipants || []).find(
      (p) => p.isActive && p.referralCode.trim().toUpperCase() === normalizedCoupon
    );

    // C) Jednorazowy kod 15% polecającej za zrealizowane zamówienie
    const rewardCode = (store.referralRewardCodes || []).find(
      (r) =>
        r.code.trim().toUpperCase() === normalizedCoupon &&
        !r.isUsed &&
        !r.isRevoked &&
        new Date().getTime() <= new Date(r.validUntil).getTime()
    );

    // D) Kod za wystawioną opinię (2% lub 5%)
    const reviewWithReward = (store.productReviews || []).find(
      (r) =>
        r.rewardCodeIssued &&
        r.rewardCodeIssued.trim().toUpperCase() === normalizedCoupon &&
        !r.rewardCodeUsed &&
        r.rewardCodeValidUntil &&
        new Date().getTime() <= new Date(r.rewardCodeValidUntil).getTime()
    );

    if (promo) {
      // Weryfikacja dat i limitów promocji
      const inDate = isDateWithinRange(new Date(), promo.startDate, promo.endDate, promo.noEndDate);
      const isExhausted = promo.totalUsageLimit !== undefined && promo.currentUsageCount >= promo.totalUsageLimit;
      if (!inDate) {
        couponErrorMessage = "Ten kod rabatowy wygasł lub jeszcze nie jest aktywny.";
      } else if (isExhausted) {
        couponErrorMessage = "Limit wykorzystań tego kodu rabatowego został wyczerpany.";
      } else {
        matchedPromo = promo;
      }
    } else if (participant) {
      // Blokada polecania samej siebie
      if (normalizedEmail && normalizeEmail(participant.email) === normalizedEmail) {
        couponErrorMessage = "Nie możesz skorzystać z własnego kodu polecającego.";
      } else if (!isNewCustomer && normalizedEmail) {
        couponErrorMessage = "Kod z programu poleceń (–15%) przysługuje wyłącznie na pierwsze zamówienie nowej klientki.";
      } else {
        referralParticipant = participant;
      }
    } else if (rewardCode) {
      // Kod nagrody za polecenie (15%) przypisany do e-maila polecającej
      if (normalizedEmail && normalizeEmail(rewardCode.referrerEmail) !== normalizedEmail) {
        couponErrorMessage = `Ten kod nagrody (–15%) jest przypisany do innego adresu e-mail (${rewardCode.referrerEmail}).`;
      } else {
        referralReward = rewardCode;
      }
    } else if (reviewWithReward) {
      if (normalizedEmail && normalizeEmail(reviewWithReward.customerEmail) !== normalizedEmail) {
        couponErrorMessage = `Ten kod rabatowy za opinię jest przypisany do adresu: ${reviewWithReward.customerEmail}.`;
      } else {
        reviewRewardPromo = {
          discountPercent: reviewWithReward.rewardPercentIssued || 2,
          code: reviewWithReward.rewardCodeIssued!,
          reviewId: reviewWithReward.id,
        };
      }
    } else {
      couponErrorMessage = "Podany kod rabatowy nie istnieje, został już wykorzystany lub wygasł.";
    }
  }

  // 4. Promocje automatyczne ze sklepu (Weekendowa, Powitalna –15%, etc.)
  const isWeekendNow = params.overrideWeekend !== undefined ? params.overrideWeekend : isWeekendWarsaw();
  const activeAutoPromotions = (store.promotions || []).filter((p) => {
    if (!p.isActive || !p.isAutomatic) return false;
    if (!isDateWithinRange(new Date(), p.startDate, p.endDate, p.noEndDate)) return false;
    if (p.type === "CATEGORY_WEEKEND" && !isWeekendNow) return false;
    return true;
  });

  // 5. Kalkulacja cen dla poszczególnych pozycji (Reguła 9 - wybór najlepszego rabatu)
  let originalSubtotal = 0;
  let finalSubtotal = 0;
  const itemResults: ItemCalculationResult[] = [];
  const appliedPromoMap = new Map<string, AppliedPromotionSummary>();
  let couponUsedOnAnyItem = false;

  for (const item of params.cartItems) {
    const itemOrigTotal = Math.round(item.price * item.quantity * 100) / 100;
    originalSubtotal += itemOrigTotal;

    // Pobieramy kategorię z produktu
    const product = (store.products || []).find((p) => p.id === item.productId);
    const categoryId = product?.categoryId;
    const isAlreadyDiscounted = Boolean(product?.isPromoted);

    // Szukamy dostępnych kandydatów na rabat dla tej pozycji
    interface DiscountCandidate {
      sourceName: string;
      sourceType: string;
      percent: number;
      amount: number;
      isFromCoupon: boolean;
      code?: string;
    }
    const candidates: DiscountCandidate[] = [];

    // Kandydat A: Promocje automatyczne
    for (const promo of activeAutoPromotions) {
      // Wykluczenie produktów już przecenionych
      if (promo.excludeDiscounted && isAlreadyDiscounted) continue;

      // Wykluczenia kategorii/produktów
      if (promo.excludedCategoryIds?.includes(categoryId || "")) continue;
      if (promo.excludedProductIds?.includes(item.productId)) continue;

      if (promo.type === "CATEGORY_WEEKEND") {
        if (promo.categoryIds?.includes(categoryId || "")) {
          const discountAmt = Math.round(item.price * (promo.discountValue / 100) * 100) / 100;
          candidates.push({
            sourceName: promo.publicTitle || promo.name,
            sourceType: promo.type,
            percent: promo.discountValue,
            amount: discountAmt * item.quantity,
            isFromCoupon: false,
          });
        }
      } else if (promo.type === "FIRST_ORDER") {
        if (isNewCustomer) {
          const discountAmt = Math.round(item.price * (promo.discountValue / 100) * 100) / 100;
          candidates.push({
            sourceName: promo.publicTitle || "Rabat na pierwsze zakupy –15%",
            sourceType: promo.type,
            percent: promo.discountValue,
            amount: discountAmt * item.quantity,
            isFromCoupon: false,
          });
        }
      } else if (promo.type === "PERCENTAGE") {
        let isEligible = promo.targetScope === "ALL";
        if (promo.targetScope === "CATEGORIES" && promo.categoryIds?.includes(categoryId || "")) isEligible = true;
        if (promo.targetScope === "PRODUCTS" && promo.productIds?.includes(item.productId)) isEligible = true;

        if (isEligible) {
          const discountAmt = Math.round(item.price * (promo.discountValue / 100) * 100) / 100;
          candidates.push({
            sourceName: promo.publicTitle || promo.name,
            sourceType: promo.type,
            percent: promo.discountValue,
            amount: discountAmt * item.quantity,
            isFromCoupon: false,
          });
        }
      }
    }

    // Kandydat B: Indywidualny rabat po e-mailu
    if (individualDiscount) {
      let isEligible = individualDiscount.scope === "ALL";
      if (individualDiscount.scope === "CATEGORIES" && individualDiscount.categoryIds?.includes(categoryId || "")) {
        isEligible = true;
      }
      if (individualDiscount.scope === "PRODUCTS" && individualDiscount.productIds?.includes(item.productId)) {
        isEligible = true;
      }
      if (isEligible) {
        const discountAmt = Math.round(item.price * (individualDiscount.discountPercent / 100) * 100) / 100;
        candidates.push({
          sourceName: `Twój indywidualny rabat: ${individualDiscount.discountPercent}%`,
          sourceType: "INDIVIDUAL_EMAIL",
          percent: individualDiscount.discountPercent,
          amount: discountAmt * item.quantity,
          isFromCoupon: false,
        });
      }
    }

    // Kandydat C: Wpisany kod rabatowy
    if (matchedPromo) {
      let isEligible = matchedPromo.targetScope === "ALL";
      if (matchedPromo.targetScope === "CATEGORIES" && matchedPromo.categoryIds?.includes(categoryId || "")) {
        isEligible = true;
      }
      if (matchedPromo.targetScope === "PRODUCTS" && matchedPromo.productIds?.includes(item.productId)) {
        isEligible = true;
      }
      if (matchedPromo.excludeDiscounted && isAlreadyDiscounted) isEligible = false;

      if (isEligible && matchedPromo.type === "PERCENTAGE") {
        const discountAmt = Math.round(item.price * (matchedPromo.discountValue / 100) * 100) / 100;
        candidates.push({
          sourceName: `Kod: ${matchedPromo.code} (–${matchedPromo.discountValue}%)`,
          sourceType: "COUPON_CODE",
          percent: matchedPromo.discountValue,
          amount: discountAmt * item.quantity,
          isFromCoupon: true,
          code: matchedPromo.code,
        });
      }
    } else if (referralParticipant) {
      // Program poleceń dla koleżanki: 15% na pierwsze zamówienie (zastępuje powitalny, nie sumuje się)
      const discountAmt = Math.round(item.price * 0.15 * 100) / 100;
      candidates.push({
        sourceName: `Polecenie od ${referralParticipant.customerName} (–15%)`,
        sourceType: "REFERRAL_CODE",
        percent: 15,
        amount: discountAmt * item.quantity,
        isFromCoupon: true,
        code: referralParticipant.referralCode,
      });
    } else if (referralReward) {
      // Kod nagrody 15% dla polecającej
      const discountAmt = Math.round(item.price * 0.15 * 100) / 100;
      candidates.push({
        sourceName: `Nagroda za polecenie (–15%)`,
        sourceType: "REFERRAL_REWARD",
        percent: 15,
        amount: discountAmt * item.quantity,
        isFromCoupon: true,
        code: referralReward.code,
      });
    } else if (reviewRewardPromo) {
      // Kod za opinię (2% lub 5%)
      const discountAmt = Math.round(item.price * (reviewRewardPromo.discountPercent / 100) * 100) / 100;
      candidates.push({
        sourceName: `Rabat za opinię (–${reviewRewardPromo.discountPercent}%)`,
        sourceType: "REVIEW_REWARD",
        percent: reviewRewardPromo.discountPercent,
        amount: discountAmt * item.quantity,
        isFromCoupon: true,
        code: reviewRewardPromo.code,
      });
    }

    // WYBÓR KORZYSTNIEJSZEGO RABATU DLA TEJ POZYCJI (Zasada 9)
    if (candidates.length === 0) {
      itemResults.push({
        cartItem: item,
        originalUnitPrice: item.price,
        discountedUnitPrice: item.price,
        originalTotal: itemOrigTotal,
        discountedTotal: itemOrigTotal,
        itemDiscountAmount: 0,
      });
      finalSubtotal += itemOrigTotal;
    } else {
      // Sortujemy malejąco po kwocie oszczędności
      candidates.sort((a, b) => b.amount - a.amount);
      const best = candidates[0];

      if (best.isFromCoupon) {
        couponUsedOnAnyItem = true;
      }

      const unitDiscount = Math.round(item.price * (best.percent / 100) * 100) / 100;
      const discountedUnit = Math.max(0, Math.round((item.price - unitDiscount) * 100) / 100);
      const discountedItemTotal = Math.round(discountedUnit * item.quantity * 100) / 100;
      const totalItemDiscount = Math.round((itemOrigTotal - discountedItemTotal) * 100) / 100;

      itemResults.push({
        cartItem: item,
        originalUnitPrice: item.price,
        discountedUnitPrice: discountedUnit,
        originalTotal: itemOrigTotal,
        discountedTotal: discountedItemTotal,
        itemDiscountAmount: totalItemDiscount,
        appliedPromoName: best.sourceName,
        appliedPromoType: best.sourceType,
      });

      finalSubtotal += discountedItemTotal;

      // Zapisujemy podsumowanie zniżki
      const key = best.sourceName;
      if (!appliedPromoMap.has(key)) {
        appliedPromoMap.set(key, {
          name: best.sourceName,
          type: best.sourceType,
          discountAmount: totalItemDiscount,
          code: best.code,
        });
      } else {
        const existing = appliedPromoMap.get(key)!;
        existing.discountAmount = Math.round((existing.discountAmount + totalItemDiscount) * 100) / 100;
      }
    }
  }

  originalSubtotal = Math.round(originalSubtotal * 100) / 100;
  finalSubtotal = Math.round(finalSubtotal * 100) / 100;
  const totalDiscountAmount = Math.max(0, Math.round((originalSubtotal - finalSubtotal) * 100) / 100);

  // 6. Obsługa komunikatu kuponu (jeśli kupon nie przyniósł korzyści)
  let couponMessageResult: { type: "success" | "info" | "warning" | "error"; text: string } | undefined = undefined;

  if (couponErrorMessage) {
    couponMessageResult = { type: "error", text: couponErrorMessage };
  } else if (normalizedCoupon) {
    if (couponUsedOnAnyItem) {
      if (referralParticipant) {
        couponMessageResult = {
          type: "success",
          text: `Kod polecający od ${referralParticipant.customerName} aktywny! Naliczyłyśmy –15% na Twoje pierwsze zakupy.`,
        };
      } else if (referralReward) {
        couponMessageResult = {
          type: "success",
          text: "Twój kod nagrody za polecenie (–15%) został pomyślnie naliczony!",
        };
      } else if (reviewRewardPromo) {
        couponMessageResult = {
          type: "success",
          text: `Twój kod za wystawioną opinię (–${reviewRewardPromo.discountPercent}%) został pomyślnie naliczony!`,
        };
      } else {
        couponMessageResult = {
          type: "success",
          text: `Kod rabatowy "${normalizedCoupon}" został pomyślnie naliczony!`,
        };
      }
    } else {
      couponMessageResult = {
        type: "info",
        text: `Podany kod "${normalizedCoupon}" nie obniżył ceny produktów, ponieważ dostępne promocje automatyczne (np. weekendowa) oferują już korzystniejszy lub równorzędny rabat. Twój kod pozostał niewykorzystany i możesz użyć go przy kolejnych zakupach!`,
      };
    }
  }

  // 7. Sprawdzenie Darmowej Dostawy (liczone po rabatach, od progu 300 zł)
  const freeShippingThreshold = Number(settings.freeShippingFrom || 300.0);
  const isFreeShippingEligible = finalSubtotal >= freeShippingThreshold;
  const remainingToFreeShipping = Math.max(0, Math.round((freeShippingThreshold - finalSubtotal) * 100) / 100);

  let shippingCost = 0;
  if (!isFreeShippingEligible) {
    if (shippingMethod === "INPOST_LOCKER") shippingCost = Number(settings.inpostLockerCost || 13.0);
    else if (shippingMethod === "COURIER") shippingCost = Number(settings.courierCost || 15.0);
    else if (shippingMethod === "LOCAL_PICKUP") shippingCost = 0.0;
  }

  const freeShippingMessage = isFreeShippingEligible
    ? "Twoje zamówienie ma darmową dostawę!"
    : `Do darmowej dostawy brakuje Ci ${remainingToFreeShipping.toFixed(2)} zł`;

  // 8. Sprawdzenie Prezentu na start — Skarpetki (powyżej 100 zł po rabatach, 100 zł NIE przysługuje, 100.01 przysługuje)
  const socksPromo = (store.promotions || []).find((p) => p.type === "FREE_GIFT" && p.isActive);
  const giftThreshold = socksPromo?.minOrderValue !== undefined ? socksPromo.minOrderValue : 100.0;
  const availableGiftStock = (socksPromo?.giftStockQuantity || 0) - (socksPromo?.giftReservedQuantity || 0);

  const isGiftEligible =
    Boolean(socksPromo && socksPromo.isActive) &&
    finalSubtotal > giftThreshold &&
    availableGiftStock > 0;

  const remainingToGift = Math.max(0, Math.round((giftThreshold - finalSubtotal) * 100) / 100);

  let giftItemData: { productName: string; color: string; value: number } | undefined = undefined;
  if (isGiftEligible && socksPromo) {
    const colors = socksPromo.giftAvailableColors || ["Cielisty Nude", "Kremowy Ecru", "Czarne Classic", "Pudrowy Róż"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)] || "Cielisty Nude";
    giftItemData = {
      productName: "Prezent na start — skarpetki w losowym kolorze",
      color: randomColor,
      value: 0.0,
    };
  }

  const giftMessage = isGiftEligible
    ? "Do Twojego zamówienia dodaliśmy skarpetki w prezencie!"
    : finalSubtotal > 0 && availableGiftStock > 0
    ? `Dodaj produkty za jeszcze ${(remainingToGift + 0.01).toFixed(2)} zł, aby otrzymać skarpetki w prezencie!`
    : "Prezent na otwarcie! Przy zakupach powyżej 100 zł otrzymasz skarpetki w losowym kolorze gratis. Do wyczerpania zapasów.";

  const grandTotal = Math.round((finalSubtotal + shippingCost) * 100) / 100;

  return {
    originalSubtotal,
    totalDiscountAmount,
    finalSubtotal,
    shippingCost,
    grandTotal,
    items: itemResults,
    appliedPromotions: Array.from(appliedPromoMap.values()),
    couponMessage: couponMessageResult,
    freeShipping: {
      isFree: isFreeShippingEligible,
      remainingToFree: remainingToFreeShipping,
      threshold: freeShippingThreshold,
      message: freeShippingMessage,
    },
    gift: {
      isEligible: isGiftEligible,
      remainingToGift,
      threshold: giftThreshold,
      giftItem: giftItemData,
      message: giftMessage,
    },
    individualDiscountPercent: individualDiscount?.discountPercent,
    referralApplied: referralParticipant
      ? { code: referralParticipant.referralCode, referrerEmail: referralParticipant.email }
      : undefined,
  };
}
