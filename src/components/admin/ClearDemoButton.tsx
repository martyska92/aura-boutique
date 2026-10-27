"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, RefreshCw } from "lucide-react";

export function ClearDemoButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleClear = async () => {
    if (!confirm("Czy na pewno chcesz usunąć wszystkie wzorcowe dane demonstracyjne produktów? Ta operacja przygotuje sklep pod wprowadzanie Twojego asortymentu.")) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/products/clear-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Dane demonstracyjne zostały pomyślnie usunięte.");
        router.refresh();
      } else {
        alert(data.error || "Błąd podczas usuwania.");
      }
    } catch (err: any) {
      alert("Błąd połączenia: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClear}
      disabled={isLoading}
      className="px-4 py-2 bg-amber-900 text-white text-xs uppercase tracking-wider font-semibold rounded hover:bg-black transition-colors flex items-center gap-1.5 shrink-0"
    >
      <Trash2 className="w-3.5 h-3.5" />
      <span>{isLoading ? "Czyszczenie..." : "Wyczyść Asortyment Demo"}</span>
    </button>
  );
}
