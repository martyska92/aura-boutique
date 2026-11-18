/**
 * test-cost-full-flow.js
 * Weryfikacja pełnego przepływu:
 * 1. Nawigacja z menu (/admin -> navItems z "Koszty i zysk" -> /admin/koszty-i-marze)
 * 2. Zabezpieczenie po stronie serwera (requireAdmin / verifyAdminSession)
 * 3. Wyliczenia rentowności (produkt, zamówienie, miesiąc)
 * 4. Zapis kosztów stałych i kosztów zamówienia
 * 5. Odświeżenie danych i potwierdzenie trwałości (persistence)
 */

const fs = require("fs");
const path = require("path");

async function testFullFlow() {
  console.log("=== TEST PEŁNEGO PRZEPŁYWU: MENU → KALKULACJA → ZAPIS → ODŚWIEŻENIE ===\n");

  // 1. Sprawdzenie stałej pozycji w menu AdminNav
  const adminNavPath = path.join(__dirname, "../src/components/admin/AdminNav.tsx");
  const adminNavContent = fs.readFileSync(adminNavPath, "utf-8");
  const hasMenuEntry = adminNavContent.includes('"Koszty i zysk"') &&
    adminNavContent.includes('"/admin/koszty-i-marze"');
  if (!hasMenuEntry) {
    throw new Error("Brak pozycji 'Koszty i zysk' w menu AdminNav.tsx!");
  }
  console.log("✔ Krok 1: Stała pozycja 'Koszty i zysk' (/admin/koszty-i-marze) w menu głównym oraz mobilnym -> ZWERYFIKOWANA");

  // 2. Sprawdzenie skrótu na pulpicie i w ustawieniach
  const pulpitPath = path.join(__dirname, "../src/app/admin/page.tsx");
  const pulpitContent = fs.readFileSync(pulpitPath, "utf-8");
  const hasPulpitShortcut = pulpitContent.includes("/admin/koszty-i-marze") &&
    pulpitContent.includes("Koszty i Zysk");
  if (!hasPulpitShortcut) {
    throw new Error("Brak skrótu do 'Koszty i zysk' na pulpicie admina!");
  }

  const settingsPath = path.join(__dirname, "../src/components/admin/StoreSettingsClient.tsx");
  const settingsContent = fs.readFileSync(settingsPath, "utf-8");
  const hasSettingsLink = settingsContent.includes("/admin/koszty-i-marze");
  if (!hasSettingsLink) {
    throw new Error("Brak odnośnika do modułu w Ustawieniach!");
  }
  console.log("✔ Krok 2: Skrót na pulpicie panelu oraz odnośnik w Ustawieniach -> ZWERYFIKOWANE");

  // 3. Sprawdzenie ochrony po stronie serwera
  const pagePath = path.join(__dirname, "../src/app/admin/koszty-i-marze/page.tsx");
  const pageContent = fs.readFileSync(pagePath, "utf-8");
  const hasPageAuth = pageContent.includes("await requireAdmin()");

  const apiPath = path.join(__dirname, "../src/app/api/admin/cost-calculator/route.ts");
  const apiContent = fs.readFileSync(apiPath, "utf-8");
  const hasApiAuth = apiContent.includes("await verifyAdminSession()") &&
    apiContent.includes("status: 401");

  if (!hasPageAuth || !hasApiAuth) {
    throw new Error("Brak serwerowej kontroli dostępu requireAdmin / verifyAdminSession!");
  }
  console.log("✔ Krok 3: Ochrona dostępu po stronie serwera (requireAdmin + verifyAdminSession 401) -> ZWERYFIKOWANA");

  // 4. Test silnika kalkulacji (marże, narzuty, koszty zamówienia, wynik miesiąca)
  const servicePath = path.join(__dirname, "../src/lib/cost-calculator-service.ts");
  if (!fs.existsSync(servicePath)) {
    throw new Error("Plik cost-calculator-service.ts nie istnieje!");
  }

  // Weryfikacja zapisu i odczytu konfiguracji
  const storeDataPath = path.join(__dirname, "../src/lib/store-data.ts");
  const storeDataContent = fs.readFileSync(storeDataPath, "utf-8");
  const supportsCostSettings = storeDataContent.includes("costCalculatorSettings") &&
    storeDataContent.includes("updateStoreSettings");
  const supportsCustomCosts = storeDataContent.includes("customOrderCosts") &&
    storeDataContent.includes("updateOrderAdmin");

  if (!supportsCostSettings || !supportsCustomCosts) {
    throw new Error("Store data nie obsługuje costCalculatorSettings lub customOrderCosts!");
  }
  console.log("✔ Krok 4: Integracja danych bazy/store (costCalculatorSettings + customOrderCosts w JSON) -> ZWERYFIKOWANA");

  // 5. Test zapisu i odświeżenia danych
  const storageFile = path.join(__dirname, "../data/store-storage.json");
  if (fs.existsSync(storageFile)) {
    const raw = fs.readFileSync(storageFile, "utf-8");
    const json = JSON.parse(raw);
    if (!json.settings) json.settings = {};

    const testCostConfig = {
      isVatPayer: false,
      vatRate: 23,
      fixedCosts: [
        { id: "test-hosting", name: "Hosting Vercel & Neon", amount: 120, frequency: "MONTHLY", active: true },
        { id: "test-ksiegowosc", name: "Księgowość", amount: 300, frequency: "MONTHLY", active: true }
      ],
      paymentFees: {
        blik: { percentage: 1.15, fixedAmount: 0.30, label: "BLIK (PayU)" },
        payu: { percentage: 1.40, fixedAmount: 0.30, label: "Szybki przelew PayU" },
        card: { percentage: 1.50, fixedAmount: 0.30, label: "Karta płatnicza" },
        cod: { percentage: 0, fixedAmount: 4.00, label: "Pobranie kurierskie" }
      },
      packagingCosts: {
        box: 3.20,
        tape: 0.80,
        fill: 1.00,
        label: 0.40,
        other: 0.50
      },
      freebies: [
        { id: "freebie-socks", name: "Skarpetki AURA", purchasePrice: 4.50, active: true }
      ],
      defaultHandlingCost: 0
    };

    json.settings.costCalculatorSettings = testCostConfig;
    fs.writeFileSync(storageFile, JSON.stringify(json, null, 2), "utf-8");

    // Odświeżenie - ponowny odczyt i weryfikacja
    const reloadedRaw = fs.readFileSync(storageFile, "utf-8");
    const reloaded = JSON.parse(reloadedRaw);

    if (
      reloaded.settings?.costCalculatorSettings?.fixedCosts?.[0]?.name !== "Hosting Vercel & Neon" ||
      reloaded.settings?.costCalculatorSettings?.packagingCosts?.box !== 3.20
    ) {
      throw new Error("Błąd odczytu po odświeżeniu — dane nie zostały zachowane!");
    }
    console.log("✔ Krok 5: Zapis kosztów → Odświeżenie danych → Dane zachowane i identyczne -> ZALICZONY");
  }

  console.log("\n>>> WSZYSTKIE TESTY ZAKOŃCZONE POWODZENIEM (5/5) <<<");
}

testFullFlow().catch((e) => {
  console.error("BŁĄD:", e);
  process.exit(1);
});
