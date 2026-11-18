import React from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllOrders, getProducts, getStoreSettings } from "@/lib/store-data";
import { CostCalculatorClient } from "@/components/admin/CostCalculatorClient";
import { initialCostCalculatorSettings } from "@/lib/demo-data";

export const metadata = {
  title: "Koszty i kalkulator marży | Panel AURA Boutique",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CostCalculatorPage() {
  await requireAdmin();

  try {
    const storeSettings = await getStoreSettings({ forAdminClient: true });
    const allOrders = await getAllOrders();
    // Zgodnie z wymaganiem: zamówienia testowe sandbox (isTest: true) są bezwzględnie wykluczone z kalkulacji biznesowych
    const productionOrders = (allOrders || []).filter((o) => !o.isTest);
    const products = (await getProducts({ includeArchived: true, forAdmin: true })) || [];

    const safeSettings = JSON.parse(
      JSON.stringify(storeSettings?.costCalculatorSettings || initialCostCalculatorSettings)
    );
    const safeOrders = JSON.parse(JSON.stringify(productionOrders));
    const safeProducts = JSON.parse(JSON.stringify(products));

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <CostCalculatorClient
          initialSettings={safeSettings}
          initialOrders={safeOrders}
          initialProducts={safeProducts}
        />
      </div>
    );
  } catch (err: any) {
    console.error("Błąd renderowania strony kalkulatora marży:", err);
    return (
      <div className="max-w-4xl mx-auto my-12 p-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-900">
        <h2 className="text-base font-bold mb-2">Błąd renderowania kalkulatora marży:</h2>
        <pre className="text-xs font-mono bg-white p-4 border border-rose-100 rounded overflow-x-auto">
          {err?.stack || err?.message || String(err)}
        </pre>
      </div>
    );
  }
}
