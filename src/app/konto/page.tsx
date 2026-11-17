"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  User,
  Tag,
  Gift,
  ShoppingBag,
  LogOut,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Lock,
  ArrowRight,
  Package,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  MapPin,
  ChevronRight,
  X,
  CreditCard,
  HeartHandshake,
  FileText,
  UserCheck,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { clearCustomerGreetingSession } from "@/lib/customer-greetings";
import type { Order, OrderItem, ReturnRequest, PaymentMethod, ShippingMethod } from "@/lib/types";

type AccountTab = "orders" | "returns" | "discounts" | "profile";

export default function AccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AccountTab>("orders");

  const [session, setSession] = useState<{
    isLoggedIn: boolean;
    email: string | null;
    isAdmin: boolean;
    customerName?: string;
    welcomeDiscountCode?: string;
    welcomeDiscountUsed?: boolean;
    welcomeDiscountUsedAt?: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Dane zamówień i zwrotów
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  const [returnsList, setReturnsList] = useState<any[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(false);

  // Stan płatności dla zamówienia
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [transferDetailsModal, setTransferDetailsModal] = useState<{
    orderNumber: string;
    details: any;
  } | null>(null);

  // Formularz zgłoszenia zwrotu
  const [returnModalOrder, setReturnModalOrder] = useState<Order | null>(null);
  const [selectedReturnItems, setSelectedReturnItems] = useState<
    Record<string, { selected: boolean; quantity: number; reason: string }>
  >({});
  const [returnMethod, setReturnMethod] = useState<"INPOST_LOCKER" | "COURIER" | "IN_PERSON">("INPOST_LOCKER");
  const [customerReturnNote, setCustomerReturnNote] = useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState<string | null>(null);

  // Dane profilu
  const [profile, setProfile] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    marketingConsent?: boolean;
    marketingConsentDate?: string;
  }>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    marketingConsent: false,
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Program poleceń & rabaty
  const [referralCode, setReferralCode] = useState<string>("");
  const [serverReferralUrl, setServerReferralUrl] = useState<string>("");
  const [totalReferralsCount, setTotalReferralsCount] = useState<number>(0);
  const [rewardCodes, setRewardCodes] = useState<any[]>([]);

  // Narzędzia schowka
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedWelcomeCode, setCopiedWelcomeCode] = useState(false);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setSession(data);

      if (data.isLoggedIn && data.email) {
        fetchOrders();
        fetchReturns();
        fetchProfile();
        fetchReferrals(data.email);
      }
    } catch (e) {
      console.error("Błąd sesji:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/customer/orders");
      if (res.ok) {
        const d = await res.json();
        if (d.orders) setOrders(d.orders);
      }
    } catch (e) {
      console.error("Błąd pobierania zamówień:", e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchReturns = async () => {
    setLoadingReturns(true);
    try {
      const res = await fetch("/api/customer/returns");
      if (res.ok) {
        const d = await res.json();
        if (d.returns) setReturnsList(d.returns);
      }
    } catch (e) {
      console.error("Błąd pobierania zwrotów:", e);
    } finally {
      setLoadingReturns(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/customer/profile");
      if (res.ok) {
        const d = await res.json();
        setProfile({
          firstName: d.firstName || "",
          lastName: d.lastName || "",
          email: d.email || "",
          phone: d.phone || "",
          marketingConsent: d.marketingConsent,
          marketingConsentDate: d.marketingConsentDate,
        });
      }
    } catch (e) {
      console.error("Błąd pobierania profilu:", e);
    }
  };

  const fetchReferrals = async (email: string) => {
    try {
      const res = await fetch(`/api/referrals/me?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const d = await res.json();
        if (d.referralCode) setReferralCode(d.referralCode);
        if (d.referralLink) setServerReferralUrl(d.referralLink);
        if (d.participant?.totalReferralsCount !== undefined) {
          setTotalReferralsCount(d.participant.totalReferralsCount);
        }
        if (d.referralRewards || d.rewards) {
          setRewardCodes(d.referralRewards || d.rewards || []);
        }
      }
    } catch (e) {
      console.error("Błąd pobierania poleceń:", e);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (e) {
      router.push("/");
    }
  };

  const copyToClipboard = (text: string, isUrl: boolean) => {
    navigator.clipboard.writeText(text);
    if (isUrl) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Inicjalizacja opłaty zamówienia
  const handlePayOrder = async (order: Order) => {
    setPayingOrderId(order.id);
    setPaymentError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/pay?key=${order.accessKey || ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey: order.accessKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas uruchamiania płatności.");
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      if (data.method === "TRADITIONAL_TRANSFER" && data.transferDetails) {
        setTransferDetailsModal({
          orderNumber: order.orderNumber,
          details: data.transferDetails,
        });
      }
    } catch (err: any) {
      setPaymentError(err.message || "Nie udało się rozpocząć płatności.");
    } finally {
      setPayingOrderId(null);
    }
  };

  // Zapis zmian w profilu
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage(null);
    try {
      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Błąd zapisu.");
      setProfileMessage({ type: "success", text: "Twoje dane zostały pomyślnie zaktualizowane." });
      setTimeout(() => setProfileMessage(null), 4000);
    } catch (err: any) {
      setProfileMessage({ type: "error", text: err.message || "Błąd podczas zapisu profilu." });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Otwarcie modalu zwrotu
  const handleOpenReturnModal = (order: Order) => {
    setReturnModalOrder(order);
    setReturnError(null);
    setReturnSuccessMsg(null);
    setCustomerReturnNote("");
    setReturnMethod("INPOST_LOCKER");

    // Inicjalizacja zaznaczeń pozycji
    const initialItems: Record<string, { selected: boolean; quantity: number; reason: string }> = {};
    order.items.forEach((item) => {
      // Obliczamy ile sztuk z tego produktu już zwrócono
      let alreadyReturnedQty = 0;
      if (order.returns) {
        order.returns.forEach((r) => {
          if (r.status !== "REJECTED") {
            r.items.forEach((ri) => {
              if (ri.orderItemId === item.id) {
                alreadyReturnedQty += ri.quantity;
              }
            });
          }
        });
      }
      const maxAvailable = Math.max(0, item.quantity - alreadyReturnedQty);
      if (maxAvailable > 0) {
        initialItems[item.id] = {
          selected: false,
          quantity: 1,
          reason: "Niewłaściwy rozmiar",
        };
      }
    });
    setSelectedReturnItems(initialItems);
  };

  // Złożenie formularza zwrotu
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalOrder) return;

    const itemsToReturn: any[] = [];
    returnModalOrder.items.forEach((item) => {
      const sel = selectedReturnItems[item.id];
      if (sel && sel.selected) {
        itemsToReturn.push({
          orderItemId: item.id,
          productName: item.productNameSnapshot,
          variantSnapshot: item.variantSnapshot,
          quantity: sel.quantity,
          reason: sel.reason || "Niewłaściwy rozmiar",
          unitPrice: item.unitPriceSnapshot,
        });
      }
    });

    if (itemsToReturn.length === 0) {
      setReturnError("Zaznacz co najmniej jeden produkt, który chcesz zwrócić.");
      return;
    }

    setIsSubmittingReturn(true);
    setReturnError(null);

    try {
      const res = await fetch("/api/orders/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: returnModalOrder.id,
          accessKey: returnModalOrder.accessKey,
          items: itemsToReturn,
          returnMethod,
          customerNote: customerReturnNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Błąd podczas zgłaszania zwrotu.");
      }

      setReturnSuccessMsg("Twój zwrot został pomyślnie zarejestrowany!");
      fetchOrders();
      fetchReturns();
      setTimeout(() => {
        setReturnModalOrder(null);
        setActiveTab("returns");
      }, 1500);
    } catch (err: any) {
      setReturnError(err.message || "Błąd podczas zgłaszania zwrotu.");
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const referralUrl =
    serverReferralUrl ||
    (typeof window !== "undefined" && referralCode
      ? `${window.location.origin}/?ref=${referralCode}`
      : "");

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-[70vh] flex items-center justify-center bg-[#FAF6F1] pt-36">
          <div className="text-center space-y-3">
            <div className="w-9 h-9 border-2 border-[#C5A069] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-widest text-[#7A6458] font-medium">Ładowanie Twojego konta...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Jeśli użytkownik nie jest zalogowany
  if (!session?.isLoggedIn) {
    return (
      <>
        <Header />
        <main
          className="flex-1 min-h-[80vh] pt-36 sm:pt-44 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center"
          style={{
            backgroundColor: "#FAF6F1",
            backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
            backgroundRepeat: "repeat",
          }}
        >
          <div className="max-w-md mx-auto text-center bg-white/95 backdrop-blur-sm p-8 sm:p-10 border border-[#BCAB9B] rounded-xl shadow-xl space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#FAF6F1] border-2 border-[#C5A069] flex items-center justify-center mx-auto text-[#C5A069]">
              <User className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-2xl text-[#241D1B] font-semibold">Konto w AURA Boutique</h1>
              <p className="text-xs text-[#7A6458] leading-relaxed">
                Zaloguj się, aby uzyskać dostęp do historii swoich zamówień, statusu przesyłek, zwrotów, unikalnych kodów poleceń dla przyjaciółek oraz rabatu powitalnego −15%.
              </p>
            </div>
            <div className="pt-2 space-y-3">
              <Link
                href="/logowanie"
                className="w-full py-3.5 bg-[#241D1B] hover:bg-[#3E3430] text-[#FAF6F1] text-xs uppercase tracking-[0.2em] font-medium flex items-center justify-center gap-2 rounded shadow transition-all"
              >
                <span>Przejdź do logowania</span>
                <ArrowRight className="w-4 h-4 text-[#C5A069]" />
              </Link>
              <Link
                href="/"
                className="block text-xs text-[#7A6458] hover:text-[#241D1B] transition-colors"
              >
                Wróć do przeglądania butiku
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const isOwner = session.isAdmin && session.email === "aurazmigrod@wp.pl";

  return (
    <>
      <Header />
      {/* 🌟 PADDING TOP pt-36 sm:pt-44 lg:pt-48 ZAPOBIEGA ZASŁANIANIU PRZEZ FIXED HEADER 🌟 */}
      <main
        className="flex-1 pt-36 sm:pt-44 lg:pt-48 pb-20 min-h-screen"
        style={{
          backgroundColor: "#FAF6F1",
          backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
          backgroundRepeat: "repeat",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Pasek powitalny użytkownika */}
          <div className="bg-white/95 backdrop-blur-sm p-6 sm:p-7 border border-[#BCAB9B] rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#FAF6F1] border-2 border-[#C5A069] flex items-center justify-center text-[#241D1B] font-serif text-xl font-bold shrink-0">
                {isOwner ? "👑" : (profile.firstName ? profile.firstName.charAt(0).toUpperCase() : session.email?.substring(0, 2).toUpperCase())}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-serif text-xl sm:text-2xl text-[#241D1B] font-semibold">
                    {profile.firstName
                      ? `Witaj ${profile.firstName}!`
                      : isOwner
                      ? "Witaj Właścicielko Butiku!"
                      : "Witaj! Miło Cię widzieć w AURA 💛"}
                  </h1>
                  {isOwner && (
                    <span className="px-2.5 py-0.5 bg-[#FFF2DE] text-[#8C6418] border border-[#E8CD9B] text-[10px] font-bold uppercase rounded-full">
                      Administrator
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#7A6458] mt-1">
                  Konto klientki • Dostęp do zamówień, zwrotów i zniżek
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isOwner && (
                <Link
                  href="/admin"
                  className="px-4 py-2.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-wider rounded font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Panel Admina</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 border border-[#BCAB9B] text-xs text-[#241D1B] hover:bg-[#F3ECE2] transition-colors rounded-lg flex items-center justify-center gap-1.5 font-medium ml-auto sm:ml-0"
              >
                <LogOut className="w-3.5 h-3.5 text-[#8C7248]" />
                <span>Wyloguj się</span>
              </button>
            </div>
          </div>

          {/* NAWIGACJA ZAKŁADEK KONTA */}
          <div className="bg-white/95 backdrop-blur-sm p-1.5 border border-[#BCAB9B] rounded-xl shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`py-3 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeTab === "orders"
                  ? "bg-[#241D1B] text-white shadow-sm"
                  : "text-[#5A483D] hover:bg-[#FAF6F1] hover:text-[#241D1B]"
              }`}
            >
              <Package className={`w-4 h-4 ${activeTab === "orders" ? "text-[#C5A069]" : "text-[#8C7248]"}`} />
              <span>Moje zamówienia</span>
              {orders.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === "orders" ? "bg-[#C5A069] text-white" : "bg-[#FAF6F1] text-[#241D1B] border border-[#BCAB9B]"
                  }`}
                >
                  {orders.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("returns")}
              className={`py-3 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeTab === "returns"
                  ? "bg-[#241D1B] text-white shadow-sm"
                  : "text-[#5A483D] hover:bg-[#FAF6F1] hover:text-[#241D1B]"
              }`}
            >
              <RotateCcw className={`w-4 h-4 ${activeTab === "returns" ? "text-[#C5A069]" : "text-[#8C7248]"}`} />
              <span>Moje zwroty</span>
              {returnsList.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === "returns" ? "bg-[#C5A069] text-white" : "bg-[#FAF6F1] text-[#241D1B] border border-[#BCAB9B]"
                  }`}
                >
                  {returnsList.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("discounts")}
              className={`py-3 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeTab === "discounts"
                  ? "bg-[#241D1B] text-white shadow-sm"
                  : "text-[#5A483D] hover:bg-[#FAF6F1] hover:text-[#241D1B]"
              }`}
            >
              <Tag className={`w-4 h-4 ${activeTab === "discounts" ? "text-[#C5A069]" : "text-[#8C7248]"}`} />
              <span>Rabaty i polecenia</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`py-3 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeTab === "profile"
                  ? "bg-[#241D1B] text-white shadow-sm"
                  : "text-[#5A483D] hover:bg-[#FAF6F1] hover:text-[#241D1B]"
              }`}
            >
              <UserCheck className={`w-4 h-4 ${activeTab === "profile" ? "text-[#C5A069]" : "text-[#8C7248]"}`} />
              <span>Moje dane</span>
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* TAB 1: MOJE ZAMÓWIENIA (DOMYŚLNY WIDOK)                 */}
          {/* ═══════════════════════════════════════════════════════ */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              {paymentError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{paymentError}</span>
                </div>
              )}

              {loadingOrders ? (
                <div className="bg-white/95 backdrop-blur-sm p-12 border border-[#BCAB9B] rounded-xl text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#C5A069] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#7A6458]">Pobieranie historii Twoich zamówień...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white/95 backdrop-blur-sm p-12 border border-[#BCAB9B] rounded-xl text-center space-y-4">
                  <Package className="w-12 h-12 text-[#C5A069] mx-auto opacity-70" />
                  <div className="space-y-1">
                    <h3 className="font-serif text-lg text-[#241D1B]">Brak zamówień w Twojej historii</h3>
                    <p className="text-xs text-[#7A6458] max-w-md mx-auto">
                      Nie złożyłaś jeszcze zamówienia na ten adres e-mail. Wszystkie Twoje przyszłe zakupy pojawią się w tym miejscu automatycznie.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#241D1B] hover:bg-[#3E3430] text-white text-xs uppercase tracking-wider rounded font-medium transition-colors"
                    >
                      <span>Odkryj kolekcję butiku</span>
                      <ArrowRight className="w-4 h-4 text-[#C5A069]" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const isPaid = order.paymentStatus === "PAID";
                    const isPending = order.paymentStatus === "PENDING";
                    const isFailed = order.paymentStatus === "FAILED";

                    return (
                      <div
                        key={order.id}
                        className="bg-white/95 backdrop-blur-sm border border-[#BCAB9B] rounded-xl p-5 sm:p-6 shadow-xs hover:border-[#C5A069] transition-all space-y-4"
                      >
                        {/* Górny wiersz: ID, data i statusy */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EADFD5]">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-[#241D1B]">
                                {order.orderNumber}
                              </span>
                              <Link
                                href={`/zamowienie/${order.id}/potwierdzenie?key=${order.accessKey || ""}`}
                                className="text-[#8C7248] hover:text-[#241D1B] transition-colors"
                                title="Zobacz dedykowaną stronę zamówienia"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                            <p className="text-[11px] text-[#7A6458]">
                              Złożono: {new Date(order.createdAt).toLocaleDateString("pl-PL", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Status płatności */}
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 ${
                                isPaid
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : isPending
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : isFailed
                                  ? "bg-rose-50 text-rose-800 border-rose-200"
                                  : "bg-gray-100 text-gray-700 border-gray-300"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? "bg-emerald-600" : isPending ? "bg-amber-500" : "bg-rose-500"}`} />
                              <span>
                                {isPaid
                                  ? "Opłacone"
                                  : isPending
                                  ? "Oczekuje na płatność"
                                  : isFailed
                                  ? "Błąd płatności"
                                  : "Zwrócono środki"}
                              </span>
                            </span>

                            {/* Status realizacji */}
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#FAF6F1] text-[#5A483D] border border-[#BCAB9B]">
                              {order.fulfillmentStatus === "NEW" && "Nowe"}
                              {order.fulfillmentStatus === "PROCESSING" && "W realizacji"}
                              {order.fulfillmentStatus === "SHIPPED" && "Wysłane"}
                              {order.fulfillmentStatus === "DELIVERED" && "Doręczone"}
                              {order.fulfillmentStatus === "CANCELLED" && "Anulowane"}
                            </span>
                          </div>
                        </div>

                        {/* Miniatury produktów */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          <div className="md:col-span-8 flex items-center gap-3 overflow-x-auto py-1">
                            {order.items.map((item, idx) => (
                              <div
                                key={item.id || idx}
                                className="flex items-center gap-2.5 bg-[#FAF6F1] p-2 rounded-lg border border-[#EADFD5] shrink-0 max-w-[240px]"
                              >
                                {item.productImageUrl ? (
                                  <div className="relative w-12 h-14 rounded overflow-hidden shrink-0 bg-white">
                                    <Image
                                      src={item.productImageUrl}
                                      alt={item.productNameSnapshot}
                                      fill
                                      className="object-cover"
                                      sizes="48px"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-12 h-14 rounded bg-[#EADFD5] flex items-center justify-center shrink-0 text-[#8C7248]">
                                    <Package className="w-5 h-5" />
                                  </div>
                                )}
                                <div className="text-xs min-w-0">
                                  <p className="font-semibold text-[#241D1B] truncate">{item.productNameSnapshot}</p>
                                  <p className="text-[10px] text-[#7A6458] truncate">{item.variantSnapshot}</p>
                                  <p className="text-[10px] text-[#241D1B] font-mono mt-0.5">
                                    {item.quantity} szt. × {item.unitPriceSnapshot.toFixed(2)} zł
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="md:col-span-4 flex flex-col md:items-end justify-center space-y-1">
                            <span className="text-[11px] text-[#7A6458]">Łączna kwota:</span>
                            <span className="font-serif text-lg font-bold text-[#241D1B]">
                              {order.totalAmount.toFixed(2)} zł
                            </span>
                            {order.trackingNumber && (
                              <div className="flex items-center gap-1 text-[11px] text-[#8C7248]">
                                <Truck className="w-3.5 h-3.5" />
                                <span className="font-mono">{order.trackingNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Dolny pasek akcji */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#EADFD5]">
                          <div className="text-xs text-[#7A6458]">
                            Dostawa: <strong className="text-[#241D1B]">{order.shippingMethod === "INPOST_LOCKER" ? "Paczkomat InPost" : order.shippingMethod === "COURIER" ? "Kurier" : "Odbiór osobisty"}</strong>
                            {order.parcelLockerCode ? ` (${order.parcelLockerCode})` : ""}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Opłać zamówienie (jeśli oczekuje na płatność) */}
                            {isPending && (
                              <button
                                type="button"
                                disabled={payingOrderId === order.id}
                                onClick={() => handlePayOrder(order)}
                                className="px-4 py-2 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-wider rounded font-medium flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                              >
                                {payingOrderId === order.id ? (
                                  <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Łączenie...</span>
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>Opłać zamówienie</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Zgłoś zwrot (TYLKO DLA OPŁACONYCH ZAMÓWIEŃ) */}
                            {isPaid && (
                              <button
                                type="button"
                                onClick={() => handleOpenReturnModal(order)}
                                className="px-3.5 py-2 border border-[#BCAB9B] hover:bg-[#FAF6F1] text-xs text-[#241D1B] rounded font-medium flex items-center gap-1.5 transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-[#8C7248]" />
                                <span>Zgłoś zwrot</span>
                              </button>
                            )}

                            {/* Zobacz szczegóły */}
                            <button
                              type="button"
                              onClick={() => setSelectedOrderDetails(order)}
                              className="px-3.5 py-2 bg-[#241D1B] hover:bg-[#3E3430] text-white text-xs uppercase tracking-wider rounded font-medium flex items-center gap-1.5 transition-colors"
                            >
                              <span>Szczegóły</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* TAB 2: MOJE ZWROTY                                      */}
          {/* ═══════════════════════════════════════════════════════ */}
          {activeTab === "returns" && (
            <div className="space-y-6">
              <div className="bg-white/95 backdrop-blur-sm p-6 border border-[#BCAB9B] rounded-xl shadow-xs space-y-2">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-[#C5A069]" />
                  <h2 className="font-serif text-lg text-[#241D1B] font-semibold">
                    Zgłoszenia zwrotów i wymian
                  </h2>
                </div>
                <p className="text-xs text-[#7A6458] leading-relaxed max-w-3xl">
                  W AURA BOUTIQUE masz 14 dni na wygodny zwrot zakupionych produktów. Zwrot możesz zgłosić bezpośrednio ze szczegółów opłaconego zamówienia w zakładce „Moje zamówienia”. Poniżej znajdziesz historię oraz aktualny status swoich zgłoszeń.
                </p>
              </div>

              {loadingReturns ? (
                <div className="bg-white/95 backdrop-blur-sm p-12 border border-[#BCAB9B] rounded-xl text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#C5A069] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#7A6458]">Pobieranie Twoich zwrotów...</p>
                </div>
              ) : returnsList.length === 0 ? (
                <div className="bg-white/95 backdrop-blur-sm p-12 border border-[#BCAB9B] rounded-xl text-center space-y-4">
                  <RotateCcw className="w-12 h-12 text-[#C5A069] mx-auto opacity-70" />
                  <div className="space-y-1">
                    <h3 className="font-serif text-lg text-[#241D1B]">Brak zgłoszonych zwrotów</h3>
                    <p className="text-xs text-[#7A6458] max-w-md mx-auto">
                      Nie masz żadnych aktywnych ani zakończonych procedur zwrotu.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("orders")}
                      className="px-5 py-2.5 bg-[#241D1B] hover:bg-[#3E3430] text-white text-xs uppercase tracking-wider rounded font-medium transition-colors"
                    >
                      Przejdź do zamówień, aby zgłosić zwrot
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {returnsList.map((ret) => (
                    <div
                      key={ret.id}
                      className="bg-white/95 backdrop-blur-sm border border-[#BCAB9B] rounded-xl p-5 sm:p-6 shadow-xs space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EADFD5]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-[#241D1B]">
                              Zwrot #{ret.id.substring(0, 8)}
                            </span>
                            <span className="text-xs text-[#7A6458]">
                              (Zamówienie: <strong className="font-mono text-[#241D1B]">{ret.orderNumber}</strong>)
                            </span>
                          </div>
                          <p className="text-[11px] text-[#7A6458] mt-0.5">
                            Zgłoszono: {new Date(ret.createdAt).toLocaleDateString("pl-PL", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border self-start sm:self-auto ${
                            ret.status === "APPROVED" || ret.status === "REFUNDED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : ret.status === "REJECTED"
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {ret.status === "PENDING" && "Oczekuje na weryfikację"}
                          {ret.status === "APPROVED" && "Zwrot zaakceptowany"}
                          {ret.status === "RECEIVED" && "Paczka odebrana w butiku"}
                          {ret.status === "REFUNDED" && "Środki zwrócone"}
                          {ret.status === "REJECTED" && "Zwrot odrzucony"}
                        </span>
                      </div>

                      {/* Zwracane pozycje */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-[#241D1B]">Zwracane ubrania:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {ret.items.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-3 bg-[#FAF6F1] border border-[#EADFD5] rounded-lg text-xs space-y-0.5"
                            >
                              <div className="font-semibold text-[#241D1B] flex items-center justify-between">
                                <span>{item.productName}</span>
                                <span className="font-mono font-normal text-[#7A6458]">
                                  {item.quantity} szt.
                                </span>
                              </div>
                              <p className="text-[11px] text-[#7A6458]">{item.variantSnapshot}</p>
                              <p className="text-[10px] text-[#8C7248] italic">Powód: {item.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Metoda zwrotu i instrukcje */}
                      <div className="pt-2 text-xs text-[#5A483D] flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[#EADFD5]">
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-[#8C7248]" />
                          <span>
                            Sposób nadania:{" "}
                            <strong>
                              {ret.returnMethod === "INPOST_LOCKER"
                                ? "Paczkomat InPost (Szybkie Zwroty)"
                                : ret.returnMethod === "COURIER"
                                ? "Przesyłka kurierska"
                                : "Osobiście w Butiku Żmigród (Rynek 14)"}
                            </strong>
                          </span>
                        </div>
                        {ret.returnTrackingNumber && (
                          <div className="font-mono text-[#241D1B] bg-[#FAF6F1] px-2.5 py-1 rounded border border-[#BCAB9B]">
                            Kod nadania: <strong>{ret.returnTrackingNumber}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* TAB 3: RABATY I POLECENIA                               */}
          {/* ═══════════════════════════════════════════════════════ */}
          {activeTab === "discounts" && (
            <div className="space-y-6">
              {/* KARTA POWITALNEGO KODU RABATOWEGO -15% NA PIERWSZE ZAMÓWIENIE */}
              {session?.welcomeDiscountCode && (
                <div className="bg-white/95 backdrop-blur-sm p-6 sm:p-7 border border-[#C5A069]/60 rounded-xl shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EADFD5]">
                    <div className="flex items-center gap-2.5">
                      <Tag className="w-5 h-5 text-[#C5A069]" />
                      <h2 className="font-serif text-lg text-[#241D1B] font-semibold">
                        Twój rabat powitalny: −15% na pierwsze zamówienie
                      </h2>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full border self-start sm:self-auto ${
                        session.welcomeDiscountUsed
                          ? "bg-gray-100 text-gray-600 border-gray-300"
                          : "bg-[#FBF6ED] text-[#7A5A2B] border-[#DFCA9B]"
                      }`}
                    >
                      {session.welcomeDiscountUsed ? "Wykorzystany" : "Aktywny w koszyku"}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-[#5A483D] leading-relaxed">
                        Dziękujemy za założenie konta w AURA Boutique! Twój unikalny kod daje <strong>15% rabatu</strong> na ubrania w pierwszym zamówieniu.
                      </p>
                      <p className="text-[11px] text-[#857670]">
                        Wpisz kod w koszyku przed złożeniem zamówienia. Nie łączy się z innymi kodami.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="bg-[#FAF6F1] border-2 border-dashed border-[#C5A069] px-4 py-2 font-mono text-base font-bold text-[#241D1B] tracking-wider rounded">
                        {session.welcomeDiscountCode}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(session.welcomeDiscountCode || "");
                          setCopiedWelcomeCode(true);
                          setTimeout(() => setCopiedWelcomeCode(false), 2000);
                        }}
                        className="px-4 py-2 bg-[#241D1B] hover:bg-[#3E3835] text-white text-xs uppercase tracking-wider rounded font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                        title="Skopiuj kod do koszyka"
                      >
                        {copiedWelcomeCode ? <Check className="w-3.5 h-3.5 text-[#C5A069]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedWelcomeCode ? "Skopiowano" : "Kopiuj"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SEKACJA PROGRAMU POLECEŃ & KODÓW RABATOWYCH */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Lewa kolumna: Twój program poleceń */}
                <div className="lg:col-span-7 bg-white/95 backdrop-blur-sm p-6 sm:p-8 border border-[#BCAB9B] rounded-xl shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-[#EADFD5] pb-4">
                    <div className="flex items-center gap-2">
                      <HeartHandshake className="w-5 h-5 text-[#C5A069]" />
                      <h2 className="font-serif text-lg text-[#241D1B] font-semibold">
                        Poleć przyjaciółce — obie zyskujecie 15%
                      </h2>
                    </div>
                    <span className="px-2.5 py-1 bg-[#F5ECE1] text-[#7A5A2B] text-[11px] font-bold rounded-full border border-[#E0D3C3]">
                      –15%
                    </span>
                  </div>

                  <p className="text-xs text-[#5A483D] leading-relaxed">
                    Podziel się swoim kodem z przyjaciółką. Ona otrzyma <strong>15% rabatu</strong> na pierwsze zamówienie, a po zrealizowaniu jej zamówienia Ty dostaniesz <strong>15% rabatu</strong> na kolejne zakupy. Swój rabat wykorzystasz w ciągu 30 dni.
                  </p>

                  {/* Twój kod polecający */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#241D1B] block">
                        Twój unikalny stały kod polecający:
                      </label>
                      <span className="text-[11px] text-[#857670] font-medium">
                        Zrealizowane polecenia: <strong className="text-[#241D1B] font-mono">{totalReferralsCount}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#FAF6F1] border-2 border-dashed border-[#C5A069] px-4 py-2.5 font-mono text-sm font-bold text-[#241D1B] tracking-wider text-center rounded">
                        {referralCode || "Pobieranie kodu..."}
                      </div>
                      <button
                        disabled={!referralCode}
                        onClick={() => copyToClipboard(referralCode, false)}
                        className="px-4 py-2.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-wider rounded font-medium flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
                      >
                        {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedCode ? "Skopiowano" : "Kopiuj kod"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Twój link polecający */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#241D1B] block">
                      Twój bezpośredni link dla przyjaciółki:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={referralUrl || "Generowanie linku..."}
                        className="flex-1 bg-[#FAF6F1] border border-[#BCAB9B] px-3 py-2 text-xs text-[#5A483D] rounded truncate font-mono"
                      />
                      <button
                        disabled={!referralUrl}
                        onClick={() => copyToClipboard(referralUrl, true)}
                        className="px-4 py-2 bg-[#241D1B] hover:bg-[#3E3430] text-white text-xs uppercase tracking-wider rounded font-medium flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
                      >
                        {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedLink ? "Skopiowano" : "Kopiuj link"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Prawa kolumna: Twoje aktywne rabaty i kody nagród */}
                <div className="lg:col-span-5 bg-white/95 backdrop-blur-sm p-6 sm:p-8 border border-[#BCAB9B] rounded-xl shadow-sm space-y-6">
                  <div className="flex items-center gap-2 border-b border-[#EADFD5] pb-4">
                    <Tag className="w-5 h-5 text-[#C5A069]" />
                    <h2 className="font-serif text-lg text-[#241D1B] font-semibold">
                      Twoje Kody Rabatowe
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {rewardCodes.length === 0 ? (
                      <div className="p-6 text-center bg-[#FAF6F1] border border-[#EADFD5] rounded-lg space-y-2">
                        <Gift className="w-8 h-8 text-[#C5A069] mx-auto opacity-70" />
                        <p className="text-xs text-[#5A483D] font-medium">
                          Nie masz jeszcze przyznanych kodów nagród
                        </p>
                        <p className="text-[11px] text-[#7A6458]">
                          Poleć butik koleżance lub oceń zakupione ubranie, aby otrzymać rabat 2%, 5% lub 15%!
                        </p>
                      </div>
                    ) : (
                      rewardCodes.map((code) => (
                        <div
                          key={code.id}
                          className="p-3 bg-[#FAF6F1] border border-[#EADFD5] rounded-lg flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-mono font-bold text-[#241D1B] tracking-wide">
                              {code.code}
                            </div>
                            <div className="text-[10px] text-[#7A6458]">
                              Zniżka {code.discountPercent}% • Ważny do: {new Date(code.validUntil).toLocaleDateString("pl-PL")}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              code.isUsed
                                ? "bg-gray-100 text-gray-600"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {code.isUsed ? "Wykorzystany" : "Aktywny"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-3.5 bg-[#F5ECE1]/60 border border-[#E0D3C3] rounded-lg text-[11px] text-[#5A483D] space-y-1">
                    <p className="font-semibold text-[#241D1B] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#C5A069]" />
                      <span>Darmowa dostawa od 300 zł</span>
                    </p>
                    <p className="leading-relaxed">
                      Pamiętaj, że dla zamówień powyżej 300 zł dostawa Paczkomatem InPost i Kurierem jest zawsze całkowicie darmowa!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* TAB 4: MOJE DANE (EDYCJA PROFILU)                       */}
          {/* ═══════════════════════════════════════════════════════ */}
          {activeTab === "profile" && (
            <div className="bg-white/95 backdrop-blur-sm p-6 sm:p-8 border border-[#BCAB9B] rounded-xl shadow-sm space-y-6 max-w-2xl mx-auto">
              <div className="border-b border-[#EADFD5] pb-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#C5A069]" />
                  <h2 className="font-serif text-lg text-[#241D1B] font-semibold">
                    Moje dane kontaktowe
                  </h2>
                </div>
                <p className="text-xs text-[#7A6458] mt-1">
                  Zarządzaj swoimi danymi osobowymi oraz ustawieniami konta.
                </p>
              </div>

              {profileMessage && (
                <div
                  className={`p-3.5 rounded-lg text-xs flex items-center gap-2 ${
                    profileMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {profileMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{profileMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#241D1B] block">
                      Imię
                    </label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      placeholder="np. Anna"
                      className="w-full bg-[#FAF6F1] border border-[#BCAB9B] px-3.5 py-2.5 rounded-lg text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#241D1B] block">
                      Nazwisko
                    </label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      placeholder="np. Kowalska"
                      className="w-full bg-[#FAF6F1] border border-[#BCAB9B] px-3.5 py-2.5 rounded-lg text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#241D1B] block">
                    Adres e-mail (login)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={session.email || ""}
                    className="w-full bg-[#F3ECE2] border border-[#BCAB9B] px-3.5 py-2.5 rounded-lg text-xs text-[#5A483D] font-mono cursor-not-allowed opacity-80"
                  />
                  <p className="text-[10px] text-[#7A6458]">
                    Adres e-mail przypisany do konta służy do logowania i powiadomień. Aby go zmienić, skontaktuj się z obsługą butiku.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#241D1B] block">
                    Numer telefonu
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="np. +48 600 000 000"
                    className="w-full bg-[#FAF6F1] border border-[#BCAB9B] px-3.5 py-2.5 rounded-lg text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                  />
                </div>

                {/* Zgoda marketingowa */}
                <div className="p-3.5 bg-[#FAF6F1] border border-[#EADFD5] rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C5A069]" />
                    <span className="font-semibold text-[#241D1B]">Zgody marketingowe i rabaty</span>
                  </div>
                  <p className="text-[11px] text-[#7A6458]">
                    {profile.marketingConsent
                      ? `Zgoda na otrzymywanie informacji o nowościach i kodach rabatowych jest aktywna (wyrażona: ${
                          profile.marketingConsentDate
                            ? new Date(profile.marketingConsentDate).toLocaleDateString("pl-PL")
                            : "podczas rejestracji"
                        }).`
                      : "Nie wyraziłaś zgody na powiadomienia e-mail z kodami promocyjnymi."}
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#241D1B] hover:bg-[#3E3430] text-white text-xs uppercase tracking-wider rounded font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSavingProfile ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Zapisywanie...</span>
                      </>
                    ) : (
                      <span>Zapisz zmiany</span>
                    )}
                  </button>

                  <Link
                    href="/zmien-haslo"
                    className="text-xs text-[#8C7248] hover:text-[#241D1B] underline flex items-center gap-1 font-medium"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Zmień hasło do konta</span>
                  </Link>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* MODAL: SZCZEGÓŁY ZAMÓWIENIA                             */}
        {/* ═══════════════════════════════════════════════════════ */}
        {selectedOrderDetails && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-[#BCAB9B] max-h-[90vh] flex flex-col overflow-hidden my-auto">
              {/* Nagłówek modalu */}
              <div className="p-5 border-b border-[#EADFD5] flex items-center justify-between bg-[#FAF6F1]">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#241D1B]">
                    Szczegóły zamówienia {selectedOrderDetails.orderNumber}
                  </h3>
                  <p className="text-xs text-[#7A6458] mt-0.5">
                    Złożono: {new Date(selectedOrderDetails.createdAt).toLocaleString("pl-PL")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrderDetails(null)}
                  className="w-8 h-8 rounded-full hover:bg-[#EADFD5] flex items-center justify-center text-[#7A6458] hover:text-[#241D1B] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Zawartość ze scrollem */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#5A483D]">
                {/* Produkty */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-xs text-[#241D1B] uppercase tracking-wider">
                    Zamówione produkty
                  </h4>
                  <div className="space-y-2">
                    {selectedOrderDetails.items.map((it) => (
                      <div
                        key={it.id}
                        className="p-3 bg-[#FAF6F1] border border-[#EADFD5] rounded-lg flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          {it.productImageUrl ? (
                            <div className="relative w-12 h-14 rounded overflow-hidden shrink-0 bg-white border border-[#EADFD5]">
                              <Image
                                src={it.productImageUrl}
                                alt={it.productNameSnapshot}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-14 rounded bg-[#EADFD5] flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-[#8C7248]" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-[#241D1B]">{it.productNameSnapshot}</p>
                            <p className="text-[11px] text-[#7A6458]">{it.variantSnapshot}</p>
                            <p className="text-[11px] text-[#241D1B] font-mono mt-0.5">
                              {it.quantity} szt. × {it.unitPriceSnapshot.toFixed(2)} zł
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-sm text-[#241D1B]">
                            {it.totalSnapshot.toFixed(2)} zł
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rozbicie finansowe */}
                <div className="p-4 bg-[#FAF6F1] border border-[#EADFD5] rounded-lg space-y-2">
                  <h4 className="font-semibold text-xs text-[#241D1B] uppercase tracking-wider mb-2">
                    Podsumowanie kosztów
                  </h4>
                  <div className="flex justify-between">
                    <span>Wartość produktów:</span>
                    <span className="font-mono font-medium">
                      {(selectedOrderDetails.originalSubtotal || selectedOrderDetails.subtotalAmount).toFixed(2)} zł
                    </span>
                  </div>
                  {Boolean(selectedOrderDetails.discountAmount && selectedOrderDetails.discountAmount > 0) && (
                    <div className="flex justify-between text-[#8C6418]">
                      <span>Rabat ({selectedOrderDetails.couponCode || "Zniżka"}):</span>
                      <span className="font-mono font-medium">
                        −{selectedOrderDetails.discountAmount?.toFixed(2)} zł
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Dostawa ({selectedOrderDetails.shippingMethod === "INPOST_LOCKER" ? "Paczkomat InPost" : selectedOrderDetails.shippingMethod === "COURIER" ? "Kurier" : "Odbiór osobisty"}):</span>
                    <span className="font-mono font-medium">
                      {selectedOrderDetails.shippingCost === 0 ? "Darmowa (0,00 zł)" : `${selectedOrderDetails.shippingCost.toFixed(2)} zł`}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-[#241D1B] border-t border-[#EADFD5] pt-2 mt-2">
                    <span>Łączna kwota:</span>
                    <span className="font-mono text-[#C5A069]">
                      {selectedOrderDetails.totalAmount.toFixed(2)} zł
                    </span>
                  </div>
                </div>

                {/* Dane doręczenia i śledzenia */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#FAF6F1] border border-[#EADFD5] rounded-lg space-y-1.5">
                    <h4 className="font-semibold text-xs text-[#241D1B] uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#C5A069]" />
                      <span>Dane doręczenia</span>
                    </h4>
                    <p className="font-medium text-[#241D1B]">
                      {selectedOrderDetails.customerFirstName} {selectedOrderDetails.customerLastName}
                    </p>
                    <p>{selectedOrderDetails.customerEmail}</p>
                    <p>{selectedOrderDetails.customerPhone}</p>
                    {selectedOrderDetails.parcelLockerCode && (
                      <p className="font-mono font-bold text-[#241D1B] mt-1">
                        Paczkomat: {selectedOrderDetails.parcelLockerCode}
                      </p>
                    )}
                    {selectedOrderDetails.shippingStreet && (
                      <p>
                        {selectedOrderDetails.shippingStreet}, {selectedOrderDetails.shippingPostalCode} {selectedOrderDetails.shippingCity}
                      </p>
                    )}
                  </div>

                  <div className="p-4 bg-[#FAF6F1] border border-[#EADFD5] rounded-lg space-y-1.5">
                    <h4 className="font-semibold text-xs text-[#241D1B] uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#C5A069]" />
                      <span>Śledzenie przesyłki</span>
                    </h4>
                    {selectedOrderDetails.trackingNumber ? (
                      <div className="space-y-2">
                        <p className="font-mono font-bold text-[#241D1B]">
                          {selectedOrderDetails.trackingNumber}
                        </p>
                        <a
                          href={`https://inpost.pl/sledzenie-przesylek?number=${selectedOrderDetails.trackingNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#8C7248] hover:text-[#241D1B] underline"
                        >
                          <span>Śledź paczkę w InPost</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#7A6458]">
                        Numer przesyłki zostanie wygenerowany po spakowaniu zamówienia w butiku.
                      </p>
                    )}
                  </div>
                </div>

                {/* Sekcja zwrotu */}
                {selectedOrderDetails.paymentStatus === "PAID" ? (
                  <div className="p-4 bg-[#FAF6F1] border border-[#C5A069]/40 rounded-lg flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-[#241D1B]">Chcesz dokonać zwrotu ubrań?</p>
                      <p className="text-[11px] text-[#7A6458]">
                        Masz 14 dni od momentu doręczenia przesyłki.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenReturnModal(selectedOrderDetails);
                        setSelectedOrderDetails(null);
                      }}
                      className="px-4 py-2 bg-[#241D1B] hover:bg-[#3E3430] text-white text-xs uppercase tracking-wider rounded font-medium transition-colors shrink-0 flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#C5A069]" />
                      <span>Zgłoś zwrot</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px]">
                    Możliwość zgłoszenia zwrotu jest dostępna wyłącznie po opłaceniu zamówienia.
                  </div>
                )}
              </div>

              {/* Stopka modalu */}
              <div className="p-4 border-t border-[#EADFD5] bg-[#FAF6F1] flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedOrderDetails(null)}
                  className="px-5 py-2 border border-[#BCAB9B] hover:bg-[#EADFD5] text-xs font-medium rounded-lg text-[#241D1B] transition-colors"
                >
                  Zamknij
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* MODAL: FORMULARZ ZGŁOSZENIA ZWROTU                      */}
        {/* ═══════════════════════════════════════════════════════ */}
        {returnModalOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-[#BCAB9B] max-h-[90vh] flex flex-col overflow-hidden my-auto">
              <div className="p-5 border-b border-[#EADFD5] flex items-center justify-between bg-[#FAF6F1]">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#241D1B]">
                    Zgłoszenie zwrotu do zamówienia {returnModalOrder.orderNumber}
                  </h3>
                  <p className="text-xs text-[#7A6458] mt-0.5">
                    Wybierz produkty, które chcesz zwrócić do Butiku AURA.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReturnModalOrder(null)}
                  className="w-8 h-8 rounded-full hover:bg-[#EADFD5] flex items-center justify-center text-[#7A6458] hover:text-[#241D1B]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitReturn} className="p-6 overflow-y-auto space-y-5 text-xs text-[#5A483D]">
                {returnError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
                    {returnError}
                  </div>
                )}

                {returnSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{returnSuccessMsg}</span>
                  </div>
                )}

                {/* Wybór produktów */}
                <div className="space-y-3">
                  <label className="font-semibold text-xs text-[#241D1B] block">
                    Zaznacz produkty do zwrotu:
                  </label>
                  <div className="space-y-2">
                    {returnModalOrder.items.map((item) => {
                      const sel = selectedReturnItems[item.id] || { selected: false, quantity: 1, reason: "Niewłaściwy rozmiar" };
                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-lg border transition-all ${
                            sel.selected
                              ? "bg-[#FAF6F1] border-[#C5A069]"
                              : "bg-white border-[#EADFD5]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id={`item-${item.id}`}
                              checked={sel.selected}
                              onChange={(e) => {
                                setSelectedReturnItems({
                                  ...selectedReturnItems,
                                  [item.id]: { ...sel, selected: e.target.checked },
                                });
                              }}
                              className="mt-1 h-4 w-4 rounded border-[#BCAB9B] text-[#C5A069] focus:ring-[#C5A069]"
                            />
                            <div className="flex-1">
                              <label htmlFor={`item-${item.id}`} className="font-semibold text-[#241D1B] cursor-pointer block">
                                {item.productNameSnapshot}
                              </label>
                              <p className="text-[11px] text-[#7A6458]">{item.variantSnapshot}</p>
                              <p className="text-[11px] text-[#241D1B] font-mono mt-0.5">
                                Kupiono: {item.quantity} szt. • Cena: {item.unitPriceSnapshot.toFixed(2)} zł
                              </p>

                              {sel.selected && (
                                <div className="mt-3 pt-3 border-t border-[#EADFD5] grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] text-[#7A6458] block mb-1">
                                      Liczba zwracanych sztuk:
                                    </label>
                                    <select
                                      value={sel.quantity}
                                      onChange={(e) => {
                                        setSelectedReturnItems({
                                          ...selectedReturnItems,
                                          [item.id]: { ...sel, quantity: Number(e.target.value) },
                                        });
                                      }}
                                      className="w-full bg-white border border-[#BCAB9B] px-2 py-1.5 rounded text-xs text-[#241D1B]"
                                    >
                                      {Array.from({ length: item.quantity }, (_, i) => i + 1).map((qty) => (
                                        <option key={qty} value={qty}>
                                          {qty} szt.
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-[#7A6458] block mb-1">
                                      Powód zwrotu:
                                    </label>
                                    <select
                                      value={sel.reason}
                                      onChange={(e) => {
                                        setSelectedReturnItems({
                                          ...selectedReturnItems,
                                          [item.id]: { ...sel, reason: e.target.value },
                                        });
                                      }}
                                      className="w-full bg-white border border-[#BCAB9B] px-2 py-1.5 rounded text-xs text-[#241D1B]"
                                    >
                                      <option value="Niewłaściwy rozmiar">Niewłaściwy rozmiar</option>
                                      <option value="Fason nie odpowiada">Fason nie odpowiada</option>
                                      <option value="Kolor odbiega od oczekiwań">Kolor odbiega od oczekiwań</option>
                                      <option value="Wada towaru / reklamacja">Wada towaru / reklamacja</option>
                                      <option value="Inny powód">Inny powód</option>
                                    </select>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sposób nadania zwrotu */}
                <div className="space-y-2">
                  <label className="font-semibold text-xs text-[#241D1B] block">
                    Wybierz sposób dostarczenia zwrotu:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setReturnMethod("INPOST_LOCKER")}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        returnMethod === "INPOST_LOCKER"
                          ? "bg-[#FAF6F1] border-[#C5A069] text-[#241D1B]"
                          : "border-[#EADFD5] text-[#5A483D]"
                      }`}
                    >
                      <p className="font-semibold text-xs">Paczkomat InPost</p>
                      <p className="text-[10px] text-[#7A6458] mt-0.5">Szybkie zwroty bez drukowania etykiety</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReturnMethod("COURIER")}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        returnMethod === "COURIER"
                          ? "bg-[#FAF6F1] border-[#C5A069] text-[#241D1B]"
                          : "border-[#EADFD5] text-[#5A483D]"
                      }`}
                    >
                      <p className="font-semibold text-xs">Kurier</p>
                      <p className="text-[10px] text-[#7A6458] mt-0.5">Wysyłka dowolnym kurierem na adres butiku</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReturnMethod("IN_PERSON")}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        returnMethod === "IN_PERSON"
                          ? "bg-[#FAF6F1] border-[#C5A069] text-[#241D1B]"
                          : "border-[#EADFD5] text-[#5A483D]"
                      }`}
                    >
                      <p className="font-semibold text-xs">Osobiście w Butiku</p>
                      <p className="text-[10px] text-[#7A6458] mt-0.5">Rynek 14, 55-140 Żmigród</p>
                    </button>
                  </div>
                </div>

                {/* Uwagi */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-xs text-[#241D1B] block">
                    Dodatkowe uwagi (opcjonalnie):
                  </label>
                  <textarea
                    rows={2}
                    value={customerReturnNote}
                    onChange={(e) => setCustomerReturnNote(e.target.value)}
                    placeholder="Wpisz np. numer konta do zwrotu lub informację o wymianie na inny rozmiar..."
                    className="w-full bg-[#FAF6F1] border border-[#BCAB9B] px-3 py-2 rounded-lg text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                  />
                </div>

                {/* Przycisk wysłania */}
                <div className="pt-3 border-t border-[#EADFD5] flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setReturnModalOrder(null)}
                    className="px-4 py-2 border border-[#BCAB9B] hover:bg-[#FAF6F1] text-xs rounded-lg text-[#241D1B]"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReturn}
                    className="px-6 py-2 bg-[#241D1B] hover:bg-[#3E3430] text-white text-xs uppercase tracking-wider rounded font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmittingReturn ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Zgłaszanie...</span>
                      </>
                    ) : (
                      <span>Potwierdź zwrot</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* MODAL: DANE DO PRZELEWU TRADYCYJNEGO                     */}
        {/* ═══════════════════════════════════════════════════════ */}
        {transferDetailsModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-[#BCAB9B] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#EADFD5] pb-3">
                <h3 className="font-serif text-lg font-semibold text-[#241D1B]">
                  Dane do przelewu bankowego
                </h3>
                <button
                  type="button"
                  onClick={() => setTransferDetailsModal(null)}
                  className="w-7 h-7 rounded-full hover:bg-[#EADFD5] flex items-center justify-center text-[#7A6458]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-[#5A483D] bg-[#FAF6F1] p-4 rounded-lg border border-[#EADFD5]">
                <div>
                  <span className="text-[10px] text-[#7A6458] block">Odbiorca:</span>
                  <span className="font-semibold text-[#241D1B]">{transferDetailsModal.details.recipient}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#7A6458] block">Numer konta:</span>
                  <span className="font-mono font-bold text-[#241D1B] text-sm tracking-wider">
                    {transferDetailsModal.details.accountNumber}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#7A6458] block">Kwota do zapłaty:</span>
                  <span className="font-mono font-bold text-[#C5A069] text-base">
                    {transferDetailsModal.details.amount.toFixed(2)} zł
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#7A6458] block">Tytuł przelewu:</span>
                  <span className="font-mono font-bold text-[#241D1B]">
                    {transferDetailsModal.details.title}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-[#7A6458]">
                Prosimy o wpłatę w ciągu {transferDetailsModal.details.deadlineHours || 48} godzin. Po zaksięgowaniu wpłaty Twoje zamówienie zostanie natychmiast przekazane do realizacji.
              </p>

              <button
                type="button"
                onClick={() => setTransferDetailsModal(null)}
                className="w-full py-2.5 bg-[#241D1B] hover:bg-[#3E3430] text-white text-xs uppercase tracking-wider rounded font-medium transition-colors"
              >
                Rozumiem, zamknij
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
