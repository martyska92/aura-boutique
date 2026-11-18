"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, ShieldAlert, CheckCircle2, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import {
  PasswordLengthIndicator,
  PasswordMatchIndicator,
  getPasswordValidationState,
} from "@/components/ui/LivePasswordValidation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const validation = getPasswordValidationState(newPassword, confirmPassword, 8);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Hasło musi mieć co najmniej 8 znaków.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Podane hasła nie są identyczne.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas zmiany hasła.");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Błąd połączenia.");
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundColor: "#FAF6F1",
        backgroundImage: "url('/images/brand/cashmere-texture.jpg')",
        backgroundRepeat: "repeat",
      }}
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <BrandLogo size="lg" variant="cashmere" />
        <h1 className="mt-6 font-serif text-2xl text-[#241D1B] tracking-wide">
          Zmiana Hasła
        </h1>
        <p className="mt-1 text-xs text-[#7A6458]">
          Wprowadź nowe, bezpieczne hasło do swojego konta w AURA Boutique.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-sm py-8 px-6 sm:px-10 border border-[#BCAB9B] rounded-lg shadow-xl space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded flex items-center gap-2">
              <span className="font-bold">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="p-6 text-center bg-emerald-50 border border-emerald-200 rounded-md space-y-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="font-serif text-lg text-emerald-950 font-semibold">
                Hasło zostało zmienione. Możesz się zalogować
              </h3>
              <p className="text-xs text-emerald-800">
                Twoje nowe hasło zostało pomyślnie zaktualizowane w systemie.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/logowanie"
                  className="w-full py-3 bg-[#241D1B] hover:bg-[#3E3835] text-white text-xs uppercase tracking-wider font-semibold rounded transition-colors flex items-center justify-center gap-2"
                >
                  <span>Przejdź do logowania</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/konto"
                  className="text-xs text-[#7A6458] hover:text-[#241D1B] underline py-1"
                >
                  Przejdź do mojego konta
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1 font-semibold">
                  Nowe hasło *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Wpisz nowe hasło..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#BCAB9B] p-3 text-xs text-[#241D1B] pr-10 focus:outline-none focus:border-[#C5A069] rounded font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6458] hover:text-[#241D1B]"
                    title={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordLengthIndicator value={newPassword} minLength={8} />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#63534B] mb-1 font-semibold">
                  Powtórz nowe hasło *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Wpisz ponownie nowe hasło..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#BCAB9B] p-3 text-xs text-[#241D1B] pr-10 focus:outline-none focus:border-[#C5A069] rounded font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6458] hover:text-[#241D1B]"
                    title={showConfirmPassword ? "Ukryj hasło" : "Pokaż hasło"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordMatchIndicator password={newPassword} confirmPassword={confirmPassword} />
              </div>

              {!validation.isValid && (
                <div className="p-2.5 bg-[#FAF6F1] border border-[#EADFD5] rounded text-[11px] text-[#7A6458] text-center">
                  {validation.reason}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !validation.isValid}
                  className="w-full py-3.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-[0.2em] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded shadow-md cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isLoading ? "Zapisywanie..." : "Zapisz nowe hasło"}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </form>
          )}

          <div className="pt-2 text-center border-t border-[#EADFD5]">
            <Link
              href="/"
              className="text-xs text-[#7A6458] hover:text-[#241D1B] hover:underline"
            >
              Powrót do strony głównej butiku
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

