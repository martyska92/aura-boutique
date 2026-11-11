import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/store-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("categorySlug") || undefined;
    const isPromotedOnly = searchParams.get("isPromoted") === "true";
    const isNewOnly = searchParams.get("isNew") === "true";
    const isBestsellerOnly = searchParams.get("isBestseller") === "true";

    const products = await getProducts({
      categorySlug,
      isPromotedOnly,
      isNewOnly,
      isBestsellerOnly,
      includeArchived: false,
    });

    return NextResponse.json({ success: true, products });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

