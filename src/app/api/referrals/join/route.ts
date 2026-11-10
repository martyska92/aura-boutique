import { NextRequest, NextResponse } from "next/server";
import { getOrCreateReferralParticipant, getAllReferralRewardCodes } from "@/lib/store-data";
import { sendReferralJoinedEmail } from "@/lib/email-service";

export async function POST(req: NextRequest) {
  try {
    const { email, customerName } = await req.json();

    if (!email || !email.trim() || !email.includes("@")) {
      return NextResponse.json(
        { error: "Podaj prawidłowy adres e-mail." },
        { status: 400 }
      );
    }

    if (!customerName || !customerName.trim()) {
      return NextResponse.json(
        { error: "Podaj swoje imię." },
        { status: 400 }
      );
    }

    const participant = await getOrCreateReferralParticipant(email, customerName);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://auraboutique.pl";
    const referralLink = `${baseUrl}/katalog?polecenie=${encodeURIComponent(participant.referralCode)}`;

    // Próba wysyłki wiadomości e-mail z kodem i linkiem
    await sendReferralJoinedEmail({
      customerEmail: participant.email,
      customerName: participant.customerName,
      referralCode: participant.referralCode,
      referralLink,
    });

    const allRewardCodes = await getAllReferralRewardCodes();
    const myRewards = allRewardCodes.filter(
      (rc) => rc.referrerEmail.trim().toLowerCase() === participant.email.trim().toLowerCase()
    );

    return NextResponse.json({
      success: true,
      participant,
      referralLink,
      rewards: myRewards,
      message: "Dołączono do programu poleceń! Twój unikalny kod i link są już aktywne.",
    });
  } catch (err: any) {
    console.error("Błąd programu poleceń:", err);
    return NextResponse.json(
      { error: err?.message || "Nie udało się dołączyć do programu poleceń." },
      { status: 500 }
    );
  }
}

