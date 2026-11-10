import { NextRequest, NextResponse } from "next/server";
import { createOrder, getStoreSettings, getProductById } from "@/lib/store-data";
import { calculateOrderPromotions } from "@/lib/promotion-engine";
import { ShippingMethod, PaymentMethod, OrderItem } from "@/lib/types";

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
      if (!product) {
        return NextResponse.json(
          { error: `Produkt nie istnieje lub został usunięty: ${item.name}` },
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

      // Rzeczywista cena z bazy danych
      const unitPrice =
        product.isPromoted && product.promotionalPrice && product.promotionalPrice < product.basePrice
          ? product.promotionalPrice
          : product.basePrice;

      const itemTotal = unitPrice * item.quantity;
      verifiedSubtotal += itemTotal;

      verifiedOrderItems.push({
        id: `oi-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        orderId: "", // uzupełniane w createOrder
        variantId: variant.id,
        productNameSnapshot: product.name,
        variantSnapshot: `Rozmiar: ${variant.size}, Kolor: ${variant.color}, SKU: ${variant.sku}`,
        unitPriceSnapshot: unitPrice,
        quantity: item.quantity,
        totalSnapshot: itemTotal,
        productImageUrl: item.imageUrl,
      });
    }

    // Wyliczenie rabatów, promocji, prezentu i kosztów dostawy
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

    // Czas wygaśnięcia rezerwacji (60 minut)
    const reservedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const order = await createOrder({
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
      paymentStatus: "PENDING", // Płatność oczekuje - oddzielona od realizacji!
      fulfillmentStatus: "NEW", // Nowe zamówienie
      subtotalAmount: finalSubtotal,
      originalSubtotal: verifiedSubtotal,
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
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (err: any) {
    console.error("Błąd tworzenia zamówienia:", err);
    return NextResponse.json(
      { error: err.message || "Wystąpił błąd podczas składania zamówienia." },
      { status: 500 }
    );
  }
}
