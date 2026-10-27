import React from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { getCategories } from "@/lib/store-data";
import { ProductEditor } from "@/components/admin/ProductEditor";

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await getCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProductEditor categories={categories} />
    </div>
  );
}
