"use client";

import React, { useState, useEffect } from "react";
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
  ExternalLink,
  Copy,
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
  const [settings, setSettings] = useState<StoreSettings>({
    emailProvider: "smtp",
    smtpHost: "smtp.wp.pl",
    smtpPort: 465,
    smtpUser: "aurazmigrod@wp.pl",
    smtpSecure: true,
    ...initialSettings,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [testEmailAddress, setTestEmailAddress] = useState(
    settings.emailSenderAddress || settings.smtpUser || "aurazmigrod@wp.pl"
  );
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [outboxList, setOutboxList] = useState<any[]>([]);
  const [isRetryingOutboxId, setIsRetryingOutboxId] = useState<string | null>(null);

  // Stan testu i konfiguracji bramki PayU
  const [isCheckingPayU, setIsCheckingPayU] = useState(false);
  const [payuCheckResult, setPayuCheckResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedPayUNotifyUrl, setCopiedPayUNotifyUrl] = useState(false);

  const handleTestPayU = async () => {
    setIsCheckingPayU(true);
    setPayuCheckResult(null);
    try {
      const res = await fetch("/api/admin/payments/payu/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      setPayuCheckResult(data);
    } catch (e: any) {
      setPayuCheckResult({ success: false, message: "Błąd połączenia: " + e.message });
    } finally {
      setIsCheckingPayU(false);
    }
  };

  const fetchOutbox = async () => {
    try {
      const res = await fetch("/api/admin/email/test");
      if (res.ok) {
        const data = await res.json();
        if (data.emailOutbox) setOutboxList(data.emailOutbox);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchOutbox();
  }, []);

  const handleRetrySingleOutbox = async (outboxId: string) => {
    setIsRetryingOutboxId(outboxId);
    try {
      const res = await fetch("/api/admin/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RETRY_OUTBOX_EMAIL", outboxId, settings }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({ success: true, message: data.message });
        fetchOutbox();
      } else {
        setTestResult({ success: false, message: data.error || "Błąd ponowienia." });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: "Błąd połączenia: " + err.message });
    } finally {
      setIsRetryingOutboxId(null);
    }
  };

  const handleSendTestEmail = async (type: "TEST_EMAIL" | "WELCOME_CUSTOMER" = "TEST_EMAIL") => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEmail: testEmailAddress,
          settings,
          type,
        }),
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

  const handleRetryWelcomeEmails = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RETRY_FAILED_WELCOME",
          settings,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({ success: true, message: data.message || "Ponowiono wysyłkę powitalnych e-maili!" });
      } else {
        setTestResult({ success: false, message: data.error || "Nie udało się ponowić wysyłki." });
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
      const payload = {
        ...settings,
        smtpPassword: settings.smtpPassword?.trim() ? settings.smtpPassword.trim() : undefined,
      };

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setFeedback("Ustawienia butiku zostały pomyślnie zaktualizowane!");
        if (data.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data.settings,
            smtpPassword: "",
            smtpPasswordConfigured: Boolean(data.settings.smtpPasswordConfigured),
          }));
        }
        setTimeout(() => setFeedback(null), 3000);
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
                  placeholder="np. 6131569301"
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
                  placeholder="np. [do uzupełnienia]"
                  value={settings.regon || ""}
                  onChange={(e) => handleChange("regon", e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Adres siedziby rejestrowej
                </label>
                <input
                  type="text"
                  placeholder="np. [do uzupełnienia]"
                  value={settings.registeredAddress || ""}
                  onChange={(e) => handleChange("registeredAddress", e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Adres do zwrotów i reklamacji
                </label>
                <input
                  type="text"
                  placeholder="AURA Boutique K.B. - ZWROTY, ul. Poprzeczna 3/1A, 55-140 Żmigród"
                  value={settings.returnAddress || ""}
                  onChange={(e) => handleChange("returnAddress", e.target.value)}
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

          {/* Treści Banera Głównego & Paska Ogłoszeń */}
          <div className="bg-white p-6 border border-[#EADFD5] rounded shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#EADFD5]">
              <div>
                <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B]">
                  Baner Główny & Pasek Ogłoszeń
                </h2>
                <p className="text-[11px] text-[#7A6458] mt-0.5">
                  Steruj tekstami, nagłówkami i banerami widocznymi na stronie głównej butiku oraz w górnym pasku.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/admin/baner"
                  className="px-3.5 py-1.5 bg-[#C5A069] hover:bg-[#AF884F] text-white rounded text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-2xs shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Wizualny Edytor Banera (Drag & Drop)</span>
                </a>
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-[#FAF6F1] border border-[#C5A069] text-[#7A5B20] hover:bg-[#C5A069] hover:text-white rounded text-xs font-semibold transition-all inline-flex items-center gap-1.5 shrink-0"
                >
                  <span>Podgląd sklepu</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Główny nagłówek banera
                </label>
                <input
                  type="text"
                  placeholder="Styl, który zachwyca"
                  value={settings.heroHeadline || ""}
                  onChange={(e) => handleChange("heroHeadline", e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
                <p className="text-[10px] text-[#8C7248] mt-1">Wyświetla się na banerze na stronie głównej.</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Adres zdjęcia banera
                </label>
                <input
                  type="text"
                  placeholder="/images/hero/aura-hero-motto.png"
                  value={settings.heroImageUrl || ""}
                  onChange={(e) => handleChange("heroImageUrl", e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
                <p className="text-[10px] text-[#8C7248] mt-1">Ścieżka do grafiki banera lub URL.</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                Podtytuł / hasło przewodnie banera
              </label>
              <textarea
                rows={2}
                placeholder="Ceny, które kuszą • Jakość, którą poczujesz"
                value={settings.heroSubheadline || ""}
                onChange={(e) => handleChange("heroSubheadline", e.target.value)}
                className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
              />
              <p className="text-[10px] text-[#8C7248] mt-1">Hasło widoczne pod nagłówkiem banera.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Napis na przycisku banera
                </label>
                <input
                  type="text"
                  placeholder="Odkryj kolekcję"
                  value={settings.heroButtonText || ""}
                  onChange={(e) => handleChange("heroButtonText", e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Link przycisku banera
                </label>
                <input
                  type="text"
                  placeholder="/katalog"
                  value={settings.heroButtonLink || ""}
                  onChange={(e) => handleChange("heroButtonLink", e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#EADFD5] space-y-4">
              <h3 className="font-serif text-xs uppercase tracking-wider text-[#241D1B] font-semibold">
                Górny kaszmirowy pasek ogłoszeń (Announcement Bar)
              </h3>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Środkowy tekst paska ogłoszeń (Główny komunikat)
                </label>
                <input
                  type="text"
                  placeholder="Darmowa dostawa od 300 zł • 14 dni na zwrot"
                  value={settings.announcementBarText || ""}
                  onChange={(e) => handleChange("announcementBarText", e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
                <p className="text-[10px] text-[#8C7248] mt-1">
                  Wyświetla się na środku paska na wszystkich stronach sklepu.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Lewy komunikat paska (komputery)
                  </label>
                  <input
                    type="text"
                    placeholder="AURA Boutique • Nowa Kolekcja"
                    value={settings.announcementBarLeft || ""}
                    onChange={(e) => handleChange("announcementBarLeft", e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Prawy komunikat paska (komputery)
                  </label>
                  <input
                    type="text"
                    placeholder="Wysyłka w 24h • Płatność BLIK"
                    value={settings.announcementBarRight || ""}
                    onChange={(e) => handleChange("announcementBarRight", e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                  />
                </div>
              </div>
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

          {/* Płatności Online: PayU & Przelewy24 */}
          <div className="bg-white p-6 border border-[#EADFD5] rounded shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#EADFD5] gap-2">
              <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#C5A069]" />
                <span>Płatności Online: PayU & BLIK</span>
              </h2>
              <div className="flex items-center gap-2">
                {settings.payuConfigured ? (
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>PayU Skonfigurowane</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-800 bg-amber-100 font-semibold px-2.5 py-0.5 rounded-full">
                    Brak konfiguracji PayU
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-[#6E6259] leading-relaxed">
              Skonfiguruj bramkę płatności <strong>PayU</strong>, aby umożliwić klientkom natychmiastowe płatności kodem BLIK, szybkimi przelewami online oraz kartami płatniczymi. Dane testowe i produkcyjne przechowywane są oddzielnie.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Status operatora PayU
                </label>
                <select
                  value={settings.payuEnabled !== false ? "enabled" : "disabled"}
                  onChange={(e) => handleChange("payuEnabled", e.target.value === "enabled")}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                >
                  <option value="enabled">Włączony (Aktywny w sklepie)</option>
                  <option value="disabled">Wyłączony</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Środowisko PayU
                </label>
                <select
                  value={settings.payuSandbox !== false ? "sandbox" : "production"}
                  onChange={(e) => handleChange("payuSandbox", e.target.value === "sandbox")}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                >
                  <option value="sandbox">Środowisko Testowe (Sandbox - secure.snd.payu.com)</option>
                  <option value="production">Środowisko Produkcyjne (secure.payu.com)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Domyślna bramka online
                </label>
                <select
                  value={settings.defaultPaymentGateway || "PAYU"}
                  onChange={(e) => handleChange("defaultPaymentGateway", e.target.value as any)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                >
                  <option value="PAYU">PayU (Zalecane: BLIK + Przelewy)</option>
                  <option value="P24">Przelewy24</option>
                </select>
              </div>
            </div>

            {/* Pola konfiguracji dla wybranego środowiska */}
            <div className="p-4 bg-[#FAF6F1] border border-[#EADFD5] rounded space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#241D1B]">
                  Parametry punktu płatności ({settings.payuSandbox !== false ? "Sandbox" : "Produkcja"}):
                </span>
                <span className="text-[10px] text-[#7A6458]">
                  Panel PayU → Moje sklepy → Punkty płatności POS → Klucze autoryzacji
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Identyfikator punktu płatności (POS ID) *
                  </label>
                  <input
                    type="text"
                    placeholder={settings.payuSandbox !== false ? "np. 300000" : "np. 456789"}
                    value={
                      (settings.payuSandbox !== false
                        ? settings.payuPosIdSandbox
                        : settings.payuPosId) || ""
                    }
                    onChange={(e) =>
                      handleChange(
                        settings.payuSandbox !== false ? "payuPosIdSandbox" : "payuPosId",
                        e.target.value.trim()
                      )
                    }
                    className="w-full bg-white border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] font-mono focus:outline-none focus:border-[#C5A069]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Drugi klucz MD5 (weryfikacja powiadomień) *
                  </label>
                  <input
                    type="password"
                    placeholder="Wpisz Drugi Klucz (MD5) lub pozostaw puste, aby zachować"
                    value={
                      (settings.payuSandbox !== false
                        ? settings.payuSecondKeySandbox
                        : settings.payuSecondKey) || ""
                    }
                    onChange={(e) =>
                      handleChange(
                        settings.payuSandbox !== false ? "payuSecondKeySandbox" : "payuSecondKey",
                        e.target.value.trim()
                      )
                    }
                    className="w-full bg-white border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] font-mono focus:outline-none focus:border-[#C5A069]"
                  />
                  <p className="text-[10px] text-[#8C7248] mt-1">
                    Sekret jest bezpiecznie zapisany na serwerze i nie jest ujawniany w przeglądarce.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    OAuth Client ID (opcjonalnie, domyślnie POS ID)
                  </label>
                  <input
                    type="text"
                    placeholder="Domyślnie równe POS ID"
                    value={
                      (settings.payuSandbox !== false
                        ? settings.payuClientIdSandbox
                        : settings.payuClientId) || ""
                    }
                    onChange={(e) =>
                      handleChange(
                        settings.payuSandbox !== false ? "payuClientIdSandbox" : "payuClientId",
                        e.target.value.trim()
                      )
                    }
                    className="w-full bg-white border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] font-mono focus:outline-none focus:border-[#C5A069]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    OAuth Client Secret (Klucz prywatny REST API)
                  </label>
                  <input
                    type="password"
                    placeholder="Wpisz Client Secret lub pozostaw puste"
                    value={
                      (settings.payuSandbox !== false
                        ? settings.payuClientSecretSandbox
                        : settings.payuClientSecret) || ""
                    }
                    onChange={(e) =>
                      handleChange(
                        settings.payuSandbox !== false
                          ? "payuClientSecretSandbox"
                          : "payuClientSecret",
                        e.target.value.trim()
                      )
                    }
                    className="w-full bg-white border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] font-mono focus:outline-none focus:border-[#C5A069]"
                  />
                </div>
              </div>

              {/* Adres powiadomień webhook do skopiowania do panelu PayU */}
              <div className="pt-2 border-t border-[#EADFD5] space-y-1.5">
                <label className="text-xs font-semibold text-[#241D1B] block">
                  Adres powiadomień serwerowych (Powiadomienie URL do wpisania w PayU):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://aura-boutique-w38e.vercel.app/api/payments/payu/notify"
                    className="w-full bg-white border border-[#EADFD5] p-2 text-xs font-mono text-[#3E3835] select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("https://aura-boutique-w38e.vercel.app/api/payments/payu/notify");
                      setCopiedPayUNotifyUrl(true);
                      setTimeout(() => setCopiedPayUNotifyUrl(false), 2000);
                    }}
                    className="px-3 py-2 bg-[#FAF6F1] border border-[#C5A069] text-[#7A5B20] text-xs font-semibold rounded hover:bg-[#C5A069] hover:text-white transition-all shrink-0 flex items-center gap-1"
                  >
                    {copiedPayUNotifyUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPayUNotifyUrl ? "Skopiowano!" : "Kopiuj URL"}</span>
                  </button>
                </div>
              </div>

              {/* Przycisk testu połączenia z PayU */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestPayU}
                  disabled={isCheckingPayU}
                  className="px-4 py-2.5 bg-[#241D1B] text-white text-xs uppercase tracking-wider font-semibold rounded hover:bg-[#3E3835] transition-all disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5 text-[#C5A069]" />
                  <span>{isCheckingPayU ? "Sprawdzanie..." : "Sprawdź połączenie z PayU"}</span>
                </button>

                {payuCheckResult && (
                  <div
                    className={`p-2.5 rounded text-xs flex items-center gap-2 flex-1 ${
                      payuCheckResult.success
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {payuCheckResult.success ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{payuCheckResult.message}</span>
                  </div>
                )}
              </div>
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-[#241D1B]">
                        Hasło do skrzynki pocztowej
                      </label>
                      {settings.smtpPasswordConfigured && (
                        <span className="text-[10px] text-emerald-800 bg-emerald-100 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Hasło zapisane na serwerze</span>
                        </span>
                      )}
                    </div>
                    <input
                      type="password"
                      placeholder={
                        settings.smtpPasswordConfigured
                          ? "Hasło zapisane. Pozostaw pole puste, aby go nie zmieniać"
                          : "Wpisz hasło do poczty WP"
                      }
                      value={settings.smtpPassword || ""}
                      onChange={(e) => handleChange("smtpPassword", e.target.value)}
                      className="w-full bg-white border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] font-mono focus:outline-none focus:border-[#C5A069]"
                    />
                    {settings.smtpPasswordConfigured && (
                      <div className="flex items-center justify-between mt-1 text-[11px] text-[#7A6458]">
                        <span>Hasło zapisane. Pozostaw pole puste, aby go nie zmieniać.</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Czy na pewno chcesz usunąć zapisane hasło SMTP?")) {
                              handleChange("smtpPassword", "");
                              handleChange("clearSmtpPassword" as any, true);
                              handleChange("smtpPasswordConfigured", false);
                            }
                          }}
                          className="text-red-600 hover:underline"
                        >
                          Usuń zapisane hasło
                        </button>
                      </div>
                    )}
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

                {/* Instrukcja dla poczty WP.pl w przypadku błędu 535 */}
                <div className="p-3 bg-[#FAF3E8] border border-[#E8D4BA] rounded text-[11px] text-[#6E4F18] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-[#5A3F0E]">
                    <Info className="w-4 h-4 shrink-0 text-[#C5A069]" />
                    <span>Ważne dla poczty WP.pl (rozwiązanie błędu 535: Invalid login / SMTP access disabled):</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-[#5A4526] leading-relaxed">
                    <li>
                      <strong>Aktywacja dostępu SMTP:</strong> W poczcie WP dostęp przez programy zewnętrzne jest domyślnie zablokowany. Zaloguj się na <a href="https://poczta.wp.pl" target="_blank" rel="noreferrer" className="underline font-bold text-[#8F6B38] hover:text-black">poczta.wp.pl ↗</a>, wejdź w <strong>Ustawienia (koło zębate) → Wszystkie opcje → Dostęp przez POP3/IMAP/SMTP</strong> i włącz suwak dostępu.
                    </li>
                    <li>
                      <strong>Login do skrzynki:</strong> Musi zawierać pełny adres z domeną, np. <code>aurazmigrod@wp.pl</code>.
                    </li>
                    <li>
                      <strong>Weryfikacja dwuetapowa (2FA):</strong> Jeśli włączono zabezpieczenie konta WP kodami SMS/2FA, zwykłe hasło do poczty zostanie odrzucone. Należy wówczas wygenerować w WP <em>Hasło do aplikacji</em> i wkleić je powyżej.
                    </li>
                  </ul>
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
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
                  <strong>Ważna uwaga:</strong> Usługa Resend API nie pozwala na wysyłkę z darmowych domen publicznych takich jak <code>@wp.pl</code> czy <code>@gmail.com</code> (wymaga dodania i weryfikacji wpisów DNS własnej domeny firmowej).
                  Jeśli korzystasz ze skrzynki w WP (np. <code>aurazmigrod@wp.pl</code>), zmień powyżej sposób wysyłki na <strong>„Poczta WP.pl / Własny serwer SMTP”</strong>.
                </div>
              </div>
            )}

            {/* Test wysyłki wiadomości e-mail oraz ponawianie */}
            <div className="pt-3 border-t border-[#EADFD5] space-y-3">
              <label className="text-xs font-semibold text-[#241D1B] block">
                Test połączenia oraz ponawianie wysyłki powitań
              </label>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="email"
                  placeholder="Adres do testu (np. aurazmigrod@wp.pl)"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  className="w-full sm:w-72 bg-[#FAF6F1] border border-[#EADFD5] px-3 py-2 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendTestEmail("TEST_EMAIL")}
                    disabled={isSendingTest}
                    className="px-3.5 py-2 bg-[#241D1B] text-white text-xs uppercase tracking-wider rounded hover:bg-[#3E3835] transition-all disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                    title="Wyślij prostą wiadomość sprawdzającą połączenie SMTP"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                    <span>{isSendingTest ? "Wysyłanie..." : "Test SMTP"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendTestEmail("WELCOME_CUSTOMER")}
                    disabled={isSendingTest}
                    className="px-3.5 py-2 bg-[#FAF6F1] border border-[#C5A069] text-[#7A5B20] text-xs uppercase tracking-wider rounded hover:bg-[#F3EADF] transition-all disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                    title="Wyślij podgląd maila powitalnego nowej klientki"
                  >
                    <span>Test Powitania</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRetryWelcomeEmails}
                    disabled={isSendingTest}
                    className="px-3.5 py-2 bg-[#8F6B38] text-white text-xs uppercase tracking-wider rounded hover:bg-[#78572A] transition-all disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                    title="Ponów wysyłkę e-maili powitalnych do zarejestrowanych klientek, których serwer nie obsłużył"
                  >
                    <span>Ponów nieudane powitania</span>
                  </button>
                </div>
              </div>

              {testResult && (
                <div
                  className={`text-xs p-3.5 rounded border whitespace-pre-line leading-relaxed shadow-xs ${
                    testResult.success
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-red-50 text-red-900 border-red-200 font-mono text-[11px]"
                  }`}
                >
                  {testResult.message}
                </div>
              )}

              {/* Historia wysłanych wiadomości (Outbox) */}
              <div className="pt-4 border-t border-[#EADFD5] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#241D1B]">
                    Dziennik zdarzeń e-mail (Historia wysyłek Outbox):
                  </span>
                  <button
                    type="button"
                    onClick={fetchOutbox}
                    className="text-[11px] text-[#C5A069] hover:underline font-medium"
                  >
                    Odśwież historię
                  </button>
                </div>

                {outboxList.length === 0 ? (
                  <p className="text-[11px] text-[#7A6458] italic">
                    Brak zarejestrowanych wysyłek w historii.
                  </p>
                ) : (
                  <div className="border border-[#EADFD5] rounded overflow-x-auto max-h-72">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-[#FAF6F1] border-b border-[#EADFD5] text-[#7A6458]">
                        <tr>
                          <th className="p-2">Typ zdarzenia</th>
                          <th className="p-2">Odbiorca</th>
                          <th className="p-2">Status</th>
                          <th className="p-2">Data / Odpowiedź serwera</th>
                          <th className="p-2 text-right">Akcja</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EADFD5]">
                        {outboxList.map((item) => (
                          <tr key={item.id} className="hover:bg-amber-50/30">
                            <td className="p-2 font-mono font-semibold text-[#241D1B]">
                              {item.type}
                            </td>
                            <td className="p-2 text-[#3E3835]">
                              {item.to}
                            </td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.status === "SENT"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : item.status === "FAILED"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {item.status === "SENT" ? "PRZYJĘTA (250 OK)" : item.status}
                              </span>
                            </td>
                            <td className="p-2 text-[10px] text-[#6E6259]">
                              <div>{new Date(item.createdAt).toLocaleString("pl-PL")}</div>
                              {item.smtpResponse && (
                                <div className="text-emerald-700 font-mono text-[9px]">{item.smtpResponse}</div>
                              )}
                              {item.errorMessage && (
                                <div className="text-red-700 text-[10px] line-clamp-1" title={item.errorMessage}>
                                  {item.errorMessage}
                                </div>
                              )}
                            </td>
                            <td className="p-2 text-right">
                              {item.status !== "SENT" && (
                                <button
                                  type="button"
                                  onClick={() => handleRetrySingleOutbox(item.id)}
                                  disabled={isRetryingOutboxId === item.id}
                                  className="px-2 py-1 bg-[#241D1B] hover:bg-[#3E3835] text-white text-[10px] rounded transition-all disabled:opacity-50"
                                >
                                  {isRetryingOutboxId === item.id ? "..." : "Ponów"}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
