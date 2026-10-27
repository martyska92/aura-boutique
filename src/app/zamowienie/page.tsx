"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";
import { ShippingMethod, PaymentMethod } from "@/lib/types";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("INPOST_LOCKER");
  const [parcelLockerCode, setParcelLockerCode] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BLIK");
  const [notes, setNotes] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const freeShippingThreshold = 300;
  const isFreeShipping = subtotal >= freeShippingThreshold;

  let shippingCost = 0;
  if (!isFreeShipping) {
    if (shippingMethod === "INPOST_LOCKER") shippingCost = 13.0;
    else if (shippingMethod === "COURIER") shippingCost = 15.0;
    else if (shippingMethod === "LOCAL_PICKUP") shippingCost = 0.0;
  }

  const grandTotal = subtotal + shippingCost;

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
      setErrorMessage("Podaj kod paczkomatu InPost (np. ZMI01M).");
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
                      <label className="text-xs text-[#857670] block mb-1">Adres e-mail * (potwierdzenie zamówienia)</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#857670] block mb-1">Numer telefonu * (do powiadomień SMS)</label>
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
                    <label
                      className={`block p-4 border rounded-xs cursor-pointer transition-all ${
                        shippingMethod === "INPOST_LOCKER"
                          ? "border-[#C5A069] bg-[#F2DCD7]/30 shadow-xs"
                          : "border-[#EADFD5] hover:border-[#C5A069]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            checked={shippingMethod === "INPOST_LOCKER"}
                            onChange={() => setShippingMethod("INPOST_LOCKER")}
                            className="accent-[#C5A069]"
                          />
                          <div>
                            <p className="text-xs font-semibold text-[#241D1B]">
                              Paczkomaty InPost
                            </p>
                            <p className="text-[11px] text-[#857670]">
                              Odbierz w dowolnym paczkomacie 24/7
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#241D1B]">
                          {isFreeShipping ? "0.00 PLN (Darmowa)" : "13.00 PLN"}
                        </span>
                      </div>

                      {shippingMethod === "INPOST_LOCKER" && (
                        <div className="mt-3 pt-3 border-t border-[#EADFD5]">
                          <label className="text-[11px] text-[#857670] block mb-1">
                            Kod Paczkomatu (np. ZMI01M lub ulica w Twoim mieście) *
                          </label>
                          <input
                            type="text"
                            placeholder="Wpisz kod Paczkomatu (np. ZMI01M)"
                            value={parcelLockerCode}
                            onChange={(e) => setParcelLockerCode(e.target.value)}
                            className="w-full bg-white border border-[#EADFD5] p-2 text-xs text-[#241D1B] uppercase placeholder:normal-case font-mono focus:outline-none focus:border-[#C5A069] rounded-xs"
                          />
                        </div>
                      )}
                    </label>

                    {/* Kurier */}
                    <label
                      className={`block p-4 border rounded-xs cursor-pointer transition-all ${
                        shippingMethod === "COURIER"
                          ? "border-[#C5A069] bg-[#F2DCD7]/30 shadow-xs"
                          : "border-[#EADFD5] hover:border-[#C5A069]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
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
                              Dostawa prosto pod Twoje drzwi w 24-48h
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#241D1B]">
                          {isFreeShipping ? "0.00 PLN (Darmowa)" : "15.00 PLN"}
                        </span>
                      </div>

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
                    </label>

                    {/* Odbiór osobisty w butiku w Żmigrodzie */}
                    <label
                      className={`block p-4 border rounded-xs cursor-pointer transition-all ${
                        shippingMethod === "LOCAL_PICKUP"
                          ? "border-[#C5A069] bg-[#F2DCD7]/30 shadow-xs"
                          : "border-[#EADFD5] hover:border-[#C5A069]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
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
                              <span className="px-1.5 py-0.5 text-[9px] bg-emerald-100 text-emerald-800 rounded font-normal">
                                Bezpłatny
                              </span>
                            </p>
                            <p className="text-[11px] text-[#857670]">
                              Żmigród, ul. Poprzeczna 3/1A • Gotowe do odbioru po potwierdzeniu
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-emerald-700">
                          0.00 PLN
                        </span>
                      </div>
                    </label>
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
                          ? "border-[#C5A069] bg-[#F2DCD7]/30 shadow-xs"
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
                              BLIK / Przelewy24 (Szybka płatność online)
                            </p>
                            <p className="text-[11px] text-[#857670]">
                              Błyskawiczna i bezpieczna płatność kodem BLIK lub przelewem natychmiastowym
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-[#241D1B] text-[#DFCA9B] text-[10px] font-bold rounded-xs tracking-wider">
                          BLIK
                        </span>
                      </div>
                    </label>

                    <label
                      className={`block p-4 border rounded-xs cursor-pointer transition-all ${
                        paymentMethod === "TRADITIONAL_TRANSFER"
                          ? "border-[#C5A069] bg-[#F2DCD7]/30 shadow-xs"
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

              {/* Prawa strona: Podsumowanie koszyka */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 sm:p-8 border border-[#EADFD5] rounded-xs shadow-xs space-y-5 sticky top-32">
                  <h3 className="font-serif text-lg text-[#241D1B] border-b border-[#EADFD5] pb-3 uppercase tracking-wider">
                    Twoje Zamówienie
                  </h3>

                  <div className="divide-y divide-[#EADFD5] max-h-80 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div key={item.variantId} className="py-3 flex gap-3 text-xs first:pt-0">
                        <div className="relative w-14 h-18 bg-[#FAF6F1] shrink-0 border border-[#EADFD5] rounded-xs overflow-hidden">
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="56px" />
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

                  <div className="space-y-2 pt-3 border-t border-[#EADFD5] text-xs text-[#857670]">
                    <div className="flex justify-between">
                      <span>Wartość koszyka:</span>
                      <span className="font-medium text-[#241D1B]">{subtotal.toFixed(2)} PLN</span>
                    </div>
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
