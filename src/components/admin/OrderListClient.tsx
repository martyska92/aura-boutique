"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Search,
  Filter,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Order, FulfillmentStatus, PaymentStatus } from "@/lib/types";

interface OrderListClientProps {
  initialOrders: Order[];
}

export function OrderListClient({ initialOrders }: OrderListClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);

  // Masowe zaznaczanie zamówień
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: FulfillmentStatus) => {
    if (updatingId) return; // Zablokuj kolejną zmianę podczas trwającego zapisu
    setUpdatingId(orderId);
    setStatusError(null);
    setStatusSuccess(null);

    const prevOrder = orders.find((o) => o.id === orderId);
    const prevStatus = prevOrder?.fulfillmentStatus;

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          fulfillmentStatus: newStatus,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? data.order : o))
        );
        const label = statusBadges[newStatus]?.label || newStatus;
        setStatusSuccess(`Pomyślnie zmieniono i trwale zapisano status zamówienia ${data.order.orderNumber} na: ${label}.`);
        setTimeout(() => setStatusSuccess(null), 4000);
        router.refresh();
      } else {
        if (prevStatus) {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, fulfillmentStatus: prevStatus } : o))
          );
        }
        setStatusError(data.error || "Wystąpił błąd podczas trwałego zapisu zmiany statusu w bazie.");
      }
    } catch (err: any) {
      if (prevStatus) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, fulfillmentStatus: prevStatus } : o))
        );
      }
      setStatusError("Błąd sieci lub połączenia z bazą: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchName = `${o.customerFirstName} ${o.customerLastName}`.toLowerCase().includes(q);
      const matchEmail = o.customerEmail.toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchEmail) return false;
    }

    if (statusFilter !== "all" && o.fulfillmentStatus !== statusFilter) {
      return false;
    }

    if (paymentFilter !== "all" && o.paymentStatus !== paymentFilter) {
      return false;
    }

    return true;
  });

  // Obsługa zaznaczania
  const isAllSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((o) => selectedOrderIds.includes(o.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  // Masowa zmiana statusu realizacji lub płatności
  const handleBulkStatusChange = async (newStatus: FulfillmentStatus) => {
    if (selectedOrderIds.length === 0) return;

    setIsBulkUpdating(true);
    setBulkFeedback(null);

    try {
      const res = await fetch("/api/admin/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: selectedOrderIds,
          fulfillmentStatus: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Błąd podczas masowej zmiany statusu.");
      }

      setOrders((prev) =>
        prev.map((o) =>
          selectedOrderIds.includes(o.id) ? { ...o, fulfillmentStatus: newStatus } : o
        )
      );

      const statusName =
        newStatus === "PROCESSING"
          ? "W REALIZACJI"
          : newStatus === "SHIPPED"
          ? "WYSŁANE"
          : newStatus === "DELIVERED"
          ? "ZREALIZOWANE"
          : newStatus === "NEW"
          ? "NOWE"
          : "ANULOWANE";

      setBulkFeedback(
        `Zmieniono status ${selectedOrderIds.length} zamówień na: ${statusName}.${
          newStatus !== "NEW"
            ? " Klientki nie mogą już edytować tych zamówień."
            : " Klientki mogą ponownie edytować te zamówienia."
        }`
      );
      setTimeout(() => setBulkFeedback(null), 5000);
    } catch (err: any) {
      alert("Błąd: " + err.message);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkPaymentChange = async (paymentStatus: PaymentStatus) => {
    if (selectedOrderIds.length === 0) return;

    setIsBulkUpdating(true);
    setBulkFeedback(null);

    try {
      const res = await fetch("/api/admin/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: selectedOrderIds,
          paymentStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Błąd podczas aktualizacji płatności.");
      }

      setOrders((prev) =>
        prev.map((o) =>
          selectedOrderIds.includes(o.id) ? { ...o, paymentStatus } : o
        )
      );

      setBulkFeedback(`Zaktualizowano status płatności dla ${selectedOrderIds.length} zamówień!`);
      setTimeout(() => setBulkFeedback(null), 4000);
    } catch (err: any) {
      alert("Błąd: " + err.message);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const statusBadges: Record<FulfillmentStatus, { label: string; class: string }> = {
    NEW: { label: "Nowe", class: "bg-amber-100 text-amber-800 border-amber-300" },
    PROCESSING: { label: "W realizacji", class: "bg-blue-100 text-blue-800 border-blue-300" },
    SHIPPED: { label: "Wysłane", class: "bg-purple-100 text-purple-800 border-purple-300" },
    DELIVERED: { label: "Zrealizowane", class: "bg-emerald-100 text-emerald-800 border-emerald-300" },
    CANCELLED: { label: "Anulowane", class: "bg-gray-100 text-gray-700 border-gray-300" },
  };

  const paymentBadges: Record<PaymentStatus, { label: string; class: string }> = {
    PENDING: { label: "Oczekuje", class: "text-amber-700 bg-amber-50" },
    PAID: { label: "Opłacone ✓", class: "text-emerald-800 bg-emerald-50 font-bold" },
    FAILED: { label: "Nieudane", class: "text-red-700 bg-red-50" },
    REFUNDED: { label: "Zwrócone", class: "text-gray-700 bg-gray-50" },
  };

  return (
    <div className="space-y-6">
      {/* Komunikaty statusu zapisu do bazy */}
      {statusSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded text-xs flex items-center gap-2 animate-fadeIn">
          <span className="font-bold">✓ Sukces:</span>
          <span>{statusSuccess}</span>
        </div>
      )}
      {statusError && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span className="font-bold">Błąd zapisu w bazie danych:</span>
          <span>{statusError}</span>
        </div>
      )}

      {/* Filtry i wyszukiwarka */}
      <div className="bg-white p-4 sm:p-6 border border-[#E8E2D8] rounded shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#7E7771] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Szukaj po numerze, nazwisku lub e-mailu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAF6F1] border border-[#EADFD5] pl-9 pr-3 py-2 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#FAF6F1] border border-[#EADFD5] px-3 py-2 text-xs text-[#241D1B] focus:outline-none"
          >
            <option value="all">Wszystkie statusy realizacji</option>
            <option value="NEW">Tylko Nowe</option>
            <option value="PROCESSING">W realizacji</option>
            <option value="SHIPPED">Wysłane</option>
            <option value="DELIVERED">Zrealizowane</option>
            <option value="CANCELLED">Anulowane</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-[#FAF6F1] border border-[#EADFD5] px-3 py-2 text-xs text-[#241D1B] focus:outline-none"
          >
            <option value="all">Wszystkie statusy płatności</option>
            <option value="PENDING">Oczekujące na wpłatę</option>
            <option value="PAID">Opłacone</option>
          </select>
        </div>
      </div>

      {/* Pasek akcji masowych dla zamówień */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-[#FAF6F1] border-2 border-[#C5A069] rounded-lg p-3 sm:p-4 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[#C5A069] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {selectedOrderIds.length}
            </span>
            <div>
              <span className="text-xs font-serif font-bold text-[#241D1B] tracking-wider uppercase block sm:inline">
                Zaznaczono {selectedOrderIds.length} z {filteredOrders.length} zamówień
              </span>
              {bulkFeedback && (
                <span className="ml-2 text-xs font-semibold text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-300">
                  {bulkFeedback}
                </span>
              )}
            </div>
          </div>

          {/* Przyciski masowej zmiany statusu realizacji */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Główny przycisk: W REALIZACJI (zgodnie z życzeniem klientki) */}
            <button
              type="button"
              disabled={isBulkUpdating}
              onClick={() => handleBulkStatusChange("PROCESSING")}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              title="Przełącz wszystkie zaznaczone zamówienia na: W REALIZACJI (blokuje dalszą edycję przez klientki)"
            >
              <span>⚡ W REALIZACJI</span>
            </button>

            {/* Inne statusy realizacji */}
            <div className="inline-flex rounded border border-[#EADFD5] overflow-hidden text-[11px] bg-white shadow-2xs">
              <button
                type="button"
                disabled={isBulkUpdating}
                onClick={() => handleBulkStatusChange("SHIPPED")}
                className="px-2.5 py-1.5 hover:bg-purple-50 text-purple-800 font-semibold border-r border-[#EADFD5] transition-colors disabled:opacity-50"
                title="Zmień na: WYSŁANE"
              >
                Wysłane
              </button>
              <button
                type="button"
                disabled={isBulkUpdating}
                onClick={() => handleBulkStatusChange("DELIVERED")}
                className="px-2.5 py-1.5 hover:bg-emerald-50 text-emerald-800 font-semibold border-r border-[#EADFD5] transition-colors disabled:opacity-50"
                title="Zmień na: ZREALIZOWANE"
              >
                Zrealizowane
              </button>
              <button
                type="button"
                disabled={isBulkUpdating}
                onClick={() => handleBulkStatusChange("NEW")}
                className="px-2 py-1.5 hover:bg-amber-50 text-amber-800 font-semibold border-r border-[#EADFD5] transition-colors disabled:opacity-50"
                title="Zmień z powrotem na: NOWE (umożliwia ponowną edycję przez klientkę)"
              >
                Nowe
              </button>
              <button
                type="button"
                disabled={isBulkUpdating}
                onClick={() => handleBulkStatusChange("CANCELLED")}
                className="px-2 py-1.5 hover:bg-gray-100 text-gray-700 transition-colors disabled:opacity-50"
                title="Zmień na: ANULOWANE"
              >
                Anuluj
              </button>
            </div>

            {/* Płatność */}
            <button
              type="button"
              disabled={isBulkUpdating}
              onClick={() => handleBulkPaymentChange("PAID")}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] font-semibold transition-colors disabled:opacity-50"
              title="Oznacz zaznaczone zamówienia jako Opłacone"
            >
              ✓ Opłacone
            </button>

            {/* Odznacz */}
            <button
              type="button"
              onClick={() => setSelectedOrderIds([])}
              className="px-3 py-1.5 bg-white border border-[#EADFD5] text-[#6E6259] hover:text-[#241D1B] rounded text-[11px] font-medium transition-colors ml-auto md:ml-0"
            >
              Odznacz ({selectedOrderIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Lista zamówień */}
      <div className="bg-white border border-[#EADFD5] rounded shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#EADFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#6E6259]">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-[#241D1B]">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-[#C5A069] rounded cursor-pointer"
              />
              <span>Zaznacz wszystkie ({filteredOrders.length})</span>
            </label>
            <span className="text-[#EADFD5]">|</span>
            <span>
              Liczba zamówień: <strong>{filteredOrders.length}</strong>
            </span>
          </div>
          <span className="text-[11px] text-[#C5A069] font-medium">
            Zaznacz pola wyboru po lewej stronie, aby zmienić status zbiorczo jednym kliknięciem
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#6E6259]">
            Brak zamówień spełniających wybrane kryteria.
          </div>
        ) : (
          <>
            {/* WIDOK DLA SMARTFONÓW / TELEFONU (KAFELKOWY BEZ ROZJEŻDŻANIA EKRANU) */}
            <div className="md:hidden divide-y divide-[#EADFD5]">
              {filteredOrders.map((o) => {
                const isSelected = selectedOrderIds.includes(o.id);
                return (
                  <div
                    key={o.id}
                    className={`p-4 space-y-3 transition-colors ${
                      isSelected ? "bg-[#FAF2EB] border-l-4 border-l-[#C5A069]" : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOrder(o.id)}
                          className="w-4 h-4 accent-[#C5A069] rounded cursor-pointer"
                        />
                        <div>
                          <span className="font-mono font-bold text-xs text-[#241D1B]">
                            {o.orderNumber}
                          </span>
                          <span className="text-[10px] text-[#857670] block">
                            {new Date(o.createdAt).toLocaleDateString("pl-PL", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <span className="font-semibold text-sm text-[#241D1B]">
                        {o.totalAmount.toFixed(2)} zł
                      </span>
                    </div>

                    <div className="text-xs text-[#4A3F3B]">
                      <p className="font-medium">
                        {o.customerFirstName} {o.customerLastName}
                      </p>
                      <p className="text-[11px] text-[#857670]">{o.customerPhone} • {o.customerEmail}</p>
                      <p className="text-[11px] text-[#6E6259] mt-0.5">
                        {o.shippingMethod === "INPOST_LOCKER" && `Paczkomat: ${o.parcelLockerCode}`}
                        {o.shippingMethod === "COURIER" && `Kurier (${o.shippingCity})`}
                        {o.shippingMethod === "LOCAL_PICKUP" && "Odbiór osobisty w Żmigrodzie"}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#FAF6F1] flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-[#6E6259]">Zmień status:</span>
                        <div className="flex items-center gap-1.5">
                          {updatingId === o.id && (
                            <Loader2 className="w-3.5 h-3.5 text-[#C5A069] animate-spin shrink-0" />
                          )}
                          <select
                            value={o.fulfillmentStatus}
                            disabled={updatingId === o.id}
                            onChange={(e) => handleStatusChange(o.id, e.target.value as FulfillmentStatus)}
                            className={`text-xs py-1 px-2 rounded font-bold border focus:outline-none disabled:opacity-50 ${statusBadges[o.fulfillmentStatus]?.class}`}
                          >
                            <option value="NEW">NOWE</option>
                            <option value="PROCESSING">W REALIZACJI</option>
                            <option value="SHIPPED">WYSŁANE</option>
                            <option value="DELIVERED">ZREALIZOWANE</option>
                            <option value="CANCELLED">ANULOWANE</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className={`px-2 py-0.5 rounded text-[11px] border border-black/10 ${paymentBadges[o.paymentStatus]?.class}`}>
                          {paymentBadges[o.paymentStatus]?.label}
                        </span>
                        <Link
                          href={`/admin/zamowienia/${o.id}`}
                          className="px-3 py-1 bg-[#C5A069] text-white text-[10px] uppercase tracking-wider font-semibold rounded hover:bg-[#AF884F] transition-colors"
                        >
                          Szczegóły & Etykieta →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* WIDOK DLA KOMPUTERA (TABELA) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-[#EADFD5]">
                <thead className="bg-[#FAF6F1] text-[#6E6259] uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 accent-[#C5A069] rounded cursor-pointer"
                        title="Zaznacz / odznacz wszystkie"
                      />
                    </th>
                    <th className="py-3 px-4">Numer Zamówienia</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Klientka</th>
                    <th className="py-3 px-4">Dostawa</th>
                    <th className="py-3 px-4">Status Płatności</th>
                    <th className="py-3 px-4">Status Realizacji</th>
                    <th className="py-3 px-4">Kwota</th>
                    <th className="py-3 px-4 text-right">Akcja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EADFD5]">
                  {filteredOrders.map((o) => {
                    const isSelected = selectedOrderIds.includes(o.id);
                    return (
                      <tr
                        key={o.id}
                        className={`transition-colors ${
                          isSelected
                            ? "bg-[#FAF2EB] border-l-4 border-l-[#C5A069]"
                            : "hover:bg-[#FAF6F1]"
                        }`}
                      >
                        {/* Checkbox zaznaczenia */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOrder(o.id)}
                            className="w-4 h-4 accent-[#C5A069] rounded cursor-pointer"
                          />
                        </td>

                        <td className="py-3 px-4 font-mono font-medium text-[#241D1B]">
                          <Link
                            href={`/admin/zamowienia/${o.id}`}
                            className="hover:text-[#C5A069] underline"
                          >
                            {o.orderNumber}
                          </Link>
                        </td>

                      <td className="py-3 px-4 text-[#6E6259]">
                        {new Date(o.createdAt).toLocaleDateString("pl-PL", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-medium text-[#241D1B]">
                          {o.customerFirstName} {o.customerLastName}
                        </p>
                        <p className="text-[11px] text-[#6E6259]">{o.customerPhone}</p>
                      </td>

                      <td className="py-3 px-4 text-[#6E6259]">
                        {o.shippingMethod === "INPOST_LOCKER" && (
                          <span>Paczkomat: <strong>{o.parcelLockerCode}</strong></span>
                        )}
                        {o.shippingMethod === "COURIER" && (
                          <span>Kurier ({o.shippingCity})</span>
                        )}
                        {o.shippingMethod === "LOCAL_PICKUP" && (
                          <span className="text-emerald-800 font-semibold">Odbiór w Żmigrodzie</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] border border-black/10 ${paymentBadges[o.paymentStatus]?.class}`}>
                          {paymentBadges[o.paymentStatus]?.label}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {updatingId === o.id && (
                            <Loader2 className="w-3.5 h-3.5 text-[#C5A069] animate-spin shrink-0" />
                          )}
                          <select
                            value={o.fulfillmentStatus}
                            disabled={updatingId === o.id}
                            onChange={(e) => handleStatusChange(o.id, e.target.value as FulfillmentStatus)}
                            className={`text-xs py-1 px-2 rounded font-bold border cursor-pointer focus:outline-none disabled:opacity-50 ${statusBadges[o.fulfillmentStatus]?.class}`}
                          >
                            <option value="NEW">NOWE</option>
                            <option value="PROCESSING">W REALIZACJI</option>
                            <option value="SHIPPED">WYSŁANE</option>
                            <option value="DELIVERED">ZREALIZOWANE</option>
                            <option value="CANCELLED">ANULOWANE</option>
                          </select>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-[#241D1B]">
                        {o.totalAmount.toFixed(2)} zł
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/zamowienia/${o.id}`}
                          className="px-3 py-1.5 bg-[#C5A069] text-white text-[10px] uppercase tracking-wider font-semibold rounded hover:bg-[#AF884F] transition-colors shadow-xs"
                        >
                          Zarządzaj
                        </Link>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
