import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/admin-auth";
import { loadLocalStore, saveLocalStore, getCustomerByEmail } from "@/lib/store-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getUserSession();
    if (!session || !session.email) {
      return NextResponse.json({ wishlist: [] });
    }

    const customer = await getCustomerByEmail(session.email);
    return NextResponse.json({
      wishlist: customer?.wishlistProductIds || [],
    });
  } catch (err: any) {
    return NextResponse.json({ wishlist: [], error: err.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session || !session.email) {
      // Jeśli gość, nic nie zapisujemy w bazie (gość trzyma w localStorage)
      return NextResponse.json({ success: true, guest: true });
    }

    const body = await req.json();
    const wishlist = Array.isArray(body.wishlist) ? body.wishlist : [];

    const store = loadLocalStore();
    const customer = (store.customers || []).find(
      (c) => c.email.toLowerCase().trim() === session.email.toLowerCase().trim()
    );

    if (customer) {
      customer.wishlistProductIds = wishlist;
      saveLocalStore(store);
    }

    return NextResponse.json({ success: true, wishlist });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
