"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
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
import {
  PasswordLengthIndicator,
  PasswordMatchIndicator,
  getPasswordValidationState,
} from "@/components/ui/LivePasswordValidation";

function AuthForms() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/konto";

  const initialTab = searchParams.get("tab") === "forgot" ? "forgot" : searchParams.get("tab") === "register" ? "register" : "login";
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot">(initialTab);

  // Aktywna sesja
  const [currentSessionEmail, setCurrentSessionEmail] = useState<string | null>(null);

  // Logowanie
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [emailFieldError, setEmailFieldError] = useState<string | null>(null);
  const [passwordFieldError, setPasswordFieldError] = useState<string | null>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Sprawdź czy użytkownik ma już aktywną sesję
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.isLoggedIn && data.email) {
          setCurrentSessionEmail(data.email);
        } else {
          setCurrentSessionEmail(null);
        }
      })
      .catch(() => { });
  }, []);

  // Przypomnienie / Reset hasła (dla klientek i właścicielki)
  const [forgotEmail, setForgotEmail] = useState(searchParams.get("email") || "");
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotCode, setForgotCode] = useState(searchParams.get("token") || searchParams.get("code") || "");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Obsługa parametrów linku odzyskiwania dostępu (?token=...&email=...)
  useEffect(() => {
    const token = searchParams.get("token") || searchParams.get("code");
    const emailParam = searchParams.get("email");
    const tabParam = searchParams.get("tab");

    if (token) {
      setActiveTab("forgot");
      setForgotStep(2);
      setForgotCode(token);
      if (emailParam) {
        setForgotEmail(emailParam);
      }
      setForgotSuccess("Zweryfikowano jednorazowy link odzyskiwania dostępu. Wprowadź poniżej swoje nowe, prywatne hasło.");
    } else if (tabParam === "forgot") {
      setActiveTab("forgot");
      if (emailParam) {
        setForgotEmail(emailParam);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Rejestracja nowego konta
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [isRegLoading, setIsRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Weryfikacja e-mail po rejestracji
  const [registeredPendingEmail, setRegisteredPendingEmail] = useState<string | null>(null);
  const [pendingEmailSent, setPendingEmailSent] = useState<boolean>(true);
  const [resendVerificationCooldown, setResendVerificationCooldown] = useState(0);
  const [resendVerificationLoading, setResendVerificationLoading] = useState(false);
  const [resendVerificationSuccess, setResendVerificationSuccess] = useState<string | null>(null);
  const [resendVerificationError, setResendVerificationError] = useState<string | null>(null);

  // Zmiana adresu e-mail przed weryfikacją (poprawka literówki)
  const [isEditingPendingEmail, setIsEditingPendingEmail] = useState(false);
  const [newPendingEmail, setNewPendingEmail] = useState("");
  const [isChangeEmailLoading, setIsChangeEmailLoading] = useState(false);
  const [changeEmailError, setChangeEmailError] = useState<string | null>(null);

  // Integracja Google OAuth
  const [isGoogleEnabled, setIsGoogleEnabled] = useState(false);
  const [googleLinkNotice, setGoogleLinkNotice] = useState(false);

  useEffect(() => {
    fetch("/api/auth/google/status")
      .then((r) => r.json())
      .then((d) => {
        if (d.enabled) setIsGoogleEnabled(true);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (searchParams.get("googleLinkPending") === "1") {
      setGoogleLinkNotice(true);
      setActiveTab("login");
      const em = searchParams.get("email");
      if (em) setLoginEmail(em);
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendVerificationCooldown <= 0) return;
    const t = setInterval(() => {
      setResendVerificationCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [resendVerificationCooldown]);



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
        if (data.retryAfterSeconds) {
          setResendCooldown(data.retryAfterSeconds);
        }
        throw new Error(data.error || "Wystąpił błąd podczas generowania kodu.");
      }

      setForgotSuccess("Jeśli konto z podanym adresem istnieje, otrzymasz wiadomość z instrukcją resetowania hasła.");
      setForgotCode("");
      setForgotStep(2);
      setResendCooldown(data.cooldownSeconds || 60);
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

    const forgotValidation = getPasswordValidationState(forgotNewPassword, forgotConfirmPassword, 8);
    if (!forgotValidation.isValid) {
      setForgotError(forgotValidation.reason);
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
          newPassword: forgotNewPassword,
          confirmPassword: forgotConfirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas zmiany hasła.");
      }

      setForgotSuccess("Hasło zostało zmienione. Możesz się zalogować.");
      setLoginEmail(forgotEmail.trim());
      setLoginPassword(forgotNewPassword);
    } catch (err: any) {
      setForgotError(err.message || "Błąd resetowania hasła.");
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setEmailFieldError(null);
    setPasswordFieldError(null);

    const emailTrimmed = loginEmail.trim();
    const passwordTrimmed = loginPassword.trim();

    // 1. Walidacja po stronie klienta
    let hasValidationError = false;

    if (!emailTrimmed) {
      setEmailFieldError("Podaj adres e-mail.");
      hasValidationError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrimmed)) {
        setEmailFieldError("Wpisz poprawny adres e-mail (np. twoj-email@domena.pl).");
        hasValidationError = true;
      }
    }

    if (!passwordTrimmed) {
      setPasswordFieldError("Podaj hasło dostępowe.");
      hasValidationError = true;
    }

    if (hasValidationError) {
      return;
    }

    setIsLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailTrimmed, password: passwordTrimmed }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error("NETWORK_OR_SERVER_ERROR");
      }

      if (!res.ok) {
        if (res.status === 429) {
          setLoginError(data?.error || "Zbyt wiele nieudanych prób logowania. Odczekaj chwilę przed kolejną próbą.");
        } else if (res.status === 400 && data?.field) {
          if (data.field === "email") {
            setEmailFieldError(data.error);
          } else if (data.field === "password") {
            setPasswordFieldError(data.error);
          } else {
            setLoginError(data.error);
          }
        } else if (res.status === 401) {
          // Dla błędnego hasła lub nieistniejącego konta ten sam komunikat
          setLoginError("Nieprawidłowy adres e-mail lub hasło. Spróbuj ponownie.");
          // Zachowujemy e-mail, czyścimy tylko hasło i przenosimy fokus
          setLoginPassword("");
          setTimeout(() => passwordInputRef.current?.focus(), 50);
        } else if (res.status >= 500) {
          setLoginError("Nie udało się połączyć. Spróbuj ponownie za chwilę.");
        } else {
          setLoginError(data?.error || "Nieprawidłowy adres e-mail lub hasło. Spróbuj ponownie.");
        }
        return;
      }

      if (!data || !data.success) {
        setLoginError("Nieprawidłowy adres e-mail lub hasło. Spróbuj ponownie.");
        return;
      }

      // Powiadomienie nagłówka i innych komponentów o zmianie sesji
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth-change"));
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
      setLoginError("Nie udało się połączyć. Spróbuj ponownie za chwilę.");
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

    const regValidation = getPasswordValidationState(regPassword, regConfirmPassword, 8);
    if (!regValidation.isValid) {
      setRegError(regValidation.reason);
      return;
    }

    setIsRegLoading(true);

    try {
      const returnUrl = searchParams.get("returnUrl") || "/konto";
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: regFirstName.trim(),
          lastName: regLastName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          password: regPassword,
          confirmPassword: regConfirmPassword,
          newsletterConsent,
          returnUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Błąd podczas rejestracji.");
      }

      setRegisteredPendingEmail(regEmail.trim());
      setPendingEmailSent(data.emailSent !== false);
      setResendVerificationCooldown(60);
      setRegSuccess(null);
    } catch (err: any) {
      setRegError(err.message || "Wystąpił problem podczas rejestracji.");
    } finally {
      setIsRegLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!registeredPendingEmail || resendVerificationCooldown > 0) return;
    setResendVerificationLoading(true);
    setResendVerificationError(null);
    setResendVerificationSuccess(null);
    try {
      const returnUrl = searchParams.get("returnUrl") || "/konto";
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredPendingEmail, returnUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Nie udało się ponownie wysłać wiadomości.");
      }
      setPendingEmailSent(true);
      setResendVerificationSuccess("Wysłaliśmy nowy link potwierdzający. Sprawdź swoją skrzynkę.");
      setResendVerificationCooldown(data.cooldownSeconds || 60);
    } catch (err: any) {
      setResendVerificationError(err.message || "Błąd wysyłki e-mail.");
    } finally {
      setResendVerificationLoading(false);
    }
  };

  const handleChangePendingEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeredPendingEmail || !newPendingEmail.trim()) return;
    setIsChangeEmailLoading(true);
    setChangeEmailError(null);
    try {
      const returnUrl = searchParams.get("returnUrl") || "/konto";
      const res = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldEmail: registeredPendingEmail,
          newEmail: newPendingEmail.trim(),
          returnUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Nie udało się zmienić adresu e-mail.");
      }
      setRegisteredPendingEmail(data.email || newPendingEmail.trim().toLowerCase());
      setPendingEmailSent(data.emailSent !== false);
      setIsEditingPendingEmail(false);
      setNewPendingEmail("");
      setResendVerificationCooldown(60);
      setResendVerificationSuccess("Adres został zmieniony. Wysłaliśmy nowy link potwierdzający.");
    } catch (err: any) {
      setChangeEmailError(err.message || "Błąd aktualizacji adresu e-mail.");
    } finally {
      setIsChangeEmailLoading(false);
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
              : "Wpisz adres e-mail przypisany do Twojego konta, aby zresetować hasło."}
        </p>
      </div>

      {/* Informacja o istniejącej sesji, jeśli użytkownik jest już zalogowany */}
      {currentSessionEmail && (
        <div className="mb-4 p-3 bg-amber-50/90 border border-amber-200/80 rounded-xs text-xs text-amber-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#C5A069] shrink-0" />
            <span>
              Jesteś już zalogowana jako <strong>{currentSessionEmail}</strong>.
            </span>
          </div>
          <Link
            href="/konto"
            className="text-[#8C6B38] font-semibold hover:underline shrink-0"
          >
            Przejdź do konta &rarr;
          </Link>
        </div>
      )}

      {/* Przełącznik zakładek (Zaloguj się / Zarejestruj się) */}
      <div className="flex bg-[#EFE6DC] p-1 rounded-md mb-4 border border-[#E0D3C3]">
        <button
          type="button"
          onClick={() => setActiveTab("login")}
          className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 ${activeTab === "login"
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
          className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 ${activeTab === "register"
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
            {googleLinkNotice && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#C5A069] shrink-0 mt-0.5" />
                <span>
                  Konto z tym adresem e-mail już istnieje. Zaloguj się hasłem, aby bezpiecznie powiązać je z kontem Google.
                </span>
              </div>
            )}

            {isGoogleEnabled && (
              <div className="mb-2">
                <a
                  href={`/api/auth/google?returnUrl=${encodeURIComponent(searchParams.get("returnUrl") || "/konto")}`}
                  className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 border border-[#EADFD5] text-[#241D1B] text-xs font-semibold rounded-xs shadow-2xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Kontynuuj z Google</span>
                </a>
                <div className="relative my-3.5 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#EADFD5]"></div>
                  </div>
                  <span className="relative bg-white px-2 text-[10px] text-[#857670] uppercase tracking-wider font-semibold">
                    lub przez e-mail
                  </span>
                </div>
              </div>
            )}

            {loginError && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3.5 bg-red-50 border border-red-200 text-red-900 text-xs rounded-xs flex items-start gap-2.5 animate-in fade-in duration-200 shadow-xs"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} noValidate className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1.5 font-semibold">
                  Adres E-mail
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="twoj-email@domena.pl"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      if (emailFieldError) setEmailFieldError(null);
                      if (loginError) setLoginError(null);
                    }}
                    aria-invalid={Boolean(emailFieldError)}
                    className={`w-full bg-[#FAF6F1] border ${emailFieldError ? "border-red-400 focus:border-red-500" : "border-[#EADFD5] focus:border-[#C5A069]"
                      } p-3 text-xs text-[#241D1B] pl-9 focus:outline-none rounded-xs font-medium transition-colors`}
                  />
                  <Mail className="w-4 h-4 text-[#8C7248] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {emailFieldError && (
                  <p role="alert" className="mt-1 text-[11px] text-red-600 font-medium">
                    {emailFieldError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1.5 font-semibold">
                  Hasło dostępowe
                </label>
                <div className="relative">
                  <input
                    ref={passwordInputRef}
                    type={showLoginPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    placeholder="Wpisz swoje hasło..."
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (passwordFieldError) setPasswordFieldError(null);
                      if (loginError) setLoginError(null);
                    }}
                    aria-invalid={Boolean(passwordFieldError)}
                    className={`w-full bg-[#FAF6F1] border ${passwordFieldError ? "border-red-400 focus:border-red-500" : "border-[#EADFD5] focus:border-[#C5A069]"
                      } p-3 text-xs text-[#241D1B] pl-9 pr-10 focus:outline-none rounded-xs font-medium transition-colors`}
                  />
                  <Lock className="w-4 h-4 text-[#8C7248] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6458] hover:text-[#241D1B] p-1"
                    aria-label={showLoginPassword ? "Ukryj hasło" : "Pokaż hasło"}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordFieldError && (
                  <p role="alert" className="mt-1 text-[11px] text-red-600 font-medium">
                    {passwordFieldError}
                  </p>
                )}
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
                  className="w-full py-3.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-[0.2em] font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 rounded-xs shadow-md cursor-pointer disabled:cursor-not-allowed"
                >
                  {isLoginLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Logowanie…</span>
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 text-white" />
                      <span>Zaloguj się do Konta</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
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
        {activeTab === "register" && registeredPendingEmail && (
          <div className="space-y-5 text-center py-2 animate-in fade-in duration-200">
            <div className="w-14 h-14 bg-amber-50 text-[#C5A069] rounded-full flex items-center justify-center mx-auto border border-amber-200">
              <Mail className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#C5A069]">
                Krok 2: Weryfikacja adresu
              </span>
              <h2 className="font-serif text-2xl text-[#241D1B] mt-1">
                Sprawdź swoją skrzynkę 📩
              </h2>
              <p className="text-xs text-[#4A3F3B] mt-2 leading-relaxed max-w-sm mx-auto">
                Aby dokończyć rejestrację i otrzymać rabat <strong>−15% na pierwsze zamówienie</strong>, potwierdź swój adres e-mail. Otwórz wiadomość od AURA Boutique i kliknij przycisk <strong>«Potwierdzam mój adres e-mail»</strong>.
              </p>
            </div>

            <div className="p-3 bg-[#FAF6F1] border border-[#EADFD5] rounded-xs text-xs text-[#5A483D]">
              <span className="text-[#857670]">Wiadomość wysłano na adres:</span>{" "}
              <strong className="text-[#241D1B] font-mono">{registeredPendingEmail}</strong>
            </div>

            {!pendingEmailSent && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xs text-xs text-red-800 text-left flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>
                  Wysyłka wiadomości nie powiodła się z powodu chwilowego błędu serwera pocztowego. Kliknij poniżej, aby spróbować ponownie.
                </span>
              </div>
            )}

            {resendVerificationSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xs text-xs text-emerald-800 text-left flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{resendVerificationSuccess}</span>
              </div>
            )}

            {resendVerificationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xs text-xs text-red-800 text-left flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{resendVerificationError}</span>
              </div>
            )}

            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xs text-xs text-amber-900 leading-relaxed text-left">
              <p className="font-semibold text-[11px] mb-1 flex items-center gap-1.5 text-amber-950">
                <span>Nie widzisz wiadomości?</span>
              </p>
              <p className="text-[11px] text-amber-900">
                Sprawdź folder <strong>SPAM</strong> oraz zakładki <strong>Oferty</strong> lub <strong>Pozostałe</strong>. Wiadomość może dotrzeć po kilku minutach.
              </p>
            </div>

            {/* Opcja poprawy adresu e-mail */}
            {isEditingPendingEmail ? (
              <form onSubmit={handleChangePendingEmail} className="p-3.5 bg-white border border-[#EADFD5] rounded-xs text-left space-y-2.5">
                <label className="block text-xs font-semibold text-[#5A483D]">
                  Wpisz poprawny adres e-mail:
                </label>
                <input
                  type="email"
                  required
                  value={newPendingEmail}
                  onChange={(e) => setNewPendingEmail(e.target.value)}
                  placeholder="twoj-poprawny-email@domena.pl"
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2 text-xs text-[#241D1B] rounded-xs focus:outline-none focus:border-[#C5A069]"
                />
                {changeEmailError && (
                  <p className="text-[11px] text-red-600 font-medium">{changeEmailError}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isChangeEmailLoading}
                    className="flex-1 py-2 bg-[#C5A069] text-white text-xs font-semibold uppercase tracking-wider rounded-xs hover:bg-[#AF884F] transition-colors cursor-pointer"
                  >
                    {isChangeEmailLoading ? "Zapisywanie..." : "Zapisz i wyślij nowy link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPendingEmail(false);
                      setChangeEmailError(null);
                    }}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-[#5A483D] text-xs font-semibold rounded-xs transition-colors cursor-pointer"
                  >
                    Anuluj
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendVerificationLoading || resendVerificationCooldown > 0}
                  className="flex-1 py-3 bg-[#FAF6F1] hover:bg-[#F3ECE4] border border-[#EADFD5] text-[#241D1B] text-xs uppercase tracking-wider font-semibold rounded-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {resendVerificationLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {resendVerificationCooldown > 0
                      ? `Wyślij ponownie (${resendVerificationCooldown}s)`
                      : "Wyślij wiadomość ponownie"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewPendingEmail(registeredPendingEmail);
                    setIsEditingPendingEmail(true);
                  }}
                  className="py-3 px-3 text-xs text-[#8C7248] hover:text-[#241D1B] font-medium underline cursor-pointer"
                >
                  Popraw adres e-mail
                </button>
              </div>
            )}

            {searchParams.get("returnUrl") && (
              <div className="pt-2 border-t border-[#EADFD5]">
                <Link
                  href={searchParams.get("returnUrl")!}
                  className="text-xs text-[#8C7248] hover:text-[#241D1B] font-medium flex items-center justify-center gap-1.5"
                >
                  <span>Wróć do kasy (dane zamówienia zostały zachowane)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "register" && !registeredPendingEmail && (
          <>
            {isGoogleEnabled && (
              <div className="mb-2">
                <a
                  href={`/api/auth/google?returnUrl=${encodeURIComponent(searchParams.get("returnUrl") || "/konto")}`}
                  className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 border border-[#EADFD5] text-[#241D1B] text-xs font-semibold rounded-xs shadow-2xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Kontynuuj z Google</span>
                </a>
                <div className="relative my-3.5 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#EADFD5]"></div>
                  </div>
                  <span className="relative bg-white px-2 text-[10px] text-[#857670] uppercase tracking-wider font-semibold">
                    lub przez e-mail
                  </span>
                </div>
              </div>
            )}

            {/* Banner z korzyścią */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xs flex items-center gap-2.5 text-xs text-amber-900">
              <Gift className="w-5 h-5 text-[#C5A069] shrink-0" />
              <div>
                <p className="font-bold text-[11px]">Prezent powitalny dla nowej Klientki!</p>
                <p className="text-[10px] text-amber-800">
                  Potwierdź adres e-mail i odbierz <strong>–15%</strong> na pierwsze zamówienie.
                </p>
              </div>
            </div>

            {regError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{regError}</span>
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
                  Numer Telefonu (opcjonalnie)
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
                  Nowe hasło *
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    placeholder="Wpisz nowe hasło..."
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] pl-9 pr-10 focus:outline-none focus:border-[#C5A069] rounded-xs font-medium"
                  />
                  <Lock className="w-4 h-4 text-[#8C7248] absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6458] hover:text-[#241D1B]"
                    title={showRegPassword ? "Ukryj hasło" : "Pokaż hasło"}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordLengthIndicator value={regPassword} minLength={8} />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1 font-semibold">
                  Powtórz nowe hasło *
                </label>
                <div className="relative">
                  <input
                    type={showRegConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Wpisz ponownie nowe hasło..."
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] pl-9 pr-10 focus:outline-none focus:border-[#C5A069] rounded-xs font-medium"
                  />
                  <Lock className="w-4 h-4 text-[#8C7248] absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6458] hover:text-[#241D1B]"
                    title={showRegConfirmPassword ? "Ukryj hasło" : "Pokaż hasło"}
                  >
                    {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordMatchIndicator password={regPassword} confirmPassword={regConfirmPassword} />
              </div>

              {/* Wymagana akceptacja regulaminu - domyślnie ODZNACZONY */}
              <div className="pt-1">
                <label className="flex items-start gap-2 text-xs text-[#5A483D] cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 accent-[#C5A069] w-4 h-4 rounded cursor-pointer"
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

              {/* Dobrowolna zgoda na newsletter - domyślnie ODZNACZONY */}
              <div className="pt-1">
                <label className="flex items-start gap-2 text-[11px] text-[#5A483D] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newsletterConsent}
                    onChange={(e) => setNewsletterConsent(e.target.checked)}
                    className="mt-0.5 accent-[#C5A069] w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="leading-snug">
                    Chcę otrzymywać e-mailem newsletter AURA Boutique z nowościami i promocjami. Zgodę mogę wycofać w każdej chwili (opcjonalnie).{" "}
                    <Link href="/polityka-prywatnosci" target="_blank" className="underline hover:text-[#C5A069]">
                      (Polityka prywatności)
                    </Link>
                    <span className="block text-[10px] text-[#857670] mt-0.5">
                      Brak zgody nie wpływa na założenie konta ani rabat −15% na pierwsze zamówienie.
                    </span>
                  </span>
                </label>
              </div>

              {/* Informacja przed rejestracją */}
              <div className="p-2.5 bg-[#FAF6F1] border border-[#EADFD5] rounded-xs text-[11px] text-[#6E5C52] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A069] shrink-0" />
                <span>
                  Po rejestracji wyślemy Ci e-mail z linkiem potwierdzającym. Rabat −15% otrzymasz po potwierdzeniu adresu.
                </span>
              </div>

              {(() => {
                const regVal = getPasswordValidationState(regPassword, regConfirmPassword, 8);
                const isSubmitDisabled = isRegLoading || !acceptTerms || !regVal.isValid;

                return (
                  <div className="pt-1 space-y-2">
                    <button
                      type="submit"
                      disabled={isSubmitDisabled}
                      className="w-full py-3.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-[0.2em] font-semibold transition-colors disabled:opacity-40 flex items-center justify-center gap-2 rounded-xs shadow-md cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isRegLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      <span>{isRegLoading ? "Tworzenie konta..." : "Zarejestruj się i Odbierz –15%"}</span>
                      {!isRegLoading && <ArrowRight className="w-4 h-4 ml-1" />}
                    </button>

                    {!regVal.isValid && (
                      <p className="text-[11px] text-amber-800 text-center">
                        {regVal.reason}
                      </p>
                    )}
                    {regVal.isValid && !acceptTerms && (
                      <p className="text-[11px] text-amber-800 text-center">
                        Zaznacz wymaganą zgodę na Regulamin i Politykę Prywatności.
                      </p>
                    )}
                  </div>
                );
              })()}
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
                  Wyślemy instrukcję zmiany hasła na adres przypisany do Twojego konta.
                </p>
              </div>
            </div>

            {forgotError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-md text-center space-y-3.5 my-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="font-serif text-base font-semibold text-emerald-950">
                  Hasło zostało zmienione. Możesz się zalogować
                </h3>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Twoje nowe hasło dostępowe zostało pomyślnie zaktualizowane w systemie AURA Boutique.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("login");
                      setForgotStep(1);
                      setForgotSuccess(null);
                    }}
                    className="w-full py-3.5 bg-[#241D1B] hover:bg-[#3E3835] text-white text-xs uppercase tracking-wider font-semibold rounded transition-colors shadow-sm cursor-pointer"
                  >
                    Przejdź do logowania
                  </button>
                </div>
              </div>
            ) : (
              <>
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
                          placeholder="twoj-email@domena.pl"
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
                        {forgotEmail || "Konto właścicielki / klientki"}
                      </div>
                    </div>

                    {forgotCode && forgotCode.length > 6 ? (
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1 font-semibold">
                          Jednorazowy token autoryzacyjny:
                        </label>
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-900 rounded-xs flex items-center justify-between">
                          <span className="truncate max-w-[260px]">{forgotCode}</span>
                          <span className="text-[10px] font-sans font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded shrink-0">
                            Zweryfikowany
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1.5 font-semibold">
                          6-cyfrowy kod weryfikacyjny *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={64}
                          placeholder="Wpisz 6-cyfrowy kod..."
                          value={forgotCode}
                          onChange={(e) => setForgotCode(e.target.value)}
                          className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-3 text-sm font-mono tracking-widest text-[#241D1B] text-center focus:outline-none focus:border-[#C5A069] rounded-xs font-bold"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1.5 font-semibold">
                        Nowe hasło dostępowe *
                      </label>
                      <div className="relative">
                        <input
                          type={showForgotNewPassword ? "text" : "password"}
                          required
                          placeholder="Wpisz nowe bezpieczne hasło..."
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-3 text-xs text-[#241D1B] pl-9 pr-10 focus:outline-none focus:border-[#C5A069] rounded-xs font-medium"
                        />
                        <Lock className="w-4 h-4 text-[#8C7248] absolute left-3 top-1/2 -translate-y-1/2" />
                        <button
                          type="button"
                          onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6458] hover:text-[#241D1B]"
                          title={showForgotNewPassword ? "Ukryj hasło" : "Pokaż hasło"}
                        >
                          {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <PasswordLengthIndicator value={forgotNewPassword} minLength={8} />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1.5 font-semibold">
                        Powtórz nowe hasło *
                      </label>
                      <div className="relative">
                        <input
                          type={showForgotConfirmPassword ? "text" : "password"}
                          required
                          placeholder="Powtórz nowe hasło..."
                          value={forgotConfirmPassword}
                          onChange={(e) => setForgotConfirmPassword(e.target.value)}
                          className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-3 text-xs text-[#241D1B] pl-9 pr-10 focus:outline-none focus:border-[#C5A069] rounded-xs font-medium"
                        />
                        <Lock className="w-4 h-4 text-[#8C7248] absolute left-3 top-1/2 -translate-y-1/2" />
                        <button
                          type="button"
                          onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6458] hover:text-[#241D1B]"
                          title={showForgotConfirmPassword ? "Ukryj hasło" : "Pokaż hasło"}
                        >
                          {showForgotConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <PasswordMatchIndicator password={forgotNewPassword} confirmPassword={forgotConfirmPassword} />
                    </div>

                    {(() => {
                      const forgotVal = getPasswordValidationState(forgotNewPassword, forgotConfirmPassword, 8);
                      const isSubmitDisabled = isForgotLoading || !forgotVal.isValid || !forgotCode.trim();

                      return (
                        <div className="pt-2 space-y-2">
                          <button
                            type="submit"
                            disabled={isSubmitDisabled}
                            className="w-full py-3.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-[0.2em] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-xs shadow-md cursor-pointer"
                          >
                            {isForgotLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            <span>{isForgotLoading ? "Zapisywanie..." : "Zapisz Nowe Hasło"}</span>
                          </button>

                          {!forgotVal.isValid && (
                            <p className="text-[11px] text-amber-800 text-center">
                              {forgotVal.reason}
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        disabled={resendCooldown > 0 || isForgotLoading}
                        onClick={handleRequestResetCode}
                        className="text-xs text-[#8C7248] hover:text-[#241D1B] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:underline"
                      >
                        {resendCooldown > 0
                          ? `Wyślij kod ponownie (${resendCooldown}s)`
                          : "Wyślij kod ponownie"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setForgotStep(1)}
                        className="text-xs text-[#7A6458] hover:text-[#241D1B] hover:underline"
                      >
                        Zmień adres e-mail
                      </button>
                    </div>
                  </form>
                )}
              </>
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
