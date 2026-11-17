import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { loadLocalStore, saveLocalStore } from "@/lib/store-data";
import { IndividualCustomerDiscount } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { discountPercentage, note } = await req.json();

    const store = loadLocalStore();
    const customer = (store.customers || []).find((c) => c.id === id || c.email.toLowerCase() === id.toLowerCase());

    if (!customer) {
      return NextResponse.json({ error: "Nie znaleziono klientki." }, { status: 404 });
    }

    if (!store.individualDiscounts) {
      store.individualDiscounts = [];
    }

    const emailNorm = customer.email.toLowerCase();
    const existingIdx = store.individualDiscounts.findIndex(
      (d) => d.email.toLowerCase() === emailNorm
    );

    const percent = Number(discountPercentage);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      return NextResponse.json({ error: "Podaj prawidłową wartość rabatu (0-100%)." }, { status: 400 });
    }

    if (percent === 0) {
      // Usunięcie rabatu
      if (existingIdx > -1) {
        store.individualDiscounts.splice(existingIdx, 1);
      }
    } else {
      const existing = existingIdx > -1 ? store.individualDiscounts[existingIdx] : null;
      const discountObj: IndividualCustomerDiscount = {
        id: existing ? existing.id : `ind-${Date.now()}`,
        email: customer.email.toLowerCase().trim(),
        discountPercent: percent,
        scope: "ALL",
        isIndefinite: true,
        isActive: true,
        adminNote: note?.trim() || "Indywidualny rabat stałej klientki",
        isEmailVerified: true,
        createdAt: existing ? existing.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingIdx > -1) {
        store.individualDiscounts[existingIdx] = discountObj;
      } else {
        store.individualDiscounts.push(discountObj);
      }
    }

    saveLocalStore(store);

    return NextResponse.json({
      success: true,
      message: percent === 0 ? "Usunięto rabat indywidualny." : `Ustawiono ${percent}% rabatu dla ${customer.email}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
