import {
  CostCalculatorSettings,
  CustomOrderCosts,
  FixedCostItem,
  Order,
  OrderItem,
  PaymentGatewayFeeRule,
  Product,
  ProductVariant,
} from "./types";
import { initialCostCalculatorSettings } from "./demo-data";

export function normalizeCostCalculatorSettings(input?: Partial<CostCalculatorSettings> | null): CostCalculatorSettings {
  const base = initialCostCalculatorSettings;
  const merged: CostCalculatorSettings = {
    ...base,
    ...(input || {}),
  };

  merged.fixedCosts = Array.isArray(input?.fixedCosts) ? input!.fixedCosts : base.fixedCosts;
  merged.packagingPresets = Array.isArray(input?.packagingPresets) && input!.packagingPresets.length > 0
    ? input!.packagingPresets
    : base.packagingPresets;
  merged.paymentFees = Array.isArray(input?.paymentFees) && input!.paymentFees.length > 0
    ? input!.paymentFees
    : base.paymentFees;
  merged.inventoryPurchases = Array.isArray(input?.inventoryPurchases) ? input!.inventoryPurchases : [];

  return merged;
}

export interface ProductMarginCalculation {
  purchasePriceNet: number;
  purchasePriceGross: number;
  extraUnitCostNet: number;
  extraUnitCostGross: number;
  totalUnitCostNet: number;
  totalUnitCostGross: number;

  sellingPriceBase: number;
  discountPercent: number;
  discountAmount: number;
  sellingPriceEffective: number;

  // Podatek VAT
  vatRate: number;
  sellingPriceNet: number;
  sellingPriceVatAmount: number;

  // Bezpośrednie koszty zamówienia (przypisane do sztuki/zamówienia)
  estimatedShippingSubsidy: number; // dopłata butiku do wysyłki (jeśli darmowa dostawa)
  estimatedPackagingCost: number; // opakowanie
  estimatedPaymentFeePercent: number;
  estimatedPaymentFeeFixed: number;
  estimatedPaymentFeeTotal: number;
  estimatedLaborCost: number;
  estimatedFreebieCost: number;
  totalOrderDirectCosts: number;

  // Przypisane koszty stałe (symulacja)
  allocatedOverheadCost: number;

  // WYNIKI PRECYZYJNIE ROZDZIELONE
  cogs: number; // Koszt zakupu towaru (netto dla czynnej, brutto dla zwolnionej)
  revenueEffective: number; // Przychód ze sprzedaży towaru
  tradeProfit: number; // Zysk na towarze = Przychód − COGS
  tradeMarginPercent: number; // Marża towarowa = (Przychód − COGS) / Przychód × 100%
  markupPercent: number; // Narzut = (Przychód − COGS) / COGS × 100%

  amountAfterDirectCosts: number; // Marża pokrycia = Przychód − COGS − Koszty bezpośrednie
  directMarginPercent: number; // Marża po kosztach bezpośrednich = Kwota po kosztach / Przychód × 100%

  operatingResult: number; // Wynik po przypisaniu kosztów stałych = Marża pokrycia − Koszty stałe
  operatingMarginPercent: number; // Rentowność operacyjna = Wynik / Przychód × 100%

  isLoss: boolean;
  breakdownSteps: { label: string; formula: string; value: string; hint?: string }[];
}

export interface ReversePriceSimulationResult {
  targetMarginPercent: number;
  targetProfitAmount?: number;
  requiredSellingPriceGross: number;
  requiredSellingPriceNet: number;
  effectiveSellingPriceGross: number;
  discountPercent: number;
  paymentFeePercent: number;
  paymentFeeFixed: number;
  baseDirectCosts: number;
  cogs: number;
  isPossible: boolean;
  explanation: string;
}

export interface OrderMarginCalculation {
  orderId: string;
  orderNumber: string;
  isTest: boolean;
  createdAt: string;
  paymentStatus: string;
  paymentMethod: string;

  // Przychody
  productsRevenueGross: number;
  productsRevenueNet: number;
  shippingRevenueGross: number; // pobrana opłata od klientki
  shippingRevenueNet: number;
  totalRevenueGross: number;
  totalRevenueNet: number;

  // Koszty towarowe
  totalCogs: number; // Koszt zakupu sprzedanych towarów ze snapshotów
  itemsBreakdown: {
    productName: string;
    variant: string;
    quantity: number;
    sellingPrice: number;
    purchaseCostSnapshot: number;
    extraCostSnapshot: number;
    totalItemCogs: number;
  }[];

  // Koszty bezpośrednie zamówienia
  actualShippingCost: number;
  shippingMargin: number; // Przychód z dostawy − Rzeczywisty koszt wysyłki
  packagingCost: number;
  paymentFee: number;
  isPaymentFeeSettled: boolean;
  paymentFeeRule?: string;
  freebiesCost: number;
  handlingLaborCost: number;
  extraCustomCosts: { name: string; amount: number }[];
  totalDirectCosts: number;

  // Koszty stałe przypisane
  allocatedOverheadCost: number;
  allocationMethod: "EQUAL" | "SALES_PROPORTION";

  // Wskaźniki
  tradeProfit: number; // Przychód z produktów − COGS
  tradeMarginPercent: number; // Marża towarowa %
  markupPercent: number; // Narzut %
  amountAfterDirectCosts: number; // Kwota po kosztach zamówienia
  operatingResult: number; // Wynik po przypisaniu kosztów stałych
  isLoss: boolean;
  breakdownSteps: { label: string; formula: string; value: string }[];
}

export interface MonthlyFinancialSummary {
  year: number;
  month: number;
  monthLabel: string;
  totalOrdersCount: number;
  paidOrdersCount: number;

  // Przychody
  grossSalesRevenue: number; // sprzedaż produktów po rabatach
  netSalesRevenue: number;
  grossShippingRevenue: number; // pobrane opłaty za dostawy
  netShippingRevenue: number;
  totalRevenue: number; // suma przychodów (dla wybranego statusu VAT)

  // Koszty sprzedanych towarów (COGS)
  totalCogs: number; // suma kosztów zakupu tylko sprzedanych sztuk
  tradeProfit: number; // Zysk handlowy = Sprzedaż towarów − COGS
  tradeMarginPercent: number; // Średnia marża towarowa %
  averageMarkupPercent: number; // Średni narzut %

  // Koszty bezpośrednie zamówień
  totalActualShippingPaid: number; // rzeczywisty koszt wysyłek zapłacony przewoźnikom
  shippingBalance: number; // bilans dostaw = pobrane od klientek − zapłacone przewoźnikom
  totalPackagingCost: number;
  totalPaymentFees: number;
  totalFreebiesCost: number;
  totalHandlingLaborCost: number;
  totalOtherOrderCosts: number;
  totalDirectCosts: number;

  amountAfterDirectCosts: number; // Marża pokrycia (przychody − COGS − koszty bezpośrednie)

  // Koszty stałe / globalne w danym miesiącu
  fixedCostsBreakdown: {
    id: string;
    name: string;
    category: string;
    nominalAmount: number;
    monthlyAllocatedAmount: number; // roczne dzielone przez 12, miesięczne w całości
    actualCashOutlay: number; // faktyczny wydatek gotówkowy w tym miesiącu
    frequency: string;
    onlineShare: number;
  }[];
  totalMonthlyAllocatedOverhead: number; // suma kosztów stałych przypisana do tego miesiąca
  totalActualCashOutlayOverhead: number; // faktyczny wydatek gotówkowy na koszty stałe

  // Wynik operacyjny
  operatingResultBeforeTax: number; // Wynik przed podatkiem dochodowym = Marża pokrycia − Koszty stałe
  operatingMarginPercent: number;
  isLoss: boolean;

  // Magazyn i zapasy (POKAZYWANE OSOBNO, nie odejmowane powtórnie jako COGS!)
  inventoryPurchasesOutlay: number; // wydatki na zakup nowego towaru w tym miesiącu
  inventoryPurchasesList: {
    id: string;
    date: string;
    title: string;
    amount: number;
    notes?: string;
  }[];

  // Zwroty i reklamacje
  totalRefundsAmount: number;
  refundedOrdersCount: number;

  ordersList: OrderMarginCalculation[];
}

/**
 * Przelicza kwotę brutto na netto wg stawki VAT
 */
export function grossToNet(gross: number, vatRate: number): number {
  if (!vatRate || vatRate <= 0) return gross;
  return Number((gross / (1 + vatRate / 100)).toFixed(2));
}

/**
 * Przelicza kwotę netto na brutto wg stawki VAT
 */
export function netToGross(net: number, vatRate: number): number {
  if (!vatRate || vatRate <= 0) return net;
  return Number((net * (1 + vatRate / 100)).toFixed(2));
}

/**
 * Oblicza rentowność pojedynczego produktu (Widok A)
 */
export function calculateProductMargin(params: {
  purchasePrice: number; // cena zakupu za sztukę
  isPurchasePriceGross?: boolean; // czy podano brutto czy netto
  extraUnitCost?: number; // dodatkowy koszt (transport z hurtowni)
  sellingPrice: number; // planowana cena sprzedaży
  isSellingPriceGross?: boolean; // domyślnie w butiku cena na półce jest brutto
  discountPercent?: number; // planowany rabat (np. 15%)
  vatRate?: number; // stawka VAT (np. 23%)
  settings: CostCalculatorSettings;

  // Założenia dotyczące zamówienia dla tego produktu
  assumeFreeShipping?: boolean; // czy klientka ma darmową dostawę
  actualShippingCost?: number; // koszt wysyłki ponoszony przez butik (np. 11.99 zł)
  packagingCost?: number; // koszt opakowania (np. 4.50 zł)
  paymentOperator?: string; // np. "PAYU"
  paymentMethod?: string; // np. "BLIK"
  freebieCost?: number; // koszt gratisu
  laborCost?: number; // koszt obsługi
  allocatedOverhead?: number; // przypisany koszt stały
}): ProductMarginCalculation {
  const settings = normalizeCostCalculatorSettings(params.settings);
  const isVatActive = settings.vatMode === "VAT_ACTIVE";
  const vatRate = params.vatRate !== undefined ? params.vatRate : settings.defaultVatRate || 23;

  // 1. Koszt zakupu produktu (COGS)
  const rawPurchase = Number(params.purchasePrice || 0);
  const rawExtra = Number(params.extraUnitCost || 0);

  let purchaseNet = params.isPurchasePriceGross ? grossToNet(rawPurchase, vatRate) : rawPurchase;
  let purchaseGross = params.isPurchasePriceGross ? rawPurchase : netToGross(rawPurchase, vatRate);
  let extraNet = params.isPurchasePriceGross ? grossToNet(rawExtra, vatRate) : rawExtra;
  let extraGross = params.isPurchasePriceGross ? rawExtra : netToGross(rawExtra, vatRate);

  const totalUnitCostNet = Number((purchaseNet + extraNet).toFixed(2));
  const totalUnitCostGross = Number((purchaseGross + extraGross).toFixed(2));

  // W zależności od statusu VAT, realnym kosztem bazowym dla butiku jest:
  // - dla podatniczki VAT czynnej: kwota NETTO (VAT podlega odliczeniu)
  // - dla podatniczki zwolnionej: kwota BRUTTO (brak prawa do odliczenia VAT, pełna kwota jest kosztem)
  const cogs = isVatActive ? totalUnitCostNet : totalUnitCostGross;

  // 2. Cena sprzedaży i rabat
  const rawSelling = Number(params.sellingPrice || 0);
  const sellingGross = params.isSellingPriceGross !== false ? rawSelling : netToGross(rawSelling, vatRate);
  const sellingNet = grossToNet(sellingGross, vatRate);

  const discountPercent = Math.max(0, Math.min(100, Number(params.discountPercent || 0)));
  const discountAmountGross = Number(((sellingGross * discountPercent) / 100).toFixed(2));
  const sellingEffectiveGross = Number((sellingGross - discountAmountGross).toFixed(2));
  const sellingEffectiveNet = grossToNet(sellingEffectiveGross, vatRate);
  const sellingPriceVatAmount = Number((sellingEffectiveGross - sellingEffectiveNet).toFixed(2));

  // Przychód ze sprzedaży podlegający kalkulacji marży:
  const revenueEffective = isVatActive ? sellingEffectiveNet : sellingEffectiveGross;

  // 3. Koszty bezpośrednie zamówienia
  const assumeFreeShipping = params.assumeFreeShipping !== undefined ? params.assumeFreeShipping : false;
  const actualShippingCost = params.actualShippingCost !== undefined ? params.actualShippingCost : settings.defaultActualShippingCostInpost || 11.99;
  const estimatedShippingSubsidy = assumeFreeShipping ? actualShippingCost : 0;

  const estimatedPackagingCost = params.packagingCost !== undefined ? params.packagingCost : ((settings.packagingPresets || []).find((p) => p.isDefault)?.boxCost || 3.00) + 1.50;
  const estimatedLaborCost = params.laborCost !== undefined ? params.laborCost : settings.defaultHandlingLaborCost || 0;
  const estimatedFreebieCost = params.freebieCost !== undefined ? params.freebieCost : settings.defaultFreebieCost || 0;

  // Prowizja płatnicza
  const feeRule = (settings.paymentFees || []).find(
    (f) =>
      (f.method === params.paymentMethod || f.operator === params.paymentOperator) ||
      (f.method === "BLIK" && f.operator === "PAYU")
  ) || (settings.paymentFees || [])[0] || { percentageFee: 1.2, fixedFee: 0.30 };

  const estimatedPaymentFeePercent = feeRule.percentageFee || 0;
  const estimatedPaymentFeeFixed = feeRule.fixedFee || 0;
  // Prowizja płatnicza liczona jest od pełnej kwoty pobieranej od klienta (czyli brutto na bramce)
  const estimatedPaymentFeeTotal = Number(
    (((sellingEffectiveGross * estimatedPaymentFeePercent) / 100) + estimatedPaymentFeeFixed).toFixed(2)
  );

  const totalOrderDirectCosts = Number(
    (
      estimatedShippingSubsidy +
      estimatedPackagingCost +
      estimatedPaymentFeeTotal +
      estimatedLaborCost +
      estimatedFreebieCost
    ).toFixed(2)
  );

  // 4. Przypisane koszty stałe
  let allocatedOverheadCost = params.allocatedOverhead !== undefined ? params.allocatedOverhead : 0;
  if (params.allocatedOverhead === undefined) {
    // Obliczamy domyślny udział kosztu stałego na zamówienie
    const activeMonthlyOverhead = settings.fixedCosts
      .filter((fc) => fc.isActive)
      .reduce((sum, fc) => {
        const share = (fc.onlineSharePercentage || 100) / 100;
        const netAmt = isVatActive && fc.isVatDeductible ? grossToNet(fc.amount, fc.vatRate || 23) : fc.amount;
        if (fc.frequency === "ANNUAL") return sum + (netAmt * share) / 12;
        if (fc.frequency === "MONTHLY") return sum + netAmt * share;
        return sum;
      }, 0);

    const simulatedOrders = settings.simulatedMonthlyOrdersCount > 0 ? settings.simulatedMonthlyOrdersCount : 50;
    allocatedOverheadCost = Number((activeMonthlyOverhead / simulatedOrders).toFixed(2));
  }

  // 5. WSKAŹNIKI PRECYZYJNIE ZDEFINIOWANE
  // Marża towarowa = (Przychód ze sprzedaży − Koszt zakupu) / Przychód ze sprzedaży × 100%
  const tradeProfit = Number((revenueEffective - cogs).toFixed(2));
  const tradeMarginPercent = revenueEffective > 0 ? Number(((tradeProfit / revenueEffective) * 100).toFixed(2)) : 0;

  // Narzut = (Przychód ze sprzedaży − Koszt zakupu) / Koszt zakupu × 100%
  const markupPercent = cogs > 0 ? Number(((tradeProfit / cogs) * 100).toFixed(2)) : 0;

  // Kwota pozostająca po kosztach zamówienia (marża pokrycia)
  const amountAfterDirectCosts = Number((revenueEffective - cogs - totalOrderDirectCosts).toFixed(2));
  const directMarginPercent = revenueEffective > 0 ? Number(((amountAfterDirectCosts / revenueEffective) * 100).toFixed(2)) : 0;

  // Wynik po przypisaniu kosztów stałych
  const operatingResult = Number((amountAfterDirectCosts - allocatedOverheadCost).toFixed(2));
  const operatingMarginPercent = revenueEffective > 0 ? Number(((operatingResult / revenueEffective) * 100).toFixed(2)) : 0;

  const isLoss = operatingResult < 0;

  // Rozbicie krok po kroku
  const breakdownSteps = [
    {
      label: "Cena sprzedaży na półce",
      formula: `${sellingGross.toFixed(2)} zł brutto`,
      value: `${sellingGross.toFixed(2)} zł`,
    },
    {
      label: "Rabat dla klientki",
      formula: discountPercent > 0 ? `−${discountPercent}% (−${discountAmountGross.toFixed(2)} zł)` : "Brak rabatu (0%)",
      value: `−${discountAmountGross.toFixed(2)} zł`,
    },
    {
      label: `Przychód efektywny (${isVatActive ? "Netto (podatniczka VAT czynna)" : "Brutto (zwolniona z VAT)"})`,
      formula: isVatActive ? `${sellingEffectiveGross.toFixed(2)} zł brutto − ${sellingPriceVatAmount.toFixed(2)} zł VAT` : `${sellingEffectiveGross.toFixed(2)} zł brutto`,
      value: `${revenueEffective.toFixed(2)} zł`,
      hint: isVatActive ? "Jako podatniczka VAT czynna odprowadzasz należny podatek VAT do urzędu skarbowego, więc Twoim przychodem jest kwota netto." : "Dla firmy zwolnionej z VAT pełna kwota od klientki stanowi przychód.",
    },
    {
      label: "Koszt zakupu towaru (COGS)",
      formula: `Zakup: ${isVatActive ? purchaseNet.toFixed(2) : purchaseGross.toFixed(2)} zł + Transport: ${isVatActive ? extraNet.toFixed(2) : extraGross.toFixed(2)} zł`,
      value: `−${cogs.toFixed(2)} zł`,
    },
    {
      label: "Marża towarowa i Narzut",
      formula: `Marża: (${revenueEffective.toFixed(2)} − ${cogs.toFixed(2)}) / ${revenueEffective.toFixed(2)} × 100% | Narzut: (${revenueEffective.toFixed(2)} − ${cogs.toFixed(2)}) / ${cogs.toFixed(2)} × 100%`,
      value: `Marża: ${tradeMarginPercent.toFixed(1)}% | Narzut: ${markupPercent.toFixed(1)}%`,
    },
    {
      label: "Koszty bezpośrednie zamówienia",
      formula: `Prowizja (${estimatedPaymentFeeTotal.toFixed(2)} zł) + Opakowanie (${estimatedPackagingCost.toFixed(2)} zł) + Dopłata do wysyłki (${estimatedShippingSubsidy.toFixed(2)} zł) + Gratisy (${estimatedFreebieCost.toFixed(2)} zł)`,
      value: `−${totalOrderDirectCosts.toFixed(2)} zł`,
    },
    {
      label: "Kwota pozostająca po kosztach zamówienia",
      formula: `${revenueEffective.toFixed(2)} zł − ${cogs.toFixed(2)} zł − ${totalOrderDirectCosts.toFixed(2)} zł`,
      value: `${amountAfterDirectCosts.toFixed(2)} zł (${directMarginPercent.toFixed(1)}%)`,
    },
    {
      label: "Przypisany udział kosztów stałych butiku",
      formula: `Koszty stałe przypadające na to zamówienie (symulacja)`,
      value: `−${allocatedOverheadCost.toFixed(2)} zł`,
    },
    {
      label: "Końcowy wynik operacyjny",
      formula: `${amountAfterDirectCosts.toFixed(2)} zł − ${allocatedOverheadCost.toFixed(2)} zł`,
      value: `${operatingResult.toFixed(2)} zł (${operatingMarginPercent.toFixed(1)}%)`,
      hint: isLoss ? "UWAGA: Sprzedaż z tymi parametrami przynosi stratę operacyjną po uwzględnieniu kosztów zamówienia i udziału w kosztach stałych!" : "Zysk operacyjny przed podatkiem dochodowym (PIT/CIT).",
    },
  ];

  return {
    purchasePriceNet: purchaseNet,
    purchasePriceGross: purchaseGross,
    extraUnitCostNet: extraNet,
    extraUnitCostGross: extraGross,
    totalUnitCostNet,
    totalUnitCostGross,
    sellingPriceBase: sellingGross,
    discountPercent,
    discountAmount: discountAmountGross,
    sellingPriceEffective: sellingEffectiveGross,
    vatRate,
    sellingPriceNet: sellingEffectiveNet,
    sellingPriceVatAmount,
    estimatedShippingSubsidy,
    estimatedPackagingCost,
    estimatedPaymentFeePercent,
    estimatedPaymentFeeFixed,
    estimatedPaymentFeeTotal,
    estimatedLaborCost,
    estimatedFreebieCost,
    totalOrderDirectCosts,
    allocatedOverheadCost,
    cogs,
    revenueEffective,
    tradeProfit,
    tradeMarginPercent,
    markupPercent,
    amountAfterDirectCosts,
    directMarginPercent,
    operatingResult,
    operatingMarginPercent,
    isLoss,
    breakdownSteps,
  };
}

/**
 * Symulacja odwrotna (Reverse Pricing):
 * "Jaka cena sprzedaży zapewni wybraną marżę po kosztach?"
 *
 * Wyprowadzenie matematyczne:
 * Niech docelowa marża operacyjna po kosztach wynosi M (np. 20% = 0.20).
 * Cena bazowa sprzedaży na półce = S (brutto).
 * Rabat = d (np. 15% = 0.15).
 * Efektywna cena sprzedaży brutto = S * (1 - d).
 * Efektywny przychód R = S * (1 - d) / (1 + vatRate/100) dla VAT czynnej, lub S * (1 - d) dla zwolnionej.
 * Prowizja bramki = p * S * (1 - d) + f_fixed.
 * Koszty stałe bezpośrednie C_base = COGS + Opakowanie + Wysyłka + Gratisy + Prowizja_stała + Udział_kosztów_stałych.
 *
 * Zależność: (Przychód - Koszty_zmienne_prowizyjne - C_base) / Przychód = M
 */
export function simulateRequiredSellingPrice(params: {
  targetMarginPercent: number; // np. 25 (%)
  purchasePrice: number;
  isPurchasePriceGross?: boolean;
  extraUnitCost?: number;
  discountPercent?: number; // planowany rabat np. 15 (%)
  vatRate?: number;
  settings: CostCalculatorSettings;
  actualShippingCost?: number;
  assumeFreeShipping?: boolean;
  packagingCost?: number;
  freebieCost?: number;
  laborCost?: number;
  allocatedOverhead?: number;
  paymentFeePercent?: number;
  paymentFeeFixed?: number;
}): ReversePriceSimulationResult {
  const settings = normalizeCostCalculatorSettings(params.settings);
  const isVatActive = settings.vatMode === "VAT_ACTIVE";
  const vatRate = params.vatRate !== undefined ? params.vatRate : settings.defaultVatRate || 23;
  const vatMultiplier = isVatActive ? (1 + vatRate / 100) : 1;

  const targetM = Number(params.targetMarginPercent || 0) / 100;
  const discountP = Math.max(0, Math.min(0.99, Number(params.discountPercent || 0) / 100));

  // COGS
  const rawPurchase = Number(params.purchasePrice || 0);
  const rawExtra = Number(params.extraUnitCost || 0);
  const purchaseNet = params.isPurchasePriceGross ? grossToNet(rawPurchase, vatRate) : rawPurchase;
  const purchaseGross = params.isPurchasePriceGross ? rawPurchase : netToGross(rawPurchase, vatRate);
  const extraNet = params.isPurchasePriceGross ? grossToNet(rawExtra, vatRate) : rawExtra;
  const extraGross = params.isPurchasePriceGross ? rawExtra : netToGross(rawExtra, vatRate);
  const cogs = isVatActive ? (purchaseNet + extraNet) : (purchaseGross + extraGross);

  // Stałe koszty bezpośrednie
  const shippingSubsidy = params.assumeFreeShipping ? (params.actualShippingCost ?? settings.defaultActualShippingCostInpost ?? 11.99) : 0;
  const packaging = params.packagingCost ?? 4.50;
  const freebie = params.freebieCost ?? 0;
  const labor = params.laborCost ?? 0;
  const overhead = params.allocatedOverhead ?? 5.00;

  const feePercent = (params.paymentFeePercent ?? 1.2) / 100;
  const feeFixed = params.paymentFeeFixed ?? 0.30;

  const baseFixedCosts = Number((cogs + shippingSubsidy + packaging + freebie + labor + overhead + feeFixed).toFixed(2));

  // Wyprowadzenie dla S (cena na półce):
  // R = S * (1 - discountP) / vatMultiplier
  // Zysk = R - feePercent * S * (1 - discountP) - baseFixedCosts
  // Marża = Zysk / R = 1 - (feePercent * vatMultiplier) - (baseFixedCosts / R) = targetM
  // baseFixedCosts / R = 1 - (feePercent * vatMultiplier) - targetM
  // R_required = baseFixedCosts / (1 - feePercent * vatMultiplier - targetM)
  // S_required = R_required * vatMultiplier / (1 - discountP)

  const denominator = 1 - (feePercent * vatMultiplier) - targetM;

  if (denominator <= 0.01) {
    return {
      targetMarginPercent: params.targetMarginPercent,
      requiredSellingPriceGross: 0,
      requiredSellingPriceNet: 0,
      effectiveSellingPriceGross: 0,
      discountPercent: params.discountPercent || 0,
      paymentFeePercent: feePercent * 100,
      paymentFeeFixed: feeFixed,
      baseDirectCosts: baseFixedCosts,
      cogs,
      isPossible: false,
      explanation: `Osiągnięcie ${params.targetMarginPercent}% marży jest matematycznie niemożliwe przy sumie prowizji bramki (${(feePercent * 100).toFixed(1)}%) i narzuconych kosztach. Zmniejsz docelową marżę.`,
    };
  }

  const requiredRevenue = baseFixedCosts / denominator;
  const effectiveGross = Number((requiredRevenue * vatMultiplier).toFixed(2));
  const sellingGrossRequired = Number((effectiveGross / (1 - discountP)).toFixed(2));
  const sellingNetRequired = grossToNet(sellingGrossRequired, vatRate);

  return {
    targetMarginPercent: params.targetMarginPercent,
    requiredSellingPriceGross: sellingGrossRequired,
    requiredSellingPriceNet: sellingNetRequired,
    effectiveSellingPriceGross: effectiveGross,
    discountPercent: params.discountPercent || 0,
    paymentFeePercent: feePercent * 100,
    paymentFeeFixed: feeFixed,
    baseDirectCosts: baseFixedCosts,
    cogs,
    isPossible: true,
    explanation: `Aby uzyskać ${params.targetMarginPercent}% marży operacyjnej po wszystkich kosztach (przy planowanym rabacie −${(discountP * 100).toFixed(0)}% i prowizji płatności ${(feePercent * 100).toFixed(1)}%), regularna cena sprzedaży na półce musi wynosić ${sellingGrossRequired.toFixed(2)} zł brutto.`,
  };
}

/**
 * Oblicza rentowność konkretnego zamówienia (Widok B)
 */
export function calculateOrderMargin(
  order: Order,
  rawSettings: CostCalculatorSettings,
  productsMap: Map<string, Product>
): OrderMarginCalculation {
  const settings = normalizeCostCalculatorSettings(rawSettings);
  const isVatActive = settings.vatMode === "VAT_ACTIVE";
  const defaultVatRate = settings.defaultVatRate || 23;

  // 1. Przychody
  const grossSales = Number(order.subtotalAmount || 0); // produkty po rabatach
  const netSales = grossToNet(grossSales, defaultVatRate);

  const grossShipping = Number(order.shippingCost || 0); // pobrane od klientki
  const netShipping = grossToNet(grossShipping, defaultVatRate);

  const totalGross = Number((grossSales + grossShipping).toFixed(2));
  const totalNet = Number((netSales + netShipping).toFixed(2));

  // 2. Koszt zakupu sprzedanych towarów (COGS) ze snapshotów
  const custom = order.customOrderCosts || {};
  let totalCogs = 0;

  const itemsBreakdown = (order.items || []).map((item) => {
    let unitPurchase = item.unitPurchasePriceSnapshot;
    let unitExtra = item.unitExtraCostSnapshot;

    // Jeśli brak snapshotu w starym zamówieniu, pobierz z bieżących danych produktu jako fallback
    if (unitPurchase === undefined || unitPurchase === null) {
      const prod = productsMap.get(item.productNameSnapshot) || Array.from(productsMap.values()).find((p) => p.variants.some((v) => v.id === item.variantId));
      const variant = prod?.variants.find((v) => v.id === item.variantId);
      unitPurchase = variant?.purchasePrice ?? prod?.purchasePrice ?? 0;
      unitExtra = variant?.extraUnitCost ?? prod?.extraUnitCost ?? 0;
    }

    const itemUnitCost = Number(unitPurchase || 0) + Number(unitExtra || 0);
    const itemTotalCogs = Number((itemUnitCost * (item.quantity || 1)).toFixed(2));
    totalCogs += itemTotalCogs;

    return {
      productName: item.productNameSnapshot,
      variant: item.variantSnapshot,
      quantity: item.quantity,
      sellingPrice: Number(item.totalSnapshot),
      purchaseCostSnapshot: Number(unitPurchase || 0),
      extraCostSnapshot: Number(unitExtra || 0),
      totalItemCogs: itemTotalCogs,
    };
  });

  totalCogs = Number(totalCogs.toFixed(2));

  // 3. Rzeczywisty koszt wysyłki ponoszony przez butik
  let actualShippingCost = custom.actualShippingCost;
  if (actualShippingCost === undefined) {
    if (order.shippingMethod === "INPOST_LOCKER") {
      actualShippingCost = settings.defaultActualShippingCostInpost || 11.99;
    } else if (order.shippingMethod === "COURIER") {
      actualShippingCost = settings.defaultActualShippingCostCourier || 15.00;
    } else {
      actualShippingCost = 0; // Odbiór osobisty
    }
  }
  actualShippingCost = Number(actualShippingCost);
  const shippingMargin = Number((grossShipping - actualShippingCost).toFixed(2));

  // 4. Koszt opakowania (naliczany JEDNOKROTNIE na całe zamówienie, niezależnie od liczby sztuk!)
  let packagingCost = custom.packagingCost;
  if (packagingCost === undefined) {
    const preset = settings.packagingPresets.find((p) => p.isDefault) || settings.packagingPresets[0];
    packagingCost = preset
      ? Number((preset.boxCost + preset.tapeCost + preset.fillerCost + preset.labelCost).toFixed(2))
      : 4.50;
  }
  packagingCost = Number(packagingCost);

  // 5. Prowizja płatnicza (obsługuje dopłaty i osobne transakcje)
  let paymentFee = custom.paymentFeeSettled !== undefined ? custom.paymentFeeSettled : custom.paymentFeeEstimated;
  let isPaymentFeeSettled = custom.isPaymentFeeSettled || false;
  let paymentFeeRuleName = "";

  if (paymentFee === undefined) {
    const feeRule = settings.paymentFees.find(
      (f) =>
        f.method === order.paymentMethod ||
        (order.paymentMethod === "BLIK" && f.operator === "PAYU") ||
        f.operator === (order as any).paymentOperator
    ) || settings.paymentFees[0] || { percentageFee: 1.2, fixedFee: 0.30, operator: "PAYU" };

    paymentFeeRuleName = `${feeRule.operator} (${feeRule.percentageFee}% + ${feeRule.fixedFee.toFixed(2)} zł)`;

    // Prowizja liczona od łącznej kwoty zamówienia lub sumy wpłat
    const paidBase = order.paidAmount && order.paidAmount > 0 ? order.paidAmount : order.totalAmount;
    paymentFee = Number((((paidBase * (feeRule.percentageFee || 0)) / 100) + (feeRule.fixedFee || 0)).toFixed(2));

    // Jeśli do zamówienia była dopłata (np. edycja i dopłata różnicy), naliczana jest druga transakcja
    if (order.remainingAmount !== undefined && order.remainingAmount > 0 && order.paymentStatus === "PARTIALLY_PAID") {
      paymentFee += feeRule.fixedFee || 0.30;
    }
  }
  paymentFee = Number(paymentFee.toFixed(2));

  // 6. Gratisy i koszty kompletowania
  const freebiesCost = custom.freebiesCost !== undefined ? Number(custom.freebiesCost) : (settings.defaultFreebieCost || 0);
  const handlingLaborCost = custom.handlingLaborCost !== undefined ? Number(custom.handlingLaborCost) : (settings.defaultHandlingLaborCost || 0);

  // Inne własne koszty zamówienia
  const extraCustomCosts = custom.extraCosts || [];
  const extraCostsSum = extraCustomCosts.reduce((acc, c) => acc + Number(c.amount || 0), 0);

  const totalDirectCosts = Number(
    (
      actualShippingCost +
      packagingCost +
      paymentFee +
      freebiesCost +
      handlingLaborCost +
      extraCostsSum
    ).toFixed(2)
  );

  // 7. Przypisane koszty stałe
  const activeMonthlyOverhead = settings.fixedCosts
    .filter((fc) => fc.isActive)
    .reduce((sum, fc) => {
      const share = (fc.onlineSharePercentage || 100) / 100;
      const netAmt = isVatActive && fc.isVatDeductible ? grossToNet(fc.amount, fc.vatRate || 23) : fc.amount;
      if (fc.frequency === "ANNUAL") return sum + (netAmt * share) / 12;
      if (fc.frequency === "MONTHLY") return sum + netAmt * share;
      return sum;
    }, 0);

  let allocatedOverheadCost = 0;
  if (settings.allocationMethod === "EQUAL") {
    const ordersCount = settings.simulatedMonthlyOrdersCount > 0 ? settings.simulatedMonthlyOrdersCount : 50;
    allocatedOverheadCost = Number((activeMonthlyOverhead / ordersCount).toFixed(2));
  } else {
    // Proporcjonalnie do wartości sprzedaży
    const simulatedSales = settings.simulatedMonthlySalesTotal > 0 ? settings.simulatedMonthlySalesTotal : 15000;
    const proportion = simulatedSales > 0 ? grossSales / simulatedSales : 0;
    allocatedOverheadCost = Number((activeMonthlyOverhead * proportion).toFixed(2));
  }

  // 8. Wskaźniki rentowności zamówienia
  const effectiveProductsRevenue = isVatActive ? netSales : grossSales;
  const tradeProfit = Number((effectiveProductsRevenue - totalCogs).toFixed(2));
  const tradeMarginPercent = effectiveProductsRevenue > 0 ? Number(((tradeProfit / effectiveProductsRevenue) * 100).toFixed(2)) : 0;
  const markupPercent = totalCogs > 0 ? Number(((tradeProfit / totalCogs) * 100).toFixed(2)) : 0;

  // Przychód łączny z dostawą
  const effectiveTotalRevenue = isVatActive ? totalNet : totalGross;
  // Kwota po kosztach zamówienia (marża pokrycia zamówienia)
  const amountAfterDirectCosts = Number((effectiveTotalRevenue - totalCogs - totalDirectCosts).toFixed(2));

  // Wynik po przypisaniu kosztów stałych
  const operatingResult = Number((amountAfterDirectCosts - allocatedOverheadCost).toFixed(2));
  const isLoss = operatingResult < 0;

  const breakdownSteps = [
    {
      label: "Sprzedaż produktów po rabatach",
      formula: isVatActive ? `${grossSales.toFixed(2)} zł brutto → ${netSales.toFixed(2)} zł netto` : `${grossSales.toFixed(2)} zł brutto`,
      value: `${effectiveProductsRevenue.toFixed(2)} zł`,
    },
    {
      label: "Koszt zakupu sprzedanych towarów (COGS)",
      formula: `Suma kosztów zakupu ${order.items?.length || 0} pozycji ze snapshotów z chwili zakupu`,
      value: `−${totalCogs.toFixed(2)} zł`,
    },
    {
      label: "Marża towarowa i Narzut",
      formula: `Marża: (${effectiveProductsRevenue.toFixed(2)} − ${totalCogs.toFixed(2)}) / ${effectiveProductsRevenue.toFixed(2)} × 100% | Narzut: (${effectiveProductsRevenue.toFixed(2)} − ${totalCogs.toFixed(2)}) / ${totalCogs.toFixed(2)} × 100%`,
      value: `Marża: ${tradeMarginPercent.toFixed(1)}% | Narzut: ${markupPercent.toFixed(1)}%`,
    },
    {
      label: "Przychód z opłaty za dostawę od klientki",
      formula: isVatActive ? `${grossShipping.toFixed(2)} zł brutto → ${netShipping.toFixed(2)} zł netto` : `${grossShipping.toFixed(2)} zł brutto`,
      value: `+${isVatActive ? netShipping.toFixed(2) : grossShipping.toFixed(2)} zł`,
    },
    {
      label: "Rzeczywisty koszt wysyłki dla butiku",
      formula: `Faktyczny koszt nadania paczki u przewoźnika (${order.shippingMethod})`,
      value: `−${actualShippingCost.toFixed(2)} zł`,
    },
    {
      label: "Opakowanie i materiały pakowe",
      formula: `Karton/foliopak, taśma, bibuła i etykieta (naliczone jednorazowo na paczkę)`,
      value: `−${packagingCost.toFixed(2)} zł`,
    },
    {
      label: `Prowizja operatora płatności (${isPaymentFeeSettled ? "Rozliczona" : "Szacunkowa"})`,
      formula: paymentFeeRuleName || "Wg stawek operatora",
      value: `−${paymentFee.toFixed(2)} zł`,
    },
    {
      label: "Kwota pozostająca po kosztach zamówienia (Marża pokrycia)",
      formula: `Przychody łączone − Koszt towarów − Wszystkie koszty bezpośrednie paczki`,
      value: `${amountAfterDirectCosts.toFixed(2)} zł`,
    },
    {
      label: `Przypisane koszty stałe (${settings.allocationMethod === "EQUAL" ? "Równo na zamówienie" : "Proporcjonalnie do sprzedaży"})`,
      formula: `Część czynszu, hostingu, księgowości i oprogramowania`,
      value: `−${allocatedOverheadCost.toFixed(2)} zł`,
    },
    {
      label: "Wynik operacyjny zamówienia",
      formula: `${amountAfterDirectCosts.toFixed(2)} zł − ${allocatedOverheadCost.toFixed(2)} zł`,
      value: `${operatingResult.toFixed(2)} zł`,
    },
  ];

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    isTest: Boolean(order.isTest),
    createdAt: order.createdAt,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    productsRevenueGross: grossSales,
    productsRevenueNet: netSales,
    shippingRevenueGross: grossShipping,
    shippingRevenueNet: netShipping,
    totalRevenueGross: totalGross,
    totalRevenueNet: totalNet,
    totalCogs,
    itemsBreakdown,
    actualShippingCost,
    shippingMargin,
    packagingCost,
    paymentFee,
    isPaymentFeeSettled,
    paymentFeeRule: paymentFeeRuleName,
    freebiesCost,
    handlingLaborCost,
    extraCustomCosts,
    totalDirectCosts,
    allocatedOverheadCost,
    allocationMethod: settings.allocationMethod,
    tradeProfit,
    tradeMarginPercent,
    markupPercent,
    amountAfterDirectCosts,
    operatingResult,
    isLoss,
    breakdownSteps,
  };
}

/**
 * Oblicza pełne zestawienie finansowe za dany miesiąc (Widok C)
 */
export function calculateMonthlySummary(params: {
  year: number;
  month: number; // 1-12
  orders: Order[]; // zamówienia ze sklepu
  settings: CostCalculatorSettings;
  productsMap: Map<string, Product>;
}): MonthlyFinancialSummary {
  const { year, month, orders, productsMap } = params;
  const settings = normalizeCostCalculatorSettings(params.settings);
  const isVatActive = settings.vatMode === "VAT_ACTIVE";
  const defaultVatRate = settings.defaultVatRate || 23;

  const monthNames = [
    "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
    "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
  ];
  const monthLabel = `${monthNames[month - 1]} ${year}`;
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  // Filtrujemy zamówienia z danego miesiąca, wykluczając zamówienia sandbox (isTest === true)
  const monthOrders = orders.filter((o) => {
    if (o.isTest) return false;
    const d = new Date(o.createdAt);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  // Tylko opłacone lub zrealizowane generują realny przychód i koszt towaru
  const paidOrders = monthOrders.filter(
    (o) => o.paymentStatus === "PAID" || o.paymentStatus === "PARTIALLY_PAID" || o.fulfillmentStatus === "SHIPPED" || o.fulfillmentStatus === "DELIVERED"
  );

  let grossSalesRevenue = 0;
  let grossShippingRevenue = 0;
  let totalCogs = 0;
  let totalActualShippingPaid = 0;
  let totalPackagingCost = 0;
  let totalPaymentFees = 0;
  let totalFreebiesCost = 0;
  let totalHandlingLaborCost = 0;
  let totalOtherOrderCosts = 0;

  const calculatedOrders: OrderMarginCalculation[] = [];

  for (const o of paidOrders) {
    const calc = calculateOrderMargin(o, settings, productsMap);
    calculatedOrders.push(calc);

    grossSalesRevenue += calc.productsRevenueGross;
    grossShippingRevenue += calc.shippingRevenueGross;
    totalCogs += calc.totalCogs;
    totalActualShippingPaid += calc.actualShippingCost;
    totalPackagingCost += calc.packagingCost;
    totalPaymentFees += calc.paymentFee;
    totalFreebiesCost += calc.freebiesCost;
    totalHandlingLaborCost += calc.handlingLaborCost;
    totalOtherOrderCosts += calc.extraCustomCosts.reduce((a, b) => a + b.amount, 0);
  }

  grossSalesRevenue = Number(grossSalesRevenue.toFixed(2));
  grossShippingRevenue = Number(grossShippingRevenue.toFixed(2));
  totalCogs = Number(totalCogs.toFixed(2));
  totalActualShippingPaid = Number(totalActualShippingPaid.toFixed(2));
  totalPackagingCost = Number(totalPackagingCost.toFixed(2));
  totalPaymentFees = Number(totalPaymentFees.toFixed(2));
  totalFreebiesCost = Number(totalFreebiesCost.toFixed(2));
  totalHandlingLaborCost = Number(totalHandlingLaborCost.toFixed(2));
  totalOtherOrderCosts = Number(totalOtherOrderCosts.toFixed(2));

  const netSalesRevenue = grossToNet(grossSalesRevenue, defaultVatRate);
  const netShippingRevenue = grossToNet(grossShippingRevenue, defaultVatRate);
  const totalRevenue = isVatActive ? Number((netSalesRevenue + netShippingRevenue).toFixed(2)) : Number((grossSalesRevenue + grossShippingRevenue).toFixed(2));

  // Zysk handlowy
  const effectiveProductSales = isVatActive ? netSalesRevenue : grossSalesRevenue;
  const tradeProfit = Number((effectiveProductSales - totalCogs).toFixed(2));
  const tradeMarginPercent = effectiveProductSales > 0 ? Number(((tradeProfit / effectiveProductSales) * 100).toFixed(2)) : 0;
  const averageMarkupPercent = totalCogs > 0 ? Number(((tradeProfit / totalCogs) * 100).toFixed(2)) : 0;

  // Koszty bezpośrednie
  const totalDirectCosts = Number(
    (
      totalActualShippingPaid +
      totalPackagingCost +
      totalPaymentFees +
      totalFreebiesCost +
      totalHandlingLaborCost +
      totalOtherOrderCosts
    ).toFixed(2)
  );

  const shippingBalance = Number((grossShippingRevenue - totalActualShippingPaid).toFixed(2));
  const amountAfterDirectCosts = Number((totalRevenue - totalCogs - totalDirectCosts).toFixed(2));

  // Koszty stałe / globalne w danym miesiącu
  let totalMonthlyAllocatedOverhead = 0;
  let totalActualCashOutlayOverhead = 0;

  const fixedCostsBreakdown = settings.fixedCosts
    .filter((fc) => fc.isActive)
    .map((fc) => {
      const share = (fc.onlineSharePercentage || 100) / 100;
      const netAmt = isVatActive && fc.isVatDeductible ? grossToNet(fc.amount, fc.vatRate || 23) : fc.amount;
      const shareAmt = netAmt * share;

      let monthlyAllocated = 0;
      let actualCashOutlay = 0;

      if (fc.frequency === "MONTHLY") {
        monthlyAllocated = Number(shareAmt.toFixed(2));
        actualCashOutlay = Number((fc.amount * share).toFixed(2));
      } else if (fc.frequency === "ANNUAL") {
        // Koszt roczny rozkładany w kalkulacji miesięcznej na 12 miesięcy,
        // ale faktyczny wydatek pokazywany osobno
        monthlyAllocated = Number((shareAmt / 12).toFixed(2));
        // Jeśli dany koszt roczny wypada w tym konkretnym miesiącu (np. odnowienie w listopadzie)
        actualCashOutlay = fc.applicableMonth === monthKey ? Number((fc.amount * share).toFixed(2)) : 0;
      } else if (fc.frequency === "ONE_OFF") {
        if (fc.applicableMonth === monthKey) {
          monthlyAllocated = Number(shareAmt.toFixed(2));
          actualCashOutlay = Number((fc.amount * share).toFixed(2));
        }
      }

      totalMonthlyAllocatedOverhead += monthlyAllocated;
      totalActualCashOutlayOverhead += actualCashOutlay;

      return {
        id: fc.id,
        name: fc.name,
        category: fc.category,
        nominalAmount: fc.amount,
        monthlyAllocatedAmount: monthlyAllocated,
        actualCashOutlay,
        frequency: fc.frequency,
        onlineShare: fc.onlineSharePercentage,
      };
    });

  totalMonthlyAllocatedOverhead = Number(totalMonthlyAllocatedOverhead.toFixed(2));
  totalActualCashOutlayOverhead = Number(totalActualCashOutlayOverhead.toFixed(2));

  // Wynik operacyjny przed podatkiem dochodowym
  const operatingResultBeforeTax = Number((amountAfterDirectCosts - totalMonthlyAllocatedOverhead).toFixed(2));
  const operatingMarginPercent = totalRevenue > 0 ? Number(((operatingResultBeforeTax / totalRevenue) * 100).toFixed(2)) : 0;
  const isLoss = operatingResultBeforeTax < 0;

  // Zakupy magazynowe (POKAZYWANE OSOBNO jako wydatek gotówkowy i aktywo magazynu)
  const inventoryPurchases = (settings.inventoryPurchases || []).filter((ip) => {
    return ip.date.startsWith(monthKey);
  });
  const inventoryPurchasesOutlay = inventoryPurchases.reduce((acc, ip) => acc + Number(ip.amount || 0), 0);

  // Zwroty w danym miesiącu
  const refundedOrders = monthOrders.filter((o) => o.paymentStatus === "REFUNDED" || o.paymentStatus === "PARTIALLY_REFUNDED");
  const totalRefundsAmount = refundedOrders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);

  return {
    year,
    month,
    monthLabel,
    totalOrdersCount: monthOrders.length,
    paidOrdersCount: paidOrders.length,
    grossSalesRevenue,
    netSalesRevenue,
    grossShippingRevenue,
    netShippingRevenue,
    totalRevenue,
    totalCogs,
    tradeProfit,
    tradeMarginPercent,
    averageMarkupPercent,
    totalActualShippingPaid,
    shippingBalance,
    totalPackagingCost,
    totalPaymentFees,
    totalFreebiesCost,
    totalHandlingLaborCost,
    totalOtherOrderCosts,
    totalDirectCosts,
    amountAfterDirectCosts,
    fixedCostsBreakdown,
    totalMonthlyAllocatedOverhead,
    totalActualCashOutlayOverhead,
    operatingResultBeforeTax,
    operatingMarginPercent,
    isLoss,
    inventoryPurchasesOutlay,
    inventoryPurchasesList: inventoryPurchases,
    totalRefundsAmount,
    refundedOrdersCount: refundedOrders.length,
    ordersList: calculatedOrders,
  };
}
