"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, Copy, Check, ShoppingBag, Sparkles } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const returnUrl = searchParams.get("returnUrl") || "/konto";

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [welcomeCode, setWelcomeCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Brak tokenu weryfikacyjnego w adresie linku.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Weryfikacja nie powiodła się.");
        }
        setSuccess(true);
        if (data.welcomeCoupon) {
          setWelcomeCode(data.welcomeCoupon);
        }
      } catch (err: any) {
        setError(err.message || "Wystąpił problem podczas weryfikacji adresu e-mail.");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  const copyCode = () => {
    if (!welcomeCode) return;
    navigator.clipboard.writeText(welcomeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCheckoutReturn = returnUrl.includes("/zamowienie");

  return (
    <div className="max-w-md w-full mx-auto bg-white border border-[#EADFD5] p-6 sm:p-8 rounded-2xl shadow-xs text-center my-8 sm:my-12">
      {loading && (
        <div className="py-12 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#C5A069] mx-auto" />
          <h1 className="font-serif text-xl text-[#241D1B]">Potwierdzanie adresu e-mail…</h1>
          <p className="text-xs text-[#857670]">Prosimy o chwilę cierpliwości.</p>
        </div>
      )}

      {!loading && success && (
        <div className="space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#C5A069]">
              Rejestracja zakończona
            </span>
            <h1 className="font-serif text-2xl text-[#241D1B] mt-1">
              Adres potwierdzony!
            </h1>
            <p className="text-xs text-[#4A3F3B] mt-2 leading-relaxed">
              Dziękujemy za potwierdzenie adresu e-mail. Twój rabat <strong>−15% na pierwsze zakupy</strong> jest już dostępny!
            </p>
          </div>

          {welcomeCode && (
            <div className="p-4 bg-[#FAF6F1] border border-[#EADFD5] rounded-xl space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-xs text-[#8C7248] font-medium">
                <Sparkles className="w-4 h-4 text-[#C5A069]" />
                <span>Twój indywidualny kod powitalny:</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-base font-bold text-[#241D1B] tracking-wider bg-white px-3 py-1.5 border border-[#EADFD5] rounded-md shadow-2xs">
                  {welcomeCode}
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="p-2 text-xs bg-white border border-[#EADFD5] rounded-md hover:bg-gray-50 text-[#5A483D] flex items-center gap-1 cursor-pointer"
                  title="Skopiuj kod"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-[#857670]">
                Wpisz ten kod w koszyku lub kasie, aby odliczyć −15% od wartości zamówienia.
              </p>
            </div>
          )}

          <div className="pt-2 space-y-2.5">
            {isCheckoutReturn ? (
              <Link
                href={`${returnUrl}${returnUrl.includes("?") ? "&" : "?"}appliedWelcomeCode=${welcomeCode || ""}`}
                className="w-full py-3.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-[0.2em] font-semibold transition-colors flex items-center justify-center gap-2 rounded-xl shadow-md"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Wróć do zamówienia i nalicz −15%</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/konto"
                className="w-full py-3.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-[0.2em] font-semibold transition-colors flex items-center justify-center gap-2 rounded-xl shadow-md"
              >
                <span>Przejdź do Mojego Konta</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <Link
              href="/"
              className="block text-xs text-[#8C7248] hover:text-[#241D1B] font-medium py-1"
            >
              Wróć na stronę główną butiku
            </Link>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-100">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div>
            <h1 className="font-serif text-2xl text-[#241D1B]">Nieudana weryfikacja</h1>
            <p className="text-xs text-red-700 mt-2 bg-red-50 p-3 rounded-xl border border-red-200 text-left">
              {error}
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            <Link
              href="/logowanie"
              className="w-full py-3 bg-[#241D1B] hover:bg-[#3D332F] text-white text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2 rounded-xl shadow-xs"
            >
              <span>Zaloguj się lub ponów rejestrację</span>
            </Link>
            <Link
              href="/"
              className="block text-xs text-[#8C7248] hover:text-[#241D1B] font-medium py-1"
            >
              Wróć do sklepu
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F1]">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <Suspense fallback={<div className="p-12 text-center text-xs text-[#857670]">Ładowanie…</div>}>
          <VerifyEmailContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
