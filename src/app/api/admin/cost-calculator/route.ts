import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import {
  getStoreSettings,
  updateStoreSettings,
  getAllOrders,
  getProducts,
} from "@/lib/store-data";
import { CostCalculatorSettings } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  try {
    const settings = await getStoreSettings({ forAdminClient: true });
    const allOrders = await getAllOrders();
    // Filtrujemy tylko rzeczywiste zamówienia (testowe sandbox są wykluczone z rozliczeń)
    const productionOrders = allOrders.filter((o) => !o.isTest);
    const products = await getProducts({ includeArchived: true, forAdmin: true });

    return NextResponse.json({
      success: true,
      settings: settings.costCalculatorSettings,
      orders: productionOrders,
      products,
    });
  } catch (err: any) {
    console.error("Błąd pobierania danych kalkulatora kosztów:", err);
    return NextResponse.json(
      { error: err.message || "Błąd serwera podczas odczytu danych kalkulatora." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const newSettings: CostCalculatorSettings = body.settings;

    if (!newSettings) {
      return NextResponse.json({ error: "Brak obiektu settings w żądaniu." }, { status: 400 });
    }

    const updated = await updateStoreSettings({
      costCalculatorSettings: newSettings,
    });

    return NextResponse.json({
      success: true,
      message: "Ustawienia kalkulatora kosztów i marż zostały pomyślnie zapisane w bazie danych.",
      settings: updated.costCalculatorSettings,
    });
  } catch (err: any) {
    console.error("Błąd zapisu ustawień kalkulatora:", err);
    return NextResponse.json(
      { error: err.message || "Błąd serwera podczas zapisu konfiguracji." },
      { status: 500 }
    );
  }
}
