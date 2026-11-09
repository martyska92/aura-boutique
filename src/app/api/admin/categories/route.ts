import { NextRequest, NextResponse } from "next/server";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/store-data";

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
    const { name, description, imageUrl } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nazwa kategorii jest wymagana" }, { status: 400 });
    }

    const newCategory = await createCategory({
      name: name.trim(),
      description: description?.trim() || "",
      imageUrl: imageUrl?.trim() || "",
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, imageUrl, isActive, orderIndex } = body;

    if (!id) {
      return NextResponse.json({ error: "ID kategorii jest wymagane" }, { status: 400 });
    }

    const updated = await updateCategory(id, {
      name,
      description,
      imageUrl,
      isActive,
      orderIndex,
    });

    if (!updated) {
      return NextResponse.json({ error: "Nie znaleziono kategorii" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      category: updated,
    });
  } catch (error) {
    console.error("Błąd aktualizacji kategorii:", error);
    return NextResponse.json({ error: "Wystąpił błąd podczas aktualizacji kategorii" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID kategorii jest wymagane" }, { status: 400 });
    }

    const deleted = await deleteCategory(id);
    if (!deleted) {
      return NextResponse.json({ error: "Nie znaleziono kategorii lub błąd usuwania" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Błąd usuwania kategorii:", error);
    return NextResponse.json({ error: "Wystąpił błąd podczas usuwania kategorii" }, { status: 500 });
  }
}
