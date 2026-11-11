import React from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, PlusCircle } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { getProductById, getProductBySlug, getCategories } from "@/lib/store-data";
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
  let product = await getProductById(id);
  if (!product) {
    product = await getProductBySlug(id);
  }
  const categories = await getCategories();

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white border border-[#EADFD5] rounded-xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-[#C5A069]" />
          </div>
          <h1 className="font-serif text-2xl text-[#241D1B]">Produkt nie został odnaleziony</h1>
          <p className="text-xs text-[#6E6259] max-w-md mx-auto">
            Produkt o identyfikatorze <code className="font-mono bg-[#FAF6F1] px-2 py-0.5 rounded border border-[#EADFD5] text-[#241D1B]">{id}</code> nie istnieje w bazie danych lub został usunięty.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/admin/produkty"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FAF6F1] border border-[#EADFD5] text-[#241D1B] text-xs uppercase tracking-wider font-semibold rounded hover:border-[#C5A069]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Wróć do listy ubrań</span>
            </Link>
            <Link
              href="/admin/produkty/nowy"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C5A069] text-white text-xs uppercase tracking-wider font-semibold rounded hover:bg-[#AF884F]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Dodaj nowe ubranie</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProductEditor initialProduct={product} categories={categories} />
    </div>
  );
}
