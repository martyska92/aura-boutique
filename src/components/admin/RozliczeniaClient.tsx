"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  CreditCard,
  RotateCcw,
  Clock,
  Calendar,
  Filter,
  Download,
  ExternalLink,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Calculator,
} from "lucide-react";
import { Order } from "@/lib/types";

interface RozliczeniaClientProps {
  initialOrders: Order[];
}

export function RozliczeniaClient({ initialOrders }: RozliczeniaClientProps) {
  const [period, setPeriod] = useState<"today" | "this_month" | "last_month" | "all" | "custom">(
    "this_month"
  );
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("ALL");

  // Filtrowanie według wybranego zakresu czasowego
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    return initialOrders.filter((order) => {
      const orderDate = new Date(order.createdAt);

      // Filtr okresu
      if (period === "today") {
        if (orderDate < todayStart) return false;
      } else if (period === "this_month") {
        if (orderDate < thisMonthStart) return false;
      } else if (period === "last_month") {
        if (orderDate < lastMonthStart || orderDate > lastMonthEnd) return false;
      } else if (period === "custom") {
        if (startDate && orderDate < new Date(startDate)) return false;
        if (endDate && orderDate > new Date(endDate + "T23:59:59")) return false;
      }

      // Filtr metody płatności
      if (paymentMethodFilter !== "ALL") {
        if (order.paymentMethod !== paymentMethodFilter) return false;
      }

      // Filtr statusu płatności
      if (paymentStatusFilter !== "ALL") {
        if (order.paymentStatus !== paymentStatusFilter) return false;
      }

      return true;
    });
  }, [initialOrders, period, startDate, endDate, paymentMethodFilter, paymentStatusFilter]);

  // Obliczenia metryk finansowych
  const metrics = useMemo(() => {
    let paidTotal = 0;
    let refundedTotal = 0;
    let pendingTotal = 0;
    let shippingRevenue = 0;

    filteredOrders.forEach((o) => {
      if (o.paymentStatus === "PAID") {
        paidTotal += o.totalAmount;
        shippingRevenue += o.shippingCost || 0;
      } else if (o.paymentStatus === "REFUNDED") {
        refundedTotal += o.totalAmount;
      } else if (o.paymentStatus === "PENDING") {
        pendingTotal += o.totalAmount;
      }
    });

    const netReceived = paidTotal - refundedTotal;
    const productsRevenue = netReceived - shippingRevenue;

    return {
      paidTotal,
      refundedTotal,
      netReceived,
      pendingTotal,
      shippingRevenue,
      productsRevenue,
      transactionsCount: filteredOrders.length,
      paidCount: filteredOrders.filter((o) => o.paymentStatus === "PAID").length,
    };
  }, [filteredOrders]);

  // Eksport do pliku CSV
  const handleExportCSV = () => {
    const headers = [
      "Numer zamówienia",
      "Data",
      "Klientka",
      "Email",
      "Metoda płatności",
      "Status płatności",
      "Wartość produktów (PLN)",
      "Koszt dostawy (PLN)",
      "Łączna kwota (PLN)",
    ];

    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleString("pl-PL"),
      `"${o.customerFirstName} ${o.customerLastName}"`,
      o.customerEmail,
      o.paymentMethod,
      o.paymentStatus,
      o.subtotalAmount.toFixed(2),
      o.shippingCost.toFixed(2),
      o.totalAmount.toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rozliczenia_aura_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Nagłówek */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EADFD5]">
        <div>
          <div className="flex items-center gap-2 text-[#C5A069] text-xs font-semibold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Finanse i Księgowość Butiku</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#241D1B]">
            Rozliczenia i Wpływy Sprzedaży
          </h1>
          <p className="text-xs text-[#6E6259] mt-1 max-w-2xl">
            Rzeczywiste wpływy na rachunek butiku, płatności zaksięgowane, zwroty oraz rozliczenia kosztów dostawy. Zamówienia testowe są ściśle wykluczone.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <Link
            href="/admin/koszty-i-marze"
            className="px-4 py-2 bg-[#241D1B] hover:bg-[#3D322C] text-[#FAF6F1] rounded text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Calculator className="w-3.5 h-3.5 text-[#E6CA92]" />
            <span>Koszty i kalkulator marży</span>
          </Link>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white border border-[#C5A069] text-[#7A5B20] hover:bg-[#FAF6F1] rounded text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Eksportuj do CSV (Excel)</span>
          </button>
        </div>
      </div>

      {/* Pasek wyboru okresu */}
      <div className="p-4 bg-white border border-[#EADFD5] rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#241D1B] mr-2">Okres:</span>
          {[
            { id: "today", label: "Dzisiaj" },
            { id: "this_month", label: "Bieżący miesiąc" },
            { id: "last_month", label: "Poprzedni miesiąc" },
            { id: "all", label: "Cały okres" },
            { id: "custom", label: "Własny zakres" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as any)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                period === tab.id
                  ? "bg-[#241D1B] text-white"
                  : "bg-[#FAF8F5] text-[#6E6259] hover:bg-[#EADFD5]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {period === "custom" && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#FAF8F5] border border-[#EADFD5] p-1.5 rounded text-xs text-[#241D1B]"
            />
            <span className="text-[#6E6259]">do</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#FAF8F5] border border-[#EADFD5] p-1.5 rounded text-xs text-[#241D1B]"
            />
          </div>
        )}

        <div className="flex items-center gap-2 text-xs">
          <span className="text-xs text-[#6E6259]">Metoda:</span>
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="bg-[#FAF8F5] border border-[#EADFD5] p-1.5 rounded text-xs text-[#241D1B]"
          >
            <option value="ALL">Wszystkie metody</option>
            <option value="BLIK">BLIK</option>
            <option value="PAYU">PayU</option>
            <option value="PRZELEWY24">Przelewy24</option>
            <option value="TRADITIONAL_TRANSFER">Przelew tradycyjny</option>
            <option value="COD">Pobranie (COD)</option>
          </select>
        </div>
      </div>

      {/* Karty KPI finansowych */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Potwierdzone wpływy */}
        <div className="bg-white p-5 border border-[#EADFD5] rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#6E6259]">
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              Wpłaty Zaksięgowane
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-serif text-emerald-800 font-semibold">
            {metrics.paidTotal.toFixed(2)} zł
          </div>
          <p className="text-[11px] text-[#6E6259]">
            {metrics.paidCount} opłaconych zamówień
          </p>
        </div>

        {/* Zwroty */}
        <div className="bg-white p-5 border border-[#EADFD5] rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#6E6259]">
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              Zwroty i Korekty
            </span>
            <span className="p-2 bg-red-50 text-red-700 rounded-full">
              <RotateCcw className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-serif text-red-800 font-semibold">
            {metrics.refundedTotal.toFixed(2)} zł
          </div>
          <p className="text-[11px] text-[#6E6259]">
            Zwrócone środki klientkom
          </p>
        </div>

        {/* Wpływy netto */}
        <div className="bg-white p-5 border border-[#EADFD5] rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#6E6259]">
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              Wpływy Netto (Po zwrotach)
            </span>
            <span className="p-2 bg-amber-50 text-amber-700 rounded-full">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-serif text-[#241D1B] font-semibold">
            {metrics.netReceived.toFixed(2)} zł
          </div>
          <p className="text-[11px] text-[#6E6259]">
            W tym dostawa: {metrics.shippingRevenue.toFixed(2)} zł
          </p>
        </div>

        {/* Oczekujące wpłaty */}
        <div className="bg-white p-5 border border-[#EADFD5] rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#6E6259]">
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              Oczekujące Płatności
            </span>
            <span className="p-2 bg-blue-50 text-blue-700 rounded-full">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-serif text-blue-900 font-semibold">
            {metrics.pendingTotal.toFixed(2)} zł
          </div>
          <p className="text-[11px] text-[#6E6259]">
            W trakcie autoryzacji lub przelewu
          </p>
        </div>
      </div>

      {/* Tabela transakcji */}
      <div className="bg-white border border-[#EADFD5] rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#EADFD5] flex items-center justify-between">
          <h2 className="font-serif text-sm uppercase tracking-wider text-[#241D1B] font-semibold">
            Lista Transakcji ({filteredOrders.length})
          </h2>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#6E6259]">
            Brak transakcji spełniających wybrane kryteria w tym okresie.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#EADFD5] text-[#7A6458] font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Zamówienie</th>
                  <th className="p-3.5">Data</th>
                  <th className="p-3.5">Klientka</th>
                  <th className="p-3.5">Metoda</th>
                  <th className="p-3.5">Status Płatności</th>
                  <th className="p-3.5 text-right">Dostawa</th>
                  <th className="p-3.5 text-right">Łącznie</th>
                  <th className="p-3.5 text-center">Akcja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADFD5]">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="p-3.5 font-mono font-semibold text-[#241D1B]">
                      {order.orderNumber}
                    </td>
                    <td className="p-3.5 text-[#6E6259] whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString("pl-PL")}{" "}
                      <span className="text-[10px] text-[#8C6B38]">
                        {new Date(order.createdAt).toLocaleTimeString("pl-PL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-[#241D1B]">
                        {order.customerFirstName} {order.customerLastName}
                      </div>
                      <div className="text-[10px] text-[#6E6259]">{order.customerEmail}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-[#FAF6F1] border border-[#EADFD5] text-[10px] font-semibold text-[#7A5B20]">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          order.paymentStatus === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.paymentStatus === "REFUNDED"
                            ? "bg-red-100 text-red-800"
                            : order.paymentStatus === "FAILED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.paymentStatus === "PAID"
                          ? "Opłacone"
                          : order.paymentStatus === "REFUNDED"
                          ? "Zwrócone"
                          : order.paymentStatus === "FAILED"
                          ? "Nieudana"
                          : "Oczekuje"}
                      </span>
                    </td>
                    <td className="p-3.5 text-right text-[#6E6259]">
                      {order.shippingCost > 0 ? `${order.shippingCost.toFixed(2)} zł` : "0.00 zł"}
                    </td>
                    <td className="p-3.5 text-right font-semibold text-[#241D1B]">
                      {order.totalAmount.toFixed(2)} zł
                    </td>
                    <td className="p-3.5 text-center">
                      <Link
                        href={`/zamowienie/${order.id}/potwierdzenie?key=${order.accessKey || ""}`}
                        target="_blank"
                        className="text-[#8C6B38] hover:text-[#241D1B] inline-flex items-center gap-1 text-[11px]"
                      >
                        <span>Szczegóły</span>
                        <ExternalLink className="w-3 h-3" />
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
