import { NextRequest, NextResponse } from "next/server";
import { upgradeReviewWithPhoto } from "@/lib/store-data";

export async function POST(req: NextRequest) {
  try {
    const { reviewId, photoUrl } = await req.json();

    if (!reviewId || !photoUrl) {
      return NextResponse.json(
        { error: "Wymagane ID opinii oraz adres zdjęcia." },
        { status: 400 }
      );
    }

    const result = await upgradeReviewWithPhoto(reviewId, photoUrl);

    return NextResponse.json({
      success: true,
      newRewardCode: result.newRewardCode,
      message: result.newRewardCode
        ? `Dodano zdjęcie do opinii! Twój kod został zaktualizowany do –5%: ${result.newRewardCode}`
        : "Zdjęcie zostało pomyślnie dodane do Twojej opinii.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

