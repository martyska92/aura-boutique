import React from "react";
import { Truck, CreditCard, MapPin, Clock, ShieldCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function DeliveryAndPaymentsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#FAF6F1] py-12 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#C5A069] font-medium">
              Informacje dla Klientek
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#241D1B]">
              Dostawa i Płatności
            </h1>
            <p className="text-xs sm:text-sm text-[#6E6259] font-light">
              Dbamy o to, aby Twoje zamówienie dotarło szybko, bezpiecznie i starannie zapakowane.
            </p>
          </div>

          {/* DOSTAWA */}
          <div className="bg-white p-8 sm:p-10 border border-[#EADFD5] shadow-sm rounded-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#EADFD5]">
              <Truck className="w-6 h-6 text-[#C5A069]" />
              <h2 className="font-serif text-xl text-[#241D1B]">Formy i Koszty Dostawy</h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-[#FAF6F1] border border-[#EADFD5] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="font-semibold text-xs text-[#241D1B]">Paczkomaty InPost 24/7</h3>
                  <p className="text-[11px] text-[#6E6259]">Dostawa do wybranego Paczkomatu w całej Polsce w 24-48h.</p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-xs text-[#241D1B]">13.00 PLN</span>
                  <span className="block text-[10px] text-emerald-800 font-medium">Darmowa od 300 PLN</span>
                </div>
              </div>

              <div className="p-4 bg-[#FAF6F1] border border-[#EADFD5] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="font-semibold text-xs text-[#241D1B]">Kurier InPost / DPD</h3>
                  <p className="text-[11px] text-[#6E6259]">Dostawa bezpośrednio pod podany adres domowy lub firmowy.</p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-xs text-[#241D1B]">15.00 PLN</span>
                  <span className="block text-[10px] text-emerald-800 font-medium">Darmowa od 300 PLN</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="font-semibold text-xs text-emerald-900">Odbiór osobisty w butiku (Żmigród)</h3>
                  <p className="text-[11px] text-emerald-800">
                    Odbierz zamówienie w naszym butiku stacjonarnym: <strong>Żmigród, ul. Poprzeczna 3/1A</strong>. Możliwość przymiarki na miejscu!
                  </p>
                </div>
                <span className="font-semibold text-xs text-emerald-800 uppercase">0.00 PLN (Bezpłatnie)</span>
              </div>
            </div>

            <div className="pt-2 text-xs text-[#6E6259] space-y-1">
              <p>• Czas realizacji: Zamówienia wysyłamy zazwyczaj w ciągu 24-48 godzin roboczych.</p>
              <p>• Każda przesyłka pakowana jest z najwyższą dbałością i zabezpieczeniem przed wilgocią.</p>
            </div>
          </div>

          {/* PŁATNOŚCI */}
          <div className="bg-white p-8 sm:p-10 border border-[#EADFD5] shadow-sm rounded-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#EADFD5]">
              <CreditCard className="w-6 h-6 text-[#C5A069]" />
              <h2 className="font-serif text-xl text-[#241D1B]">Bezpieczne Płatności</h2>
            </div>

            <div className="space-y-3 text-xs text-[#3E3B38] leading-relaxed">
              <p>
                W AURA Boutique K.B. oferujemy wyłącznie bezpieczne i sprawdzone metody płatności:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>BLIK</strong> — szybka płatność 6-cyfrowym kodem z Twojej aplikacji bankowej.
                </li>
                <li>
                  <strong>Przelewy24</strong> — natychmiastowe przelewy online z większości polskich banków oraz karty płatnicze.
                </li>
                <li>
                  <strong>Tradycyjny przelew bankowy</strong> — przelew bezpośrednio na rachunek bankowy butiku. Rezerwacja towaru trwa 60 minut od złożenia zamówienia.
                </li>
              </ul>
            </div>

            <div className="p-4 bg-[#FAF6F1] border border-[#EADFD5] text-[11px] text-[#6E6259] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C5A069] shrink-0" />
              <span>Wszystkie transakcje są zabezpieczone 256-bitowym szyfrowaniem SSL.</span>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
