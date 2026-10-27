"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Truck,
  CreditCard,
  MapPin,
  Save,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  AlertCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Order, FulfillmentStatus, PaymentStatus } from "@/lib/types";

interface OrderDetailClientProps {
  order: Order;
}

export function OrderDetailClient({ order: initialOrder }: OrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order>(initialOrder);

  const [fulfillmentStatus, setFulfillmentStatus] = useState<FulfillmentStatus>(
    order.fulfillmentStatus
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.paymentStatus);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");
  const [adminNotes, setAdminNotes] = useState(order.adminNotes || "");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          fulfillmentStatus,
          paymentStatus,
          trackingNumber: trackingNumber.trim(),
          adminNotes: adminNotes.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setOrder(data.order);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        router.refresh();
      } else {
        alert(data.error || "Błąd podczas zapisywania zmian.");
      }
    } catch (e: any) {
      alert("Błąd połączenia: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getInPostTrackingUrl = (code: string) =>
    `https://inpost.pl/sledzenie-przesylek?number=${encodeURIComponent(code)}`;

  return (
    <div className="space-y-8 pb-16">
      {/* Pasek górny */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EADFD5]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/zamowienia"
            className="p-2 border border-[#EADFD5] bg-white rounded text-[#6E6259] hover:text-[#241D1B]"
            title="Wróć do listy"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl text-[#241D1B] flex items-center gap-2">
              <span>Zamówienie:</span>
              <span className="font-mono font-bold">{order.orderNumber}</span>
            </h1>
            <p className="text-xs text-[#6E6259]">
              Złożone:{" "}
              {new Date(order.createdAt).toLocaleString("pl-PL", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/zamowienie/${order.id}/potwierdzenie`}
            target="_blank"
            className="px-3.5 py-2 bg-white border border-[#EADFD5] text-xs uppercase tracking-wider rounded text-[#241D1B] hover:border-[#C5A069] flex items-center gap-1.5"
          >
            <span>Widok dla klientki</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>Status zamówienia oraz numer listu przewozowego zostały pomyślnie zaktualizowane!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lewa strona: Szczegóły zamówienia & Pozycje */}
        <div className="lg:col-span-8 space-y-6">
          {/* Pozycje zamówienia */}
          <div className="bg-white p-6 border border-[#EADFD5] rounded shadow-sm space-y-4">
            <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
              Zamówione Ubrania ({order.items.length})
            </h2>

            <div className="divide-y divide-[#EADFD5]">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4 first:pt-0">
                  <div className="flex items-center gap-3">
                    {item.productImageUrl && (
                      <div className="relative w-14 h-20 bg-[#FAF6F1] border border-[#EADFD5] overflow-hidden shrink-0 rounded-xs">
                        <Image src={item.productImageUrl} alt={item.productNameSnapshot} fill className="object-cover" sizes="56px" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-serif font-medium text-sm text-[#241D1B]">
                        {item.productNameSnapshot}
                      </h3>
                      <p className="text-xs text-[#6E6259] mt-0.5 font-mono">
                        {item.variantSnapshot}
                      </p>
                      <p className="text-xs text-[#6E6259] mt-0.5">
                        {item.quantity} szt. x {item.unitPriceSnapshot.toFixed(2)} zł
                      </p>
                    </div>
                  </div>

                  <span className="font-semibold text-sm text-[#241D1B]">
                    {item.totalSnapshot.toFixed(2)} zł
                  </span>
                </div>
              ))}
            </div>

            {/* Podsumowanie finansowe */}
            <div className="pt-4 border-t border-[#EADFD5] space-y-2 text-xs text-[#6E6259]">
              <div className="flex justify-between">
                <span>Wartość produktów:</span>
                <span className="font-medium text-[#241D1B]">{order.subtotalAmount.toFixed(2)} zł</span>
              </div>
              <div className="flex justify-between">
                <span>Koszt wysyłki:</span>
                <span className="font-medium text-[#241D1B]">{order.shippingCost.toFixed(2)} zł</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#EADFD5] text-sm font-semibold text-[#241D1B]">
                <span>Łącznie do zapłaty:</span>
                <span className="text-base text-[#AF884F]">{order.totalAmount.toFixed(2)} zł</span>
              </div>
            </div>
          </div>

          {/* Dane Klientki i Adres */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 border border-[#EADFD5] rounded shadow-sm space-y-3 text-xs">
              <h3 className="font-serif text-sm uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
                Dane Klientki
              </h3>
              <p className="font-semibold text-sm text-[#241D1B]">
                {order.customerFirstName} {order.customerLastName}
              </p>
              <div className="space-y-1.5 text-[#3E3B38]">
                <a
                  href={`tel:${order.customerPhone}`}
                  className="flex items-center gap-2 hover:text-[#C5A069]"
                >
                  <Phone className="w-3.5 h-3.5 text-[#C5A069]" />
                  <span>{order.customerPhone}</span>
                </a>
                <a
                  href={`mailto:${order.customerEmail}`}
                  className="flex items-center gap-2 hover:text-[#C5A069]"
                >
                  <Mail className="w-3.5 h-3.5 text-[#C5A069]" />
                  <span>{order.customerEmail}</span>
                </a>
              </div>
              {order.customerNotes && (
                <div className="mt-3 p-2.5 bg-[#FAF6F1] border border-[#EADFD5] rounded text-[#6E6259] italic">
                  Uwagi: "{order.customerNotes}"
                </div>
              )}
            </div>

            <div className="bg-white p-6 border border-[#EADFD5] rounded shadow-sm space-y-3 text-xs">
              <h3 className="font-serif text-sm uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
                Sposób Dostawy
              </h3>
              <div className="space-y-2 text-[#3E3B38]">
                {order.shippingMethod === "INPOST_LOCKER" && (
                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded space-y-1">
                    <p className="font-bold text-amber-900">Paczkomat InPost</p>
                    <p className="font-mono text-sm font-bold text-[#241D1B]">
                      {order.parcelLockerCode}
                    </p>
                  </div>
                )}

                {order.shippingMethod === "COURIER" && (
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded space-y-1">
                    <p className="font-bold text-blue-900">Kurier pod adres:</p>
                    <p className="font-medium">{order.shippingStreet}</p>
                    <p>{order.shippingPostalCode} {order.shippingCity}</p>
                  </div>
                )}

                {order.shippingMethod === "LOCAL_PICKUP" && (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded space-y-1">
                    <p className="font-bold text-emerald-900">Odbiór osobisty w Butiku</p>
                    <p>Żmigród, ul. Poprzeczna 3/1A</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Prawa strona: KONTROLA STATUSÓW I WYSYŁKI */}
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={handleSave}
            className="bg-white p-6 border border-[#EADFD5] rounded shadow-sm space-y-5"
          >
            <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
              Zarządzanie Realizacją
            </h2>

            {/* Status realizacji */}
            <div>
              <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                Status Realizacji Zamówienia
              </label>
              <select
                value={fulfillmentStatus}
                onChange={(e) => setFulfillmentStatus(e.target.value as any)}
                className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs font-semibold text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
              >
                <option value="NEW">NOWE (Oczekuje na spakowanie)</option>
                <option value="PROCESSING">W TRAKCIE KOMPLETOWANIA</option>
                <option value="SHIPPED">WYSŁANE DO KLIENTKI</option>
                <option value="DELIVERED">ZREALIZOWANE / ODEBRANE</option>
                <option value="CANCELLED">ANULOWANE</option>
              </select>
            </div>

            {/* Status płatności (ODDZIELONY ZGODNIE Z POLECENIEM!) */}
            <div>
              <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                Status Płatności (Oddzielony od wysyłki)
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs font-semibold text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
              >
                <option value="PENDING">OCZEKUJE NA WPŁATĘ (PENDING)</option>
                <option value="PAID">OPŁACONE (WPŁYW POTWIERDZONY)</option>
                <option value="REFUNDED">ZWRÓCONE (ZWROT ŚRODKÓW)</option>
                <option value="FAILED">BŁĄD PŁATNOŚCI</option>
              </select>
            </div>

            {/* Numer przesyłki / listu przewozowego */}
            <div>
              <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                Numer Przesyłki (InPost / Kurier)
              </label>
              <input
                type="text"
                placeholder="Np. 624000000000000000000000"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs font-mono text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
              />
              {trackingNumber && (
                <a
                  href={getInPostTrackingUrl(trackingNumber)}
                  target="_blank"
                  className="mt-1 text-[11px] text-[#C5A069] hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Sprawdź śledzenie InPost</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Notatki wewnętrzne butiku */}
            <div>
              <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                Notatka wewnętrzna właścicielki
              </label>
              <textarea
                rows={3}
                placeholder="Np. Klientka dzwoniła z prośbą o wysyłkę po 15:00..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 bg-[#C5A069] text-white text-xs uppercase tracking-widest font-semibold rounded hover:bg-[#AF884F] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4 text-white" />
              <span>{isSaving ? "Zapisywanie..." : "Zapisz Zmiany w Zamówieniu"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
