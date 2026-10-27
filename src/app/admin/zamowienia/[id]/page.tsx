import React from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getOrderById } from "@/lib/store-data";
import { OrderDetailClient } from "@/components/admin/OrderDetailClient";

interface AdminOrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  await requireAdmin();
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <OrderDetailClient order={order} />
    </div>
  );
}
