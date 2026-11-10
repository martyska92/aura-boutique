"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  Navigation,
  Compass,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface PublicSettings {
  boutiqueName?: string;
  address?: string;
  phone?: string;
  email?: string;
  openingHours?: string;
}

export default function ContactPage() {
  const [settings, setSettings] = useState<PublicSettings>({
    address: "Żmigród, ul. Poprzeczna 3/1A",
    phone: "+48 789 123 456",
    email: "aurazmigrod@wp.pl",
    openingHours: "Pon - Pt: 10:00 - 17:00 | Sob: 9:00 - 13:00",
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setSettings({
            address: data.address || "Żmigród, ul. Poprzeczna 3/1A",
            phone: data.phone || "+48 789 123 456",
            email: data.email || "kontakt@auraboutique.pl",
            openingHours: data.openingHours || "Pon - Pt: 10:00 - 17:00 | Sob: 9:00 - 13:00",
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas wysyłania wiadomości.");
      }

      setIsSent(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Błąd połączenia. Spróbuj ponownie za chwilę.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addressQuery = "ul.+Poprzeczna+3%2F1A%2C+55-140+%C5%BAmigr%C3%B3d";
  const googleNavigationUrl =
    "https://www.google.com/maps/dir/?api=1&destination=Poprzeczna+3%2F1A%2C+55-140+%C5%BAmigr%C3%B3d";
  const appleNavigationUrl =
    "https://maps.apple.com/?daddr=Poprzeczna+3/1A,+55-140+Żmigród";

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#FAF6F1] py-12 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Nagłówek strony */}
          <div className="text-center max-w-xl mx-auto">
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
                <h2 className="font-serif text-xl text-[#241D1B] mb-2">AURA Boutique</h2>
                <p className="text-xs text-[#857670] leading-relaxed">
                  Zapraszamy do naszego butiku stacjonarnego w Żmigrodzie lub do kontaktu telefonicznego i mailowego.
                </p>
              </div>

              <div className="space-y-4 text-xs text-[#4A3F3B]">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#C5A069] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#241D1B] block font-semibold">Adres Butiku:</strong>
                    <span>{settings.address}</span>
                    <span className="block text-[11px] text-[#857670]">woj. dolnośląskie</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#C5A069] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#241D1B] block font-semibold">Godziny Otwarcia:</strong>
                    <span>{settings.openingHours}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#C5A069] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#241D1B] block font-semibold">Telefon:</strong>
                    <a
                      href={`tel:${settings.phone?.replace(/\s+/g, "")}`}
                      className="hover:text-[#C5A069] hover:underline"
                    >
                      {settings.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#C5A069] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#241D1B] block font-semibold">E-mail:</strong>
                    <a
                      href={`mailto:${settings.email}`}
                      className="hover:text-[#C5A069] hover:underline"
                    >
                      {settings.email}
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EADFD5]">
                <p className="text-[11px] text-[#857670] leading-relaxed">
                  Przy butiku stacjonarnym dostępny jest bezpłatny parking dla naszych klientek.
                </p>
              </div>
            </div>

            {/* Prawa strona: Działający Formularz kontaktowy */}
            <div className="lg:col-span-7 bg-white p-8 border border-[#EADFD5] rounded-xs shadow-xs">
              <h3 className="font-serif text-xl text-[#241D1B] mb-2 font-semibold">
                Napisz Do Nas
              </h3>
              <p className="text-xs text-[#857670] mb-6">
                Wypełnij formularz — odpowiemy najszybciej jak to możliwe!
              </p>

              {errorMessage && (
                <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {isSent ? (
                <div className="p-8 text-center bg-[#FAF6F1] border border-[#DFBEB8] rounded-xs space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-[#C5A069] mx-auto" />
                  <h4 className="font-serif text-lg text-[#241D1B]">Dziękujemy za wiadomość!</h4>
                  <p className="text-xs text-[#857670]">
                    Twoja wiadomość została wysłana bezpośrednio na adres: <strong>aurazmigrod@wp.pl</strong>. Odpowiemy na Twój e-mail: <strong>{email}</strong> najszybciej jak to możliwe!
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
                      <label className="text-xs text-[#857670] block mb-1 font-medium">Twoje Imię *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Np. Anna"
                        className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#857670] block mb-1 font-medium">Twój E-mail *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="anna@example.com"
                        className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[#857670] block mb-1 font-medium">Treść wiadomości *</label>
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
                    disabled={isSubmitting}
                    className="px-8 py-3.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-widest font-semibold transition-colors rounded-xs shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? "Wysyłanie..." : "Wyślij wiadomość"}</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* ========================================================
              SEKCJA: MAPA GOOGLE MAPS Z PINEZKĄ I NAWIGACJĄ
             ======================================================== */}
          <div className="bg-white p-6 sm:p-8 border border-[#DFCA9B] rounded-lg shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EADFD5] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-5 h-5 text-[#C5A069]" />
                  <h3 className="font-serif text-xl sm:text-2xl text-[#241D1B]">
                    Lokalizacja Butiku w Żmigrodzie
                  </h3>
                </div>
                <p className="text-xs text-[#6E6259]">
                  ul. Poprzeczna 3/1A, 55-140 Żmigród (woj. dolnośląskie)
                </p>
              </div>

              {/* Przyciski szybkiej nawigacji */}
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={googleNavigationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs font-semibold rounded shadow transition-all"
                  title="Rozpocznij trasę w Google Maps"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Nawiguj w Google Maps</span>
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

            {/* Interaktywna mapa z pinezką */}
            <div className="relative w-full h-80 sm:h-96 rounded-md overflow-hidden border border-[#EADFD5]">
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

              {/* Pinezka nakładkowa */}
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-full border border-[#C5A069] shadow-md flex items-center gap-2 pointer-events-none">
                <span className="w-3 h-3 rounded-full bg-[#C5A069] ring-4 ring-[#C5A069]/20" />
                <span className="text-[11px] font-serif font-bold text-[#241D1B]">
                  AURA Boutique K.B.
                </span>
              </div>
            </div>

            {/* Wskazówka dojazdu */}
            <div className="p-3 bg-[#FAF2EB] border border-[#EADFD5] rounded text-xs text-[#6E6259] flex items-center justify-between flex-wrap gap-2">
              <span>
                🅿️ <strong>Dojazd i parking:</strong> Bezpłatne miejsca postojowe dla klientek bezpośrednio przed wejściem do butiku.
              </span>
              <a
                href={googleNavigationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C5A069] hover:underline font-semibold flex items-center gap-1 text-xs"
              >
                <span>Wyznacz trasę do butiku</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
