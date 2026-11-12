"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, PlusCircle, Loader2, RotateCcw } from "lucide-react";
import { Product, Category } from "@/lib/types";
import { ProductEditor } from "./ProductEditor";

interface EditProductFallbackProps {
  id: string;
  categories: Category[];
  initialError?: string | null;
}

export function EditProductFallback({
  id,
  categories,
  initialError,
}: EditProductFallbackProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(initialError || null);

  useEffect(() => {
    let isMounted = true;

    async function fetchProduct() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
          cache: "no-store",
        });

        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }

        const data = await res.json();

        if (res.ok && data.product) {
          if (isMounted) {
            setProduct(data.product);
            setLoading(false);
          }
          return;
        }

        // Sprawdź czy produkt jest w lokalnej pamięci podręcznej przeglądarki
        try {
          const raw = localStorage.getItem("aura_custom_products");
          if (raw) {
            const list: Product[] = JSON.parse(raw);
            const found = list.find((p) => p.id === id || p.slug === id);
            if (found && isMounted) {
              setProduct(found);
              setLoading(false);
              return;
            }
          }
        } catch (_) {}

        if (isMounted) {
          if (res.status === 404) {
            setError(`Produkt o identyfikatorze "${id}" nie istnieje w bazie danych.`);
          } else {
            setError(data.error || "Nie udało się pobrać danych produktu z serwera.");
          }
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Błąd sieci podczas pobierania produktu.");
          setLoading(false);
        }
      }
    }

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-[#FAF6F1] border border-[#EADFD5] flex items-center justify-center mx-auto text-[#C5A069]">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
        <h2 className="font-serif text-xl text-[#241D1B]">Weryfikacja danych w bazie...</h2>
        <p className="text-xs text-[#857670]">
          Trwa pobieranie aktualnych danych produktu <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#EADFD5] text-[#241D1B]">{id}</code>.
        </p>
      </div>
    );
  }

  if (product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductEditor initialProduct={product} categories={categories} />
      </div>
    );
  }

  const isNotFound = error?.includes("nie istnieje");

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white border border-[#EADFD5] rounded-xl p-8 text-center space-y-4 shadow-sm">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
            isNotFound ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
          }`}
        >
          <AlertCircle className={`w-6 h-6 ${isNotFound ? "text-[#C5A069]" : "text-red-600"}`} />
        </div>

        <h1 className="font-serif text-2xl text-[#241D1B]">
          {isNotFound ? "Produkt nie został odnaleziony" : "Błąd pobierania produktu"}
        </h1>

        <p className="text-xs text-[#6E6259] max-w-md mx-auto">
          {error || `Produkt o identyfikatorze "${id}" nie istnieje w bazie danych lub został usunięty.`}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#FAF6F1] border border-[#EADFD5] text-[#241D1B] text-xs uppercase tracking-wider font-semibold rounded hover:border-[#C5A069] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Spróbuj ponownie</span>
          </button>

          <Link
            href="/admin/produkty"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#EADFD5] text-[#241D1B] text-xs uppercase tracking-wider font-semibold rounded hover:border-[#C5A069]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Wróć do listy ubrań</span>
          </Link>

          <Link
            href="/admin/produkty/nowy"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#C5A069] text-white text-xs uppercase tracking-wider font-semibold rounded hover:bg-[#AF884F]"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Dodaj nowe ubranie</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

