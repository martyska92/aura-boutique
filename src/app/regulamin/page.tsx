import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#FAF6F1] py-12 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#C5A069] font-medium">
              Informacje Prawne
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#241D1B]">
              Regulamin Sklepu Internetowego
            </h1>
            <p className="text-xs text-[#6E6259]">
              AURA Boutique K.B. • Obowiązuje od 2026 r.
            </p>
          </div>

          <div className="bg-white p-8 sm:p-12 border border-[#EADFD5] shadow-sm rounded-sm space-y-6 text-xs sm:text-sm text-[#3E3B38] leading-relaxed">
            <section className="space-y-3">
              <h2 className="font-serif text-base text-[#241D1B] font-bold">
                § 1. Postanowienia ogólne i dane Sprzedawcy
              </h2>
              <p>
                1. Niniejszy Regulamin określa zasady korzystania ze sklepu internetowego AURA Boutique K.B. oraz warunki składania zamówień i zawierania umów sprzedaży na odległość.
              </p>
              <div className="p-4 bg-[#FAF6F1] border border-[#EADFD5] text-[#241D1B] font-mono text-xs space-y-1">
                <p className="text-[#AF884F]"><strong>[DO UZUPEŁNIENIA: DANE FIRMY SPRZEDAWCY]</strong></p>
                <p>Właścicielem sklepu internetowego jest:</p>
                <p>Firma: [DO UZUPEŁNIENIA: Pełna nazwa firmy / Imię i Nazwisko właścicielki]</p>
                <p>Adres działalności / Butik: Żmigród, ul. Poprzeczna 3/1A, 55-110 Żmigród</p>
                <p>NIP: [DO UZUPEŁNIENIA: NIP firmy]</p>
                <p>REGON: [DO UZUPEŁNIENIA: REGON firmy]</p>
                <p>E-mail: kontakt@auraboutique.pl | Tel.: +48 789 123 456</p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-base text-[#241D1B] font-bold">
                § 2. Składanie zamówień (Zamówienia bez rejestracji)
              </h2>
              <p>
                1. Sklep umożliwia składanie zamówień jako gość, bez konieczności rejestracji i tworzenia konta użytkownika.
              </p>
              <p>
                2. Wszystkie ceny produktów podawane są w polskich złotych (PLN) i zawierają należny podatek VAT.
              </p>
              <p>
                3. Zawarcie umowy następuje z chwilą potwierdzenia przyjęcia zamówienia przez Sklep. Stany magazynowe oraz ceny podlegają weryfikacji serwerowej.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-base text-[#241D1B] font-bold">
                § 3. Płatności i Dostawa
              </h2>
              <p>
                1. Dostępne metody płatności: szybkie płatności online Przelewy24 / BLIK oraz tradycyjny przelew bankowy na konto Sprzedawcy.
              </p>
              <p>
                2. W przypadku wyboru tradycyjnego przelewu bankowego rezerwacja towaru wynosi 60 minut od momentu złożenia zamówienia.
              </p>
              <p>
                3. Dostawa realizowana jest na terytorium Rzeczypospolitej Polskiej za pośrednictwem Paczkomatów InPost, kuriera InPost / DPD oraz bezpłatnego odbioru osobistego w Butiku w Żmigrodzie przy ul. Poprzecznej 3/1A.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-base text-[#241D1B] font-bold">
                § 4. Prawo odstąpienia od umowy (Zwroty)
              </h2>
              <p>
                1. Konsument ma prawo odstąpić od umowy zawartej na odległość w terminie 14 dni kalendarzowych bez podawania przyczyny.
              </p>
              <p>
                2. Zwracany produkt nie może nosić śladów użytkowania i powinien posiadać oryginalne metki.
              </p>
              <p>
                3. Zwrotu płatności Sprzedawca dokonuje niezwłocznie, nie później niż w terminie 14 dni od dnia otrzymania oświadczenia wraz z towarem.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-base text-[#241D1B] font-bold">
                § 5. Reklamacje i postanowienia końcowe
              </h2>
              <p>
                1. Sprzedawca odpowiada wobec Klienta za wady fizyczne lub prawne towaru na zasadach określonych przepisami Kodeksu Cywilnego oraz ustawy o prawach konsumenta.
              </p>
              <p>
                2. Reklamacje można składać drogą elektroniczną na adres e-mail: kontakt@auraboutique.pl.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
