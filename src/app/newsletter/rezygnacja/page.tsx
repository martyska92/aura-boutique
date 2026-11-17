"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

function NewsletterUnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [unsubscribedEmail, setUnsubscribedEmail] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Brak tokenu rezygnacji w adresie URL.");
      return;
    }

    fetch(`/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setUnsubscribedEmail(data.email || "");
        } else {
          setStatus("error");
          setErrorMessage(data.error || "Wystąpił błąd podczas rezygnacji.");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMessage("Wystąpił problem z połączeniem.");
      });
  }, [token]);

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-lg border border-[#EADFD5] shadow-sm text-center space-y-6">
      {status === "loading" && (
        <div className="py-12 space-y-4">
          <Loader2 className="w-10 h-10 text-[#C5A069] animate-spin mx-auto" />
          <h1 className="font-serif text-xl text-[#241D1B]">Przetwarzanie rezygnacji...</h1>
          <p className="text-xs text-[#7A6458]">Zapisujemy wycofanie zgody w bazie butiku AURA.</p>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-4 py-4 animate-in fade-in duration-200">
          <div className="w-14 h-14 bg-[#FAF6F1] text-[#8C7248] rounded-full flex items-center justify-center mx-auto border border-[#EADFD5]">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-2xl text-[#241D1B]">Subskrypcja została anulowana</h1>
          <p className="text-xs text-[#554D47] leading-relaxed">
            Twój adres <strong className="text-[#241D1B]">{unsubscribedEmail}</strong> został pomyślnie wypisany z newslettera AURA Boutique.
          </p>
          <p className="text-[11px] text-[#7A6458] leading-relaxed">
            Nie będziesz już otrzymywać od nas wiadomości marketingowych. W każdej chwili możesz ponownie dołączyć do newslettera w profilu klientki.
          </p>
          <div className="pt-4">
            <Link
              href="/"
              className="inline-block w-full py-3 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-wider font-semibold rounded transition-colors"
            >
              Powrót do butiku AURA
            </Link>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4 py-4 animate-in fade-in duration-200">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-xl text-[#241D1B]">Błąd rezygnacji</h1>
          <p className="text-xs text-rose-700 leading-relaxed bg-rose-50 border border-rose-200 p-3 rounded">
            {errorMessage}
          </p>
          <div className="pt-4">
            <Link
              href="/"
              className="inline-block w-full py-2.5 bg-[#FAF6F1] hover:bg-[#F0E6DC] text-[#241D1B] border border-[#EADFD5] text-xs font-semibold rounded transition-colors"
            >
              Powrót do butiku
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewsletterUnsubscribePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F1]">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Suspense fallback={
          <div className="p-12 text-center text-xs text-[#857670]">
            <Loader2 className="w-8 h-8 text-[#C5A069] animate-spin mx-auto mb-2" />
            Weryfikacja parametrów rezygnacji…
          </div>
        }>
          <NewsletterUnsubscribeContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
