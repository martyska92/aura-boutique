import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Heart, Sparkles, Clock, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#FAF6F1] py-12 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Nagłówek */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <BrandLogo size="lg" />
            </div>
            <h1 className="sr-only">O marce AURA Boutique K.B.</h1>
            <p className="text-xs sm:text-sm text-[#857670] max-w-xl mx-auto font-light">
              Kobiecość, klasa i jakość, w której zakochasz się od pierwszego założenia.
            </p>
          </div>

          {/* Duże zdjęcie / grafika marki */}
          <div className="relative aspect-[16/9] bg-[#FAF6F1] border-2 border-[#D8BE8E] rounded-xs overflow-hidden shadow-[0_6px_24px_rgba(197,160,105,0.15)]">
            <Image
              src="/images/hero/aura-hero-motto.png"
              alt="AURA Boutique K.B. Wnętrze i styl"
              fill
              className="object-cover"
            />
          </div>

          {/* Treść */}
          <div className="bg-white p-8 sm:p-12 border border-[#EADFD5] rounded-xs shadow-xs space-y-6 text-sm text-[#4A3F3B] leading-relaxed font-light">
            <h2 className="font-serif text-2xl text-[#241D1B] font-normal">
              Dlaczego powstało AURA Boutique?
            </h2>
            <p>
              AURA Boutique K.B. narodziło się z pasji do mody, która podkreśla kobiece piękno bez zbędnego przepychu. Wierzymy, że ubranie powinno być nie tylko estetyczne, ale przede wszystkim dawać poczucie pewności siebie i niepowtarzalnej elegancji.
            </p>
            <p>
              W naszej ofercie nie znajdziesz przypadkowych modeli. Każda sukienka, sweter z kaszmirem, garnitur czy okrycie wierzchnie przechodzi naszą osobistą selekcję. Zwracamy uwagę na szlachetność materiałów — naturalną wełnę merino, delikatną wiskozę, jedwabne sploty i trwałe wykończenia.
            </p>

            <div className="my-8 p-6 bg-[#F2DCD7]/40 border-l-2 border-[#C5A069] italic text-xs text-[#241D1B] font-serif rounded-r-xs">
              „Chcemy, aby każda kobieta odwiedzająca AURA Boutique czuła się wyjątkowo — niezależnie od tego, czy szuka kreacji na wielkie wyjście, czy przytulnego swetra na chłodniejszy poranek.”
            </div>

            <h3 className="font-serif text-xl text-[#241D1B] font-normal pt-4">
              Nasz Butik w Żmigrodzie
            </h3>
            <p>
              Sercem naszej działalności jest butik stacjonarny w <strong>Żmigrodzie przy ul. Poprzecznej 3/1A</strong>. To tutaj możesz przymierzyć każdy fason, skorzystać z naszej porady stylistycznej oraz odebrać swoje zamówienie internetowe całkowicie bezpłatnie.
            </p>

            <div className="pt-6 border-t border-[#EADFD5] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[#857670]">
                <MapPin className="w-4 h-4 text-[#C5A069]" />
                <span>Żmigród | ul. Poprzeczna 3/1A (woj. dolnośląskie)</span>
              </div>
              <Link
                href="/katalog"
                className="px-6 py-3 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-widest rounded-xs shadow-xs transition-colors"
              >
                Zobacz kolekcję online
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
