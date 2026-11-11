"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Star,
  Camera,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Upload,
  X,
  Loader2,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import { ProductReview } from "@/lib/types";

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
}

export function ProductReviewsSection({
  productId,
  productName,
}: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Formularz opinii
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [content, setContent] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    message: string;
    rewardCode?: string;
    rewardPercent?: number;
    validUntil?: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Modal powiększenia zdjęcia opinii
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Pobranie opinii dla danego produktu
  useEffect(() => {
    let isMounted = true;
    fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && Array.isArray(data.reviews)) {
          setReviews(data.reviews.filter((r: ProductReview) => !r.isHidden));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [productId]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Proszę wybrać plik graficzny (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage("Plik zdjęcia jest za duży (maks. 8 MB).");
      return;
    }

    setIsUploadingPhoto(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/reviews/upload-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Nie udało się przesłać zdjęcia.");
      }

      setPhotoUrl(data.url);
    } catch (err: any) {
      setErrorMessage(err.message || "Błąd podczas przesyłania zdjęcia.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!displayName.trim() || !customerEmail.trim() || !content.trim()) {
      setErrorMessage("Wypełnij wszystkie wymagane pola formularza.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          displayName: displayName.trim(),
          customerEmail: customerEmail.trim(),
          rating,
          content: content.trim(),
          photoUrl: photoUrl || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Wystąpił problem podczas zapisywania opinii.");
      }

      setSuccessData({
        message: data.message || "Twoja opinia została pomyślnie dodana!",
        rewardCode: data.rewardCode,
        rewardPercent: data.rewardPercent,
        validUntil: data.validUntil,
      });

      if (data.review) {
        setReviews((prev) => [data.review, ...prev]);
      }

      // Reset pól
      setContent("");
      setPhotoUrl(null);
    } catch (err: any) {
      setErrorMessage(err.message || "Błąd wysyłania opinii.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <section id="opinie-o-produkcie" className="py-12 border-t border-[#EADFD5]">
      <div className="space-y-8">
        {/* Nagłówek sekcji opinii */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EADFD5]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-serif text-2xl sm:text-3xl text-[#241D1B]">
                Opinie Klientek
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EADFD5] text-[#241D1B] font-semibold">
                {reviews.length}
              </span>
            </div>

            {averageRating ? (
              <div className="flex items-center gap-2 text-xs text-[#5A483D]">
                <div className="flex text-[#C5A069]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(Number(averageRating))
                          ? "fill-[#C5A069] text-[#C5A069]"
                          : "text-[#D1C2B4]"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold text-sm text-[#241D1B]">{averageRating} / 5</span>
                <span className="text-[#857670]">• na podstawie {reviews.length} opinii</span>
              </div>
            ) : (
              <p className="text-xs text-[#857670]">
                Bądź pierwszą klientką, która podzieli się wrażeniami z noszenia tego modelu!
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setShowAddForm(!showAddForm);
              setSuccessData(null);
              setErrorMessage(null);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-widest font-semibold rounded-xs shadow-xs transition-colors shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{showAddForm ? "Zamknij formularz" : "Dodaj Opinię o Produkcie"}</span>
          </button>
        </div>

        {/* Informacja o nagrodach rabatowych */}
        <div className="p-4 bg-gradient-to-r from-[#FAF2EB] via-white to-[#FAF2EB] border border-[#DFCA9B] rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#5A483D]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#C5A069] shrink-0" />
            <div>
              <strong className="text-[#241D1B] block font-semibold">
                Odbierz rabat na kolejne zakupy w AURA Boutique!
              </strong>
              <span>
                Napisz opinię, a otrzymasz kupon <strong>–2%</strong>. Jeśli dołączysz zdjęcie swojej stylizacji, otrzymasz aż <strong>–5% rabatu</strong>!
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================
            FORMULARZ DODAWANIA OPINII
           ======================================================== */}
        {showAddForm && (
          <div className="bg-white p-6 sm:p-8 border border-[#DFCA9B] rounded-xs shadow-sm space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#EADFD5]">
              <h3 className="font-serif text-lg text-[#241D1B]">
                Twoja ocena dla: <span className="font-normal">{productName}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-[#857670] hover:text-[#241D1B] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successData ? (
              <div className="p-6 bg-[#FAF6F1] border border-[#DFCA9B] rounded-xs text-center space-y-4">
                <div className="inline-flex p-3 bg-emerald-100 text-emerald-800 rounded-full">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="font-serif text-xl text-[#241D1B]">Dziękujemy za Twoją opinię!</h4>
                <p className="text-xs text-[#6E6259] max-w-md mx-auto">{successData.message}</p>

                <p className="text-xs text-[#241D1B] font-medium max-w-md mx-auto bg-amber-50/80 border border-[#EADFD5] p-2.5 rounded">
                  ✉️ Kod rabatowy został również przesłany na Twój adres e-mail:{" "}
                  <strong>{customerEmail || (successData as any).customerEmail}</strong>.
                </p>

                {successData.rewardCode && (
                  <div className="max-w-xs mx-auto p-4 bg-white border border-[#DFCA9B] rounded-xs shadow-xs space-y-2">
                    <p className="text-[11px] uppercase tracking-wider text-[#8C6B38] font-semibold">
                      Twój kupon rabatowy –{successData.rewardPercent}%
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-mono text-base font-bold text-[#241D1B] bg-[#FAF2EB] px-3 py-1.5 rounded border border-[#DFCA9B]">
                        {successData.rewardCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(successData.rewardCode!)}
                        className="p-2 bg-[#C5A069] hover:bg-[#AF884F] text-white rounded transition-colors"
                        title="Kopiuj kod"
                      >
                        {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    {successData.validUntil && (
                      <p className="text-[10px] text-[#857670]">
                        Ważny przez 30 dni (do{" "}
                        {new Date(successData.validUntil).toLocaleDateString("pl-PL")})
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-5">
                {/* 1. Gwiazdki od 1 do 5 */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-2 font-semibold">
                    Twoja Ocena (od 1 do 5 gwiazdek) *
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 text-[#C5A069] hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-7 h-7 ${
                              star <= (hoverRating || rating)
                                ? "fill-[#C5A069] text-[#C5A069]"
                                : "text-[#D1C2B4]"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-[#8C6B38] ml-2">
                      {rating === 5 && "5 / 5 — Wspaniały / Zachwycający"}
                      {rating === 4 && "4 / 5 — Bardzo dobry"}
                      {rating === 3 && "3 / 5 — Dobry"}
                      {rating === 2 && "2 / 5 — Przeciętny"}
                      {rating === 1 && "1 / 5 — Słaby"}
                    </span>
                  </div>
                </div>

                {/* 2. Dane klientki */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1 font-semibold">
                      Twoje Imię / Nick *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="np. Anna K."
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1 font-semibold">
                      Twój Adres E-mail * (na ten e-mail wyślemy kod zniżkowy)
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="twoj-email@domena.pl"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-xs"
                    />
                  </div>
                </div>

                {/* 3. Treść opinii */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1 font-semibold">
                    Treść Opinii o Produkcie *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Opisz jak układa się tkanina, jak leży krój, jakość wykończenia oraz czy rozmiar odpowiada standardowemu..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-3 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded-xs leading-relaxed"
                  />
                </div>

                {/* 4. Dodanie zdjęcia */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1 font-semibold flex items-center justify-between">
                    <span>Zdjęcie stylizacji (opcjonalnie)</span>
                    <span className="text-[#C5A069] font-bold text-[11px] normal-case">
                      +3% dodatkowego rabatu = łącznie –5%!
                    </span>
                  </label>

                  {photoUrl ? (
                    <div className="relative inline-block border border-[#DFCA9B] rounded p-1 bg-[#FAF6F1]">
                      <div className="relative w-28 h-28 rounded overflow-hidden">
                        <Image
                          src={photoUrl}
                          alt="Zdjęcie opinii"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setPhotoUrl(null)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700"
                        title="Usuń zdjęcie"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-[#DFCA9B] hover:border-[#C5A069] bg-[#FAF6F1] p-4 rounded-xs flex items-center justify-center gap-3 cursor-pointer transition-colors text-xs text-[#6E6259]">
                      {isUploadingPhoto ? (
                        <>
                          <Loader2 className="w-5 h-5 text-[#C5A069] animate-spin" />
                          <span>Przetwarzanie zdjęcia...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-5 h-5 text-[#C5A069]" />
                          <span>Kliknij tutaj, aby dodać zdjęcie stylizacji (JPG, PNG)</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingPhoto}
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  )}
                </div>

                {/* 5. Przycisk zapisu */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploadingPhoto}
                    className="px-8 py-3.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-widest font-semibold rounded-xs shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-white" />
                    )}
                    <span>
                      {isSubmitting
                        ? "Zapisywanie..."
                        : photoUrl
                        ? "Opublikuj i Odbierz Rabat –5%"
                        : "Opublikuj i Odbierz Rabat –2%"}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ========================================================
            LISTA DODANYCH OPINII
           ======================================================== */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#857670]">
              <Loader2 className="w-6 h-6 animate-spin text-[#C5A069] mx-auto mb-2" />
              <span>Wczytywanie opinii o produkcie...</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-8 bg-white border border-[#EADFD5] rounded-xs text-center space-y-3">
              <Star className="w-8 h-8 text-[#D1C2B4] mx-auto" />
              <p className="font-serif text-lg text-[#241D1B]">Brak opinii dla tego produktu</p>
              <p className="text-xs text-[#857670] max-w-sm mx-auto">
                Kupiłaś ten produkt lub przymierzałaś go w butiku? Bądź pierwszą, która go oceni i odbierz rabat do –5%!
              </p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-[#8C6B38] hover:text-[#241D1B] underline"
              >
                Kliknij tutaj, aby dodać pierwszą opinię
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white p-5 border border-[#EADFD5] rounded-xs shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex text-[#C5A069]">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating
                                ? "fill-[#C5A069] text-[#C5A069]"
                                : "text-[#E0D3C3]"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-[#857670]">
                        {new Date(rev.createdAt).toLocaleDateString("pl-PL")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#241D1B]">
                        {rev.displayName}
                      </span>
                      {rev.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                          <span>Zweryfikowany zakup</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#4A3F3B] leading-relaxed font-light">
                      {rev.content}
                    </p>
                  </div>

                  {/* Zdjęcie stylizacji dodane przez klientkę */}
                  {rev.photoUrl && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setPreviewPhoto(rev.photoUrl!)}
                        className="relative w-20 h-20 rounded overflow-hidden border border-[#DFCA9B] hover:opacity-90 transition-opacity block group"
                      >
                        <Image
                          src={rev.photoUrl}
                          alt={`Stylizacja ${rev.displayName}`}
                          fill
                          className="object-cover"
                        />
                        <span className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px]">
                          Powiększ
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal powiększonego zdjęcia klientki */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-2xl max-h-[90vh] bg-white p-2 rounded shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-3 -right-3 bg-black text-white rounded-full p-1.5 shadow hover:bg-neutral-800"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="relative w-[85vw] max-w-xl h-[70vh]">
              <Image
                src={previewPhoto}
                alt="Powiększone zdjęcie opinii"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

