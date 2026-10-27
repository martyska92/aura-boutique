"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  Edit,
  Trash2,
  Sparkles,
  Archive,
  Eye,
  EyeOff,
  Search,
  Filter,
  Check,
  Tag,
} from "lucide-react";
import { Product, Category } from "@/lib/types";

interface ProductListClientProps {
  initialProducts: Product[];
  categories: Category[];
}

export function ProductListClient({
  initialProducts,
  categories,
}: ProductListClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [promotedFilter, setPromotedFilter] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Szybkie przełączanie flagi (np. isNew, isBestseller, isPromoted, isPublished)
  const toggleFlag = async (id: string, field: "isNew" | "isBestseller" | "isPromoted" | "isPublished") => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const newValue = !product[field];
    setUpdatingId(id);

    try {
      const res = await fetch("/api/admin/products/toggle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, field, value: newValue }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, [field]: newValue } : p))
        );
      } else {
        alert("Błąd podczas zmiany statusu.");
      }
    } catch (e: any) {
      alert("Błąd połączenia: " + e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Czy na pewno chcesz bezpowrotnie usunąć produkt "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("Nie udało się usunąć produktu.");
      }
    } catch (e: any) {
      alert("Błąd połączenia: " + e.message);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (categoryFilter !== "all" && p.categoryId !== categoryFilter) {
      return false;
    }
    if (promotedFilter && !p.isPromoted) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Pasek akcji i wyszukiwania */}
      <div className="bg-white p-4 sm:p-6 border border-[#EADFD5] rounded shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Szukajka */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#6E6259] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtruj produkty po nazwie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAF6F1] border border-[#EADFD5] pl-9 pr-3 py-2 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
            />
          </div>

          {/* Kategoria */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#FAF6F1] border border-[#EADFD5] px-3 py-2 text-xs text-[#241D1B] focus:outline-none"
          >
            <option value="all">Wszystkie kategorie</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Przycisk tylko promocje */}
          <button
            onClick={() => setPromotedFilter(!promotedFilter)}
            className={`px-3 py-2 text-xs uppercase tracking-wider border rounded flex items-center gap-1.5 transition-colors ${
              promotedFilter
                ? "bg-[#A84B4B] text-white border-[#A84B4B]"
                : "bg-[#FAF6F1] text-[#6E6259] border-[#EADFD5] hover:border-[#C5A069]"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Tylko w promocji</span>
          </button>
        </div>

        <Link
          href="/admin/produkty/nowy"
          className="px-5 py-2.5 bg-[#C5A069] text-white text-xs uppercase tracking-wider font-semibold rounded hover:bg-[#AF884F] transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          <span>Dodaj Ubranie</span>
        </Link>
      </div>

      {/* Tabela produktów */}
      <div className="bg-white border border-[#EADFD5] rounded shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#EADFD5] flex justify-between items-center text-xs text-[#6E6259]">
          <span>
            Wyświetlono: <strong>{filteredProducts.length}</strong> z {products.length} ubrań
          </span>
          <span className="text-[11px] text-[#C5A069] font-medium">
            Kliknij na przełączniki poniżej, aby szybko zmienić status na żywo
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#6E6259]">
            Nie znaleziono ubrań spełniających podane kryteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-[#EADFD5]">
              <thead className="bg-[#FAF6F1] text-[#6E6259] uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Produkt</th>
                  <th className="py-3 px-4">Kategoria</th>
                  <th className="py-3 px-4">Cena (PLN)</th>
                  <th className="py-3 px-4 text-center">Magazyn</th>
                  <th className="py-3 px-4 text-center">Promocja (Wybrane)</th>
                  <th className="py-3 px-4 text-center">Nowość</th>
                  <th className="py-3 px-4 text-center">Bestseller</th>
                  <th className="py-3 px-4 text-center">Widoczny</th>
                  <th className="py-3 px-4 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADFD5]">
                {filteredProducts.map((p) => {
                  const totalStock = p.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
                  const categoryName = categories.find((c) => c.id === p.categoryId)?.name || "—";
                  const primaryImg = p.images[0]?.url || "/images/products/sukienka-satynowa-ivory.jpg";

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF6F1]/80 transition-colors">
                      {/* Nazwa i miniatura */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-14 bg-[#FAF6F1] border border-[#EADFD5] overflow-hidden shrink-0 rounded-xs">
                            <Image src={primaryImg} alt={p.name} fill className="object-cover" sizes="40px" />
                          </div>
                          <div>
                            <Link
                              href={`/admin/produkty/${p.id}`}
                              className="font-serif font-medium text-sm text-[#241D1B] hover:text-[#C5A069] block line-clamp-1"
                            >
                              {p.name}
                            </Link>
                            <p className="text-[11px] text-[#6E6259] font-mono">
                              {p.variants.length} wariantów ({p.variants.map((v) => v.size).join(", ")})
                            </p>
                            {p.isDemo && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[9px] uppercase bg-amber-100 text-amber-900 rounded font-bold">
                                Demo
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Kategoria */}
                      <td className="py-3 px-4 text-[#6E6259]">
                        {categoryName}
                      </td>

                      {/* Cena */}
                      <td className="py-3 px-4">
                        {p.isPromoted && p.promotionalPrice ? (
                          <div>
                            <span className="font-semibold text-rose-700">
                              {p.promotionalPrice.toFixed(2)} zł
                            </span>
                            <span className="block text-[10px] text-[#6E6259] line-through">
                              {p.basePrice.toFixed(2)} zł
                            </span>
                          </div>
                        ) : (
                          <span className="font-medium text-[#241D1B]">
                            {p.basePrice.toFixed(2)} zł
                          </span>
                        )}
                      </td>

                      {/* Magazyn */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-semibold px-2 py-0.5 rounded text-[11px] ${
                            totalStock === 0
                              ? "bg-red-100 text-red-800"
                              : totalStock <= 3
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {totalStock} szt.
                        </span>
                      </td>

                      {/* RUBRYKA: PROMOCJA */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleFlag(p.id, "isPromoted")}
                          disabled={updatingId === p.id}
                          className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold rounded border transition-colors ${
                            p.isPromoted
                              ? "bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200"
                              : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                          }`}
                          title="Kliknij, aby włączyć lub wyłączyć z promocji"
                        >
                          {p.isPromoted ? "W Promocji ✓" : "Nie"}
                        </button>
                      </td>

                      {/* Nowość */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleFlag(p.id, "isNew")}
                          disabled={updatingId === p.id}
                          className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold transition-colors ${
                            p.isNew
                              ? "bg-[#ECCDC7] text-[#542823] border border-[#DEBEB7]"
                              : "bg-gray-200 text-gray-400 hover:bg-gray-300"
                          }`}
                          title="Nowość w sklepie"
                        >
                          {p.isNew ? "✓" : "–"}
                        </button>
                      </td>

                      {/* Bestseller */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleFlag(p.id, "isBestseller")}
                          disabled={updatingId === p.id}
                          className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold transition-colors ${
                            p.isBestseller
                              ? "bg-[#C5A069] text-white"
                              : "bg-gray-200 text-gray-400 hover:bg-gray-300"
                          }`}
                          title="Oznacz jako bestseller"
                        >
                          {p.isBestseller ? "★" : "–"}
                        </button>
                      </td>

                      {/* Publikacja */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleFlag(p.id, "isPublished")}
                          disabled={updatingId === p.id}
                          className={`p-1.5 rounded transition-colors ${
                            p.isPublished
                              ? "text-emerald-700 hover:bg-emerald-50"
                              : "text-gray-400 hover:bg-gray-100"
                          }`}
                          title={p.isPublished ? "Widoczny w sklepie" : "Ukryty"}
                        >
                          {p.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Akcje */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/produkty/${p.id}`}
                            className="p-1.5 bg-[#FAF6F1] border border-[#EADFD5] text-[#241D1B] hover:border-[#C5A069] rounded"
                            title="Edytuj produkt i warianty"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded"
                            title="Usuń produkt"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
