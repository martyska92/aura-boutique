import { NextRequest, NextResponse } from "next/server";
import { getCategories, createCategory } from "@/lib/store-data";

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Błąd pobierania kategorii:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nazwa kategorii jest wymagana" }, { status: 400 });
    }

    const newCategory = await createCategory({
      name: name.trim(),
      description: description?.trim() || "",
    });

    return NextResponse.json({
      success: true,
      category: newCategory,
    });
  } catch (error) {
    console.error("Błąd tworzenia kategorii:", error);
    return NextResponse.json({ error: "Wystąpił błąd podczas dodawania kategorii" }, { status: 500 });
  }
}
