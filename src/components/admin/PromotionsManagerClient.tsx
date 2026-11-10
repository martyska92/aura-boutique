"use client";

import React, { useState, useEffect } from "react";
import {
  Tag,
  Sparkles,
  Gift,
  Users,
  MessageSquare,
  History,
  Plus,
  Copy,
  Check,
  Edit,
  Trash2,
  Power,
  Calendar,
  AlertCircle,
  Eye,
  EyeOff,
  Percent,
  Truck,
  Mail,
  ShieldCheck,
  ExternalLink,
  Search,
  Filter,
  Save,
  X,
  Clock,
  Ban,
  CheckCircle2,
} from "lucide-react";
import {
  Promotion,
  PromotionType,
  IndividualCustomerDiscount,
  ReferralParticipant,
  ReferralRewardCode,
  ProductReview,
  PromotionAuditLog,
  StoreSettings,
  Category,
  Product,
} from "@/lib/types";

export function PromotionsManagerClient() {
  const [activeTab, setActiveTab] = useState<
    "promotions" | "weekend" | "gift" | "individual" | "referrals" | "reviews" | "audit"
  >("promotions");

  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [individualDiscounts, setIndividualDiscounts] = useState<IndividualCustomerDiscount[]>([]);
  const [referrals, setReferrals] = useState<ReferralParticipant[]>([]);
  const [rewardCodes, setRewardCodes] = useState<ReferralRewardCode[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [auditLogs, setAuditLogs] = useState<PromotionAuditLog[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal tworzenia / edycji promocji
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Partial<Promotion>>({
    name: "",
    publicTitle: "",
    description: "",
    type: "PERCENTAGE",
    discountValue: 15,
    isAutomatic: true,
    targetScope: "ALL",
    categoryIds: [],
    productIds: [],
    excludeDiscounted: true,
    minOrderValue: 0,
    noEndDate: true,
    isRecurringWeekend: false,
    targetAudience: "ALL",
    totalUsageLimit: 0,
    usageLimitPerEmail: 1,
    canCombineWithOtherPromotions: false,
    bannerEnabled: true,
    bannerText: "",
    isActive: true,
  });

  // Formularz indywidualnego rabatu
  const [newIndivEmail, setNewIndivEmail] = useState("");
  const [newIndivPercent, setNewIndivPercent] = useState(10);
  const [newIndivNote, setNewIndivNote] = useState("");
  const [newIndivIndefinite, setNewIndivIndefinite] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promotions");
      if (res.ok) {
        const data = await res.json();
        setPromotions(data.promotions || []);
        setIndividualDiscounts(data.individualDiscounts || []);
        setReferrals(data.referralParticipants || []);
        setRewardCodes(data.referralRewardCodes || []);
        setReviews(data.productReviews || []);
        setAuditLogs(data.auditLogs || []);
        setSettings(data.settings || null);
        setCategories(data.categories || []);
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Toggle promocji
  const handleTogglePromo = async (id: string, current: boolean) => {
    try {
      const res = await fetch("/api/admin/promotions/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !current }),
      });
      if (res.ok) {
        showNotification(`Zmieniono status promocji na: ${!current ? "Włączona" : "Wyłączona"}`);
        fetchData();
      }
    } catch (e) {
      alert("Błąd połączenia.");
    }
  };

  // Duplikowanie promocji
  const handleDuplicatePromo = async (id: string) => {
    try {
      const res = await fetch("/api/admin/promotions/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        showNotification("Promocja została zduplikowana jako kopia robocza.");
        fetchData();
      }
    } catch (e) {
      alert("Błąd podczas duplikowania.");
    }
  };

  // Usuwanie promocji
  const handleDeletePromo = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tę promocję?")) return;
    try {
      const res = await fetch(`/api/admin/promotions?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showNotification("Promocja została usunięta.");
        fetchData();
      }
    } catch (e) {
      alert("Błąd usuwania.");
    }
  };

  // Zapis promocji (z modala)
  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPromo),
      });
      if (res.ok) {
        setIsModalOpen(false);
        showNotification("Promocja została pomyślnie zapisana!");
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Błąd zapisu promocji.");
      }
    } catch (e: any) {
      alert("Błąd połączenia: " + e.message);
    }
  };

  // Dodawanie indywidualnego rabatu
  const handleAddIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIndivEmail.trim()) return;

    try {
      const res = await fetch("/api/admin/promotions/individual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newIndivEmail.trim(),
          discountPercent: Number(newIndivPercent),
          scope: "ALL",
          isIndefinite: newIndivIndefinite,
          adminNote: newIndivNote,
        }),
      });

      if (res.ok) {
        setNewIndivEmail("");
        setNewIndivNote("");
        showNotification("Przyznano indywidualny rabat klientce!");
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Błąd przyznawania rabatu.");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Usuwanie indywidualnego rabatu
  const handleDeleteIndividual = async (id: string) => {
    if (!confirm("Czy na pewno chcesz cofnąć ten rabat indywidualny?")) return;
    try {
      const res = await fetch(`/api/admin/promotions/individual?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showNotification("Cofnięto rabat indywidualny.");
        fetchData();
      }
    } catch (e) {
      alert("Błąd usuwania rabatu.");
    }
  };

  // Unieważnienie kodu nagrody z poleceń
  const handleRevokeRewardCode = async (codeId: string) => {
    const reason = prompt("Podaj powód unieważnienia kodu nagrody (np. zwrot zamówienia przez koleżankę):");
    if (!reason) return;

    try {
      const res = await fetch("/api/admin/promotions/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeId, reason }),
      });
      if (res.ok) {
        showNotification("Kod nagrody został unieważniony.");
        fetchData();
      }
    } catch (e) {
      alert("Błąd unieważniania kodu.");
    }
  };

  // Moderacja opinii (ukryj/przywróć)
  const handleToggleReview = async (reviewId: string, currentHidden: boolean) => {
    const reason = !currentHidden ? prompt("Podaj powód ukrycia opinii (np. spam, wulgaryzmy):") : undefined;
    if (!currentHidden && reason === null) return;

    try {
      const res = await fetch("/api/admin/promotions/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, isHidden: !currentHidden, hiddenReason: reason }),
      });
      if (res.ok) {
        showNotification(`Opinia została ${!currentHidden ? "ukryta" : "przywrócona"}.`);
        fetchData();
      }
    } catch (e) {
      alert("Błąd aktualizacji opinii.");
    }
  };

  // Szybkie znalezienie promocji weekendowej
  const weekendPromo = promotions.find((p) => p.type === "CATEGORY_WEEKEND");
  // Szybkie znalezienie prezentu (skarpetki)
  const socksPromo = promotions.find((p) => p.type === "FREE_GIFT");

  return (
    <div className="space-y-6">
      {/* Nagłówek sekcji */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#BCAB9B]">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-6 h-6 text-[#9E8359]" />
            <h1 className="font-serif text-2xl sm:text-3xl text-[#241D1B] font-bold">
              Promocje & Kody Rabatowe
            </h1>
          </div>
          <p className="text-xs text-[#7A6458] mt-1">
            Zarządzaj rabatami, weekendem –15%, darmową dostawą, programem poleceń oraz prezentami do koszyka.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingPromo({
              name: "Nowa Promocja",
              publicTitle: "Specjalny Rabat w AURA Boutique",
              description: "",
              type: "PERCENTAGE",
              discountValue: 15,
              isAutomatic: false,
              code: "AURA15",
              targetScope: "ALL",
              categoryIds: [],
              productIds: [],
              excludeDiscounted: true,
              minOrderValue: 0,
              noEndDate: true,
              isRecurringWeekend: false,
              targetAudience: "ALL",
              totalUsageLimit: 0,
              usageLimitPerEmail: 1,
              canCombineWithOtherPromotions: false,
              bannerEnabled: true,
              bannerText: "Użyj kodu AURA15 i odbierz 15% rabatu na zamówienie!",
              isActive: true,
            });
            setIsModalOpen(true);
          }}
          className="px-5 py-2.5 bg-[#9E8359] hover:bg-[#8B7147] text-white text-xs uppercase tracking-wider font-semibold rounded-full shadow transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Utwórz Promocję</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Zakładki (Tabs) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#EADFD5] text-xs uppercase tracking-wider font-semibold">
        <button
          onClick={() => setActiveTab("promotions")}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "promotions"
              ? "bg-[#241D1B] text-white"
              : "bg-white text-[#5A483D] hover:bg-[#F3ECE2] border border-[#BCAB9B]"
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Wszystkie Promocje ({promotions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("weekend")}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "weekend"
              ? "bg-[#241D1B] text-white"
              : "bg-white text-[#5A483D] hover:bg-[#F3ECE2] border border-[#BCAB9B]"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#C5A069]" />
          <span>Weekendowa –15%</span>
        </button>

        <button
          onClick={() => setActiveTab("gift")}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "gift"
              ? "bg-[#241D1B] text-white"
              : "bg-white text-[#5A483D] hover:bg-[#F3ECE2] border border-[#BCAB9B]"
          }`}
        >
          <Gift className="w-3.5 h-3.5 text-[#C5A069]" />
          <span>Prezent (Skarpetki)</span>
        </button>

        <button
          onClick={() => setActiveTab("individual")}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "individual"
              ? "bg-[#241D1B] text-white"
              : "bg-white text-[#5A483D] hover:bg-[#F3ECE2] border border-[#BCAB9B]"
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Indywidualne ({individualDiscounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("referrals")}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "referrals"
              ? "bg-[#241D1B] text-white"
              : "bg-white text-[#5A483D] hover:bg-[#F3ECE2] border border-[#BCAB9B]"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Program Poleceń ({referrals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("reviews")}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "reviews"
              ? "bg-[#241D1B] text-white"
              : "bg-white text-[#5A483D] hover:bg-[#F3ECE2] border border-[#BCAB9B]"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Opinie & Kody ({reviews.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "audit"
              ? "bg-[#241D1B] text-white"
              : "bg-white text-[#5A483D] hover:bg-[#F3ECE2] border border-[#BCAB9B]"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Dziennik Zmian ({auditLogs.length})</span>
        </button>
      </div>

      {/* ========================================================
          ZAKŁADKA 1: WSZYSTKIE PROMOCJE (TABELA CRUD)
         ======================================================== */}
      {activeTab === "promotions" && (
        <div className="bg-white rounded-lg border border-[#BCAB9B] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#EADFD5] flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-serif text-base text-[#241D1B] font-semibold">
              Lista Skonfigurowanych Promocji
            </h2>
            <span className="text-xs text-[#7A6458]">
              Zmiany w promocjach nie modyfikują cen już złożonych zamówień.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF6F1] border-b border-[#EADFD5] text-[#63534B] uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Nazwa & Treść dla klientek</th>
                  <th className="py-3 px-4">Rodzaj & Wartość</th>
                  <th className="py-3 px-4">Typ naliczania</th>
                  <th className="py-3 px-4">Zakres & Warunki</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADFD5]">
                {promotions.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF6F1]/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#241D1B]">{p.name}</div>
                      <div className="text-[11px] text-[#7A6458] italic">{p.publicTitle}</div>
                      {p.bannerEnabled && (
                        <span className="inline-block mt-1 text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded">
                          Baner włączony
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-[#241D1B]">
                      {p.type === "PERCENTAGE" && <span className="text-red-700 font-bold">-{p.discountValue}%</span>}
                      {p.type === "FIXED_AMOUNT" && <span className="text-red-700 font-bold">-{p.discountValue} PLN</span>}
                      {p.type === "FREE_SHIPPING" && <span className="text-blue-700 font-bold">Darmowa dostawa od {p.minOrderValue} zł</span>}
                      {p.type === "FREE_GIFT" && <span className="text-purple-700 font-bold">Prezent: Skarpetki (&gt;{p.minOrderValue} zł)</span>}
                      {p.type === "FIRST_ORDER" && <span className="text-emerald-700 font-bold">Pierwsze zamówienie: -{p.discountValue}%</span>}
                      {p.type === "CATEGORY_WEEKEND" && <span className="text-[#9E8359] font-bold">Weekend: -{p.discountValue}%</span>}
                      {p.type === "COUPON_CODE" && <span className="text-red-700 font-bold">Kod: -{p.discountValue}%</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      {p.isAutomatic ? (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-[10px] font-bold">
                          Automatycznie
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-orange-50 text-orange-900 border border-orange-200 rounded font-mono text-[10px] font-bold">
                          Kod: {p.code}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[#5A483D] text-[11px]">
                      <div>Zakres: {p.targetScope === "ALL" ? "Cały asortyment" : p.targetScope === "CATEGORIES" ? "Wybrane kategorie" : "Wybrane ubrania"}</div>
                      {p.excludeDiscounted && <div className="text-[#8C4334]">Wykluczone przecenione</div>}
                      {p.minOrderValue ? <div>Min. koszyk: {p.minOrderValue} zł</div> : null}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {p.isActive ? "Aktywna" : "Wyłączona"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleTogglePromo(p.id, p.isActive)}
                          className={`p-1.5 rounded transition-colors ${
                            p.isActive
                              ? "text-emerald-700 hover:bg-emerald-50"
                              : "text-gray-400 hover:bg-gray-100"
                          }`}
                          title={p.isActive ? "Wyłącz promocję" : "Włącz promocję"}
                        >
                          <Power className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDuplicatePromo(p.id)}
                          className="p-1.5 text-[#5A483D] hover:bg-[#F3ECE2] rounded transition-colors"
                          title="Duplikuj promocję"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setEditingPromo(p);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          title="Edytuj promocję"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeletePromo(p.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Usuń promocję"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          ZAKŁADKA 2: WEEKENDOWA PROMOCJA –15%
         ======================================================== */}
      {activeTab === "weekend" && (
        <div className="bg-white p-6 sm:p-8 rounded-lg border border-[#BCAB9B] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#EADFD5] pb-4">
            <div>
              <h2 className="font-serif text-xl text-[#241D1B] font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C5A069]" />
                <span>Weekendowa Promocja na Wybraną Kategorię</span>
              </h2>
              <p className="text-xs text-[#7A6458] mt-1">
                Domyślnie obowiązuje w każdy weekend: od soboty 00:00 do niedzieli 23:59 według czasu Europe/Warsaw.
              </p>
            </div>
            {weekendPromo && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  weekendPromo.isActive
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {weekendPromo.isActive ? "WŁĄCZONA" : "WYŁĄCZONA"}
              </span>
            )}
          </div>

          {weekendPromo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-[#FAF6F1] p-5 rounded-lg border border-[#EADFD5]">
                <h3 className="font-serif text-sm font-semibold text-[#241D1B] uppercase tracking-wider">
                  Szybkie Ustawienia Weekendu
                </h3>

                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Objęta kategoria:
                  </label>
                  <select
                    value={weekendPromo.categoryIds?.[0] || ""}
                    onChange={async (e) => {
                      const catId = e.target.value;
                      const catName = categories.find((c) => c.id === catId)?.name || "Kategorię";
                      const updated = {
                        ...weekendPromo,
                        categoryIds: [catId],
                        publicTitle: `Weekend zniżek –15% na kategorię: ${catName}`,
                        bannerText: `Weekendowa promocja! –15% na całą kategorię: ${catName}!`,
                      };
                      await fetch("/api/admin/promotions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(updated),
                      });
                      fetchData();
                      showNotification("Zaktualizowano kategorię promocji weekendowej!");
                    }}
                    className="w-full bg-white border border-[#BCAB9B] p-2.5 text-xs text-[#241D1B] rounded focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Wysokość rabatu (%):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={weekendPromo.discountValue}
                    onChange={async (e) => {
                      const val = Number(e.target.value);
                      const updated = { ...weekendPromo, discountValue: val };
                      await fetch("/api/admin/promotions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(updated),
                      });
                      fetchData();
                    }}
                    className="w-full bg-white border border-[#BCAB9B] p-2.5 text-xs text-[#241D1B] rounded focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleTogglePromo(weekendPromo.id, weekendPromo.isActive)}
                    className={`w-full py-2.5 rounded font-semibold text-xs uppercase tracking-wider transition-colors ${
                      weekendPromo.isActive
                        ? "bg-red-700 hover:bg-red-800 text-white"
                        : "bg-emerald-700 hover:bg-emerald-800 text-white"
                    }`}
                  >
                    {weekendPromo.isActive ? "Wyłącz promocję weekendową" : "Włącz promocję weekendową"}
                  </button>
                </div>
              </div>

              {/* Podgląd banera */}
              <div className="space-y-4 bg-[#FAF6F1] p-5 rounded-lg border border-[#EADFD5]">
                <h3 className="font-serif text-sm font-semibold text-[#241D1B] uppercase tracking-wider">
                  Podgląd Banera dla Klientek
                </h3>
                <div className="p-4 bg-[#6E2222] text-white rounded text-center space-y-2">
                  <div className="text-[10px] uppercase tracking-widest text-[#FFE5E0] font-bold">
                    Baner Główny Sklepu
                  </div>
                  <div className="font-serif text-sm sm:text-base font-bold">
                    {weekendPromo.bannerText || "Weekendowa promocja –15%!"}
                  </div>
                  <div className="inline-block px-3 py-1 bg-white text-[#6E2222] text-[10px] font-bold uppercase rounded-full">
                    Przejdź do produktów →
                  </div>
                </div>
                <p className="text-[11px] text-[#7A6458] leading-relaxed">
                  Baner wyświetla się w nagłówku sklepu wyłącznie w trakcie aktywnego trwania weekendu (lub po ręcznym włączeniu).
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#7A6458]">Brak zdefiniowanej promocji weekendowej.</p>
          )}
        </div>
      )}

      {/* ========================================================
          ZAKŁADKA 3: PREZENT NA START (SKARPETKI)
         ======================================================== */}
      {activeTab === "gift" && (
        <div className="bg-white p-6 sm:p-8 rounded-lg border border-[#BCAB9B] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#EADFD5] pb-4">
            <div>
              <h2 className="font-serif text-xl text-[#241D1B] font-semibold flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#C5A069]" />
                <span>Prezent do Zamówienia: Skarpetki</span>
              </h2>
              <p className="text-xs text-[#7A6458] mt-1">
                Automatycznie dodawany do koszyka za 0 zł powyżej progu 100 zł (100,01 zł i więcej).
              </p>
            </div>
            {socksPromo && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  socksPromo.isActive
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {socksPromo.isActive ? "AKTYWNY" : "WYŁĄCZONY"}
              </span>
            )}
          </div>

          {socksPromo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-[#FAF6F1] p-5 rounded-lg border border-[#EADFD5]">
                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Próg wartości koszyka (PLN):
                  </label>
                  <input
                    type="number"
                    value={socksPromo.minOrderValue || 100}
                    onChange={async (e) => {
                      const val = Number(e.target.value);
                      const updated = { ...socksPromo, minOrderValue: val };
                      await fetch("/api/admin/promotions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(updated),
                      });
                      fetchData();
                    }}
                    className="w-full bg-white border border-[#BCAB9B] p-2.5 text-xs text-[#241D1B] rounded focus:outline-none"
                  />
                  <span className="text-[11px] text-[#7A6458] block mt-1">
                    Ściśle powyżej kwoty (np. dla 100 zł: przy 100,00 zł brak, od 100,01 zł przysługuje).
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Stan magazynowy skarpetek (sztuk):
                  </label>
                  <input
                    type="number"
                    value={socksPromo.giftStockQuantity || 50}
                    onChange={async (e) => {
                      const val = Number(e.target.value);
                      const updated = { ...socksPromo, giftStockQuantity: val };
                      await fetch("/api/admin/promotions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(updated),
                      });
                      fetchData();
                    }}
                    className="w-full bg-white border border-[#BCAB9B] p-2.5 text-xs text-[#241D1B] rounded focus:outline-none"
                  />
                  <span className="text-[11px] text-[#7A6458] block mt-1">
                    Automatycznie odliczany przy złożeniu zamówienia. Gdy stan osiągnie 0, prezent przestaje być dodawany.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Dostępne kolory w puli (rozdzielone przecinkami):
                  </label>
                  <input
                    type="text"
                    value={socksPromo.giftAvailableColors?.join(", ") || ""}
                    onChange={async (e) => {
                      const colors = e.target.value.split(",").map((c) => c.trim()).filter(Boolean);
                      const updated = { ...socksPromo, giftAvailableColors: colors };
                      await fetch("/api/admin/promotions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(updated),
                      });
                      fetchData();
                    }}
                    className="w-full bg-white border border-[#BCAB9B] p-2.5 text-xs text-[#241D1B] rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4 bg-[#FAF6F1] p-5 rounded-lg border border-[#EADFD5]">
                <h3 className="font-serif text-sm font-semibold text-[#241D1B] uppercase tracking-wider">
                  Podgląd Prezentu w Koszyku
                </h3>
                <div className="p-4 bg-white border border-[#EADFD5] rounded-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#241D1B]">
                      🎁 Prezent na start — Skarpetki AURA
                    </span>
                    <span className="text-emerald-700 font-bold text-xs">0,00 zł</span>
                  </div>
                  <p className="text-[11px] text-[#7A6458]">
                    Kolor losowy z puli: {socksPromo.giftAvailableColors?.join(", ")}
                  </p>
                </div>
                <button
                  onClick={() => handleTogglePromo(socksPromo.id, socksPromo.isActive)}
                  className={`w-full py-2.5 rounded font-semibold text-xs uppercase tracking-wider transition-colors ${
                    socksPromo.isActive
                      ? "bg-red-700 hover:bg-red-800 text-white"
                      : "bg-emerald-700 hover:bg-emerald-800 text-white"
                  }`}
                >
                  {socksPromo.isActive ? "Wyłącz gratis skarpetek" : "Włącz gratis skarpetek"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          ZAKŁADKA 4: INDYWIDUALNE RABATY PO E-MAILU
         ======================================================== */}
      {activeTab === "individual" && (
        <div className="space-y-6">
          {/* Formularz przyznania rabatu */}
          <div className="bg-white p-6 sm:p-8 rounded-lg border border-[#BCAB9B] shadow-sm space-y-4">
            <h2 className="font-serif text-lg text-[#241D1B] font-semibold flex items-center gap-2 pb-2 border-b border-[#EADFD5]">
              <Mail className="w-5 h-5 text-[#C5A069]" />
              <span>Przyznaj Stały Rabat Klientce (po adresie e-mail)</span>
            </h2>

            <form onSubmit={handleAddIndividual} className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-4">
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Adres e-mail klientki *
                </label>
                <input
                  type="email"
                  required
                  placeholder="klientka@gmail.com"
                  value={newIndivEmail}
                  onChange={(e) => setNewIndivEmail(e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#BCAB9B] p-2.5 text-xs text-[#241D1B] rounded focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Wysokość rabatu (%) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  required
                  value={newIndivPercent}
                  onChange={(e) => setNewIndivPercent(Number(e.target.value))}
                  className="w-full bg-[#FAF6F1] border border-[#BCAB9B] p-2.5 text-xs text-[#241D1B] rounded focus:outline-none"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Wewnętrzna notatka administratora
                </label>
                <input
                  type="text"
                  placeholder="np. Stała klientka z butiku w Żmigrodzie"
                  value={newIndivNote}
                  onChange={(e) => setNewIndivNote(e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#BCAB9B] p-2.5 text-xs text-[#241D1B] rounded focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#9E8359] hover:bg-[#8B7147] text-white text-xs uppercase tracking-wider font-semibold rounded shadow transition-colors"
                >
                  Przyznaj Rabat
                </button>
              </div>
            </form>
          </div>

          {/* Lista przyznanych rabatów */}
          <div className="bg-white rounded-lg border border-[#BCAB9B] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#EADFD5] font-serif font-semibold text-sm text-[#241D1B]">
              Lista Klientek ze Stałym Rabatem
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF6F1] border-b border-[#EADFD5] text-[#63534B] uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">E-mail klientki</th>
                  <th className="py-3 px-4">Wysokość</th>
                  <th className="py-3 px-4">Ważność</th>
                  <th className="py-3 px-4">Notatka wewnętrzna</th>
                  <th className="py-3 px-4 text-right">Akcja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADFD5]">
                {individualDiscounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#7A6458]">
                      Brak przyznanych rabatów indywidualnych.
                    </td>
                  </tr>
                ) : (
                  individualDiscounts.map((indiv) => (
                    <tr key={indiv.id} className="hover:bg-[#FAF6F1]/50">
                      <td className="py-3 px-4 font-mono font-medium text-[#241D1B]">
                        {indiv.email}
                      </td>
                      <td className="py-3 px-4 font-bold text-red-700">
                        -{indiv.discountPercent}%
                      </td>
                      <td className="py-3 px-4 text-[#5A483D]">
                        {indiv.isIndefinite ? "Bezterminowo" : "Określony termin"}
                      </td>
                      <td className="py-3 px-4 text-[#7A6458] italic">
                        {indiv.adminNote || "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteIndividual(indiv.id)}
                          className="text-red-600 hover:text-red-800 p-1 font-medium"
                          title="Cofnij rabat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          ZAKŁADKA 5: PROGRAM POLECEŃ & KODY NAGRÓD
         ======================================================== */}
      {activeTab === "referrals" && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-lg border border-[#BCAB9B] shadow-sm space-y-4">
            <h2 className="font-serif text-lg text-[#241D1B] font-semibold flex items-center gap-2 pb-2 border-b border-[#EADFD5]">
              <Users className="w-5 h-5 text-[#C5A069]" />
              <span>Program Poleceń — Uczestniczki i Wygenerowane Kody Nagród</span>
            </h2>
            <p className="text-xs text-[#7A6458] leading-relaxed">
              Koleżanka otrzymuje 15% zniżki na pierwsze zamówienie. Gdy jej zamówienie osiągnie status <strong>Zrealizowane (DELIVERED)</strong>, dla polecającej automatycznie generowany jest jednorazowy kod 15% ważny dokładnie 30 dni.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-[#BCAB9B] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#EADFD5] font-serif font-semibold text-sm text-[#241D1B]">
              Wygenerowane Kody Nagród z Poleceń (15% na 30 dni)
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF6F1] border-b border-[#EADFD5] text-[#63534B] uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Kod Nagrody</th>
                  <th className="py-3 px-4">Polecająca (otrzymuje)</th>
                  <th className="py-3 px-4">Zaproszona klientka</th>
                  <th className="py-3 px-4">Ważny do</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Akcja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADFD5]">
                {rewardCodes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-[#7A6458]">
                      Brak wygenerowanych kodów nagród.
                    </td>
                  </tr>
                ) : (
                  rewardCodes.map((rc) => (
                    <tr key={rc.id} className="hover:bg-[#FAF6F1]/50">
                      <td className="py-3 px-4 font-mono font-bold text-[#241D1B]">
                        {rc.code}
                      </td>
                      <td className="py-3 px-4 text-[#241D1B]">{rc.referrerEmail}</td>
                      <td className="py-3 px-4 text-[#7A6458]">{rc.referredEmail}</td>
                      <td className="py-3 px-4 text-[#5A483D]">
                        {new Date(rc.validUntil).toLocaleDateString("pl-PL")}
                      </td>
                      <td className="py-3 px-4">
                        {rc.isRevoked ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-[10px] font-bold">
                            Unieważniony ({rc.revokedReason})
                          </span>
                        ) : rc.isUsed ? (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-bold">
                            Zużyty
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                            Aktywny (15%)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!rc.isRevoked && !rc.isUsed && (
                          <button
                            onClick={() => handleRevokeRewardCode(rc.id)}
                            className="text-xs text-red-700 hover:underline font-semibold"
                          >
                            Unieważnij
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          ZAKŁADKA 6: OPINIE & KODY ZA RECENZJE (2% / 5%)
         ======================================================== */}
      {activeTab === "reviews" && (
        <div className="bg-white rounded-lg border border-[#BCAB9B] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#EADFD5] flex items-center justify-between">
            <div>
              <h2 className="font-serif text-base text-[#241D1B] font-semibold">
                Opinie Klientek i Kody Nagród
              </h2>
              <p className="text-xs text-[#7A6458]">
                2% za opinię z tekstem • 5% za opinię ze zdjęciem. Możesz ukryć spam lub dane wrażliwe (bez usuwania niskich ocen).
              </p>
            </div>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF6F1] border-b border-[#EADFD5] text-[#63534B] uppercase tracking-wider font-semibold text-[10px]">
                <th className="py-3 px-4">Ocena & Klientka</th>
                <th className="py-3 px-4">Treść opinii</th>
                <th className="py-3 px-4">Zdjęcie</th>
                <th className="py-3 px-4">Przyznany kod rabatowy</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderacja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EADFD5]">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#7A6458]">
                    Brak opinii o produktach w sklepie.
                  </td>
                </tr>
              ) : (
                reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-[#FAF6F1]/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center text-amber-500 font-bold">
                        {"★".repeat(rev.rating)}
                        {"☆".repeat(5 - rev.rating)}
                      </div>
                      <div className="text-[#241D1B] font-semibold">{rev.displayName}</div>
                      <div className="text-[10px] text-[#7A6458]">{rev.orderNumber}</div>
                    </td>

                    <td className="py-3 px-4 max-w-xs text-[#3E3430]">
                      <p className="line-clamp-3">{rev.content}</p>
                    </td>

                    <td className="py-3 px-4">
                      {rev.photoUrl ? (
                        <a href={rev.photoUrl} target="_blank" rel="noreferrer" className="block w-12 h-12 rounded overflow-hidden border border-[#BCAB9B]">
                          <img src={rev.photoUrl} alt="Zdjęcie opinii" className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-[#7A6458] italic">Brak zdjęcia</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {rev.rewardCodeIssued ? (
                        <div>
                          <span className="font-mono font-bold text-[#241D1B] bg-[#FAF6F1] px-1.5 py-0.5 rounded border border-[#EADFD5]">
                            {rev.rewardCodeIssued}
                          </span>
                          <span className="ml-1 text-[11px] font-bold text-red-700">
                            (-{rev.rewardPercentIssued}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#7A6458]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {rev.isHidden ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-[10px] font-bold">
                          Ukryta ({rev.hiddenReason || "Spam"})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                          Widoczna w sklepie
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleReview(rev.id, rev.isHidden)}
                        className={`p-1.5 rounded transition-colors ${
                          rev.isHidden
                            ? "text-emerald-700 hover:bg-emerald-50"
                            : "text-amber-700 hover:bg-amber-50"
                        }`}
                        title={rev.isHidden ? "Przywróć opinię" : "Ukryj opinię"}
                      >
                        {rev.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================
          ZAKŁADKA 7: DZIENNIK ZMIAN PROMOCJI (AUDIT LOG)
         ======================================================== */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-lg border border-[#BCAB9B] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#EADFD5] font-serif font-semibold text-sm text-[#241D1B]">
            Historia Modyfikacji Promocji (Europe/Warsaw)
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF6F1] border-b border-[#EADFD5] text-[#63534B] uppercase tracking-wider font-semibold text-[10px]">
                <th className="py-3 px-4">Data i godzina</th>
                <th className="py-3 px-4">Użytkownik</th>
                <th className="py-3 px-4">Działanie</th>
                <th className="py-3 px-4">Szczegóły</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EADFD5]">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[#7A6458]">
                    Brak wpisów w dzienniku audytu.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAF6F1]/50">
                    <td className="py-3 px-4 font-mono text-[11px] text-[#5A483D]">
                      {new Date(log.timestamp).toLocaleString("pl-PL")}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#241D1B]">
                      {log.adminUser}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#9E8359]">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-[#5A483D] max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================
          MODAL TWORZENIA / EDYCJI PROMOCJI
         ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-[#BCAB9B] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#EADFD5] flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-serif text-lg text-[#241D1B] font-bold">
                {editingPromo.id ? "Edytuj Promocję" : "Utwórz Nową Promocję"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-black rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Nazwa wewnętrzna (dla właścicielki) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPromo.name || ""}
                    onChange={(e) => setEditingPromo({ ...editingPromo, name: e.target.value })}
                    className="w-full bg-[#FAF6F1] border border-[#BCAB9B] p-2.5 text-xs text-[#241D1B] rounded focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Treść widoczna dla klientek *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPromo.publicTitle || ""}
                    onChange={(e) => setEditingPromo({ ...editingPromo, publicTitle: e.target.value })}
                    className="w-full bg-[#FAF6F1] border border-[#BCAB9B] p-2.5 text-xs text-[#241D1B] rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Rodzaj promocji
                  </label>
                  <select
                    value={editingPromo.type}
                    onChange={(e) => setEditingPromo({ ...editingPromo, type: e.target.value as PromotionType })}
                    className="w-full bg-[#FAF6F1] border border-[#BCAB9B] p-2.5 text-xs text-[#241D1B] rounded focus:outline-none"
                  >
                    <option value="PERCENTAGE">Rabat procentowy (%)</option>
                    <option value="FIXED_AMOUNT">Rabat kwotowy (PLN)</option>
                    <option value="FREE_SHIPPING">Darmowa dostawa</option>
                    <option value="FREE_GIFT">Prezent do zamówienia</option>
                    <option value="FIRST_ORDER">Pierwsze zamówienie</option>
                    <option value="CATEGORY_WEEKEND">Weekend na kategorię</option>
                    <option value="COUPON_CODE">Kod rabatowy</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Wysokość rabatu (% lub PLN)
                  </label>
                  <input
                    type="number"
                    value={editingPromo.discountValue || 0}
                    onChange={(e) => setEditingPromo({ ...editingPromo, discountValue: Number(e.target.value) })}
                    className="w-full bg-[#FAF6F1] border border-[#BCAB9B] p-2.5 text-xs text-[#241D1B] rounded focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Sposób naliczania
                  </label>
                  <select
                    value={editingPromo.isAutomatic ? "auto" : "code"}
                    onChange={(e) => setEditingPromo({ ...editingPromo, isAutomatic: e.target.value === "auto" })}
                    className="w-full bg-[#FAF6F1] border border-[#BCAB9B] p-2.5 text-xs text-[#241D1B] rounded focus:outline-none"
                  >
                    <option value="auto">Automatycznie w koszyku</option>
                    <option value="code">Po wpisaniu kodu rabatowego</option>
                  </select>
                </div>
              </div>

              {!editingPromo.isAutomatic && (
                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Kod rabatowy (wpisywany przez klientkę)
                  </label>
                  <input
                    type="text"
                    placeholder="np. LATO15"
                    value={editingPromo.code || ""}
                    onChange={(e) => setEditingPromo({ ...editingPromo, code: e.target.value.toUpperCase() })}
                    className="w-full bg-[#FAF6F1] border border-[#BCAB9B] p-2.5 text-xs text-[#241D1B] uppercase font-mono rounded focus:outline-none"
                  />
                </div>
              )}

              {/* Baner */}
              <div className="p-4 bg-[#FAF6F1] rounded border border-[#EADFD5] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#241D1B] flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingPromo.bannerEnabled}
                      onChange={(e) => setEditingPromo({ ...editingPromo, bannerEnabled: e.target.checked })}
                      className="rounded text-[#9E8359]"
                    />
                    <span>Włącz baner promocyjny w sklepie</span>
                  </label>
                </div>
                {editingPromo.bannerEnabled && (
                  <div>
                    <input
                      type="text"
                      placeholder="Treść banera, np. Specjalna zniżka weekendowa w AURA Boutique!"
                      value={editingPromo.bannerText || ""}
                      onChange={(e) => setEditingPromo({ ...editingPromo, bannerText: e.target.value })}
                      className="w-full bg-white border border-[#BCAB9B] p-2.5 text-xs text-[#241D1B] rounded focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EADFD5]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-[#BCAB9B] text-xs uppercase tracking-wider font-semibold rounded text-[#5A483D] hover:bg-gray-50"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#9E8359] hover:bg-[#8B7147] text-white text-xs uppercase tracking-wider font-semibold rounded shadow transition-colors"
                >
                  Zapisz Promocję
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
