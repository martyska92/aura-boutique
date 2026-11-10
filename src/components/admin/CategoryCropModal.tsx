"use client";

import React, { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCw, X, Check, Sparkles } from "lucide-react";

interface CategoryCropModalProps {
  imageSrc: string;
  categoryName?: string;
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export function CategoryCropModal({
  imageSrc,
  categoryName,
  onConfirm,
  onCancel,
}: CategoryCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Kadr 1:1
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [dragging, setDragging] = useState<"crop" | "resize" | null>(null);
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, cx: 0, cy: 0, cs: 0 });

  const PREVIEW_W = 360;
  const PREVIEW_H = 360;

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      const shorter = Math.min(img.naturalWidth, img.naturalHeight);
      const initialSize = Math.round(shorter * 0.9);
      setCrop({
        x: Math.round((img.naturalWidth - initialSize) / 2),
        y: Math.round((img.naturalHeight - initialSize) / 2),
        size: initialSize,
      });
      setImgLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

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

  // Rysowanie canvas podglądu z okrągłą maską
  useEffect(() => {
    if (!imgLoaded || !previewRef.current || !imgRef.current) return;
    const canvas = previewRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = imgRef.current;

    canvas.width = PREVIEW_W;
    canvas.height = PREVIEW_H;

    const scale = getScale();
    const { ox, oy } = getOffset();
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;

    ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);
    ctx.fillStyle = "#1e1b18";
    ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);

    ctx.save();
    ctx.translate(PREVIEW_W / 2, PREVIEW_H / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-PREVIEW_W / 2, -PREVIEW_H / 2);
    ctx.drawImage(img, ox, oy, drawW, drawH);
    ctx.restore();

    // Pozycja kadru na canvasie
    const cx = ox + crop.x * scale;
    const cy = oy + crop.y * scale;
    const cs = crop.size * scale;

    // Przyciemnienie poza kadrem
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, PREVIEW_W, cy);
    ctx.fillRect(0, cy + cs, PREVIEW_W, PREVIEW_H - cy - cs);
    ctx.fillRect(0, cy, cx, cs);
    ctx.fillRect(cx + cs, cy, PREVIEW_W - cx - cs, cs);

    // Krawędź kadru kwadratowego (subtelna)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(cx, cy, cs, cs);

    // Okrąg podglądu medalionu (jak wygląda ikona na stronie głównej AURA)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx + cs / 2, cy + cs / 2, cs / 2, 0, 2 * Math.PI);
    ctx.strokeStyle = "#C5A069";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;
    ctx.stroke();
    ctx.restore();

    // Uchwyt zmiany rozmiaru w prawym dolnym rogu
    const hs = 12;
    ctx.fillStyle = "#C5A069";
    ctx.fillRect(cx + cs - hs, cy + cs - hs, hs, hs);
  }, [imgLoaded, crop, zoom, rotation]);

  const canvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imgRef.current) return;
    const rect = previewRef.current!.getBoundingClientRect();
    const scale = getScale();
    const { ox, oy } = getOffset();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cx = ox + crop.x * scale;
    const cy = oy + crop.y * scale;
    const cs = crop.size * scale;

    if (mx >= cx + cs - 18 && my >= cy + cs - 18) {
      setDragging("resize");
    } else if (mx >= cx && mx <= cx + cs && my >= cy && my <= cy + cs) {
      setDragging("crop");
    }
    setDragStart({ mx, my, cx: crop.x, cy: crop.y, cs: crop.size });
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
      const nx = Math.max(0, Math.min(img.naturalWidth - dragStart.cs, dragStart.cx + dx));
      const ny = Math.max(0, Math.min(img.naturalHeight - dragStart.cs, dragStart.cy + dy));
      setCrop((c) => ({ ...c, x: Math.round(nx), y: Math.round(ny) }));
    } else if (dragging === "resize") {
      const delta = Math.max(dx, dy);
      const maxPossible = Math.min(img.naturalWidth - dragStart.cx, img.naturalHeight - dragStart.cy);
      const ns = Math.max(80, Math.min(maxPossible, dragStart.cs + delta));
      setCrop((c) => ({ ...c, size: Math.round(ns) }));
    }
  };

  const handleConfirm = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const outputCanvas = canvasRef.current!;
    // Rozmiar wyjściowy medalionu (500x500 dla wysokiej ostrości)
    const outSize = Math.min(600, Math.max(300, crop.size));
    outputCanvas.width = outSize;
    outputCanvas.height = outSize;
    const ctx = outputCanvas.getContext("2d")!;

    ctx.save();
    if (rotation !== 0) {
      ctx.translate(outSize / 2, outSize / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-outSize / 2, -outSize / 2);
    }
    ctx.drawImage(img, crop.x, crop.y, crop.size, crop.size, 0, 0, outSize, outSize);
    ctx.restore();

    const dataUrl = outputCanvas.toDataURL("image/jpeg", 0.92);
    onConfirm(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-[#FAF6F1] border border-[#EADFD5] rounded-xs shadow-2xl max-w-lg w-full p-6 text-[#241D1B] space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#EADFD5] pb-3">
          <div>
            <h3 className="font-serif text-lg text-[#241D1B] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5A069]" />
              Kadrowanie Ikony Kategorii (Medalion 1:1)
            </h3>
            <p className="text-[11px] text-[#857670]">
              {categoryName ? `Dopasuj kadr dla: ${categoryName}` : "Złoty okrąg pokazuje jak zdjęcie będzie wyglądać w butiku"}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-[#857670] hover:text-[#241D1B] hover:bg-black/5 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Podgląd Canvas */}
        <div className="flex justify-center">
          <div className="relative border-2 border-[#C5A069] rounded-xs overflow-hidden shadow-inner bg-[#1a1a1a]">
            <canvas
              ref={previewRef}
              onMouseDown={canvasMouseDown}
              onMouseMove={canvasMouseMove}
              onMouseUp={() => setDragging(null)}
              onMouseLeave={() => setDragging(null)}
              className="cursor-move select-none"
              style={{ width: PREVIEW_W, height: PREVIEW_H }}
            />
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* Pasek narzędzi zoom / obrót */}
        <div className="flex items-center justify-between gap-3 text-xs text-[#857670] bg-white p-3 border border-[#EADFD5] rounded-xs">
          <div className="flex items-center gap-2 flex-1">
            <ZoomOut className="w-4 h-4 text-[#857670]" />
            <input
              type="range"
              min="0.8"
              max="2.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-[#C5A069] cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-[#857670]" />
            <span className="w-10 text-right font-mono text-[11px]">{Math.round(zoom * 100)}%</span>
          </div>

          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="px-3 py-1.5 bg-[#FAF6F1] hover:bg-[#EADFD5] text-[#241D1B] border border-[#EADFD5] rounded-xs flex items-center gap-1.5 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#C5A069]" />
            <span>Obróć 90°</span>
          </button>
        </div>

        <p className="text-[11px] text-[#857670] text-center">
          💡 Przeciągaj myszką lub palcem po kadrze, aby go przemieścić. Prawy dolny narożnik zmienia wielkość kadru.
        </p>

        {/* Przyciski zatwierdzenia / anulowania */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 border border-[#EADFD5] hover:bg-white text-xs uppercase tracking-wider text-[#857670] transition-colors rounded-xs"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-wider font-semibold transition-colors rounded-xs flex items-center justify-center gap-2 shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>Zatwierdź Kadr</span>
          </button>
        </div>
      </div>
    </div>
  );
}

