import { NextRequest, NextResponse } from "next/server";
import {
  getAllReferralParticipants,
  getAllReferralRewardCodes,
  getAllProductReviews,
  getAllIndividualDiscounts,
  loadLocalStore,
} from "@/lib/store-data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Wymagany parametr email." }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();
    const participants = await getAllReferralParticipants();
    const participant = participants.find((p) => p.email.trim().toLowerCase() === normalized);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://auraboutique.pl";
    const referralLink = participant
      ? `${baseUrl}/katalog?polecenie=${encodeURIComponent(participant.referralCode)}`
      : undefined;

    const allRewards = await getAllReferralRewardCodes();
    const myReferralRewards = allRewards.filter(
      (r) => r.referrerEmail.trim().toLowerCase() === normalized
    );

    // Kody za opinie
    const allReviews = await getAllProductReviews();
    const myReviewRewards = allReviews
      .filter((r) => r.customerEmail.trim().toLowerCase() === normalized && r.rewardCodeIssued)
      .map((r) => ({
        code: r.rewardCodeIssued!,
        discountPercent: r.rewardPercentIssued || 2,
        validUntil: r.rewardCodeValidUntil!,
        isUsed: r.rewardCodeUsed || false,
        productName: r.displayName,
        createdAt: r.createdAt,
      }));

    // Indywidualny rabat
    const allInd = await getAllIndividualDiscounts();
    const myIndividualDiscount = allInd.find(
      (d) => d.email.trim().toLowerCase() === normalized && d.isActive
    );

    // Historia zamówień klientki do wystawienia opinii
    const store = loadLocalStore();
    const myDeliveredOrders = (store.orders || []).filter(
      (o) => o.customerEmail.trim().toLowerCase() === normalized && o.fulfillmentStatus === "DELIVERED"
    );

    return NextResponse.json({
      participant,
      referralLink,
      referralRewards: myReferralRewards,
      reviewRewards: myReviewRewards,
      individualDiscount: myIndividualDiscount,
      deliveredOrders: myDeliveredOrders,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

