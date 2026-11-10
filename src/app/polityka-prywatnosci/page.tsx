import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getStoreSettings } from "@/lib/store-data";

export default async function PrivacyPolicyPage() {
  const settings = await getStoreSettings();

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
              Polityka Prywatności & RODO
            </h1>
            <p className="text-xs text-[#6E6259]">
              {settings.boutiqueName || "AURA Boutique K.B."} • Obowiązuje od 2026 r.
            </p>
          </div>

          <div className="bg-white p-8 sm:p-12 border border-[#EADFD5] shadow-sm rounded-sm space-y-6 text-xs sm:text-sm text-[#3E3B38] leading-relaxed">
            {/* Dane Administratora Danych */}
            <section className="space-y-3">
              <h2 className="font-serif text-base text-[#241D1B] font-bold">
                1. Administrator Danych Osobowych
              </h2>
              <div className="p-4 bg-[#FAF6F1] border border-[#EADFD5] text-[#241D1B] font-mono text-xs space-y-1 rounded">
                <p className="text-[#AF884F] font-bold">Administrator Twoich Danych:</p>
                <p><strong>Firma:</strong> {settings.companyName || settings.boutiqueName || "AURA Boutique K.B."}</p>
                <p><strong>Siedziba / Butik:</strong> {settings.address}</p>
                <p><strong>NIP:</strong> {settings.nip || "W uzupełnieniu"}</p>
                <p><strong>REGON:</strong> {settings.regon || "W uzupełnieniu"}</p>
                <p><strong>E-mail do spraw ochrony danych:</strong> {settings.email}</p>
                <p><strong>Telefon kontaktowy:</strong> {settings.phone}</p>
              </div>
            </section>

            {/* Treść polityki prywatności edytowalna w panelu */}
            {settings.privacyPolicy ? (
              <div className="space-y-4 whitespace-pre-line text-xs sm:text-sm text-[#3E3B38] leading-relaxed border-t border-[#EADFD5] pt-4">
                {settings.privacyPolicy}
              </div>
            ) : (
              <>
                <section className="space-y-3">
                  <h2 className="font-serif text-base text-[#241D1B] font-bold">
                    2. Cel i podstawa prawna przetwarzania danych
                  </h2>
                  <p>
                    Dane osobowe kupujących przetwarzane są w celu:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Realizacji zamówień składanych w sklepie internetowym (art. 6 ust. 1 lit. b RODO).</li>
                    <li>Wypełnienia obowiązków prawno-podatkowych i księgowych (art. 6 ust. 1 lit. c RODO).</li>
                    <li>Naliczania zniżek, rabatów za opinie i programu poleceń (art. 6 ust. 1 lit. b i f RODO).</li>
                    <li>Obsługi reklamacji i zwrotów konsumenckich (art. 6 ust. 1 lit. c RODO).</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="font-serif text-base text-[#241D1B] font-bold">
                    3. Odbiorcy danych (Dostawa i Płatności)
                  </h2>
                  <p>
                    W celu realizacji zamówienia dane mogą być przekazywane zaufanym partnerom butiku:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>InPost Sp. z o.o. (obsługa przesyłek Paczkomaty i kurier InPost).</li>
                    <li>PayPro S.A. / Przelewy24 (obsługa bezpiecznych płatności online i BLIK).</li>
                    <li>Dostawcy usług hostingowych i technicznych sklepu.</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="font-serif text-base text-[#241D1B] font-bold">
                    4. Prawa osoby, której dane dotyczą
                  </h2>
                  <p>
                    Każda klientka ma prawo do wglądu w swoje dane, ich poprawiania, żądania usunięcia oraz ograniczenia przetwarzania, kontaktując się z nami pod adresem: <strong>{settings.email}</strong>.
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
