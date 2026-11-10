"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Clock,
  HeartHandshake,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default function AccountPage() {
  const router = useRouter();
  const [session, setSession] = useState<{
    isLoggedIn: boolean;
    email: string | null;
    isAdmin: boolean;
    customerName?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Referral / promo data
  const [referralCode, setReferralCode] = useState<string>("AURA-KB-15");
  const [rewardCodes, setRewardCodes] = useState<any[]>([]);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setSession(data);

      if (data.isLoggedIn && data.email) {
        // Pobierz dane poleceń dla tego użytkownika
        fetchReferrals(data.email);
      }
    } catch (e) {
      console.error("Błąd sesji:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReferrals = async (email: string) => {
    try {
      const res = await fetch(`/api/referrals/me?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const d = await res.json();
        if (d.referralCode) setReferralCode(d.referralCode);
        if (d.rewardCodes) setRewardCodes(d.rewardCodes);
      }
    } catch (e) {
      console.error("Błąd pobierania danych poleceń:", e);
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

  const referralUrl = typeof window !== "undefined"
    ? `${window.location.origin}/?ref=${referralCode}`
    : `https://auraboutique.pl/?ref=${referralCode}`;

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

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] flex items-center justify-center bg-[#FAF6F1]">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-[#C5A069] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#7A6458]">Ładowanie konta...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Jeśli użytkownik nie jest zalogowany, przekieruj do logowania
  if (!session?.isLoggedIn) {
    return (
      <>
        <Header />
        <main
          className="flex-1 py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center"
          style={{
            backgroundColor: "#FAF6F1",
            backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
            backgroundRepeat: "repeat",
          }}
        >
          <div className="max-w-md mx-auto text-center bg-white/95 backdrop-blur-sm p-8 border border-[#BCAB9B] rounded-lg shadow-xl space-y-6">
            <User className="w-12 h-12 text-[#C5A069] mx-auto" />
            <h1 className="font-serif text-2xl text-[#241D1B]">Konto w AURA Boutique</h1>
            <p className="text-xs text-[#7A6458] leading-relaxed">
              Zaloguj się, aby uzyskać dostęp do swoich rabatów, kodów poleceń dla przyjaciółek oraz historii zamówień.
            </p>
            <div className="pt-2 space-y-3">
              <Link
                href="/logowanie"
                className="w-full py-3 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 rounded shadow transition-colors"
              >
                <span>Przejdź do logowania</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="block text-xs text-[#7A6458] hover:text-[#241D1B]"
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
      <main
        className="flex-1 py-10 sm:py-16"
        style={{
          backgroundColor: "#FAF6F1",
          backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
          backgroundRepeat: "repeat",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Górny pasek powitalny */}
          <div className="bg-white/95 backdrop-blur-sm p-6 sm:p-8 border border-[#BCAB9B] rounded-lg shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#EADFD5] border-2 border-[#C5A069] flex items-center justify-center text-[#241D1B] font-serif text-xl font-bold">
                {isOwner ? "👑" : session.email?.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-xl sm:text-2xl text-[#241D1B]">
                    {isOwner ? "Witaj, Właścicielko Butiku!" : "Witaj w AURA Boutique"}
                  </h1>
                  {isOwner && (
                    <span className="px-2 py-0.5 bg-[#FFF2DE] text-[#8C6418] border border-[#E8CD9B] text-[10px] font-bold uppercase rounded-full">
                      Administrator
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#7A6458] mt-0.5">
                  Zalogowano jako: <strong className="text-[#241D1B]">{session.email}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-[#BCAB9B] text-xs text-[#241D1B] hover:bg-[#F3ECE2] transition-colors rounded flex items-center justify-center gap-1.5 font-medium ml-auto sm:ml-0"
              >
                <LogOut className="w-3.5 h-3.5 text-[#8C7248]" />
                <span>Wyloguj się</span>
              </button>
            </div>
          </div>

          {/* DEDYKOWANA KARTA WŁAŚCICIELKI (dla aurazmigrod@wp.pl) */}
          {isOwner && (
            <div className="bg-gradient-to-r from-[#241D1B] to-[#3B2C27] text-white p-6 sm:p-8 rounded-lg shadow-xl border-2 border-[#C5A069] space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-[#E0C08B]" />
                    <h2 className="font-serif text-xl sm:text-2xl text-[#FAF2EB] font-bold tracking-wide">
                      Panel Zarządzania Właścicielki Butiku
                    </h2>
                  </div>
                  <p className="text-xs text-[#D8CECA] max-w-2xl leading-relaxed">
                    Jesteś zalogowana na główne konto administracyjne. Masz pełny dostęp do bazy produktów, stanów magazynowych, zamówień klientek, kodów rabatowych, programu poleceń oraz edycji Regulaminu i RODO.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                  <Link
                    href="/admin"
                    className="px-6 py-3.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-[0.2em] font-bold rounded shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span>Otwórz Panel Właścicielki</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/zmien-haslo"
                    className="px-4 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5 font-medium"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#E0C08B]" />
                    <span>Zmień hasło</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* SEKACJA PROGRAMU POLECEŃ & KODÓW RABATOWYCH */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Lewa kolumna: Twój program poleceń */}
            <div className="lg:col-span-7 bg-white/95 backdrop-blur-sm p-6 sm:p-8 border border-[#BCAB9B] rounded-lg shadow-sm space-y-6">
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
                <label className="text-xs font-semibold text-[#241D1B] block">
                  Twój unikalny kod polecający:
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#FAF6F1] border-2 border-dashed border-[#C5A069] px-4 py-2.5 font-mono text-sm font-bold text-[#241D1B] tracking-wider text-center rounded">
                    {referralCode}
                  </div>
                  <button
                    onClick={() => copyToClipboard(referralCode, false)}
                    className="px-4 py-2.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-wider rounded font-medium flex items-center gap-1.5 transition-colors shrink-0"
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
                    value={referralUrl}
                    className="flex-1 bg-[#FAF6F1] border border-[#BCAB9B] px-3 py-2 text-xs text-[#5A483D] rounded truncate font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(referralUrl, true)}
                    className="px-4 py-2 bg-[#241D1B] hover:bg-[#3E3430] text-white text-xs uppercase tracking-wider rounded font-medium flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? "Skopiowano" : "Kopiuj link"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Prawa kolumna: Twoje aktywne rabaty i kody nagród */}
            <div className="lg:col-span-5 bg-white/95 backdrop-blur-sm p-6 sm:p-8 border border-[#BCAB9B] rounded-lg shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-[#EADFD5] pb-4">
                <Tag className="w-5 h-5 text-[#C5A069]" />
                <h2 className="font-serif text-lg text-[#241D1B] font-semibold">
                  Twoje Kody Rabaty
                </h2>
              </div>

              <div className="space-y-3">
                {rewardCodes.length === 0 ? (
                  <div className="p-6 text-center bg-[#FAF6F1] border border-[#EADFD5] rounded space-y-2">
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
                      className="p-3 bg-[#FAF6F1] border border-[#EADFD5] rounded flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-mono font-bold text-[#241D1B] tracking-wide">
                          {code.code}
                        </div>
                        <div className="text-[10px] text-[#7A6458]">
                          Zniżka {code.discountPercent}% • Ważny do: {new Date(code.validUntil).toLocaleDateString("pl-PL")}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        code.isUsed
                          ? "bg-gray-100 text-gray-600"
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {code.isUsed ? "Wykorzystany" : "Aktywny"}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 bg-[#F5ECE1]/60 border border-[#E0D3C3] rounded text-[11px] text-[#5A483D] space-y-1">
                <p className="font-semibold text-[#241D1B] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A069]" />
                  <span>Darmowa dostawa od 300 zł</span>
                </p>
                <p>
                  Pamiętaj, że dla zamówień powyżej 300 zł dostawa Paczkomatem InPost i Kurierem jest zawsze całkowicie darmowa!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

