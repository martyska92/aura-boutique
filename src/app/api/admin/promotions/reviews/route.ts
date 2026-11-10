import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { toggleReviewVisibility } from "@/lib/store-data";

export async function PATCH(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  try {
    const { reviewId, isHidden, hiddenReason } = await req.json();

    if (!reviewId) {
      return NextResponse.json({ error: "Wymagane ID opinii." }, { status: 400 });
    }

    const updated = await toggleReviewVisibility(reviewId, Boolean(isHidden), hiddenReason);
    return NextResponse.json({ success: true, review: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

