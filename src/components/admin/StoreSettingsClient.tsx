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
