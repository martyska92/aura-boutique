import React from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Navigation,
  Compass,
  Phone,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function AboutPage() {
  const addressQuery = "ul.+Poprzeczna+3%2F1A%2C+55-140+%C5%BAmigr%C3%B3d";
  const googleNavigationUrl =
    "https://www.google.com/maps/dir/?api=1&destination=Poprzeczna+3%2F1A%2C+55-140+%C5%BAmigr%C3%B3d";
  const appleNavigationUrl =
    "https://maps.apple.com/?daddr=Poprzeczna+3/1A,+55-140+Żmigród";

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#FAF6F1]">
        {/* Nagłówek podstrony */}
        <section className="pt-10 sm:pt-14 pb-4 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#C5A069] font-semibold mb-1">
            Poznaj Nas Bliżej
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#241D1B]">
            O Butiku AURA
          </h1>
          <p className="text-xs sm:text-sm text-[#857670] mt-2 font-light max-w-xl mx-auto">
            Kobiece piękno, szlachetne tkaniny i ponadczasowa elegancja w sercu Żmigrodu.
          </p>
        </section>

        {/* ========================================================
            TREŚĆ O BUTIKU & NASZA HISTORIA
           ======================================================== */}
        <section className="py-12 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            {/* Karta opisu */}
            <div className="bg-white p-6 sm:p-12 border border-[#EADFD5] rounded-xs shadow-xs space-y-6 text-sm text-[#4A3F3B] leading-relaxed font-light">
              <div className="flex items-center gap-3">
                <span className="h-[1px] w-8 bg-[#C5A069]" />
                <h2 className="font-serif text-2xl sm:text-3xl text-[#241D1B] font-normal tracking-wide">
                  Dlaczego powstało AURA Boutique?
                </h2>
              </div>

              <p>
                AURA Boutique K.B. narodziło się z pasji do mody, która podkreśla kobiece piękno bez zbędnego przepychu. Wierzymy, że ubranie powinno być nie tylko estetyczne, ale przede wszystkim dawać poczucie pewności siebie, komfortu i niepowtarzalnej elegancji.
              </p>
              <p>
                W naszej ofercie nie znajdziesz przypadkowych modeli. Każda sukienka, sweter z kaszmirem, garnitur czy okrycie wierzchnie przechodzi naszą osobistą selekcję. Zwracamy uwagę na szlachetność materiałów — naturalną wełnę merino, delikatną wiskozę, jedwabne sploty i trwałe wykończenia.
              </p>

              <div className="my-8 p-6 bg-[#FAF2EB] border-l-4 border-[#C5A069] italic text-xs sm:text-sm text-[#241D1B] font-serif rounded-r-xs shadow-2xs">
                „Chcemy, aby każda kobieta odwiedzająca AURA Boutique czuła się wyjątkowo — niezależnie od tego, czy szuka kreacji na wielkie wyjście, czy przytulnego swetra na chłodniejszy poranek.”
              </div>

              {/* ========================================================
                  SEKCJA: NASZ BUTIK W ŻMIGRODZIE + MAPA & NAWIGACJA
                 ======================================================== */}
              <div className="pt-6 border-t border-[#EADFD5] space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-[#C5A069]" />
                    <h3 className="font-serif text-xl sm:text-2xl text-[#241D1B] font-normal">
                      Nasz Butik w Żmigrodzie
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#6E6259]">
                    Sercem naszej działalności jest butik stacjonarny w <strong>Żmigrodzie przy ul. Poprzecznej 3/1A</strong>. To tutaj możesz osobiście przymierzyć każdy fason, skorzystać z naszej porady stylistycznej oraz odebrać zamówienie internetowe całkowicie bezpłatnie.
                  </p>
                </div>

                {/* Karta z mapką i szybką nawigacją */}
                <div className="bg-[#FAF6F1] border border-[#DFCA9B] rounded-md overflow-hidden shadow-sm">
                  {/* Nagłówek karty z adresem i przyciskiem nawigacji */}
                  <div className="p-4 sm:p-5 bg-white border-b border-[#EADFD5] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                        <span className="font-serif font-bold text-sm text-[#241D1B] tracking-wide">
                          AURA Boutique K.B. — Żmigród
                        </span>
                      </div>
                      <div className="text-xs text-[#6E6259] flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#C5A069] shrink-0" />
                        <span className="font-medium text-[#241D1B]">
                          ul. Poprzeczna 3/1A, 55-140 Żmigród
                        </span>
                        <span className="hidden sm:inline text-[#857670]">• woj. dolnośląskie</span>
                      </div>
                      <div className="text-[11px] text-[#857670] flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#C5A069] shrink-0" />
                        <span>Pon - Pt: 10:00 - 17:00 | Sob: 9:00 - 13:00</span>
                      </div>
                    </div>

                    {/* Przyciski nawigacji */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <a
                        href={googleNavigationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-sm hover:shadow transition-all"
                        title="Uruchom nawigację Google Maps"
                      >
                        <Navigation className="w-4 h-4 text-white" />
                        <span>Nawiguj do butiku</span>
                        <ExternalLink className="w-3 h-3 text-white/80" />
                      </a>

                      <a
                        href={appleNavigationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-[#EADFD5] hover:border-[#C5A069] text-[#241D1B] text-xs font-medium rounded transition-colors"
                        title="Otwórz w Apple Maps (iPhone)"
                      >
                        <Compass className="w-3.5 h-3.5 text-[#C5A069]" />
                        <span>Apple Maps</span>
                      </a>
                    </div>
                  </div>

                  {/* Interaktywna mapa z pinezką lokalizacji w Żmigrodzie */}
                  <div className="relative w-full h-72 sm:h-96 bg-[#FAF6F1]">
                    <iframe
                      title="Lokalizacja AURA Boutique w Żmigrodzie"
                      src={`https://maps.google.com/maps?q=${addressQuery}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full h-full"
                    />

                    {/* Pinezka nakładkowa na mapie */}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-full border border-[#C5A069] shadow-md flex items-center gap-2 pointer-events-none">
                      <span className="w-3 h-3 rounded-full bg-[#C5A069] ring-4 ring-[#C5A069]/20" />
                      <span className="text-[11px] font-serif font-bold text-[#241D1B]">
                        AURA Boutique K.B.
                      </span>
                    </div>
                  </div>

                  {/* Dolna belka podpowiedzi dla kierowców */}
                  <div className="p-3 bg-[#FAF2EB] border-t border-[#EADFD5] text-[11px] text-[#6E6259] flex items-center justify-between flex-wrap gap-2">
                    <span>
                      Dla naszych klientek pod samym butikiem dostępny jest bezpłatny parking.
                    </span>
                    <a
                      href={googleNavigationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#C5A069] hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>Trasa dojazdu w Google Maps</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Przycisk przejścia do kolekcji */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs text-[#857670]">
                    Możesz też zamówić ubrania online z bezpłatnym odbiorem osobistym w naszym butiku w Żmigrodzie.
                  </span>
                  <Link
                    href="/katalog"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#241D1B] hover:bg-[#3D322F] text-white text-xs uppercase tracking-widest font-semibold rounded-xs shadow-xs transition-colors shrink-0"
                  >
                    <span>Zobacz kolekcję online</span>
                    <ArrowRight className="w-4 h-4 text-[#C5A069]" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
