"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, subtotal, itemCount } = useCart();
  const freeShippingThreshold = 300;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#FAF6F1] py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h1 className="font-serif text-3xl sm:text-4xl text-[#241D1B]">
              Twój Koszyk
            </h1>
            <p className="text-xs sm:text-sm text-[#857670] mt-2">
              Zamówienia realizujemy bez konieczności zakładania konta.
            </p>
          </div>

          {items.length === 0 ? (
            <div className="bg-white border border-[#EADFD5] rounded-xs shadow-xs p-12 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#F2DCD7] flex items-center justify-center mx-auto text-[#C5A069]">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-xl text-[#241D1B]">Twój koszyk jest pusty</h2>
              <p className="text-xs text-[#857670]">
                Wybierz coś wyjątkowego z naszej nowej kolekcji.
              </p>
              <div className="pt-2">
                <Link
                  href="/katalog"
                  className="px-8 py-3 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-widest inline-flex items-center gap-2 rounded-xs shadow-xs transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Przeglądaj Katalog</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Lewa kolumna: Lista pozycji w koszyku */}
              <div className="lg:col-span-8 bg-white border border-[#EADFD5] rounded-xs shadow-xs p-6 sm:p-8">
                {/* Pasek darmowej dostawy */}
                <div className="p-4 bg-[#F2DCD7]/60 border border-[#DFBEB8] mb-6 rounded-xs text-xs">
                  {remainingForFreeShipping > 0 ? (
                    <p className="text-[#4A3F3B] mb-2 font-medium">
                      Brakuje Ci jeszcze <strong className="text-[#542823]">{remainingForFreeShipping.toFixed(2)} PLN</strong> do darmowej dostawy!
                    </p>
                  ) : (
                    <p className="text-emerald-800 font-semibold mb-2 flex items-center gap-1.5">
                      <span>✨</span> Twoje zamówienie kwalifikuje się do bezpłatnej dostawy kurierem lub do Paczkomatu!
                    </p>
                  )}
                  <div className="w-full bg-[#EADBBE]/60 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#C5A069] h-full transition-all duration-500 rounded-full"
                      style={{ width: `${freeShippingPercent}%` }}
                    />
                  </div>
                </div>

                <div className="divide-y divide-[#EADFD5]">
                  {items.map((item) => (
                    <div key={item.variantId} className="py-6 flex flex-col sm:flex-row gap-5 first:pt-0">
                      <div className="relative w-24 h-32 bg-[#FAF6F1] shrink-0 border border-[#EADFD5] rounded-xs overflow-hidden">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-4">
                            <h3 className="font-serif text-base text-[#241D1B] font-normal">
                              {item.name}
                            </h3>
                            <button
                              onClick={() => removeItem(item.variantId)}
                              className="text-[#857670] hover:text-red-700 p-1 transition-colors"
                              title="Usuń pozycję"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#857670]">
                            <span>Rozmiar: <strong className="text-[#241D1B]">{item.size}</strong></span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                              {item.colorHex && (
                                <span
                                  className="w-3 h-3 rounded-full border border-black/20"
                                  style={{ backgroundColor: item.colorHex }}
                                />
                              )}
                              <span>Kolor: <strong className="text-[#241D1B]">{item.color}</strong></span>
                            </span>
                            <span>•</span>
                            <span className="font-mono text-[11px]">SKU: {item.sku}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center border border-[#EADFD5] bg-[#FAF6F1] rounded-xs">
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                              className="p-1.5 px-3 text-[#857670] hover:text-[#241D1B] hover:bg-[#FAF6F1]"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3 text-xs font-semibold text-[#241D1B]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                              disabled={item.quantity >= item.maxStock}
                              className="p-1.5 px-3 text-[#857670] hover:text-[#241D1B] hover:bg-[#FAF6F1] disabled:opacity-30"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="text-base font-semibold text-[#241D1B]">
                              {(item.price * item.quantity).toFixed(2)} PLN
                            </span>
                            {item.quantity > 1 && (
                              <p className="text-[11px] text-[#857670]">
                                {item.price.toFixed(2)} PLN / szt.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-[#EADFD5] flex items-center justify-between text-xs">
                  <Link
                    href="/katalog"
                    className="inline-flex items-center gap-1.5 text-[#857670] hover:text-[#C5A069]"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kontynuuj zakupy</span>
                  </Link>

                  <button
                    onClick={clearCart}
                    className="text-[#857670] hover:text-red-700 underline"
                  >
                    Wyczyść koszyk
                  </button>
                </div>
              </div>

              {/* Prawa kolumna: Podsumowanie koszyka */}
              <div className="lg:col-span-4 bg-white border border-[#EADFD5] rounded-xs shadow-xs p-6 sm:p-8 h-fit space-y-5">
                <h2 className="font-serif text-lg uppercase tracking-wider text-[#241D1B] border-b border-[#EADFD5] pb-3">
                  Podsumowanie
                </h2>

                <div className="space-y-3 text-xs text-[#857670]">
                  <div className="flex justify-between">
                    <span>Wartość produktów ({itemCount} szt.):</span>
                    <span className="font-semibold text-[#241D1B]">{subtotal.toFixed(2)} PLN</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Koszt dostawy:</span>
                    <span>
                      {remainingForFreeShipping === 0 ? (
                        <strong className="text-emerald-700 uppercase">Bezpłatnie</strong>
                      ) : (
                        "od 13.00 PLN"
                      )}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#EADFD5] flex justify-between items-baseline">
                  <span className="font-serif text-base text-[#241D1B]">Do zapłaty:</span>
                  <span className="text-2xl font-semibold text-[#241D1B]">
                    {subtotal.toFixed(2)} PLN
                  </span>
                </div>

                <Link
                  href="/zamowienie"
                  className="w-full py-4 bg-[#C5A069] hover:bg-[#AF884F] text-white text-xs uppercase tracking-[0.2em] font-medium flex items-center justify-center gap-2 rounded-xs shadow-[0_4px_16px_rgba(197,160,105,0.35)] transition-colors"
                >
                  <span>Przejdź do kasy</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <p className="text-[11px] text-center text-[#857670]">
                  Bezpieczne zakupy z Przelewy24, BLIK i szyfrowaniem SSL.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
