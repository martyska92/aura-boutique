import React from "react";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getOrderById, getStoreSettings, getProducts } from "@/lib/store-data";
import { CustomerOrderClient } from "@/components/order/CustomerOrderClient";

interface ConfirmationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderConfirmationPage({ params }: ConfirmationPageProps) {
  const { id } = await params;
  const order = await getOrderById(id);
  const settings = await getStoreSettings();
  const availableProducts = await getProducts();

  if (!order) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#FAF8F5] py-10 sm:py-16">
        <CustomerOrderClient
          initialOrder={order}
          settings={settings}
          availableProducts={availableProducts}
        />
      </main>
      <Footer />
    </>
  );
}
