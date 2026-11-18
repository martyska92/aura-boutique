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
}
