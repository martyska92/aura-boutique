"use client";

import React, { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#FAF6F1] py-12 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#C5A069] font-semibold mb-1">
              Kontakt & Lokalizacja
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#241D1B]">
              Skontaktuj Się z Nami
            </h1>
            <p className="text-xs sm:text-sm text-[#857670] mt-2 font-light">
              Chętnie odpowiemy na wszelkie pytania dotyczące rozmiarów, dostępności i zamówień.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Lewa strona: Dane kontaktowe */}
            <div className="lg:col-span-5 bg-white p-8 border border-[#EADFD5] rounded-xs shadow-xs space-y-8">
              <div>
                <BrandLogo size="md" className="mb-3" />
                <p className="text-xs text-[#857670] leading-relaxed">
                  Zapraszamy do naszego butiku stacjonarnego w Żmigrodzie lub do kontaktu telefonicznego i mailowego.
                </p>
              </div>

              <div className="space-y-4 text-xs text-[#4A3F3B]">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#C5A069] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#241D1B] block">Adres Butiku:</strong>
                    <span>Żmigród, ul. Poprzeczna 3/1A</span>
                    <span className="block text-[11px] text-[#857670]">woj. dolnośląskie</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#C5A069] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#241D1B] block">Godziny Otwarcia:</strong>
                    <span>Poniedziałek – Piątek: 10:00 – 18:00</span>
                    <span className="block">Sobota: 10:00 – 14:00</span>
                    <span className="block text-[11px] text-[#857670]">Niedziela: Zamknięte</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#C5A069] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#241D1B] block">Telefon:</strong>
                    <span>+48 789 123 456</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#C5A069] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#241D1B] block">E-mail:</strong>
                    <span>kontakt@auraboutique.pl</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EADFD5]">
                <p className="text-[11px] text-[#857670]">
                  Przy butiku stacjonarnym dostępny jest bezpłatny parking dla klientek.
                </p>
              </div>
            </div>

            {/* Prawa strona: Formularz kontaktowy */}
            <div className="lg:col-span-7 bg-white p-8 border border-[#EADFD5] rounded-xs shadow-xs">
              <h3 className="font-serif text-xl text-[#241D1B] mb-6">
                Napisz Do Nas
              </h3>

              {isSent ? (
                <div className="p-8 text-center bg-[#FAF6F1] border border-[#DFBEB8] rounded-xs space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-[#C5A069] mx-auto" />
                  <h4 className="font-serif text-lg text-[#241D1B]">Dziękujemy za wiadomość!</h4>
                  <p className="text-xs text-[#857670]">
                    Odpowiemy najszybciej jak to możliwe, zwykle w ciągu kilku godzin roboczych.
                  </p>
                  <button
                    onClick={() => {
                      setIsSent(false);
                      setName("");
                      setEmail("");
                      setMessage("");
                    }}
                    className="text-xs text-[#C5A069] hover:underline pt-2 block mx-auto font-medium"
                  >
                    Wyślij kolejną wiadomość
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-[#857670] block mb-1">Twoje Imię *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#857670] block mb-1">Twój E-mail *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[#857670] block mb-1">Treść wiadomości *</label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Napisz, w czym możemy Ci pomóc..."
                      className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-8 py-3.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-widest font-medium transition-colors rounded-xs shadow-xs flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Wyślij wiadomość</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
