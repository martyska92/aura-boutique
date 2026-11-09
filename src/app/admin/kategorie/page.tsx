import React from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { getCategories } from "@/lib/store-data";
import { CategoryManagerClient } from "@/components/admin/CategoryManagerClient";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await getCategories();

  return <CategoryManagerClient initialCategories={categories} />;
}
