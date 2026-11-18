"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calculator,
  Package,
  ShoppingCart,
  Calendar,
  Settings as SettingsIcon,
  Plus,
  Trash2,
  Save,
  Check,
  AlertCircle,
  Download,
  ArrowRight,
  TrendingUp,
  Percent,
  Truck,
  DollarSign,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Layers,
  HelpCircle,
  ShieldCheck,
  Building,
} from "lucide-react";
import {
  CostCalculatorSettings,
  FixedCostItem,
  Order,
  PackagingPreset,
  PaymentGatewayFeeRule,
  Product,
} from "@/lib/types";
import {
  calculateProductMargin,
  calculateOrderMargin,
  calculateMonthlySummary,
  simulateRequiredSellingPrice,
  normalizeCostCalculatorSettings,
} from "@/lib/cost-calculator-service";

interface CostCalculatorClientProps {
  initialSettings: CostCalculatorSettings;
  initialOrders: Order[];
  initialProducts: Product[];
}

export function CostCalculatorClient({
  initialSettings,
  initialOrders,
  initialProducts,
}: CostCalculatorClientProps) {
  const [activeTab, setActiveTab] = useState<"PRODUCT" | "ORDER" | "MONTH" | "CONFIG">("PRODUCT");
  const [settings, setSettings] = useState<CostCalculatorSettings>(() =>
    normalizeCostCalculatorSettings(initialSettings)
  );
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Słownik produktów dla szybkiego dostępu po ID lub nazwie
  const productsMap = useMemo(() => {
    const map = new Map<string, Product>();
    initialProducts.forEach((p) => {
      map.set(p.name, p);
      map.set(p.id, p);
    });
    return map;
  }, [initialProducts]);

  // ───────────────────────────────────────────────────────────────────────────
  // STAN WIDOKU A: PRODUKT
  // ───────────────────────────────────────────────────────────────────────────
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [productPurchasePrice, setProductPurchasePrice] = useState<string>("50.00");
  const [productIsPurchaseGross, setProductIsPurchaseGross] = useState<boolean>(false);
  const [productExtraUnitCost, setProductExtraUnitCost] = useState<string>("5.00");
  const [productSellingPrice, setProductSellingPrice] = useState<string>("100.00");
  const [productDiscountPercent, setProductDiscountPercent] = useState<string>("0");
  const [productVatRate, setProductVatRate] = useState<number>(settings.defaultVatRate || 23);
  const [productAssumeFreeShipping, setProductAssumeFreeShipping] = useState<boolean>(false);
  const [productPackagingCost, setProductPackagingCost] = useState<string>("4.50");
  const [productPaymentMethod, setProductPaymentMethod] = useState<string>("BLIK");
  const [productFreebieCost, setProductFreebieCost] = useState<string>("0.00");
  const [productLaborCost, setProductLaborCost] = useState<string>("0.00");

  // Symulacja odwrotna (Reverse Pricing)
  const [reverseTargetMargin, setReverseTargetMargin] = useState<string>("30");

  // Obsługa wyboru gotowego produktu z katalogu
  const handleSelectStoreProduct = (prodId: string) => {
    setSelectedProductId(prodId);
    if (!prodId) return;
    const prod = productsMap.get(prodId);
    if (prod) {
      if (prod.purchasePrice !== undefined) {
        setProductPurchasePrice(prod.purchasePrice.toString());
      }
      if (prod.extraUnitCost !== undefined) {
        setProductExtraUnitCost(prod.extraUnitCost.toString());
      }
      setProductSellingPrice((prod.promotionalPrice || prod.basePrice).toString());
      if (prod.promotionalPrice && prod.basePrice > prod.promotionalPrice) {
        const discountP = Math.round(((prod.basePrice - prod.promotionalPrice) / prod.basePrice) * 100);
        setProductDiscountPercent(discountP.toString());
      } else {
        setProductDiscountPercent("0");
      }
    }
  };

  // Kalkulacja produktu na żywo
  const productCalc = useMemo(() => {
    return calculateProductMargin({
      purchasePrice: parseFloat(productPurchasePrice) || 0,
      isPurchasePriceGross: productIsPurchaseGross,
      extraUnitCost: parseFloat(productExtraUnitCost) || 0,
      sellingPrice: parseFloat(productSellingPrice) || 0,
      isSellingPriceGross: true,
      discountPercent: parseFloat(productDiscountPercent) || 0,
      vatRate: productVatRate,
      settings,
      assumeFreeShipping: productAssumeFreeShipping,
      packagingCost: parseFloat(productPackagingCost) || 0,
      paymentMethod: productPaymentMethod,
      freebieCost: parseFloat(productFreebieCost) || 0,
      laborCost: parseFloat(productLaborCost) || 0,
    });
  }, [
    productPurchasePrice,
    productIsPurchaseGross,
    productExtraUnitCost,
    productSellingPrice,
    productDiscountPercent,
    productVatRate,
    settings,
    productAssumeFreeShipping,
    productPackagingCost,
    productPaymentMethod,
    productFreebieCost,
    productLaborCost,
  ]);

  // Symulacja odwrotna ceny
  const reversePriceCalc = useMemo(() => {
    return simulateRequiredSellingPrice({
      targetMarginPercent: parseFloat(reverseTargetMargin) || 30,
      purchasePrice: parseFloat(productPurchasePrice) || 0,
      isPurchasePriceGross: productIsPurchaseGross,
      extraUnitCost: parseFloat(productExtraUnitCost) || 0,
      discountPercent: parseFloat(productDiscountPercent) || 0,
      vatRate: productVatRate,
      settings,
      assumeFreeShipping: productAssumeFreeShipping,
      packagingCost: parseFloat(productPackagingCost) || 4.50,
      freebieCost: parseFloat(productFreebieCost) || 0,
      laborCost: parseFloat(productLaborCost) || 0,
    });
  }, [
    reverseTargetMargin,
    productPurchasePrice,
    productIsPurchaseGross,
    productExtraUnitCost,
    productDiscountPercent,
    productVatRate,
    settings,
    productAssumeFreeShipping,
    productPackagingCost,
    productFreebieCost,
    productLaborCost,
  ]);

  // ───────────────────────────────────────────────────────────────────────────
  // STAN WIDOKU B: ZAMÓWIENIE
  // ───────────────────────────────────────────────────────────────────────────
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    orders.length > 0 ? orders[0].id : ""
  );
  const currentOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId || o.orderNumber === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  // Formularz edycji faktycznych kosztów zamówienia
  const [orderActualShipping, setOrderActualShipping] = useState<string>("11.99");
  const [orderPackagingCost, setOrderPackagingCost] = useState<string>("4.50");
  const [orderPaymentFee, setOrderPaymentFee] = useState<string>("3.50");
  const [orderIsFeeSettled, setOrderIsFeeSettled] = useState<boolean>(false);
  const [orderFreebieCost, setOrderFreebieCost] = useState<string>("0.00");
  const [orderLaborCost, setOrderLaborCost] = useState<string>("0.00");
  const [orderExtraCosts, setOrderExtraCosts] = useState<{ name: string; amount: number }[]>([]);
  const [orderNewExtraName, setOrderNewExtraName] = useState<string>("");
  const [orderNewExtraAmount, setOrderNewExtraAmount] = useState<string>("");

  // Przy zmianie zamówienia, zsynchronizuj formularz
  React.useEffect(() => {
    if (currentOrder) {
      const custom = currentOrder.customOrderCosts || {};
      let defaultShip = 11.99;
      if (currentOrder.shippingMethod === "COURIER") defaultShip = 15.00;
      if (currentOrder.shippingMethod === "LOCAL_PICKUP") defaultShip = 0;

      setOrderActualShipping(
        custom.actualShippingCost !== undefined ? custom.actualShippingCost.toString() : defaultShip.toString()
      );
      setOrderPackagingCost(
        custom.packagingCost !== undefined ? custom.packagingCost.toString() : "4.50"
      );
      setOrderPaymentFee(
        custom.paymentFeeSettled !== undefined
          ? custom.paymentFeeSettled.toString()
          : custom.paymentFeeEstimated !== undefined
            ? custom.paymentFeeEstimated.toString()
            : (((currentOrder.totalAmount * 1.2) / 100) + 0.30).toFixed(2)
      );
      setOrderIsFeeSettled(Boolean(custom.isPaymentFeeSettled));
      setOrderFreebieCost(
        custom.freebiesCost !== undefined ? custom.freebiesCost.toString() : "0.00"
      );
      setOrderLaborCost(
        custom.handlingLaborCost !== undefined ? custom.handlingLaborCost.toString() : "0.00"
      );
      setOrderExtraCosts(custom.extraCosts || []);
    }
  }, [currentOrder]);

  // Obliczenie rentowności zamówienia na żywo
  const orderCalc = useMemo(() => {
    if (!currentOrder) return null;
    const modifiedOrder: Order = {
      ...currentOrder,
      customOrderCosts: {
        ...currentOrder.customOrderCosts,
        actualShippingCost: parseFloat(orderActualShipping) || 0,
        packagingCost: parseFloat(orderPackagingCost) || 0,
        paymentFeeEstimated: parseFloat(orderPaymentFee) || 0,
        paymentFeeSettled: orderIsFeeSettled ? parseFloat(orderPaymentFee) || 0 : undefined,
        isPaymentFeeSettled: orderIsFeeSettled,
        freebiesCost: parseFloat(orderFreebieCost) || 0,
        handlingLaborCost: parseFloat(orderLaborCost) || 0,
        extraCosts: orderExtraCosts,
      },
    };
    return calculateOrderMargin(modifiedOrder, settings, productsMap);
  }, [
    currentOrder,
    settings,
    productsMap,
    orderActualShipping,
    orderPackagingCost,
    orderPaymentFee,
    orderIsFeeSettled,
    orderFreebieCost,
    orderLaborCost,
    orderExtraCosts,
  ]);

  // Zapis kosztów zamówienia na serwerze
  const handleSaveOrderCosts = async () => {
    if (!currentOrder) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      const updatedCosts = {
        actualShippingCost: parseFloat(orderActualShipping) || 0,
        packagingCost: parseFloat(orderPackagingCost) || 0,
        paymentFeeEstimated: parseFloat(orderPaymentFee) || 0,
        paymentFeeSettled: orderIsFeeSettled ? parseFloat(orderPaymentFee) || 0 : undefined,
        isPaymentFeeSettled: orderIsFeeSettled,
        freebiesCost: parseFloat(orderFreebieCost) || 0,
        handlingLaborCost: parseFloat(orderLaborCost) || 0,
        extraCosts: orderExtraCosts,
      };

      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: currentOrder.id,
          customOrderCosts: updatedCosts,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Błąd zapisu kosztów zamówienia.");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === currentOrder.id ? { ...o, customOrderCosts: updatedCosts } : o))
      );
      setFeedback({ type: "success", text: "Faktyczne koszty zamówienia zostały trwale zapisane." });
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // STAN WIDOKU C: MIESIĄC
  // ───────────────────────────────────────────────────────────────────────────
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);

  // Dodawanie zakupu magazynowego
  const [newInvDate, setNewInvDate] = useState<string>(now.toISOString().slice(0, 10));
  const [newInvTitle, setNewInvTitle] = useState<string>("");
  const [newInvAmount, setNewInvAmount] = useState<string>("");

  const monthlySummary = useMemo(() => {
    return calculateMonthlySummary({
      year: selectedYear,
      month: selectedMonth,
      orders,
      settings,
      productsMap,
    });
  }, [selectedYear, selectedMonth, orders, settings, productsMap]);

  // ───────────────────────────────────────────────────────────────────────────
  // STAN ZAKŁADKI KONFIGURACJI KOSZTÓW STAŁYCH & ZASAD
  // ───────────────────────────────────────────────────────────────────────────
  const [newCostName, setNewCostName] = useState("");
  const [newCostCategory, setNewCostCategory] = useState<any>("SOFTWARE");
  const [newCostAmount, setNewCostAmount] = useState("");
  const [newCostFrequency, setNewCostFrequency] = useState<any>("MONTHLY");
  const [newCostOnlineShare, setNewCostOnlineShare] = useState("100");

  const handleAddFixedCost = () => {
    if (!newCostName || !newCostAmount) return;
    const item: FixedCostItem = {
      id: `cost-${Date.now()}`,
      name: newCostName.trim(),
      category: newCostCategory,
      amount: parseFloat(newCostAmount) || 0,
      vatRate: 23,
      isVatDeductible: true,
      frequency: newCostFrequency,
      onlineSharePercentage: parseFloat(newCostOnlineShare) || 100,
      isActive: true,
    };
    setSettings((prev) => ({
      ...prev,
      fixedCosts: [...prev.fixedCosts, item],
    }));
    setNewCostName("");
    setNewCostAmount("");
  };

  const handleToggleFixedCost = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      fixedCosts: prev.fixedCosts.map((fc) => (fc.id === id ? { ...fc, isActive: !fc.isActive } : fc)),
    }));
  };

  const handleDeleteFixedCost = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      fixedCosts: prev.fixedCosts.filter((fc) => fc.id !== id),
    }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/cost-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd zapisu ustawień.");
      setFeedback({ type: "success", text: "Konfiguracja kalkulatora kosztów została trwale zapisana w bazie Neon." });
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInventoryPurchase = () => {
    if (!newInvTitle || !newInvAmount) return;
    const newPurchase = {
      id: `inv-${Date.now()}`,
      date: newInvDate,
      title: newInvTitle.trim(),
      amount: parseFloat(newInvAmount) || 0,
      vatRate: 23,
    };
    const updatedPurchases = [...(settings.inventoryPurchases || []), newPurchase];
    const updatedSettings = { ...settings, inventoryPurchases: updatedPurchases };
    setSettings(updatedSettings);
    setNewInvTitle("");
    setNewInvAmount("");
  };

  return (
    <div className="space-y-6">
      {/* NAGŁÓWEK GŁÓWNY Z LINKAMI NAWIGACYJNYMI */}
      <div className="bg-white p-5 border border-[#EADFD5] rounded shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-[#FAF6F1] border border-[#C5A069]/40 text-[#7A5B20] rounded">
              <Calculator className="w-5 h-5 text-[#C5A069]" />
            </span>
            <h1 className="font-serif text-xl sm:text-2xl text-[#241D1B] tracking-tight">
              Koszty & Kalkulator Marży
            </h1>
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                settings.vatMode === "VAT_ACTIVE"
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {settings.vatMode === "VAT_ACTIVE" ? "VAT Czynna (netto)" : "VAT Zwolniona (brutto)"}
            </span>
          </div>
          <p className="text-xs text-[#6E6259]">
            Moduł zarządczy rentowności: marża towarowa, narzut, koszty zamówienia, alokacja kosztów stałych oraz zestawienia miesięczne.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          <Link
            href="/admin/rozliczenia"
            className="px-3 py-2 bg-[#FAF6F1] border border-[#EADFD5] hover:border-[#C5A069] text-xs font-semibold text-[#241D1B] rounded transition-colors"
          >
            ← Rozliczenia
          </Link>
          <Link
            href="/admin/ustawienia"
            className="px-3 py-2 bg-[#FAF6F1] border border-[#EADFD5] hover:border-[#C5A069] text-xs font-semibold text-[#241D1B] rounded transition-colors"
          >
            Ustawienia Butiku
          </Link>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-4 py-2 bg-[#241D1B] hover:bg-[#3E3835] text-white text-xs uppercase tracking-wider font-semibold rounded flex items-center gap-1.5 shadow-2xs disabled:opacity-50 transition-all"
          >
            <Save className="w-3.5 h-3.5 text-[#C5A069]" />
            <span>{isSaving ? "Zapisywanie..." : "Zapisz zasady"}</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedback && (
        <div
          className={`p-3 rounded text-xs flex items-center gap-2 border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* PASEK ZAKŁADEK / WIDOKÓW */}
      <div className="flex items-center gap-1 border-b border-[#EADFD5] pb-px overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("PRODUCT")}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-t transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "PRODUCT"
              ? "bg-white border-t-2 border-x border-t-[#C5A069] border-x-[#EADFD5] text-[#241D1B] shadow-2xs"
              : "text-[#6E6259] hover:text-[#241D1B] hover:bg-[#FAF6F1]"
          }`}
        >
          <Package className="w-3.5 h-3.5 text-[#C5A069]" />
          <span>Widok Produktu</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ORDER")}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-t transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "ORDER"
              ? "bg-white border-t-2 border-x border-t-[#C5A069] border-x-[#EADFD5] text-[#241D1B] shadow-2xs"
              : "text-[#6E6259] hover:text-[#241D1B] hover:bg-[#FAF6F1]"
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5 text-[#C5A069]" />
          <span>Widok Zamówienia</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("MONTH")}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-t transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "MONTH"
              ? "bg-white border-t-2 border-x border-t-[#C5A069] border-x-[#EADFD5] text-[#241D1B] shadow-2xs"
              : "text-[#6E6259] hover:text-[#241D1B] hover:bg-[#FAF6F1]"
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-[#C5A069]" />
          <span>Widok Miesiąca</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("CONFIG")}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-t transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "CONFIG"
              ? "bg-white border-t-2 border-x border-t-[#C5A069] border-x-[#EADFD5] text-[#241D1B] shadow-2xs"
              : "text-[#6E6259] hover:text-[#241D1B] hover:bg-[#FAF6F1]"
          }`}
        >
          <SettingsIcon className="w-3.5 h-3.5 text-[#C5A069]" />
          <span>Koszty Stałe & Zasady</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* TAB A: WIDOK PRODUKTU */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {activeTab === "PRODUCT" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEWA KOLUMNA: PARAMETRY SYMULACJI PRODUKTU */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white p-5 border border-[#EADFD5] rounded shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#EADFD5]">
                <h2 className="font-serif text-sm uppercase tracking-wider text-[#241D1B]">
                  Parametry Produktu & Zakupu
                </h2>
                <span className="text-[10px] text-[#6E6259]">Kalkulacja jednostkowa</span>
              </div>

              {/* Wybór produktu z bazy sklepu (opcjonalny) */}
              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Wybierz produkt z katalogu (opcjonalnie):
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleSelectStoreProduct(e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2 text-xs text-[#241D1B] rounded focus:outline-none focus:border-[#C5A069]"
                >
                  <option value="">-- Wpisz dane ręcznie (dowolna symulacja) --</option>
                  {initialProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.basePrice.toFixed(2)} zł) {p.purchasePrice ? `[zakup: ${p.purchasePrice} zł]` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Cena zakupu za szt. (PLN) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productPurchasePrice}
                    onChange={(e) => setProductPurchasePrice(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2 text-xs font-bold text-[#241D1B] rounded focus:outline-none focus:border-[#C5A069]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Koszt dodatkowy (transport hurtownia)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productExtraUnitCost}
                    onChange={(e) => setProductExtraUnitCost(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2 text-xs text-[#241D1B] rounded focus:outline-none focus:border-[#C5A069]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#EADFD5]">
                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Planowana cena sprzedaży (brutto) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productSellingPrice}
                    onChange={(e) => setProductSellingPrice(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2 text-xs font-bold text-[#241D1B] rounded focus:outline-none focus:border-[#C5A069]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Planowany rabat (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={productDiscountPercent}
                    onChange={(e) => setProductDiscountPercent(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2 text-xs text-[#241D1B] rounded focus:outline-none focus:border-[#C5A069]"
                  />
                </div>
              </div>

              {/* Założenia dotyczące zamówienia */}
              <div className="pt-3 border-t border-[#EADFD5] space-y-3">
                <p className="text-[11px] uppercase font-bold tracking-wider text-[#857670]">
                  Założenia kosztów wysyłki i zamówienia
                </p>

                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={productAssumeFreeShipping}
                    onChange={(e) => setProductAssumeFreeShipping(e.target.checked)}
                    className="w-4 h-4 accent-[#C5A069] rounded"
                  />
                  <span>Darmowa dostawa dla klientki (butik pokrywa koszt {settings.defaultActualShippingCostInpost || 11.99} zł)</span>
                </label>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-[#6E6259] block">Opakowanie</label>
                    <input
                      type="number"
                      step="0.10"
                      value={productPackagingCost}
                      onChange={(e) => setProductPackagingCost(e.target.value)}
                      className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-1.5 text-xs text-[#241D1B] rounded"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6E6259] block">Płatność</label>
                    <select
                      value={productPaymentMethod}
                      onChange={(e) => setProductPaymentMethod(e.target.value)}
                      className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-1.5 text-xs text-[#241D1B] rounded"
                    >
                      <option value="BLIK">PayU BLIK (1.2%)</option>
                      <option value="PRZELEWY24">Przelewy24 (1.25%)</option>
                      <option value="TRADITIONAL_TRANSFER">Przelew trad. (0%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6E6259] block">Gratis (np. skarpetki)</label>
                    <input
                      type="number"
                      step="0.50"
                      value={productFreebieCost}
                      onChange={(e) => setProductFreebieCost(e.target.value)}
                      className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-1.5 text-xs text-[#241D1B] rounded"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SYMULACJA ODWROTNA: JAKA CENA ZAPEWNI WYBRANĄ MARŻĘ? */}
            <div className="bg-[#FAF6F1] p-5 border border-[#C5A069]/40 rounded shadow-2xs space-y-3">
              <div className="flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-[#C5A069]" />
                <h3 className="font-serif text-xs uppercase tracking-wider text-[#241D1B] font-bold">
                  Symulacja: Jaka cena zapewni wybraną marżę po kosztach?
                </h3>
              </div>
              <p className="text-[11px] text-[#6E6259] leading-relaxed">
                Wpisz docelową marżę operacyjną po uwzględnieniu COGS, wysyłki, prowizji bramki i rabatu:
              </p>

              <div className="flex items-center gap-3">
                <div className="w-28">
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={reverseTargetMargin}
                      onChange={(e) => setReverseTargetMargin(e.target.value)}
                      className="w-full bg-white border border-[#C5A069] p-2 text-xs font-bold text-[#241D1B] rounded pr-6"
                    />
                    <span className="absolute right-2 top-2 text-xs text-[#7A5B20] font-bold">%</span>
                  </div>
                </div>

                <div className="flex-1 bg-white p-2.5 rounded border border-[#EADFD5] text-xs">
                  <span className="text-[10px] text-[#857670] block">Wymagana cena na półce:</span>
                  <span className="font-bold text-[#7A5B20] text-sm">
                    {reversePriceCalc.isPossible
                      ? `${reversePriceCalc.requiredSellingPriceGross.toFixed(2)} zł brutto`
                      : "Niemożliwa"}
                  </span>
                </div>
              </div>
              <p className="text-[10.5px] text-[#6E6259] italic">{reversePriceCalc.explanation}</p>
            </div>
          </div>

          {/* PRAWA KOLUMNA: WYNIKI I ROZBICIE KROK PO KROKU */}
          <div className="lg:col-span-7 space-y-5">
            {/* KARTY GŁÓWNYCH METRYK */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 border border-[#EADFD5] rounded shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-[#857670] block">Marża towarowa</span>
                <span className="font-serif text-lg font-bold text-[#241D1B]">
                  {productCalc.tradeMarginPercent.toFixed(1)}%
                </span>
                <span className="text-[10px] text-[#6E6259] block mt-0.5">
                  ({productCalc.tradeProfit.toFixed(2)} zł)
                </span>
              </div>

              <div className="bg-white p-3.5 border border-[#EADFD5] rounded shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-[#857670] block">Narzut (Markup)</span>
                <span className="font-serif text-lg font-bold text-[#7A5B20]">
                  {productCalc.markupPercent.toFixed(1)}%
                </span>
                <span className="text-[10px] text-[#6E6259] block mt-0.5">na koszt zakupu</span>
              </div>

              <div className="bg-white p-3.5 border border-[#EADFD5] rounded shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-[#857670] block">Po kosztach paczki</span>
                <span className="font-serif text-lg font-bold text-[#241D1B]">
                  {productCalc.amountAfterDirectCosts.toFixed(2)} zł
                </span>
                <span className="text-[10px] text-[#6E6259] block mt-0.5">
                  ({productCalc.directMarginPercent.toFixed(1)}%)
                </span>
              </div>

              <div
                className={`p-3.5 border rounded shadow-2xs ${
                  productCalc.isLoss
                    ? "bg-red-50 border-red-200 text-red-900"
                    : "bg-[#FAF6F1] border-[#C5A069]/40 text-[#241D1B]"
                }`}
              >
                <span className="text-[10px] uppercase font-bold block">Wynik operacyjny</span>
                <span
                  className={`font-serif text-lg font-bold ${
                    productCalc.isLoss ? "text-red-700 font-extrabold" : "text-[#7A5B20]"
                  }`}
                >
                  {productCalc.operatingResult.toFixed(2)} zł
                </span>
                <span className="text-[10px] block mt-0.5 font-medium">
                  {productCalc.isLoss ? "STRATA" : `${productCalc.operatingMarginPercent.toFixed(1)}% rentowności`}
                </span>
              </div>
            </div>

            {/* OSTRZEŻENIE O STRACIE */}
            {productCalc.isLoss && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Uwaga: Ta sprzedaż przynosi stratę operacyjną!</p>
                  <p className="text-[11px] mt-0.5">
                    Po odliczeniu kosztów zakupu ({productCalc.cogs.toFixed(2)} zł), kosztów zamówienia ({productCalc.totalOrderDirectCosts.toFixed(2)} zł) i udziału w kosztach stałych ({productCalc.allocatedOverheadCost.toFixed(2)} zł), zysk jest ujemny. Zwiększ cenę sprzedaży lub zmniejsz rabat.
                  </p>
                </div>
              </div>
            )}

            {/* ROZWINIĘCIE KROK PO KROKU */}
            <div className="bg-white p-5 border border-[#EADFD5] rounded shadow-2xs space-y-4">
              <h3 className="font-serif text-sm uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5] flex items-center justify-between">
                <span>Szczegółowe Rozliczenie Matematyczne (Krok po kroku)</span>
                <span className="text-[10px] font-mono text-[#857670] lowercase">pl-PL</span>
              </h3>

              <div className="divide-y divide-[#EADFD5] text-xs">
                {productCalc.breakdownSteps.map((step, i) => (
                  <div key={i} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex-1">
                      <span className="font-semibold text-[#241D1B] block">{step.label}</span>
                      <span className="text-[11px] text-[#6E6259] font-mono">{step.formula}</span>
                      {step.hint && <p className="text-[10.5px] text-[#857670] italic mt-0.5">{step.hint}</p>}
                    </div>
                    <span className="font-mono font-bold text-sm text-[#241D1B] shrink-0 text-right">
                      {step.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* TAB B: WIDOK ZAMÓWIENIA */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {activeTab === "ORDER" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEWA KOLUMNA: WYBÓR ZAMÓWIENIA I KOSZTY FAKTYCZNE */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white p-5 border border-[#EADFD5] rounded shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#EADFD5]">
                <h2 className="font-serif text-sm uppercase tracking-wider text-[#241D1B]">
                  Wybór Zamówienia ze Sklepu
                </h2>
                <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                  Tylko produkcyjne ({orders.length})
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                  Wybierz zamówienie:
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2 text-xs text-[#241D1B] font-mono rounded focus:outline-none focus:border-[#C5A069]"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} ({new Date(o.createdAt).toLocaleDateString("pl-PL")}) • {o.totalAmount.toFixed(2)} zł • {o.paymentStatus}
                    </option>
                  ))}
                </select>
              </div>

              {currentOrder && (
                <div className="p-3 bg-[#FAF6F1] rounded border border-[#EADFD5] text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#6E6259]">Klientka:</span>
                    <span className="font-semibold text-[#241D1B]">{currentOrder.customerFirstName} {currentOrder.customerLastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6E6259]">Metoda dostawy:</span>
                    <span className="font-medium text-[#241D1B]">{currentOrder.shippingMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6E6259]">Opłata za dostawę od klientki:</span>
                    <span className="font-semibold text-emerald-700">{currentOrder.shippingCost?.toFixed(2)} zł</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6E6259]">Wartość produktów:</span>
                    <span className="font-bold text-[#241D1B]">{currentOrder.subtotalAmount?.toFixed(2)} zł</span>
                  </div>
                </div>
              )}

              {/* EDYCJA RZECZYWISTYCH KOSZTÓW ZAMÓWIENIA */}
              <div className="pt-3 border-t border-[#EADFD5] space-y-3">
                <h3 className="text-xs font-serif uppercase tracking-wider text-[#241D1B] font-bold">
                  Uzupełnij faktyczne koszty zamówienia
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                      Rzeczywisty koszt wysyłki (butik)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={orderActualShipping}
                      onChange={(e) => setOrderActualShipping(e.target.value)}
                      className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2 text-xs font-bold text-[#241D1B] rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                      Koszt opakowania
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={orderPackagingCost}
                      onChange={(e) => setOrderPackagingCost(e.target.value)}
                      className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2 text-xs text-[#241D1B] rounded"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                      Prowizja płatnicza (PLN)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={orderPaymentFee}
                      onChange={(e) => setOrderPaymentFee(e.target.value)}
                      className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2 text-xs font-bold text-[#241D1B] rounded"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={orderIsFeeSettled}
                        onChange={(e) => setOrderIsFeeSettled(e.target.checked)}
                        className="w-4 h-4 accent-[#C5A069] rounded"
                      />
                      <span>Prowizja ostatecznie rozliczona</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                      Koszt gratisu (np. skarpetki)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={orderFreebieCost}
                      onChange={(e) => setOrderFreebieCost(e.target.value)}
                      className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2 text-xs text-[#241D1B] rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                      Koszt kompletowania / pakowania
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={orderLaborCost}
                      onChange={(e) => setOrderLaborCost(e.target.value)}
                      className="w-full bg-[#FAF6F1] border border-[#EADFD5] p-2 text-xs text-[#241D1B] rounded"
                    />
                  </div>
                </div>

                {/* Dodatkowe koszty z własną nazwą */}
                <div className="pt-2 border-t border-[#EADFD5] space-y-2">
                  <label className="text-xs font-semibold text-[#241D1B] block">
                    Inne koszty z własną nazwą:
                  </label>
                  {orderExtraCosts.map((ec, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className="flex-1 text-[#241D1B] font-medium truncate">{ec.name}</span>
                      <span className="font-bold text-[#241D1B]">{ec.amount.toFixed(2)} zł</span>
                      <button
                        type="button"
                        onClick={() => setOrderExtraCosts((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nazwa, np. Dodatkowa wstążka"
                      value={orderNewExtraName}
                      onChange={(e) => setOrderNewExtraName(e.target.value)}
                      className="flex-1 bg-[#FAF6F1] border border-[#EADFD5] p-1.5 text-xs text-[#241D1B] rounded"
                    />
                    <input
                      type="number"
                      step="0.10"
                      placeholder="Kwota"
                      value={orderNewExtraAmount}
                      onChange={(e) => setOrderNewExtraAmount(e.target.value)}
                      className="w-20 bg-[#FAF6F1] border border-[#EADFD5] p-1.5 text-xs text-[#241D1B] rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!orderNewExtraName || !orderNewExtraAmount) return;
                        setOrderExtraCosts([
                          ...orderExtraCosts,
                          { name: orderNewExtraName.trim(), amount: parseFloat(orderNewExtraAmount) || 0 },
                        ]);
                        setOrderNewExtraName("");
                        setOrderNewExtraAmount("");
                      }}
                      className="p-1.5 bg-[#241D1B] text-white rounded hover:bg-[#3E3835]"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleSaveOrderCosts}
                    disabled={isSaving}
                    className="w-full py-2 bg-[#FAF6F1] border border-[#C5A069] text-[#7A5B20] hover:bg-[#C5A069] hover:text-white rounded text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Zapisz koszty w tym zamówieniu</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PRAWA KOLUMNA: WYNIK I POZYCJE ZAMÓWIENIA */}
          <div className="lg:col-span-7 space-y-5">
            {orderCalc && (
              <>
                {/* WSKAŹNIKI ZAMÓWIENIA */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-3.5 border border-[#EADFD5] rounded shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-[#857670] block">Marża towarowa</span>
                    <span className="font-serif text-lg font-bold text-[#241D1B]">
                      {orderCalc.tradeMarginPercent.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-[#6E6259] block mt-0.5">
                      ({orderCalc.tradeProfit.toFixed(2)} zł)
                    </span>
                  </div>

                  <div className="bg-white p-3.5 border border-[#EADFD5] rounded shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-[#857670] block">Bilans dostawy</span>
                    <span
                      className={`font-serif text-lg font-bold ${
                        orderCalc.shippingMargin < 0 ? "text-amber-700" : "text-emerald-700"
                      }`}
                    >
                      {orderCalc.shippingMargin > 0 ? "+" : ""}
                      {orderCalc.shippingMargin.toFixed(2)} zł
                    </span>
                    <span className="text-[10px] text-[#6E6259] block mt-0.5">
                      {orderCalc.shippingMargin < 0 ? "Dopłata butiku" : "Zysk na dostawie"}
                    </span>
                  </div>

                  <div className="bg-white p-3.5 border border-[#EADFD5] rounded shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-[#857670] block">Po kosztach paczki</span>
                    <span className="font-serif text-lg font-bold text-[#241D1B]">
                      {orderCalc.amountAfterDirectCosts.toFixed(2)} zł
                    </span>
                    <span className="text-[10px] text-[#6E6259] block mt-0.5">Marża pokrycia</span>
                  </div>

                  <div
                    className={`p-3.5 border rounded shadow-2xs ${
                      orderCalc.isLoss
                        ? "bg-red-50 border-red-200 text-red-900"
                        : "bg-[#FAF6F1] border-[#C5A069]/40 text-[#241D1B]"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold block">Wynik operacyjny</span>
                    <span
                      className={`font-serif text-lg font-bold ${
                        orderCalc.isLoss ? "text-red-700 font-extrabold" : "text-[#7A5B20]"
                      }`}
                    >
                      {orderCalc.operatingResult.toFixed(2)} zł
                    </span>
                    <span className="text-[10px] block mt-0.5 font-medium">po kosztach stałych</span>
                  </div>
                </div>

                {/* POZYCJE ZAMÓWIENIA ZE SNAPSHOTAMI KOSZTÓW */}
                <div className="bg-white p-5 border border-[#EADFD5] rounded shadow-2xs space-y-3">
                  <h3 className="font-serif text-sm uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
                    Pozycje w zamówieniu ({orderCalc.itemsBreakdown.length})
                  </h3>

                  <div className="divide-y divide-[#EADFD5] text-xs">
                    {orderCalc.itemsBreakdown.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <span className="font-semibold text-[#241D1B]">{item.productName}</span>
                          <span className="text-[#6E6259] block text-[11px]">{item.variant} • {item.quantity} szt.</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[#6E6259] text-[11px] block">
                            Koszt zakupu: {item.totalItemCogs.toFixed(2)} zł
                          </span>
                          <span className="font-bold text-[#241D1B] text-xs">
                            Sprzedaż: {item.sellingPrice.toFixed(2)} zł
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ROZBICIE KROK PO KROKU */}
                <div className="bg-white p-5 border border-[#EADFD5] rounded shadow-2xs space-y-3">
                  <h3 className="font-serif text-sm uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
                    Rozliczenie finansowe zamówienia
                  </h3>
                  <div className="divide-y divide-[#EADFD5] text-xs">
                    {orderCalc.breakdownSteps.map((step, i) => (
                      <div key={i} className="py-2 flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-[#241D1B]">{step.label}</span>
                          <span className="text-[11px] text-[#6E6259] block">{step.formula}</span>
                        </div>
                        <span className="font-mono font-bold text-[#241D1B] text-sm">{step.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* TAB C: WIDOK MIESIĄCA */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {activeTab === "MONTH" && (
        <div className="space-y-6">
          {/* PASEK WYBORU MIESIĄCA I EKSPORT CSV */}
          <div className="bg-white p-4 border border-[#EADFD5] rounded shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#241D1B]">Wybierz okres:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="bg-[#FAF6F1] border border-[#EADFD5] p-2 text-xs font-semibold text-[#241D1B] rounded"
              >
                {[
                  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
                  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
                ].map((mName, i) => (
                  <option key={i + 1} value={i + 1}>{mName}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="bg-[#FAF6F1] border border-[#EADFD5] p-2 text-xs font-semibold text-[#241D1B] rounded"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>

            <a
              href={`/api/admin/cost-calculator/export?year=${selectedYear}&month=${selectedMonth}`}
              download
              className="px-4 py-2 bg-[#FAF6F1] border border-[#C5A069] text-[#7A5B20] hover:bg-[#C5A069] hover:text-white rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Eksportuj do CSV (Excel)</span>
            </a>
          </div>

          {/* GŁÓWNE KPI MIESIĘCZNE */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 border border-[#EADFD5] rounded shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-[#857670] block">Przychód ze sprzedaży</span>
              <span className="font-serif text-xl font-bold text-[#241D1B]">
                {monthlySummary.grossSalesRevenue.toFixed(2)} zł
              </span>
              <span className="text-[10px] text-[#6E6259] block mt-1">
                {monthlySummary.paidOrdersCount} opłaconych zamówień
              </span>
            </div>

            <div className="bg-white p-4 border border-[#EADFD5] rounded shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-[#857670] block">Koszt towarów (COGS)</span>
              <span className="font-serif text-xl font-bold text-[#A84B4B]">
                −{monthlySummary.totalCogs.toFixed(2)} zł
              </span>
              <span className="text-[10px] text-[#6E6259] block mt-1">
                Średnia marża towarowa: <strong>{monthlySummary.tradeMarginPercent.toFixed(1)}%</strong>
              </span>
            </div>

            <div className="bg-white p-4 border border-[#EADFD5] rounded shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-[#857670] block">Koszty bezpośrednie paczek</span>
              <span className="font-serif text-xl font-bold text-[#241D1B]">
                −{monthlySummary.totalDirectCosts.toFixed(2)} zł
              </span>
              <span className="text-[10px] text-[#6E6259] block mt-1">
                Wysyłki, opakowania, prowizje
              </span>
            </div>

            <div
              className={`p-4 border rounded shadow-2xs ${
                monthlySummary.isLoss
                  ? "bg-red-50 border-red-200 text-red-900"
                  : "bg-[#FAF6F1] border-[#C5A069]/40 text-[#241D1B]"
              }`}
            >
              <span className="text-[10px] uppercase font-bold block">Wynik operacyjny przed podatkiem</span>
              <span
                className={`font-serif text-xl font-bold ${
                  monthlySummary.isLoss ? "text-red-700 font-extrabold" : "text-[#7A5B20]"
                }`}
              >
                {monthlySummary.operatingResultBeforeTax.toFixed(2)} zł
              </span>
              <span className="text-[10px] block mt-1 font-medium">
                {monthlySummary.isLoss ? "STRATA W TYM MIESIĄCU" : `Rentowność: ${monthlySummary.operatingMarginPercent.toFixed(1)}%`}
              </span>
            </div>
          </div>

          {/* BILANS KOSZTÓW STAŁYCH & MAGAZYN */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* KOSZTY STAŁE PRZYPISANE DO TEGO MIESIĄCA */}
            <div className="lg:col-span-7 bg-white p-5 border border-[#EADFD5] rounded shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#EADFD5]">
                <h3 className="font-serif text-sm uppercase tracking-wider text-[#241D1B]">
                  Koszty Stałe Butiku (Miesiąc: {monthlySummary.monthLabel})
                </h3>
                <span className="font-mono text-xs font-bold text-[#241D1B]">
                  Razem: {monthlySummary.totalMonthlyAllocatedOverhead.toFixed(2)} zł
                </span>
              </div>

              <div className="divide-y divide-[#EADFD5] text-xs">
                {monthlySummary.fixedCostsBreakdown.map((fc) => (
                  <div key={fc.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-semibold text-[#241D1B] block">{fc.name}</span>
                      <span className="text-[11px] text-[#6E6259]">
                        {fc.frequency === "ANNUAL" ? "Roczny (1/12 w kalkulacji)" : fc.frequency === "MONTHLY" ? "Miesięczny" : "Jednorazowy"} • {fc.onlineShare}% dla sklepu online
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#241D1B] block font-mono">
                        {fc.monthlyAllocatedAmount.toFixed(2)} zł
                      </span>
                      {fc.actualCashOutlay > 0 && (
                        <span className="text-[10px] text-[#857670] block">
                          Wydatek gotówkowy: {fc.actualCashOutlay.toFixed(2)} zł
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SEKCJA: WYDATKI NA ZAPAS MAGAZYNOWY (POKAZYWANE OSOBNO) */}
            <div className="lg:col-span-5 bg-white p-5 border border-[#EADFD5] rounded shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#EADFD5]">
                <h3 className="font-serif text-sm uppercase tracking-wider text-[#241D1B]">
                  Wydatki na zapas magazynowy
                </h3>
                <span className="text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-semibold">
                  Aktywo / Magazyn
                </span>
              </div>

              <div className="p-3 bg-[#FAF6F1] rounded border border-[#EADFD5] text-xs text-[#6E6259] leading-relaxed">
                <strong>Zasada księgowa:</strong> Zakup niesprzedanego towaru stanowi wydatek gotówkowy, ale nie pomniejsza wyniku operacyjnego jako koszt, dopóki towar nie zostanie sprzedany (COGS).
              </div>

              <div className="flex justify-between items-center text-xs font-bold pt-1">
                <span>Łączny zakup zapasów w tym miesiącu:</span>
                <span className="font-mono text-sm text-[#7A5B20]">{monthlySummary.inventoryPurchasesOutlay.toFixed(2)} zł</span>
              </div>

              {/* Dodawanie nowego zakupu magazynowego */}
              <div className="pt-2 border-t border-[#EADFD5] space-y-2">
                <span className="text-[11px] font-semibold text-[#241D1B] block">Dodaj zakup towaru z hurtowni:</span>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newInvDate}
                    onChange={(e) => setNewInvDate(e.target.value)}
                    className="w-32 bg-[#FAF6F1] border border-[#EADFD5] p-1.5 text-xs text-[#241D1B] rounded"
                  />
                  <input
                    type="text"
                    placeholder="Opis, np. Faktura FV/123/2026 Sukienki"
                    value={newInvTitle}
                    onChange={(e) => setNewInvTitle(e.target.value)}
                    className="flex-1 bg-[#FAF6F1] border border-[#EADFD5] p-1.5 text-xs text-[#241D1B] rounded"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Kwota"
                    value={newInvAmount}
                    onChange={(e) => setNewInvAmount(e.target.value)}
                    className="w-24 bg-[#FAF6F1] border border-[#EADFD5] p-1.5 text-xs font-bold text-[#241D1B] rounded"
                  />
                  <button
                    type="button"
                    onClick={handleAddInventoryPurchase}
                    className="p-1.5 bg-[#241D1B] text-white rounded hover:bg-[#3E3835]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Lista zakupów magazynowych w danym miesiącu */}
              {monthlySummary.inventoryPurchasesList.length > 0 && (
                <div className="divide-y divide-[#EADFD5] text-xs pt-1">
                  {monthlySummary.inventoryPurchasesList.map((ip) => (
                    <div key={ip.id} className="py-1.5 flex justify-between items-center">
                      <div>
                        <span className="font-medium text-[#241D1B] block">{ip.title}</span>
                        <span className="text-[10px] text-[#6E6259]">{ip.date}</span>
                      </div>
                      <span className="font-mono font-bold text-[#241D1B]">{ip.amount.toFixed(2)} zł</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* TABELA ZAMÓWIEŃ MIESIĄCA */}
          <div className="bg-white p-5 border border-[#EADFD5] rounded shadow-2xs space-y-3">
            <h3 className="font-serif text-sm uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
              Zamówienia zrealizowane w {monthlySummary.monthLabel} ({monthlySummary.ordersList.length})
            </h3>

            {monthlySummary.ordersList.length === 0 ? (
              <p className="text-xs text-[#6E6259] py-4 text-center">Brak opłaconych zamówień w wybranym miesiącu.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF6F1] border-b border-[#EADFD5] text-[#857670] uppercase text-[10px]">
                    <tr>
                      <th className="p-2">Numer</th>
                      <th className="p-2">Data</th>
                      <th className="p-2 text-right">Sprzedaż</th>
                      <th className="p-2 text-right">COGS (towar)</th>
                      <th className="p-2 text-right">Marża %</th>
                      <th className="p-2 text-right">Wysyłka (butik)</th>
                      <th className="p-2 text-right">Prowizja bramki</th>
                      <th className="p-2 text-right">Wynik operacyjny</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADFD5]">
                    {monthlySummary.ordersList.map((ord) => (
                      <tr key={ord.orderId} className="hover:bg-neutral-50 font-mono text-[11px]">
                        <td className="p-2 font-bold text-[#241D1B]">{ord.orderNumber}</td>
                        <td className="p-2 text-[#6E6259]">{new Date(ord.createdAt).toLocaleDateString("pl-PL")}</td>
                        <td className="p-2 text-right font-bold text-[#241D1B]">{ord.productsRevenueGross.toFixed(2)} zł</td>
                        <td className="p-2 text-right text-[#A84B4B]">−{ord.totalCogs.toFixed(2)} zł</td>
                        <td className="p-2 text-right font-semibold text-[#7A5B20]">{ord.tradeMarginPercent.toFixed(1)}%</td>
                        <td className="p-2 text-right text-[#6E6259]">−{ord.actualShippingCost.toFixed(2)} zł</td>
                        <td className="p-2 text-right text-[#6E6259]">−{ord.paymentFee.toFixed(2)} zł</td>
                        <td
                          className={`p-2 text-right font-bold ${
                            ord.operatingResult < 0 ? "text-red-700" : "text-emerald-700"
                          }`}
                        >
                          {ord.operatingResult.toFixed(2)} zł
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* TAB D: KONFIGURACJA KOSZTÓW STAŁYCH & ZASAD */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {activeTab === "CONFIG" && (
        <div className="space-y-6">
          {/* USTAWIENIA GŁÓWNE: STATUS VAT I METODA ALOKACJI */}
          <div className="bg-white p-5 border border-[#EADFD5] rounded shadow-2xs space-y-4">
            <h3 className="font-serif text-sm uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
              Status Podatkowy VAT & Metoda Alokacji Kosztów
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#241D1B] block">
                  Status podatkowy właścicielki:
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, vatMode: "VAT_ACTIVE" }))}
                    className={`flex-1 p-3 rounded border text-left text-xs transition-all ${
                      settings.vatMode === "VAT_ACTIVE"
                        ? "bg-[#FAF6F1] border-[#C5A069] shadow-2xs"
                        : "bg-white border-[#EADFD5]"
                    }`}
                  >
                    <span className="font-bold text-[#241D1B] block">Podatniczka VAT czynna</span>
                    <span className="text-[11px] text-[#6E6259] block mt-0.5">
                      Kalkulacje marży oparte na kwotach netto (VAT jest neutralny i podlega odliczeniu).
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, vatMode: "VAT_EXEMPT" }))}
                    className={`flex-1 p-3 rounded border text-left text-xs transition-all ${
                      settings.vatMode === "VAT_EXEMPT"
                        ? "bg-[#FAF6F1] border-[#C5A069] shadow-2xs"
                        : "bg-white border-[#EADFD5]"
                    }`}
                  >
                    <span className="font-bold text-[#241D1B] block">Zwolniona z VAT (nievatowiec)</span>
                    <span className="text-[11px] text-[#6E6259] block mt-0.5">
                      Kalkulacje oparte na kwotach brutto (brak prawa do odliczenia, pełna cena jest kosztem).
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#241D1B] block">
                  Metoda podziału kosztów stałych na zamówienia:
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, allocationMethod: "EQUAL" }))}
                    className={`flex-1 p-3 rounded border text-left text-xs transition-all ${
                      settings.allocationMethod === "EQUAL"
                        ? "bg-[#FAF6F1] border-[#C5A069] shadow-2xs"
                        : "bg-white border-[#EADFD5]"
                    }`}
                  >
                    <span className="font-bold text-[#241D1B] block">Równo na zamówienia</span>
                    <span className="text-[11px] text-[#6E6259] block mt-0.5">
                      Koszty stałe dzielone przez liczbę zamówień (np. 500 zł / 50 zam. = 10 zł/zam.).
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, allocationMethod: "SALES_PROPORTION" }))}
                    className={`flex-1 p-3 rounded border text-left text-xs transition-all ${
                      settings.allocationMethod === "SALES_PROPORTION"
                        ? "bg-[#FAF6F1] border-[#C5A069] shadow-2xs"
                        : "bg-white border-[#EADFD5]"
                    }`}
                  >
                    <span className="font-bold text-[#241D1B] block">Proporcjonalnie do sprzedaży</span>
                    <span className="text-[11px] text-[#6E6259] block mt-0.5">
                      Większe zamówienia przejmują proporcjonalnie większą część kosztów stałych.
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[10.5px] text-[#857670] italic pt-2 border-t border-[#EADFD5]">
              Informacja: Moduł jest kalkulatorem zarządczym, a nie deklaracją podatkową. Nie wylicza automatycznie PIT, CIT ani ZUS bez osobnej konfiguracji.
            </p>
          </div>

          {/* TABELA KOSZTÓW STAŁYCH */}
          <div className="bg-white p-5 border border-[#EADFD5] rounded shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EADFD5]">
              <h3 className="font-serif text-sm uppercase tracking-wider text-[#241D1B]">
                Koszty Stałe i Globalne Butiku
              </h3>
              <span className="text-xs text-[#6E6259]">
                Hosting, domena, księgowość, marketing, oprogramowanie, czynsz
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6F1] border-b border-[#EADFD5] text-[#857670] uppercase text-[10px]">
                  <tr>
                    <th className="p-2">Status</th>
                    <th className="p-2">Nazwa kosztu</th>
                    <th className="p-2">Kategoria</th>
                    <th className="p-2 text-right">Kwota</th>
                    <th className="p-2">Częstotliwość</th>
                    <th className="p-2 text-right">Udział sklepu online</th>
                    <th className="p-2 text-center">Akcja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EADFD5]">
                  {settings.fixedCosts.map((fc) => (
                    <tr key={fc.id} className="hover:bg-neutral-50">
                      <td className="p-2">
                        <button
                          type="button"
                          onClick={() => handleToggleFixedCost(fc.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            fc.isActive
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-gray-100 text-gray-600 border border-gray-300"
                          }`}
                        >
                          {fc.isActive ? "Aktywny" : "Wyłączony"}
                        </button>
                      </td>
                      <td className="p-2 font-semibold text-[#241D1B]">{fc.name}</td>
                      <td className="p-2 text-[#6E6259]">{fc.category}</td>
                      <td className="p-2 text-right font-mono font-bold text-[#241D1B]">
                        {fc.amount.toFixed(2)} zł
                      </td>
                      <td className="p-2 text-[#6E6259]">
                        {fc.frequency === "MONTHLY" ? "Miesięczny" : fc.frequency === "ANNUAL" ? "Roczny (/12)" : "Jednorazowy"}
                      </td>
                      <td className="p-2 text-right text-[#6E6259]">{fc.onlineSharePercentage}%</td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteFixedCost(fc.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Usuń pozycję"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* FORMULARZ DODAWANIA NOWEGO KOSZTU STAŁEGO */}
            <div className="pt-3 border-t border-[#EADFD5] space-y-2">
              <span className="text-xs font-semibold text-[#241D1B] block">Dodaj nowy koszt stały:</span>
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Nazwa, np. Abonament InPost ShipX"
                  value={newCostName}
                  onChange={(e) => setNewCostName(e.target.value)}
                  className="sm:col-span-2 bg-[#FAF6F1] border border-[#EADFD5] p-2 rounded"
                />
                <select
                  value={newCostCategory}
                  onChange={(e) => setNewCostCategory(e.target.value)}
                  className="bg-[#FAF6F1] border border-[#EADFD5] p-2 rounded"
                >
                  <option value="HOSTING">Hosting</option>
                  <option value="DATABASE_BACKUPS">Baza i backupy</option>
                  <option value="DOMAIN_EMAIL">Domena i poczta</option>
                  <option value="SOFTWARE">Oprogramowanie</option>
                  <option value="ACCOUNTING">Księgowość</option>
                  <option value="MARKETING">Reklamy</option>
                  <option value="RENT_UTILITIES">Czynsz / media</option>
                  <option value="OTHER">Inne</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Kwota w zł"
                  value={newCostAmount}
                  onChange={(e) => setNewCostAmount(e.target.value)}
                  className="bg-[#FAF6F1] border border-[#EADFD5] p-2 rounded font-bold"
                />
                <select
                  value={newCostFrequency}
                  onChange={(e) => setNewCostFrequency(e.target.value)}
                  className="bg-[#FAF6F1] border border-[#EADFD5] p-2 rounded"
                >
                  <option value="MONTHLY">Miesięczny</option>
                  <option value="ANNUAL">Roczny (rozłóż na 12 mc)</option>
                  <option value="ONE_OFF">Jednorazowy</option>
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="Udział %"
                    value={newCostOnlineShare}
                    onChange={(e) => setNewCostOnlineShare(e.target.value)}
                    className="w-16 bg-[#FAF6F1] border border-[#EADFD5] p-2 rounded text-center"
                    title="% udziału sklepu online"
                  />
                  <button
                    type="button"
                    onClick={handleAddFixedCost}
                    className="px-3 bg-[#241D1B] hover:bg-[#3E3835] text-white rounded flex items-center justify-center gap-1 font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Dodaj</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PROWIZJE PŁATNOŚCI & PRESETY OPAKOWAŃ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PROWIZJE OPERATORÓW PŁATNOŚCI */}
            <div className="bg-white p-5 border border-[#EADFD5] rounded shadow-2xs space-y-4">
              <h3 className="font-serif text-sm uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
                Prowizje Operatorów Płatności
              </h3>
              <p className="text-[11px] text-[#6E6259]">
                Stawki prowizji procentowej oraz kwoty stałej pobieranej przez bramki:
              </p>

              <div className="space-y-2.5 text-xs">
                {settings.paymentFees.map((fee, idx) => (
                  <div key={fee.id} className="p-2.5 bg-[#FAF6F1] rounded border border-[#EADFD5] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#241D1B] block">{fee.method}</span>
                      <span className="text-[10px] text-[#6E6259]">{fee.notes || fee.operator}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="font-bold font-mono text-[#7A5B20]">{fee.percentageFee}%</span>
                        <span className="text-[10px] text-[#6E6259] ml-1">+ {fee.fixedFee.toFixed(2)} zł</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PRESETY OPAKOWAŃ */}
            <div className="bg-white p-5 border border-[#EADFD5] rounded shadow-2xs space-y-4">
              <h3 className="font-serif text-sm uppercase tracking-wider text-[#241D1B] pb-2 border-b border-[#EADFD5]">
                Koszty Opakowań i Materiałów Pakowych
              </h3>
              <p className="text-[11px] text-[#6E6259]">
                Karton/koperta, taśma firmowa, bibuła ozdobna i etykieta termiczna (naliczane jednokrotnie na paczkę):
              </p>

              <div className="space-y-2.5 text-xs">
                {settings.packagingPresets.map((preset) => {
                  const total = preset.boxCost + preset.tapeCost + preset.fillerCost + preset.labelCost;
                  return (
                    <div key={preset.id} className="p-3 bg-[#FAF6F1] rounded border border-[#EADFD5] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#241D1B]">{preset.name}</span>
                        <span className="font-mono font-bold text-sm text-[#7A5B20]">{total.toFixed(2)} zł</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-[10.5px] text-[#6E6259]">
                        <span>Karton: {preset.boxCost.toFixed(2)} zł</span>
                        <span>Taśma: {preset.tapeCost.toFixed(2)} zł</span>
                        <span>Bibuła: {preset.fillerCost.toFixed(2)} zł</span>
                        <span>Etykieta: {preset.labelCost.toFixed(2)} zł</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
