"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, AlertCircle, Mail } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Niepoprawne dane logowania.");
      }

      if (data.mustChangePassword) {
        router.push("/zmien-haslo");
      } else {
        router.push("/admin");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Błąd podczas logowania.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8"
      style={{
        backgroundColor: "#FAF6F1",
        backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
        backgroundRepeat: "repeat",
      }}
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <BrandLogo size="lg" variant="cashmere" />
        <h2 className="mt-6 font-serif text-2xl text-[#241D1B] tracking-wide">
          Panel Właścicielki Butiku
        </h2>
        <p className="mt-1 text-xs text-[#7A6458]">
          Zarządzanie produktami, zamówieniami, rabatami i ustawieniami
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white/95 backdrop-blur-sm py-8 px-6 sm:px-10 border border-[#BCAB9B] rounded-lg shadow-xl space-y-6">
          {error && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1.5 font-semibold">
                Adres e-mail właścicielki
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="twoj-email@auraboutique.pl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#BCAB9B] p-3 pl-9 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded font-medium"
                />
                <Mail className="w-4 h-4 text-[#8C7248] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1.5 font-semibold">
                Hasło dostępowe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Wpisz hasło..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#BCAB9B] p-3 pl-9 pr-10 text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069] rounded font-medium"
                />
                <Lock className="w-4 h-4 text-[#8C7248] absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6458] hover:text-[#241D1B]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end pt-1.5">
                <Link
                  href="/logowanie?tab=forgot"
                  className="text-[11px] text-[#8C7248] hover:text-[#241D1B] hover:underline"
                >
                  Nie pamiętasz hasła? Zresetuj je bezpiecznie przez e-mail
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-[0.2em] font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 rounded shadow-md cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>{isLoading ? "Weryfikacja..." : "Zaloguj się do panelu"}</span>
            </button>
          </form>

          <div className="pt-2 text-center border-t border-[#EADFD5]">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#7A6458] hover:text-[#241D1B]"
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
