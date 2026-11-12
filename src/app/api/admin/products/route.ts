import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { saveProduct, deleteProduct, getProductById, getProductBySlug, getProducts } from "@/lib/store-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) {
      let product = await getProductById(id);
      if (!product) {
        product = await getProductBySlug(id);
      }
      if (!product) {
        return NextResponse.json(
          { error: `Produkt o ID "${id}" nie istnieje w bazie danych.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, product });
    }

    const products = await getProducts({ includeArchived: true });
    return NextResponse.json({ success: true, products });
  } catch (err: any) {
    console.error("Błąd pobierania produktów:", err);
    return NextResponse.json({ error: err.message || "Błąd serwera bazy danych." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  try {
    const productData = await req.json();

    if (!productData.name || !productData.basePrice) {
      return NextResponse.json(
        { error: "Nazwa produktu oraz cena bazowa są wymagane." },
        { status: 400 }
      );
    }

    const saved = await saveProduct(productData);
    return NextResponse.json({ success: true, product: saved });
  } catch (err: any) {
    console.error("Błąd zapisu produktu:", err);
    return NextResponse.json(
      { error: err.message || "Błąd podczas zapisu produktu." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Wymagane ID produktu." }, { status: 400 });
    }

    const ok = await deleteProduct(id);
    if (!ok) {
      return NextResponse.json({ error: "Nie znaleziono produktu." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
