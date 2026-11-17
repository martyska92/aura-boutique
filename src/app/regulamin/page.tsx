import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getStoreSettings } from "@/lib/store-data";

export default async function TermsPage() {
  const settings = await getStoreSettings();

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
              {settings.boutiqueName || "AURA Boutique K.B."} • Obowiązuje od 2026 r.
            </p>
          </div>

          <div className="bg-white p-8 sm:p-12 border border-[#EADFD5] shadow-sm rounded-sm space-y-6 text-xs sm:text-sm text-[#3E3B38] leading-relaxed">
            {/* Karta z danymi Sprzedawcy */}
            <div className="p-4 bg-[#FAF6F1] border border-[#EADFD5] text-[#241D1B] font-mono text-xs space-y-1.5 rounded">
              <p className="text-[#AF884F] font-bold font-sans uppercase tracking-wider text-[11px]">
                Dane identyfikacyjne Sprzedawcy:
              </p>
              <p><strong>Firma / Sprzedawca:</strong> {settings.companyName || "AURA BOUTIQUE K.B. [do uzupełnienia pełna nazwa rejestrowa]"}</p>
              <p><strong>NIP:</strong> {settings.nip || "6131569301"}</p>
              <p><strong>REGON:</strong> {settings.regon || "[do uzupełnienia]"}</p>
              <p><strong>Adres siedziby rejestrowej:</strong> {settings.registeredAddress || "[do uzupełnienia]"}</p>
              <p><strong>Adres butiku stacjonarnego i odbiorów:</strong> {settings.address || "ul. Poprzeczna 3/1A, 55-140 Żmigród"}</p>
              <p><strong>Adres do zwrotów i reklamacji:</strong> {settings.returnAddress || "AURA Boutique K.B. - ZWROTY, ul. Poprzeczna 3/1A, 55-140 Żmigród"}</p>
              <p><strong>Kontakt:</strong> e-mail: {settings.email} | tel. {settings.phone}</p>
            </div>

            {/* Treść regulaminu edytowalna w panelu */}
            {settings.termsAndConditions ? (
              <div className="space-y-4 whitespace-pre-line text-xs sm:text-sm text-[#3E3B38] leading-relaxed pt-2">
                {settings.termsAndConditions}
              </div>
            ) : (
              <>
                <section className="space-y-3">
                  <h2 className="font-serif text-base text-[#241D1B] font-bold">
                    § 2. Składanie zamówień
                  </h2>
                  <p>
                    1. Sklep umożliwia składanie zamówień zarówno z rejestracją, jak i bez rejestracji konta użytkownika.
                  </p>
                  <p>
                    2. Wszystkie ceny produktów podawane są w polskich złotych (PLN) i stanowią całkowitą kwotę do zapłaty.
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
                    1. Dostępne metody płatności: szybkie płatności online Przelewy24 / BLIK oraz tradycyjny przelew bankowy.
                  </p>
                  <p>
                    2. Dostawa realizowana jest za pośrednictwem Paczkomatów InPost ({settings.inpostLockerCost} zł), kuriera ({settings.courierCost} zł) oraz bezpłatnego odbioru osobistego w Butiku w Żmigrodzie przy {settings.address}.
                  </p>
                  <p>
                    3. Dla zamówień od {settings.freeShippingFrom} zł przysługuje darmowa dostawa.
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
                </section>

                <section className="space-y-3">
                  <h2 className="font-serif text-base text-[#241D1B] font-bold">
                    § 5. Reklamacje i kontakt
                  </h2>
                  <p>
                    1. Reklamacje można składać drogą elektroniczną na adres e-mail: {settings.email} lub pisemnie na adres Butiku: {settings.address}.
                  </p>
                </section>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
