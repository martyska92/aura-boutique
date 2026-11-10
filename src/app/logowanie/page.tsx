"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/konto";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwnerEmail = email.trim().toLowerCase() === "aurazmigrod@wp.pl";

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
        throw new Error(data.error || "Błąd podczas logowania.");
      }

      if (data.mustChangePassword) {
        router.push("/zmien-haslo");
      } else if (data.isAdmin) {
        router.push(redirectUrl.startsWith("/admin") ? redirectUrl : "/admin");
      } else {
        router.push(redirectUrl);
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Wystąpił problem z połączeniem.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto">
      <div className="text-center mb-8">
        <BrandLogo size="lg" variant="cashmere" />
        <h1 className="mt-6 font-serif text-2xl sm:text-3xl text-[#241D1B]">
          Zaloguj się do Butiku
        </h1>
        <p className="text-xs text-[#7A6458] mt-1 font-light">
          Konto klientki oraz panel zarządzania butikiem AURA
        </p>
      </div>

      <div className="bg-white/95 backdrop-blur-sm p-6 sm:p-10 border border-[#BCAB9B] rounded-lg shadow-xl space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1.5 font-semibold">
              Adres E-mail
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="twoj-email@domena.pl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#FAF6F1] border border-[#BCAB9B] p-3 text-xs text-[#241D1B] pl-9 focus:outline-none focus:border-[#C5A069] rounded font-medium"
              />
              <Mail className="w-4 h-4 text-[#8C7248] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs uppercase tracking-wider text-[#63534B] font-semibold">
                Hasło dostępowe
              </label>
              {isOwnerEmail && (
                <span className="text-[10px] text-[#A66E22] bg-[#FFF2DE] px-1.5 py-0.5 rounded font-bold">
                  Konto Właścicielki
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required={isOwnerEmail}
                placeholder={
                  isOwnerEmail ? "Wpisz hasło do konta..." : "Hasło (lub pozostaw puste dla logowania gościa)"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#FAF6F1] border border-[#BCAB9B] p-3 text-xs text-[#241D1B] pl-9 pr-10 focus:outline-none focus:border-[#C5A069] rounded font-medium"
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
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-[0.2em] font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 rounded shadow-md"
            >
              {isOwnerEmail ? (
                <ShieldCheck className="w-4 h-4 text-white" />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
              <span>
                {isLoading
                  ? "Weryfikacja..."
                  : isOwnerEmail
                  ? "Zaloguj do Panelu Właścicielki"
                  : "Zaloguj się do Konta"}
              </span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </form>

        {/* Informacje dla użytkowniczek */}
        <div className="p-4 bg-[#F5ECE1]/60 border border-[#E0D3C3] rounded text-[11px] text-[#5A483D] space-y-1.5 leading-relaxed">
          <p className="font-semibold text-[#241D1B] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A069]" />
            <span>Jedno logowanie dla wszystkich</span>
          </p>
          <p>
            Wpisz swój adres e-mail, aby sprawdzić swoje kody rabatowe, historię zakupów oraz polecać butik przyjaciółkom (15% zniżki).
          </p>
          <p className="text-[10px] text-[#7A6458] pt-1 border-t border-[#E0D3C3]">
            Właścicielka butiku loguje się oficjalnym adresem: <code className="font-semibold text-[#241D1B]">aurazmigrod@wp.pl</code>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Header />
      <main
        className="flex-1 py-12 sm:py-20 px-4 sm:px-6 lg:px-8 flex flex-col justify-center"
        style={{
          backgroundColor: "#FAF6F1",
          backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
          backgroundRepeat: "repeat",
        }}
      >
        <Suspense
          fallback={
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#C5A069] border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
