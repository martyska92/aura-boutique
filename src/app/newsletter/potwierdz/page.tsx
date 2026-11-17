"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

function NewsletterConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmedEmail, setConfirmedEmail] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Brak tokenu potwierdzającego. Upewnij się, że używasz pełnego linku z otrzymanej wiadomości e-mail.");
      return;
    }

    fetch(`/api/newsletter/confirm?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setConfirmedEmail(data.email || "");
        } else {
          setStatus("error");
          setErrorMessage(data.error || "Link potwierdzający wygasł lub został już wcześniej wykorzystany.");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMessage("Wystąpił błąd połączenia z serwerem. Spróbuj ponownie za chwilę.");
      });
  }, [token]);

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-lg border border-[#EADFD5] shadow-sm text-center space-y-6">
      {status === "loading" && (
        <div className="py-12 space-y-4">
          <Loader2 className="w-10 h-10 text-[#C5A069] animate-spin mx-auto" />
          <h1 className="font-serif text-xl text-[#241D1B]">Weryfikujemy Twój zapis...</h1>
          <p className="text-xs text-[#7A6458]">Chwileczkę, trwa potwierdzanie adresu w bazie butiku AURA.</p>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-4 py-4 animate-in fade-in duration-200">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-2xl text-[#241D1B]">Dziękujemy! Zapis został potwierdzony</h1>
          <p className="text-xs text-[#554D47] leading-relaxed">
            Twój adres <strong className="text-[#241D1B]">{confirmedEmail}</strong> został pomyślnie zapisany do newslettera AURA Boutique.
          </p>
          <div className="bg-[#FAF6F1] border border-[#DFCA9B] rounded p-3 text-[11px] text-[#7A6458]">
            Będziemy informować Cię o nowych kolekcjach, limitowanych dropach i ekskluzywnych kodach rabatowych.
          </div>
          <div className="pt-4">
            <Link
              href="/katalog"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-wider font-semibold rounded transition-colors"
            >
              <span>Przejdź do kolekcji butiku</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4 py-4 animate-in fade-in duration-200">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-xl text-[#241D1B]">Nie udało się potwierdzić zapisu</h1>
          <p className="text-xs text-rose-700 leading-relaxed bg-rose-50 border border-rose-200 p-3 rounded">
            {errorMessage}
          </p>
          <div className="pt-4 flex flex-col gap-2">
            <Link
              href="/konto"
              className="inline-block w-full py-2.5 bg-[#FAF6F1] hover:bg-[#F0E6DC] text-[#241D1B] border border-[#EADFD5] text-xs font-semibold rounded transition-colors"
            >
              Przejdź do profilu klientki
            </Link>
            <Link
              href="/"
              className="inline-block w-full py-2.5 text-xs text-[#7A6458] hover:text-[#241D1B] transition-colors"
            >
              Wróć na stronę główną
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewsletterConfirmPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F1]">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Suspense fallback={
          <div className="p-12 text-center text-xs text-[#857670]">
            <Loader2 className="w-8 h-8 text-[#C5A069] animate-spin mx-auto mb-2" />
            Ładowanie parametrów weryfikacji…
          </div>
        }>
          <NewsletterConfirmContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
