"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Edit2,
  Trash2,
  Camera,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  ArrowLeft,
  X,
  Upload,
} from "lucide-react";
import { Category } from "@/lib/types";

interface CategoryManagerClientProps {
  initialCategories: Category[];
}

export function CategoryManagerClient({ initialCategories }: CategoryManagerClientProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Stan formularza (dla nowej lub edytowanej kategorii)
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardFileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadCatId, setActiveUploadCatId] = useState<string | null>(null);

  const resetForm = () => {
    setFormName("");
    setFormDesc("");
    setFormImageUrl("");
    setFormIsActive(true);
    setEditingCategory(null);
    setIsAdding(false);
  };

  const startEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDesc(cat.description || "");
    setFormImageUrl(cat.imageUrl || "");
    setFormIsActive(cat.isActive);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Upload zdjęcia z telefonu / komputera
  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>, targetMode: "form" | "quickCard") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("files", files[0]);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Błąd podczas wgrywania zdjęcia");
      }

      const uploadedUrl = data.urls[0];

      if (targetMode === "form") {
        setFormImageUrl(uploadedUrl);
        setFeedback({ type: "success", text: "Zdjęcie zostało pomyślnie wgrane!" });
      } else if (targetMode === "quickCard" && activeUploadCatId) {
        // Szybka zmiana zdjęcia bezpośrednio na karcie kategorii
        const targetCat = categories.find((c) => c.id === activeUploadCatId);
        if (targetCat) {
          const updateRes = await fetch("/api/admin/categories", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: activeUploadCatId,
              imageUrl: uploadedUrl,
            }),
          });
          if (updateRes.ok) {
            setCategories((prev) =>
              prev.map((c) => (c.id === activeUploadCatId ? { ...c, imageUrl: uploadedUrl } : c))
            );
            setFeedback({ type: "success", text: `Zaktualizowano zdjęcie główne dla kategorii: ${targetCat.name}` });
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Błąd przesyłania zdjęcia";
      setFeedback({ type: "error", text: msg });
    } finally {
      setIsUploading(false);
      setActiveUploadCatId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cardFileInputRef.current) cardFileInputRef.current.value = "";
    }
  };

  // Zapisanie nowej lub edytowanej kategorii
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFeedback({ type: "error", text: "Podaj nazwę kategorii" });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      if (editingCategory) {
        // Aktualizacja
        const res = await fetch("/api/admin/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingCategory.id,
            name: formName.trim(),
            description: formDesc.trim(),
            imageUrl: formImageUrl.trim(),
            isActive: formIsActive,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Błąd zapisu kategorii");

        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? data.category : c))
        );
        setFeedback({ type: "success", text: "Kategoria została zaktualizowana!" });
      } else {
        // Tworzenie nowej
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            description: formDesc.trim(),
            imageUrl: formImageUrl.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Błąd tworzenia kategorii");

        setCategories((prev) => [...prev, data.category]);
        setFeedback({ type: "success", text: "Nowa kategoria została dodana do butiku!" });
      }
      resetForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Wystąpił błąd podczas zapisu";
      setFeedback({ type: "error", text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  // Usuwanie kategorii
  const handleDelete = async (cat: Category) => {
    if (!confirm(`Czy na pewno chcesz usunąć kategorię "${cat.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${cat.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        setFeedback({ type: "success", text: `Usunięto kategorię "${cat.name}".` });
      } else {
        const data = await res.json();
        throw new Error(data.error || "Błąd usuwania");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Nie udało się usunąć kategorii";
      setFeedback({ type: "error", text: msg });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Ukryty input do szybkiej zmiany zdjęcia z poziomu kafelka */}
      <input
        ref={cardFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleUploadPhoto(e, "quickCard")}
      />

      {/* Nagłówek sekcji */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EADFD5]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin"
              className="p-1 text-[#6E6259] hover:text-[#241D1B] rounded border border-[#EADFD5] bg-white sm:hidden"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#241D1B]">
              Zarządzanie Rodzajami Ubrań (Kategorie)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#6E6259]">
            Zarządzaj rodzajami ubrań w swoim butiku. Możesz dodawać nowe, zmieniać ich nazwy oraz ustawiać główne zdjęcia widoczne w okrągłych medalionach na stronie głównej.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isAdding) {
              resetForm();
            } else {
              setIsAdding(true);
            }
          }}
          className="px-4 py-2.5 bg-[#C5A069] text-white text-xs uppercase tracking-wider font-semibold rounded hover:bg-[#AF884F] transition-all flex items-center justify-center gap-2 shadow-xs shrink-0"
        >
          {isAdding ? (
            <>
              <X className="w-4 h-4" />
              <span>Zamknij formularz</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>+ Dodaj nową kategorię</span>
            </>
          )}
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded border text-xs flex items-center justify-between gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <Check className="w-4 h-4 shrink-0 text-emerald-700" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-75"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Formularz dodawania / edycji kategorii */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 sm:p-6 border-2 border-[#C5A069]/40 rounded shadow-md space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#EADFD5]">
            <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B] font-semibold">
              {editingCategory ? `Edycja kategorii: ${editingCategory.name}` : "Dodaj Nowy Rodzaj Ubrania"}
            </h2>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-[#857670] hover:text-[#241D1B]"
            >
              Anuluj
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lewa strona: Nazwa, Opis, Aktywność */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Nazwa kategorii *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Np. Bluzy, Koszule, Topy, Marynarki, Kurtki..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Krótki opis kategorii (opcjonalny)
                </label>
                <textarea
                  rows={2}
                  placeholder="Opisz styl ubrań z tej kategorii..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>

              {editingCategory && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="cat-active-check"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 accent-[#C5A069] rounded cursor-pointer"
                  />
                  <label htmlFor="cat-active-check" className="text-xs text-[#241D1B] font-medium cursor-pointer">
                    Kategoria jest widoczna w sklepie (aktywna)
                  </label>
                </div>
              )}
            </div>

            {/* Prawa strona: Zdjęcie główne kategorii */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-[#241D1B] block">
                Zdjęcie główne kategorii (Wyświetlane w medalionie na stronie głównej)
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-[#FAF6F1] border border-[#EADFD5] rounded">
                {/* Podgląd medalionu */}
                <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-br from-[#DFCA9B] via-[#C5A069] to-[#9E743A] shadow-md shrink-0">
                  <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white bg-[#F7EFE8]">
                    <Image
                      src={formImageUrl || "/images/brand/aura-logo.png"}
                      alt="Podgląd kategorii"
                      fill
                      unoptimized={Boolean(formImageUrl && formImageUrl.startsWith("data:"))}
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleUploadPhoto(e, "form")}
                  />

                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-white border border-[#C5A069] text-[#241D1B] hover:bg-[#C5A069] hover:text-white transition-all text-xs font-semibold rounded flex items-center justify-center gap-2 shadow-xs w-full sm:w-auto"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#C5A069]" />
                        <span>Przesyłanie zdjęcia...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 text-[#C5A069]" />
                        <span>Wybierz zdjęcie z telefonu / dysku</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-[#857670]">
                    Możesz wybrać zdjęcie z galerii w telefonie lub zrobić nowe zdjęcie aparatem.
                  </p>

                  <div className="pt-2">
                    <input
                      type="text"
                      placeholder="Lub wklej link do zdjęcia (np. /images/...)"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="w-full bg-white border border-[#EADFD5] p-1.5 text-[11px] text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#EADFD5] flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-semibold rounded text-[#241D1B]"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors disabled:opacity-50"
            >
              {isSaving ? "Zapisywanie..." : editingCategory ? "Zapisz Zmiany" : "Utwórz Kategorię"}
            </button>
          </div>
        </form>
      )}

      {/* Lista wszystkich kategorii w butiku */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg text-[#241D1B] font-semibold">
            Wszystkie Rodzaje Ubrań w Butiku ({categories.length})
          </h2>
          <span className="text-xs text-[#857670]">
            Kolejność odpowiada kolejności wyświetlania w sklepie
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              className="bg-white border border-[#EADFD5] hover:border-[#C5A069] rounded shadow-xs p-5 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start gap-4">
                {/* Okrągły medalion ze zdjęciem głównym kategorii */}
                <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-br from-[#DFCA9B] via-[#C5A069] to-[#9E743A] shadow-md shrink-0">
                  <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white bg-[#F7EFE8]">
                    <Image
                      src={cat.imageUrl || "/images/brand/aura-logo.png"}
                      alt={cat.name}
                      fill
                      unoptimized={Boolean(cat.imageUrl && cat.imageUrl.startsWith("data:"))}
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-base font-bold text-[#241D1B] truncate">
                      {cat.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 text-[9px] uppercase font-bold rounded ${
                        cat.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {cat.isActive ? "Aktywna" : "Ukryta"}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#857670] font-mono mt-0.5">
                    /{cat.slug}
                  </p>

                  {cat.description && (
                    <p className="text-xs text-[#6E6259] mt-2 line-clamp-2">
                      {cat.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Dolna belka akcji na kafelku */}
              <div className="pt-3 border-t border-[#FAF6F1] flex items-center justify-between gap-2">
                {/* Szybka zmiana zdjęcia z telefonu */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveUploadCatId(cat.id);
                    cardFileInputRef.current?.click();
                  }}
                  className="px-2.5 py-1.5 bg-[#FAF6F1] hover:bg-[#F2DCD7] border border-[#EADFD5] text-[11px] font-semibold text-[#241D1B] rounded flex items-center gap-1.5 transition-colors"
                  title="Zmień zdjęcie główne tej kategorii"
                >
                  <Camera className="w-3.5 h-3.5 text-[#C5A069]" />
                  <span>Zmień zdjęcie</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => startEdit(cat)}
                    className="p-1.5 bg-white border border-[#EADFD5] hover:border-[#C5A069] text-[#241D1B] rounded transition-colors"
                    title="Edytuj kategorię"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 bg-white border border-[#EADFD5] hover:border-red-400 text-red-600 rounded transition-colors"
                    title="Usuń kategorię"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
