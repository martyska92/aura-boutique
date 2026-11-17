import React from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { CalendarClient } from "@/components/admin/CalendarClient";

export const metadata = {
  title: "Notatki i Kalendarz | Panel AURA Boutique",
};

export default async function AdminCalendarPage() {
  await requireAdmin();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <CalendarClient />
    </div>
  );
}
