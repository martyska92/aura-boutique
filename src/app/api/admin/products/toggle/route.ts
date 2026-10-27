import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { getProductById, saveProduct } from "@/lib/store-data";

export async function PATCH(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  try {
    const { id, field, value } = await req.json();
    if (!id || !field) {
      return NextResponse.json({ error: "Wymagane id oraz pole." }, { status: 400 });
    }

    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json({ error: "Nie znaleziono produktu." }, { status: 404 });
    }

    const updated = await saveProduct({
      ...product,
      [field]: value,
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
