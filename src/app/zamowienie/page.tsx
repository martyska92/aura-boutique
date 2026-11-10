"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  MapPin,
  Sparkles,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  Check,
  Search,
  Gift,
  Tag,
  Loader2,
  X,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";
import { ShippingMethod, PaymentMethod } from "@/lib/types";

interface InpostPoint {
  name: string;
  city: string;
  street: string;
  postalCode?: string;
  description?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("INPOST_LOCKER");
  const [parcelLockerCode, setParcelLockerCode] = useState("");
  const [selectedPoint, setSelectedPoint] = useState<InpostPoint | null>(null);
  const [inpostQuery, setInpostQuery] = useState("");
  const [inpostSuggestions, setInpostSuggestions] = useState<InpostPoint[]>([]);
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BLIK");
  const [notes, setNotes] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Kody rabatowe i promocje
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const [discountAmount, setDiscountAmount] = useState(0);
  const [giftItem, setGiftItem] = useState<{ productName: string; color: string; value: number } | null>(null);
  const [serverShippingCost, setServerShippingCost] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pobieranie punktów InPost (debounced)
  useEffect(() => {
    if (shippingMethod !== "INPOST_LOCKER") return;
    if (!inpostQuery.trim()) {
      setInpostSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingPoints(true);
      try {
        const res = await fetch(`/api/inpost/points?query=${encodeURIComponent(inpostQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setInpostSuggestions(data.points || []);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("Błąd wyszukiwania paczkomatów:", err);
      } finally {
        setIsLoadingPoints(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [inpostQuery, shippingMethod]);

  // Przeliczanie promocji i rabatów (serwer)
  const calculatePromotions = async (couponToTest?: string) => {
    if (items.length === 0) return;
    setIsApplyingCoupon(true);

    try {
      const code = couponToTest !== undefined ? couponToTest : appliedCouponCode;
      const res = await fetch("/api/promotions/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: items,
          customerEmail: email.trim(),
          couponCode: code.trim(),
          shippingMethod,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDiscountAmount(data.totalDiscountAmount || 0);
        setServerShippingCost(data.shippingCost);

        if (data.gift?.isEligible && data.gift?.giftItem) {
          setGiftItem(data.gift.giftItem);
        } else {
          setGiftItem(null);
        }

        if (couponToTest !== undefined) {
          if (data.couponMessage) {
            setCouponFeedback({
              type: data.couponMessage.type === "error" ? "error" : "success",
              text: data.couponMessage.text,
            });
            if (data.couponMessage.type !== "error") {
              setAppliedCouponCode(couponToTest.trim().toUpperCase());
            }
          } else if (couponToTest.trim()) {
            setCouponFeedback({
              type: "success",
              text: `Kod rabatowy "${couponToTest.trim().toUpperCase()}" został pomyślnie naliczony!`,
            });
            setAppliedCouponCode(couponToTest.trim().toUpperCase());
          }
        }
      }
    } catch (err) {
      console.error("Błąd kalkulacji promocji:", err);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Automatyczne odświeżenie rabatów przy zmianie dostawy lub e-maila
  useEffect(() => {
    calculatePromotions();
  }, [shippingMethod, email, items]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) {
      setCouponFeedback({ type: "error", text: "Wpisz kod rabatowy lub polecający." });
      return;
    }
    calculatePromotions(couponCodeInput.trim().toUpperCase());
  };

  const handleRemoveCoupon = () => {
    setAppliedCouponCode("");
    setCouponCodeInput("");
    setCouponFeedback(null);
    calculatePromotions("");
  };

  const handleSelectPoint = (point: InpostPoint) => {
    setParcelLockerCode(point.name);
    setSelectedPoint(point);
    setInpostQuery(`${point.name} - ${point.street}, ${point.city}`);
    setShowSuggestions(false);
  };

  const freeShippingThreshold = 300;
  const isFreeShipping = subtotal >= freeShippingThreshold;

  let fallbackShippingCost = 0;
  if (!isFreeShipping) {
    if (shippingMethod === "INPOST_LOCKER") fallbackShippingCost = 13.0;
    else if (shippingMethod === "COURIER") fallbackShippingCost = 15.0;
    else if (shippingMethod === "LOCAL_PICKUP") fallbackShippingCost = 0.0;
  }

  const shippingCost = serverShippingCost !== null ? serverShippingCost : fallbackShippingCost;
  const finalSubtotal = Math.max(0, subtotal - discountAmount);
  const grandTotal = finalSubtotal + shippingCost;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (items.length === 0) {
      setErrorMessage("Twój koszyk jest pusty.");
      return;
    }

    if (!acceptTerms) {
      setErrorMessage("Prosimy o zaakceptowanie regulaminu sklepu przed złożeniem zamówienia.");
      return;
    }

    if (shippingMethod === "INPOST_LOCKER" && !parcelLockerCode.trim()) {
      setErrorMessage("Proszę wybrać paczkomat InPost z listy lub wpisać jego kod (np. PEL01M, ZMI01M).");
      return;
    }

    if (shippingMethod === "COURIER" && (!street.trim() || !city.trim() || !postalCode.trim())) {
      setErrorMessage("Podaj pełny adres dostawy dla kuriera.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerFirstName: firstName,
          customerLastName: lastName,
          customerEmail: email,
          customerPhone: phone,
          shippingMethod,
          parcelLockerCode: shippingMethod === "INPOST_LOCKER" ? parcelLockerCode.trim().toUpperCase() : undefined,
          shippingStreet: shippingMethod === "COURIER" ? street.trim() : undefined,
          shippingCity: shippingMethod === "COURIER" ? city.trim() : undefined,
          shippingPostalCode: shippingMethod === "COURIER" ? postalCode.trim() : undefined,
          paymentMethod,
          customerNotes: notes,
          cartItems: items,
          couponCode: appliedCouponCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas składania zamówienia.");
      }

      // Czyścimy koszyk i przechodzimy do potwierdzenia
      clearCart();
      router.push(`/zamowienie/${data.orderId}/potwierdzenie`);
    } catch (err: any) {
      setErrorMessage(err.message || "Nie udało się złożyć zamówienia. Spróbuj ponownie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-[#FAF6F1] py-16 text-center">
          <div className="max-w-md mx-auto p-8 bg-white border border-[#EADFD5] rounded-xs shadow-xs">
            <h1 className="font-serif text-2xl text-[#241D1B] mb-2">Twój koszyk jest pusty</h1>
            <p className="text-xs text-[#857670] mb-6">
              Dodaj produkty do koszyka, aby przejść do kasy.
            </p>
            <Link
              href="/katalog"
              className="px-6 py-3 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-widest inline-block rounded-xs shadow-xs transition-colors"
            >
              Przejdź do katalogu
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#FAF6F1] py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#C5A069] font-semibold mb-1">
              Bezpieczne Zamówienie
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#241D1B]">
              Kasa & Dostawa
            </h1>
            <p className="text-xs sm:text-sm text-[#857670] mt-1 font-light">
              Zamawiasz jako gość — bez konieczności zakładania konta i logowania.
            </p>
          </div>

          {errorMessage && (
            <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 rounded-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmitOrder}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Lewa strona: Dane, Dostawa, Płatność */}
              <div className="lg:col-span-7 space-y-8">
                {/* Krok 1: Dane zamawiającej */}
                <div className="bg-white p-6 sm:p-8 border border-[#EADFD5] rounded-xs shadow-xs space-y-4">
                  <h2 className="font-serif text-lg text-[#241D1B] flex items-center gap-2 pb-3 border-b border-[#EADFD5]">
                    <span className="w-6 h-6 rounded-full bg-[#C5A069] text-white text-xs flex items-center justify-center font-sans font-semibold">
                      1
                    </span>
                    <span>Dane Zamawiającej</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-[#857670] block mb-1">Imię *</label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#857670] block mb-1">Nazwisko *</label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-[#857670] block mb-1">
                        Adres e-mail * (potwierdzenie zamówienia)
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#857670] block mb-1">
                        Numer telefonu * (do powiadomień SMS o odbiorze)
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+48 000 000 000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Krok 2: Sposób dostawy */}
                <div className="bg-white p-6 sm:p-8 border border-[#EADFD5] rounded-xs shadow-xs space-y-4">
                  <h2 className="font-serif text-lg text-[#241D1B] flex items-center gap-2 pb-3 border-b border-[#EADFD5]">
                    <span className="w-6 h-6 rounded-full bg-[#C5A069] text-white text-xs flex items-center justify-center font-sans font-semibold">
                      2
                    </span>
                    <span>Sposób Dostawy</span>
                  </h2>

                  <div className="space-y-3">
                    {/* Paczkomaty InPost */}
                    <div
                      className={`p-4 border rounded-xs transition-all ${
                        shippingMethod === "INPOST_LOCKER"
                          ? "border-[#C5A069] bg-[#FDFBF7] shadow-xs"
                          : "border-[#EADFD5] hover:border-[#C5A069]"
                      }`}
                    >
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            checked={shippingMethod === "INPOST_LOCKER"}
                            onChange={() => setShippingMethod("INPOST_LOCKER")}
                            className="accent-[#C5A069]"
                          />
                          <div>
                            <p className="text-xs font-semibold text-[#241D1B] flex items-center gap-1.5">
                              <span>Paczkomaty InPost</span>
                              <span className="text-[10px] bg-[#C5A069]/15 text-[#8C6B38] px-1.5 py-0.5 rounded font-mono font-medium">
                                24/7
                              </span>
                            </p>
                            <p className="text-[11px] text-[#857670]">
                              Odbierz w dowolnym automacie paczkowym InPost
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#241D1B]">
                          {isFreeShipping ? "0.00 PLN (Darmowa)" : "13.00 PLN"}
                        </span>
                      </label>

                      {/* Rozszerzenie wyboru Paczkomatu InPost */}
                      {shippingMethod === "INPOST_LOCKER" && (
                        <div className="mt-3 pt-3 border-t border-[#EADFD5] space-y-3">
                          {/* Wyświetlenie wybranego paczkomatu jeśli już jest */}
                          {selectedPoint || parcelLockerCode ? (
                            <div className="p-3 bg-[#FAF6F1] border border-[#C5A069] rounded-xs flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5">
                                <div className="w-6 h-6 rounded-full bg-[#C5A069] text-white flex items-center justify-center shrink-0 mt-0.5">
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-[#241D1B] flex items-center gap-2">
                                    <span>Wybrany Paczkomat:</span>
                                    <span className="px-2 py-0.5 bg-[#241D1B] text-[#E5D7B7] font-mono rounded text-[11px]">
                                      {selectedPoint?.name || parcelLockerCode}
                                    </span>
                                  </p>
                                  <p className="text-xs text-[#4A3F3B] mt-0.5">
                                    {selectedPoint ? `${selectedPoint.street}, ${selectedPoint.city}` : "Paczkomat InPost"}
                                  </p>
                                  {selectedPoint?.description && (
                                    <p className="text-[11px] text-[#857670] mt-0.5 italic">
                                      {selectedPoint.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPoint(null);
                                  setParcelLockerCode("");
                                  setInpostQuery("");
                                  setShowSuggestions(true);
                                }}
                                className="text-xs text-[#C5A069] hover:text-[#AF884F] font-semibold underline shrink-0"
                              >
                                Zmień
                              </button>
                            </div>
                          ) : null}

                          {/* Pole wyszukiwania z autouzupełnianiem */}
                          {(!selectedPoint && !parcelLockerCode) && (
                            <div className="relative">
                              <label className="text-[11px] text-[#857670] block mb-1">
                                Wpisz miejscowość, ulicę lub kod Paczkomatu (np. Pełczyń, Żmigród, ZMI01M) *
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Zacznij pisać np. Pełczyń, Żmigród, Wrocławska..."
                                  value={inpostQuery}
                                  onChange={(e) => {
                                    setInpostQuery(e.target.value);
                                    setShowSuggestions(true);
                                  }}
                                  onFocus={() => setShowSuggestions(true)}
                                  className="w-full bg-white border border-[#EADFD5] pl-9 pr-9 py-2.5 text-xs text-[#241D1B] placeholder:text-[#B5A59E] focus:outline-none focus:border-[#C5A069] rounded-xs shadow-inner"
                                />
                                <Search className="w-4 h-4 text-[#857670] absolute left-3 top-3" />
                                {isLoadingPoints && (
                                  <Loader2 className="w-4 h-4 text-[#C5A069] animate-spin absolute right-3 top-3" />
                                )}
                              </div>

                              {/* Rozwijana lista podpowiedzi Paczkomatów */}
                              {showSuggestions && inpostSuggestions.length > 0 && (
                                <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-[#C5A069] rounded-xs shadow-xl z-30 divide-y divide-[#FAF6F1]">
                                  {inpostSuggestions.map((point) => (
                                    <div
                                      key={point.name}
                                      onClick={() => handleSelectPoint(point)}
                                      className="p-3 hover:bg-[#FAF6F1] cursor-pointer transition-colors flex items-start justify-between gap-3 text-xs"
                                    >
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-bold text-[#241D1B] px-1.5 py-0.5 bg-[#FAF6F1] border border-[#EADFD5] rounded text-[11px]">
                                            {point.name}
                                          </span>
                                          <span className="font-semibold text-[#241D1B]">
                                            {point.city}, {point.street}
                                          </span>
                                        </div>
                                        {point.description && (
                                          <p className="text-[11px] text-[#857670] mt-1">
                                            {point.description}
                                          </p>
                                        )}
                                      </div>
                                      <span className="text-[11px] text-[#C5A069] font-medium shrink-0 pt-0.5">
                                        Wybierz →
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Szybkie propozycje w rejonie */}
                              <div className="pt-2">
                                <p className="text-[11px] text-[#857670] mb-1.5">
                                  Popularne punkty w rejonie Żmigrodu i Pełczyna:
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSelectPoint({
                                        name: "PEL01M",
                                        city: "Pełczyń",
                                        street: "ul. Główna 15",
                                        description: "Centrum miejscowości Pełczyń",
                                      })
                                    }
                                    className="px-2.5 py-1 bg-white hover:bg-[#FAF6F1] border border-[#EADFD5] hover:border-[#C5A069] text-[11px] text-[#241D1B] rounded transition-colors flex items-center gap-1"
                                  >
                                    <MapPin className="w-3 h-3 text-[#C5A069]" />
                                    <span>Pełczyń (PEL01M)</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSelectPoint({
                                        name: "ZMI01M",
                                        city: "Żmigród",
                                        street: "ul. Poprzeczna 3/1A",
                                        description: "Butik AURA / Centrum",
                                      })
                                    }
                                    className="px-2.5 py-1 bg-white hover:bg-[#FAF6F1] border border-[#EADFD5] hover:border-[#C5A069] text-[11px] text-[#241D1B] rounded transition-colors flex items-center gap-1"
                                  >
                                    <MapPin className="w-3 h-3 text-[#C5A069]" />
                                    <span>Żmigród Poprzeczna (ZMI01M)</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSelectPoint({
                                        name: "ZMG01BAPP",
                                        city: "Żmigród",
                                        street: "ul. Wrocławska 36A",
                                        description: "Market Dino",
                                      })
                                    }
                                    className="px-2.5 py-1 bg-white hover:bg-[#FAF6F1] border border-[#EADFD5] hover:border-[#C5A069] text-[11px] text-[#241D1B] rounded transition-colors flex items-center gap-1"
                                  >
                                    <MapPin className="w-3 h-3 text-[#C5A069]" />
                                    <span>Żmigród Dino (ZMG01BAPP)</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Kurier */}
                    <div
                      className={`p-4 border rounded-xs transition-all ${
                        shippingMethod === "COURIER"
                          ? "border-[#C5A069] bg-[#FDFBF7] shadow-xs"
                          : "border-[#EADFD5] hover:border-[#C5A069]"
                      }`}
                    >
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            checked={shippingMethod === "COURIER"}
                            onChange={() => setShippingMethod("COURIER")}
                            className="accent-[#C5A069]"
                          />
                          <div>
                            <p className="text-xs font-semibold text-[#241D1B]">
                              Kurier (InPost / DPD)
                            </p>
                            <p className="text-[11px] text-[#857670]">
                              Dostawa prosto pod Twoje drzwi w 24–48h
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#241D1B]">
                          {isFreeShipping ? "0.00 PLN (Darmowa)" : "15.00 PLN"}
                        </span>
                      </label>

                      {shippingMethod === "COURIER" && (
                        <div className="mt-3 pt-3 border-t border-[#EADFD5] space-y-3">
                          <div>
                            <label className="text-[11px] text-[#857670] block mb-1">
                              Ulica i numer domu/lokalu *
                            </label>
                            <input
                              type="text"
                              value={street}
                              onChange={(e) => setStreet(e.target.value)}
                              className="w-full bg-white border border-[#EADFD5] p-2 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-xs"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] text-[#857670] block mb-1">
                                Kod pocztowy *
                              </label>
                              <input
                                type="text"
                                placeholder="00-000"
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value)}
                                className="w-full bg-white border border-[#EADFD5] p-2 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-[#857670] block mb-1">
                                Miejscowość *
                              </label>
                              <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full bg-white border border-[#EADFD5] p-2 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Odbiór osobisty w butiku w Żmigrodzie */}
                    <div
                      className={`p-4 border rounded-xs transition-all ${
                        shippingMethod === "LOCAL_PICKUP"
                          ? "border-[#C5A069] bg-[#FDFBF7] shadow-xs"
                          : "border-[#EADFD5] hover:border-[#C5A069]"
                      }`}
                    >
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            checked={shippingMethod === "LOCAL_PICKUP"}
                            onChange={() => setShippingMethod("LOCAL_PICKUP")}
                            className="accent-[#C5A069]"
                          />
                          <div>
                            <p className="text-xs font-semibold text-[#241D1B] flex items-center gap-1.5">
                              <span>Odbiór osobisty w Butiku w Żmigrodzie</span>
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                                Bezpłatny
                              </span>
                            </p>
                            <p className="text-[11px] text-[#857670]">
                              Żmigród, ul. Poprzeczna 3/1A • Gotowe do odbioru po potwierdzeniu
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-emerald-700">0.00 PLN</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Krok 3: Sposób płatności */}
                <div className="bg-white p-6 sm:p-8 border border-[#EADFD5] rounded-xs shadow-xs space-y-4">
                  <h2 className="font-serif text-lg text-[#241D1B] flex items-center gap-2 pb-3 border-b border-[#EADFD5]">
                    <span className="w-6 h-6 rounded-full bg-[#C5A069] text-white text-xs flex items-center justify-center font-sans font-semibold">
                      3
                    </span>
                    <span>Sposób Płatności</span>
                  </h2>

                  <div className="space-y-3">
                    <label
                      className={`block p-4 border rounded-xs cursor-pointer transition-all ${
                        paymentMethod === "BLIK"
                          ? "border-[#C5A069] bg-[#FDFBF7] shadow-xs"
                          : "border-[#EADFD5] hover:border-[#C5A069]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === "BLIK"}
                            onChange={() => setPaymentMethod("BLIK")}
                            className="accent-[#C5A069]"
                          />
                          <div>
                            <p className="text-xs font-semibold text-[#241D1B]">
                              BLIK (Szybka płatność)
                            </p>
                            <p className="text-[11px] text-[#857670]">
                              Bezpieczna i natychmiastowa płatność kodem 6-cyfrowym
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#C5A069] bg-[#C5A069]/10 px-2 py-0.5 rounded">
                          BLIK
                        </span>
                      </div>
                    </label>

                    <label
                      className={`block p-4 border rounded-xs cursor-pointer transition-all ${
                        paymentMethod === "PRZELEWY24"
                          ? "border-[#C5A069] bg-[#FDFBF7] shadow-xs"
                          : "border-[#EADFD5] hover:border-[#C5A069]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === "PRZELEWY24"}
                            onChange={() => setPaymentMethod("PRZELEWY24")}
                            className="accent-[#C5A069]"
                          />
                          <div>
                            <p className="text-xs font-semibold text-[#241D1B]">
                              Przelewy24 (Szybki przelew online / Karta)
                            </p>
                            <p className="text-[11px] text-[#857670]">
                              Wygodna płatność przez Twój bank lub kartę płatniczą
                            </p>
                          </div>
                        </div>
                      </div>
                    </label>

                    <label
                      className={`block p-4 border rounded-xs cursor-pointer transition-all ${
                        paymentMethod === "TRADITIONAL_TRANSFER"
                          ? "border-[#C5A069] bg-[#FDFBF7] shadow-xs"
                          : "border-[#EADFD5] hover:border-[#C5A069]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === "TRADITIONAL_TRANSFER"}
                            onChange={() => setPaymentMethod("TRADITIONAL_TRANSFER")}
                            className="accent-[#C5A069]"
                          />
                          <div>
                            <p className="text-xs font-semibold text-[#241D1B]">
                              Tradycyjny przelew bankowy na konto butiku
                            </p>
                            <p className="text-[11px] text-[#857670]">
                              Dane do przelewu i numer konta otrzymasz na kolejnym ekranie
                            </p>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Uwagi i zgody */}
                <div className="bg-white p-6 sm:p-8 border border-[#EADFD5] rounded-xs shadow-xs space-y-4">
                  <div>
                    <label className="text-xs text-[#857670] block mb-1">
                      Uwagi do zamówienia (opcjonalnie)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Np. zapakuj na prezent, wskazówki dla doręczyciela..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-xs"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 text-xs text-[#4A3F3B] cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-0.5 accent-[#C5A069] w-4 h-4 rounded"
                      />
                      <span>
                        Akceptuję{" "}
                        <Link href="/regulamin" target="_blank" className="underline font-semibold hover:text-[#C5A069]">
                          Regulamin
                        </Link>{" "}
                        oraz{" "}
                        <Link href="/polityka-prywatnosci" target="_blank" className="underline font-semibold hover:text-[#C5A069]">
                          Politykę Prywatności
                        </Link>{" "}
                        butiku AURA Boutique K.B. *
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Prawa strona: Podsumowanie koszyka, KOD RABATOWY, Gratisy i Płatność */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 sm:p-8 border border-[#EADFD5] rounded-xs shadow-xs space-y-5 sticky top-28">
                  <h3 className="font-serif text-lg text-[#241D1B] border-b border-[#EADFD5] pb-3 uppercase tracking-wider">
                    Twoje Zamówienie
                  </h3>

                  {/* Lista pozycji */}
                  <div className="divide-y divide-[#EADFD5] max-h-72 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div key={item.variantId} className="py-3 flex gap-3 text-xs first:pt-0">
                        <div className="relative w-14 h-18 bg-[#FAF6F1] shrink-0 border border-[#EADFD5] rounded-xs overflow-hidden">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                            unoptimized={item.imageUrl.startsWith("data:")}
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <p className="font-serif text-xs font-medium text-[#241D1B] line-clamp-1">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-[#857670]">
                              {item.size} • {item.color} • {item.quantity} szt.
                            </p>
                          </div>
                          <p className="text-xs font-semibold text-[#241D1B] text-right">
                            {(item.price * item.quantity).toFixed(2)} PLN
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 🎁 Prezent za zakupy powyżej 100 zł */}
                  {giftItem && (
                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xs flex items-center justify-between gap-2.5 text-xs text-amber-900 animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-[#C5A069] shrink-0" />
                        <div>
                          <p className="font-semibold text-[11px]">
                            Prezent na otwarcie: {giftItem.productName}
                          </p>
                          <p className="text-[10px] text-amber-700">
                            Kolor: {giftItem.color} • Gratis do Twojego zamówienia
                          </p>
                        </div>
                      </div>
                      <span className="font-bold font-mono text-[11px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                        0.00 PLN
                      </span>
                    </div>
                  )}

                  {/* 🏷️ POLE: Wpisz kod rabatowy */}
                  <div className="pt-2 border-t border-[#EADFD5]">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#C5A069]" />
                      <label className="text-xs font-semibold text-[#241D1B]">
                        Masz kod rabatowy lub polecający?
                      </label>
                    </div>

                    {appliedCouponCode ? (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xs flex items-center justify-between text-xs text-emerald-800">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <p className="font-bold font-mono uppercase">{appliedCouponCode}</p>
                            <p className="text-[11px] text-emerald-700">
                              Rabat został naliczony do Twojego zamówienia
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-[11px] text-red-600 hover:text-red-800 font-semibold underline p-1"
                        >
                          Usuń
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Wpisz kod rabatowy (np. OTWARCIE)"
                          value={couponCodeInput}
                          onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                          className="flex-1 bg-[#FAF6F1] border border-[#EADFD5] px-3 py-2 text-xs uppercase font-mono text-[#241D1B] placeholder:text-[#A89A92] placeholder:normal-case placeholder:font-sans focus:outline-none focus:border-[#C5A069] rounded-xs"
                        />
                        <button
                          type="button"
                          disabled={isApplyingCoupon || !couponCodeInput.trim()}
                          onClick={handleApplyCoupon}
                          className="px-4 py-2 bg-[#241D1B] hover:bg-[#3D332F] text-white text-xs uppercase tracking-wider font-semibold transition-colors disabled:opacity-50 rounded-xs flex items-center gap-1.5"
                        >
                          {isApplyingCoupon ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <span>Zastosuj</span>
                          )}
                        </button>
                      </div>
                    )}

                    {couponFeedback && (
                      <p
                        className={`text-[11px] mt-1.5 flex items-center gap-1 ${
                          couponFeedback.type === "error" ? "text-red-600" : "text-emerald-700"
                        }`}
                      >
                        {couponFeedback.type === "error" ? (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Check className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{couponFeedback.text}</span>
                      </p>
                    )}
                  </div>

                  {/* Podsumowanie kwotowe */}
                  <div className="space-y-2 pt-3 border-t border-[#EADFD5] text-xs text-[#857670]">
                    <div className="flex justify-between">
                      <span>Wartość produktów:</span>
                      <span className="font-medium text-[#241D1B]">{subtotal.toFixed(2)} PLN</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" />
                          Rabat / Promocja:
                        </span>
                        <span>-{discountAmount.toFixed(2)} PLN</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Dostawa:</span>
                      <span className="font-medium text-[#241D1B]">
                        {shippingCost === 0 ? "0.00 PLN (Darmowa)" : `${shippingCost.toFixed(2)} PLN`}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#EADFD5] flex justify-between items-baseline">
                    <span className="font-serif text-base text-[#241D1B]">Łącznie do zapłaty:</span>
                    <span className="text-2xl font-semibold text-[#241D1B]">
                      {grandTotal.toFixed(2)} PLN
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-[0.2em] font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 rounded-xs shadow-[0_4px_16px_rgba(197,160,105,0.35)]"
                  >
                    <span>{isSubmitting ? "Przetwarzanie..." : "Złóż Zamówienie i Zapłać"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="pt-2 text-[11px] text-[#857670] flex items-center justify-center gap-1.5 text-center">
                    <ShieldCheck className="w-4 h-4 text-[#C5A069] shrink-0" />
                    <span>Ceny i stan magazynowy weryfikowane bezpiecznie na serwerze.</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
