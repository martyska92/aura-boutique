"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  ArrowRight,
  AlertCircle,
  Sparkles,
  UserPlus,
  Phone,
  Gift,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

function AuthForms() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/konto";

  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot">("login");

  // Logowanie
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Przypomnienie / Reset hasła (dla klientek i właścicielki)
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  // Rejestracja nowego konta
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [isRegLoading, setIsRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const isOwnerEmail = loginEmail.trim().toLowerCase() === "aurazmigrod@wp.pl";

  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);
    setIsForgotLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas generowania kodu.");
      }

      setForgotSuccess(data.message || "Kod weryfikacyjny został wygenerowany!");
      if (data.code) {
        setForgotCode(data.code);
      }
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err.message || "Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (forgotNewPassword.trim().length < 4) {
      setForgotError("Nowe hasło musi zawierać co najmniej 4 znaki.");
      return;
    }

    setIsForgotLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          code: forgotCode.trim(),
          newPassword: forgotNewPassword.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas zmiany hasła.");
      }

      setForgotSuccess(data.message || "Hasło zostało pomyślnie zmienione!");
      setLoginEmail(forgotEmail.trim());
      setLoginPassword(forgotNewPassword.trim());
      setTimeout(() => {
        setActiveTab("login");
        setForgotStep(1);
        setForgotSuccess(null);
      }, 1500);
    } catch (err: any) {
      setForgotError(err.message || "Błąd resetowania hasła.");
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Błąd podczas logowania.");
      }

      if (data.mustChangePassword) {
        router.push("/zmien-haslo");
      } else if (data.isAdmin) {
        router.push(redirectUrl.startsWith("/admin") ? redirectUrl : "/admin");
      } else {
        router.push(redirectUrl);
      }
      router.refresh();
    } catch (err: any) {
      setLoginError(err.message || "Wystąpił problem z połączeniem.");
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!acceptTerms) {
      setRegError("Prosimy o zaakceptowanie Regulaminu sklepu.");
      return;
    }

    if (regPassword.length < 6) {
      setRegError("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }

    setIsRegLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: regFirstName.trim(),
          lastName: regLastName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          password: regPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Błąd podczas rejestracji.");
      }

      setRegSuccess(data.message || "Konto zostało pomyślnie utworzone!");
      setTimeout(() => {
        router.push("/konto");
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setRegError(err.message || "Wystąpił problem podczas rejestracji.");
    } finally {
      setIsRegLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto">
      {/* Tytuł */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="font-serif text-2xl sm:text-3xl text-[#241D1B]">
          {activeTab === "login"
            ? "Zaloguj się do Butiku"
            : activeTab === "register"
            ? "Dołącz do AURA Boutique"
            : "Przypomnij lub Zresetuj Hasło"}
        </h1>
        <p className="text-xs text-[#857670] mt-1 font-light">
          {activeTab === "login"
            ? "Konto klientki oraz panel zarządzania butikiem AURA"
            : activeTab === "register"
            ? "Zarejestruj się i odbierz rabat –15% na pierwsze zamówienie"
            : "Dla klientek butiku oraz konta właścicielki (aurazmigrod@wp.pl)"}
        </p>
      </div>

      {/* Przełącznik zakładek (Zaloguj się / Zarejestruj się) */}
      <div className="flex bg-[#EFE6DC] p-1 rounded-md mb-4 border border-[#E0D3C3]">
        <button
          type="button"
          onClick={() => setActiveTab("login")}
          className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "login"
              ? "bg-white text-[#241D1B] shadow-xs border border-[#D1BEB0]"
              : "text-[#75655E] hover:text-[#241D1B]"
          }`}
        >
          <User className="w-3.5 h-3.5 text-[#C5A069]" />
          <span>Logowanie</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("register")}
          className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "register"
              ? "bg-white text-[#241D1B] shadow-xs border border-[#D1BEB0]"
              : "text-[#75655E] hover:text-[#241D1B]"
          }`}
        >
          <UserPlus className="w-3.5 h-3.5 text-[#C5A069]" />
          <span>Nowe Konto</span>
          <span className="text-[10px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-bold">
            –15%
          </span>
        </button>
      </div>

      {/* Karta formularza */}
      <div className="bg-white p-6 sm:p-8 border border-[#EADFD5] rounded-xs shadow-md space-y-5">
        {/* ======================= FORMULARZ LOGOWANIA ======================= */}
        {activeTab === "login" && (
          <>
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1.5 font-semibold">
                  Adres E-mail
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="twoj-email@domena.pl"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-3 text-xs text-[#241D1B] pl-9 focus:outline-none focus:border-[#C5A069] rounded-xs font-medium"
                  />
                  <Mail className="w-4 h-4 text-[#8C7248] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1.5 font-semibold">
                  Hasło dostępowe
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="Wpisz swoje hasło..."
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-3 text-xs text-[#241D1B] pl-9 pr-10 focus:outline-none focus:border-[#C5A069] rounded-xs font-medium"
                  />
                  <Lock className="w-4 h-4 text-[#8C7248] absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6458] hover:text-[#241D1B]"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(loginEmail || "");
                      setActiveTab("forgot");
                    }}
                    className="text-[11px] text-[#8C7248] hover:text-[#241D1B] hover:underline"
                  >
                    Nie pamiętasz hasła?
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoginLoading}
                  className="w-full py-3.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-[0.2em] font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 rounded-xs shadow-md"
                >
                  {isLoginLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                  <span>
                    {isLoginLoading ? "Weryfikacja..." : "Zaloguj się do Konta"}
                  </span>
                  {!isLoginLoading && <ArrowRight className="w-4 h-4 ml-1" />}
                </button>
              </div>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className="text-xs text-[#8C7248] hover:text-[#241D1B] font-medium underline"
              >
                Nie masz jeszcze konta? Zarejestruj się i odbierz –15%
              </button>
            </div>

            {/* Informacje dla użytkowniczek */}
            <div className="p-3.5 bg-[#FAF6F1] border border-[#EADFD5] rounded-xs text-[11px] text-[#5A483D] space-y-1.5 leading-relaxed">
              <p className="font-semibold text-[#241D1B] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A069]" />
                <span>Wygodny dostęp dla Klientek</span>
              </p>
              <p className="text-[11px] text-[#8C6B38] font-medium">Nie wysyłamy spamu</p>
              <p>
                Wpisz swój adres e-mail, aby sprawdzić historię zamówień, kody rabatowe oraz polecać butik koleżankom.
              </p>
            </div>
          </>
        )}

        {/* ======================= FORMULARZ REJESTRACJI ======================= */}
        {activeTab === "register" && (
          <>
            {/* Banner z korzyścią */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xs flex items-center gap-2.5 text-xs text-amber-900">
              <Gift className="w-5 h-5 text-[#C5A069] shrink-0" />
              <div>
                <p className="font-bold text-[11px]">Prezent powitalny dla nowej Klientki!</p>
                <p className="text-[10px] text-amber-800">
                  Po rejestracji otrzymasz natychmiastowy rabat <strong>–15%</strong> na całe pierwsze zamówienie.
                </p>
              </div>
            </div>

            {regError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{regSuccess} Przekierowywanie do konta...</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1 font-semibold">
                    Imię *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="np. Anna"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1 font-semibold">
                    Nazwisko *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="np. Kowalska"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1 font-semibold">
                  Adres E-mail *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="twoj-email@domena.pl"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] pl-9 focus:outline-none focus:border-[#C5A069] rounded-xs"
                  />
                  <Mail className="w-4 h-4 text-[#8C7248] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1 font-semibold">
                  Numer Telefonu (opcjonalnie do powiadomień SMS)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="+48 000 000 000"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] pl-9 focus:outline-none focus:border-[#C5A069] rounded-xs"
                  />
                  <Phone className="w-4 h-4 text-[#8C7248] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1 font-semibold">
                  Hasło dostępowe * (min. 6 znaków)
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    placeholder="Wpisz bezpieczne hasło..."
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] pl-9 pr-10 focus:outline-none focus:border-[#C5A069] rounded-xs"
                  />
                  <Lock className="w-4 h-4 text-[#8C7248] absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6458] hover:text-[#241D1B]"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2 text-xs text-[#5A483D] cursor-pointer">
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
                      Regulamin sklepu
                    </Link>{" "}
                    oraz{" "}
                    <Link href="/polityka-prywatnosci" target="_blank" className="underline font-semibold hover:text-[#C5A069]">
                      Politykę Prywatności
                    </Link>{" "}
                    butiku AURA *
                  </span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isRegLoading}
                  className="w-full py-3.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-[0.2em] font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 rounded-xs shadow-md"
                >
                  {isRegLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>{isRegLoading ? "Tworzenie konta..." : "Zarejestruj się i Odbierz –15%"}</span>
                  {!isRegLoading && <ArrowRight className="w-4 h-4 ml-1" />}
                </button>
              </div>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className="text-xs text-[#8C7248] hover:text-[#241D1B] font-medium underline"
              >
                Masz już konto? Zaloguj się
              </button>
            </div>
          </>
        )}
        {/* ======================= FORMULARZ PRZYPOMNIENIA / RESETU HASŁA ======================= */}
        {activeTab === "forgot" && (
          <>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xs flex items-center gap-2.5 text-xs text-amber-900">
              <ShieldCheck className="w-5 h-5 text-[#C5A069] shrink-0" />
              <div>
                <p className="font-bold text-[11px]">Bezpieczne odzyskiwanie hasła</p>
                <p className="text-[10px] text-amber-800">
                  Działa zarówno dla klientek butiku, jak i konta administratora (aurazmigrod@wp.pl).
                </p>
              </div>
            </div>

            {forgotError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotStep === 1 && (
              <form onSubmit={handleRequestResetCode} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1.5 font-semibold">
                    Adres e-mail przypisany do konta *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="twoj-email@domena.pl lub aurazmigrod@wp.pl"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-3 text-xs text-[#241D1B] pl-9 focus:outline-none focus:border-[#C5A069] rounded-xs font-medium"
                    />
                    <Mail className="w-4 h-4 text-[#8C7248] absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="w-full py-3.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-[0.2em] font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 rounded-xs shadow-md"
                  >
                    {isForgotLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    <span>{isForgotLoading ? "Generowanie..." : "Pobierz Kod Resetu"}</span>
                    {!isForgotLoading && <ArrowRight className="w-4 h-4 ml-1" />}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleConfirmReset} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1 font-semibold">
                    Konto e-mail:
                  </label>
                  <div className="p-2.5 bg-[#FAF6F1] border border-[#EADFD5] text-xs font-semibold text-[#241D1B] rounded-xs">
                    {forgotEmail}
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1.5 font-semibold">
                    6-cyfrowy kod weryfikacyjny *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Wpisz 6-cyfrowy kod..."
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-3 text-sm font-mono tracking-widest text-[#241D1B] text-center focus:outline-none focus:border-[#C5A069] rounded-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1.5 font-semibold">
                    Nowe hasło dostępowe * (min. 4 znaki)
                  </label>
                  <div className="relative">
                    <input
                      type={showForgotNewPassword ? "text" : "password"}
                      required
                      placeholder="Wpisz nowe hasło..."
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-3 text-xs text-[#241D1B] pl-9 pr-10 focus:outline-none focus:border-[#C5A069] rounded-xs font-medium"
                    />
                    <Lock className="w-4 h-4 text-[#8C7248] absolute left-3 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6458] hover:text-[#241D1B]"
                    >
                      {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="w-full py-3.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-[0.2em] font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 rounded-xs shadow-md"
                  >
                    {isForgotLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>{isForgotLoading ? "Zapisywanie..." : "Zapisz Nowe Hasło"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="w-full py-2 text-xs text-[#7A6458] hover:text-[#241D1B] text-center"
                  >
                    Zmień adres e-mail
                  </button>
                </div>
              </form>
            )}

            <div className="pt-2 text-center border-t border-[#EADFD5]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setForgotStep(1);
                  setForgotError(null);
                  setForgotSuccess(null);
                }}
                className="text-xs text-[#8C7248] hover:text-[#241D1B] font-medium underline"
              >
                Pamiętasz hasło? Zaloguj się
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Header />
      {/* Tło identyczne jak na pozostałych podstronach butiku (#FAF6F1 bez ciemnego kaszmiru) */}
      <main className="flex-1 bg-[#FAF6F1] py-12 sm:py-20 px-4 sm:px-6 lg:px-8 flex flex-col justify-center border-b border-[#EADFD5]">
        <Suspense
          fallback={
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#C5A069] border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <AuthForms />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
