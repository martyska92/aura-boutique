const https = require("https");

const payload = {
  email: "aurazmigrod@wp.pl",
  role: "ADMIN",
  isAdmin: true,
  mustChangePassword: false,
  customerName: "Właścicielka Butiku",
  createdAt: Date.now(),
  expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
};
const cookie = "aura_admin_session=" + Buffer.from(JSON.stringify(payload)).toString("base64");
const baseUrl = "https://aura-boutique-w38e.vercel.app";

async function run() {
  console.log("=================================================");
  console.log("🚀 WERYFIKACJA DZIAŁAJĄCEJ STRONY PRODUKCYJNEJ");
  console.log("Adres: " + baseUrl);
  console.log("=================================================\n");

  // 1. Sprawdzenie strony /admin oraz /admin/koszty-i-marze
  console.log("1. Testowanie dostępu do panelu admina...");
  const adminRes = await fetch(baseUrl + "/admin", {
    headers: { Cookie: cookie, "User-Agent": "AuraVerification/1.0" },
  });
  console.log("HTTP Status /admin:", adminRes.status);

  const pageRes = await fetch(baseUrl + "/admin/koszty-i-marze", {
    headers: { Cookie: cookie, "User-Agent": "AuraVerification/1.0" },
  });
  console.log("HTTP Status /admin/koszty-i-marze:", pageRes.status);
  const html = await pageRes.text();
  console.log("HTML Preview (first 500 chars):", html.slice(0, 500));
  const hasTitle = html.includes("Koszty i kalkulator marży") || html.includes("Koszty i zysk");
  const hasTabs = html.includes("Widok Produktu") || html.includes("Widok Zamówienia") || html.includes("Koszty Stałe & Zasady");
  console.log("Czy strona zawiera nagłówek modułu:", hasTitle);
  console.log("Czy strona zawiera zakładki kalkulatora:", hasTabs);

  // 2. Test odczytu API kalkulatora
  console.log("\n2. Testowanie API GET /api/admin/cost-calculator...");
  const getRes = await fetch(baseUrl + "/api/admin/cost-calculator", {
    headers: { Cookie: cookie },
  });
  console.log("GET API Status:", getRes.status);
  const getData = await getRes.json();
  console.log("Dane z bazy Neon:", {
    ordersFound: getData.orders?.length || 0,
    productsFound: getData.products?.length || 0,
    vatMode: getData.settings?.vatMode || "nieustawiony",
    fixedCostsCount: getData.settings?.fixedCosts?.length || 0,
  });

  // 3. Test zapisu kosztów i marż
  console.log("\n3. Testowanie zapisu POST /api/admin/cost-calculator do bazy Neon...");
  const updatedSettings = {
    vatMode: "VAT_EXEMPT",
    fixedCosts: [
      { id: "fc_host", name: "Hosting Vercel & Baza Neon", amount: 120.0, isMonthly: true },
      { id: "fc_ksieg", name: "Księgowość butiku", amount: 350.0, isMonthly: true },
      { id: "fc_lokal", name: "Lokal Żmigród ul. Poprzeczna", amount: 1200.0, isMonthly: true },
    ],
    packagingCosts: [
      { id: "pkg_box", name: "Karton fasonowy AURA", amount: 3.5 },
      { id: "pkg_tape", name: "Taśma papierowa z logo", amount: 0.8 },
      { id: "pkg_fill", name: "Bibułka ozdobna & naklejka", amount: 0.6 },
    ],
    freebieCosts: [
      { id: "fr_sock", name: "Skarpetki damskie bawełna", purchasePrice: 4.2 },
      { id: "fr_sweets", name: "Cukierek krówka AURA", purchasePrice: 0.5 },
    ],
    defaultGatewayCommissions: {
      blikPercent: 0.012,
      blikFixed: 0.0,
      p24CardPercent: 0.014,
      p24CardFixed: 0.3,
      payuCardPercent: 0.014,
      payuCardFixed: 0.3,
    },
  };

  const postRes = await fetch(baseUrl + "/api/admin/cost-calculator", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({ settings: updatedSettings }),
  });
  console.log("POST API Status:", postRes.status);
  const postData = await postRes.json();
  console.log("POST API Response:", postData);

  // 4. Test odświeżenia i trwałości w bazie Neon
  console.log("\n4. Sprawdzenie trwałości po ponownym pobraniu (GET)...");
  const verifyRes = await fetch(baseUrl + "/api/admin/cost-calculator", {
    headers: { Cookie: cookie },
  });
  const verifyData = await verifyRes.json();
  console.log("Zweryfikowane ustawienia w bazie Neon:", {
    success: verifyData.success,
    vatMode: verifyData.settings?.vatMode,
    fixedCosts: verifyData.settings?.fixedCosts?.map((f) => `${f.name}: ${f.amount} zł`),
    packagingCount: verifyData.settings?.packagingCosts?.length,
    freebiesCount: verifyData.settings?.freebieCosts?.length,
  });

  // 5. Test 8 scenariuszy płatności PayU Sandbox na żywej produkcji
  console.log("\n5. Uruchamianie 8 scenariuszy płatności na żywej produkcji...");
  const suiteRes = await fetch(baseUrl + "/api/admin/payments/test-suite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
  });
  console.log("Status API Test Suite:", suiteRes.status);
  const suiteData = await suiteRes.json();
  console.log("\nWyniki 8 testów PayU Sandbox:");
  if (suiteData.results && Array.isArray(suiteData.results)) {
    suiteData.results.forEach((r, idx) => {
      const icon = r.passed ? "✅ PASS" : "❌ FAIL";
      console.log(`[Test #${idx + 1}] ${r.name}: ${icon} - ${r.details || ""}`);
      if (!r.passed && r.assertions) {
        console.log("   Assertions:", JSON.stringify(r.assertions, null, 2));
      }
    });
    console.log(`\nŁączny wynik: ${suiteData.scenariosPassed}/${suiteData.scenariosTotal} testów zaliczonych.`);
  } else {
    console.log("Odpowiedź API:", suiteData);
  }
}

run().catch((err) => console.error("Krytyczny błąd weryfikacji:", err));
