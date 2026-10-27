import React from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllOrders } from "@/lib/store-data";
import { OrderListClient } from "@/components/admin/OrderListClient";

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await getAllOrders();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-[#141414]">
          Zarządzanie Zamówieniami
        </h1>
        <p className="text-xs text-[#7E7771] mt-1">
          Przeglądaj zamówienia klientek, zmieniaj status realizacji, wprowadzaj numery przesyłek i zarządzaj płatnościami.
        </p>
      </div>

      <OrderListClient initialOrders={orders} />
    </div>
  );
}
