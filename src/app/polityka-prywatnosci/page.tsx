import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#FAF6F1] py-12 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#C5A069] font-medium">
              Ochrona Danych Osobowych & RODO
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#241D1B]">
              Polityka Prywatności
            </h1>
            <p className="text-xs text-[#6E6259]">
              AURA Boutique K.B. • Obowiązuje od 2026 r.
            </p>
          </div>

          <div className="bg-white p-8 sm:p-12 border border-[#EADFD5] shadow-sm rounded-sm space-y-6 text-xs sm:text-sm text-[#3E3B38] leading-relaxed">
            <section className="space-y-3">
              <h2 className="font-serif text-base text-[#241D1B] font-bold">
                1. Administrator Danych Osobowych
              </h2>
              <div className="p-4 bg-[#FAF6F1] border border-[#EADFD5] text-[#241D1B] font-mono text-xs space-y-1">
                <p className="text-[#AF884F]"><strong>[DO UZUPEŁNIENIA: ADMINISTRATOR DANYCH]</strong></p>
                <p>Administratorem danych osobowych zbieranych za pośrednictwem sklepu internetowego AURA Boutique K.B. jest:</p>
                <p>[DO UZUPEŁNIENIA: Imię i Nazwisko / Pełna nazwa firmy]</p>
                <p>Adres: Żmigród, ul. Poprzeczna 3/1A, 55-110 Żmigród</p>
                <p>NIP: [DO UZUPEŁNIENIA: NIP]</p>
                <p>Adres e-mail do kontaktu w sprawach danych: kontakt@auraboutique.pl</p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-base text-[#241D1B] font-bold">
                2. Cel i podstawa prawna przetwarzania danych
              </h2>
              <p>
                Dane osobowe przetwarzane są w celu:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Realizacji zamówień składanych bez rejestracji konta (art. 6 ust. 1 lit. b RODO).</li>
                <li>Wypełnienia obowiązków prawno-podatkowych i księgowych (art. 6 ust. 1 lit. c RODO).</li>
                <li>Ewentualnego rozpatrywania reklamacji i dochodzenia roszczeń (art. 6 ust. 1 lit. f RODO).</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-base text-[#241D1B] font-bold">
                3. Odbiorcy danych (Dostawcy i Bramki Płatności)
              </h2>
              <p>
                W celu realizacji Twojego zamówienia dane mogą być przekazywane podmiotom świadczącym usługi doręczenia oraz obsługi płatności:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>InPost Sp. z o.o. (obsługa przesyłek Paczkomaty i kurier).</li>
                <li>Operator płatności Przelewy24 (PayPro S.A.) w celu przetworzenia płatności BLIK / online.</li>
                <li>Biuro rachunkowe obsługujące finanse Butiku.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-base text-[#241D1B] font-bold">
                4. Twoje prawa
              </h2>
              <p>
                Przysługuje Ci prawo dostępu do swoich danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, prawo do przenoszenia danych oraz prawo do wniesienia sprzeciwu.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-base text-[#241D1B] font-bold">
                5. Pliki Cookies
              </h2>
              <p>
                Sklep korzysta z niezbędnych plików cookies do prawidłowego działania koszyka zakupowego oraz sesji administracyjnej.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
