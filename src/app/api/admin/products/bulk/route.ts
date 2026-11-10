import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { bulkUpdateProducts, bulkDeleteProducts } from "@/lib/store-data";

export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  try {
    const { ids, updates, action } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Wymagana jest lista identyfikatorów produktów (ids)." },
        { status: 400 }
      );
    }

    if (action === "delete") {
      const deletedCount = await bulkDeleteProducts(ids);
      return NextResponse.json({ success: true, deletedCount });
    }

    let finalUpdates = updates || {};
    if (action === "setPromoted") finalUpdates = { isPromoted: true };
    else if (action === "unsetPromoted") finalUpdates = { isPromoted: false };
    else if (action === "setNew") finalUpdates = { isNew: true };
    else if (action === "unsetNew") finalUpdates = { isNew: false };
    else if (action === "setBestseller") finalUpdates = { isBestseller: true };
    else if (action === "unsetBestseller") finalUpdates = { isBestseller: false };
    else if (action === "publish") finalUpdates = { isPublished: true };
    else if (action === "unpublish") finalUpdates = { isPublished: false };

    const updated = await bulkUpdateProducts(ids, finalUpdates);

    return NextResponse.json({
      success: true,
      updatedCount: updated.length,
      products: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const PATCH = POST;
