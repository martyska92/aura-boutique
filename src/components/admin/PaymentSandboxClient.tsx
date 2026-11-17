"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCw,
  ExternalLink,
  Lock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Check,
  Copy,
  Clock,
  ArrowRight,
  Server,
} from "lucide-react";

interface Assertion {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

interface ScenarioResult {
  id: number;
  name: string;
  description: string;
  passed: boolean;
  durationMs: number;
  details: string;
  assertions: Assertion[];
}

interface TestSuiteResponse {
  success: boolean;
  allPassed: boolean;
  scenariosPassed: number;
  scenariosTotal: number;
  results: ScenarioResult[];
}

export function PaymentSandboxClient() {
  // Test połączenia z PayU Sandbox
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    success: boolean;
    message: string;
    isSandbox: boolean;
  } | null>(null);

  // Stan automatycznego runnera 8 scenariuszy
  const [isRunningSuite, setIsRunningSuite] = useState(false);
  const [suiteResult, setSuiteResult] = useState<TestSuiteResponse | null>(null);
  const [suiteError, setSuiteError] = useState<string | null>(null);
  const [expandedScenarios, setExpandedScenarios] = useState<Record<number, boolean>>({});

  // Stan płatności na żywo w PayU Sandbox
  const [testAmount, setTestAmount] = useState<string>("189.00");
  const [testShippingMethod, setTestShippingMethod] = useState<string>("INPOST_LOCKER");
  const [testCoupon, setTestCoupon] = useState<string>("");
  const [isCreatingTestOrder, setIsCreatingTestOrder] = useState(false);
  const [testOrderError, setTestOrderError] = useState<string | null>(null);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<{
    orderId: string;
    orderNumber: string;
    paymentUrl: string;
    totalAmount: number;
  } | null>(null);

  // Kopiowanie danych testowych
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  // Test połączenia z PayU
  const handleTestConnection = async () => {
    setIsCheckingConnection(true);
    setConnectionResult(null);
    try {
      const res = await fetch("/api/admin/payments/payu/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { payuSandbox: true } }),
      });
      const data = await res.json();
      setConnectionResult(data);
    } catch (e: any) {
      setConnectionResult({
        success: false,
        message: "Błąd połączenia: " + e.message,
        isSandbox: true,
      });
    } finally {
      setIsCheckingConnection(false);
    }
  };

  // Uruchomienie test runnera 8 scenariuszy
  const handleRunSuite = async () => {
    setIsRunningSuite(true);
    setSuiteResult(null);
    setSuiteError(null);
    try {
      const res = await fetch("/api/admin/payments/test-suite", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas wykonywania testów.");
      }
      setSuiteResult(data);
      // Rozwiń domyślnie wszystkie scenariusze
      const exp: Record<number, boolean> = {};
      (data.results || []).forEach((r: ScenarioResult) => {
        exp[r.id] = true;
      });
      setExpandedScenarios(exp);
    } catch (e: any) {
      setSuiteError(e.message || "Błąd wykonania scenariuszy testowych.");
    } finally {
      setIsRunningSuite(false);
    }
  };

  // Utworzenie zamówienia testowego na żywo
  const handleCreateTestOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingTestOrder(true);
    setTestOrderError(null);
    setLastCreatedOrder(null);

    try {
      const res = await fetch("/api/admin/payments/test-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(testAmount) || 129.0,
          shippingMethod: testShippingMethod,
          couponCode: testCoupon.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Nie udało się utworzyć zamówienia testowego.");
      }

      setLastCreatedOrder(data);
    } catch (e: any) {
      setTestOrderError(e.message || "Wystąpił błąd przy tworzeniu testowego zamówienia.");
    } finally {
      setIsCreatingTestOrder(false);
    }
  };

  const toggleScenario = (id: number) => {
    setExpandedScenarios((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8">
      {/* Baner bezpieczeństwa i izolacji środowisk */}
      <div className="p-5 bg-gradient-to-r from-[#FAF6F1] via-white to-[#FAF6F1] border border-[#EADFD5] rounded-xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#C5A069]/15 flex items-center justify-center text-[#7A5B20] shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#C5A069]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-base font-semibold text-[#241D1B]">
                  Chronione Środowisko Testowe (PayU Sandbox)
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Płatności bez opłat
                </span>
              </div>
              <p className="text-xs text-[#6E6259] mt-1 leading-relaxed max-w-3xl">
                Wszystkie transakcje na tej stronie są kierowane do oficjalnego środowiska testowego{" "}
                <strong className="text-[#241D1B]">secure.snd.payu.com</strong>. Publiczna kasa
                klientek nie korzysta z sandboxa, a zamówienia testowe są ściśle odizolowane od
                rzeczywistej sprzedaży, księgowości i stanów magazynowych.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={handleTestConnection}
              disabled={isCheckingConnection}
              className="px-3.5 py-2 bg-white border border-[#C5A069] text-[#7A5B20] hover:bg-[#FAF6F1] rounded text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <RotateCw
                className={`w-3.5 h-3.5 ${isCheckingConnection ? "animate-spin" : ""}`}
              />
              <span>
                {isCheckingConnection ? "Weryfikacja..." : "Sprawdź połączenie z Sandboxem"}
              </span>
            </button>
          </div>
        </div>

        {connectionResult && (
          <div
            className={`mt-4 p-3 rounded text-xs flex items-center gap-2.5 ${
              connectionResult.success
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {connectionResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{connectionResult.message}</span>
          </div>
        )}
      </div>

      {/* Ściągawka oficjalnych danych testowych operatora */}
      <div className="bg-white border border-[#EADFD5] rounded-xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 pb-2 border-b border-[#EADFD5]">
          <CreditCard className="w-4 h-4 text-[#C5A069]" />
          <h3 className="font-serif text-sm uppercase tracking-wider text-[#241D1B] font-semibold">
            Oficjalne Dane Testowe PayU Sandbox (Do użytku na formatce płatności)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Karta z autoryzacją */}
          <div className="p-3.5 bg-[#FAF8F5] border border-[#EADFD5] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Karta udana (Sukces)
              </span>
              <button
                type="button"
                onClick={() => handleCopy("4000000000000001", "c1")}
                className="text-[11px] text-[#8C6B38] hover:text-[#241D1B] flex items-center gap-1"
              >
                {copiedItem === "c1" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copiedItem === "c1" ? "Skopiowano" : "Kopiuj"}
              </button>
            </div>
            <p className="font-mono text-xs font-semibold text-[#241D1B]">4000 0000 0000 0001</p>
            <p className="text-[11px] text-[#6E6259]">
              Data: dowolna przyszła (np. 12/28) • CVV: 123
            </p>
          </div>

          {/* Karta odrzucona */}
          <div className="p-3.5 bg-[#FAF8F5] border border-[#EADFD5] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-red-800 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-red-600" />
                Karta odrzucona (Brak środków)
              </span>
              <button
                type="button"
                onClick={() => handleCopy("4000000000000002", "c2")}
                className="text-[11px] text-[#8C6B38] hover:text-[#241D1B] flex items-center gap-1"
              >
                {copiedItem === "c2" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copiedItem === "c2" ? "Skopiowano" : "Kopiuj"}
              </button>
            </div>
            <p className="font-mono text-xs font-semibold text-[#241D1B]">4000 0000 0000 0002</p>
            <p className="text-[11px] text-[#6E6259]">
              Symuluje odmowę banku / brak środków na karcie
            </p>
          </div>

          {/* BLIK Sandbox */}
          <div className="p-3.5 bg-[#FAF8F5] border border-[#EADFD5] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                BLIK Testowy (Sandbox)
              </span>
              <button
                type="button"
                onClick={() => handleCopy("777123", "b1")}
                className="text-[11px] text-[#8C6B38] hover:text-[#241D1B] flex items-center gap-1"
              >
                {copiedItem === "b1" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copiedItem === "b1" ? "Skopiowano" : "Kopiuj"}
              </button>
            </div>
            <p className="font-mono text-xs font-semibold text-[#241D1B]">
              777 123 (Sukces) / 777 124 (Błąd)
            </p>
            <p className="text-[11px] text-[#6E6259]">
              Wpisz ten kod w okno BLIK bez otwierania aplikacji bankowej
            </p>
          </div>
        </div>
      </div>

      {/* SEKCJA 1: AUTOMATYCZNY TESTER 8 SCENARIUSZY */}
      <div className="bg-white border border-[#EADFD5] rounded-xl p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#EADFD5]">
          <div>
            <h3 className="font-serif text-base uppercase tracking-wider text-[#241D1B] font-semibold flex items-center gap-2">
              <span>Automatyczny Test 8 Scenariuszy Płatności</span>
              {suiteResult && (
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-sans font-semibold normal-case ${
                    suiteResult.allPassed
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {suiteResult.scenariosPassed} / {suiteResult.scenariosTotal} zaliczonych
                </span>
              )}
            </h3>
            <p className="text-xs text-[#6E6259] mt-1">
              Weryfikuje autentyczność podpisów SHA-256, odrzucenia, ponowienia, aktualizacje przez
              webhook, ochronę idempotentną oraz zwalnianie rezerwacji i kodów rabatowych.
            </p>
          </div>

          <button
            onClick={handleRunSuite}
            disabled={isRunningSuite}
            className="px-5 py-2.5 bg-[#241D1B] hover:bg-[#3E3835] text-white rounded text-xs uppercase tracking-wider font-semibold transition-all inline-flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 shrink-0"
          >
            {isRunningSuite ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-[#C5A069]" />
                <span>Wykonywanie testów...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-[#C5A069]" />
                <span>Uruchom pełny test 8 scenariuszy</span>
              </>
            )}
          </button>
        </div>

        {suiteError && (
          <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{suiteError}</span>
          </div>
        )}

        {/* Wyniki scenariuszy */}
        {suiteResult && (
          <div className="space-y-3 pt-2">
            {suiteResult.results.map((scenario) => {
              const isExpanded = Boolean(expandedScenarios[scenario.id]);
              return (
                <div
                  key={scenario.id}
                  className={`border rounded-lg transition-all ${
                    scenario.passed
                      ? "border-emerald-200 bg-white"
                      : "border-red-200 bg-red-50/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleScenario(scenario.id)}
                    className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#FAF8F5]/60 transition-colors rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      {scenario.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#C5A069]">
                            #{scenario.id}
                          </span>
                          <span className="text-xs font-semibold text-[#241D1B]">
                            {scenario.name}
                          </span>
                          <span className="text-[10px] text-[#8C6B38] bg-[#FAF6F1] px-1.5 py-0.5 rounded font-mono">
                            {scenario.durationMs} ms
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6E6259] mt-0.5">
                          {scenario.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          scenario.passed
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {scenario.passed ? "ZALICZONY" : "BŁĄD"}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#8C6B38]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#8C6B38]" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-[#EADFD5]/60 space-y-3 bg-[#FAF8F5]/40 rounded-b-lg">
                      <div className="text-xs text-[#241D1B] bg-white p-2.5 rounded border border-[#EADFD5]">
                        <span className="font-semibold text-[#8C6B38]">Przebieg: </span>
                        {scenario.details}
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8C6B38]">
                          Kryteria weryfikacji serwera:
                        </p>
                        <div className="space-y-1">
                          {scenario.assertions.map((a, idx) => (
                            <div
                              key={idx}
                              className="text-xs p-2 rounded bg-white border border-[#EADFD5] flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2">
                                {a.passed ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                )}
                                <span className="text-[#241D1B]">{a.name}</span>
                              </div>
                              <span className="font-mono text-[10px] text-[#6E6259]">
                                Oczekiwano: <strong className="text-[#241D1B]">{a.expected}</strong>{" "}
                                | Otrzymano:{" "}
                                <strong
                                  className={a.passed ? "text-emerald-700" : "text-red-700"}
                                >
                                  {a.actual}
                                </strong>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SEKCJA 2: INTERAKTYWNA PŁATNOŚĆ NA ŻYWO W PAYU SANDBOX */}
      <div className="bg-white border border-[#EADFD5] rounded-xl p-6 space-y-5 shadow-xs">
        <div className="pb-3 border-b border-[#EADFD5]">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-[#C5A069]" />
            <h3 className="font-serif text-base uppercase tracking-wider text-[#241D1B] font-semibold">
              Płatność Testowa na Żywo w Bramce PayU Sandbox
            </h3>
          </div>
          <p className="text-xs text-[#6E6259] mt-1">
            Utwórz bezpieczne testowe zamówienie oznaczone jako{" "}
            <strong className="text-amber-800">„PŁATNOŚĆ TESTOWA — bez pobierania pieniędzy”</strong>{" "}
            i przejdź bezpośrednio do oficjalnej bramki PayU Sandbox (secure.snd.payu.com), aby
            przetestować płatność kartą testową lub kodem BLIK 777123.
          </p>
        </div>

        <form onSubmit={handleCreateTestOrder} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#241D1B] block mb-1">
              Kwota produktów (PLN)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
              className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#241D1B] block mb-1">
              Metoda dostawy
            </label>
            <select
              value={testShippingMethod}
              onChange={(e) => setTestShippingMethod(e.target.value)}
              className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
            >
              <option value="INPOST_LOCKER">Paczkomat InPost (+13.00 zł)</option>
              <option value="COURIER">Kurier InPost (+15.00 zł)</option>
              <option value="LOCAL_PICKUP">Odbiór osobisty w butiku (0.00 zł)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#241D1B] block mb-1">
              Kod rabatowy (opcjonalnie)
            </label>
            <input
              type="text"
              placeholder="np. WITAJ15"
              value={testCoupon}
              onChange={(e) => setTestCoupon(e.target.value)}
              className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
            />
          </div>

          <div className="sm:col-span-3 pt-2">
            <button
              type="submit"
              disabled={isCreatingTestOrder}
              className="px-5 py-2.5 bg-[#C5A069] hover:bg-[#AF884F] text-white rounded text-xs uppercase tracking-wider font-semibold transition-all inline-flex items-center gap-2 shadow-2xs disabled:opacity-50"
            >
              {isCreatingTestOrder ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Rejestracja w PayU Sandbox...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Wygeneruj testowe zamówienie i przejdź do PayU Sandbox</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {testOrderError && (
          <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{testOrderError}</span>
          </div>
        )}

        {lastCreatedOrder && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-3 text-emerald-950">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Utworzono zamówienie testowe {lastCreatedOrder.orderNumber} (Łącznie:{" "}
                {lastCreatedOrder.totalAmount.toFixed(2)} PLN)
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Sandbox Gotowy
              </span>
            </div>

            <p className="text-xs text-emerald-800 leading-relaxed">
              Transakcja została pomyślnie zarejestrowana u operatora PayU. Kliknij poniższy
              przycisk, aby otworzyć bezpieczną formatkę testową:
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href={lastCreatedOrder.paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-[#241D1B] hover:bg-[#3E3835] text-white text-xs font-semibold rounded inline-flex items-center gap-1.5 transition-all shadow-xs"
              >
                <span>Otwórz Bramkę PayU Sandbox</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#C5A069]" />
              </a>

              <Link
                href={`/zamowienie/${lastCreatedOrder.orderId}/potwierdzenie`}
                target="_blank"
                className="px-4 py-2 bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100/50 text-xs font-semibold rounded inline-flex items-center gap-1.5 transition-all"
              >
                <span>Podgląd Zamówienia w Sklepie</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
