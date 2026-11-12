import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isNeonConfigured, isDatabaseConnected, loadLocalStore } from "@/lib/store-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = isNeonConfigured();
  if (!configured) {
    return NextResponse.json({
      configured: false,
      connected: false,
      message: "Baza danych Neon nie jest jeszcze skonfigurowana w zmiennych środowiskowych.",
    });
  }

  try {
    const isConnected = await isDatabaseConnected();
    if (!isConnected) {
      return NextResponse.json({
        configured: true,
        connected: false,
        message: "Zmienne bazy są obecne, ale połączenie z Neon nie powiodło się (sprawdź uprawnienia lub host).",
      });
    }

    // Sprawdź stan tabel i liczbę rekordów
    let productCount = 0;
    let categoryCount = 0;

    try {
      productCount = await prisma.product.count();
      categoryCount = await prisma.category.count();

      // Jeśli baza jest świeżo utworzona i nie ma jeszcze kategorii, zsynchronizuj bazowe kategorie z magazynu
      if (categoryCount === 0) {
        const store = loadLocalStore();
        for (const cat of store.categories) {
          await prisma.category.upsert({
            where: { id: cat.id },
            update: {
              name: cat.name,
              slug: cat.slug,
              description: cat.description || null,
              imageUrl: cat.imageUrl || null,
              orderIndex: cat.orderIndex,
              isActive: cat.isActive !== undefined ? Boolean(cat.isActive) : true,
            },
            create: {
              id: cat.id,
              name: cat.name,
              slug: cat.slug,
              description: cat.description || null,
              imageUrl: cat.imageUrl || null,
              orderIndex: cat.orderIndex,
              isActive: cat.isActive !== undefined ? Boolean(cat.isActive) : true,
            },
          });
        }
        categoryCount = await prisma.category.count();
      }
    } catch (e: any) {
      return NextResponse.json({
        configured: true,
        connected: true,
        tablesInitialized: false,
        error: e.message || "Tabele w bazie nie zostały jeszcze zainicjowane.",
      });
    }

    return NextResponse.json({
      configured: true,
      connected: true,
      tablesInitialized: true,
      counts: {
        products: productCount,
        categories: categoryCount,
      },
      message: "Połączenie z bazą Neon jest w pełni aktywne i zweryfikowane.",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        configured: true,
        connected: false,
        error: err.message || "Błąd zapytania do bazy danych.",
      },
      { status: 500 }
    );
  }
}
