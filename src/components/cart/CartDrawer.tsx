"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";

export function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeItem, updateQuantity, subtotal, itemCount } = useCart();
  const freeShippingThreshold = 300;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  // Blokowanie scrolla w tle gdy koszyk jest otwarty
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Tło przyciemnione */}
      <div
        className="absolute inset-0 bg-[#141414]/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF6F1] shadow-2xl flex flex-col border-l border-[#EADFD5]">
          {/* Nagłówek koszyka */}
          <div className="p-5 border-b border-[#EADFD5] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-[#C5A069]" />
              <h2 className="font-serif text-lg tracking-wide uppercase text-[#241D1B]">
                Twój Koszyk ({itemCount})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-[#857670] hover:text-[#241D1B] hover:bg-[#FAF6F1] rounded-full transition-colors"
              aria-label="Zamknij koszyk"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Pasek darmowej dostawy */}
          <div className="px-5 py-3.5 bg-[#F2DCD7]/60 border-b border-[#DFBEB8] text-xs">
            {remainingForFreeShipping > 0 ? (
              <p className="text-[#4A3F3B] mb-1.5 font-medium">
                Brakuje Ci jeszcze <span className="font-semibold text-[#542823]">{remainingForFreeShipping.toFixed(2)} PLN</span> do darmowej dostawy!
              </p>
            ) : (
              <p className="text-[#3E3B38] mb-1.5 font-semibold text-emerald-800 flex items-center gap-1.5">
                <span>✨</span> Gratulacje! Twoje zamówienie kwalifikuje się do darmowej dostawy!
              </p>
            )}
            <div className="w-full bg-[#EADBBE]/60 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#C5A069] h-full transition-all duration-500 rounded-full"
                style={{ width: `${freeShippingPercent}%` }}
              />
            </div>
          </div>

          {/* Lista pozycji */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-[#EADFD5]">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#857670]">
                <div className="w-16 h-16 rounded-full bg-[#F2DCD7] flex items-center justify-center mb-4 text-[#C5A069]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="font-serif text-lg text-[#241D1B] mb-1">Twój koszyk jest pusty</p>
                <p className="text-xs text-[#857670] mb-6 max-w-xs">
                  Odkryj najnowsze fasony sukienek, kompletów i swetrów w AURA Boutique.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-widest rounded-xs shadow-xs transition-colors"
                >
                  Przeglądaj kolekcję
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.variantId} className="py-4 flex gap-4 first:pt-0">
                  <div className="w-20 h-24 bg-[#FAF6F1] relative shrink-0 overflow-hidden border border-[#EADFD5] rounded-xs">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-[#857670]">
                        AURA
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-serif text-sm font-medium text-[#241D1B] line-clamp-1">
                          {item.name}
                        </h3>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="text-[#857670] hover:text-red-700 p-1 transition-colors"
                          title="Usuń pozycję"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-xs text-[#857670]">
                        <span>Rozmiar: <strong className="text-[#241D1B]">{item.size}</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          {item.colorHex && (
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/15 inline-block"
                              style={{ backgroundColor: item.colorHex }}
                            />
                          )}
                          <strong className="text-[#241D1B]">{item.color}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-[#EADFD5] bg-white rounded-xs">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="p-1 px-2 text-[#857670] hover:text-[#241D1B] hover:bg-[#FAF6F1] transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-medium text-[#241D1B]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="p-1 px-2 text-[#857670] hover:text-[#241D1B] hover:bg-[#FAF6F1] disabled:opacity-40 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-semibold text-[#241D1B]">
                          {(item.price * item.quantity).toFixed(2)} PLN
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Stopka koszyka z podsumowaniem */}
          {items.length > 0 && (
            <div className="p-5 border-t border-[#EADFD5] bg-white space-y-3">
              <div className="flex items-center justify-between text-xs text-[#857670]">
                <span>Wartość produktów:</span>
                <span className="text-sm font-semibold text-[#241D1B]">
                  {subtotal.toFixed(2)} PLN
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#857670]">
                <span>Szacowana dostawa:</span>
                <span>
                  {remainingForFreeShipping === 0 ? (
                    <strong className="text-emerald-700 uppercase">Bezpłatnie</strong>
                  ) : (
                    "od 13.00 PLN"
                  )}
                </span>
              </div>

              <div className="pt-2 border-t border-[#EADFD5]">
                <Link
                  href="/zamowienie"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-3.5 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-[0.2em] font-medium flex items-center justify-center gap-2 rounded-xs shadow-[0_4px_14px_rgba(197,160,105,0.3)] transition-colors group"
                >
                  <span>Przejdź do kasy</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/koszyk"
                  onClick={() => setIsCartOpen(false)}
                  className="block text-center mt-2 text-xs text-[#857670] hover:text-[#C5A069] transition-colors py-1"
                >
                  Zobacz pełny koszyk
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
