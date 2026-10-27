import React from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { getProducts, getCategories } from "@/lib/store-data";
import { ProductListClient } from "@/components/admin/ProductListClient";

export default async function AdminProductsPage() {
  await requireAdmin();

  const products = await getProducts({ includeArchived: true });
  const categories = await getCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-[#141414]">
          Zarządzanie Produktami
        </h1>
        <p className="text-xs text-[#7E7771] mt-1">
          Dodawaj, edytuj warianty rozmiarów i kolorów, stany magazynowe oraz ceny promocyjne ubrań.
        </p>
      </div>

      <ProductListClient
        initialProducts={products}
        categories={categories}
      />
    </div>
  );
}
