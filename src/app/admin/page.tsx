import React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Package,
  TrendingUp,
  AlertCircle,
  PlusCircle,
  ExternalLink,
  Clock,
  Sparkles,
  Database,
  ArrowRight,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllOrders, getProducts, isNeonConfigured } from "@/lib/store-data";
import { ClearDemoButton } from "@/components/admin/ClearDemoButton";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const orders = await getAllOrders();
  const products = await getProducts({ includeArchived: true });
  const neonConnected = isNeonConfigured();

  // Statystyki (wyłącznie dla rzeczywistej sprzedaży — zamówienia testowe wykluczone)
  const productionOrders = orders.filter((o) => !o.isTest);
  const newOrders = productionOrders.filter((o) => o.fulfillmentStatus === "NEW");
  const totalRevenue = productionOrders
    .filter((o) => o.paymentStatus === "PAID")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const activeProducts = products.filter((p) => p.isPublished && !p.isArchived);
  const promotedProducts = products.filter((p) => p.isPromoted);
  const demoProducts = products.filter((p) => p.isDemo);

  // Warianty o niskim stanie magazynowym (< 3 sztuki)
  const lowStockItems: {
    productName: string;
    variantName: string;
    stock: number;
    productId: string;
  }[] = [];

  products.forEach((p) => {
    p.variants.forEach((v) => {
      const available = v.stockQuantity - v.reservedQuantity;
      if (available <= 2) {
        lowStockItems.push({
          productName: p.name,
          variantName: `${v.size} / ${v.color}`,
          stock: available,
          productId: p.id,
        });
      }
    });
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Baner informacyjny o danych demonstracyjnych */}
      {demoProducts.length > 0 && (
        <div className="p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-amber-900">
                W sklepie wczytane są dane demonstracyjne ({demoProducts.length} produktów wzorcowych)
              </h3>
              <p className="text-xs text-amber-800 font-light mt-0.5">
                Możesz przeglądać i edytować wzorcowe ubrania lub jednym kliknięciem wyczyścić asortyment przed rozpoczęciem oficjalnej sprzedaży.
              </p>
            </div>
          </div>
          <ClearDemoButton />
        </div>
      )}

      {/* Nagłówek pulpitu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EADFD5]">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#241D1B]">
            Pulpit Zarządzania Butikiem
          </h1>
          <p className="text-xs text-[#6E6259] mt-1">
            AURA Boutique K.B. • Żmigród, ul. Poprzeczna 3/1A
          </p>
        </div>

        <Link
          href="/admin/produkty/nowy"
          className="px-4 py-2.5 bg-[#C5A069] text-white text-xs uppercase tracking-wider font-semibold rounded hover:bg-[#AF884F] transition-all flex items-center gap-2 shadow-sm self-start sm:self-auto shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          <span>Dodaj Nowe Ubranie</span>
        </Link>
      </div>

      {/* 5 Klikalnych Kart KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Do Realizacji */}
        <Link
          href="/admin/zamowienia?status=do-realizacji"
          className="bg-white p-5 border border-[#EADFD5] rounded-xl shadow-xs hover:border-[#C5A069] hover:shadow-md transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-[#6E6259]">
            <span className="text-[11px] uppercase tracking-wider font-semibold group-hover:text-[#C5A069] transition-colors">
              Do Realizacji
            </span>
            <span className="p-2 bg-amber-50 text-amber-700 rounded-full group-hover:bg-[#FAF6F1] group-hover:text-[#C5A069] transition-colors">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-serif text-[#241D1B] font-semibold">
              {newOrders.length}
            </span>
            <p className="text-[11px] text-[#6E6259] mt-0.5">Nowe zamówienia klientek →</p>
          </div>
        </Link>

        {/* 2. Łączny Przychód */}
        <Link
          href="/admin/rozliczenia"
          className="bg-white p-5 border border-[#EADFD5] rounded-xl shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-[#6E6259]">
            <span className="text-[11px] uppercase tracking-wider font-semibold group-hover:text-emerald-700 transition-colors">
              Łączny Przychód
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-full group-hover:bg-emerald-100 transition-colors">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-serif text-[#241D1B] font-semibold">
              {totalRevenue.toFixed(2)} zł
            </span>
            <p className="text-[11px] text-[#6E6259] mt-0.5">Rozliczenia sprzedaży →</p>
          </div>
        </Link>

        {/* 3. Asortyment */}
        <Link
          href="/admin/produkty?filter=active"
          className="bg-white p-5 border border-[#EADFD5] rounded-xl shadow-xs hover:border-[#C5A069] hover:shadow-md transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-[#6E6259]">
            <span className="text-[11px] uppercase tracking-wider font-semibold group-hover:text-[#C5A069] transition-colors">
              Asortyment
            </span>
            <span className="p-2 bg-[#F2DCD7] text-[#916738] rounded-full group-hover:bg-[#FAF6F1] transition-colors">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-serif text-[#241D1B] font-semibold">
              {activeProducts.length}
            </span>
            <p className="text-[11px] text-[#6E6259] mt-0.5">Aktywnych w sklepie →</p>
          </div>
        </Link>

        {/* 4. W Promocji */}
        <Link
          href="/admin/produkty?filter=promoted"
          className="bg-white p-5 border border-[#EADFD5] rounded-xl shadow-xs hover:border-rose-400 hover:shadow-md transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-[#6E6259]">
            <span className="text-[11px] uppercase tracking-wider font-semibold group-hover:text-rose-700 transition-colors">
              W Promocji
            </span>
            <span className="p-2 bg-rose-50 text-rose-700 rounded-full group-hover:bg-rose-100 transition-colors">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-serif text-rose-700 font-semibold">
              {promotedProducts.length}
            </span>
            <p className="text-[11px] text-[#6E6259] mt-0.5">Wyprzedaże i rabaty →</p>
          </div>
        </Link>

        {/* 5. Notatki i Kalendarz */}
        <Link
          href="/admin/kalendarz"
          className="bg-white p-5 border border-[#EADFD5] rounded-xl shadow-xs hover:border-[#C5A069] hover:shadow-md transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-[#6E6259]">
            <span className="text-[11px] uppercase tracking-wider font-semibold group-hover:text-[#C5A069] transition-colors">
              Notatki & Kalendarz
            </span>
            <span className="p-2 bg-[#FAF6F1] text-[#7A5B20] rounded-full group-hover:bg-[#EADFD5] transition-colors">
              <Tag className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-serif text-[#241D1B] font-semibold">
              Zadania
            </span>
            <p className="text-[11px] text-[#6E6259] mt-0.5">Dostawy, notatki, plan →</p>
          </div>
        </Link>
      </div>

      {/* Skrót do Centrum Testowania Płatności (Sandbox) */}
      <div className="p-4 bg-gradient-to-r from-[#FAF6F1] to-white border border-[#EADFD5] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#C5A069]/15 flex items-center justify-center text-[#7A5B20] shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#C5A069]" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#241D1B]">
              Środowisko Testowe Płatności (PayU Sandbox)
            </h3>
            <p className="text-[11px] text-[#6E6259]">
              Wykonaj testy 8 kluczowych scenariuszy bez obciążeń finansowych: sukces, odmowa, ponowienie, webhook IPN i zwalnianie rezerwacji.
            </p>
          </div>
        </div>
        <Link
          href="/admin/platnosci-testowe"
          className="px-4 py-2 bg-white border border-[#C5A069] hover:bg-[#C5A069] text-[#7A5B20] hover:text-white rounded text-xs font-semibold transition-all inline-flex items-center justify-center gap-1.5 shadow-2xs shrink-0 self-start sm:self-auto"
        >
          <span>Centrum Sandbox (8 Testów)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Sekcja: Ostatnie Zamówienia & Alerty Magazynowe */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lewa: Najnowsze zamówienia */}
        <div className="lg:col-span-8 bg-white border border-[#EADFD5] rounded shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EADFD5]">
            <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B]">
              Najnowsze Zamówienia
            </h2>
            <Link
              href="/admin/zamowienia"
              className="text-xs text-[#C5A069] hover:underline flex items-center gap-1 font-medium"
            >
              <span>Zobacz wszystkie</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <p className="text-xs text-[#6E6259] py-8 text-center">Brak zamówień w sklepie.</p>
          ) : (
            <div className="divide-y divide-[#EADFD5] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[#6E6259] uppercase text-[10px] pb-2">
                    <th className="pb-2">Numer</th>
                    <th className="pb-2">Klientka</th>
                    <th className="pb-2">Dostawa</th>
                    <th className="pb-2">Kwota</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Akcja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EADFD5]">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-[#FAF6F1]">
                      <td className="py-3 font-mono font-medium text-[#241D1B]">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 text-[#3E3B38]">
                        {order.customerFirstName} {order.customerLastName}
                      </td>
                      <td className="py-3 text-[#6E6259]">
                        {order.shippingMethod === "INPOST_LOCKER" && "Paczkomat"}
                        {order.shippingMethod === "COURIER" && "Kurier"}
                        {order.shippingMethod === "LOCAL_PICKUP" && "Żmigród (Odbiór)"}
                      </td>
                      <td className="py-3 font-semibold text-[#241D1B]">
                        {order.totalAmount.toFixed(2)} zł
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] uppercase font-semibold rounded ${
                            order.fulfillmentStatus === "NEW"
                              ? "bg-amber-100 text-amber-800"
                              : order.fulfillmentStatus === "SHIPPED"
                              ? "bg-blue-100 text-blue-800"
                              : order.fulfillmentStatus === "DELIVERED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.fulfillmentStatus}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/admin/zamowienia/${order.id}`}
                          className="px-2.5 py-1 bg-[#C5A069] text-white text-[10px] uppercase rounded hover:bg-[#AF884F] transition-colors"
                        >
                          Szczegóły
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Prawa: Alerty magazynowe & Baza Neon */}
        <div className="lg:col-span-4 space-y-6">
          {/* Alerty magazynu */}
          <div className="bg-white border border-[#EADFD5] rounded shadow-sm p-6 space-y-4">
            <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B] flex items-center gap-2 pb-3 border-b border-[#EADFD5]">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Niski Stan Magazynu</span>
            </h2>

            {lowStockItems.length === 0 ? (
              <p className="text-xs text-emerald-800 py-2">
                ✓ Wszystkie warianty ubrań posiadają wystarczający zapas magazynowy.
              </p>
            ) : (
              <div className="divide-y divide-[#EADFD5] max-h-60 overflow-y-auto text-xs space-y-2">
                {lowStockItems.slice(0, 6).map((item, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-[#241D1B]">{item.productName}</p>
                      <p className="text-[11px] text-[#6E6259]">{item.variantName}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        item.stock === 0
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.stock === 0 ? "Brak!" : `Tylko ${item.stock} szt.`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Karta statusu Neon PostgreSQL */}
          <div className="bg-white border border-[#EADFD5] rounded shadow-sm p-6 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#EADFD5]">
              <span className="font-serif text-sm uppercase tracking-wider text-[#241D1B] flex items-center gap-2">
                <Database className="w-4 h-4 text-[#C5A069]" />
                <span>Baza Danych Neon</span>
              </span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  neonConnected ? "bg-emerald-500 animate-pulse" : "bg-blue-400"
                }`}
                title={neonConnected ? "Połączono z Neon" : "Tryb lokalny z zapisem"}
              />
            </div>
            <p className="text-[#6E6259] leading-relaxed">
              {neonConnected ? (
                <span className="text-emerald-800 font-medium">
                  ✓ Aktywne trwałe połączenie z bazą Neon PostgreSQL.
                </span>
              ) : (
                <span>
                  Sklep działa w bezpiecznym trybie pamięci/dysku. Aby podłączyć docelową bazę Neon, wklej <code>DATABASE_URL</code> do pliku <code>.env</code>.
                </span>
              )}
            </p>
            <Link
              href="/admin/ustawienia"
              className="block text-[11px] text-[#C5A069] hover:underline pt-1 font-medium"
            >
              Instrukcja konfiguracji Neon →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
