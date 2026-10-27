import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { clearAllDemoData, resetDemoData } from "@/lib/store-data";

export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  try {
    const { action } = await req.json();

    if (action === "reset") {
      await resetDemoData();
      return NextResponse.json({ success: true, message: "Dane demonstracyjne zostały przywrócone." });
    }

    // Domyślnie: usuń dane demo
    const result = await clearAllDemoData();
    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Usunięto ${result.deletedCount} demonstracyjnych produktów. Sklep jest gotowy na wprowadzenie Twoich ubrań!`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
