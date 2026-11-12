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
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Lock,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ContinueShoppingButton } from "@/components/ui/ContinueShoppingButton";
import { useCart } from "@/context/CartContext";
import { ShippingMethod, PaymentMethod } from "@/lib/types";

interface InpostPoint {
  name: string;
  city: string;
  street: string;
  postalCode?: string;
  description?: string;
}

const formatPln = (val: number): string =>
  val.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " zł";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();

  // Pola formularza
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
  const [marketingConsent, setMarketingConsent] = useState(false);

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

  // Zwijane podsumowanie na telefonie
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  // Błędy walidacji per pole
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Referencje do pól do płynnego przewijania przy błędzie
  const fieldRefs = {
    firstName: useRef<HTMLInputElement>(null),
    lastName: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
    parcelLockerCode: useRef<HTMLDivElement>(null),
    street: useRef<HTMLInputElement>(null),
    postalCode: useRef<HTMLInputElement>(null),
    city: useRef<HTMLInputElement>(null),
    acceptTerms: useRef<HTMLDivElement>(null),
  };

  const FORM_DRAFT_KEY = "aura_checkout_form_draft";

  // Wczytanie zapisanego szkicu formularza zamówienia (zachowanie danych przy powrocie do zakupów)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedDraft = sessionStorage.getItem(FORM_DRAFT_KEY);
      if (savedDraft) {
        const d = JSON.parse(savedDraft);
        if (d.firstName) setFirstName(d.firstName);
        if (d.lastName) setLastName(d.lastName);
        if (d.email) setEmail(d.email);
        if (d.phone) setPhone(d.phone);
        if (d.shippingMethod) setShippingMethod(d.shippingMethod);
        if (d.parcelLockerCode) setParcelLockerCode(d.parcelLockerCode);
        if (d.selectedPoint) setSelectedPoint(d.selectedPoint);
        if (d.street) setStreet(d.street);
        if (d.city) setCity(d.city);
        if (d.postalCode) setPostalCode(d.postalCode);
        if (d.paymentMethod) setPaymentMethod(d.paymentMethod);
        if (d.notes) setNotes(d.notes);
      }
    } catch { }
  }, []);

  // Automatyczny zapis zmian w formularzu w pamięci sesji
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const draft = {
        firstName,
        lastName,
        email,
        phone,
        shippingMethod,
        parcelLockerCode,
        selectedPoint,
        street,
        city,
        postalCode,
        paymentMethod,
        notes,
      };
      sessionStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(draft));
    } catch { }
  }, [
    firstName,
    lastName,
    email,
    phone,
    shippingMethod,
    parcelLockerCode,
    selectedPoint,
    street,
    city,
    postalCode,
    paymentMethod,
    notes,
  ]);

  // Automatyczne wczytanie kodu polecającego z linku (?ref= lub ?polecenie=) lub pamięci sesji
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRef = urlParams.get("ref") || urlParams.get("polecenie");
      const storedRef = sessionStorage.getItem("aura_referral_code");
      const code = (urlRef || storedRef || "").trim().toUpperCase();

      if (code) {
        setCouponCodeInput(code);
        sessionStorage.setItem("aura_referral_code", code);
        calculatePromotions(code);
      }
    } catch {
      // ignoruj
    }
  }, []);

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
    if (fieldErrors.parcelLockerCode) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.parcelLockerCode;
        return next;
      });
    }
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
  const totalItemsCount = items.reduce((acc, it) => acc + it.quantity, 0);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) errors.firstName = "Podaj imię";
    if (!lastName.trim()) errors.lastName = "Podaj nazwisko";

    const emailTrim = email.trim();
    if (!emailTrim) {
      errors.email = "Podaj adres e-mail";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      errors.email = "Wpisz poprawny adres e-mail (np. anna@domena.pl)";
    }

    const phoneTrim = phone.replace(/[\s-]/g, "");
    if (!phoneTrim) {
      errors.phone = "Podaj numer telefonu";
    } else if (phoneTrim.length < 9) {
      errors.phone = "Numer telefonu powinien mieć co najmniej 9 cyfr";
    }

    if (shippingMethod === "INPOST_LOCKER" && !parcelLockerCode.trim()) {
      errors.parcelLockerCode = "Wybierz paczkomat InPost z listy lub wpisz jego kod";
    }

    if (shippingMethod === "COURIER") {
      if (!street.trim()) errors.street = "Podaj ulicę i numer";
      if (!postalCode.trim()) errors.postalCode = "Podaj kod pocztowy (np. 55-110)";
      if (!city.trim()) errors.city = "Podaj miejscowość";
    }

    if (!acceptTerms) {
      errors.acceptTerms = "Zaakceptuj regulamin i politykę prywatności, aby złożyć zamówienie";
    }

    setFieldErrors(errors);
    return errors;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (items.length === 0) {
      setErrorMessage("Twój koszyk jest pusty.");
      return;
    }

    const errors = validateForm();
    const errorKeys = Object.keys(errors);

    if (errorKeys.length > 0) {
      setErrorMessage("Prosimy o uzupełnienie wymaganych pól oznaczonych na czerwono.");
      const firstKey = errorKeys[0] as keyof typeof fieldRefs;
      const refEl = fieldRefs[firstKey]?.current;
      if (refEl) {
        refEl.scrollIntoView({ behavior: "smooth", block: "center" });
        if ("focus" in refEl && typeof (refEl as any).focus === "function") {
          (refEl as any).focus();
        }
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerFirstName: firstName.trim(),
          customerLastName: lastName.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim(),
          shippingMethod,
          parcelLockerCode: shippingMethod === "INPOST_LOCKER" ? parcelLockerCode.trim().toUpperCase() : undefined,
          shippingStreet: shippingMethod === "COURIER" ? street.trim() : undefined,
          shippingCity: shippingMethod === "COURIER" ? city.trim() : undefined,
          shippingPostalCode: shippingMethod === "COURIER" ? postalCode.trim() : undefined,
          paymentMethod,
          customerNotes: notes.trim(),
          cartItems: items,
          couponCode: appliedCouponCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas składania zamówienia.");
      }

      sessionStorage.removeItem(FORM_DRAFT_KEY);
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
      <div className="min-h-screen flex flex-col bg-[#FAF6F1]">
        {/* Wspólny nagłówek sklepu AURA */}
        <Header />

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-8 bg-white border border-[#EADFD5] rounded-xl shadow-xs text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FAF6F1] flex items-center justify-center text-[#C5A069]">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h1 className="font-serif text-2xl text-[#241D1B] mb-2">Twój koszyk jest pusty</h1>
            <p className="text-xs text-[#857670] mb-6">
              Dodaj wybrane produkty do koszyka, aby przejść do kasy.
            </p>
            <ContinueShoppingButton label="← Przejdź do zakupów" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F1]">
      {/* ─── Wspólny nagłówek sklepu AURA na wszystkich stronach ─── */}
      <Header />

      <main className="flex-1 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
          {/* Wyraźny przycisk powrotu do zakupów widoczny od razu nad zawartością kasy */}
          <div className="mb-4 sm:mb-6">
            <ContinueShoppingButton />
          </div>

          {/* Tytuł kasy */}
          <div className="text-center max-w-xl mx-auto mb-4 sm:mb-8">
            <h1 className="font-serif text-2xl sm:text-[28px] text-[#241D1B] tracking-tight">
              Dane i dostawa
            </h1>
            <p className="text-xs sm:text-sm text-[#857670] mt-1 font-light">
              Kupujesz jako gość — nie musisz zakładać konta.
            </p>
          </div>

          {/* ─── Zwijane podsumowanie zamówienia na telefonie (Mobile Accordion) ─── */}
          <div className="lg:hidden mb-4 bg-white border border-[#EADFD5] rounded-xl shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setIsSummaryExpanded((prev) => !prev)}
              className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left min-h-[48px] bg-[#FDFBF7]"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#C5A069]" />
                <span className="text-xs font-semibold text-[#241D1B]">
                  Podsumowanie zamówienia ({totalItemsCount} {totalItemsCount === 1 ? "szt." : "szt."})
                </span>
                {isSummaryExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[#857670]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#857670]" />
                )}
              </div>
              <span className="text-sm font-bold text-[#241D1B]">
                {formatPln(grandTotal)}
              </span>
            </button>

            {isSummaryExpanded && (
              <div className="p-3.5 sm:p-4 border-t border-[#EADFD5] space-y-3 text-xs bg-white animate-in fade-in">
                {/* Pozycje */}
                <div className="divide-y divide-[#EADFD5] max-h-64 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.variantId} className="py-2.5 flex gap-3 first:pt-0">
                      <div className="relative w-12 h-16 bg-[#FAF6F1] shrink-0 border border-[#EADFD5] rounded overflow-hidden">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                          unoptimized={item.imageUrl.startsWith("data:")}
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <p className="font-serif text-xs font-medium text-[#241D1B] line-clamp-1">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-[#857670]">
                            Rozmiar: {item.size} • Kolor: {item.color} • {item.quantity} szt.
                          </p>
                        </div>
                        <p className="text-xs font-semibold text-[#241D1B]">
                          {formatPln(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Prezent */}
                {giftItem && (
                  <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-[#C5A069] shrink-0" />
                      <div>
                        <p className="font-semibold text-[11px]">
                          Prezent gratis: {giftItem.productName}
                        </p>
                        <p className="text-[10px] text-amber-700">Kolor: {giftItem.color}</p>
                      </div>
                    </div>
                    <span className="font-bold font-mono text-[11px] text-amber-800">0,00 zł</span>
                  </div>
                )}

                {/* Koszty */}
                <div className="space-y-1.5 pt-2 border-t border-[#EADFD5] text-xs text-[#857670]">
                  <div className="flex justify-between">
                    <span>Wartość produktów:</span>
                    <span className="text-[#241D1B] font-medium">{formatPln(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Rabat / Promocja:</span>
                      <span>-{formatPln(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Dostawa:</span>
                    <span className="text-[#241D1B] font-medium">
                      {shippingCost === 0 ? "0,00 zł (Darmowa)" : formatPln(shippingCost)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-right">
                  <Link
                    href="/katalog"
                    className="text-[11px] text-[#C5A069] hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <span>Edytuj koszyk w sklepie</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Główny komunikat błędu */}
          {errorMessage && (
            <div className="max-w-3xl mx-auto mb-4 p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmitOrder} noValidate>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8">
              {/* Lewa kolumna: Formularz i wybory */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                {/* Krok 1: Dane zamawiającej */}
                <div className="bg-white p-4 sm:p-6 border border-[#EADFD5] rounded-xl shadow-xs space-y-4">
                  <h2 className="font-serif text-base sm:text-lg text-[#241D1B] flex items-center gap-2 pb-2.5 border-b border-[#EADFD5]">
                    <span className="w-6 h-6 rounded-full bg-[#C5A069] text-white text-xs flex items-center justify-center font-sans font-semibold">
                      1
                    </span>
                    <span>Dane Zamawiającej</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-medium text-[#4A3F3B] block mb-1">
                        Imię *
                      </label>
                      <input
                        ref={fieldRefs.firstName}
                        type="text"
                        autoComplete="given-name"
                        required
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          if (fieldErrors.firstName) {
                            setFieldErrors((prev) => {
                              const n = { ...prev };
                              delete n.firstName;
                              return n;
                            });
                          }
                        }}
                        className={`w-full h-12 bg-[#FAF6F1] border ${fieldErrors.firstName ? "border-red-500 bg-red-50/30" : "border-[#EADFD5]"
                          } px-3 text-base sm:text-sm text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-lg transition-colors`}
                      />
                      {fieldErrors.firstName && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.firstName}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[#4A3F3B] block mb-1">
                        Nazwisko *
                      </label>
                      <input
                        ref={fieldRefs.lastName}
                        type="text"
                        autoComplete="family-name"
                        required
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          if (fieldErrors.lastName) {
                            setFieldErrors((prev) => {
                              const n = { ...prev };
                              delete n.lastName;
                              return n;
                            });
                          }
                        }}
                        className={`w-full h-12 bg-[#FAF6F1] border ${fieldErrors.lastName ? "border-red-500 bg-red-50/30" : "border-[#EADFD5]"
                          } px-3 text-base sm:text-sm text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-lg transition-colors`}
                      />
                      {fieldErrors.lastName && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.lastName}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-medium text-[#4A3F3B] block mb-1">
                        Adres e-mail *
                      </label>
                      <input
                        ref={fieldRefs.email}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        required
                        placeholder="np. anna@domena.pl"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldErrors.email) {
                            setFieldErrors((prev) => {
                              const n = { ...prev };
                              delete n.email;
                              return n;
                            });
                          }
                        }}
                        className={`w-full h-12 bg-[#FAF6F1] border ${fieldErrors.email ? "border-red-500 bg-red-50/30" : "border-[#EADFD5]"
                          } px-3 text-base sm:text-sm text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-lg transition-colors`}
                      />
                      <p className="text-[11px] text-[#857670] mt-1">
                        Na ten adres wyślemy potwierdzenie zamówienia
                      </p>
                      {fieldErrors.email && (
                        <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.email}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[#4A3F3B] block mb-1">
                        Numer telefonu *
                      </label>
                      <input
                        ref={fieldRefs.phone}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        required
                        placeholder="+48 000 000 000"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (fieldErrors.phone) {
                            setFieldErrors((prev) => {
                              const n = { ...prev };
                              delete n.phone;
                              return n;
                            });
                          }
                        }}
                        className={`w-full h-12 bg-[#FAF6F1] border ${fieldErrors.phone ? "border-red-500 bg-red-50/30" : "border-[#EADFD5]"
                          } px-3 text-base sm:text-sm text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-lg transition-colors`}
                      />
                      <p className="text-[11px] text-[#857670] mt-1">
                        Do powiadomień SMS o wysyłce i odbiorze paczki
                      </p>
                      {fieldErrors.phone && (
                        <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Krok 2: Sposób dostawy */}
                <div className="bg-white p-4 sm:p-6 border border-[#EADFD5] rounded-xl shadow-xs space-y-3.5">
                  <h2 className="font-serif text-base sm:text-lg text-[#241D1B] flex items-center gap-2 pb-2.5 border-b border-[#EADFD5]">
                    <span className="w-6 h-6 rounded-full bg-[#C5A069] text-white text-xs flex items-center justify-center font-sans font-semibold">
                      2
                    </span>
                    <span>Sposób Dostawy</span>
                  </h2>

                  <div className="space-y-2.5">
                    {/* Paczkomaty InPost */}
                    <div
                      className={`p-3.5 sm:p-4 border rounded-xl transition-all ${shippingMethod === "INPOST_LOCKER"
                          ? "border-[#C5A069] bg-[#FDFBF7] ring-1 ring-[#C5A069]"
                          : "border-[#EADFD5] hover:border-[#C5A069]/60"
                        }`}
                    >
                      <label className="flex items-center justify-between cursor-pointer min-h-[44px]">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            checked={shippingMethod === "INPOST_LOCKER"}
                            onChange={() => setShippingMethod("INPOST_LOCKER")}
                            className="accent-[#C5A069] w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-[#241D1B] flex items-center gap-1.5">
                              <span>Paczkomaty InPost</span>
                              <span className="text-[10px] bg-[#C5A069]/15 text-[#8C6B38] px-1.5 py-0.5 rounded font-mono font-medium">
                                24/7
                              </span>
                            </p>
                            <p className="text-[11px] text-[#857670]">
                              Odbierz wygodnie o dowolnej porze
                            </p>
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-[#241D1B] shrink-0 pl-2">
                          {isFreeShipping ? "0,00 zł" : "13,00 zł"}
                        </span>
                      </label>

                      {/* Rozszerzenie wyboru Paczkomatu InPost */}
                      {shippingMethod === "INPOST_LOCKER" && (
                        <div ref={fieldRefs.parcelLockerCode} className="mt-3 pt-3 border-t border-[#EADFD5] space-y-2.5">
                          {selectedPoint || parcelLockerCode ? (
                            <div className="p-3 bg-[#FAF6F1] border border-[#C5A069] rounded-lg flex items-start justify-between gap-2.5">
                              <div className="flex items-start gap-2">
                                <div className="w-5 h-5 rounded-full bg-[#C5A069] text-white flex items-center justify-center shrink-0 mt-0.5">
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-[#241D1B] flex items-center gap-1.5 flex-wrap">
                                    <span>Wybrany Paczkomat:</span>
                                    <span className="px-1.5 py-0.5 bg-[#241D1B] text-[#E5D7B7] font-mono rounded text-[11px]">
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
                                className="text-xs text-[#C5A069] hover:text-[#AF884F] font-semibold underline shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                              >
                                Zmień
                              </button>
                            </div>
                          ) : null}

                          {(!selectedPoint && !parcelLockerCode) && (
                            <div className="relative">
                              <label className="text-xs font-medium text-[#4A3F3B] block mb-1">
                                Wpisz miejscowość, ulicę lub kod Paczkomatu *
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="np. Żmigród, Pełczyń, Wrocławska..."
                                  value={inpostQuery}
                                  onChange={(e) => {
                                    setInpostQuery(e.target.value);
                                    setShowSuggestions(true);
                                  }}
                                  onFocus={() => setShowSuggestions(true)}
                                  className="w-full h-12 bg-white border border-[#EADFD5] pl-9 pr-9 text-base sm:text-sm text-[#241D1B] placeholder:text-[#B5A59E] focus:outline-none focus:border-[#C5A069] rounded-lg"
                                />
                                <Search className="w-4 h-4 text-[#857670] absolute left-3 top-4" />
                                {isLoadingPoints && (
                                  <Loader2 className="w-4 h-4 text-[#C5A069] animate-spin absolute right-3 top-4" />
                                )}
                              </div>

                              {fieldErrors.parcelLockerCode && (
                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{fieldErrors.parcelLockerCode}</span>
                                </p>
                              )}

                              {showSuggestions && inpostSuggestions.length > 0 && (
                                <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-[#C5A069] rounded-lg shadow-xl z-30 divide-y divide-[#FAF6F1]">
                                  {inpostSuggestions.map((point) => (
                                    <div
                                      key={point.name}
                                      onClick={() => handleSelectPoint(point)}
                                      className="p-3 hover:bg-[#FAF6F1] cursor-pointer transition-colors flex items-start justify-between gap-2.5 text-xs min-h-[44px]"
                                    >
                                      <div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-mono font-bold text-[#241D1B] px-1.5 py-0.5 bg-[#FAF6F1] border border-[#EADFD5] rounded text-[11px]">
                                            {point.name}
                                          </span>
                                          <span className="font-semibold text-[#241D1B]">
                                            {point.city}, {point.street}
                                          </span>
                                        </div>
                                        {point.description && (
                                          <p className="text-[11px] text-[#857670] mt-0.5">
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
                                  Szybki wybór w rejonie:
                                </p>
                                <div className="flex flex-wrap gap-1.5">
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
                                    className="px-2.5 py-1.5 bg-white hover:bg-[#FAF6F1] border border-[#EADFD5] hover:border-[#C5A069] text-xs text-[#241D1B] rounded-md transition-colors flex items-center gap-1 min-h-[36px]"
                                  >
                                    <MapPin className="w-3 h-3 text-[#C5A069]" />
                                    <span>Żmigród Poprzeczna (ZMI01M)</span>
                                  </button>
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
                                    className="px-2.5 py-1.5 bg-white hover:bg-[#FAF6F1] border border-[#EADFD5] hover:border-[#C5A069] text-xs text-[#241D1B] rounded-md transition-colors flex items-center gap-1 min-h-[36px]"
                                  >
                                    <MapPin className="w-3 h-3 text-[#C5A069]" />
                                    <span>Pełczyń (PEL01M)</span>
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
                      className={`p-3.5 sm:p-4 border rounded-xl transition-all ${shippingMethod === "COURIER"
                          ? "border-[#C5A069] bg-[#FDFBF7] ring-1 ring-[#C5A069]"
                          : "border-[#EADFD5] hover:border-[#C5A069]/60"
                        }`}
                    >
                      <label className="flex items-center justify-between cursor-pointer min-h-[44px]">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            checked={shippingMethod === "COURIER"}
                            onChange={() => setShippingMethod("COURIER")}
                            className="accent-[#C5A069] w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-[#241D1B]">
                              Kurier (InPost / DPD)
                            </p>
                            <p className="text-[11px] text-[#857670]">
                              Dostawa pod Twoje drzwi w 24–48h
                            </p>
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-[#241D1B] shrink-0 pl-2">
                          {isFreeShipping ? "0,00 zł" : "15,00 zł"}
                        </span>
                      </label>

                      {shippingMethod === "COURIER" && (
                        <div className="mt-3 pt-3 border-t border-[#EADFD5] space-y-3">
                          <div>
                            <label className="text-xs font-medium text-[#4A3F3B] block mb-1">
                              Ulica i numer domu/lokalu *
                            </label>
                            <input
                              ref={fieldRefs.street}
                              type="text"
                              autoComplete="street-address"
                              value={street}
                              onChange={(e) => {
                                setStreet(e.target.value);
                                if (fieldErrors.street) {
                                  setFieldErrors((prev) => {
                                    const n = { ...prev };
                                    delete n.street;
                                    return n;
                                  });
                                }
                              }}
                              className={`w-full h-12 bg-white border ${fieldErrors.street ? "border-red-500 bg-red-50/30" : "border-[#EADFD5]"
                                } px-3 text-base sm:text-sm text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-lg`}
                            />
                            {fieldErrors.street && (
                              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{fieldErrors.street}</span>
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium text-[#4A3F3B] block mb-1">
                                Kod pocztowy *
                              </label>
                              <input
                                ref={fieldRefs.postalCode}
                                type="text"
                                inputMode="numeric"
                                autoComplete="postal-code"
                                placeholder="00-000"
                                value={postalCode}
                                onChange={(e) => {
                                  setPostalCode(e.target.value);
                                  if (fieldErrors.postalCode) {
                                    setFieldErrors((prev) => {
                                      const n = { ...prev };
                                      delete n.postalCode;
                                      return n;
                                    });
                                  }
                                }}
                                className={`w-full h-12 bg-white border ${fieldErrors.postalCode ? "border-red-500 bg-red-50/30" : "border-[#EADFD5]"
                                  } px-3 text-base sm:text-sm text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-lg`}
                              />
                              {fieldErrors.postalCode && (
                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{fieldErrors.postalCode}</span>
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="text-xs font-medium text-[#4A3F3B] block mb-1">
                                Miejscowość *
                              </label>
                              <input
                                ref={fieldRefs.city}
                                type="text"
                                autoComplete="address-level2"
                                value={city}
                                onChange={(e) => {
                                  setCity(e.target.value);
                                  if (fieldErrors.city) {
                                    setFieldErrors((prev) => {
                                      const n = { ...prev };
                                      delete n.city;
                                      return n;
                                    });
                                  }
                                }}
                                className={`w-full h-12 bg-white border ${fieldErrors.city ? "border-red-500 bg-red-50/30" : "border-[#EADFD5]"
                                  } px-3 text-base sm:text-sm text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-lg`}
                              />
                              {fieldErrors.city && (
                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{fieldErrors.city}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Odbiór osobisty */}
                    <div
                      className={`p-3.5 sm:p-4 border rounded-xl transition-all ${shippingMethod === "LOCAL_PICKUP"
                          ? "border-[#C5A069] bg-[#FDFBF7] ring-1 ring-[#C5A069]"
                          : "border-[#EADFD5] hover:border-[#C5A069]/60"
                        }`}
                    >
                      <label className="flex items-center justify-between cursor-pointer min-h-[44px]">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            checked={shippingMethod === "LOCAL_PICKUP"}
                            onChange={() => setShippingMethod("LOCAL_PICKUP")}
                            className="accent-[#C5A069] w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-[#241D1B] flex items-center gap-1.5">
                              <span>Odbiór osobisty w butiku</span>
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                                Bezpłatny
                              </span>
                            </p>
                            <p className="text-[11px] text-[#857670]">
                              Żmigród, ul. Poprzeczna 3/1A
                            </p>
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-emerald-700 shrink-0 pl-2">
                          0,00 zł
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Krok 3: Sposób płatności */}
                <div className="bg-white p-4 sm:p-6 border border-[#EADFD5] rounded-xl shadow-xs space-y-3.5">
                  <h2 className="font-serif text-base sm:text-lg text-[#241D1B] flex items-center gap-2 pb-2.5 border-b border-[#EADFD5]">
                    <span className="w-6 h-6 rounded-full bg-[#C5A069] text-white text-xs flex items-center justify-center font-sans font-semibold">
                      3
                    </span>
                    <span>Sposób Płatności</span>
                  </h2>

                  <div className="space-y-2.5">
                    <label
                      className={`block p-3.5 sm:p-4 border rounded-xl cursor-pointer transition-all min-h-[50px] ${paymentMethod === "BLIK"
                          ? "border-[#C5A069] bg-[#FDFBF7] ring-1 ring-[#C5A069]"
                          : "border-[#EADFD5] hover:border-[#C5A069]/60"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === "BLIK"}
                            onChange={() => setPaymentMethod("BLIK")}
                            className="accent-[#C5A069] w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-[#241D1B]">
                              BLIK (Szybka płatność)
                            </p>
                            <p className="text-[11px] text-[#857670]">
                              Natychmiastowa płatność kodem z aplikacji banku
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#241D1B] bg-[#C5A069]/15 px-2 py-0.5 rounded">
                          BLIK
                        </span>
                      </div>
                    </label>

                    <label
                      className={`block p-3.5 sm:p-4 border rounded-xl cursor-pointer transition-all min-h-[50px] ${paymentMethod === "PRZELEWY24"
                          ? "border-[#C5A069] bg-[#FDFBF7] ring-1 ring-[#C5A069]"
                          : "border-[#EADFD5] hover:border-[#C5A069]/60"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === "PRZELEWY24"}
                            onChange={() => setPaymentMethod("PRZELEWY24")}
                            className="accent-[#C5A069] w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-[#241D1B]">
                              Przelewy24 (Szybki przelew / Karta)
                            </p>
                            <p className="text-[11px] text-[#857670]">
                              Wygodna płatność przez Twój bank lub kartę
                            </p>
                          </div>
                        </div>
                        <CreditCard className="w-4 h-4 text-[#857670]" />
                      </div>
                    </label>

                    <label
                      className={`block p-3.5 sm:p-4 border rounded-xl cursor-pointer transition-all min-h-[50px] ${paymentMethod === "TRADITIONAL_TRANSFER"
                          ? "border-[#C5A069] bg-[#FDFBF7] ring-1 ring-[#C5A069]"
                          : "border-[#EADFD5] hover:border-[#C5A069]/60"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === "TRADITIONAL_TRANSFER"}
                            onChange={() => setPaymentMethod("TRADITIONAL_TRANSFER")}
                            className="accent-[#C5A069] w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-[#241D1B]">
                              Tradycyjny przelew bankowy
                            </p>
                            <p className="text-[11px] text-[#857670]">
                              Dane do wpłaty otrzymasz na ekranie potwierdzenia
                            </p>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Uwagi i zgody */}
                <div className="bg-white p-4 sm:p-6 border border-[#EADFD5] rounded-xl shadow-xs space-y-3.5">
                  <div>
                    <label className="text-xs font-medium text-[#4A3F3B] block mb-1">
                      Uwagi do zamówienia (opcjonalnie)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Wskazówki dla butiku lub kuriera..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-3 text-base sm:text-sm text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-lg"
                    />
                  </div>

                  <div ref={fieldRefs.acceptTerms} className="space-y-2 pt-1 border-t border-[#EADFD5]">
                    {/* Wymagana zgoda */}
                    <label className="flex items-start gap-2.5 text-xs text-[#4A3F3B] cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        required
                        checked={acceptTerms}
                        onChange={(e) => {
                          setAcceptTerms(e.target.checked);
                          if (fieldErrors.acceptTerms) {
                            setFieldErrors((prev) => {
                              const n = { ...prev };
                              delete n.acceptTerms;
                              return n;
                            });
                          }
                        }}
                        className="mt-0.5 accent-[#C5A069] w-4 h-4 rounded cursor-pointer"
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
                        butiku AURA Boutique. *
                      </span>
                    </label>
                    {fieldErrors.acceptTerms && (
                      <p className="text-xs text-red-600 pl-6 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.acceptTerms}</span>
                      </p>
                    )}

                    {/* Opcjonalna zgoda marketingowa - domyślnie NIEZAZNACZONA */}
                    <label className="flex items-start gap-2.5 text-[11px] text-[#857670] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={marketingConsent}
                        onChange={(e) => setMarketingConsent(e.target.checked)}
                        className="mt-0.5 accent-[#C5A069] w-4 h-4 rounded cursor-pointer"
                      />
                      <span>
                        Chcę otrzymywać informacje o nowych kolekcjach i specjalnych kodach rabatowych na podany e-mail (opcjonalnie).
                      </span>
                    </label>
                  </div>
                </div>

                {/* Na telefonie: przycisk finalizacji bezpośrednio pod formularzem */}
                <div className="lg:hidden space-y-3 pt-2">
                  <div className="bg-white p-4 border border-[#EADFD5] rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-[#857670]">Do zapłaty łącznie:</p>
                      <p className="text-xl font-bold text-[#241D1B]">{formatPln(grandTotal)}</p>
                    </div>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                      Płatność zabezpieczona
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[50px] py-3.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-sm uppercase tracking-wider font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 rounded-xl shadow-md active:scale-[0.99]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Przetwarzanie...</span>
                      </>
                    ) : (
                      <>
                        <span>Zamawiam i płacę</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Prawa kolumna (Desktop i szersze ekrany): Podsumowanie koszyka */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white p-5 sm:p-6 border border-[#EADFD5] rounded-xl shadow-xs space-y-4 sticky top-20">
                  <h3 className="font-serif text-base sm:text-lg text-[#241D1B] border-b border-[#EADFD5] pb-2.5 flex items-center justify-between">
                    <span>Podsumowanie</span>
                    <span className="text-xs font-normal text-[#857670]">
                      {totalItemsCount} {totalItemsCount === 1 ? "produkt" : "produktów"}
                    </span>
                  </h3>

                  {/* Pozycje koszyka */}
                  <div className="divide-y divide-[#EADFD5] max-h-64 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div key={item.variantId} className="py-2.5 flex gap-3 text-xs first:pt-0">
                        <div className="relative w-12 h-16 bg-[#FAF6F1] shrink-0 border border-[#EADFD5] rounded overflow-hidden">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="48px"
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
                            {formatPln(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 🎁 Prezent za zakupy powyżej 100 zł */}
                  {giftItem && (
                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg flex items-center justify-between gap-2.5 text-xs text-amber-900">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-[#C5A069] shrink-0" />
                        <div>
                          <p className="font-semibold text-[11px]">
                            Prezent gratis: {giftItem.productName}
                          </p>
                          <p className="text-[10px] text-amber-700">
                            Kolor: {giftItem.color} • Do zamówień pow. 100 zł
                          </p>
                        </div>
                      </div>
                      <span className="font-bold font-mono text-[11px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                        0,00 zł
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
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <p className="font-bold font-mono uppercase">{appliedCouponCode}</p>
                            <p className="text-[11px] text-emerald-700">
                              Rabat naliczony do zamówienia
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-xs text-red-600 hover:text-red-800 font-semibold underline p-1 min-h-[44px] flex items-center"
                        >
                          Usuń
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Wpisz kod rabatowy"
                          value={couponCodeInput}
                          onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                          className="flex-1 bg-[#FAF6F1] border border-[#EADFD5] px-3 py-2 text-xs uppercase font-mono text-[#241D1B] placeholder:text-[#A89A92] placeholder:normal-case placeholder:font-sans focus:outline-none focus:border-[#C5A069] rounded-lg h-10"
                        />
                        <button
                          type="button"
                          disabled={isApplyingCoupon || !couponCodeInput.trim()}
                          onClick={handleApplyCoupon}
                          className="px-4 py-2 bg-[#241D1B] hover:bg-[#3D332F] text-white text-xs uppercase tracking-wider font-semibold transition-colors disabled:opacity-50 rounded-lg flex items-center gap-1.5 min-h-[40px]"
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
                        className={`text-[11px] mt-1.5 flex items-center gap-1 ${couponFeedback.type === "error" ? "text-red-600" : "text-emerald-700"
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
                  <div className="space-y-2 pt-2.5 border-t border-[#EADFD5] text-xs text-[#857670]">
                    <div className="flex justify-between">
                      <span>Wartość produktów:</span>
                      <span className="font-medium text-[#241D1B]">{formatPln(subtotal)}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" />
                          Rabat / Promocja:
                        </span>
                        <span>-{formatPln(discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Dostawa:</span>
                      <span className="font-medium text-[#241D1B]">
                        {shippingCost === 0 ? "0,00 zł (Darmowa)" : formatPln(shippingCost)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-[#EADFD5] flex justify-between items-baseline">
                    <span className="font-serif text-sm sm:text-base text-[#241D1B]">
                      Łącznie do zapłaty:
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-[#241D1B]">
                      {formatPln(grandTotal)}
                    </span>
                  </div>

                  {/* Desktop Submit Button */}
                  <div className="hidden lg:block pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full min-h-[50px] py-4 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-[0.15em] font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 rounded-xl shadow-md active:scale-[0.99]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Przetwarzanie...</span>
                        </>
                      ) : (
                        <>
                          <span>Zamawiam i płacę</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="pt-1 text-[11px] text-[#857670] flex items-center justify-center gap-1.5 text-center">
                    <ShieldCheck className="w-4 h-4 text-[#C5A069] shrink-0" />
                    <span>Bezpieczne zakupy i szyfrowane połączenie</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
