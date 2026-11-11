"use client";

import React, { useState, useEffect } from "react";
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
  CheckSquare,
  Square,
  Loader2,
  CheckCircle2,
  RefreshCw,
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

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    handleRefresh();
  }, []);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      const data = await res.json();
      if (data.products && Array.isArray(data.products)) {
        let serverProducts: Product[] = data.products;

        // Sprawdzamy czy w localStorage są zapisane produkty butiku
        try {
          const raw = localStorage.getItem("aura_custom_products");
          if (raw) {
            const customList: Product[] = JSON.parse(raw);
            const serverIds = new Set(serverProducts.map((p) => p.id));
            const missing = customList.filter((p) => !serverIds.has(p.id));

            if (missing.length > 0) {
              for (const m of missing) {
                fetch("/api/admin/products", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(m),
                }).catch(() => {});
              }
              serverProducts = [...missing, ...serverProducts];
            }
          }
        } catch (_) {}

        setProducts(serverProducts);
      }
    } catch (e) {
      console.error("Błąd odświeżania:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Masowe zaznaczanie i operacje
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

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
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        try {
          const raw = localStorage.getItem("aura_custom_products");
          if (raw) {
            const list: Product[] = JSON.parse(raw);
            localStorage.setItem("aura_custom_products", JSON.stringify(list.filter((x) => x.id !== id)));
          }
        } catch (_) {}
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

  // Obsługa zaznaczania
  const isAllSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedIds.includes(p.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Obsługa masowej akcji
  const handleBulkAction = async (action: string, updates?: Partial<Product>) => {
    if (selectedIds.length === 0) return;

    if (action === "delete") {
      if (!confirm(`Czy na pewno chcesz bezpowrotnie usunąć ${selectedIds.length} zaznaczonych ubrań?`)) {
        return;
      }
    }

    setIsBulkLoading(true);
    setBulkFeedback(null);

    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          action,
          updates,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Błąd podczas operacji masowej.");
      }

      if (action === "delete") {
        setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
        setBulkFeedback(`Pomyślnie usunięto ${selectedIds.length} ubrań.`);
        setSelectedIds([]);
      } else {
        let finalUpdates: Partial<Product> = updates || {};
        if (action === "setPromoted") finalUpdates = { isPromoted: true };
        else if (action === "unsetPromoted") finalUpdates = { isPromoted: false };
        else if (action === "setNew") finalUpdates = { isNew: true };
        else if (action === "unsetNew") finalUpdates = { isNew: false };
        else if (action === "setBestseller") finalUpdates = { isBestseller: true };
        else if (action === "unsetBestseller") finalUpdates = { isBestseller: false };
        else if (action === "publish") finalUpdates = { isPublished: true };
        else if (action === "unpublish") finalUpdates = { isPublished: false };

        setProducts((prev) =>
          prev.map((p) => (selectedIds.includes(p.id) ? { ...p, ...finalUpdates } : p))
        );
        setBulkFeedback(`Zaktualizowano ${selectedIds.length} ubrań!`);
        setTimeout(() => setBulkFeedback(null), 4000);
      }
    } catch (err: any) {
      alert("Błąd: " + err.message);
    } finally {
      setIsBulkLoading(false);
    }
  };

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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2.5 bg-[#FAF6F1] border border-[#EADFD5] text-[#241D1B] text-xs uppercase tracking-wider font-semibold rounded hover:border-[#C5A069] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            title="Odśwież listę ubrań"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C5A069] ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isRefreshing ? "Odświeżanie..." : "Odśwież"}</span>
          </button>

          <Link
            href="/admin/produkty/nowy"
            className="px-5 py-2.5 bg-[#C5A069] text-white text-xs uppercase tracking-wider font-semibold rounded hover:bg-[#AF884F] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>Dodaj Ubranie</span>
          </Link>
        </div>
      </div>

      {/* Pasek akcji masowych, gdy wybrano min. 1 produkt */}
      {selectedIds.length > 0 && (
        <div className="bg-[#FAF6F1] border-2 border-[#C5A069] rounded-lg p-3 sm:p-4 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[#C5A069] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {selectedIds.length}
            </span>
            <div>
              <span className="text-xs font-serif font-bold text-[#241D1B] tracking-wider uppercase block sm:inline">
                Zaznaczono {selectedIds.length} z {filteredProducts.length} ubrań
              </span>
              {bulkFeedback && (
                <span className="ml-2 text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  {bulkFeedback}
                </span>
              )}
            </div>
          </div>

          {/* Przyciski masowej zmiany statusu */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Promocja */}
            <div className="inline-flex rounded border border-[#EADFD5] overflow-hidden text-[11px] bg-white shadow-2xs">
              <button
                type="button"
                disabled={isBulkLoading}
                onClick={() => handleBulkAction("setPromoted")}
                className="px-2.5 py-1.5 hover:bg-rose-50 text-rose-800 font-semibold border-r border-[#EADFD5] transition-colors disabled:opacity-50"
                title="Włącz sekcję Promocja dla zaznaczonych"
              >
                + Promocja
              </button>
              <button
                type="button"
                disabled={isBulkLoading}
                onClick={() => handleBulkAction("unsetPromoted")}
                className="px-2 py-1.5 hover:bg-gray-100 text-[#6E6259] transition-colors disabled:opacity-50"
                title="Usuń z Promocji"
              >
                - Brak
              </button>
            </div>

            {/* Nowość */}
            <div className="inline-flex rounded border border-[#EADFD5] overflow-hidden text-[11px] bg-white shadow-2xs">
              <button
                type="button"
                disabled={isBulkLoading}
                onClick={() => handleBulkAction("setNew")}
                className="px-2.5 py-1.5 hover:bg-[#F2DCD7] text-[#542823] font-semibold border-r border-[#EADFD5] transition-colors disabled:opacity-50"
                title="Oznacz zaznaczone jako Nowość"
              >
                + Nowość
              </button>
              <button
                type="button"
                disabled={isBulkLoading}
                onClick={() => handleBulkAction("unsetNew")}
                className="px-2 py-1.5 hover:bg-gray-100 text-[#6E6259] transition-colors disabled:opacity-50"
                title="Usuń oznaczenie Nowość"
              >
                - Brak
              </button>
            </div>

            {/* Bestseller */}
            <div className="inline-flex rounded border border-[#EADFD5] overflow-hidden text-[11px] bg-white shadow-2xs">
              <button
                type="button"
                disabled={isBulkLoading}
                onClick={() => handleBulkAction("setBestseller")}
                className="px-2.5 py-1.5 hover:bg-amber-50 text-[#9E743A] font-semibold border-r border-[#EADFD5] transition-colors disabled:opacity-50"
                title="Oznacz zaznaczone jako Bestseller"
              >
                ★ Bestseller
              </button>
              <button
                type="button"
                disabled={isBulkLoading}
                onClick={() => handleBulkAction("unsetBestseller")}
                className="px-2 py-1.5 hover:bg-gray-100 text-[#6E6259] transition-colors disabled:opacity-50"
                title="Usuń z Bestsellerów"
              >
                - Brak
              </button>
            </div>

            {/* Publikacja / Ukrycie */}
            <div className="inline-flex rounded border border-[#EADFD5] overflow-hidden text-[11px] bg-white shadow-2xs">
              <button
                type="button"
                disabled={isBulkLoading}
                onClick={() => handleBulkAction("publish")}
                className="px-2.5 py-1.5 hover:bg-emerald-50 text-emerald-800 font-semibold border-r border-[#EADFD5] transition-colors flex items-center gap-1 disabled:opacity-50"
                title="Opublikuj zaznaczone w sklepie dla klientek"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Publikuj</span>
              </button>
              <button
                type="button"
                disabled={isBulkLoading}
                onClick={() => handleBulkAction("unpublish")}
                className="px-2.5 py-1.5 hover:bg-gray-100 text-gray-600 transition-colors flex items-center gap-1 disabled:opacity-50"
                title="Ukryj zaznaczone ze sprzedaży"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Ukryj</span>
              </button>
            </div>

            {/* Usuń zaznaczone */}
            <button
              type="button"
              disabled={isBulkLoading}
              onClick={() => handleBulkAction("delete")}
              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
              title="Usuń zaznaczone ubrania"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Usuń</span>
            </button>

            {/* Odznacz */}
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-white border border-[#EADFD5] text-[#6E6259] hover:text-[#241D1B] rounded text-[11px] font-medium transition-colors ml-auto md:ml-0"
            >
              Odznacz ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Tabela produktów */}
      <div className="bg-white border border-[#EADFD5] rounded shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#EADFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#6E6259]">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-[#241D1B]">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-[#C5A069] rounded cursor-pointer"
              />
              <span>Zaznacz wszystkie ({filteredProducts.length})</span>
            </label>
            <span className="text-[#EADFD5]">|</span>
            <span>
              Wyświetlono: <strong>{filteredProducts.length}</strong> z {products.length} ubrań
            </span>
          </div>
          <span className="text-[11px] text-[#C5A069] font-medium">
            Kliknij na przełączniki poniżej lub zaznacz polem wyboru, aby zmienić status zbiorczo
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
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-[#C5A069] rounded cursor-pointer"
                      title="Zaznacz / odznacz wszystkie"
                    />
                  </th>
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
                  const isSelected = selectedIds.includes(p.id);
                  const totalStock = p.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
                  const categoryName = categories.find((c) => c.id === p.categoryId)?.name || "—";
                  const primaryImg = p.images[0]?.url || "/images/products/neutral-placeholder.svg";

                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-[#FAF2EB] border-l-4 border-l-[#C5A069]"
                          : "hover:bg-[#FAF6F1]/80"
                      }`}
                    >
                      {/* Checkbox zaznaczenia */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(p.id)}
                          className="w-4 h-4 accent-[#C5A069] rounded cursor-pointer"
                        />
                      </td>

                      {/* Nazwa i miniatura */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-14 bg-[#FAF6F1] border border-[#EADFD5] overflow-hidden shrink-0 rounded-xs">
                            <Image
                              src={primaryImg}
                              alt={p.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                              unoptimized={primaryImg.startsWith("data:")}
                            />
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
