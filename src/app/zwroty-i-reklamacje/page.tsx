import React from "react";
import { RotateCcw, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function ReturnsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#FAF6F1] py-12 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#C5A069] font-medium">
              Obsługa Klientek
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#241D1B]">
              Zwroty i Reklamacje
            </h1>
            <p className="text-xs sm:text-sm text-[#6E6259] font-light">
              Wiemy, jak ważny jest idealny rozmiar. Masz 14 dni na przymiarkę w domowym zaciszu.
            </p>
          </div>

          <div className="bg-white p-8 sm:p-10 border border-[#EADFD5] shadow-sm rounded-sm space-y-8 text-xs sm:text-sm text-[#3E3B38] leading-relaxed">
            {/* ZWROTY */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#EADFD5]">
                <RotateCcw className="w-5 h-5 text-[#C5A069]" />
                <h2 className="font-serif text-xl text-[#241D1B]">14 Dni na Odstąpienie od Umowy</h2>
              </div>
              <p>
                Każda klientka sklepu internetowego AURA Boutique K.B. ma prawo odstąpić od umowy sprzedaży w terminie <strong>14 dni kalendarzowych</strong> od momentu odebrania przesyłki, bez podawania przyczyny.
              </p>
              
              <div className="p-4 bg-[#FAF6F1] border border-[#EADFD5] space-y-2">
                <p className="font-semibold text-[#241D1B]">Warunki przyjęcia zwrotu:</p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-[#6E6259]">
                  <li>Zwracana odzież musi być w stanie nienaruszonym (bez śladów noszenia, zapachu perfum, makijażu).</li>
                  <li>Produkt powinien posiadać komplet oryginalnych metek.</li>
                  <li>Do paczki należy dołączyć formularz zwrotu lub kartkę z numerem zamówienia i danymi do przelewu.</li>
                </ul>
              </div>
            </div>

            {/* ADRES DO WYSYŁKI */}
            <div className="space-y-3">
              <h3 className="font-serif text-base text-[#241D1B] font-semibold">
                Adres do odesłania paczki ze zwrotem:
              </h3>
              <div className="p-4 bg-[#FAF6F1] border border-[#EADFD5] font-mono text-xs text-[#241D1B] space-y-1">
                <p><strong>AURA Boutique K.B. - ZWROTY</strong></p>
                <p>ul. Poprzeczna 3/1A</p>
                <p>55-110 Żmigród</p>
                <p>tel. +48 789 123 456</p>
                <p>e-mail: kontakt@auraboutique.pl</p>
              </div>
              <p className="text-[11px] text-[#6E6259]">
                * Możesz również zwrócić towar osobiście w butiku w Żmigrodzie w godzinach otwarcia.
              </p>
            </div>

            {/* ZWROT ŚRODKÓW */}
            <div className="space-y-3 pt-4 border-t border-[#EADFD5]">
              <h3 className="font-serif text-base text-[#241D1B] font-semibold">
                Zwrot należności
              </h3>
              <p>
                Środki zwracamy niezwłocznie, maksymalnie w ciągu <strong>14 dni</strong> od chwili otrzymania przesyłki ze zwracanym towarem, przy użyciu tej samej metody płatności lub na wskazany numer konta bankowego.
              </p>
            </div>

            {/* REKLAMACJE */}
            <div className="space-y-3 pt-4 border-t border-[#EADFD5]">
              <h3 className="font-serif text-base text-[#241D1B] font-semibold">
                Reklamacje z tytułu rękojmi / niezgodności towaru
              </h3>
              <p>
                Jeżeli otrzymany produkt posiada wadę fabryczną, prosimy o kontakt mailowy na adres <strong>kontakt@auraboutique.pl</strong> z krótkim opisem wady i zdjęciem, lub odesłanie produktu na adres butiku w Żmigrodzie. Reklamacje rozpatrujemy w terminie do 14 dni.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
