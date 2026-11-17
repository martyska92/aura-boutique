"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  RotateCcw,
  Tag,
  Percent,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  X,
  ShieldCheck,
  Check,
  AlertCircle,
} from "lucide-react";

export interface CustomerRow {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
  isActive: boolean;
  ordersCount: number;
  paidOrdersCount: number;
  totalPaidAmount: number;
  lastOrderDate: string | null;
  referralCode: string;
  welcomeDiscountCode: string;
  welcomeDiscountUsedAt: string | null;
  individualDiscountPercent: number | null;
  individualDiscountNote: string | null;
  marketingConsent: boolean;
  marketingConsentDate: string;
  orders: {
    id: string;
    orderNumber: string;
    createdAt: string;
    totalAmount: number;
    paymentStatus: string;
    fulfillmentStatus: string;
    itemsCount: number;
  }[];
  returns: {
    id: string;
    orderNumber: string;
    createdAt: string;
    status: string;
    itemsCount: number;
  }[];
}

interface CustomerListClientProps {
  initialCustomers: CustomerRow[];
}

export function CustomerListClient({ initialCustomers }: CustomerListClientProps) {
  const [customers, setCustomers] = useState<CustomerRow[]>(initialCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);

  // Stan formularza rabatu indywidualnego w profilu klientki
  const [discountPercentInput, setDiscountPercentInput] = useState<string>("");
  const [discountNoteInput, setDiscountNoteInput] = useState<string>("");
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);
  const [discountFeedback, setDiscountFeedback] = useState<string | null>(null);

  const filtered = customers.filter((c) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  });

  const handleOpenProfile = (c: CustomerRow) => {
    setSelectedCustomer(c);
    setDiscountPercentInput(c.individualDiscountPercent ? String(c.individualDiscountPercent) : "");
    setDiscountNoteInput(c.individualDiscountNote || "");
    setDiscountFeedback(null);
  };

  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setIsSavingDiscount(true);
    setDiscountFeedback(null);

    try {
      const res = await fetch(`/api/admin/customers/${selectedCustomer.id}/discount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discountPercentage: Number(discountPercentInput) || 0,
          note: discountNoteInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd zapisu rabatu");

      setDiscountFeedback(data.message);

      // Aktualizujemy stan lokalny
      const val = Number(discountPercentInput) || null;
      setCustomers((prev) =>
        prev.map((item) =>
          item.id === selectedCustomer.id
            ? {
                ...item,
                individualDiscountPercent: val && val > 0 ? val : null,
                individualDiscountNote: discountNoteInput || null,
              }
            : item
        )
      );

      setSelectedCustomer((prev) =>
        prev
          ? {
              ...prev,
              individualDiscountPercent: val && val > 0 ? val : null,
              individualDiscountNote: discountNoteInput || null,
            }
          : null
      );
    } catch (err: any) {
      alert("Błąd: " + err.message);
    } finally {
      setIsSavingDiscount(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pasek wyszukiwania i statystyk */}
      <div className="bg-white p-4 rounded border border-[#EADFD5] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Szukaj po imieniu, nazwisku lub adresie e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#FAF6F1] border border-[#EADFD5] pl-9 pr-3 py-2 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded font-medium"
          />
          <Search className="w-4 h-4 text-[#8C7248] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-4 text-xs text-[#6E6259]">
          <span>
            Zarejestrowane klientki: <strong className="text-[#241D1B]">{customers.length}</strong>
          </span>
          <span>•</span>
          <span>
            Wyniki wyszukiwania: <strong className="text-[#241D1B]">{filtered.length}</strong>
          </span>
        </div>
      </div>

      {/* Lista klientek */}
      {filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded border border-[#EADFD5] text-xs text-[#7A6458] space-y-2">
          <Users className="w-10 h-10 text-[#C5A069] mx-auto opacity-50" />
          <p className="font-semibold text-sm text-[#241D1B]">Brak zarejestrowanych klientek</p>
          <p>
            {searchTerm
              ? "Żadna klientka nie pasuje do podanego kryterium wyszukiwania."
              : "Gdy klientki zarejestrują konta w butiku, pojawią się na tej liście."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded border border-[#EADFD5] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6F1] text-[#7A6458] uppercase tracking-wider font-semibold border-b border-[#EADFD5]">
                <tr>
                  <th className="py-3 px-4">Klientka</th>
                  <th className="py-3 px-4">Kontakt</th>
                  <th className="py-3 px-4">Data Rejestracji</th>
                  <th className="py-3 px-4">Zamówienia</th>
                  <th className="py-3 px-4">Łączna Wartość</th>
                  <th className="py-3 px-4">Ostatnie Zakupy</th>
                  <th className="py-3 px-4 text-right">Profil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADFD5]">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#241D1B]">{c.fullName || "—"}</div>
                      <div className="text-[11px] text-[#8C7248] flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Konto aktywne</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#3E3835]">
                      <div className="font-mono">{c.email}</div>
                      {c.phone && c.phone !== "—" && (
                        <div className="text-[11px] text-[#7A6458] mt-0.5">{c.phone}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[#6E6259]">
                      {new Date(c.createdAt).toLocaleDateString("pl-PL")}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#241D1B]">{c.ordersCount}</span>
                      <span className="text-[11px] text-[#7A6458] ml-1">
                        ({c.paidOrdersCount} opłaconych)
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-[#241D1B]">
                      {c.totalPaidAmount.toFixed(2)} PLN
                    </td>

                    <td className="py-3.5 px-4 text-[#6E6259]">
                      {c.lastOrderDate
                        ? new Date(c.lastOrderDate).toLocaleDateString("pl-PL")
                        : "Brak"}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenProfile(c)}
                        className="px-3 py-1.5 bg-[#FAF6F1] border border-[#C5A069] text-[#7A5B20] hover:bg-[#C5A069] hover:text-white rounded text-xs font-semibold transition-all inline-flex items-center gap-1"
                      >
                        <span>Szczegóły</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL / DRAWER PROFILU KLIENTKI */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#EADFD5]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C5A069]" />
                <h3 className="font-serif text-lg font-bold text-[#241D1B]">
                  Profil Klientki: {selectedCustomer.fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-1 text-gray-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Podstawowe dane i kody */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[#FAF6F1] rounded border border-[#EADFD5] space-y-1">
                <p className="text-[10px] uppercase font-semibold tracking-wider text-[#8C7248]">
                  Adres E-mail
                </p>
                <p className="font-mono text-[#241D1B] font-semibold">{selectedCustomer.email}</p>
                <p className="text-[11px] text-[#7A6458]">Telefon: {selectedCustomer.phone}</p>
              </div>

              <div className="p-3 bg-[#FAF6F1] rounded border border-[#EADFD5] space-y-1">
                <p className="text-[10px] uppercase font-semibold tracking-wider text-[#8C7248]">
                  Kod Polecający (Poleć Przyjaciółce)
                </p>
                <p className="font-mono text-[#241D1B] font-bold tracking-wider">
                  {selectedCustomer.referralCode || "—"}
                </p>
                <p className="text-[11px] text-[#7A6458]">
                  Zarejestrowana: {new Date(selectedCustomer.createdAt).toLocaleDateString("pl-PL")}
                </p>
              </div>
            </div>

            {/* Rabaty klientki */}
            <div className="p-4 bg-amber-50/60 rounded border border-amber-200 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-950 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-[#C5A069]" />
                  <span>Rabat powitalny na pierwsze zamówienie (−15%)</span>
                </span>
                <span className="font-mono font-bold text-[#7A5B20]">
                  {selectedCustomer.welcomeDiscountCode}
                </span>
              </div>
              <p className="text-[11px] text-amber-900">
                Status:{" "}
                {selectedCustomer.welcomeDiscountUsedAt
                  ? `Wykorzystany w dniu ${new Date(selectedCustomer.welcomeDiscountUsedAt).toLocaleDateString("pl-PL")}`
                  : "Aktywny (do wykorzystania w pierwszym zamówieniu)"}
              </p>

              {/* Formularz indywidualnego rabatu stałej klientki */}
              <form onSubmit={handleSaveDiscount} className="pt-3 border-t border-amber-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-amber-950">
                    Indywidualny stały rabat klientki (%):
                  </label>
                  {selectedCustomer.individualDiscountPercent && (
                    <span className="text-[11px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                      Aktualnie: −{selectedCustomer.individualDiscountPercent}%
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Wpisz np. 10 (0 = brak)"
                    value={discountPercentInput}
                    onChange={(e) => setDiscountPercentInput(e.target.value)}
                    className="w-32 bg-white border border-[#EADFD5] px-3 py-1.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded font-medium"
                  />
                  <input
                    type="text"
                    placeholder="Notatka / powód rabatu..."
                    value={discountNoteInput}
                    onChange={(e) => setDiscountNoteInput(e.target.value)}
                    className="flex-1 bg-white border border-[#EADFD5] px-3 py-1.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded"
                  />
                  <button
                    type="submit"
                    disabled={isSavingDiscount}
                    className="px-3.5 py-1.5 bg-[#C5A069] text-white rounded text-xs font-semibold hover:bg-[#AF884F] transition-colors shrink-0 disabled:opacity-50"
                  >
                    {isSavingDiscount ? "Zapisywanie..." : "Zapisz rabat"}
                  </button>
                </div>

                {discountFeedback && (
                  <p className="text-[11px] text-emerald-800 font-semibold">{discountFeedback}</p>
                )}
              </form>
            </div>

            {/* Zgody marketingowe */}
            <div className="p-3 bg-[#FAF6F1] rounded border border-[#EADFD5] text-xs space-y-1">
              <p className="font-semibold text-[#241D1B]">Zgody marketingowe (RODO):</p>
              <div className="flex items-center gap-2 text-[11px] text-[#6E6259]">
                {selectedCustomer.marketingConsent ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Zgoda na komunikację marketingową i kody rabatowe udzielona</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-gray-400" />
                    <span>Brak zapisu do newslettera / komunikacji marketingowej</span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-[#8C7248]">
                Data rejestracji zgody:{" "}
                {new Date(selectedCustomer.marketingConsentDate).toLocaleString("pl-PL")}
              </p>
            </div>

            {/* Historia zamówień klientki */}
            <div className="space-y-2 text-xs">
              <h4 className="font-serif font-bold text-sm text-[#241D1B] flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-[#C5A069]" />
                <span>Zamówienia klientki ({selectedCustomer.orders.length})</span>
              </h4>

              {selectedCustomer.orders.length === 0 ? (
                <p className="text-[#7A6458] text-[11px] italic">Brak złożonych zamówień.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedCustomer.orders.map((o) => (
                    <div
                      key={o.id}
                      className="p-2.5 bg-[#FAF6F1] border border-[#EADFD5] rounded flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono font-bold text-[#241D1B]">{o.orderNumber}</span>
                        <span className="text-[#7A6458] ml-2 text-[11px]">
                          {new Date(o.createdAt).toLocaleDateString("pl-PL")} • {o.itemsCount} poz.
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                            o.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {o.paymentStatus === "PAID" ? "OPŁACONE" : "OCZEKUJE"}
                        </span>
                        <span className="font-bold text-[#241D1B]">
                          {o.totalAmount.toFixed(2)} PLN
                        </span>
                        <Link
                          href={`/admin/zamowienia/${o.id}`}
                          className="text-[#C5A069] hover:underline text-[11px]"
                        >
                          Szczegóły →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historia zwrotów klientki */}
            <div className="space-y-2 text-xs">
              <h4 className="font-serif font-bold text-sm text-[#241D1B] flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-[#C5A069]" />
                <span>Zwroty produktów ({selectedCustomer.returns.length})</span>
              </h4>

              {selectedCustomer.returns.length === 0 ? (
                <p className="text-[#7A6458] text-[11px] italic">Brak zgłoszonych zwrotów.</p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedCustomer.returns.map((r) => (
                    <div
                      key={r.id}
                      className="p-2.5 bg-[#FAF6F1] border border-[#EADFD5] rounded flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono font-bold text-[#241D1B]">{r.id}</span>
                        <span className="text-[#7A6458] ml-2 text-[11px]">
                          do zam. {r.orderNumber} ({r.itemsCount} szt.)
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[10px]">
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
