import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { getOrderById, getStoreSettings } from "@/lib/store-data";

interface ConfirmationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderConfirmationPage({ params }: ConfirmationPageProps) {
  const { id } = await params;
  const order = await getOrderById(id);
  const settings = await getStoreSettings();

  if (!order) {
    notFound();
  }

  const shippingLabels = {
    INPOST_LOCKER: `Paczkomaty InPost (Paczkomat: ${order.parcelLockerCode || "N/A"})`,
    COURIER: `Kurier InPost / DPD (${order.shippingStreet}, ${order.shippingPostalCode} ${order.shippingCity})`,
    LOCAL_PICKUP: "Odbiór osobisty w Butiku: Żmigród, ul. Poprzeczna 3/1A",
  };

  const paymentLabels = {
    BLIK: "Płatność online BLIK / Przelewy24",
    PRZELEWY24: "Szybki przelew online Przelewy24",
    TRADITIONAL_TRANSFER: "Tradycyjny przelew bankowy na konto butiku",
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#FAF8F5] py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Karta potwierdzenia */}
          <div className="bg-white border border-[#EADFD5] rounded-xs p-6 sm:p-10 space-y-8 shadow-xs">
            {/* Nagłówek statusu */}
            <div className="text-center space-y-3 pb-6 border-b border-[#EADFD5]">
              <div className="flex justify-center pb-2">
                <BrandLogo size="md" />
              </div>
              <div className="w-16 h-16 rounded-full bg-[#FAF6F1] text-[#C5A069] flex items-center justify-center mx-auto border-2 border-[#D8BE8E]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-[#C5A069] font-semibold">
                Dziękujemy za zakupy w AURA Boutique K.B.
              </p>
              <h1 className="font-serif text-2xl sm:text-3xl text-[#241D1B]">
                Zamówienie zostało przyjęte!
              </h1>
              <p className="text-xs text-[#857670]">
                Numer Twojego zamówienia:{" "}
                <strong className="text-[#241D1B] font-mono text-sm">
                  {order.orderNumber}
                </strong>
              </p>
            </div>

            {/* ODDZIELONE STATUSY: Realizacja vs Płatność (zgodnie z wymogiem!) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#FAF6F1] border border-[#EADFD5] rounded-xs text-xs">
              <div className="space-y-1">
                <span className="text-[#857670] uppercase tracking-wider text-[10px] block">
                  Status realizacji zamówienia:
                </span>
                <span className="font-semibold text-[#241D1B] inline-flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[#C5A069]" />
                  <span>Nowe (Oczekuje na weryfikację butiku)</span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[#857670] uppercase tracking-wider text-[10px] block">
                  Status płatności:
                </span>
                <span className="font-semibold text-amber-800 inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Oczekuje na zaksięgowanie (PENDING)</span>
                </span>
              </div>
            </div>

            {/* Informacja o płatności i braku fikcyjnego potwierdzenia */}
            <div className="p-4 bg-[#F2DCD7]/50 border border-[#DFBEB8] rounded-xs space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#542823] font-semibold">
                <CreditCard className="w-4 h-4 text-[#C5A069]" />
                <span>Instrukcja i status płatności:</span>
              </div>

              {order.paymentMethod === "TRADITIONAL_TRANSFER" ? (
                <div className="space-y-1.5 text-[#4A3F3B] font-light">
                  <p>Prosimy o wykonanie przelewu w ciągu 60 minut, aby utrzymać rezerwację asortymentu:</p>
                  <div className="bg-white p-3 border border-[#DFBEB8] font-mono text-xs space-y-1 text-[#241D1B] rounded-xs">
                    <p>Odbiorca: <strong>AURA Boutique K.B.</strong></p>
                    <p>Nr konta: <strong>[DO UZUPEŁNIENIA W PANELU: 00 0000 0000 0000 0000 0000 0000]</strong></p>
                    <p>Kwota: <strong>{order.totalAmount.toFixed(2)} PLN</strong></p>
                    <p>Tytuł przelewu: <strong>Zamówienie {order.orderNumber}</strong></p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-[#4A3F3B] font-light">
                  <p>
                    Wybrano płatność: <strong>{paymentLabels[order.paymentMethod]}</strong>.
                  </p>
                  <p className="text-[11px] text-[#857670]">
                    Bezpieczeństwo: Zgodnie z zasadami butiku, nie pokazujemy fikcyjnego potwierdzenia opłacenia zamówienia przed faktycznym zasileniem konta przez operatora. Właścicielka butiku zweryfikuje wpływ i zmieni status na &quot;Opłacone&quot; w panelu administracyjnym.
                  </p>
                </div>
              )}
            </div>

            {/* Dane dostawy */}
            <div className="space-y-3 text-xs">
              <h3 className="font-serif text-sm uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
                Szczegóły Doręczenia
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[#4A3F3B]">
                <div>
                  <p className="text-[#857670] text-[11px]">Dane Odbiorcy:</p>
                  <p className="font-semibold text-[#241D1B]">
                    {order.customerFirstName} {order.customerLastName}
                  </p>
                  <p>{order.customerEmail}</p>
                  <p>{order.customerPhone}</p>
                </div>
                <div>
                  <p className="text-[#857670] text-[11px]">Sposób Doręczenia:</p>
                  <p className="font-semibold text-[#241D1B]">
                    {shippingLabels[order.shippingMethod]}
                  </p>
                  {order.customerNotes && (
                    <p className="mt-2 text-[#857670] italic">
                      Uwagi: &quot;{order.customerNotes}&quot;
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Pozycje zamówienia z zapamiętanymi snapshotami cen */}
            <div className="space-y-3 text-xs">
              <h3 className="font-serif text-sm uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
                Zamówione Produkty
              </h3>
              <div className="divide-y divide-[#EADFD5]">
                {order.items.map((item) => (
                  <div key={item.id} className="py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {item.productImageUrl && (
                        <div className="relative w-12 h-16 bg-[#FAF6F1] shrink-0 border border-[#EADFD5] rounded-xs overflow-hidden">
                          <Image src={item.productImageUrl} alt={item.productNameSnapshot} fill className="object-cover" sizes="48px" />
                        </div>
                      )}
                      <div>
                        <p className="font-serif text-xs font-semibold text-[#241D1B]">
                          {item.productNameSnapshot}
                        </p>
                        <p className="text-[11px] text-[#857670]">
                          {item.variantSnapshot}
                        </p>
                        <p className="text-[11px] text-[#857670]">
                          {item.quantity} x {item.unitPriceSnapshot.toFixed(2)} PLN
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-[#241D1B]">
                      {item.totalSnapshot.toFixed(2)} PLN
                    </span>
                  </div>
                ))}
              </div>

              {/* Podsumowanie finansowe */}
              <div className="pt-3 border-t border-[#EADFD5] space-y-1.5 text-[#857670]">
                <div className="flex justify-between">
                  <span>Wartość produktów:</span>
                  <span className="font-medium text-[#241D1B]">{order.subtotalAmount.toFixed(2)} PLN</span>
                </div>
                <div className="flex justify-between">
                  <span>Koszt dostawy:</span>
                  <span className="font-medium text-[#241D1B]">{order.shippingCost.toFixed(2)} PLN</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#EADFD5] text-sm text-[#241D1B] font-semibold">
                  <span>Łączna kwota zamówienia:</span>
                  <span className="text-base">{order.totalAmount.toFixed(2)} PLN</span>
                </div>
              </div>
            </div>

            {/* Przyciski powrotu */}
            <div className="pt-4 border-t border-[#EADFD5] flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                href="/katalog"
                className="w-full sm:w-auto px-6 py-3 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-widest text-center rounded-xs shadow-xs transition-colors"
              >
                Wróć do sklepu
              </Link>
              <Link
                href="/kontakt"
                className="text-xs text-[#857670] hover:text-[#C5A069] underline text-center"
              >
                Masz pytania do zamówienia? Skontaktuj się z butikiem
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
