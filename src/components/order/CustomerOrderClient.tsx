"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Minus,
  Trash2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Order, OrderItem, Product, StoreSettings, ReturnRequest } from "@/lib/types";
import { BrandLogo } from "@/components/ui/BrandLogo";

interface CustomerOrderClientProps {
  initialOrder: Order;
  settings: StoreSettings;
  availableProducts: Product[];
}

export function CustomerOrderClient({
  initialOrder,
  settings,
  availableProducts,
}: CustomerOrderClientProps) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Stan edycji zamówienia (dokupowanie)
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editedItems, setEditedItems] = useState<OrderItem[]>(order.items);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Stan zgłoszenia zwrotu
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedReturnItems, setSelectedReturnItems] = useState<{
    [orderItemId: string]: { selected: boolean; quantity: number; reason: string };
  }>({});
  const [returnMethod, setReturnMethod] = useState<"INPOST_LOCKER" | "COURIER" | "IN_PERSON">("INPOST_LOCKER");
  const [customerReturnNote, setCustomerReturnNote] = useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnSuccessData, setReturnSuccessData] = useState<ReturnRequest | null>(null);

  const canEdit = order.fulfillmentStatus === "NEW";

  const copyTracking = () => {
    if (order.trackingNumber) {
      navigator.clipboard.writeText(order.trackingNumber);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2500);
    }
  };

  // Etykiety sposobów dostawy
  const shippingLabels: Record<string, string> = {
    INPOST_LOCKER: `Paczkomaty InPost (Paczkomat: ${order.parcelLockerCode || "N/A"})`,
    COURIER: `Kurier InPost / DPD (${order.shippingStreet || ""}, ${order.shippingPostalCode || ""} ${order.shippingCity || ""})`,
    LOCAL_PICKUP: "Odbiór osobisty w Butiku: Żmigród, ul. Poprzeczna 3/1A",
  };

  // Etykiety metod płatności
  const paymentLabels: Record<string, string> = {
    BLIK: "Płatność online BLIK / Przelewy24",
    PRZELEWY24: "Szybki przelew online Przelewy24",
    TRADITIONAL_TRANSFER: "Tradycyjny przelew bankowy na konto butiku",
  };

  // Obliczanie etapu na osi czasu
  const getTimelineStep = () => {
    switch (order.fulfillmentStatus) {
      case "NEW":
        return 1;
      case "PROCESSING":
        return 2;
      case "SHIPPED":
        return 3;
      case "DELIVERED":
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = getTimelineStep();

  // Dodawanie kolejnego produktu do zamówienia w trybie edycji
  const handleAddItemToOrder = () => {
    const product = availableProducts.find((p) => p.id === selectedProductId);
    if (!product) return;

    const variant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
    const unitPrice = product.promotionalPrice || product.basePrice;

    // Sprawdź czy już istnieje
    const existingIndex = editedItems.findIndex(
      (item) => item.variantId === variant.id || (item.productNameSnapshot === product.name && !item.variantId)
    );

    if (existingIndex > -1) {
      const updated = [...editedItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].totalSnapshot = updated[existingIndex].quantity * updated[existingIndex].unitPriceSnapshot;
      setEditedItems(updated);
    } else {
      const newItem: OrderItem = {
        id: `item-add-${Date.now()}`,
        orderId: order.id,
        variantId: variant.id,
        productNameSnapshot: product.name,
        variantSnapshot: `Rozmiar: ${variant.size}, Kolor: ${variant.color}, SKU: ${variant.sku}`,
        unitPriceSnapshot: unitPrice,
        quantity: 1,
        totalSnapshot: unitPrice,
        productImageUrl: product.images[0]?.url,
      };
      setEditedItems([...editedItems, newItem]);
    }

    setSelectedProductId("");
    setSelectedVariantId("");
  };

  // Zmiana ilości pozycji
  const handleQuantityChange = (index: number, delta: number) => {
    const updated = [...editedItems];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      if (updated.length === 1) {
        alert("Zamówienie musi zawierać co najmniej jeden produkt.");
        return;
      }
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
      updated[index].totalSnapshot = newQty * updated[index].unitPriceSnapshot;
    }
    setEditedItems(updated);
  };

  // Zapisanie zmodyfikowanego zamówienia
  const handleSaveOrderEdit = async () => {
    setIsSavingEdit(true);
    setEditFeedback(null);

    try {
      const res = await fetch("/api/orders/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          items: editedItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Błąd podczas zapisywania zmian.");
      }

      setOrder(data.order);
      setEditFeedback({ type: "success", text: "Twoje zamówienie zostało zaktualizowane!" });
      setIsEditingOrder(false);
    } catch (err: any) {
      setEditFeedback({ type: "error", text: err.message || "Błąd połączenia." });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Zgłoszenie zwrotu
  const handleToggleReturnItem = (itemId: string, defaultReason: string = "Niewłaściwy rozmiar") => {
    setSelectedReturnItems((prev) => {
      const current = prev[itemId] || { selected: false, quantity: 1, reason: defaultReason };
      return {
        ...prev,
        [itemId]: { ...current, selected: !current.selected },
      };
    });
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemsToReturn: any[] = [];

    order.items.forEach((item) => {
      const sel = selectedReturnItems[item.id];
      if (sel && sel.selected) {
        itemsToReturn.push({
          orderItemId: item.id,
          productName: item.productNameSnapshot,
          variantSnapshot: item.variantSnapshot,
          quantity: sel.quantity || 1,
          reason: sel.reason || "Niewłaściwy rozmiar",
          unitPrice: item.unitPriceSnapshot,
        });
      }
    });

    if (itemsToReturn.length === 0) {
      alert("Zaznacz co najmniej jeden produkt, który chcesz zwrócić.");
      return;
    }

    setIsSubmittingReturn(true);

    try {
      const res = await fetch("/api/orders/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          items: itemsToReturn,
          returnMethod,
          customerNote: customerReturnNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Błąd podczas zgłaszania zwrotu.");
      }

      setReturnSuccessData(data.returnRequest);
      setIsReturnModalOpen(false);
    } catch (err: any) {
      alert("Błąd: " + err.message);
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
      {/* Informacja zwrotna po edycji */}
      {editFeedback && (
        <div
          className={`p-4 rounded border text-xs flex items-center justify-between gap-2 shadow-sm ${
            editFeedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {editFeedback.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            )}
            <span>{editFeedback.text}</span>
          </div>
          <button onClick={() => setEditFeedback(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Potwierdzenie pomyślnego zgłoszenia zwrotu */}
      {returnSuccessData && (
        <div className="p-5 bg-gradient-to-r from-[#FAF6F1] to-[#F5ECE3] border-2 border-[#C5A069] rounded shadow-md space-y-3">
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-serif text-sm uppercase tracking-wider font-bold">
              Zgłoszenie zwrotu zostało przyjęte! (#{returnSuccessData.id})
            </h3>
          </div>
          <p className="text-xs text-[#241D1B]">
            Dziękujemy! Twoje zgłoszenie zwrotu zostało zarejestrowane. Zwrot możesz nadać bezpłatnie w dowolnym Paczkomacie InPost.
          </p>
          {returnSuccessData.returnTrackingNumber && (
            <div className="p-3 bg-white border border-[#EADFD5] rounded flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#857670] uppercase tracking-wider block">
                  Twój kod zwrotu InPost:
                </span>
                <span className="font-mono text-sm font-bold text-[#241D1B]">
                  {returnSuccessData.returnTrackingNumber}
                </span>
              </div>
              <a
                href="https://szybkiezwroty.pl/"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-[#FFD800] text-black text-xs font-bold rounded hover:bg-[#F2CD00] flex items-center gap-1"
              >
                <span>Nadaj w InPost ↗</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* KARTA GŁÓWNA ZAMÓWIENIA */}
      <div className="bg-white border border-[#EADFD5] rounded p-6 sm:p-10 space-y-8 shadow-sm">
        {/* Nagłówek statusu */}
        <div className="text-center space-y-3 pb-6 border-b border-[#EADFD5]">
          <div className="flex justify-center pb-2">
            <BrandLogo size="md" />
          </div>
          <div className="w-16 h-16 rounded-full bg-[#FAF6F1] text-[#C5A069] flex items-center justify-center mx-auto border-2 border-[#D8BE8E]">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#C5A069] font-semibold">
            Dziękujemy za zakupy w AURA Boutique K.B.
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#241D1B]">
            Zamówienie zostało przyjęte!
          </h1>
          <p className="text-xs text-[#857670]">
            Numer Twojego zamówienia:{" "}
            <strong className="text-[#241D1B] font-mono text-sm">
              {order.orderNumber}
            </strong>
          </p>
        </div>

        {/* ========================================================
            NOWA SEKCJA: MONITOROWANIE PRZESYŁKI NA ŻYWO (INPOST / KURIER)
           ======================================================== */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-[#FAF6F1] to-[#F5ECE3] border-2 border-[#C5A069]/40 rounded-lg space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EADFD5]">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#C5A069]" />
              <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B] font-semibold">
                Monitorowanie Przesyłki na Żywo
              </h2>
            </div>
            <span className="text-[11px] text-[#6E6259]">
              Aktualizacja statusu w czasie rzeczywistym
            </span>
          </div>

          {/* Oś czasu zamówienia (Stepper Timeline) */}
          <div className="relative pt-2 pb-4">
            <div className="grid grid-cols-4 gap-2 text-center relative z-10">
              {/* Krok 1 */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all ${
                    currentStep >= 1
                      ? "bg-[#C5A069] text-white border-2 border-white ring-2 ring-[#C5A069]"
                      : "bg-white text-gray-400 border border-gray-300"
                  }`}
                >
                  <Check className="w-4 h-4" />
                </div>
                <span className="font-serif text-[11px] sm:text-xs font-semibold text-[#241D1B] mt-2">
                  Złożone
                </span>
                <span className="text-[9px] text-[#857670] hidden sm:block">
                  Przyjęte do butiku
                </span>
              </div>

              {/* Krok 2 */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all ${
                    currentStep >= 2
                      ? "bg-[#C5A069] text-white border-2 border-white ring-2 ring-[#C5A069]"
                      : currentStep === 1
                      ? "bg-[#FAF6F1] text-[#C5A069] border-2 border-[#C5A069] animate-pulse"
                      : "bg-white text-gray-400 border border-gray-300"
                  }`}
                >
                  <Package className="w-4 h-4" />
                </div>
                <span className="font-serif text-[11px] sm:text-xs font-semibold text-[#241D1B] mt-2">
                  Pakowanie
                </span>
                <span className="text-[9px] text-[#857670] hidden sm:block">
                  Kompletowanie ubrań
                </span>
              </div>

              {/* Krok 3 */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all ${
                    currentStep >= 3
                      ? "bg-[#C5A069] text-white border-2 border-white ring-2 ring-[#C5A069]"
                      : currentStep === 2
                      ? "bg-[#FAF6F1] text-[#C5A069] border-2 border-[#C5A069] animate-pulse"
                      : "bg-white text-gray-400 border border-gray-300"
                  }`}
                >
                  <Truck className="w-4 h-4" />
                </div>
                <span className="font-serif text-[11px] sm:text-xs font-semibold text-[#241D1B] mt-2">
                  W drodze
                </span>
                <span className="text-[9px] text-[#857670] hidden sm:block">
                  Przekazano InPost
                </span>
              </div>

              {/* Krok 4 */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all ${
                    currentStep >= 4
                      ? "bg-emerald-600 text-white border-2 border-white ring-2 ring-emerald-600"
                      : "bg-white text-gray-400 border border-gray-300"
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="font-serif text-[11px] sm:text-xs font-semibold text-[#241D1B] mt-2">
                  Dostarczone
                </span>
                <span className="text-[9px] text-[#857670] hidden sm:block">
                  Gotowe do odbioru
                </span>
              </div>
            </div>

            {/* Linia łącząca etapy w tle */}
            <div className="absolute top-[26px] left-[12%] right-[12%] h-[2px] bg-[#EADFD5] -z-0">
              <div
                className="h-full bg-[#C5A069] transition-all duration-500"
                style={{
                  width:
                    currentStep === 1
                      ? "0%"
                      : currentStep === 2
                      ? "33%"
                      : currentStep === 3
                      ? "66%"
                      : "100%",
                }}
              />
            </div>
          </div>

          {/* Karta z numerem przesyłki i bezpośrednim linkiem do InPost */}
          {order.trackingNumber ? (
            <div className="p-4 bg-white border border-[#C5A069]/60 rounded-md shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-[#857670] uppercase tracking-wider block">
                    Numer listu przewozowego InPost:
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-sm sm:text-base font-bold text-[#241D1B]">
                      {order.trackingNumber}
                    </span>
                    <button
                      type="button"
                      onClick={copyTracking}
                      className="p-1 text-[#857670] hover:text-[#241D1B] transition-colors"
                      title="Kopiuj numer przesyłki"
                    >
                      {copiedTracking ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <a
                  href={`https://inpost.pl/sledzenie-przesylek?number=${encodeURIComponent(order.trackingNumber)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-[#FFD800] hover:bg-[#F2CD00] text-black font-semibold text-xs rounded transition-all flex items-center justify-center gap-2 shadow-xs shrink-0"
                >
                  <Truck className="w-4 h-4 text-black" />
                  <span>Śledź przesyłkę w InPost ↗</span>
                </a>
              </div>

              {order.parcelLockerCode && (
                <div className="text-xs text-[#6E6259] pt-2 border-t border-[#FAF6F1] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C5A069]" />
                  <span>
                    Docelowy Paczkomat: <strong>{order.parcelLockerCode}</strong>
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-white border border-[#EADFD5] rounded text-xs text-[#6E6259] flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#C5A069] shrink-0" />
              <span>
                Paczka jest przygotowywana w butiku. W momencie nadania przez właścicielkę w Paczkomacie otrzymasz powiadomienie SMS i e-mail z kodem odbioru.
              </span>
            </div>
          )}
        </div>

        {/* ========================================================
            SEKCJA: EDYCJA ZAMÓWIENIA / DOKUPOWANIE (DOPÓKI STATUS TO "NEW")
           ======================================================== */}
        <div className="border border-[#EADFD5] rounded-lg p-5 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EADFD5]">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C5A069]" />
                <h2 className="font-serif text-sm uppercase tracking-wider text-[#241D1B] font-semibold">
                  Modyfikacja Zamówienia
                </h2>
              </div>
              <p className="text-xs text-[#6E6259] mt-0.5">
                {canEdit
                  ? "Twoje zamówienie oczekuje jeszcze na akceptację przez butik. Możesz dokupić kolejne ubrania bez dodatkowych kosztów wysyłki!"
                  : "Zamówienie zostało już zaakceptowane przez butik (trwa pakowanie). Edycja jest zablokowana."}
              </p>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() => setIsEditingOrder(!isEditingOrder)}
                className="px-4 py-2 bg-[#FAF6F1] hover:bg-[#F2DCD7] border border-[#EADFD5] text-[#241D1B] text-xs font-semibold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#C5A069]" />
                <span>{isEditingOrder ? "Ukryj edycję" : "+ Dokup do zamówienia / Edytuj"}</span>
              </button>
            )}
          </div>

          {/* Formularz dokupywania ubrań i edycji ilości */}
          {isEditingOrder && canEdit && (
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-[#FAF6F1] border border-[#EADFD5] rounded-md space-y-3">
                <h3 className="font-serif text-xs uppercase tracking-wider font-bold text-[#241D1B]">
                  Wybierz ubranie, które chcesz dołączyć do tego zamówienia:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6">
                    <select
                      value={selectedProductId}
                      onChange={(e) => {
                        setSelectedProductId(e.target.value);
                        setSelectedVariantId("");
                      }}
                      className="w-full bg-white border border-[#EADFD5] p-2 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                    >
                      <option value="">-- Wybierz produkt z butiku --</option>
                      {availableProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {(p.promotionalPrice || p.basePrice).toFixed(2)} zł
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedProductId && (
                    <div className="sm:col-span-4">
                      <select
                        value={selectedVariantId}
                        onChange={(e) => setSelectedVariantId(e.target.value)}
                        className="w-full bg-white border border-[#EADFD5] p-2 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                      >
                        <option value="">Wybierz rozmiar i kolor</option>
                        {availableProducts
                          .find((p) => p.id === selectedProductId)
                          ?.variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.size} ({v.color})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      disabled={!selectedProductId}
                      onClick={handleAddItemToOrder}
                      className="w-full py-2 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs font-semibold rounded disabled:opacity-50 transition-colors"
                    >
                      + Dodaj
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista pozycji w edycji */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-[#241D1B]">
                  Produkty w zamówieniu (możesz zmienić ilość lub usunąć):
                </h4>
                {editedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white border border-[#EADFD5] rounded flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-[#241D1B]">{item.productNameSnapshot}</p>
                      <p className="text-[11px] text-[#6E6259]">{item.variantSnapshot}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(idx, -1)}
                        className="p-1 rounded bg-[#FAF6F1] border border-[#EADFD5] hover:bg-gray-100"
                      >
                        <Minus className="w-3 h-3 text-[#241D1B]" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(idx, 1)}
                        className="p-1 rounded bg-[#FAF6F1] border border-[#EADFD5] hover:bg-gray-100"
                      >
                        <Plus className="w-3 h-3 text-[#241D1B]" />
                      </button>
                    </div>

                    <div className="w-20 text-right font-bold text-[#241D1B]">
                      {item.totalSnapshot.toFixed(2)} zł
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuantityChange(idx, -item.quantity)}
                      className="p-1 text-red-500 hover:text-red-700"
                      title="Usuń pozycję"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditedItems(order.items);
                    setIsEditingOrder(false);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-semibold rounded text-[#241D1B]"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={handleSaveOrderEdit}
                  className="px-6 py-2 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors disabled:opacity-50"
                >
                  {isSavingEdit ? "Zapisywanie..." : "Zatwierdź zmiany w zamówieniu"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            SZCZEGÓŁY ZAMÓWIENIA: ZAMÓWIONE PRODUKTY & SUMY
           ======================================================== */}
        <div className="space-y-4">
          <h3 className="font-serif text-sm uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
            Zamówione Produkty
          </h3>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 py-2 border-b border-[#FAF6F1]"
              >
                <div className="flex items-center gap-3">
                  {item.productImageUrl && (
                    <div className="relative w-12 h-14 bg-[#F7EFE8] rounded overflow-hidden shrink-0">
                      <Image
                        src={item.productImageUrl}
                        alt={item.productNameSnapshot}
                        fill
                        className="object-cover"
                        unoptimized={Boolean(item.productImageUrl.startsWith("data:"))}
                      />
                    </div>
                  )}
                  <div>
                    <h4 className="font-serif font-medium text-xs sm:text-sm text-[#241D1B]">
                      {item.productNameSnapshot}
                    </h4>
                    <p className="text-[11px] text-[#857670] mt-0.5">{item.variantSnapshot}</p>
                    <p className="text-[11px] text-[#6E6259]">
                      {item.quantity} szt. x {item.unitPriceSnapshot.toFixed(2)} zł
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-xs sm:text-sm text-[#241D1B]">
                  {item.totalSnapshot.toFixed(2)} PLN
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 space-y-1.5 text-xs text-[#6E6259]">
            <div className="flex justify-between">
              <span>Wartość produktów:</span>
              <span className="font-medium text-[#241D1B]">{order.subtotalAmount.toFixed(2)} PLN</span>
            </div>
            <div className="flex justify-between">
              <span>Koszt dostawy:</span>
              <span className="font-medium text-[#241D1B]">
                {order.shippingCost === 0 ? "Darmowa dostawa" : `${order.shippingCost.toFixed(2)} PLN`}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#EADFD5] text-sm font-semibold text-[#241D1B]">
              <span>Łączna kwota zamówienia:</span>
              <span className="text-base text-[#AF884F]">{order.totalAmount.toFixed(2)} PLN</span>
            </div>
          </div>
        </div>

        {/* Szczegóły doręczenia i odbiorcy */}
        <div className="p-4 bg-[#FAF6F1] border border-[#EADFD5] rounded space-y-2 text-xs">
          <h4 className="font-serif uppercase tracking-wider text-[11px] font-semibold text-[#241D1B]">
            Szczegóły Doręczenia
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[#3E3B38]">
            <div>
              <p className="text-[#857670] text-[10px] uppercase">Odbiorca:</p>
              <p className="font-semibold">
                {order.customerFirstName} {order.customerLastName}
              </p>
              <p>{order.customerEmail}</p>
              <p>{order.customerPhone}</p>
            </div>
            <div>
              <p className="text-[#857670] text-[10px] uppercase">Sposób doręczenia:</p>
              <p className="font-semibold">
                {shippingLabels[order.shippingMethod] || order.shippingMethod}
              </p>
              {order.customerNotes && (
                <p className="mt-1 italic text-[#6E6259]">Uwagi: "{order.customerNotes}"</p>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================
            NOWA SEKCJA: WYKLIKANIE ZWROTU PRODUKTÓW (14 DNI)
           ======================================================== */}
        <div className="pt-4 border-t border-[#EADFD5] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h4 className="font-serif text-xs uppercase tracking-wider font-bold text-[#241D1B] flex items-center justify-center sm:justify-start gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-[#C5A069]" />
              <span>Prawo do Zwrotu (14 dni)</span>
            </h4>
            <p className="text-[11px] text-[#6E6259] mt-0.5">
              Ubranie nie pasuje? Możesz łatwo i szybko wyklikać zwrot bez drukowania formularza.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsReturnModalOpen(true)}
            className="px-5 py-2.5 bg-white border border-[#D8BE8E] hover:border-[#C5A069] hover:bg-[#FAF6F1] text-xs uppercase tracking-wider font-semibold text-[#241D1B] rounded transition-all shadow-xs shrink-0"
          >
            Zgłoś zwrot produktów
          </button>
        </div>
      </div>

      {/* ========================================================
          MODAL ZGŁOSZENIA ZWROTU DLA KLIENTKI
         ======================================================== */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#EADFD5]">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-[#C5A069]" />
                <h3 className="font-serif text-base uppercase tracking-wider font-bold text-[#241D1B]">
                  Zgłoszenie Zwrotu Produktów
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="p-1 text-gray-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-4 text-xs">
              <div>
                <p className="font-semibold text-[#241D1B] mb-2">
                  1. Zaznacz pozycje z zamówienia, które chcesz zwrócić:
                </p>
                <div className="space-y-2">
                  {order.items.map((item) => {
                    const sel = selectedReturnItems[item.id] || { selected: false, reason: "Niewłaściwy rozmiar" };
                    return (
                      <div
                        key={item.id}
                        className={`p-3 border rounded transition-colors ${
                          sel.selected ? "border-[#C5A069] bg-[#FAF6F1]" : "border-[#EADFD5] bg-white"
                        }`}
                      >
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sel.selected}
                            onChange={() => handleToggleReturnItem(item.id)}
                            className="w-4 h-4 accent-[#C5A069] mt-0.5 cursor-pointer"
                          />
                          <div className="flex-1">
                            <span className="font-semibold text-[#241D1B] block">
                              {item.productNameSnapshot}
                            </span>
                            <span className="text-[11px] text-[#6E6259]">
                              {item.variantSnapshot} — {item.totalSnapshot.toFixed(2)} zł
                            </span>
                          </div>
                        </label>

                        {sel.selected && (
                          <div className="mt-2.5 pt-2 border-t border-[#EADFD5]/60 pl-6 space-y-1">
                            <label className="text-[10px] uppercase font-bold text-[#857670] block">
                              Powód zwrotu:
                            </label>
                            <select
                              value={sel.reason}
                              onChange={(e) =>
                                setSelectedReturnItems((prev) => ({
                                  ...prev,
                                  [item.id]: { ...prev[item.id], reason: e.target.value },
                                }))
                              }
                              className="w-full bg-white border border-[#EADFD5] p-1.5 text-xs text-[#241D1B] focus:outline-none"
                            >
                              <option value="Niewłaściwy rozmiar">Niewłaściwy rozmiar (za małe / za duże)</option>
                              <option value="Fason nie leży idealnie">Fason nie leży tak, jak oczekiwano</option>
                              <option value="Inny odcień niż na zdjęciu">Odcień różni się od moich oczekiwań</option>
                              <option value="Rezygnacja bez podania przyczyny">Rezygnacja bez podania przyczyny (14 dni)</option>
                              <option value="Inny powód">Inny powód</option>
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="font-semibold text-[#241D1B] mb-1.5">
                  2. Wybierz preferowany sposób zwrotu:
                </p>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-2.5 border border-[#EADFD5] rounded bg-[#FAF6F1] cursor-pointer">
                    <input
                      type="radio"
                      name="returnMethod"
                      value="INPOST_LOCKER"
                      checked={returnMethod === "INPOST_LOCKER"}
                      onChange={() => setReturnMethod("INPOST_LOCKER")}
                      className="accent-[#C5A069]"
                    />
                    <div>
                      <span className="font-bold text-[#241D1B] block">
                        Szybki Zwrot Paczkomatem InPost (Rekomendowane)
                      </span>
                      <span className="text-[10px] text-[#6E6259]">
                        Wygenerujemy dla Ciebie kod zwrotu – nadasz paczkę w dowolnym Paczkomacie bez drukowania etykiety.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 border border-[#EADFD5] rounded bg-white cursor-pointer">
                    <input
                      type="radio"
                      name="returnMethod"
                      value="COURIER"
                      checked={returnMethod === "COURIER"}
                      onChange={() => setReturnMethod("COURIER")}
                      className="accent-[#C5A069]"
                    />
                    <div>
                      <span className="font-bold text-[#241D1B] block">
                        Wysyłka pocztą / kurierem na adres Butiku
                      </span>
                      <span className="text-[10px] text-[#6E6259]">
                        AURA Boutique K.B., ul. Poprzeczna 3/1A, 55-110 Żmigród
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 border border-[#EADFD5] rounded bg-white cursor-pointer">
                    <input
                      type="radio"
                      name="returnMethod"
                      value="IN_PERSON"
                      checked={returnMethod === "IN_PERSON"}
                      onChange={() => setReturnMethod("IN_PERSON")}
                      className="accent-[#C5A069]"
                    />
                    <div>
                      <span className="font-bold text-[#241D1B] block">
                        Zwrot osobisty w butiku stacjonarnym
                      </span>
                      <span className="text-[10px] text-[#6E6259]">
                        W godzinach otwarcia butiku w Żmigrodzie (pon–pt 10–17, sob 9–13).
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#241D1B] block mb-1">
                  3. Dodatkowe uwagi dla właścicielki (opcjonalne):
                </label>
                <textarea
                  rows={2}
                  placeholder="Np. Chętnie wymienię na rozmiar M, jeśli jest dostępny..."
                  value={customerReturnNote}
                  onChange={(e) => setCustomerReturnNote(e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2 text-xs text-[#241D1B] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#EADFD5] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-semibold rounded text-[#241D1B]"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="px-6 py-2.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors disabled:opacity-50"
                >
                  {isSubmittingReturn ? "Wysyłanie..." : "Zatwierdź zgłoszenie zwrotu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

