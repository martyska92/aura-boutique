import React from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { getStoreSettings, isNeonConfigured } from "@/lib/store-data";
import { StoreSettingsClient } from "@/components/admin/StoreSettingsClient";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getStoreSettings();
  const isNeonConnected = isNeonConfigured();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-[#141414]">
          Ustawienia Butiku & Integracje
        </h1>
        <p className="text-xs text-[#7E7771] mt-1">
          Edytuj informacje o butiku w Żmigrodzie, treści banera, progi bezpłatnej dostawy oraz konfigurację bazy Neon PostgreSQL.
        </p>
      </div>

      <StoreSettingsClient
        initialSettings={settings}
        isNeonConnected={isNeonConnected}
      />
    </div>
  );
}
