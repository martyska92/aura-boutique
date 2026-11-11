"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Check,
  AlertCircle,
  Database,
  ShieldCheck,
  MapPin,
  Sparkles,
  CreditCard,
  Truck,
  Info,
  Mail,
  Send,
} from "lucide-react";
import { StoreSettings } from "@/lib/types";

interface StoreSettingsClientProps {
  initialSettings: StoreSettings;
  isNeonConnected: boolean;
}

export function StoreSettingsClient({
  initialSettings,
  isNeonConnected,
}: StoreSettingsClientProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [testEmailAddress, setTestEmailAddress] = useState(
    settings.emailSenderAddress || settings.smtpUser || "aurazmigrod@wp.pl"
  );
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendTestEmail = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail: testEmailAddress }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({ success: true, message: data.message || "Wiadomość testowa została wysłana!" });
      } else {
        setTestResult({ success: false, message: data.error || "Błąd wysyłki e-mail." });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: "Błąd połączenia: " + err.message });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleChange = (field: keyof StoreSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setFeedback("Ustawienia butiku zostały pomyślnie zaktualizowane!");
        setTimeout(() => setFeedback(null), 3000);
        router.refresh();
      } else {
        alert("Błąd podczas zapisywania ustawień.");
      }
    } catch (e: any) {
      alert("Błąd połączenia: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 pb-16">
      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-700" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lewa kolumna: Dane kontaktowe i baner */}
        <div className="lg:col-span-8 space-y-6">
          {/* Dane Butiku */}
          <div className="bg-white p-6 border border-[#EADFD5] rounded shadow-sm space-y-4">
            <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
              Podstawowe Dane Butiku
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Nazwa butiku
                </label>
                <input
                  type="text"
                  value={settings.boutiqueName}
                  onChange={(e) => handleChange("boutiqueName", e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Adres stacjonarny
                </label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Telefon kontaktowy
                </label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Adres e-mail
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                Godziny otwarcia butiku w Żmigrodzie
              </label>
              <input
                type="text"
                value={settings.openingHours}
                onChange={(e) => handleChange("openingHours", e.target.value)}
                className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
              />
            </div>
          </div>

          {/* Dane Rejestrowe Firmy (Regulamin & Dokumenty) */}
          <div className="bg-white p-6 border border-[#EADFD5] rounded shadow-sm space-y-4">
            <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
              Dane Rejestrowe Firmy (Regulamin & Dokumenty Sprzedaży)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Pełna nazwa firmy / Imię i Nazwisko
                </label>
                <input
                  type="text"
                  placeholder="AURA Boutique Karolina Borkowska"
                  value={settings.companyName || ""}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  NIP
                </label>
                <input
                  type="text"
                  placeholder="np. 9151234567"
                  value={settings.nip || ""}
                  onChange={(e) => handleChange("nip", e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  REGON
                </label>
                <input
                  type="text"
                  placeholder="np. 380123456"
                  value={settings.regon || ""}
                  onChange={(e) => handleChange("regon", e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>
            </div>
          </div>

          {/* Treści Regulaminu i Polityki Prywatności / RODO */}
          <div className="bg-white p-6 border border-[#EADFD5] rounded shadow-sm space-y-5">
            <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
              Regulamin Sklepu & Polityka Prywatności (RODO)
            </h2>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#241D1B]">
                  Pełna treść Regulaminu sklepu internetowego
                </label>
                <span className="text-[10px] text-[#7A6458]">
                  Wyświetla się na stronie <code>/regulamin</code>
                </span>
              </div>
              <textarea
                rows={10}
                placeholder="Wpisz lub edytuj pełną treść regulaminu..."
                value={settings.termsAndConditions || ""}
                onChange={(e) => handleChange("termsAndConditions", e.target.value)}
                className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-3 text-xs text-[#241D1B] font-mono leading-relaxed focus:outline-none focus:border-[#C5A069] rounded"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#241D1B]">
                  Pełna treść Polityki Prywatności & RODO
                </label>
                <span className="text-[10px] text-[#7A6458]">
                  Wyświetla się na stronie <code>/polityka-prywatnosci</code>
                </span>
              </div>
              <textarea
                rows={10}
                placeholder="Wpisz lub edytuj treść polityki prywatności i RODO..."
                value={settings.privacyPolicy || ""}
                onChange={(e) => handleChange("privacyPolicy", e.target.value)}
                className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-3 text-xs text-[#241D1B] font-mono leading-relaxed focus:outline-none focus:border-[#C5A069] rounded"
              />
            </div>
          </div>

          {/* Treści Banera Głównego (Hero) */}
          <div className="bg-white p-6 border border-[#EADFD5] rounded shadow-sm space-y-4">
            <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
              Baner Główny na Stronie Głównej
            </h2>

            <div>
              <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                Główny nagłówek banera
              </label>
              <input
                type="text"
                value={settings.heroHeadline}
                onChange={(e) => handleChange("heroHeadline", e.target.value)}
                className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                Podtytuł / hasło przewodnie
              </label>
              <textarea
                rows={2}
                value={settings.heroSubheadline}
                onChange={(e) => handleChange("heroSubheadline", e.target.value)}
                className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                Tekst paska ogłoszeń (górny pudrowo-różowy pasek)
              </label>
              <input
                type="text"
                value={settings.announcementBarText}
                onChange={(e) => handleChange("announcementBarText", e.target.value)}
                className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
              />
            </div>
          </div>

          {/* Koszty dostawy */}
          <div className="bg-white p-6 border border-[#EADFD5] rounded shadow-sm space-y-4">
            <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
              Koszty Dostawy i Próg Darmowej Wysyłki
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Próg darmowej dostawy (PLN)
                </label>
                <input
                  type="number"
                  step="1"
                  value={settings.freeShippingFrom}
                  onChange={(e) => handleChange("freeShippingFrom", parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Koszt Paczkomat InPost (PLN)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.inpostLockerCost}
                  onChange={(e) => handleChange("inpostLockerCost", parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Koszt Kurier (PLN)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.courierCost}
                  onChange={(e) => handleChange("courierCost", parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Konfiguracja Integracji InPost (ShipX / Paczkomaty) */}
          <div className="bg-white p-6 border-2 border-[#FFE885]/80 rounded shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EADFD5]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#FFD800] text-black font-extrabold text-[11px] flex items-center justify-center">
                  in
                </span>
                <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B] font-semibold">
                  Integracja i Konfiguracja InPost (Paczkomaty & Kurier)
                </h2>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-100 text-amber-900 border border-amber-300">
                ShipX API
              </span>
            </div>

            <p className="text-xs text-[#6E6259]">
              Skonfiguruj połączenie z InPost ShipX, aby automatycznie generować numery przesyłek, pobierać etykiety i umożliwiać klientkom śledzenie paczki na żywo oraz wygodne zwroty przez Paczkomat.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Token API ShipX InPost (Bearer Token)
                </label>
                <input
                  type="password"
                  placeholder="Wklej token z Manager Paczek InPost"
                  value={settings.inpostApiKey || ""}
                  onChange={(e) => handleChange("inpostApiKey", e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] font-mono focus:outline-none focus:border-[#C5A069]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  ID Organizacji InPost (Organization ID)
                </label>
                <input
                  type="text"
                  placeholder="Np. 123456"
                  value={settings.inpostOrganizationId || ""}
                  onChange={(e) => handleChange("inpostOrganizationId", e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] font-mono focus:outline-none focus:border-[#C5A069]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Środowisko API
                </label>
                <select
                  value={settings.inpostEnvironment || "production"}
                  onChange={(e) => handleChange("inpostEnvironment", e.target.value as any)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                >
                  <option value="production">Produkcyjne (api-shipx-pl.easypack24.net)</option>
                  <option value="sandbox">Testowe / Sandbox (sandbox-api-shipx-pl.easypack24.net)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Domyślny Paczkomat nadawczy Butiku
                </label>
                <input
                  type="text"
                  placeholder="Np. ZMI01M (Żmigród, ul. Poprzeczna)"
                  value={settings.inpostSenderLocker || "ZMI01M"}
                  onChange={(e) => handleChange("inpostSenderLocker", e.target.value.toUpperCase())}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] font-mono font-semibold focus:outline-none focus:border-[#C5A069]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Nazwa nadawcy na etykiecie
                </label>
                <input
                  type="text"
                  value={settings.inpostSenderName || "AURA Boutique K.B."}
                  onChange={(e) => handleChange("inpostSenderName", e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Telefon nadawcy (SMS powiadomienia)
                </label>
                <input
                  type="text"
                  value={settings.inpostSenderPhone || "+48 572 268 005"}
                  onChange={(e) => handleChange("inpostSenderPhone", e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>
            </div>

            <div className="p-3 bg-[#FFFDEB] border border-[#FFE885] rounded text-[11px] text-[#7A641E] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#D89F00] shrink-0" />
                <span>
                  Klucze API możesz wygenerować bezpłatnie w panelu: <strong>Manager Paczek InPost &gt; Moje konto &gt; Integracje API</strong>.
                </span>
              </div>
              <a
                href="https://manager.paczkomaty.pl/"
                target="_blank"
                rel="noreferrer"
                className="font-bold underline shrink-0 hover:text-black"
              >
                Otwórz InPost ↗
              </a>
            </div>
          </div>

          {/* Konfiguracja Wysyłki E-mail (Kody Rabatowe, Opinie, Powiadomienia) */}
          <div className="bg-white p-6 border border-[#EADFD5] rounded shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EADFD5]">
              <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B] flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#C5A069]" />
                <span>Wysyłka E-mail (Kody Rabatowe, Opinie, Powiadomienia)</span>
              </h2>
              <span className="text-[11px] text-[#7A6458]">
                Poczta WP.pl / Własny SMTP / Resend API
              </span>
            </div>

            <p className="text-xs text-[#6E6259] leading-relaxed">
              Skonfiguruj wysyłkę e-maili, aby wygenerowane kody rabatowe (–2% i –5% za opinię, –15% za polecenia, rabaty VIP) oraz powiadomienia o zamówieniach automatycznie trafiały na skrzynki pocztowe Twoich klientek.
            </p>

            {/* Wybór metody wysyłki */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Sposób wysyłki wiadomości
                </label>
                <select
                  value={settings.emailProvider || "smtp"}
                  onChange={(e) => handleChange("emailProvider", e.target.value as any)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                >
                  <option value="smtp">Poczta WP.pl / Własny serwer SMTP (Zalecane)</option>
                  <option value="resend">Resend API (Nowoczesna usługa e-mail)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Nazwa nadawcy w e-mailu
                </label>
                <input
                  type="text"
                  placeholder="AURA Boutique K.B."
                  value={settings.emailSenderName || "AURA Boutique K.B."}
                  onChange={(e) => handleChange("emailSenderName", e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>
            </div>

            {/* Opcje SMTP */}
            {(!settings.emailProvider || settings.emailProvider === "smtp") && (
              <div className="p-4 bg-[#FAF6F1] border border-[#EADFD5] rounded space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                      Serwer pocztowy SMTP
                    </label>
                    <input
                      type="text"
                      placeholder="smtp.wp.pl (lub smtp.gmail.com)"
                      value={settings.smtpHost || "smtp.wp.pl"}
                      onChange={(e) => handleChange("smtpHost", e.target.value)}
                      className="w-full bg-white border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] font-mono focus:outline-none focus:border-[#C5A069]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                      Port serwera SMTP
                    </label>
                    <input
                      type="number"
                      placeholder="465"
                      value={settings.smtpPort || 465}
                      onChange={(e) => handleChange("smtpPort", Number(e.target.value))}
                      className="w-full bg-white border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] font-mono focus:outline-none focus:border-[#C5A069]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                      Adres e-mail (Login do skrzynki)
                    </label>
                    <input
                      type="email"
                      placeholder="aurazmigrod@wp.pl"
                      value={settings.smtpUser || "aurazmigrod@wp.pl"}
                      onChange={(e) => handleChange("smtpUser", e.target.value)}
                      className="w-full bg-white border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] font-mono focus:outline-none focus:border-[#C5A069]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                      Hasło do skrzynki pocztowej
                    </label>
                    <input
                      type="password"
                      placeholder="Wpisz hasło do poczty WP"
                      value={settings.smtpPassword || ""}
                      onChange={(e) => handleChange("smtpPassword", e.target.value)}
                      className="w-full bg-white border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] font-mono focus:outline-none focus:border-[#C5A069]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="smtpSecure"
                    checked={settings.smtpSecure !== undefined ? settings.smtpSecure : true}
                    onChange={(e) => handleChange("smtpSecure", e.target.checked)}
                    className="w-4 h-4 accent-[#C5A069]"
                  />
                  <label htmlFor="smtpSecure" className="text-xs text-[#3E3835]">
                    Bezpieczne połączenie SSL/TLS (zalecane dla portu 465)
                  </label>
                </div>
              </div>
            )}

            {/* Opcje Resend */}
            {settings.emailProvider === "resend" && (
              <div className="p-4 bg-[#FAF6F1] border border-[#EADFD5] rounded space-y-3">
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Klucz Resend API Key
                </label>
                <input
                  type="password"
                  placeholder="re_123456789..."
                  value={settings.resendApiKey || ""}
                  onChange={(e) => handleChange("resendApiKey", e.target.value)}
                  className="w-full bg-white border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] font-mono focus:outline-none focus:border-[#C5A069]"
                />
                <p className="text-[11px] text-[#7A6458]">
                  Klucz API możesz wygenerować bezpłatnie na <a href="https://resend.com" target="_blank" className="text-[#C5A069] underline">resend.com</a>.
                </p>
              </div>
            )}

            {/* Test wysyłki wiadomości e-mail */}
            <div className="pt-2 border-t border-[#EADFD5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <input
                  type="email"
                  placeholder="Adres do testu (np. aurazmigrod@wp.pl)"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] px-3 py-2 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={isSendingTest}
                  className="px-4 py-2 bg-[#241D1B] text-white text-xs uppercase tracking-wider rounded hover:bg-[#3E3835] transition-all disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                  <span>{isSendingTest ? "Wysyłanie..." : "Wyślij Test"}</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`text-xs p-2.5 rounded border ${
                    testResult.success
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-red-50 text-red-800 border-red-200"
                  }`}
                >
                  {testResult.message}
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-3.5 bg-[#C5A069] text-white text-xs uppercase tracking-[0.2em] font-semibold rounded hover:bg-[#AF884F] transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4 text-white" />
              <span>{isSaving ? "Zapisywanie..." : "Zapisz Ustawienia Butiku"}</span>
            </button>
          </div>
        </div>

        {/* Prawa kolumna: NEON POSTGRESQL & BEZPIECZEŃSTWO */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 border border-[#EADFD5] rounded shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EADFD5]">
              <span className="font-serif text-sm uppercase tracking-wider text-[#241D1B] flex items-center gap-2">
                <Database className="w-4 h-4 text-[#C5A069]" />
                <span>Neon PostgreSQL</span>
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                  isNeonConnected
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {isNeonConnected ? "Aktywne (Neon)" : "Tryb Działa (Lokalny)"}
              </span>
            </div>

            <div className="space-y-3 text-xs text-[#3E3B38] leading-relaxed">
              <p>
                <strong>Zgodność z bezpieczeństwem:</strong> Dane dostępowe do bazy Neon nigdy nie są eksponowane w przeglądarce ani w kodzie repozytorium. Wszystkie zapytania są wykonywane po stronie serwera przez Prisma ORM.
              </p>

              <div className="p-3 bg-[#FAF6F1] border border-[#EADFD5] rounded space-y-2 text-[11px]">
                <p className="font-semibold text-[#241D1B] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#C5A069]" />
                  <span>Krok po kroku: Jak podłączyć Neon</span>
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-[#6E6259]">
                  <li>Zaloguj się na <a href="https://console.neon.tech" target="_blank" className="text-[#C5A069] underline font-medium">console.neon.tech</a>.</li>
                  <li>Utwórz projekt (np. <code>aura-boutique-db</code>).</li>
                  <li>Skopiuj <em>Pooled Connection String</em>.</li>
                  <li>Wklej go do lokalnego pliku <code>.env</code> w linijce <code>DATABASE_URL=...</code></li>
                  <li>Uruchom komendę <code>npx prisma db push</code>.</li>
                </ol>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded text-[11px] space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Plik .env.example jest gotowy</span>
                </p>
                <p>
                  Zawiera wzory wszystkich zmiennych dla bazy, hasła do panelu, magazynu zdjęć Cloudinary i bramki płatności Przelewy24.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
