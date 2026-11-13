import React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Sparkles, ArrowRight, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#FAF6F1] flex items-center justify-center py-16 sm:py-24 px-4">
        <div className="max-w-md w-full text-center bg-white border border-[#EADFD5] rounded-lg p-8 sm:p-12 shadow-sm space-y-5">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#FAF3EB] border border-[#DEBEB7] flex items-center justify-center text-[#916738]">
            <Sparkles className="w-6 h-6 text-[#C5A069]" />
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#C5A069] font-semibold">
              Błąd 404
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#241D1B] mt-1">
              Strona nie została odnaleziona
            </h1>
            <p className="text-xs sm:text-sm text-[#857670] mt-2 leading-relaxed">
              Przepraszamy, szukana strona lub produkt nie istnieje, został wyprzedany lub przeniesiony pod nowy adres.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link
              href="/katalog"
              className="px-5 py-2.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-widest font-semibold rounded flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Zobacz kolekcję</span>
            </Link>

            <Link
              href="/"
              className="px-5 py-2.5 bg-white border border-[#D8BE8E] text-[#241D1B] hover:bg-[#FAF6F1] text-xs uppercase tracking-widest font-semibold rounded flex items-center justify-center gap-2 transition-colors"
            >
              <span>Strona główna</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
