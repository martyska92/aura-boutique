import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { loadLocalStore, saveLocalStore, addPromotionAuditLog } from "@/lib/store-data";

export async function POST(req: NextRequest) {
  return handleRevokeOrUnflag(req);
}

export async function PATCH(req: NextRequest) {
  return handleRevokeOrUnflag(req);
}

async function handleRevokeOrUnflag(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  try {
    const { codeId, action = "revoke", reason } = await req.json();

    if (!codeId) {
      return NextResponse.json({ error: "Wymagane ID kodu nagrody." }, { status: 400 });
    }

    const store = loadLocalStore();
    const reward = store.referralRewardCodes?.find((r) => r.id === codeId);
    if (!reward) {
      return NextResponse.json({ error: "Nie znaleziono kodu nagrody." }, { status: 404 });
    }

    if (action === "revoke") {
      reward.isRevoked = true;
      reward.revokedReason = reason || "Unieważniony ręcznie przez administratora";
      await addPromotionAuditLog(
        `Unieważniono kod nagrody: ${reward.code}`,
        reward.revokedReason || "Brak powodu"
      );
    } else if (action === "unflag") {
      reward.adminFlagged = false;
    }

    saveLocalStore(store);
    return NextResponse.json({ success: true, rewardCode: reward });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
