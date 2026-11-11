import { NextResponse } from "next/server";
import { getCategories } from "@/lib/store-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({
      success: true,
      categories: categories.filter((c) => c.isActive).sort((a, b) => a.orderIndex - b.orderIndex),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Błąd pobierania kategorii" }, { status: 500 });
  }
}

