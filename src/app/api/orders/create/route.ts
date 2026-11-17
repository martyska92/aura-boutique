import { NextRequest, NextResponse } from "next/server";
import { createOrder, getStoreSettings, getProductById } from "@/lib/store-data";
import { calculateOrderPromotions } from "@/lib/promotion-engine";
import { ShippingMethod, PaymentMethod, OrderItem } from "@/lib/types";
import {
  isP24Configured,
  registerP24Transaction,
  isPayUConfigured,
  registerPayUTransaction,
  getTraditionalTransferDetails,
  generateOrderAccessKey,
} from "@/lib/payment-service";
import { getUserSession } from "@/lib/admin-auth";
import { sendOrderPlacedCustomerEmail } from "@/lib/email-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerFirstName,
      customerLastName,
      customerEmail,
      customerPhone,
      shippingMethod,
      parcelLockerCode,
      shippingStreet,
      shippingCity,
      shippingPostalCode,
      paymentMethod,
      customerNotes,
      cartItems,
      couponCode,
    } = body;

    // Podstawowa walidacja pól
    if (!customerFirstName || !customerLastName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { error: "Wszystkie dane zamawiającej są wymagane." },
        { status: 400 }
      );
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: "Koszyk jest pusty." },
        { status: 400 }
      );
    }

    if (shippingMethod === "INPOST_LOCKER" && !parcelLockerCode) {
      return NextResponse.json(
        { error: "Podaj kod paczkomatu InPost (np. ZMI01M)." },
        { status: 400 }
      );
    }

    if (
      shippingMethod === "COURIER" &&
      (!shippingStreet || !shippingCity || !shippingPostalCode)
    ) {
      return NextResponse.json(
        { error: "Podaj pełny adres doręczenia dla kuriera." },
        { status: 400 }
      );
    }

    const settings = await getStoreSettings();

    // WERYFIKACJA CEN I STANÓW PO STRONIE SERWERA
    let verifiedSubtotal = 0;
    const verifiedOrderItems: OrderItem[] = [];

    for (const item of cartItems) {
      const product = await getProductById(item.productId);
      if (!product || product.isArchived || !product.isPublished) {
        return NextResponse.json(
          { error: `Produkt nie jest już dostępny w sprzedaży: ${item.name}` },
          { status: 400 }
        );
      }

      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) {
        return NextResponse.json(
          { error: `Wariant nie istnieje dla produktu ${product.name}` },
          { status: 400 }
        );
      }

      // Sprawdzenie dostępnego stanu
      const available = variant.stockQuantity - variant.reservedQuantity;
      if (available < item.quantity) {
        return NextResponse.json(
          {
            error: `Brak wystarczającej ilości sztuk dla: ${product.name} (${variant.size}, ${variant.color}). Dostępne tylko ${available} szt.`,
          },
          { status: 400 }
        );
      }

      // Rzeczywista cena bazowa z bazy danych
      const unitPrice =
        product.isPromoted && product.promotionalPrice && product.promotionalPrice < product.basePrice
          ? product.promotionalPrice
          : product.basePrice;

      const itemTotal = unitPrice * item.quantity;
      verifiedSubtotal += itemTotal;
    }

    // Wyliczenie rabatów, promocji, prezentu i kosztów dostawy na silniku promocji
    const promoResult = await calculateOrderPromotions({
      cartItems,
      customerEmail,
      couponCode,
      shippingMethod: shippingMethod as ShippingMethod,
      customSettings: settings,
    });

    const discountAmount = promoResult.totalDiscountAmount;
    const finalSubtotal = promoResult.finalSubtotal;
    const shippingCost = promoResult.shippingCost;
    const totalAmount = promoResult.grandTotal;
    const giftItem = promoResult.gift.isEligible ? promoResult.gift.giftItem : undefined;
    const referralCodeUsed = promoResult.referralApplied?.code;
    const referrerEmail = promoResult.referralApplied?.referrerEmail;

    // Przygotowanie szczegółowych pozycji zamówienia z odróżnieniem ceny przed i po rabacie
    for (const item of cartItems) {
      const product = await getProductById(item.productId);
      const variant = product?.variants.find((v) => v.id === item.variantId);
      const calcItem = promoResult.items.find(
        (ci) => ci.cartItem.variantId === item.variantId || ci.cartItem.productId === item.productId
      );

      const origUnit = calcItem ? calcItem.originalUnitPrice : item.price;
      const discUnit = calcItem ? calcItem.discountedUnitPrice : item.price;
      const origTotal = calcItem ? calcItem.originalTotal : item.price * item.quantity;
      const discTotal = calcItem ? calcItem.discountedTotal : item.price * item.quantity;
      const itemDisc = calcItem ? calcItem.itemDiscountAmount : 0;
      const promoName = calcItem?.appliedPromoName;

      verifiedOrderItems.push({
        id: `oi-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        orderId: "", // uzupełniane w createOrder
        variantId: variant?.id,
        productNameSnapshot: product?.name || item.name,
        variantSnapshot: variant
          ? `Rozmiar: ${variant.size}, Kolor: ${variant.color}, SKU: ${variant.sku}`
          : `Ilość: ${item.quantity}`,
        unitPriceSnapshot: origUnit, // wyjściowa cena jednostkowa
        originalUnitPrice: origUnit,
        discountedUnitPrice: discUnit,
        quantity: item.quantity,
        totalSnapshot: discTotal, // suma za pozycję po uwzględnieniu rabatu
        originalTotalSnapshot: origTotal,
        discountAmount: itemDisc,
        appliedPromoName: promoName,
        productImageUrl: item.imageUrl,
      });
    }

    // Bezpieczny unikalny klucz dostępu (token) do zamówienia bez ujawniania sekwencyjnego numeru
    const accessKey = generateOrderAccessKey();

    // Czas wygaśnięcia rezerwacji (60 minut)
    const reservedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    let customerId: string | undefined = undefined;
    try {
      const session = await getUserSession();
      if (session && session.email && session.email.toLowerCase() === customerEmail.trim().toLowerCase()) {
        const store = (await import("@/lib/store-data")).loadLocalStore();
        const customer = (store.customers || []).find((c) => c.email.toLowerCase() === session.email.toLowerCase());
        if (customer) customerId = customer.id;
      }
    } catch {}

    const orderInput: any = {
      customerId,
      accessKey,
      customerFirstName,
      customerLastName,
      customerEmail,
      customerPhone,
      shippingMethod: shippingMethod as ShippingMethod,
      parcelLockerCode: shippingMethod === "INPOST_LOCKER" ? parcelLockerCode : undefined,
      shippingStreet: shippingMethod === "COURIER" ? shippingStreet : undefined,
      shippingCity: shippingMethod === "COURIER" ? shippingCity : undefined,
      shippingPostalCode: shippingMethod === "COURIER" ? shippingPostalCode : undefined,
      paymentMethod: paymentMethod as PaymentMethod,
      paymentStatus: "PENDING", // Płatność oczekuje - ściśle oddzielona od statusu realizacji!
      fulfillmentStatus: "NEW", // Nowe zamówienie - nie uruchamia wysyłki przed zapłatą
      subtotalAmount: finalSubtotal,
      originalSubtotal: promoResult.originalSubtotal,
      discountAmount,
      appliedPromotions: promoResult.appliedPromotions,
      giftItem,
      referralCodeUsed,
      referrerEmail,
      shippingCost,
      totalAmount,
      customerNotes,
      reservedUntil,
      items: verifiedOrderItems,
    };

    if (paymentMethod === "TRADITIONAL_TRANSFER") {
      orderInput.bankTransferDetails = getTraditionalTransferDetails(
        { ...orderInput, id: "temp", orderNumber: "AURA-PENDING" },
        settings
      );
    }

    const order = await createOrder(orderInput);

    // Jeśli wybrano przelew tradycyjny, uzupełniamy tytuł o ostateczny numer zamówienia
    if (order.paymentMethod === "TRADITIONAL_TRANSFER") {
      order.bankTransferDetails = getTraditionalTransferDetails(order, settings);
    }

    // Jeśli płatność online (PayU, BLIK, Przelewy24), sprawdzamy konfigurację i rejestrujemy transakcję
    let paymentUrl: string | undefined = undefined;
    let paymentError: string | undefined = undefined;

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;
    const returnUrl = `${origin}/zamowienie/${order.id}/potwierdzenie?key=${order.accessKey}&check=1`;

    const isPayUOnline =
      paymentMethod === "PAYU" ||
      ((paymentMethod === "BLIK" || paymentMethod === "PRZELEWY24") &&
        settings.defaultPaymentGateway === "PAYU" &&
        isPayUConfigured(settings));

    if (isPayUOnline && isPayUConfigured(settings)) {
      const notifyUrl = `${origin}/api/payments/payu/notify`;
      const payuRes = await registerPayUTransaction({
        order,
        returnUrl,
        notifyUrl,
        customSettings: settings,
      });

      if (payuRes.success && payuRes.paymentUrl) {
        paymentUrl = payuRes.paymentUrl;
      } else {
        paymentError = payuRes.error;
        console.warn("Rejestracja PayU nie powiodła się:", payuRes.error);
      }
    } else if (paymentMethod === "BLIK" || paymentMethod === "PRZELEWY24") {
      if (isP24Configured(settings)) {
        const statusUrl = `${origin}/api/payments/p24/notify`;

        const p24Res = await registerP24Transaction({
          order,
          returnUrl,
          statusUrl,
        });

        if (p24Res.success && p24Res.paymentUrl) {
          paymentUrl = p24Res.paymentUrl;
        } else {
          paymentError = p24Res.error;
          console.warn("Rejestracja P24 nie powiodła się:", p24Res.error);
        }
      }
    }

    // Wysłanie wiadomości e-mail o przyjęciu zamówienia (asynchronicznie - błąd SMTP nie blokuje zamówienia)
    try {
      await sendOrderPlacedCustomerEmail(order, settings);
    } catch (mailErr) {
      console.error("Błąd wysyłki e-mail o złożeniu zamówienia (SMTP):", mailErr);
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      accessKey: order.accessKey,
      paymentUrl,
      paymentError,
      isP24Configured: isP24Configured(settings),
    });
  } catch (err: any) {
    console.error("Błąd tworzenia zamówienia:", err);
    return NextResponse.json(
      { error: err.message || "Wystąpił błąd podczas składania zamówienia." },
      { status: 500 }
    );
  }
}
