"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, AlertCircle } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Niepoprawne hasło.");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Błąd podczas logowania.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <BrandLogo size="lg" />
        <h2 className="mt-6 font-serif text-2xl text-[#141414] tracking-wide">
          Panel Właścicielki Butiku
        </h2>
        <p className="mt-1 text-xs text-[#7E7771]">
          Zarządzanie produktami, wariantami, magazynem i zamówieniami
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 border border-[#E8E2D8] shadow-sm space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7E7771] mb-1.5 font-medium">
                Hasło dostępowe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Wpisz hasło..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E8E2D8] p-3 text-sm text-[#141414] pr-10 focus:outline-none focus:border-[#BFA074]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7E7771] hover:text-[#141414]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#141414] text-[#FAF8F5] text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#3E3B38] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-[#BFA074]" />
              <span>{isLoading ? "Weryfikacja..." : "Zaloguj się do panelu"}</span>
            </button>
          </form>

          {/* Karta z domyślnym hasłem dla ułatwienia testów */}
          <div className="p-4 bg-[#F3ECE2]/60 border border-[#E8E2D8] text-xs text-[#3E3B38] space-y-1.5">
            <p className="font-semibold text-[#141414] flex items-center gap-1.5">
              <span>🔑</span> Hasło dostępowe startowe:
            </p>
            <p className="font-mono bg-white px-2 py-1 border border-[#E8E2D8] text-center font-bold text-[#141414]">
              Aura2026!
            </p>
            <p className="text-[11px] text-[#7E7771]">
              Możesz je zmienić w dowolnej chwili w pliku <code>.env</code> w zmiennej <code>ADMIN_PASSWORD</code>.
            </p>
          </div>

          <div className="pt-2 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#7E7771] hover:text-[#141414]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Powrót do sklepu dla klientek</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
