"use client";

import React from "react";
import { Check, X, AlertCircle } from "lucide-react";

interface PasswordLengthIndicatorProps {
  value: string;
  minLength?: number;
}

export function PasswordLengthIndicator({
  value,
  minLength = 8,
}: PasswordLengthIndicatorProps) {
  const length = value.length;

  if (length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-[#7A6458] mt-1.5 transition-all">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#BCAB9B]" />
        <span>Minimum {minLength} znaków</span>
      </div>
    );
  }

  if (length < minLength) {
    const remaining = minLength - length;
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-medium mt-1.5 transition-all">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>
          Za krótkie hasło — wpisano {length}/{minLength} znaków (dodaj jeszcze {remaining})
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium mt-1.5 transition-all">
      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
      <span>✓ Hasło ma wymaganą długość</span>
    </div>
  );
}

interface PasswordMatchIndicatorProps {
  password: string;
  confirmPassword: string;
}

export function PasswordMatchIndicator({
  password,
  confirmPassword,
}: PasswordMatchIndicatorProps) {
  if (!confirmPassword) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-[#7A6458] mt-1.5 transition-all">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#BCAB9B]" />
        <span>Wpisz ponownie nowe hasło</span>
      </div>
    );
  }

  if (password !== confirmPassword) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-red-700 font-medium mt-1.5 transition-all">
        <X className="w-3.5 h-3.5 text-red-600 shrink-0 stroke-[2.5]" />
        <span>✕ Hasła nie są zgodne</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium mt-1.5 transition-all">
      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
      <span>✓ Hasła są zgodne</span>
    </div>
  );
}

interface PasswordFormHelperProps {
  password: string;
  confirmPassword: string;
  minLength?: number;
  otherFieldsValid?: boolean;
}

export function getPasswordValidationState(
  password: string,
  confirmPassword: string,
  minLength = 8
) {
  const isLengthValid = password.length >= minLength;
  const isMatchValid = confirmPassword.length > 0 && password === confirmPassword;
  const isValid = isLengthValid && isMatchValid;

  let reason = "";
  if (!isLengthValid && !isMatchValid) {
    reason = `Wpisz hasło o min. ${minLength} znakach i powtórz je identycznie w drugim polu.`;
  } else if (!isLengthValid) {
    reason = `Hasło jest za krótkie (${password.length}/${minLength} znaków).`;
  } else if (!isMatchValid) {
    reason = "Wpisane hasła nie są identyczne.";
  }

  return { isLengthValid, isMatchValid, isValid, reason };
}
