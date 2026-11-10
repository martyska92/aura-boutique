import { NextRequest, NextResponse } from "next/server";
import {
  getOrCreateReferralParticipant,
  getAllReferralRewardCodes,
  getAllProductReviews,
  getAllIndividualDiscounts,
  loadLocalStore,
  migrateAllReferralCodes,
} from "@/lib/store-data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Wymagany parametr email." }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();

    // Uruchomienie migracji kodów jeśli jakieś konto nie miało unikalnego kodu
    migrateAllReferralCodes();

    // Pobranie lub utworzenie trwałego unikalnego kodu dla tej klientki
    const participant = await getOrCreateReferralParticipant(normalized);

    // Wyznaczenie adresu bazowego sklepu z żądania
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "aura-boutique-w38e.vercel.app";
    const baseUrl = `${proto}://${host}`;

    // Link polecający wskazujący na stronę główną z parametrem ?ref=
    const referralLink = `${baseUrl}/?ref=${encodeURIComponent(participant.referralCode)}`;

    // Nagrody 15% polecającej za zrealizowane zamówienia koleżanek
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
      success: true,
      participant,
      referralCode: participant.referralCode,
      referralLink,
      rewards: myReferralRewards,
      referralRewards: myReferralRewards,
      reviewRewards: myReviewRewards,
      individualDiscount: myIndividualDiscount,
      deliveredOrders: myDeliveredOrders,
    });
  } catch (err: any) {
    console.error("Błąd api/referrals/me:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
