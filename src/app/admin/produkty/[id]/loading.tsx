import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingEditProduct() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-[#FAF6F1] border border-[#EADFD5] flex items-center justify-center mx-auto text-[#C5A069]">
        <Loader2 className="w-7 h-7 animate-spin" />
      </div>
      <h2 className="font-serif text-xl text-[#241D1B]">Ładowanie danych produktu...</h2>
      <p className="text-xs text-[#857670]">
        Pobieranie szczegółów, zdjęć i wariantów z bazy danych AURA Boutique.
      </p>
    </div>
  );
}

