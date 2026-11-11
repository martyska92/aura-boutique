import React from "react";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getProductById, getCategories } from "@/lib/store-data";
import { ProductEditor } from "@/components/admin/ProductEditor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  await requireAdmin();
  const { id } = await params;
  const product = await getProductById(id);
  const categories = await getCategories();

  if (!product) {
    redirect("/admin/produkty");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProductEditor initialProduct={product} categories={categories} />
    </div>
  );
}
