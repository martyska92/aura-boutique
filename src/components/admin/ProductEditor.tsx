"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Star,
  Image as ImageIcon,
  Check,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Product, Category, ProductVariant, ProductImage } from "@/lib/types";

interface ProductEditorProps {
  initialProduct?: Product;
  categories: Category[];
}

export function ProductEditor({ initialProduct, categories }: ProductEditorProps) {
  const router = useRouter();
  const isEditing = Boolean(initialProduct);

  const [name, setName] = useState(initialProduct?.name || "");
  const [slug, setSlug] = useState(initialProduct?.slug || "");
  const [categoryId, setCategoryId] = useState(
    initialProduct?.categoryId || categories[0]?.id || "cat-sukienki"
  );
  const [description, setDescription] = useState(initialProduct?.description || "");
  const [composition, setComposition] = useState(initialProduct?.composition || "");
  const [careGuide, setCareGuide] = useState(initialProduct?.careGuide || "");
  const [sizeGuide, setSizeGuide] = useState(initialProduct?.sizeGuide || "");

  // Ceny i Promocje
  const [basePrice, setBasePrice] = useState(initialProduct?.basePrice?.toString() || "");
  const [promotionalPrice, setPromotionalPrice] = useState(
    initialProduct?.promotionalPrice?.toString() || ""
  );
  const [isPromoted, setIsPromoted] = useState(initialProduct?.isPromoted || false);

  // Wyróżnienia
  const [isNew, setIsNew] = useState(initialProduct?.isNew || false);
  const [isBestseller, setIsBestseller] = useState(initialProduct?.isBestseller || false);
  const [isPublished, setIsPublished] = useState(
    initialProduct?.isPublished !== undefined ? initialProduct.isPublished : true
  );
  const [isArchived, setIsArchived] = useState(initialProduct?.isArchived || false);

  // Zdjęcia
  const [images, setImages] = useState<ProductImage[]>(
    initialProduct?.images || [
      {
        id: `img-${Date.now()}`,
        productId: initialProduct?.id || "",
        url: "/images/products/sukienka-satynowa-ivory.jpg",
        altText: "",
        orderIndex: 0,
        isPrimary: true,
      },
    ]
  );
  const [newImageUrl, setNewImageUrl] = useState("");

  // Warianty (Rozmiar + Kolor + SKU + Stan magazynowy)
  const [variants, setVariants] = useState<ProductVariant[]>(
    initialProduct?.variants || [
      {
        id: `var-${Date.now()}-1`,
        productId: initialProduct?.id || "",
        size: "S",
        color: "Piaskowy Beż",
        colorHex: "#D8C7B5",
        sku: "AURA-PROD-S-BEG",
        stockQuantity: 5,
        reservedQuantity: 0,
      },
      {
        id: `var-${Date.now()}-2`,
        productId: initialProduct?.id || "",
        size: "M",
        color: "Piaskowy Beż",
        colorHex: "#D8C7B5",
        sku: "AURA-PROD-M-BEG",
        stockQuantity: 5,
        reservedQuantity: 0,
      },
    ]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Automatyczny slug przy wpisywaniu nazwy
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isEditing || !slug) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[ąćęłńóśźż]/g, (match) => {
            const map: Record<string, string> = {
              ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
            };
            return map[match] || match;
          })
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
      );
    }
  };

  // Obsługa zdjęć
  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;

    const newImg: ProductImage = {
      id: `img-${Date.now()}`,
      productId: initialProduct?.id || "",
      url: newImageUrl.trim(),
      altText: name,
      orderIndex: images.length,
      isPrimary: images.length === 0,
    };

    setImages([...images, newImg]);
    setNewImageUrl("");
  };

  const handleSetPrimaryImage = (id: string) => {
    setImages(
      images.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      }))
    );
  };

  const handleRemoveImage = (id: string) => {
    const remaining = images.filter((img) => img.id !== id);
    if (remaining.length > 0 && !remaining.some((i) => i.isPrimary)) {
      remaining[0].isPrimary = true;
    }
    setImages(remaining);
  };

  // Obsługa wariantów
  const handleAddVariant = () => {
    const newVar: ProductVariant = {
      id: `var-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      productId: initialProduct?.id || "",
      size: "S",
      color: "Nowy Kolor",
      colorHex: "#FAF4EC",
      sku: `AURA-${Date.now().toString().slice(-4)}`,
      stockQuantity: 1,
      reservedQuantity: 0,
    };
    setVariants([...variants, newVar]);
  };

  const handleUpdateVariant = (
    id: string,
    field: keyof ProductVariant,
    value: any
  ) => {
    setVariants(
      variants.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const handleRemoveVariant = (id: string) => {
    if (variants.length <= 1) {
      alert("Produkt musi posiadać przynajmniej jeden wariant rozmiaru i koloru.");
      return;
    }
    setVariants(variants.filter((v) => v.id !== id));
  };

  // Zapis produktu
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!name.trim()) {
      setFeedback({ type: "error", text: "Podaj nazwę ubrania." });
      return;
    }

    if (!basePrice || isNaN(Number(basePrice)) || Number(basePrice) <= 0) {
      setFeedback({ type: "error", text: "Podaj prawidłową cenę bazową w PLN." });
      return;
    }

    if (variants.length === 0) {
      setFeedback({ type: "error", text: "Dodaj przynajmniej jeden wariant (rozmiar i kolor)." });
      return;
    }

    setIsSaving(true);

    try {
      const payload: Partial<Product> = {
        id: initialProduct?.id,
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        composition: composition.trim(),
        careGuide: careGuide.trim(),
        sizeGuide: sizeGuide.trim(),
        basePrice: Number(basePrice),
        promotionalPrice:
          promotionalPrice && !isNaN(Number(promotionalPrice))
            ? Number(promotionalPrice)
            : undefined,
        isPromoted,
        isNew,
        isBestseller,
        isPublished,
        isArchived,
        categoryId,
        images,
        variants,
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas zapisywania produktu.");
      }

      setFeedback({
        type: "success",
        text: isEditing
          ? "Zmiany w produkcie zostały pomyślnie zapisane!"
          : "Nowy produkt został dodany do oferty butiku!",
      });

      if (!isEditing && data.product?.id) {
        router.push(`/admin/produkty/${data.product.id}`);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Błąd zapisu." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-16">
      {/* Pasek górny z nawigacją i zapisem */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/produkty"
            className="p-2 border border-[#EADFD5] bg-white rounded text-[#6E6259] hover:text-[#241D1B]"
            title="Powrót do listy"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl text-[#241D1B]">
              {isEditing ? `Edycja: ${initialProduct?.name}` : "Dodaj Nowe Ubranie"}
            </h1>
            <p className="text-xs text-[#6E6259]">
              Wypełnij formularz, skonfiguruj rozmiary, kolory i stany magazynowe.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditing && (
            <Link
              href={`/produkt/${slug}`}
              target="_blank"
              className="px-3.5 py-2.5 bg-white border border-[#EADFD5] text-xs uppercase tracking-wider rounded text-[#241D1B] hover:border-[#C5A069] flex items-center gap-1.5"
            >
              <span>Zobacz w sklepie</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#C5A069] text-white text-xs uppercase tracking-widest font-semibold rounded hover:bg-[#AF884F] transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4 text-white" />
            <span>{isSaving ? "Zapisywanie..." : "Zapisz Produkt"}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded border text-xs flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <Check className="w-4 h-4 shrink-0 text-emerald-700" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lewa kolumna: Dane podstawowe, opis, skład, wymiary */}
        <div className="lg:col-span-8 space-y-6">
          {/* Karta: Podstawowe */}
          <div className="bg-white p-6 border border-[#EADFD5] rounded shadow-sm space-y-4">
            <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
              Podstawowe Informacje
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Nazwa produktu *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Np. Satynowa Sukienka Midi z Wiązaniem"
                  value={name}
                  onChange={handleNameChange}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Kategoria w butiku *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Adres URL (Slug)
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs font-mono text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Opis produktu dla klientek *
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Opisz krój, stylizację i zalety materiału..."
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>
            </div>
          </div>

          {/* Karta: Skład, Pielęgnacja i Tabela Wymiarów */}
          <div className="bg-white p-6 border border-[#EADFD5] rounded shadow-sm space-y-4">
            <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
              Skład Tkaniny, Pielęgnacja & Wymiary
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Skład materiału
                </label>
                <input
                  type="text"
                  placeholder="Np. 70% wiskoza, 30% jedwab"
                  value={composition}
                  onChange={(e) => setComposition(e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Zasady pielęgnacji
                </label>
                <input
                  type="text"
                  placeholder="Np. Pranie ręczne 30°C, nie wirować"
                  value={careGuide}
                  onChange={(e) => setCareGuide(e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                Tabela wymiarów (w cm)
              </label>
              <textarea
                rows={3}
                placeholder={"XS: Biust 84cm, Talia 64cm, Długość 120cm\nS: Biust 88cm, Talia 68cm, Długość 122cm"}
                value={sizeGuide}
                onChange={(e) => setSizeGuide(e.target.value)}
                className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs font-mono text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
              />
            </div>
          </div>

          {/* Karta: ZARZĄDZANIE WARIANTAMI (Rozmiary, Kolory, SKU, Stany) */}
          <div className="bg-white p-6 border border-[#EADFD5] rounded shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EADFD5]">
              <div>
                <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B]">
                  Warianty & Stany Magazynowe
                </h2>
                <p className="text-[11px] text-[#6E6259]">
                  Każda kombinacja rozmiaru i koloru posiada osobny stan magazynowy i kod SKU.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="px-3 py-1.5 bg-[#FAF6F1] border border-[#EADFD5] text-[#241D1B] hover:border-[#C5A069] rounded text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-[#C5A069]" />
                <span>Dodaj wariant</span>
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div
                  key={v.id}
                  className="p-3 bg-[#FAF6F1] border border-[#EADFD5] rounded flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-xs"
                >
                  <div className="w-24">
                    <label className="text-[10px] uppercase text-[#6E6259] block">Rozmiar</label>
                    <input
                      type="text"
                      value={v.size}
                      onChange={(e) => handleUpdateVariant(v.id, "size", e.target.value)}
                      placeholder="S"
                      className="w-full bg-white border border-[#EADFD5] p-1.5 text-xs text-[#241D1B] uppercase font-bold"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="text-[10px] uppercase text-[#6E6259] block">Kolor</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={v.colorHex || "#D8C7B5"}
                        onChange={(e) => handleUpdateVariant(v.id, "colorHex", e.target.value)}
                        className="w-7 h-7 p-0 border border-black/20 rounded cursor-pointer"
                        title="Wybierz odcień próbnika"
                      />
                      <input
                        type="text"
                        value={v.color}
                        onChange={(e) => handleUpdateVariant(v.id, "color", e.target.value)}
                        placeholder="Piaskowy Beż"
                        className="flex-1 bg-white border border-[#EADFD5] p-1.5 text-xs text-[#241D1B]"
                      />
                    </div>
                  </div>

                  <div className="w-32">
                    <label className="text-[10px] uppercase text-[#6E6259] block">Kod SKU</label>
                    <input
                      type="text"
                      value={v.sku}
                      onChange={(e) => handleUpdateVariant(v.id, "sku", e.target.value)}
                      placeholder="AURA-SUK-01-S"
                      className="w-full bg-white border border-[#EADFD5] p-1.5 text-xs font-mono text-[#241D1B]"
                    />
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] uppercase text-[#6E6259] block font-semibold">Stan (szt.)</label>
                    <input
                      type="number"
                      min="0"
                      value={v.stockQuantity}
                      onChange={(e) => handleUpdateVariant(v.id, "stockQuantity", parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-[#EADFD5] p-1.5 text-xs font-bold text-[#241D1B]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(v.id)}
                    className="p-2 text-[#6E6259] hover:text-red-700 self-end sm:self-center"
                    title="Usuń wariant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Karta: Zdjęcia produktu */}
          <div className="bg-white p-6 border border-[#EADFD5] rounded shadow-sm space-y-4">
            <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
              Galeria Zdjęć Produktu
            </h2>
            <p className="text-xs text-[#6E6259]">
              Zgodnie z wymaganiami bazy Neon, pliki zdjęć są przechowywane w magazynie plików lub pod adresami URL (Cloudinary / Vercel Blob / public).
            </p>

            {/* Lista zdjęć */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className={`relative aspect-[3/4] bg-[#FAF6F1] border rounded overflow-hidden group ${
                    img.isPrimary ? "ring-2 ring-[#C5A069] border-transparent" : "border-[#EADFD5]"
                  }`}
                >
                  <Image src={img.url} alt="Zdjęcie produktu" fill className="object-cover" sizes="150px" />

                  {img.isPrimary && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#C5A069] text-white text-[9px] uppercase tracking-wider font-bold rounded shadow-xs">
                      Główne
                    </span>
                  )}

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img.id)}
                      className="self-end p-1 text-white hover:text-red-400"
                      title="Usuń zdjęcie"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {!img.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(img.id)}
                        className="py-1 px-2 bg-white text-[#241D1B] text-[10px] uppercase font-semibold rounded hover:bg-[#C5A069] hover:text-white transition-colors"
                      >
                        Ustaw jako główne
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Dodawanie nowego zdjęcia po URL */}
            <div className="pt-3 border-t border-[#EADFD5] flex gap-2">
              <input
                type="text"
                placeholder="Wklej adres URL zdjęcia (np. /images/products/... lub https://...)"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="flex-1 bg-[#FAF6F1] border border-[#EADFD5] p-2 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-4 py-2 bg-[#FAF6F1] border border-[#EADFD5] text-xs uppercase font-medium hover:bg-[#C5A069] hover:text-white transition-colors"
              >
                Dodaj zdjęcie
              </button>
            </div>
          </div>
        </div>

        {/* Prawa kolumna: Ceny, Osobna rubryka PROMOCJE, Flagi */}
        <div className="lg:col-span-4 space-y-6">
          {/* KARTA CENY I OSOBNA RUBRYKA PROMOCJE */}
          <div className="bg-white p-6 border border-[#EADFD5] rounded shadow-sm space-y-5">
            <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
              Cena i Promocje
            </h2>

            <div>
              <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                Cena regularna (PLN) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="349.00"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-sm font-semibold text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
              />
            </div>

            {/* DEDYKOWANA OSOBNA RUBRYKA NA WYBRANE PRODUKTY W PROMOCJI */}
            <div className="p-4 bg-rose-50/60 border border-rose-200 rounded space-y-3">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="isPromotedCheckbox"
                  checked={isPromoted}
                  onChange={(e) => setIsPromoted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#A84B4B] rounded"
                />
                <label htmlFor="isPromotedCheckbox" className="text-xs font-semibold text-[#A84B4B] cursor-pointer">
                  Zaznacz w sekcji Wybranych Promocji
                </label>
              </div>
              <p className="text-[11px] text-[#6E6259]">
                Tylko zaznaczone ubrania trafią do sekcji wyprzedażowej oraz otrzymają wyróżniający badge promocji.
              </p>

              {isPromoted && (
                <div className="pt-2 border-t border-rose-200">
                  <label className="text-[11px] font-semibold text-[#A84B4B] block mb-1">
                    Cena promocyjna (PLN)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="299.00"
                    value={promotionalPrice}
                    onChange={(e) => setPromotionalPrice(e.target.value)}
                    className="w-full bg-white border border-rose-300 p-2 text-xs font-bold text-[#A84B4B] focus:outline-none focus:border-[#A84B4B]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* KARTA FLAGI I WIDOCZNOŚĆ */}
          <div className="bg-white p-6 border border-[#EADFD5] rounded shadow-sm space-y-4">
            <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
              Wyróżnienia i Status
            </h2>

            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNew}
                  onChange={(e) => setIsNew(e.target.checked)}
                  className="w-4 h-4 accent-[#C5A069] rounded"
                />
                <span className="font-medium text-[#241D1B]">Oznacz jako Nowość</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBestseller}
                  onChange={(e) => setIsBestseller(e.target.checked)}
                  className="w-4 h-4 accent-[#C5A069] rounded"
                />
                <span className="font-medium text-[#241D1B]">Oznacz jako Bestseller</span>
              </label>

              <div className="pt-3 border-t border-[#EADFD5] space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  <span className="font-medium text-[#241D1B]">Publikuj w sklepie dla klientek</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isArchived}
                    onChange={(e) => setIsArchived(e.target.checked)}
                    className="w-4 h-4 accent-gray-600 rounded"
                  />
                  <span className="font-medium text-[#6E6259]">Archiwizuj produkt (ukryj ze sprzedaży)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
