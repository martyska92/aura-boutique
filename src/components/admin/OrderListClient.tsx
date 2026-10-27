"use client";

import React, { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { Order, FulfillmentStatus, PaymentStatus } from "@/lib/types";

interface OrderListClientProps {
  initialOrders: Order[];
}

export function OrderListClient({ initialOrders }: OrderListClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

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

      {/* Lista zamówień */}
      <div className="bg-white border border-[#EADFD5] rounded shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#EADFD5] flex justify-between items-center text-xs text-[#6E6259]">
          <span>
            Liczba zamówień: <strong>{filteredOrders.length}</strong>
          </span>
          <span className="text-[11px] text-[#C5A069] font-medium">
            Kliknij w wiersz lub "Zarządzaj", aby zmienić status i wpisać numer paczki
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#6E6259]">
            Brak zamówień spełniających wybrane kryteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-[#EADFD5]">
              <thead className="bg-[#FAF6F1] text-[#6E6259] uppercase text-[10px]">
                <tr>
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
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FAF6F1] transition-colors">
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
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${statusBadges[o.fulfillmentStatus]?.class}`}>
                        {statusBadges[o.fulfillmentStatus]?.label}
                      </span>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
