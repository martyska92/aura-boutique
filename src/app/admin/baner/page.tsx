import React from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { BannerVisualEditor } from "@/components/admin/BannerVisualEditor";
import { ExternalLink, Sparkles } from "lucide-react";

export const metadata = {
  title: "Wizualny Edytor Banera | Panel AURA Boutique",
};

export default async function AdminBannerPage() {
  await requireAdmin();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#EADFD5]">
        <div>
          <div className="flex items-center gap-2 text-[#C5A069] text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Wizualny Kreator Treści</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#241D1B]">
            Edytor Banera Głównego
          </h1>
          <p className="text-xs text-[#6E6259] mt-1 max-w-2xl">
            Przeciągaj teksty myszką i dotykiem, dopasowuj pozycje, kroje pisma, kolory oraz szerokości pól. Ustawiaj osobne parametry dla komputerów, tabletów i telefonów. Zmiany stają się widoczne dla klientek dopiero po kliknięciu „Opublikuj”.
          </p>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="px-3.5 py-2 bg-white border border-[#C5A069] text-[#8C6B38] hover:bg-[#FAF6F1] rounded text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-2xs self-start sm:self-auto shrink-0"
        >
          <span>Otwórz stronę główną</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <BannerVisualEditor />
    </div>
  );
}
