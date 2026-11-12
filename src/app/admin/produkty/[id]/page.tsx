import React from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { getProductById, getProductBySlug, getCategories } from "@/lib/store-data";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { EditProductFallback } from "@/components/admin/EditProductFallback";

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
  let product = null;
  let fetchError = null;

  try {
    product = await getProductById(id);
    if (!product) {
      product = await getProductBySlug(id);
    }
  } catch (err: any) {
    console.error("Błąd podczas pobierania produktu w EditProductPage:", err);
    fetchError = err.message || "Błąd pobierania danych z bazy serwera.";
  }

  const categories = await getCategories();

  if (!product) {
    return (
      <EditProductFallback
        id={id}
        categories={categories}
        initialError={fetchError}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProductEditor initialProduct={product} categories={categories} />
    </div>
  );
}
