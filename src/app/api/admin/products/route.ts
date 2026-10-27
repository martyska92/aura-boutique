import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { saveProduct, deleteProduct, getProductById } from "@/lib/store-data";

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
