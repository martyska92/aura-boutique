"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Monitor,
  Tablet,
  Smartphone,
  Save,
  Send,
  RotateCcw,
  Undo2,
  Redo2,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Copy,
  Layers,
  ArrowUp,
  ArrowDown,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Italic,
  Sliders,
  Type,
  Square,
  Check,
  AlertCircle,
  HelpCircle,
  Upload,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import {
  VisualBannerConfig,
  BannerTextElement,
  BannerButtonElement,
  DeviceViewport,
} from "@/lib/types";
import { BannerRenderer } from "@/components/home/BannerRenderer";
import { getDefaultBannerConfig } from "@/lib/banner-defaults";

const FONT_OPTIONS = [
  { value: "serif", label: "Elegancki Serif (Georgia / Caslon)" },
  { value: "playfair", label: "Playfair Display (Luksusowy Serif)" },
  { value: "cormorant", label: "Cormorant Garamond (Klasyczny)" },
  { value: "montserrat", label: "Montserrat (Nowoczesny)" },
  { value: "sans", label: "System Sans-Serif (Czysty)" },
  { value: "script", label: "Script / Odręczny (Akcent)" },
];

export function BannerVisualEditor() {
  const [config, setConfig] = useState<VisualBannerConfig>(getDefaultBannerConfig());
  const [publishedConfig, setPublishedConfig] = useState<VisualBannerConfig | null>(null);
  const [viewport, setViewport] = useState<DeviceViewport>("desktop");
  const [selectedId, setSelectedId] = useState<string | null>("text-headline");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"element" | "image" | "overlay">("element");

  // Historia akcji (Undo / Redo)
  const [history, setHistory] = useState<VisualBannerConfig[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Stany ładowania i zapisu
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Linie pomocnicze (Snap guidelines)
  const [snapGuideX, setSnapGuideX] = useState<number | null>(null);
  const [snapGuideY, setSnapGuideY] = useState<number | null>(null);

  // Wgrywanie i podmiana zdjęcia banera
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerUploadError, setBannerUploadError] = useState<string | null>(null);
  const [bannerUploadSuccess, setBannerUploadSuccess] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const handleBannerFileUpload = async (file: File) => {
    setBannerUploadError(null);
    setBannerUploadSuccess(null);

    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    const isMimeOk =
      allowedMimes.includes(file.type?.toLowerCase() || "") ||
      ["jpg", "jpeg", "png", "webp"].includes(ext || "");

    if (!isMimeOk) {
      setBannerUploadError("Nieobsługiwany format pliku. Wybierz zdjęcie JPG, PNG lub WebP.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setBannerUploadError(`Plik jest zbyt duży (${sizeMB} MB). Maksymalny rozmiar to 10 MB.`);
      return;
    }

    setIsUploadingBanner(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/banner/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas wgrywania pliku.");
      }

      if (!data.url) {
        throw new Error("Serwer nie zwrócił poprawnego adresu zdjęcia.");
      }

      // Aktualizacja tła banera w szkicu
      setConfig((prev) => {
        const next = { ...prev, imageUrl: data.url };
        pushHistory(next);
        return next;
      });

      setBannerUploadSuccess(data.message || "Zdjęcie banera zostało pomyślnie zaktualizowane.");
      setTimeout(() => setBannerUploadSuccess(null), 4000);
    } catch (err: any) {
      setBannerUploadError(err.message || "Nie udało się przesłać zdjęcia.");
    } finally {
      setIsUploadingBanner(false);
      if (bannerFileInputRef.current) {
        bannerFileInputRef.current.value = "";
      }
    }
  };

  const handleUseDefaultCleanPhoto = () => {
    setBannerUploadError(null);
    const cleanUrl = `/images/hero/aura-hero-boutique-clean.jpg?v=${Date.now()}`;
    setConfig((prev) => {
      const next = { ...prev, imageUrl: cleanUrl };
      pushHistory(next);
      return next;
    });
    setBannerUploadSuccess("Ustawiono oryginalne czyste zdjęcie butiku AURA (bez napisów).");
    setTimeout(() => setBannerUploadSuccess(null), 3500);
  };

  // Przeciąganie i zmiana rozmiaru
  const bannerContainerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    isDragging: boolean;
    dragType: "move" | "resize-left" | "resize-right";
    elementId: string;
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    initWidth: number;
    bannerRect: DOMRect;
  } | null>(null);

  // Pobranie konfiguracji z serwera
  useEffect(() => {
    fetch("/api/admin/banner")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.draft) {
          setConfig(data.draft);
          setPublishedConfig(data.published || null);
          setHistory([data.draft]);
          setHistoryIndex(0);
        }
      })
      .catch((err) => {
        console.error("Błąd ładowania banera:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Pomocnicza funkcja dodająca stan do historii Undo/Redo
  const pushHistory = useCallback(
    (newConfig: VisualBannerConfig) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        next.push(JSON.parse(JSON.stringify(newConfig)));
        if (next.length > 25) next.shift();
        return next;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 24));
    },
    [historyIndex]
  );

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setConfig(JSON.parse(JSON.stringify(prev)));
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setConfig(JSON.parse(JSON.stringify(next)));
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Aktualizacja zaznaczonego elementu
  const updateSelectedTextElement = (
    updater: (prevEl: BannerTextElement) => BannerTextElement
  ) => {
    if (!selectedId) return;
    setConfig((prev) => {
      const next = {
        ...prev,
        textElements: prev.textElements.map((el) =>
          el.id === selectedId ? updater(el) : el
        ),
      };
      pushHistory(next);
      return next;
    });
  };

  const updateSelectedButtonElement = (
    updater: (prevBtn: BannerButtonElement) => BannerButtonElement
  ) => {
    if (!config.buttonElement) return;
    setConfig((prev) => {
      const next = {
        ...prev,
        buttonElement: updater(prev.buttonElement!),
      };
      pushHistory(next);
      return next;
    });
  };

  // Rozpoczęcie przeciągania elementu
  const handlePointerDownElement = (
    id: string,
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (isPreviewMode) return;
    setSelectedId(id);
    setActiveTab("element");

    if (!bannerContainerRef.current) return;
    const bannerRect = bannerContainerRef.current.getBoundingClientRect();

    let initX = 50;
    let initY = 50;
    let initWidth = 60;

    if (id === config.buttonElement?.id) {
      const p = config.buttonElement[viewport] || config.buttonElement.desktop;
      initX = p.x;
      initY = p.y;
    } else {
      const el = config.textElements.find((t) => t.id === id);
      if (el) {
        const p = el[viewport] || el.desktop;
        initX = p?.x ?? 50;
        initY = p?.y ?? 50;
        initWidth = p?.width ?? 60;
      }
    }

    dragRef.current = {
      isDragging: true,
      dragType: "move",
      elementId: id,
      startX: e.clientX,
      startY: e.clientY,
      initX,
      initY,
      initWidth,
      bannerRect,
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Rozpoczęcie zmiany szerokości
  const handleResizeHandlePointerDown = (
    id: string,
    handle: "left" | "right",
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (isPreviewMode) return;
    e.stopPropagation();
    setSelectedId(id);

    if (!bannerContainerRef.current) return;
    const bannerRect = bannerContainerRef.current.getBoundingClientRect();
    const el = config.textElements.find((t) => t.id === id);
    if (!el) return;

    const p = el[viewport] || el.desktop;

    dragRef.current = {
      isDragging: true,
      dragType: handle === "left" ? "resize-left" : "resize-right",
      elementId: id,
      startX: e.clientX,
      startY: e.clientY,
      initX: p?.x ?? 50,
      initY: p?.y ?? 50,
      initWidth: p?.width ?? 60,
      bannerRect,
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Ruch wskaźnika (mysz / touch)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || !drag.isDragging) return;

    const deltaX = e.clientX - drag.startX;
    const deltaY = e.clientY - drag.startY;

    const deltaPercentX = (deltaX / drag.bannerRect.width) * 100;
    const deltaPercentY = (deltaY / drag.bannerRect.height) * 100;

    if (drag.dragType === "move") {
      let newX = Math.round((drag.initX + deltaPercentX) * 10) / 10;
      let newY = Math.round((drag.initY + deltaPercentY) * 10) / 10;

      // Przyciąganie do środka (Snap to 50%)
      if (Math.abs(newX - 50) < 1.8) {
        newX = 50;
        setSnapGuideX(50);
      } else {
        setSnapGuideX(null);
      }

      if (Math.abs(newY - 50) < 1.8) {
        newY = 50;
        setSnapGuideY(50);
      } else {
        setSnapGuideY(null);
      }

      // Ograniczenie granic (nie pozwala przeciągnąć poza baner)
      newX = Math.max(5, Math.min(95, newX));
      newY = Math.max(5, Math.min(95, newY));

      setConfig((prev) => {
        if (drag.elementId === prev.buttonElement?.id && prev.buttonElement) {
          const btn = prev.buttonElement;
          return {
            ...prev,
            buttonElement: {
              ...btn,
              [viewport]: {
                ...btn[viewport],
                x: newX,
                y: newY,
              },
            },
          };
        } else {
          return {
            ...prev,
            textElements: prev.textElements.map((el) => {
              if (el.id !== drag.elementId) return el;
              return {
                ...el,
                [viewport]: {
                  ...el[viewport],
                  x: newX,
                  y: newY,
                },
              };
            }),
          };
        }
      });
    } else if (drag.dragType === "resize-left" || drag.dragType === "resize-right") {
      const factor = drag.dragType === "resize-right" ? 2 : -2;
      let newWidth = Math.round((drag.initWidth + deltaPercentX * factor) * 10) / 10;
      newWidth = Math.max(15, Math.min(96, newWidth));

      setConfig((prev) => ({
        ...prev,
        textElements: prev.textElements.map((el) => {
          if (el.id !== drag.elementId) return el;
          return {
            ...el,
            [viewport]: {
              ...el[viewport],
              width: newWidth,
            },
          };
        }),
      }));
    }
  };

  // Koniec przeciągania
  const handlePointerUp = () => {
    if (dragRef.current?.isDragging) {
      dragRef.current = null;
      setSnapGuideX(null);
      setSnapGuideY(null);
      pushHistory(config);
    }
  };

  // Obsługa strzałek klawiatury dla precyzyjnego pozycjonowania
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPreviewMode || !selectedId) return;
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const step = e.shiftKey ? 3 : 0.5;

      let dx = 0;
      let dy = 0;

      if (e.key === "ArrowUp") dy = -step;
      else if (e.key === "ArrowDown") dy = step;
      else if (e.key === "ArrowLeft") dx = -step;
      else if (e.key === "ArrowRight") dx = step;
      else return;

      e.preventDefault();

      setConfig((prev) => {
        if (selectedId === prev.buttonElement?.id && prev.buttonElement) {
          const btn = prev.buttonElement;
          const p = btn[viewport] || btn.desktop;
          return {
            ...prev,
            buttonElement: {
              ...btn,
              [viewport]: {
                ...p,
                x: Math.max(5, Math.min(95, Math.round((p.x + dx) * 10) / 10)),
                y: Math.max(5, Math.min(95, Math.round((p.y + dy) * 10) / 10)),
              },
            },
          };
        } else {
          return {
            ...prev,
            textElements: prev.textElements.map((el) => {
              if (el.id !== selectedId) return el;
              const p = el[viewport] || el.desktop;
              return {
                ...el,
                [viewport]: {
                  ...p,
                  x: Math.max(5, Math.min(95, Math.round((p.x + dx) * 10) / 10)),
                  y: Math.max(5, Math.min(95, Math.round((p.y + dy) * 10) / 10)),
                },
              };
            }),
          };
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, viewport, isPreviewMode]);

  // Dodawanie nowego tekstu
  const handleAddTextElement = () => {
    const newId = `text-custom-${Date.now()}`;
    const newEl: BannerTextElement = {
      id: newId,
      type: "text",
      label: "Nowy napis",
      text: "Wpisz swój tekst tutaj",
      fontFamily: "serif",
      fontWeight: 500,
      italic: false,
      color: "#241D1B",
      letterSpacing: 0,
      lineHeight: 1.3,
      opacity: 1,
      zIndex: 20 + config.textElements.length,
      hasShadow: false,
      hasStroke: false,
      hasBackground: true,
      backgroundColor: "#FFFFFF",
      backgroundOpacity: 0.8,
      backgroundPadding: 10,
      borderRadius: 10,
      desktop: {
        x: 50,
        y: 50,
        width: 50,
        fontSize: 22,
        textAlign: "center",
        visible: true,
      },
      tablet: {
        x: 50,
        y: 50,
        width: 65,
        fontSize: 18,
        textAlign: "center",
        visible: true,
      },
      mobile: {
        x: 50,
        y: 50,
        width: 80,
        fontSize: 15,
        textAlign: "center",
        visible: true,
      },
    };

    setConfig((prev) => {
      const next = {
        ...prev,
        textElements: [...prev.textElements, newEl],
      };
      pushHistory(next);
      return next;
    });
    setSelectedId(newId);
    setActiveTab("element");
  };

  // Duplikowanie zaznaczonego elementu
  const handleDuplicateSelected = () => {
    if (!selectedId) return;
    const target = config.textElements.find((el) => el.id === selectedId);
    if (!target) return;

    const dupId = `text-${Date.now()}`;
    const duplicated: BannerTextElement = {
      ...JSON.parse(JSON.stringify(target)),
      id: dupId,
      label: `${target.label} (kopia)`,
      desktop: { ...target.desktop, y: Math.min(90, target.desktop.y + 6) },
      tablet: target.tablet ? { ...target.tablet, y: Math.min(90, target.tablet.y + 6) } : undefined,
      mobile: target.mobile ? { ...target.mobile, y: Math.min(90, target.mobile.y + 6) } : undefined,
      zIndex: target.zIndex + 1,
    };

    setConfig((prev) => {
      const next = {
        ...prev,
        textElements: [...prev.textElements, duplicated],
      };
      pushHistory(next);
      return next;
    });
    setSelectedId(dupId);
  };

  // Usuwanie zaznaczonego tekstu
  const handleDeleteSelected = () => {
    if (!selectedId || selectedId === config.buttonElement?.id) return;
    setConfig((prev) => {
      const next = {
        ...prev,
        textElements: prev.textElements.filter((el) => el.id !== selectedId),
      };
      pushHistory(next);
      return next;
    });
    setSelectedId(config.textElements[0]?.id || config.buttonElement?.id || null);
  };

  // Przełączanie widoczności elementu (Widoczny / Ukryty)
  const handleToggleVisibility = (id: string, targetViewport?: DeviceViewport) => {
    const vp = targetViewport || viewport;

    setConfig((prev) => {
      let next: VisualBannerConfig;

      if (id === prev.buttonElement?.id && prev.buttonElement) {
        const btn = prev.buttonElement;
        const currentVpProps = btn[vp] || btn.desktop;
        const currentVis = currentVpProps.visible !== false && btn.visible !== false;
        const newVisible = !currentVis;

        next = {
          ...prev,
          buttonElement: {
            ...btn,
            visible: newVisible ? true : (btn.desktop?.visible || btn.tablet?.visible || btn.mobile?.visible ? true : false),
            [vp]: {
              ...currentVpProps,
              visible: newVisible,
            },
          },
        };
      } else {
        next = {
          ...prev,
          textElements: prev.textElements.map((el) => {
            if (el.id !== id) return el;
            const currentVpProps = el[vp] || el.desktop;
            const newVisible = currentVpProps.visible === false ? true : false;

            return {
              ...el,
              [vp]: {
                ...currentVpProps,
                visible: newVisible,
              },
            };
          }),
        };
      }

      pushHistory(next);
      return next;
    });
  };

  // Ustawienie widoczności na wszystkich urządzeniach jednocześnie
  const handleSetAllDevicesVisibility = (id: string, visible: boolean) => {
    setConfig((prev) => {
      let next: VisualBannerConfig;

      if (id === prev.buttonElement?.id && prev.buttonElement) {
        const btn = prev.buttonElement;
        next = {
          ...prev,
          buttonElement: {
            ...btn,
            visible: visible,
            desktop: { ...btn.desktop, visible },
            tablet: btn.tablet ? { ...btn.tablet, visible } : { ...btn.desktop, visible },
            mobile: btn.mobile ? { ...btn.mobile, visible } : { ...btn.desktop, visible },
          },
        };
      } else {
        next = {
          ...prev,
          textElements: prev.textElements.map((el) => {
            if (el.id !== id) return el;
            return {
              ...el,
              desktop: { ...el.desktop, visible },
              tablet: el.tablet ? { ...el.tablet, visible } : { ...el.desktop, visible },
              mobile: el.mobile ? { ...el.mobile, visible } : { ...el.desktop, visible },
            };
          }),
        };
      }

      pushHistory(next);
      return next;
    });
  };

  // Zapis szkicu do bazy
  const handleSaveDraft = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save-draft", config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd zapisu szkicu");

      setStatusMessage({ text: "Szkic banera został zapisany!", type: "success" });
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Publikacja na stronę główną
  const handlePublish = async () => {
    if (!window.confirm("Czy na pewno chcesz opublikować ten układ banera na stronie głównej? Zmiany będą natychmiast widoczne dla wszystkich klientek.")) {
      return;
    }
    setPublishing(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd publikacji");

      setPublishedConfig(data.published);
      setStatusMessage({ text: "Baner został pomyślnie opublikowany na stronie głównej!", type: "success" });
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: "error" });
    } finally {
      setPublishing(false);
    }
  };

  // Przywrócenie ostatnio opublikowanej wersji
  const handleRevert = async () => {
    if (!window.confirm("Czy na pewno chcesz cofnąć robocze zmiany i przywrócić ostatnio opublikowany baner?")) {
      return;
    }
    setReverting(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revert" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd przywracania");

      setConfig(data.draft);
      pushHistory(data.draft);
      setStatusMessage({ text: "Przywrócono opublikowaną wersję banera.", type: "info" });
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: "error" });
    } finally {
      setReverting(false);
    }
  };

  // Zaznaczony element (tekst lub przycisk)
  const selectedText = config.textElements.find((el) => el.id === selectedId);
  const isButtonSelected = selectedId === config.buttonElement?.id;
  const selectedButton = isButtonSelected ? config.buttonElement : null;

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#857670]">
        Ładowanie wizualnego edytora banera...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ─── PASEK NARZĘDZIOWY GÓRNY (Główne akcje, Viewporty, Zapis/Publikacja) ─── */}
      <div className="bg-white border border-[#EADFD5] rounded-xs p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Przełączniki widoku (Desktop / Tablet / Mobile) */}
        <div className="flex items-center gap-1 bg-[#FAF6F1] p-1 rounded border border-[#EADFD5]">
          <button
            type="button"
            onClick={() => setViewport("desktop")}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewport === "desktop"
                ? "bg-[#C5A069] text-white shadow-xs"
                : "text-[#6E6259] hover:text-[#241D1B]"
            }`}
            title="Widok komputer (Desktop)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Komputer</span>
          </button>
          <button
            type="button"
            onClick={() => setViewport("tablet")}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewport === "tablet"
                ? "bg-[#C5A069] text-white shadow-xs"
                : "text-[#6E6259] hover:text-[#241D1B]"
            }`}
            title="Widok tablet"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => setViewport("mobile")}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewport === "mobile"
                ? "bg-[#C5A069] text-white shadow-xs"
                : "text-[#6E6259] hover:text-[#241D1B]"
            }`}
            title="Widok telefon (Mobile)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Telefon</span>
          </button>
        </div>

        {/* Cofnij / Ponów / Podgląd */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2 border border-[#EADFD5] rounded hover:bg-[#FAF6F1] disabled:opacity-30 text-[#4A3F3B] transition-colors"
            title="Cofnij (Undo)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 border border-[#EADFD5] rounded hover:bg-[#FAF6F1] disabled:opacity-30 text-[#4A3F3B] transition-colors"
            title="Ponów (Redo)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`px-3 py-1.5 rounded border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isPreviewMode
                ? "bg-[#241D1B] text-white border-[#241D1B]"
                : "border-[#EADFD5] text-[#4A3F3B] hover:bg-[#FAF6F1]"
            }`}
            title="Przełącz tryb podglądu rzeczywistego"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isPreviewMode ? "Wróć do edycji" : "Podgląd"}</span>
          </button>
        </div>

        {/* Główne przyciski zapisu */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRevert}
            disabled={reverting}
            className="px-3 py-1.5 border border-[#EADFD5] hover:bg-[#FAF6F1] text-[#6E6259] hover:text-[#241D1B] rounded text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Przywróć ostatnio opublikowaną wersję banera"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Przywróć wersję</span>
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="px-3.5 py-1.5 bg-white border border-[#C5A069] text-[#8C6B38] hover:bg-[#FAF6F1] rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Zapisywanie..." : "Zapisz szkic"}</span>
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="px-4 py-1.5 bg-[#C5A069] hover:bg-[#AF884F] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{publishing ? "Publikowanie..." : "Opublikuj"}</span>
          </button>
        </div>
      </div>

      {/* Komunikat o statusie */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xs text-xs flex items-center justify-between gap-2 animate-in fade-in ${
            statusMessage.type === "success"
              ? "bg-[#EDF7ED] text-[#1E4620] border border-[#C8E6C9]"
              : statusMessage.type === "error"
              ? "bg-[#FDEDED] text-[#5F2120] border border-[#FFCDD2]"
              : "bg-[#EBF5FB] text-[#1B4F72] border border-[#AED6F1]"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#A84B4B]" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-[10px] uppercase font-bold hover:underline"
          >
            Zamknij
          </button>
        </div>
      )}

      {/* ─── GŁÓWNY OBSZAR ROBOCZY: KANWA EDYCJI + PANEL BOCZNY ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-4 items-start">
        {/* LEWA STRONA: Kanwa podglądu z przeciąganiem */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6E6259] px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A069]" />
              Widok: <strong className="text-[#241D1B] uppercase">{viewport}</strong>
              <span className="text-[11px] text-[#857670]">
                ({viewport === "desktop" ? "1024px+" : viewport === "tablet" ? "768px" : "375px"})
              </span>
            </span>
            <span className="text-[11px] hidden sm:inline">
              Kliknij element i przeciągnij myszką lub dotykiem • Użyj strzałek klawiatury
            </span>
          </div>

          {/* Informacja jeśli zaznaczony element jest ukryty na aktywnym urządzeniu */}
          {(() => {
            const isTextHidden = selectedText && selectedText[viewport]?.visible === false;
            const isBtnHidden = selectedButton && (selectedButton.visible === false || selectedButton[viewport]?.visible === false);
            if (!isTextHidden && !isBtnHidden) return null;

            const name = selectedText?.label || selectedText?.text || selectedButton?.text || "Element";
            const vpName = viewport === "desktop" ? "komputerach" : viewport === "tablet" ? "tabletach" : "telefonach";

            return (
              <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded text-xs flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Zaznaczony element „<strong>{name.length > 30 ? name.slice(0, 30) + "..." : name}</strong>” jest obecnie <strong>ukryty na {vpName}</strong> i nie wyświetla się w podglądzie.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => selectedId && handleToggleVisibility(selectedId)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Pokaż na tym widoku</span>
                </button>
              </div>
            );
          })()}

          <div
            className={`bg-[#E6DDD3] p-4 sm:p-6 rounded-xs border border-[#D5C7B8] flex items-center justify-center overflow-hidden min-h-[460px]`}
          >
            {/* Kontener symulujący rozmiar urządzenia */}
            <div
              ref={bannerContainerRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className={`relative shadow-2xl transition-all duration-300 rounded-sm overflow-hidden ${
                viewport === "mobile"
                  ? "w-[375px] max-w-full"
                  : viewport === "tablet"
                  ? "w-[720px] max-w-full"
                  : "w-full max-w-[1080px]"
              }`}
            >
              {/* Linie pomocnicze (Snap Guides) */}
              {snapGuideX !== null && (
                <div
                  className="absolute top-0 bottom-0 w-[1.5px] bg-[#C5A069] z-50 pointer-events-none"
                  style={{ left: `${snapGuideX}%` }}
                />
              )}
              {snapGuideY !== null && (
                <div
                  className="absolute left-0 right-0 h-[1.5px] bg-[#C5A069] z-50 pointer-events-none"
                  style={{ top: `${snapGuideY}%` }}
                />
              )}

              {/* Rzeczywisty komponent renderujący baner */}
              <BannerRenderer
                config={config}
                viewport={viewport}
                interactive={!isPreviewMode}
                selectedId={selectedId}
                onSelectId={(id) => {
                  setSelectedId(id);
                  if (id) setActiveTab("element");
                }}
                onPointerDownElement={handlePointerDownElement}
                onResizeHandlePointerDown={handleResizeHandlePointerDown}
              />
            </div>
          </div>
        </div>

        {/* PRAWA STRONA: Panel boczny ustawień i właściwości */}
        <div className="bg-white border border-[#EADFD5] rounded-xs shadow-xs p-4 space-y-4">
          {/* Zakładki panelu bocznego */}
          <div className="flex border-b border-[#EADFD5] text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("element")}
              className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                activeTab === "element"
                  ? "border-[#C5A069] text-[#241D1B]"
                  : "border-transparent text-[#857670] hover:text-[#241D1B]"
              }`}
            >
              Element
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("image")}
              className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                activeTab === "image"
                  ? "border-[#C5A069] text-[#241D1B]"
                  : "border-transparent text-[#857670] hover:text-[#241D1B]"
              }`}
            >
              Zdjęcie
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("overlay")}
              className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                activeTab === "overlay"
                  ? "border-[#C5A069] text-[#241D1B]"
                  : "border-transparent text-[#857670] hover:text-[#241D1B]"
              }`}
            >
              Nakładka
            </button>
          </div>

          {/* ─── ZAKŁADKA 1: ELEMENT (Tekst lub Przycisk) ─── */}
          {activeTab === "element" && (
            <div className="space-y-4 text-xs">
              {/* Lista warstw i dodawanie */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#241D1B] uppercase tracking-wider text-[11px]">
                    Elementy na banerze:
                  </span>
                  <button
                    type="button"
                    onClick={handleAddTextElement}
                    className="text-[#C5A069] hover:text-[#AF884F] font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Dodaj napis</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto p-1.5 bg-[#FAF6F1] rounded border border-[#EADFD5]">
                  {config.textElements.map((el, idx) => {
                    const isVisibleOnCurrent = el[viewport]?.visible !== false;
                    const isSelected = selectedId === el.id;

                    return (
                      <div
                        key={el.id}
                        onClick={() => setSelectedId(el.id)}
                        className={`p-2 rounded flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-white border border-[#C5A069] shadow-xs text-[#241D1B] font-semibold ring-1 ring-[#C5A069]/30"
                            : "hover:bg-white/70 text-[#54463F] border border-transparent"
                        } ${!isVisibleOnCurrent ? "bg-[#F3EFEA]/80 text-[#857670]" : ""}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Type className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-[#C5A069]" : "text-[#857670]"}`} />
                          <span className={`truncate text-xs ${!isVisibleOnCurrent ? "italic line-through opacity-75" : ""}`}>
                            {el.text || el.label || `Tekst #${idx + 1}`}
                          </span>
                        </div>

                        {/* Przełącznik widoczności z ikoną oka */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleToggleVisibility(el.id);
                          }}
                          className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-2xs ${
                            isVisibleOnCurrent
                              ? "bg-[#FAF2EB] text-[#8C6B38] border border-[#DFCA9B] hover:bg-[#F3E7DC]"
                              : "bg-white text-[#786D65] border border-[#D5C7B8] hover:bg-[#EAE4DC]"
                          }`}
                          title={
                            isVisibleOnCurrent
                              ? `Widoczny na: ${viewport === "desktop" ? "Komputer" : viewport === "tablet" ? "Tablet" : "Telefon"} (Kliknij, aby ukryć)`
                              : `Ukryty na: ${viewport === "desktop" ? "Komputer" : viewport === "tablet" ? "Tablet" : "Telefon"} (Kliknij, aby pokazać)`
                          }
                          aria-label={isVisibleOnCurrent ? "Ukryj element" : "Pokaż element"}
                        >
                          {isVisibleOnCurrent ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-[#C5A069]" />
                              <span>Widoczny</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-[#857670]" />
                              <span>Ukryty</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}

                  {/* Przycisk CTA */}
                  {config.buttonElement && (() => {
                    const btn = config.buttonElement;
                    const isBtnVisible = btn.visible !== false && btn[viewport]?.visible !== false;
                    const isSelected = selectedId === btn.id;

                    return (
                      <div
                        onClick={() => setSelectedId(btn.id)}
                        className={`p-2 rounded flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-white border border-[#C5A069] shadow-xs text-[#241D1B] font-semibold ring-1 ring-[#C5A069]/30"
                            : "hover:bg-white/70 text-[#54463F] border border-transparent"
                        } ${!isBtnVisible ? "bg-[#F3EFEA]/80 text-[#857670]" : ""}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Square className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-[#C5A069]" : "text-[#857670]"}`} />
                          <span className={`truncate text-xs ${!isBtnVisible ? "italic line-through opacity-75" : ""}`}>
                            {btn.text || "Przycisk"} (Przycisk)
                          </span>
                        </div>

                        {/* Przełącznik widoczności przycisku */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleToggleVisibility(btn.id);
                          }}
                          className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-2xs ${
                            isBtnVisible
                              ? "bg-[#FAF2EB] text-[#8C6B38] border border-[#DFCA9B] hover:bg-[#F3E7DC]"
                              : "bg-white text-[#786D65] border border-[#D5C7B8] hover:bg-[#EAE4DC]"
                          }`}
                          title={
                            isBtnVisible
                              ? `Widoczny na: ${viewport === "desktop" ? "Komputer" : viewport === "tablet" ? "Tablet" : "Telefon"} (Kliknij, aby ukryć)`
                              : `Ukryty na: ${viewport === "desktop" ? "Komputer" : viewport === "tablet" ? "Tablet" : "Telefon"} (Kliknij, aby pokazać)`
                          }
                          aria-label={isBtnVisible ? "Ukryj przycisk" : "Pokaż przycisk"}
                        >
                          {isBtnVisible ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-[#C5A069]" />
                              <span>Widoczny</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-[#857670]" />
                              <span>Ukryty</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* EDYCJA TEKSTU */}
              {selectedText && (
                <div className="space-y-3.5 pt-2 border-t border-[#EADFD5]">
                  {/* SEKCJA: WIDOCZNOŚĆ ELEMENTU NA URZĄDZENIACH */}
                  <div className="p-3 bg-[#FAF6F1] border border-[#EADFD5] rounded space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#241D1B] flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-[#C5A069]" />
                        <span>Widoczność na urządzeniach</span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          selectedText[viewport]?.visible !== false
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {selectedText[viewport]?.visible !== false ? "Widoczny na tym widoku" : "Ukryty na tym widoku"}
                      </span>
                    </div>

                    {/* Przełączniki dla komputera, tabletu i telefonu */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["desktop", "tablet", "mobile"] as DeviceViewport[]).map((vp) => {
                        const isVpVisible = selectedText[vp]?.visible !== false;
                        const label = vp === "desktop" ? "Komputer" : vp === "tablet" ? "Tablet" : "Telefon";

                        return (
                          <button
                            key={vp}
                            type="button"
                            onClick={() => handleToggleVisibility(selectedText.id, vp)}
                            className={`p-2 rounded border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                              isVpVisible
                                ? "bg-white border-[#C5A069] text-[#241D1B] shadow-2xs hover:bg-[#FAF2EB]"
                                : "bg-[#F3EFEA] border-[#D5C7B8] text-[#857670] hover:bg-[#EAE4DC]"
                            }`}
                          >
                            <span className="text-[10px] uppercase font-bold text-[#6E6259]">{label}</span>
                            <div className="flex items-center gap-1 text-[11px] font-semibold">
                              {isVpVisible ? (
                                <>
                                  <Eye className="w-3.5 h-3.5 text-[#C5A069]" />
                                  <span>Widoczny</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5 text-[#857670]" />
                                  <span>Ukryty</span>
                                </>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Przyciski: Zastosuj na wszystkich urządzeniach */}
                    <div className="flex items-center gap-2 pt-1 border-t border-[#EADFD5]/60">
                      <button
                        type="button"
                        onClick={() => handleSetAllDevicesVisibility(selectedText.id, true)}
                        className="flex-1 py-1.5 px-2 bg-white border border-[#C5A069] text-[#8C6B38] hover:bg-[#FAF2EB] rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#C5A069]" />
                        <span>Pokaż na wszystkich</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetAllDevicesVisibility(selectedText.id, false)}
                        className="flex-1 py-1.5 px-2 bg-white border border-[#D5C7B8] text-[#786D65] hover:bg-[#F3EFEA] rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <EyeOff className="w-3.5 h-3.5 text-[#857670]" />
                        <span>Ukryj na wszystkich</span>
                      </button>
                    </div>
                  </div>

                  {/* Treść */}
                  <div className="space-y-1">
                    <label className="font-semibold text-[#241D1B] block">Treść tekstu:</label>
                    <textarea
                      rows={2}
                      value={selectedText.text}
                      onChange={(e) =>
                        updateSelectedTextElement((prev) => ({
                          ...prev,
                          text: e.target.value,
                        }))
                      }
                      className="w-full p-2 border border-[#EADFD5] rounded bg-white text-[#241D1B] font-medium focus:outline-none focus:border-[#C5A069]"
                      placeholder="Wpisz tekst banera..."
                    />
                  </div>

                  {/* Czcionka i Styl */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-[#6E6259] block">Krój pisma:</label>
                      <select
                        value={selectedText.fontFamily}
                        onChange={(e) =>
                          updateSelectedTextElement((prev) => ({
                            ...prev,
                            fontFamily: e.target.value as any,
                          }))
                        }
                        className="w-full p-1.5 border border-[#EADFD5] rounded bg-white text-xs text-[#241D1B]"
                      >
                        {FONT_OPTIONS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-[#6E6259] block">Waga czcionki:</label>
                      <select
                        value={selectedText.fontWeight}
                        onChange={(e) =>
                          updateSelectedTextElement((prev) => ({
                            ...prev,
                            fontWeight: Number(e.target.value) as 300 | 400 | 500 | 600 | 700,
                          }))
                        }
                        className="w-full p-1.5 border border-[#EADFD5] rounded bg-white text-xs text-[#241D1B]"
                      >
                        <option value={300}>300 (Cienka)</option>
                        <option value={400}>400 (Normalna)</option>
                        <option value={500}>500 (Średnia)</option>
                        <option value={600}>600 (Półgruba)</option>
                        <option value={700}>700 (Gruba)</option>
                      </select>
                    </div>
                  </div>

                  {/* Rozmiar dla aktywnego widoku + Wyrównanie + Kursywa */}
                  <div className="grid grid-cols-3 gap-2 items-end">
                    <div className="space-y-1">
                      <label className="text-[11px] text-[#6E6259] block">
                        Rozmiar ({viewport}):
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={80}
                        value={selectedText[viewport]?.fontSize || 20}
                        onChange={(e) =>
                          updateSelectedTextElement((prev) => ({
                            ...prev,
                            [viewport]: {
                              ...prev[viewport],
                              fontSize: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full p-1.5 border border-[#EADFD5] rounded bg-white text-xs text-[#241D1B]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-[#6E6259] block">Szerokość (%):</label>
                      <input
                        type="number"
                        min={15}
                        max={100}
                        value={selectedText[viewport]?.width || 60}
                        onChange={(e) =>
                          updateSelectedTextElement((prev) => ({
                            ...prev,
                            [viewport]: {
                              ...prev[viewport],
                              width: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full p-1.5 border border-[#EADFD5] rounded bg-white text-xs text-[#241D1B]"
                      />
                    </div>

                    {/* Wyrównanie i Kursywa */}
                    <div className="flex items-center gap-1 border border-[#EADFD5] p-1 rounded bg-[#FAF6F1]">
                      <button
                        type="button"
                        onClick={() =>
                          updateSelectedTextElement((prev) => ({
                            ...prev,
                            [viewport]: { ...prev[viewport], textAlign: "left" },
                          }))
                        }
                        className={`p-1 rounded ${
                          selectedText[viewport]?.textAlign === "left"
                            ? "bg-[#C5A069] text-white"
                            : "text-[#6E6259]"
                        }`}
                        title="Do lewej"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateSelectedTextElement((prev) => ({
                            ...prev,
                            [viewport]: { ...prev[viewport], textAlign: "center" },
                          }))
                        }
                        className={`p-1 rounded ${
                          selectedText[viewport]?.textAlign === "center"
                            ? "bg-[#C5A069] text-white"
                            : "text-[#6E6259]"
                        }`}
                        title="Do środka"
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateSelectedTextElement((prev) => ({
                            ...prev,
                            [viewport]: { ...prev[viewport], textAlign: "right" },
                          }))
                        }
                        className={`p-1 rounded ${
                          selectedText[viewport]?.textAlign === "right"
                            ? "bg-[#C5A069] text-white"
                            : "text-[#6E6259]"
                        }`}
                        title="Do prawej"
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateSelectedTextElement((prev) => ({
                            ...prev,
                            italic: !prev.italic,
                          }))
                        }
                        className={`p-1 rounded ${
                          selectedText.italic ? "bg-[#C5A069] text-white" : "text-[#6E6259]"
                        }`}
                        title="Kursywa"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Pozycja X / Y */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-[#6E6259] block">
                        Pozycja X (%):
                      </label>
                      <input
                        type="number"
                        step={0.5}
                        min={0}
                        max={100}
                        value={selectedText[viewport]?.x || 50}
                        onChange={(e) =>
                          updateSelectedTextElement((prev) => ({
                            ...prev,
                            [viewport]: {
                              ...prev[viewport],
                              x: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full p-1.5 border border-[#EADFD5] rounded bg-white text-xs text-[#241D1B]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-[#6E6259] block">
                        Pozycja Y (%):
                      </label>
                      <input
                        type="number"
                        step={0.5}
                        min={0}
                        max={100}
                        value={selectedText[viewport]?.y || 50}
                        onChange={(e) =>
                          updateSelectedTextElement((prev) => ({
                            ...prev,
                            [viewport]: {
                              ...prev[viewport],
                              y: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full p-1.5 border border-[#EADFD5] rounded bg-white text-xs text-[#241D1B]"
                      />
                    </div>
                  </div>

                  {/* Kolor tekstu */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#6E6259] block">Kolor tekstu:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedText.color || "#241D1B"}
                        onChange={(e) =>
                          updateSelectedTextElement((prev) => ({
                            ...prev,
                            color: e.target.value,
                          }))
                        }
                        className="w-8 h-8 rounded border border-[#EADFD5] p-0.5 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedText.color || "#241D1B"}
                        onChange={(e) =>
                          updateSelectedTextElement((prev) => ({
                            ...prev,
                            color: e.target.value,
                          }))
                        }
                        className="flex-1 p-1.5 border border-[#EADFD5] rounded bg-white font-mono text-xs text-[#241D1B]"
                      />
                    </div>
                  </div>

                  {/* Kapsułka tła pod tekstem */}
                  <div className="p-2.5 bg-[#FAF6F1] border border-[#EADFD5] rounded space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="font-semibold text-[#241D1B]">Tło pod tekstem (karta)</span>
                      <input
                        type="checkbox"
                        checked={selectedText.hasBackground}
                        onChange={(e) =>
                          updateSelectedTextElement((prev) => ({
                            ...prev,
                            hasBackground: e.target.checked,
                          }))
                        }
                        className="accent-[#C5A069]"
                      />
                    </label>

                    {selectedText.hasBackground && (
                      <div className="space-y-2 pt-1 border-t border-[#EADFD5]/70">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-[#6E6259]">Przezroczystość:</span>
                          <input
                            type="range"
                            min={0.1}
                            max={1}
                            step={0.05}
                            value={selectedText.backgroundOpacity ?? 0.8}
                            onChange={(e) =>
                              updateSelectedTextElement((prev) => ({
                                ...prev,
                                backgroundOpacity: Number(e.target.value),
                              }))
                            }
                            className="w-28 accent-[#C5A069]"
                          />
                          <span className="text-[11px] text-[#241D1B] font-mono">
                            {Math.round((selectedText.backgroundOpacity ?? 0.8) * 100)}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-[#6E6259]">Zaokrąglenie:</span>
                          <input
                            type="range"
                            min={0}
                            max={30}
                            step={2}
                            value={selectedText.borderRadius ?? 10}
                            onChange={(e) =>
                              updateSelectedTextElement((prev) => ({
                                ...prev,
                                borderRadius: Number(e.target.value),
                              }))
                            }
                            className="w-28 accent-[#C5A069]"
                          />
                          <span className="text-[11px] text-[#241D1B] font-mono">
                            {selectedText.borderRadius ?? 10}px
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Przyciski duplikacji i usunięcia */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleDuplicateSelected}
                      className="px-2.5 py-1.5 border border-[#EADFD5] hover:bg-[#FAF6F1] rounded text-[#4A3F3B] flex items-center gap-1.5 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplikuj</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="px-2.5 py-1.5 border border-[#FFCDD2] hover:bg-[#FDEDED] text-[#A84B4B] rounded flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Usuń napis</span>
                    </button>
                  </div>
                </div>
              )}

              {/* EDYCJA PRZYCISKU */}
              {isButtonSelected && selectedButton && (
                <div className="space-y-3.5 pt-2 border-t border-[#EADFD5]">
                  {/* SEKCJA: WIDOCZNOŚĆ PRZYCISKU NA URZĄDZENIACH */}
                  <div className="p-3 bg-[#FAF6F1] border border-[#EADFD5] rounded space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#241D1B] flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-[#C5A069]" />
                        <span>Widoczność przycisku na urządzeniach</span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          selectedButton.visible !== false && selectedButton[viewport]?.visible !== false
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {selectedButton.visible !== false && selectedButton[viewport]?.visible !== false
                          ? "Widoczny na tym widoku"
                          : "Ukryty na tym widoku"}
                      </span>
                    </div>

                    {/* Przełączniki dla komputera, tabletu i telefonu */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["desktop", "tablet", "mobile"] as DeviceViewport[]).map((vp) => {
                        const isVpVisible = selectedButton.visible !== false && selectedButton[vp]?.visible !== false;
                        const label = vp === "desktop" ? "Komputer" : vp === "tablet" ? "Tablet" : "Telefon";

                        return (
                          <button
                            key={vp}
                            type="button"
                            onClick={() => handleToggleVisibility(selectedButton.id, vp)}
                            className={`p-2 rounded border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                              isVpVisible
                                ? "bg-white border-[#C5A069] text-[#241D1B] shadow-2xs hover:bg-[#FAF2EB]"
                                : "bg-[#F3EFEA] border-[#D5C7B8] text-[#857670] hover:bg-[#EAE4DC]"
                            }`}
                          >
                            <span className="text-[10px] uppercase font-bold text-[#6E6259]">{label}</span>
                            <div className="flex items-center gap-1 text-[11px] font-semibold">
                              {isVpVisible ? (
                                <>
                                  <Eye className="w-3.5 h-3.5 text-[#C5A069]" />
                                  <span>Widoczny</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5 text-[#857670]" />
                                  <span>Ukryty</span>
                                </>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Przyciski: Zastosuj na wszystkich urządzeniach */}
                    <div className="flex items-center gap-2 pt-1 border-t border-[#EADFD5]/60">
                      <button
                        type="button"
                        onClick={() => handleSetAllDevicesVisibility(selectedButton.id, true)}
                        className="flex-1 py-1.5 px-2 bg-white border border-[#C5A069] text-[#8C6B38] hover:bg-[#FAF2EB] rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#C5A069]" />
                        <span>Pokaż na wszystkich</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetAllDevicesVisibility(selectedButton.id, false)}
                        className="flex-1 py-1.5 px-2 bg-white border border-[#D5C7B8] text-[#786D65] hover:bg-[#F3EFEA] rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <EyeOff className="w-3.5 h-3.5 text-[#857670]" />
                        <span>Ukryj na wszystkich</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#241D1B] block">Napis na przycisku:</label>
                    <input
                      type="text"
                      value={selectedButton.text}
                      onChange={(e) =>
                        updateSelectedButtonElement((prev) => ({
                          ...prev,
                          text: e.target.value,
                        }))
                      }
                      className="w-full p-2 border border-[#EADFD5] rounded bg-white text-[#241D1B] font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#6E6259] block">Link docelowy (URL):</label>
                    <input
                      type="text"
                      value={selectedButton.link}
                      onChange={(e) =>
                        updateSelectedButtonElement((prev) => ({
                          ...prev,
                          link: e.target.value,
                        }))
                      }
                      className="w-full p-2 border border-[#EADFD5] rounded bg-white text-[#241D1B] font-mono text-xs"
                      placeholder="/katalog"
                    />
                  </div>

                  {/* Pozycja X / Y */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-[#6E6259] block">
                        Pozycja X (%):
                      </label>
                      <input
                        type="number"
                        step={0.5}
                        min={0}
                        max={100}
                        value={selectedButton[viewport]?.x || 50}
                        onChange={(e) =>
                          updateSelectedButtonElement((prev) => ({
                            ...prev,
                            [viewport]: {
                              ...prev[viewport],
                              x: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full p-1.5 border border-[#EADFD5] rounded bg-white text-xs text-[#241D1B]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-[#6E6259] block">
                        Pozycja Y (%):
                      </label>
                      <input
                        type="number"
                        step={0.5}
                        min={0}
                        max={100}
                        value={selectedButton[viewport]?.y || 75}
                        onChange={(e) =>
                          updateSelectedButtonElement((prev) => ({
                            ...prev,
                            [viewport]: {
                              ...prev[viewport],
                              y: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full p-1.5 border border-[#EADFD5] rounded bg-white text-xs text-[#241D1B]"
                      />
                    </div>
                  </div>

                  {/* Kolory przycisku */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-[#6E6259] block">Kolor tła:</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={selectedButton.backgroundColor || "#9E8359"}
                          onChange={(e) =>
                            updateSelectedButtonElement((prev) => ({
                              ...prev,
                              backgroundColor: e.target.value,
                            }))
                          }
                          className="w-7 h-7 rounded border border-[#EADFD5] p-0.5 cursor-pointer"
                        />
                        <span className="font-mono text-[11px] text-[#241D1B]">
                          {selectedButton.backgroundColor}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-[#6E6259] block">Kolor tekstu:</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={selectedButton.textColor || "#FFFFFF"}
                          onChange={(e) =>
                            updateSelectedButtonElement((prev) => ({
                              ...prev,
                              textColor: e.target.value,
                            }))
                          }
                          className="w-7 h-7 rounded border border-[#EADFD5] p-0.5 cursor-pointer"
                        />
                        <span className="font-mono text-[11px] text-[#241D1B]">
                          {selectedButton.textColor}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Zaokrąglenie */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-[#6E6259]">Zaokrąglenie rogów:</span>
                    <input
                      type="range"
                      min={0}
                      max={24}
                      value={selectedButton.borderRadius ?? 8}
                      onChange={(e) =>
                        updateSelectedButtonElement((prev) => ({
                          ...prev,
                          borderRadius: Number(e.target.value),
                        }))
                      }
                      className="w-28 accent-[#C5A069]"
                    />
                    <span className="text-[11px] text-[#241D1B] font-mono">
                      {selectedButton.borderRadius ?? 8}px
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── ZAKŁADKA 2: ZDJĘCIE W TLE I KADROWANIE ─── */}
          {activeTab === "image" && (
            <div className="space-y-4 text-xs">
              {/* Ukryty input do wyboru pliku z dysku */}
              <input
                ref={bannerFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleBannerFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {/* Komunikaty stanu uploadu */}
              {bannerUploadError && (
                <div
                  role="alert"
                  className="p-3 bg-red-50 border border-red-200 text-red-900 rounded text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="font-medium leading-relaxed">{bannerUploadError}</span>
                </div>
              )}

              {bannerUploadSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium leading-relaxed">{bannerUploadSuccess}</span>
                </div>
              )}

              {/* Sekcja 1: Wybór pliku z urządzenia i Drag & Drop */}
              <div className="space-y-2">
                <label className="font-semibold text-[#241D1B] block text-xs uppercase tracking-wider">
                  Wgraj nowe zdjęcie banera:
                </label>

                {/* Widoczny przycisk wyboru pliku */}
                <button
                  type="button"
                  disabled={isUploadingBanner}
                  onClick={() => bannerFileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 bg-[#C5A069] hover:bg-[#AF884F] text-white rounded text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isUploadingBanner ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Optymalizowanie zdjęcia...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-white" />
                      <span>Wgraj zdjęcie z urządzenia</span>
                    </>
                  )}
                </button>

                {/* Strefa upuszczania Drag & Drop */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleBannerFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => bannerFileInputRef.current?.click()}
                  className={`p-4 border-2 border-dashed rounded text-center cursor-pointer transition-all ${
                    isDragOver
                      ? "border-[#C5A069] bg-[#FAF6F1]"
                      : "border-[#D1BEB0] hover:border-[#9E8359] bg-[#FAF6F1]/50"
                  }`}
                >
                  <ImageIcon className="w-6 h-6 mx-auto mb-1 text-[#9E8359]" />
                  <p className="font-semibold text-[#241D1B] text-[11px]">
                    Przeciągnij i upuść zdjęcie tutaj lub kliknij, aby wybrać
                  </p>
                  <p className="text-[10px] text-[#7E7771] mt-0.5">
                    Dopuszczalne formaty: JPG, PNG, WebP (maks. 10 MB)
                  </p>
                </div>
              </div>

              {/* Sekcja 2: Szybkie przywrócenie czystej fotografii z butiku */}
              <div className="pt-2 border-t border-[#EADFD5] space-y-1.5">
                <label className="font-semibold text-[#241D1B] block text-xs">
                  Gotowa fotografia butiku AURA:
                </label>
                <button
                  type="button"
                  onClick={handleUseDefaultCleanPhoto}
                  className="w-full py-2 px-3 bg-[#FAF6F1] border border-[#C5A069] text-[#8C6B38] hover:bg-[#F3ECE2] rounded text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-4 h-4 text-[#C5A069]" />
                  <span>Użyj nowego czystego zdjęcia AURA (bez napisów)</span>
                </button>
                <p className="text-[10px] text-[#7E7771] leading-tight">
                  Wczytuje oryginalną fotografię showroomu AURA Boutique bez wbudowanych napisów ze świeżym znacznikiem wersji.
                </p>
              </div>

              {/* Sekcja 3: Miniatura aktualnego zdjęcia i ścieżka */}
              <div className="pt-2 border-t border-[#EADFD5] space-y-2">
                <label className="font-semibold text-[#241D1B] block text-xs">
                  Aktualnie ustawione tło:
                </label>
                <div className="flex items-center gap-2.5 p-2 bg-[#FAF6F1] border border-[#EADFD5] rounded">
                  <div className="w-14 h-9 bg-neutral-200 rounded overflow-hidden relative shrink-0 border border-[#D1BEB0]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={config.imageUrl || "/images/hero/aura-hero-boutique-clean.jpg"}
                      alt="Miniatura banera"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-mono text-[#241D1B] truncate" title={config.imageUrl}>
                      {config.imageUrl ? (config.imageUrl.startsWith("data:") ? "Własne zdjęcie (zapisane w bazie)" : config.imageUrl) : "Domyślne zdjęcie"}
                    </p>
                    <p className="text-[9px] text-[#7E7771] mt-0.5">
                      Podgląd na żywo widoczny na płótnie obok
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-[#6E6259]">Ręczny URL zdjęcia (opcjonalnie):</span>
                  <input
                    type="text"
                    value={config.imageUrl}
                    onChange={(e) =>
                      setConfig((prev) => {
                        const next = { ...prev, imageUrl: e.target.value };
                        pushHistory(next);
                        return next;
                      })
                    }
                    className="w-full p-2 border border-[#EADFD5] rounded bg-white text-[11px] font-mono text-[#241D1B]"
                    placeholder="/images/hero/aura-hero-boutique-clean.jpg"
                  />
                </div>
              </div>

              {/* Sekcja 4: Kadrowanie / Punkt centralny (Focal point X / Y) */}
              <div className="space-y-2 pt-2 border-t border-[#EADFD5]">
                <label className="font-semibold text-[#241D1B] block">
                  Punkt kadrowania zdjęcia (Focal Point):
                </label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#6E6259]">Poziomo (X):</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={config.focalPointX ?? 50}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          focalPointX: Number(e.target.value),
                        }))
                      }
                      className="w-32 accent-[#C5A069]"
                    />
                    <span className="text-[11px] font-mono text-[#241D1B]">
                      {config.focalPointX ?? 50}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#6E6259]">Pionowo (Y):</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={config.focalPointY ?? 50}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          focalPointY: Number(e.target.value),
                        }))
                      }
                      className="w-32 accent-[#C5A069]"
                    />
                    <span className="text-[11px] font-mono text-[#241D1B]">
                      {config.focalPointY ?? 50}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── ZAKŁADKA 3: NAKŁADKA I PRZYCIEMNIENIE ─── */}
          {activeTab === "overlay" && (
            <div className="space-y-3.5 text-xs">
              <label className="flex items-center justify-between cursor-pointer p-2 bg-[#FAF6F1] border border-[#EADFD5] rounded">
                <span className="font-semibold text-[#241D1B]">Włącz nakładkę / gradient</span>
                <input
                  type="checkbox"
                  checked={config.overlay?.enabled ?? false}
                  onChange={(e) =>
                    setConfig((prev) => {
                      const next = {
                        ...prev,
                        overlay: {
                          ...prev.overlay,
                          enabled: e.target.checked,
                          color: prev.overlay?.color || "#000000",
                          opacity: prev.overlay?.opacity ?? 0.2,
                          gradientType: prev.overlay?.gradientType || "to-bottom",
                        },
                      };
                      pushHistory(next);
                      return next;
                    })
                  }
                  className="accent-[#C5A069]"
                />
              </label>

              {config.overlay?.enabled && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#6E6259] block">Typ przejścia (gradient):</label>
                    <select
                      value={config.overlay.gradientType || "none"}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          overlay: {
                            ...prev.overlay,
                            gradientType: e.target.value as any,
                          },
                        }))
                      }
                      className="w-full p-2 border border-[#EADFD5] rounded bg-white text-xs text-[#241D1B]"
                    >
                      <option value="none">Jednolite przyciemnienie</option>
                      <option value="to-bottom">Gradient od góry do dołu</option>
                      <option value="to-top">Gradient od dołu do góry</option>
                      <option value="to-right">Gradient od lewej do prawej</option>
                      <option value="radial">Gradient promienisty (radial)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#6E6259] block">Kolor nakładki:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.overlay.color || "#000000"}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            overlay: {
                              ...prev.overlay,
                              color: e.target.value,
                            },
                          }))
                        }
                        className="w-8 h-8 rounded border border-[#EADFD5] p-0.5 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.overlay.color || "#000000"}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            overlay: {
                              ...prev.overlay,
                              color: e.target.value,
                            },
                          }))
                        }
                        className="flex-1 p-1.5 border border-[#EADFD5] rounded bg-white font-mono text-xs text-[#241D1B]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-[#6E6259]">Siła krycia:</span>
                    <input
                      type="range"
                      min={0.05}
                      max={0.8}
                      step={0.05}
                      value={config.overlay.opacity ?? 0.2}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          overlay: {
                            ...prev.overlay,
                            opacity: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-28 accent-[#C5A069]"
                    />
                    <span className="text-[11px] text-[#241D1B] font-mono">
                      {Math.round((config.overlay.opacity ?? 0.2) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
