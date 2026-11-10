import { NextRequest, NextResponse } from "next/server";
import { getProductReviews, createProductReview, getAllProductReviews } from "@/lib/store-data";
import { sendReviewRewardEmail } from "@/lib/email-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      const allReviews = await getAllProductReviews();
      return NextResponse.json({ reviews: allReviews });
    }

    const reviews = await getProductReviews(productId);
    const totalCount = reviews.length;
    const averageRating =
      totalCount > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount) * 10) / 10
        : 0;

    return NextResponse.json({
      reviews,
      totalCount,
      averageRating,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productId,
      orderNumber,
      customerEmail,
      displayName,
      rating,
      content,
      photoUrl,
    } = body;

    if (!productId || !customerEmail || !content) {
      return NextResponse.json(
        { error: "Podaj swój adres e-mail oraz treść opinii o produkcie." },
        { status: 400 }
      );
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { error: "Ocena musi wynosić od 1 do 5 gwiazdek." },
        { status: 400 }
      );
    }

    const result = await createProductReview({
      productId,
      orderNumber,
      customerEmail,
      displayName: displayName || "Klientka AURA",
      rating: ratingNum,
      content,
      photoUrl,
    });

    // Wysłanie e-maila z kodem rabatowym
    if (result.rewardCode && result.rewardPercent) {
      await sendReviewRewardEmail({
        customerEmail: result.review.customerEmail,
        displayName: result.review.displayName,
        rewardCode: result.rewardCode,
        discountPercent: result.rewardPercent,
        validUntilIso: result.review.rewardCodeValidUntil!,
      });
    }

    return NextResponse.json({
      success: true,
      review: result.review,
      rewardCode: result.rewardCode,
      rewardPercent: result.rewardPercent,
      validUntil: result.review.rewardCodeValidUntil,
      message: `Dziękujemy za opinię! Otrzymujesz jednorazowy kod rabatowy –${result.rewardPercent}% ważny przez 30 dni: ${result.rewardCode}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

