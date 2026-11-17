import React from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { PaymentSandboxClient } from "@/components/admin/PaymentSandboxClient";
import { CreditCard, ExternalLink, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Testowanie Płatności Sandbox | Panel AURA Boutique",
};

export default async function AdminPaymentSandboxPage() {
  await requireAdmin();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#EADFD5]">
        <div>
          <div className="flex items-center gap-2 text-[#C5A069] text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Środowisko Sandbox • Płatności Bez Obciążeń</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#241D1B]">
            Testowanie Płatności Online (PayU Sandbox)
          </h1>
          <p className="text-xs text-[#6E6259] mt-1 max-w-2xl leading-relaxed">
            Testuj pełny obieg transakcji (sukces, odrzucenie, ponowienie, powiadomienia IPN oraz zwalnianie rezerwacji i kodów rabatowych) bez używania prawdziwych pieniędzy ani prywatnych kart bankowych.
          </p>
        </div>

        <a
          href="/admin/ustawienia"
          className="px-3.5 py-2 bg-white border border-[#C5A069] text-[#8C6B38] hover:bg-[#FAF6F1] rounded text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-2xs self-start sm:self-auto shrink-0"
        >
          <span>Konfiguracja w Ustawieniach</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <PaymentSandboxClient />
    </div>
  );
}
