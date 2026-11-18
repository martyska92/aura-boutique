import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { getStoreSettings, getAllOrders, getProducts } from "@/lib/store-data";
import { calculateMonthlySummary } from "@/lib/cost-calculator-service";
import { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = parseInt(searchParams.get("year") || now.getFullYear().toString(), 10);
    const month = parseInt(searchParams.get("month") || (now.getMonth() + 1).toString(), 10);

    const storeSettings = await getStoreSettings({ forAdminClient: true });
    const settings = storeSettings.costCalculatorSettings!;
    const allOrders = await getAllOrders();
    const productionOrders = allOrders.filter((o) => !o.isTest);
    const products = await getProducts({ includeArchived: true, forAdmin: true });

    const productsMap = new Map<string, Product>();
    products.forEach((p) => {
      productsMap.set(p.name, p);
      productsMap.set(p.id, p);
    });

    const summary = calculateMonthlySummary({
      year,
      month,
      orders: productionOrders,
      settings,
      productsMap,
    });

    // Budujemy CSV z separatorem średnika (standard dla polskiego Excela) i BOM UTF-8
    const rows: string[] = [];

    rows.push(`"AURA Boutique K.B. - Zestawienie finansowe i marże za ${summary.monthLabel}"`);
    rows.push(`"Wygenerowano:";"${new Date().toLocaleString("pl-PL")}"`);
    rows.push(`"Status VAT:";"${settings.vatMode === "VAT_ACTIVE" ? "Podatniczka VAT czynna" : "Zwolniona z VAT"}"`);
    rows.push(`"Metoda alokacji kosztów stałych:";"${settings.allocationMethod === "EQUAL" ? "Równo na zamówienia" : "Proporcjonalnie do sprzedaży"}"`);
    rows.push("");

    rows.push('"PODSUMOWANIE MIESIĘCZNE"');
    rows.push(`"Liczba zamówień opłaconych:";"${summary.paidOrdersCount}"`);
    rows.push(`"Przychód ze sprzedaży produktów:";"${summary.grossSalesRevenue.toFixed(2).replace(".", ",")} zł"`);
    rows.push(`"Przychód z opłat za dostawy:";"${summary.grossShippingRevenue.toFixed(2).replace(".", ",")} zł"`);
    rows.push(`"Łączny przychód operacyjny:";"${summary.totalRevenue.toFixed(2).replace(".", ",")} zł"`);
    rows.push(`"Koszt zakupionych towarów sprzedanych (COGS):";"${summary.totalCogs.toFixed(2).replace(".", ",")} zł"`);
    rows.push(`"Zysk handlowy na towarze:";"${summary.tradeProfit.toFixed(2).replace(".", ",")} zł"`);
    rows.push(`"Średnia marża towarowa:";"${summary.tradeMarginPercent.toFixed(2).replace(".", ",")}%"`);
    rows.push(`"Średni narzut:";"${summary.averageMarkupPercent.toFixed(2).replace(".", ",")}%"`);
    rows.push(`"Rzeczywisty koszt wysyłek (zapłacony przewoźnikom):";"${summary.totalActualShippingPaid.toFixed(2).replace(".", ",")} zł"`);
    rows.push(`"Bilans dostaw:";"${summary.shippingBalance.toFixed(2).replace(".", ",")} zł"`);
    rows.push(`"Koszty opakowań i materiałów:";"${summary.totalPackagingCost.toFixed(2).replace(".", ",")} zł"`);
    rows.push(`"Prowizje operatorów płatności:";"${summary.totalPaymentFees.toFixed(2).replace(".", ",")} zł"`);
    rows.push(`"Koszty gratisów do zamówień:";"${summary.totalFreebiesCost.toFixed(2).replace(".", ",")} zł"`);
    rows.push(`"Łączne koszty bezpośrednie zamówień:";"${summary.totalDirectCosts.toFixed(2).replace(".", ",")} zł"`);
    rows.push(`"Kwota po kosztach zamówień (Marża pokrycia):";"${summary.amountAfterDirectCosts.toFixed(2).replace(".", ",")} zł"`);
    rows.push(`"Koszty stałe butiku przypisane do miesiąca:";"${summary.totalMonthlyAllocatedOverhead.toFixed(2).replace(".", ",")} zł"`);
    rows.push(`"WYNIK OPERACYJNY PRZED OPODATKOWANIEM:";"${summary.operatingResultBeforeTax.toFixed(2).replace(".", ",")} zł"`);
    rows.push(`"Rentowność operacyjna:";"${summary.operatingMarginPercent.toFixed(2).replace(".", ",")}%"`);
    rows.push("");

    rows.push('"WYDATKI NA ZAPAS MAGAZYNOWY (zakup niesprzedanego towaru w tym miesiącu)"');
    rows.push(`"Łączny wydatek na zakup towaru na magazyn:";"${summary.inventoryPurchasesOutlay.toFixed(2).replace(".", ",")} zł"`);
    rows.push('"Informacja:";"Wydatki magazynowe są aktywem i nie zostały podwójnie odjęte od wyniku operacyjnego"');
    rows.push("");

    rows.push('"SZCZEGÓŁOWA LISTA ZAMÓWIEŃ"');
    rows.push(
      [
        '"Numer zamówienia"',
        '"Data złożenia"',
        '"Status płatności"',
        '"Metoda płatności"',
        '"Wartość produktów brutto"',
        '"Dostawa klientka"',
        '"Koszt towaru COGS"',
        '"Marża towarowa %"',
        '"Narzut %"',
        '"Koszt wysyłki butiku"',
        '"Opakowanie"',
        '"Prowizja bramki"',
        '"Koszty bezpośrednie"',
        '"Kwota po kosztach zamówienia"',
        '"Przypisane koszty stałe"',
        '"Wynik operacyjny"',
      ].join(";")
    );

    for (const ord of summary.ordersList) {
      rows.push(
        [
          `"${ord.orderNumber}"`,
          `"${new Date(ord.createdAt).toLocaleDateString("pl-PL")}"`,
          `"${ord.paymentStatus}"`,
          `"${ord.paymentMethod}"`,
          `"${ord.productsRevenueGross.toFixed(2).replace(".", ",")}"`,
          `"${ord.shippingRevenueGross.toFixed(2).replace(".", ",")}"`,
          `"${ord.totalCogs.toFixed(2).replace(".", ",")}"`,
          `"${ord.tradeMarginPercent.toFixed(1).replace(".", ",")}%"`,
          `"${ord.markupPercent.toFixed(1).replace(".", ",")}%"`,
          `"${ord.actualShippingCost.toFixed(2).replace(".", ",")}"`,
          `"${ord.packagingCost.toFixed(2).replace(".", ",")}"`,
          `"${ord.paymentFee.toFixed(2).replace(".", ",")}"`,
          `"${ord.totalDirectCosts.toFixed(2).replace(".", ",")}"`,
          `"${ord.amountAfterDirectCosts.toFixed(2).replace(".", ",")}"`,
          `"${ord.allocatedOverheadCost.toFixed(2).replace(".", ",")}"`,
          `"${ord.operatingResult.toFixed(2).replace(".", ",")}"`,
        ].join(";")
      );
    }

    const csvContent = "\uFEFF" + rows.join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="AURA_Rozliczenie_Marze_${year}_${String(month).padStart(2, "0")}.csv"`,
      },
    });
  } catch (err: any) {
    console.error("Błąd eksportu CSV:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
