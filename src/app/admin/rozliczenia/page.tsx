import React from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllOrders } from "@/lib/store-data";
import { RozliczeniaClient } from "@/components/admin/RozliczeniaClient";

export const metadata = {
  title: "Rozliczenia i Finanse | Panel AURA Boutique",
};

export default async function RozliczeniaPage() {
  await requireAdmin();

  const orders = await getAllOrders();
  // Filtrujemy tylko rzeczywiste zamówienia (testowe sandbox są wykluczone z rozliczeń)
  const productionOrders = orders.filter((o) => !o.isTest);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <RozliczeniaClient initialOrders={productionOrders} />
    </div>
  );
}
