"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  ExternalLink,
  Camera,
  Loader2,
  Crop,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react";
import { Product, Category, ProductVariant, ProductImage } from "@/lib/types";

// ─── Predefiniowana paleta kolorów dla odzieży damskiej ───────────────────────
const PRESET_COLORS: { name: string; hex: string }[] = [
  { name: "Ecru / Kość słoniowa", hex: "#FAF0DC" },
  { name: "Piaskowy Beż", hex: "#D8C7B5" },
  { name: "Cappuccino", hex: "#C1A882" },
  { name: "Karmel", hex: "#B07D4E" },
  { name: "Czekolada", hex: "#6B3D2E" },
  { name: "Pudrowy Róż", hex: "#F2C4CE" },
  { name: "Blush / Łosoś", hex: "#E8A598" },
  { name: "Stary Róż", hex: "#C4818A" },
  { name: "Dusty Mauve", hex: "#A0636F" },
  { name: "Bordo", hex: "#722F37" },
  { name: "Lawendowy", hex: "#D5C9E8" },
  { name: "Liliowy", hex: "#B39DC9" },
  { name: "Fioletowy", hex: "#7B5EA7" },
  { name: "Miętowy", hex: "#B8E0D2" },
  { name: "Szałwiowy", hex: "#8DB5A0" },
  { name: "Butelkowa Zieleń", hex: "#2D6A4F" },
  { name: "Błękitny", hex: "#BDD5EA" },
  { name: "Granatowy", hex: "#1B3A6B" },
  { name: "Błękit Paryski", hex: "#5B7FA6" },
  { name: "Niebiesko-szary", hex: "#8FA3B1" },
  { name: "Jasnoszary", hex: "#D6D6D6" },
  { name: "Szary Melanż", hex: "#9E9E9E" },
  { name: "Ciemnoszary", hex: "#555555" },
  { name: "Grafit", hex: "#3A3A3A" },
  { name: "Czarny", hex: "#1A1A1A" },
  { name: "Biały", hex: "#FAFAFA" },
  { name: "Złamana Biel", hex: "#F5F0E8" },
  { name: "Żółty Maślany", hex: "#F5E6A3" },
  { name: "Musztardowy", hex: "#C9A84C" },
  { name: "Terakota", hex: "#C1694F" },
];

// ─── Modal wyboru koloru ──────────────────────────────────────────────────────
interface ColorPickerModalProps {
  currentHex: string;
  currentName: string;
  onSelect: (hex: string, name: string) => void;
  onClose: () => void;
}

function ColorPickerModal({ currentHex, currentName, onSelect, onClose }: ColorPickerModalProps) {
  const [customHex, setCustomHex] = useState(currentHex);
  const [customName, setCustomName] = useState(currentName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-sm uppercase tracking-wider text-[#241D1B]">Wybierz kolor</h3>
          <button type="button" onClick={onClose} className="text-[#6E6259] hover:text-[#241D1B]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Siatka kolorów */}
        <div className="grid grid-cols-6 gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              title={c.name}
              onClick={() => { onSelect(c.hex, c.name); onClose(); }}
              className={`w-9 h-9 rounded-full border-2 transition-transform hover:scale-110 ${
                currentHex.toLowerCase() === c.hex.toLowerCase()
                  ? "border-[#C5A069] scale-110 shadow-md"
                  : "border-transparent hover:border-[#C5A069]/60"
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>

        {/* Własny kolor */}
        <div className="pt-3 border-t border-[#EADFD5] space-y-2">
          <p className="text-[11px] text-[#6E6259] font-medium uppercase tracking-wider">Lub własny odcień:</p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              className="w-10 h-10 rounded border border-[#EADFD5] cursor-pointer p-0.5"
            />
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Nazwa koloru"
              className="flex-1 bg-[#FAF6F1] border border-[#EADFD5] p-2 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
            />
            <button
              type="button"
              onClick={() => { onSelect(customHex, customName || "Własny kolor"); onClose(); }}
              className="px-3 py-2 bg-[#C5A069] text-white text-xs rounded hover:bg-[#AF884F]"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal kadrowania zdjęcia ─────────────────────────────────────────────────
interface CropModalProps {
  imageSrc: string;
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

function CropModal({ imageSrc, onConfirm, onCancel }: CropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Stan kadru: x, y to pozycja lewego górnego rogu kadru w px obrazka naturalnego
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [dragging, setDragging] = useState<"crop" | "resize" | null>(null);
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, cx: 0, cy: 0, cw: 0, ch: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Wymiary kontenera podglądu
  const PREVIEW_W = 360;
  const PREVIEW_H = 400;

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      // Domyślny kadr - 80% obrazu, wyśrodkowany, kwadrat lub 3:4
      const shorter = Math.min(img.naturalWidth, img.naturalHeight);
      const side = Math.round(shorter * 0.85);
      setCrop({
        x: Math.round((img.naturalWidth - side) / 2),
        y: Math.round((img.naturalHeight - side) / 2),
        w: side,
        h: Math.round(side * 4 / 3),
      });
      setImgLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Rysuj podgląd na <canvas>
  useEffect(() => {
    if (!imgLoaded || !previewRef.current || !imgRef.current) return;
    const canvas = previewRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = imgRef.current;

    canvas.width = PREVIEW_W;
    canvas.height = PREVIEW_H;

    // Skala by zmieścić obraz w kontenerze
    const scaleX = PREVIEW_W / img.naturalWidth;
    const scaleY = PREVIEW_H / img.naturalHeight;
    const scale = Math.min(scaleX, scaleY) * zoom;

    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const offsetX = (PREVIEW_W - drawW) / 2;
    const offsetY = (PREVIEW_H - drawH) / 2;

    ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);

    ctx.save();
    ctx.translate(PREVIEW_W / 2, PREVIEW_H / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-PREVIEW_W / 2, -PREVIEW_H / 2);
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    ctx.restore();

    // Overlay poza kadrem
    const cx = offsetX + crop.x * scale;
    const cy = offsetY + crop.y * scale;
    const cw = crop.w * scale;
    const ch = crop.h * scale;

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, PREVIEW_W, cy);
    ctx.fillRect(0, cy + ch, PREVIEW_W, PREVIEW_H - cy - ch);
    ctx.fillRect(0, cy, cx, ch);
    ctx.fillRect(cx + cw, cy, PREVIEW_W - cx - cw, ch);

    // Ramka kadru
    ctx.strokeStyle = "#C5A069";
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, cw, ch);

    // Uchwyty narożne
    const hs = 10;
    ctx.fillStyle = "#C5A069";
    [[cx, cy], [cx + cw - hs, cy], [cx, cy + ch - hs], [cx + cw - hs, cy + ch - hs]].forEach(([rx, ry]) => {
      ctx.fillRect(rx, ry, hs, hs);
    });
  }, [imgLoaded, crop, zoom, rotation]);

  const getScale = () => {
    if (!imgRef.current) return 1;
    const img = imgRef.current;
    const scaleX = PREVIEW_W / img.naturalWidth;
    const scaleY = PREVIEW_H / img.naturalHeight;
    return Math.min(scaleX, scaleY) * zoom;
  };

  const getOffset = () => {
    if (!imgRef.current) return { ox: 0, oy: 0 };
    const img = imgRef.current;
    const scale = getScale();
    return {
      ox: (PREVIEW_W - img.naturalWidth * scale) / 2,
      oy: (PREVIEW_H - img.naturalHeight * scale) / 2,
    };
  };

  const canvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imgRef.current) return;
    const rect = previewRef.current!.getBoundingClientRect();
    const scale = getScale();
    const { ox, oy } = getOffset();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check resize handle (bottom-right corner)
    const cx = ox + crop.x * scale;
    const cy = oy + crop.y * scale;
    const cw = crop.w * scale;
    const ch = crop.h * scale;
    if (mx >= cx + cw - 16 && my >= cy + ch - 16) {
      setDragging("resize");
    } else if (mx >= cx && mx <= cx + cw && my >= cy && my <= cy + ch) {
      setDragging("crop");
    }
    setDragStart({ mx, my, cx: crop.x, cy: crop.y, cw: crop.w, ch: crop.h });
  };

  const canvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging || !imgRef.current) return;
    const rect = previewRef.current!.getBoundingClientRect();
    const scale = getScale();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const dx = (mx - dragStart.mx) / scale;
    const dy = (my - dragStart.my) / scale;
    const img = imgRef.current;

    if (dragging === "crop") {
      const nx = Math.max(0, Math.min(img.naturalWidth - dragStart.cw, dragStart.cx + dx));
      const ny = Math.max(0, Math.min(img.naturalHeight - dragStart.ch, dragStart.cy + dy));
      setCrop((c) => ({ ...c, x: Math.round(nx), y: Math.round(ny) }));
    } else if (dragging === "resize") {
      const nw = Math.max(40, Math.min(img.naturalWidth - dragStart.cx, dragStart.cw + dx));
      const nh = Math.max(40, Math.min(img.naturalHeight - dragStart.cy, dragStart.ch + dy));
      setCrop((c) => ({ ...c, w: Math.round(nw), h: Math.round(nh) }));
    }
  };

  const handleConfirm = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const outputCanvas = canvasRef.current!;
    outputCanvas.width = crop.w;
    outputCanvas.height = crop.h;
    const ctx = outputCanvas.getContext("2d")!;
    ctx.save();
    if (rotation !== 0) {
      ctx.translate(crop.w / 2, crop.h / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-crop.w / 2, -crop.h / 2);
    }
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
    ctx.restore();
    const dataUrl = outputCanvas.toDataURL("image/jpeg", 0.92);
    onConfirm(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#EADFD5]">
          <div className="flex items-center gap-2">
            <Crop className="w-4 h-4 text-[#C5A069]" />
            <h3 className="font-serif text-sm uppercase tracking-wider text-[#241D1B]">Kadruj zdjęcie</h3>
          </div>
          <button type="button" onClick={onCancel} className="text-[#6E6259] hover:text-[#241D1B]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {!imgLoaded ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-[#C5A069]" />
            </div>
          ) : (
            <>
              <p className="text-[11px] text-[#6E6259]">
                Przeciągnij ramkę aby przesunąć kadr. Przeciągnij prawy dolny róg ramki, aby zmienić rozmiar.
              </p>
              <div ref={containerRef} className="relative select-none cursor-crosshair" style={{ width: PREVIEW_W, height: PREVIEW_H }}>
                <canvas
                  ref={previewRef}
                  width={PREVIEW_W}
                  height={PREVIEW_H}
                  className="rounded"
                  onMouseDown={canvasMouseDown}
                  onMouseMove={canvasMouseMove}
                  onMouseUp={() => setDragging(null)}
                  onMouseLeave={() => setDragging(null)}
                />
              </div>

              {/* Zoom i rotacja */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[11px] text-[#6E6259] w-10">Zoom:</span>
                <button type="button" onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))} className="p-1 border border-[#EADFD5] rounded hover:border-[#C5A069]">
                  <ZoomOut className="w-3.5 h-3.5 text-[#6E6259]" />
                </button>
                <input type="range" min="0.3" max="3" step="0.05" value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-[#C5A069]" />
                <button type="button" onClick={() => setZoom((z) => Math.min(3, z + 0.1))} className="p-1 border border-[#EADFD5] rounded hover:border-[#C5A069]">
                  <ZoomIn className="w-3.5 h-3.5 text-[#6E6259]" />
                </button>
                <button type="button" onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1 border border-[#EADFD5] rounded hover:border-[#C5A069] ml-2" title="Obróć o 90°">
                  <RotateCw className="w-3.5 h-3.5 text-[#6E6259]" />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 px-5 py-3 border-t border-[#EADFD5]">
          <button type="button" onClick={onCancel}
            className="flex-1 py-2 border border-[#EADFD5] text-xs text-[#6E6259] rounded hover:border-[#C5A069]">
            Anuluj
          </button>
          <button type="button" onClick={handleConfirm} disabled={!imgLoaded}
            className="flex-1 py-2 bg-[#C5A069] text-white text-xs rounded hover:bg-[#AF884F] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50">
            <Check className="w-3.5 h-3.5" />
            Zatwierdź kadr
          </button>
        </div>

        {/* Ukryty canvas do renderowania wyniku */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

interface ProductEditorProps {
  initialProduct?: Product;
  categories: Category[];
}

export function ProductEditor({ initialProduct, categories }: ProductEditorProps) {
  const router = useRouter();
  const isEditing = Boolean(initialProduct);

  const [name, setName] = useState(initialProduct?.name || "");
  const [slug, setSlug] = useState(initialProduct?.slug || "");
  const [categoryList, setCategoryList] = useState<Category[]>(categories);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  const [categoryId, setCategoryId] = useState(
    initialProduct?.categoryId || categories[0]?.id || "cat-bluzy"
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

  // Zdjęcia + kadrowanie
  const [images, setImages] = useState<ProductImage[]>(
    initialProduct?.images || []
  );
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Kolejka do kadrowania: pliki czekające na crop, jeden na raz
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  // Selektor koloru dla wariantu
  const [colorPickerVariantId, setColorPickerVariantId] = useState<string | null>(null);

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

  // Obsługa dodawania nowej kategorii ubrań przez właścicielkę
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSavingCategory(true);
    setCategoryError("");
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Błąd dodawania kategorii");
      }
      setCategoryList((prev) => [...prev, data.category]);
      setCategoryId(data.category.id);
      setNewCategoryName("");
      setIsAddingCategory(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Błąd zapisu kategorii";
      setCategoryError(msg);
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Po wybraniu pliku(ów) → otwieramy kadrowanie dla pierwszego pliku
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArr = Array.from(files);
    // Ustaw kolejkę i otwórz crop dla pierwszego
    openCropForFile(fileArr[0], fileArr.slice(1));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCropForFile = (file: File, rest: File[]) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropSrc(ev.target?.result as string);
      setCropQueue(rest);
    };
    reader.readAsDataURL(file);
  };

  // Po zatwierdzeniu kadru → uploadujemy przycięte zdjęcie
  const handleCropConfirm = async (croppedDataUrl: string) => {
    setCropSrc(null);
    setIsUploading(true);
    setUploadError("");

    try {
      // DataURL → Blob → FormData
      const res0 = await fetch(croppedDataUrl);
      const blob = await res0.blob();
      const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("files", file);

      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd przesyłania");

      const newImg: ProductImage = {
        id: `img-${Date.now()}-0`,
        productId: initialProduct?.id || "",
        url: data.urls[0],
        altText: name || "Zdjęcie produktu",
        orderIndex: images.length,
        isPrimary: images.length === 0,
      };
      setImages((prev) => [...prev, newImg]);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Nie udało się przesłać");
    } finally {
      setIsUploading(false);
      // Jeśli są kolejne pliki w kolejce, otwórz crop dla następnego
      if (cropQueue.length > 0) {
        const [next, ...rest] = cropQueue;
        setTimeout(() => openCropForFile(next, rest), 100);
      }
    }
  };

  const handleCropCancel = () => {
    setCropSrc(null);
    // Pomiń plik, otwórz crop dla następnego w kolejce
    if (cropQueue.length > 0) {
      const [next, ...rest] = cropQueue;
      openCropForFile(next, rest);
    }
  };

  // Obsługa zdjęć po URL
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

      if (!data.product || !data.product.id) {
        throw new Error("Serwer nie zwrócił poprawnego rekordu utworzonego produktu.");
      }

      const savedProduct: Product = data.product;
      const targetId = String(savedProduct.id);

      // Kopia zapasowa w pamięci przeglądarki (localStorage) dla bezpieczeństwa
      try {
        const raw = localStorage.getItem("aura_custom_products");
        const list: Product[] = raw ? JSON.parse(raw) : [];
        const updatedList = [savedProduct, ...list.filter((x) => x.id !== targetId)];
        localStorage.setItem("aura_custom_products", JSON.stringify(updatedList.slice(0, 50)));
      } catch (_) {}

      setFeedback({
        type: "success",
        text: isEditing
          ? "Zmiany w produkcie zostały pomyślnie i trwale zapisane w bazie!"
          : "Nowy produkt został pomyślnie dodany do oferty butiku! Przekierowywanie do edycji...",
      });

      // Przekierowanie do edycji z użyciem dokładnego ID zwróconego przez serwer
      setTimeout(() => {
        window.location.href = `/admin/produkty/${targetId}`;
      }, 700);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Błąd zapisu." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Modal kadrowania zdjęcia */}
      {cropSrc && (
        <CropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      {/* Modal wyboru koloru dla wariantu */}
      {colorPickerVariantId && (() => {
        const v = variants.find((x) => x.id === colorPickerVariantId);
        if (!v) return null;
        return (
          <ColorPickerModal
            currentHex={v.colorHex || "#D8C7B5"}
            currentName={v.color}
            onSelect={(hex, colorName) => {
              handleUpdateVariant(colorPickerVariantId, "colorHex", hex);
              handleUpdateVariant(colorPickerVariantId, "color", colorName);
            }}
            onClose={() => setColorPickerVariantId(null)}
          />
        );
      })()}

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
          <div className="bg-white p-4 sm:p-6 border border-[#EADFD5] rounded shadow-sm space-y-4">
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#241D1B]">
                      Kategoria / Rodzaj ubrania *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(!isAddingCategory)}
                      className="text-[11px] text-[#C5A069] hover:underline font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isAddingCategory ? "Anuluj" : "+ Dodaj nowy rodzaj"}</span>
                    </button>
                  </div>

                  {isAddingCategory && (
                    <div className="mb-2 p-3 bg-[#F5EDE3] border border-[#DFCA9B] rounded space-y-2 text-xs">
                      <p className="text-[11px] font-medium text-[#241D1B]">
                        Wpisz nazwę nowego rodzaju ubrania (np. Spódnice, Marynarki, Kurtki, Kombinezony):
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Np. Marynarki"
                          className="flex-1 bg-white border border-[#EADFD5] p-2 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                        />
                        <button
                          type="button"
                          disabled={isSavingCategory || !newCategoryName.trim()}
                          onClick={handleCreateCategory}
                          className="px-3 py-2 bg-[#C5A069] text-white text-xs font-semibold rounded hover:bg-[#AF884F] transition-colors disabled:opacity-50"
                        >
                          {isSavingCategory ? "Dodawanie..." : "Dodaj"}
                        </button>
                      </div>
                      {categoryError && (
                        <p className="text-[11px] text-red-600 font-medium">{categoryError}</p>
                      )}
                    </div>
                  )}

                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                  >
                    {categoryList.map((c) => (
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
          <div className="bg-white p-4 sm:p-6 border border-[#EADFD5] rounded shadow-sm space-y-4">
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
          <div className="bg-white p-4 sm:p-6 border border-[#EADFD5] rounded shadow-sm space-y-4">
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
                  <div className="w-full sm:w-24">
                    <label className="text-[10px] uppercase text-[#6E6259] block">Rozmiar</label>
                    <input
                      type="text"
                      value={v.size}
                      onChange={(e) => handleUpdateVariant(v.id, "size", e.target.value)}
                      placeholder="S"
                      className="w-full bg-white border border-[#EADFD5] p-1.5 text-xs text-[#241D1B] uppercase font-bold"
                    />
                  </div>

                  <div className="w-full sm:flex-1">
                    <label className="text-[10px] uppercase text-[#6E6259] block">Kolor</label>
                    <button
                      type="button"
                      onClick={() => setColorPickerVariantId(v.id)}
                      className="flex items-center gap-2 w-full bg-white border border-[#EADFD5] p-1.5 text-xs text-[#241D1B] hover:border-[#C5A069] transition-colors rounded"
                      title="Kliknij aby wybrać kolor"
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: v.colorHex || "#D8C7B5" }}
                      />
                      <span className="flex-1 text-left truncate">{v.color || "Wybierz kolor"}</span>
                      <span className="text-[10px] text-[#C5A069]">▼</span>
                    </button>
                  </div>

                  <div className="w-full sm:w-32">
                    <label className="text-[10px] uppercase text-[#6E6259] block">Kod SKU</label>
                    <input
                      type="text"
                      value={v.sku}
                      onChange={(e) => handleUpdateVariant(v.id, "sku", e.target.value)}
                      placeholder="AURA-SUK-01-S"
                      className="w-full bg-white border border-[#EADFD5] p-1.5 text-xs font-mono text-[#241D1B]"
                    />
                  </div>

                  <div className="w-full sm:w-24">
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
          <div className="bg-white p-4 sm:p-6 border border-[#EADFD5] rounded shadow-sm space-y-5">
            <div>
              <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
                Galeria Zdjęć Produktu
              </h2>
              <p className="text-xs text-[#6E6259] mt-2">
                Możesz dodawać zdjęcia bezpośrednio z telefonu lub komputera. Zdjęcia zostaną automatycznie obrócone i zoptymalizowane do formatu WebP.
              </p>
            </div>

            {/* Komunikat o błędzie uploadu */}
            {uploadError && (
              <div className="p-3 bg-[#FCEAE7] border border-[#EAC4BE] text-[#A84B4B] text-xs rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Główny przycisk dodawania zdjęć z telefonu / aparatu / dysku */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="product-photo-upload"
            />

            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                isUploading
                  ? "border-[#C5A069] bg-[#FAF6F1] opacity-75 cursor-wait"
                  : "border-[#C5A069]/60 hover:border-[#C5A069] bg-[#FAF6F1]/50 hover:bg-[#FAF6F1]"
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-[#C5A069] animate-spin" />
                  <span className="font-serif text-sm font-semibold text-[#241D1B]">
                    Przesyłanie i optymalizowanie zdjęć...
                  </span>
                  <span className="text-[11px] text-[#857670]">
                    Trwa kompresja i automatyczna rotacja orientacji aparatu.
                  </span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-[#FAF6F1] border border-[#DFCA9B] flex items-center justify-center text-[#9E743A] shadow-xs">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="font-serif text-sm font-semibold text-[#241D1B]">
                    Dodaj zdjęcia z telefonu / zrób zdjęcie aparatem
                  </span>
                  <span className="text-xs text-[#857670] text-center max-w-md">
                    Dotknij tutaj, aby otworzyć aparat lub galerię zdjęć w telefonie. Możesz wybrać kilka zdjęć naraz.
                  </span>
                </>
              )}
            </button>

            {/* Lista zdjęć */}
            {images.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#857670] border border-dashed border-[#EADFD5] rounded">
                Brak dodanych zdjęć. Dotknij przycisku powyżej, aby dodać pierwsze zdjęcie produktu.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className={`relative aspect-[3/4] bg-[#FAF6F1] border rounded overflow-hidden group ${
                      img.isPrimary ? "ring-2 ring-[#C5A069] border-transparent" : "border-[#EADFD5]"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt="Zdjęcie produktu"
                      fill
                      className="object-cover"
                      sizes="150px"
                      unoptimized={img.url.startsWith("data:")}
                    />

                    {img.isPrimary && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#C5A069] text-white text-[9px] uppercase tracking-wider font-bold rounded shadow-xs z-10">
                        Główne
                      </span>
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 z-10">
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
            )}

            {/* Alternatywne dodawanie nowego zdjęcia po URL */}
            <details className="text-xs text-[#6E6259] pt-2 border-t border-[#EADFD5]">
              <summary className="cursor-pointer hover:text-[#C5A069] font-medium py-1">
                Lub wklej bezpośredni adres URL do zdjęcia
              </summary>
              <div className="pt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Wklej adres URL zdjęcia (np. https://...)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1 bg-[#FAF6F1] border border-[#EADFD5] p-2 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-4 py-2 bg-[#FAF6F1] border border-[#EADFD5] text-xs uppercase font-medium hover:bg-[#C5A069] hover:text-white transition-colors"
                >
                  Dodaj z linku
                </button>
              </div>
            </details>
          </div>
        </div>

        {/* Prawa kolumna: Ceny, Osobna rubryka PROMOCJE, Flagi */}
        <div className="lg:col-span-4 space-y-6">
          {/* KARTA CENY I OSOBNA RUBRYKA PROMOCJE */}
          <div className="bg-white p-4 sm:p-6 border border-[#EADFD5] rounded shadow-sm space-y-5">
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
          <div className="bg-white p-4 sm:p-6 border border-[#EADFD5] rounded shadow-sm space-y-4">
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
    </>
  );
}
